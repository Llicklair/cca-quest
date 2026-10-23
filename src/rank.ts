// Clasificación de todos: quien quiere salir publica un resumen de su progreso (nombre, nivel,
// XP, racha, preparación y preguntas vistas) en un documento compartido del almacén de sync.sql.
// Cada uno solo toca su fila y la vuelve a publicar cuando cambia su progreso, así que si dos
// escriben a la vez y se pierde una fila, vuelve en la siguiente publicación. Lógica pura.
import { dayKey, daysBetween, liveStreak, readiness, type Progress } from './game.ts';
import { cleanName } from './live.ts';
import { QUESTIONS } from './questions.ts';

// sync.sql solo acepta claves `c-<32 hex>` y `p-<10 letras>`, así que los dos documentos
// compartidos van en claves fijas de canal. Son públicas como la app: cualquiera con el código
// podría pisarlas, y por eso todo lo que se lee de ellas pasa por un lector que descarta lo raro.
export const BOARD_KEY = 'c-cca0000000000000000000000000b0a4'; // progreso de cada uno
export const QUIZ_KEY = 'c-cca0000000000000000000000000ba5d'; // partidas del quiz en grupo (src/live.ts)

export type Summary = { name: string; xp: number; streak: number; best: number; ready: number; seen: number; day: string };
export type Board = { players: Record<string, Summary> };
export type BoardRow = { id: string } & Summary;

/** Lo que se enseña de ti: nada de preguntas concretas ni respuestas. `ready` en %, como en el inicio. */
export function summary(p: Progress, name: string, today: string): Summary {
  return {
    name: cleanName(name) || '?',
    xp: p.xp,
    streak: liveStreak(p, today),
    best: p.best,
    ready: Math.round(readiness(QUESTIONS, p) * 100),
    seen: QUESTIONS.filter((q) => p.cards[q.id]).length,
    day: today,
  };
}

const num = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? Math.floor(x) : 0);
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Lee el documento tal como venga: lo que no tenga la forma esperada se descarta. */
export function readBoard(raw: unknown): Board {
  const players: Record<string, Summary> = {};
  const all = (raw as { players?: unknown } | null)?.players;
  if (all && typeof all === 'object') {
    for (const [id, v] of Object.entries(all as Record<string, Record<string, unknown>>)) {
      if (!v || typeof v !== 'object' || typeof v.name !== 'string') continue;
      players[id] = {
        name: cleanName(v.name) || '?',
        xp: num(v.xp),
        streak: num(v.streak),
        best: num(v.best),
        ready: Math.min(100, num(v.ready)),
        seen: num(v.seen),
        day: typeof v.day === 'string' && DAY.test(v.day) ? v.day : '',
      };
    }
  }
  return { players };
}

const same = (a: Summary | undefined, b: Summary | null) =>
  !a || !b ? a === undefined && b === null : (Object.keys(b) as (keyof Summary)[]).every((k) => a[k] === b[k]);

/** Pone (o quita, con null) tu fila. Devuelve el mismo documento si no cambia nada: así no se escribe. */
export function publish(b: Board, id: string, s: Summary | null): Board {
  if (same(b.players[id], s)) return b;
  const players = { ...b.players };
  if (s) players[id] = s;
  else delete players[id];
  return { players };
}

export function boardList(b: Board): BoardRow[] {
  return Object.entries(b.players)
    .map(([id, s]) => ({ id, ...s }))
    .sort((a, b) => b.xp - a.xp || b.ready - a.ready || a.name.localeCompare(b.name));
}

/** Días desde la última vez que publicó (0 = hoy), o null si no se sabe. */
export const daysAgo = (day: string, today = dayKey(new Date())) => (DAY.test(day) ? Math.max(0, daysBetween(day, today)) : null);
