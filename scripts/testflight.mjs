// Reparte en TestFlight la build que acaba de subir el workflow de iOS: espera a que App Store
// Connect la procese, le pone el "qué probar", la añade al grupo externo "Public" (el enlace
// público) y la manda a la revisión beta de Apple si hace falta. Sin esto, los probadores
// externos se quedan en la última build aprobada.
//   ASC_KEY_P8=… ASC_KEY_ID=… ASC_ISSUER_ID=… BUILD_NUMBER=16 WHATS_NEW='…' node scripts/testflight.mjs
// Se puede repetir sin miedo: si la build ya está en el grupo, en revisión o aprobada, no hace nada.
import { sign } from 'node:crypto';

const API = 'https://api.appstoreconnect.apple.com';
const APP_ID = '6822793042';
const GROUP = 'Public';
const WAIT = 60 * 60_000; // Apple suele procesar en 5-15 min, pero a veces tarda mucho más
const POLL = 30_000;

const { ASC_KEY_P8, ASC_KEY_ID, ASC_ISSUER_ID, BUILD_NUMBER, WHATS_NEW = '' } = process.env;
if (!ASC_KEY_P8 || !ASC_KEY_ID || !ASC_ISSUER_ID || !BUILD_NUMBER) {
  console.error('Faltan ASC_KEY_P8, ASC_KEY_ID, ASC_ISSUER_ID o BUILD_NUMBER');
  process.exit(1);
}

const start = Date.now();
const deadline = start + WAIT;
const minutes = () => Math.round((Date.now() - start) / 60_000);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b64url = (data) => Buffer.from(data).toString('base64url');
const query = (params) => '?' + new URLSearchParams(params);
const errors = (json) => (json.errors ?? []).map((e) => `${e.title}: ${e.detail}`).join('; ');

// JWT ES256 de la API de App Store Connect. Caduca a los 20 minutos (lo máximo que admite Apple),
// así que se firma uno nuevo en cada petición.
function token() {
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: 'ES256', kid: ASC_KEY_ID, typ: 'JWT' }));
  const claims = b64url(JSON.stringify({ iss: ASC_ISSUER_ID, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' }));
  // JWT quiere la firma como r||s (64 bytes), no en DER, que es lo que da node por defecto.
  const sig = sign('sha256', Buffer.from(`${head}.${claims}`), { key: ASC_KEY_P8, dsaEncoding: 'ieee-p1363' });
  return `${head}.${claims}.${b64url(sig)}`;
}

// Llama a la API y devuelve { status, json }. Reintenta los fallos pasajeros (red, 429, 5xx) y
// lanza el error de Apple en el resto, salvo con los códigos de `allow`.
async function asc(method, path, body, allow = []) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(API + path, {
      method,
      headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
      body: body && JSON.stringify(body),
    }).catch((e) => ({ status: 0, error: e }));
    if ((res.status === 0 || res.status === 429 || res.status >= 500) && attempt < 4) {
      await sleep(5000 * attempt);
      continue;
    }
    if (res.error) throw res.error;
    const text = await res.text();
    let json = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = { errors: [{ title: res.statusText, detail: text.slice(0, 300) }] };
    }
    if (!res.ok && !allow.includes(res.status)) throw new Error(`${method} ${path} → ${res.status} ${errors(json)}`);
    return { status: res.status, json };
  }
}

// La build aparece en la API unos minutos después de subirla y luego pasa de PROCESSING a VALID.
async function processedBuild() {
  let last;
  for (;;) {
    const { json } = await asc('GET', '/v1/builds' + query({
      'filter[app]': APP_ID,
      'filter[version]': BUILD_NUMBER,
      'filter[preReleaseVersion.platform]': 'IOS',
      include: 'preReleaseVersion',
      limit: '1',
    }));
    const build = json.data[0];
    const state = build?.attributes.processingState ?? 'todavía no aparece';
    if (state !== last) console.log(`Build ${BUILD_NUMBER}: ${state} (${minutes()} min)`);
    last = state;
    if (state === 'VALID') return { id: build.id, version: json.included?.[0]?.attributes.version };
    if (state === 'FAILED' || state === 'INVALID') throw new Error(`Apple marcó la build ${BUILD_NUMBER} como ${state}`);
    if (Date.now() > deadline) throw new Error(`La build ${BUILD_NUMBER} sigue en "${state}" tras ${minutes()} min`);
    await sleep(POLL);
  }
}

// "Qué probar" en todos los idiomas que ya tenga la build, o en el principal de la app si no tiene.
async function setWhatsNew(buildId) {
  const whatsNew = WHATS_NEW.trim().slice(0, 4000);
  if (!whatsNew) return;
  const { json } = await asc('GET', `/v1/builds/${buildId}/betaBuildLocalizations`);
  for (const loc of json.data) {
    await asc('PATCH', `/v1/betaBuildLocalizations/${loc.id}`, {
      data: { type: 'betaBuildLocalizations', id: loc.id, attributes: { whatsNew } },
    });
  }
  if (!json.data.length) {
    const app = await asc('GET', `/v1/apps/${APP_ID}` + query({ 'fields[apps]': 'primaryLocale' }));
    await asc('POST', '/v1/betaBuildLocalizations', {
      data: {
        type: 'betaBuildLocalizations',
        attributes: { locale: app.json.data.attributes.primaryLocale, whatsNew },
        relationships: { build: { data: { type: 'builds', id: buildId } } },
      },
    });
  }
  console.log(`Qué probar: ${whatsNew}`);
}

async function addToGroup(buildId) {
  const { json } = await asc('GET', '/v1/betaGroups' + query({ 'filter[app]': APP_ID, 'filter[name]': GROUP }));
  const group = json.data.find((g) => g.attributes.name === GROUP);
  if (!group) throw new Error(`No existe el grupo "${GROUP}" en TestFlight`);
  const body = { data: [{ type: 'builds', id: buildId }] };
  const r = await asc('POST', `/v1/betaGroups/${group.id}/relationships/builds`, body, [409]);
  console.log(r.status === 409 ? `Grupo ${GROUP}: ${errors(r.json)}` : `Añadida al grupo ${GROUP}`);
}

// Estado de la build para los probadores externos; justo después de procesarla puede seguir un
// rato en PROCESSING.
async function externalState(buildId) {
  for (;;) {
    const { json } = await asc('GET', `/v1/builds/${buildId}/buildBetaDetail`);
    const state = json.data.attributes.externalBuildState;
    if (state !== 'PROCESSING' || Date.now() > deadline) return state;
    await sleep(POLL);
  }
}

// Estados en los que no hay que enviar nada.
const DONE = {
  WAITING_FOR_BETA_REVIEW: 'ya está esperando la revisión beta',
  IN_BETA_REVIEW: 'ya está en revisión beta',
  BETA_APPROVED: 'ya está aprobada',
  READY_FOR_BETA_TESTING: 'no necesita revisión',
  IN_BETA_TESTING: 'ya está disponible para los probadores',
};

async function main() {
  const build = await processedBuild();
  console.log(`Build ${BUILD_NUMBER} (${build.version}) procesada en ${minutes()} min`);
  // Sin el "qué probar" la build se reparte igual: que no pare el resto.
  await setWhatsNew(build.id).catch((e) => console.log(`::warning::No se pudo poner el "qué probar": ${e.message}`));
  await addToGroup(build.id);

  const state = await externalState(build.id);
  if (DONE[state]) return console.log(`La build ${BUILD_NUMBER} ${DONE[state]}`);
  if (state !== 'READY_FOR_BETA_SUBMISSION') {
    return console.log(`::warning::La build ${BUILD_NUMBER} está en ${state}: no se envía a la revisión beta`);
  }
  const r = await asc('POST', '/v1/betaAppReviewSubmissions', {
    data: { type: 'betaAppReviewSubmissions', relationships: { build: { data: { type: 'builds', id: build.id } } } },
  }, [409]);
  if (r.status !== 409) return console.log('Enviada a la revisión beta de Apple');
  // Apple no la acepta, p. ej. si ya hay otra build de la app esperando revisión.
  const now = await externalState(build.id);
  console.log(DONE[now]
    ? `La build ${BUILD_NUMBER} ${DONE[now]}`
    : `::warning::Apple no aceptó la revisión beta de la build ${BUILD_NUMBER} (${now}): ${errors(r.json)}`);
}

main().catch((e) => {
  console.error(`::error::${e.message}`);
  process.exit(1);
});
