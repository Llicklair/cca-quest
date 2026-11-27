// Junta dos copias del progreso (la del móvil y la del PC) sin perder lo estudiado en
// ninguna. Lógica pura, sin React ni Expo, para poder probarla con node --test.
import { examKey, type Card, type ExamResult, type Progress } from './game.ts';

/** Lo que viaja al servidor: todo menos los avisos y el tema, que son de cada dispositivo. */
export type Shared = Omit<Progress, 'reminder' | 'theme'>;

export function shared(p: Progress): Shared {
  const { reminder: _, theme: __, ...rest } = p;
  return rest;
}

// La pregunta con más respuestas lleva la historia más larga; si empatan, gana la copia más reciente.
function pickCard(mine: Card | undefined, theirs: Card | undefined, theirsNewer: boolean): Card {
  if (!mine) return theirs!;
  if (!theirs) return mine;
  if (mine.seen !== theirs.seen) return mine.seen > theirs.seen ? mine : theirs;
  return theirsNewer ? theirs : mine;
}

function union<T>(a: Record<string, T>, b: Record<string, T>, pick: (x: T | undefined, y: T | undefined) => T): Record<string, T> {
  const out: Record<string, T> = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) out[k] = pick(a[k], b[k]);
  return out;
}

/**
 * Une el progreso local con el que llega del otro dispositivo. Los avisos se quedan como
 * están en este dispositivo. Si se estudió en los dos sin sincronizar, la XP se queda con el
 * máximo de las dos y no con la suma: se pierde algo de XP, pero ninguna respuesta.
 */
export function merge(local: Progress, remote: Shared): Progress {
  const remoteNewer = remote.stamp > local.stamp;
  const newer = remoteNewer ? remote : local;

  const sameDay = local.day === remote.day;
  const today = sameDay ? local : local.day > remote.day ? local : remote;

  const goalFrom =
    (local.goalDay ?? '') === (remote.goalDay ?? '')
      ? local.streak >= remote.streak
        ? local
        : remote
      : (local.goalDay ?? '') > (remote.goalDay ?? '')
        ? local
        : remote;

  // Más recientes primero; dentro del mismo día, primero los de la copia más nueva. Si el mismo
  // simulacro está en las dos, gana la copia que guardó sus preguntas (la otra pudo pasar por una
  // versión de la app que aún no las guardaba).
  const byKey = new Map<string, ExamResult>();
  for (const e of [...newer.exams, ...(remoteNewer ? local : remote).exams]) {
    const had = byKey.get(examKey(e));
    if (!had || (!had.slots && e.slots)) byKey.set(examKey(e), e);
  }
  const exams = [...byKey.values()].sort((a, b) => (a.day === b.day ? 0 : a.day > b.day ? -1 : 1)).slice(0, 30);

  return {
    xp: Math.max(local.xp, remote.xp),
    cards: union(local.cards, remote.cards, (a, b) => pickCard(a, b, remoteNewer)),
    lessons: union(local.lessons, remote.lessons, (a, b) => (a && b ? (a < b ? a : b) : (a ?? b)!)),
    lang: newer.lang,
    theme: local.theme,
    streak: goalFrom.streak,
    best: Math.max(local.best, remote.best),
    goalDay: goalFrom.goalDay,
    day: today.day,
    answered: sameDay ? Math.max(local.answered, remote.answered) : today.answered,
    correct: sameDay ? Math.max(local.correct, remote.correct) : today.correct,
    bestCombo: Math.max(local.bestCombo, remote.bestCombo),
    reminder: local.reminder,
    history: union(local.history, remote.history, (a, b) => Math.max(a ?? 0, b ?? 0)),
    exams,
    examDraft: newer.examDraft,
    stamp: Math.max(local.stamp, remote.stamp),
    // El de la copia más nueva; un perfil ya creado no se pierde aunque la otra copia no lo tenga
    // (o venga de una versión de la app anterior al perfil).
    profile: (remoteNewer ? (remote.profile ?? local.profile) : (local.profile ?? remote.profile)) ?? null,
    ...chatOf(newer, remoteNewer ? local : remote),
  };
}

/**
 * Tu chat de Claude: el de la copia más nueva, o el de la otra si la nueva no lo tiene. Olvidarlo
 * (null) también viaja. Sin chat, ni la clave: así una versión anterior de la app, que no la
 * conoce, no ve diferencias y no se ponen a reenviar el progreso una y otra vez.
 */
function chatOf(newer: Shared, older: Shared): Pick<Progress, 'claudeChat'> {
  const chat = newer.claudeChat === undefined ? older.claudeChat : newer.claudeChat;
  return chat === undefined ? {} : { claudeChat: chat };
}

/** JSON con las claves ordenadas, para comparar dos copias aunque se construyeran en otro orden. */
export function canonical(v: unknown): string {
  return JSON.stringify(v, (_, x) =>
    x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : 1))) : x,
  );
}

export const sameShared = (a: Shared, b: Shared) => canonical(a) === canonical(b);
