// Servidor de sincronización para probar en local: un almacén clave → JSON.
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
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
  });
  res.end(body === undefined ? undefined : JSON.stringify(body));
}

createServer((req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204);
  const key = decodeURIComponent((req.url ?? '').replace(/^\/kv\//, ''));
  if (!req.url?.startsWith('/kv/') || !KEY.test(key)) return send(res, 404, { error: 'not found' });
  const short = key.slice(0, 8);

  if (req.method === 'GET') {
    if (expired(key)) delete store[key];
    console.log(`GET    ${short}… ${store[key] ? 'ok' : 'vacío'}`);
    return store[key] ? send(res, 200, store[key].value) : send(res, 404, { error: 'not found' });
  }
  if (req.method === 'DELETE') {
    delete store[key];
    persist();
    console.log(`DELETE ${short}…`);
    return send(res, 204);
  }
  if (req.method === 'PUT') {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) req.destroy();
      else chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        store[key] = { at: Date.now(), value: JSON.parse(Buffer.concat(chunks).toString('utf8')) };
      } catch {
        return send(res, 400, { error: 'invalid json' });
      }
      persist();
      console.log(`PUT    ${short}… ${size} B`);
      send(res, 204);
    });
    return;
  }
  send(res, 405, { error: 'method not allowed' });
}).listen(PORT, '0.0.0.0', () => {
  const ips = Object.values(networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => `http://${i.address}:${PORT}`);
  console.log(`sync-server escuchando en el puerto ${PORT}`);
  console.log(`URL para .env.local (EXPO_PUBLIC_SYNC_URL): ${ips.join('  ·  ') || `http://localhost:${PORT}`}`);
});
