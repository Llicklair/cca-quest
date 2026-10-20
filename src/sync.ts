// Sincronización móvil ↔ PC, como WhatsApp Web: el PC enseña un código QR, el móvil lo
// escanea y desde entonces los dos comparten un canal en el servidor. Cada usuario tiene
// su propio canal con una clave aleatoria de 128 bits que solo conocen sus dispositivos:
// no hay cuentas y el servidor no permite listar canales.
//
// Servidor: un proyecto gratuito de Supabase con las funciones de supabase/sync.sql. La URL y
// la clave publicable van aquí porque están hechas para ir dentro de apps públicas: los datos los
// protege la tabla con RLS. EXPO_PUBLIC_SYNC_URL y EXPO_PUBLIC_SYNC_KEY las cambian para probar,
// por ejemplo con `npm run sync-server`, que imita esas funciones en local.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { fresh, rollDay, type Progress } from './game.ts';
import { merge, sameShared, shared, type Shared } from './merge.ts';

const SUPABASE_URL = 'https://cthoeurgsdovuwogbnjd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_v-_0vnGNd3Gnki5_bEOmJQ_bkW9yXCD';

// `||` y no `??`: el workflow de la APK pasa la variable vacía cuando no se le da otra.
// Vale con o sin /rest/v1 al final: es como sale copiada a veces del panel de Supabase.
const BASE = (process.env.EXPO_PUBLIC_SYNC_URL || SUPABASE_URL).replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
const KEY = process.env.EXPO_PUBLIC_SYNC_KEY || SUPABASE_KEY;

const LINK_KEY = 'cca-quest:link';
const POLL_MS = 15_000;
const AFTER_CHANGE_MS = 3_000;

// --- Claves ---

// Sin letras que se confundan (i, l, o) para que el código se pueda teclear a mano.
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
export const QR_PREFIX = 'ccaquest:link:';

/** Código de vinculación: corto, vive 10 minutos en el servidor y se borra al usarse. */
export function newPairCode(): string {
  return Array.from(Crypto.getRandomValues(new Uint8Array(10)), (b) => ALPHABET[b % ALPHABET.length]).join('');
}

const newChannel = () => Array.from(Crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');

/** 'abcde-fghjk' para enseñarlo en pantalla. */
export const showCode = (code: string) => `${code.slice(0, 5)}-${code.slice(5)}`;

/** Lee un código escaneado o tecleado: acepta el QR entero, mayúsculas, guiones y espacios. */
export function parseCode(input: string): string | null {
  const raw = input.trim().toLowerCase().replace(QR_PREFIX, '').replace(/[\s-]/g, '');
  return raw.length === 10 && [...raw].every((ch) => ALPHABET.includes(ch)) ? raw : null;
}

// --- Servidor: un almacén clave → JSON detrás de tres funciones RPC ---

async function rpc(fn: 'kv_get' | 'kv_put' | 'kv_del', args: Record<string, unknown>): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8_000);
  try {
    const res = await fetch(`${BASE}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', ...(KEY ? { apikey: KEY } : {}) },
      body: JSON.stringify(args),
    });
    if (!res.ok) throw new Error(`sync ${fn} ${res.status}`);
    if (fn !== 'kv_get') return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } finally {
    clearTimeout(timer);
  }
}

const get = (key: string) => rpc('kv_get', { key });
const put = (key: string, value: unknown) => rpc('kv_put', { key, value });
const del = (key: string) => rpc('kv_del', { key });

/** El PC pregunta si el móvil ya dejó su canal en el código. */
export async function pairedChannel(code: string): Promise<string | null> {
  const got = (await get(`p-${code}`)) as { channel?: string } | null;
  if (!got?.channel) return null;
  del(`p-${code}`).catch(() => {});
  return got.channel;
}

// --- Hook ---

export type SyncStatus = { state: 'idle' } | { state: 'syncing' } | { state: 'ok'; at: Date } | { state: 'error' };

/**
 * Mantiene el progreso al día con el canal vinculado: al arrancar, al volver a la app,
 * cada 15 s y unos segundos después de cada cambio (`schedule`).
 * `current` da el progreso más reciente y `apply` guarda el resultado de juntar.
 */
export function useSync(current: () => Progress | null, apply: (p: Progress) => void, today: () => string) {
  const [channel, setChannel] = useState<string | null | undefined>(undefined); // undefined = cargando
  const [status, setStatus] = useState<SyncStatus>({ state: 'idle' });
  const busy = useRef(false);
  const again = useRef(false);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const linked = useRef<string | null>(null); // el canal de ahora mismo, también dentro de temporizadores y peticiones en vuelo
  // Las funciones de App cambian en cada render: se leen de una ref para no reiniciar los temporizadores.
  const fns = useRef({ current, apply, today });
  useEffect(() => {
    fns.current = { current, apply, today };
  });

  useEffect(() => {
    AsyncStorage.getItem(LINK_KEY)
      .then((v) => {
        linked.current = v;
        setChannel(v);
      })
      .catch(() => setChannel(null));
  }, []);

  /**
   * Baja lo del canal, lo junta con lo local y sube el resultado si cambió algo. Lanza si falla la red.
   * Solo trabaja con el canal vinculado, salvo `joining`, que estrena uno que aún no se ha guardado.
   */
  const exchange = useCallback(async (ch: string, joining = false) => {
    const got = (await get(`c-${ch}`)) as Partial<Shared> | null;
    const local = fns.current.current();
    // Si mientras tanto se desvinculó (por ejemplo, al borrar el progreso), no se toca nada.
    if (!local || (!joining && linked.current !== ch)) return;
    // Lo que falte en una copia de otra versión de la app se rellena con los valores por defecto.
    const remote = got ? { ...shared(fresh(local.day)), ...got } : null;
    const merged = remote ? merge(local, remote) : local;
    if (!sameShared(shared(merged), shared(local))) fns.current.apply(rollDay(merged, fns.current.today()));
    if (!remote || !sameShared(shared(merged), remote)) await put(`c-${ch}`, shared(merged));
  }, []);

  const runOn = useCallback(
    async (ch: string) => {
      if (busy.current) {
        again.current = true;
        return;
      }
      busy.current = true;
      setStatus({ state: 'syncing' });
      try {
        do {
          again.current = false;
          await exchange(ch);
        } while (again.current);
        setStatus({ state: 'ok', at: new Date() });
      } catch {
        setStatus({ state: 'error' });
      } finally {
        busy.current = false;
      }
    },
    [exchange],
  );

  const run = useCallback(() => {
    if (channel) runOn(channel);
  }, [channel, runOn]);

  useEffect(() => {
    if (!channel) return;
    const first = setTimeout(() => runOn(channel), 0);
    const poll = setInterval(() => {
      if (AppState.currentState === 'active') runOn(channel);
    }, POLL_MS);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') runOn(channel);
    });
    return () => {
      clearTimeout(first);
      clearInterval(poll);
      sub.remove();
    };
  }, [channel, runOn]);

  /** Tras un cambio local: sube en unos segundos, agrupando los cambios seguidos. */
  const schedule = useCallback(() => {
    if (!linked.current || pending.current) return;
    pending.current = setTimeout(() => {
      pending.current = null;
      if (linked.current) runOn(linked.current);
    }, AFTER_CHANGE_MS);
  }, [runOn]);

  const save = useCallback(async (ch: string | null) => {
    linked.current = ch;
    if (ch) await AsyncStorage.setItem(LINK_KEY, ch);
    else await AsyncStorage.removeItem(LINK_KEY);
    setChannel(ch);
  }, []);

  /** PC: el móvil dejó su canal en el código; desde ahora este dispositivo usa ese canal. */
  const adopt = useCallback((ch: string) => save(ch), [save]);

  /** Móvil: sube su progreso al canal (creándolo si hace falta) y se lo pasa al PC por el código. */
  const join = useCallback(
    async (code: string) => {
      const ch = channel ?? newChannel();
      await exchange(ch, true);
      await put(`p-${code}`, { channel: ch });
      await save(ch);
      setStatus({ state: 'ok', at: new Date() });
    },
    [channel, exchange, save],
  );

  const unlink = useCallback(() => save(null), [save]);

  return { channel, status, run, schedule, adopt, join, unlink };
}
