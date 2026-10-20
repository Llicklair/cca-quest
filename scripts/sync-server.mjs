// Servidor de sincronización para probar en local. Imita las funciones RPC de Supabase de
// supabase/sync.sql (kv_get, kv_put, kv_del), así la app usa el mismo código con los dos.
//   npm run sync-server            (puerto 8787; otro con PORT=9000)
// Escucha en toda la red local para que el móvil llegue por Wi-Fi, y guarda los datos en
// .sync-data.json para no perderlos al reiniciarlo.
//
// Cada usuario tiene su canal `c-<32 hex>` con una clave aleatoria que solo conocen sus
// dispositivos; los códigos de vinculación `p-<10 letras>` caducan a los 10 minutos.
// No hay forma de listar claves: sin la clave no se llega a los datos de nadie.
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';

const PORT = Number(process.env.PORT ?? 8787);
const FILE = new URL('../.sync-data.json', import.meta.url);
const MAX_BODY = 1_000_000;
const PAIR_TTL = 10 * 60_000;
const KEY = /^(c-[0-9a-f]{32}|p-[a-z0-9]{10})$/;

let store = {};
try {
  store = JSON.parse(readFileSync(FILE, 'utf8'));
} catch {
  // primera vez: no hay archivo
}
const persist = () => writeFileSync(FILE, JSON.stringify(store));

const expired = (key) => key.startsWith('p-') && store[key] && Date.now() - store[key].at > PAIR_TTL;

function send(res, status, body) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, apikey',
    ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
  });
  res.end(body === undefined ? undefined : JSON.stringify(body));
}

function handle(fn, { key, value }) {
  if (typeof key !== 'string' || !KEY.test(key)) return [400, { message: 'invalid key' }];
  const short = key.slice(0, 8);
  if (fn === 'kv_get') {
    if (expired(key)) delete store[key];
    console.log(`get ${short}… ${store[key] ? 'ok' : 'vacío'}`);
    return [200, store[key] ? store[key].value : null];
  }
  if (fn === 'kv_put') {
    store[key] = { at: Date.now(), value };
    persist();
    console.log(`put ${short}… ${JSON.stringify(value).length} B`);
    return [204];
  }
  delete store[key];
  persist();
  console.log(`del ${short}…`);
  return [204];
}

createServer((req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204);
  const fn = (req.url ?? '').match(/^\/rest\/v1\/rpc\/(kv_get|kv_put|kv_del)$/)?.[1];
  if (req.method !== 'POST' || !fn) return send(res, 404, { message: 'not found' });
  let size = 0;
  const chunks = [];
  req.on('data', (chunk) => {
    size += chunk.length;
    if (size > MAX_BODY) req.destroy();
    else chunks.push(chunk);
  });
  req.on('end', () => {
    let args;
    try {
      args = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      return send(res, 400, { message: 'invalid json' });
    }
    const [status, body] = handle(fn, args ?? {});
    send(res, status, body);
  });
}).listen(PORT, '0.0.0.0', () => {
  const ips = Object.values(networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => `http://${i.address}:${PORT}`);
  console.log(`sync-server escuchando en el puerto ${PORT}`);
  console.log(`URL para .env.local (EXPO_PUBLIC_SYNC_URL): ${ips.join('  ·  ') || `http://localhost:${PORT}`}`);
});
