// Partida en grupo, como Kahoot!: una pantalla (el anfitrión, normalmente la web en el PC que
// se comparte en la reunión) enseña las preguntas y cada jugador contesta desde su móvil.
// Aquí va la lógica pura: código de sala, puntos, recuento y clasificación. Solo el anfitrión
// lleva la partida (Game) y anuncia un LiveState; los jugadores pintan lo que reciben.
// El canal en tiempo real está en src/room.ts y las pantallas en src/screens/live.tsx.
import { XP, shuffle, type Question } from './game.ts';

export const LIVE = {
  counts: [5, 10, 15],
  secs: [60, 90, 120, 180],
  count: 10,
  limit: 120, // segundos por pregunta: los mismos 2 min del examen real
  maxName: 16,
  grace: 1_500, // ms de margen para respuestas que salieron justo antes de acabar el tiempo
};

// --- Sala ---

// Sin letras que se confundan (i, l, o), como el código de vinculación de src/sync.ts.
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
export const ROOM_LEN = 5;

export function newRoom(rand: () => number = Math.random): string {
  return Array.from({ length: ROOM_LEN }, () => ALPHABET[Math.floor(rand() * ALPHABET.length)]).join('');
}

/** Lee un código tecleado o la URL del QR (…?quiz=abcde): mayúsculas, espacios y guiones dan igual. */
export function parseRoom(input: string): string | null {
  const fromUrl = /[?&]quiz=([^&#]+)/.exec(input)?.[1];
  const raw = (fromUrl ?? input).trim().toLowerCase().replace(/[\s-]/g, '');
  return raw.length === ROOM_LEN && [...raw].every((ch) => ALPHABET.includes(ch)) ? raw : null;
}

/** En pantalla, en mayúsculas: se lee mejor de lejos. */
export const showRoom = (code: string) => code.toUpperCase();

export const cleanName = (name: string) => name.replace(/\s+/g, ' ').trim().slice(0, LIVE.maxName);

// --- Puntos ---

/** Como Kahoot!: 1000 puntos al contestar bien al instante, 500 en el último segundo y 0 al fallar. */
export function points(elapsed: number, limit: number): number {
  const t = Math.max(0, Math.min(1, elapsed / limit));
  return Math.round(1000 * (1 - t / 2));
}

// --- Partida (solo la lleva el anfitrión) ---

export type Phase = 'lobby' | 'question' | 'reveal' | 'end';

export type Player = { name: string; score: number; gained: number; right: number; answered: number }; // gained = puntos de la última pregunta

export type Game = {
  gid: string; // para no contar dos veces la misma partida en la clasificación ni en la XP
  qids: string[];
  orders: number[][]; // orden de las opciones de cada pregunta, el mismo en todas las pantallas: “la B” es la B para todos
  right: number[]; // posición de la buena en cada pregunta
  limit: number; // ms por pregunta
  phase: Phase;
  i: number;
  startedAt: number; // cuándo salió la pregunta actual, con el reloj del anfitrión
  players: Record<string, Player>;
  picks: Record<string, { pos: number; at: number }>; // respuestas a la pregunta actual; at = ms desde que salió
};

export function newGame(qs: Question[], count: number, secs: number, rand: () => number = Math.random): Game {
  const picked = shuffle(qs, rand).slice(0, count);
  const orders = picked.map((q) => shuffle(q.options.map((_, k) => k), rand));
  return {
    gid: newRoom(rand) + newRoom(rand),
    qids: picked.map((q) => q.id),
    orders,
    right: picked.map((q, k) => orders[k].indexOf(q.answer)),
    limit: secs * 1000,
    phase: 'lobby',
    i: 0,
    startedAt: 0,
    players: {},
    picks: {},
  };
}

/** Alguien entra o cambia de nombre. Quien ya jugaba conserva sus puntos aunque se haya caído. */
export function join(g: Game, id: string, name: string): Game {
  const cur = g.players[id];
  const clean = cleanName(name) || cur?.name || '?';
  if (cur && cur.name === clean) return g;
  return { ...g, players: { ...g.players, [id]: cur ? { ...cur, name: clean } : { name: clean, score: 0, gained: 0, right: 0, answered: 0 } } };
}

function ask(g: Game, i: number, now: number): Game {
  const players: Record<string, Player> = {};
  for (const [id, p] of Object.entries(g.players)) players[id] = { ...p, gained: 0 };
  return { ...g, phase: 'question', i, startedAt: now, picks: {}, players };
}

/** Empieza la partida con la primera pregunta. */
export const start = (g: Game, now: number) => (g.phase === 'lobby' ? ask(g, 0, now) : g);

/** Una respuesta. Solo vale la primera de cada jugador, a la pregunta de ahora y dentro de tiempo (con margen por la red). */
export function pick(g: Game, id: string, name: string, qid: string, pos: number, now: number): Game {
  if (g.phase !== 'question' || g.qids[g.i] !== qid || g.picks[id]) return g;
  if (!Number.isInteger(pos) || pos < 0 || pos >= g.orders[g.i].length) return g;
  const at = now - g.startedAt;
  if (at > g.limit + LIVE.grace) return g;
  const withPlayer = join(g, id, name);
  return { ...withPlayer, picks: { ...withPlayer.picks, [id]: { pos, at: Math.min(at, g.limit) } } };
}

export const timeLeft = (g: Game, now: number) => (g.phase === 'question' ? Math.max(0, g.startedAt + g.limit - now) : 0);

/** ¿Han contestado todos los que están conectados? Entonces no hace falta esperar al reloj. */
export const everyoneIn = (g: Game, online: string[]) => online.length > 0 && online.every((id) => g.picks[id]);

/** Se acaba la pregunta: se enseña la buena y se reparten los puntos. */
export function reveal(g: Game): Game {
  if (g.phase !== 'question') return g;
  const right = g.right[g.i];
  const players: Record<string, Player> = {};
  for (const [id, p] of Object.entries(g.players)) {
    const mine = g.picks[id];
    const ok = mine?.pos === right;
    const gained = ok ? points(mine.at, g.limit) : 0;
    players[id] = { ...p, score: p.score + gained, gained, right: p.right + (ok ? 1 : 0), answered: p.answered + (mine ? 1 : 0) };
  }
  return { ...g, phase: 'reveal', players };
}

/** Siguiente pregunta, o el final si era la última. */
export const advance = (g: Game, now: number) => (g.phase !== 'reveal' ? g : g.i + 1 < g.qids.length ? ask(g, g.i + 1, now) : { ...g, phase: 'end' as const });

// --- Lo que se anuncia ---

export type Standing = { id: string } & Player;

/** Lo que el anfitrión manda a todos. La pregunta va por id: cada jugador la pinta con su banco y en su idioma. */
export type LiveState = {
  gid: string;
  phase: Phase;
  i: number;
  n: number;
  qid: string | null;
  order: number[];
  left: number; // ms que quedan al enviarlo; cada uno cuenta con su reloj desde ahí
  limit: number;
  answered: string[]; // quién ha contestado ya la pregunta de ahora
  tally: number[]; // respuestas por posición, solo al corregir
  right: number | null; // posición de la buena, solo al corregir
  board: Standing[];
};

export function standings(g: Game): Standing[] {
  return Object.entries(g.players)
    .map(([id, p]) => ({ id, ...p }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

export function tally(g: Game): number[] {
  const counts = g.orders[g.i].map(() => 0);
  for (const { pos } of Object.values(g.picks)) counts[pos]++;
  return counts;
}

export function stateOf(g: Game, now: number): LiveState {
  const shown = g.phase === 'question' || g.phase === 'reveal';
  const revealed = g.phase === 'reveal';
  return {
    gid: g.gid,
    phase: g.phase,
    i: g.i,
    n: g.qids.length,
    qid: shown ? g.qids[g.i] : null,
    order: shown ? g.orders[g.i] : [],
    left: timeLeft(g, now),
    limit: g.limit,
    answered: shown ? Object.keys(g.picks) : [],
    tally: revealed ? tally(g) : [],
    right: revealed ? g.right[g.i] : null,
    board: standings(g),
  };
}

/** Puesto en la clasificación, desde 1; 0 si no está. */
export const rankOf = (board: Standing[], id: string) => board.findIndex((s) => s.id === id) + 1;

// --- XP y clasificación de todas las partidas ---

/** Lo que da una partida al progreso de cada jugador: como una ronda, más un premio por subir al podio. */
export const LIVE_XP = { right: XP.right, wrong: XP.wrong, podium: [30, 20, 10] };

export function liveXp(s: Standing, rank: number, players: number): number {
  const podium = players >= 2 && s.score > 0 ? (LIVE_XP.podium[rank - 1] ?? 0) : 0;
  return s.right * LIVE_XP.right + (s.answered - s.right) * LIVE_XP.wrong + podium;
}

export type RankEntry = { name: string; points: number; games: number; wins: number; podiums: number; right: number; answered: number; last: string };
export type Ranking = { players: Record<string, RankEntry>; games: string[] }; // games = gid de las últimas partidas ya sumadas

const KEPT_GAMES = 100;
const num = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? Math.floor(x) : 0);

/** Lee la clasificación tal como venga del servidor: lo que no tenga la forma esperada se descarta. */
export function readRanking(raw: unknown): Ranking {
  const r = (raw ?? {}) as { players?: unknown; games?: unknown };
  const players: Record<string, RankEntry> = {};
  if (r.players && typeof r.players === 'object') {
    for (const [id, v] of Object.entries(r.players as Record<string, Record<string, unknown>>)) {
      if (!v || typeof v !== 'object' || typeof v.name !== 'string') continue;
      players[id] = {
        name: cleanName(v.name) || '?',
        points: num(v.points),
        games: num(v.games),
        wins: num(v.wins),
        podiums: num(v.podiums),
        right: num(v.right),
        answered: num(v.answered),
        last: typeof v.last === 'string' ? v.last : '',
      };
    }
  }
  const games = Array.isArray(r.games) ? r.games.filter((x): x is string => typeof x === 'string').slice(-KEPT_GAMES) : [];
  return { players, games };
}

/** Suma una partida acabada. Solo cuentan quienes contestaron algo, y la misma partida no se suma dos veces. */
export function addGame(r: Ranking, g: Game, day: string): Ranking {
  if (g.phase !== 'end' || r.games.includes(g.gid)) return r;
  const board = standings(g).filter((s) => s.answered > 0);
  const players = { ...r.players };
  board.forEach((s, i) => {
    const cur = players[s.id] ?? { name: s.name, points: 0, games: 0, wins: 0, podiums: 0, right: 0, answered: 0, last: '' };
    const placed = board.length >= 2 && s.score > 0;
    players[s.id] = {
      name: s.name,
      points: cur.points + s.score,
      games: cur.games + 1,
      wins: cur.wins + (placed && i === 0 ? 1 : 0),
      podiums: cur.podiums + (placed && i < 3 ? 1 : 0),
      right: cur.right + s.right,
      answered: cur.answered + s.answered,
      last: day,
    };
  });
  return { players, games: [...r.games, g.gid].slice(-KEPT_GAMES) };
}

export type RankRow = { id: string } & RankEntry;

export function rankingList(r: Ranking): RankRow[] {
  return Object.entries(r.players)
    .map(([id, e]) => ({ id, ...e }))
    .sort((a, b) => b.points - a.points || b.wins - a.wins || a.name.localeCompare(b.name));
}
