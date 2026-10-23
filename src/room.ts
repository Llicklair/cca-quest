// Canal en tiempo real de una partida en grupo: Supabase Realtime en el mismo proyecto que la
// sincronización (src/sync.ts). Broadcast para los mensajes y Presence para saber quién está.
// No guarda nada en la base de datos: la partida vive en la pantalla del anfitrión.
import { RealtimeClient, type RealtimeChannel } from '@supabase/realtime-js';

import { BASE, KEY } from './sync.ts';

export type Peer = { id: string; name: string; host: boolean };
export type RoomStatus = 'connecting' | 'live' | 'error';

// state: anfitrión → todos · answer: jugador → anfitrión · hello: quien entra pide el estado
export type RoomEvent = 'state' | 'answer' | 'hello';
const EVENTS: RoomEvent[] = ['state', 'answer', 'hello'];

// Protocolo 1.0.0: todo en JSON. El 2.0.0 (el de por defecto) manda tramas binarias que necesitan
// TextDecoder, y no hace falta arriesgarse a que falte en el motor de JavaScript del móvil.
let client: RealtimeClient | null = null;
const realtime = () =>
  (client ??= new RealtimeClient(`${BASE.replace(/^http/, 'ws')}/realtime/v1`, { params: { apikey: KEY }, vsn: '1.0.0' }));

export type Room = { send: (event: RoomEvent, payload: object) => void; leave: () => void };

/**
 * Entra en la sala `code` como `me`. Avisa de cada mensaje, de quién hay conectado y del estado
 * de la conexión. Si se corta, el cliente reconecta solo y vuelve a anunciarse.
 */
export function openRoom(
  code: string,
  me: Peer,
  on: { message: (event: RoomEvent, payload: any) => void; peers: (peers: Peer[]) => void; status: (s: RoomStatus) => void },
): Room {
  const ch: RealtimeChannel = realtime().channel(`quiz-${code}`, { config: { broadcast: { self: false }, presence: { key: me.id } } });
  for (const event of EVENTS) ch.on('broadcast', { event }, ({ payload }) => on.message(event, payload));
  ch.on('presence', { event: 'sync' }, () => {
    const state = ch.presenceState<Peer>();
    on.peers(Object.values(state).flatMap((metas) => (metas[0] ? [{ id: metas[0].id, name: metas[0].name, host: metas[0].host }] : [])));
  });
  on.status('connecting');
  ch.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      on.status('live');
      ch.track(me);
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') on.status('error');
  });
  return {
    send: (event, payload) => {
      ch.send({ type: 'broadcast', event, payload });
    },
    leave: () => {
      realtime().removeChannel(ch);
    },
  };
}
