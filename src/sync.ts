// Sincronización móvil ↔ PC, como WhatsApp Web: el PC enseña un código QR, el móvil lo
// escanea y desde entonces los dos comparten un canal en el servidor. Cada usuario tiene
// su propio canal con una clave aleatoria de 128 bits que solo conocen sus dispositivos:
// no hay cuentas y el servidor no permite listar canales.
//
// Servidor: lo que diga EXPO_PUBLIC_SYNC_URL. Sin esa variable la sincronización no aparece.
// Para probar en local: `npm run sync-server` y la URL del PC en `.env.local`.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { fresh, rollDay, type Progress } from './game.ts';
import { merge, sameShared, shared, type Shared } from './merge.ts';

const BASE = (process.env.EXPO_PUBLIC_SYNC_URL ?? '').replace(/\/+$/, '');
export const SYNC_ENABLED = BASE !== '';

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

// --- Servidor: un almacén clave → JSON ---

async function call(method: 'GET' | 'PUT' | 'DELETE', key: string, body?: unknown): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8_000);
  try {
    const res = await fetch(`${BASE}/kv/${key}`, {
      method,
      signal: ctrl.signal,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (method === 'GET' && res.status === 404) return null;
    if (!res.ok) throw new Error(`sync ${method} ${res.status}`);
    return method === 'GET' ? await res.json() : null;
  } finally {
    clearTimeout(timer);
  }
}

/** El PC pregunta si el móvil ya dejó su canal en el código. */
export async function pairedChannel(code: string): Promise<string | null> {
  const got = (await call('GET', `p-${code}`)) as { channel?: string } | null;
  if (!got?.channel) return null;
  call('DELETE', `p-${code}`).catch(() => {});
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
    const got = (await call('GET', `c-${ch}`)) as Partial<Shared> | null;
    const local = fns.current.current();
    // Si mientras tanto se desvinculó (por ejemplo, al borrar el progreso), no se toca nada.
    if (!local || (!joining && linked.current !== ch)) return;
    // Lo que falte en una copia de otra versión de la app se rellena con los valores por defecto.
    const remote = got ? { ...shared(fresh(local.day)), ...got } : null;
    const merged = remote ? merge(local, remote) : local;
    if (!sameShared(shared(merged), shared(local))) fns.current.apply(rollDay(merged, fns.current.today()));
    if (!remote || !sameShared(shared(merged), remote)) await call('PUT', `c-${ch}`, shared(merged));
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
      await call('PUT', `p-${code}`, { channel: ch });
      await save(ch);
      setStatus({ state: 'ok', at: new Date() });
    },
    [channel, exchange, save],
  );

  const unlink = useCallback(() => save(null), [save]);

  return { channel, status, run, schedule, adopt, join, unlink };
}
