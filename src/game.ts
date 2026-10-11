// Lógica pura del juego: fechas, repetición espaciada, XP, niveles y racha.
// Sin React ni Expo, para poder probarla con node --test.

export type Domain = 'agentic' | 'claude-code' | 'prompting' | 'tools' | 'context';

// Los cinco dominios del examen, con la numeración y el peso (%) de la guía oficial
// (Claude Certified Architect – Foundations Exam Guide v1.0, julio 2026).
export const DOMAINS: { id: Domain; n: number; name: string; short: string; weight: number }[] = [
  { id: 'agentic', n: 1, name: 'Agentic Architecture & Orchestration', short: 'Agents', weight: 27 },
  { id: 'tools', n: 2, name: 'Tool Design & MCP Integration', short: 'Tools & MCP', weight: 18 },
  { id: 'claude-code', n: 3, name: 'Claude Code Configuration & Workflows', short: 'Claude Code', weight: 20 },
  { id: 'prompting', n: 4, name: 'Prompt Engineering & Structured Output', short: 'Prompting', weight: 20 },
  { id: 'context', n: 5, name: 'Context Management & Reliability', short: 'Context', weight: 15 },
];

export type Setting = 'support' | 'codegen' | 'research' | 'devprod' | 'ci' | 'extraction';

// Los seis escenarios oficiales; el examen saca cuatro al azar.
export const SETTINGS: Record<Setting, { name: string; emoji: string }> = {
  support: { name: 'Customer Support Resolution Agent', emoji: '🎧' },
  codegen: { name: 'Code Generation with Claude Code', emoji: '⌨️' },
  research: { name: 'Multi-Agent Research System', emoji: '🔭' },
  devprod: { name: 'Developer Productivity with Claude', emoji: '🧰' },
  ci: { name: 'Claude Code for Continuous Integration', emoji: '🔁' },
  extraction: { name: 'Structured Data Extraction', emoji: '🧾' },
};

export type Question = {
  id: string;
  domain: Domain;
  setting?: Setting; // escenario oficial en el que se enmarca
  ts?: string; // task statement de la guía que evalúa, p. ej. '1.4'
  scenario: string;
  ask: string;
  options: string[];
  answer: number; // índice en options
  why: string[]; // una explicación por opción, en el mismo orden
  rule: string; // la idea que hay que llevarse
};

// --- Días locales como 'YYYY-MM-DD' ---

const pad = (n: number) => String(n).padStart(2, '0');

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const parts = (day: string) => day.split('-').map(Number) as [number, number, number];

export function addDays(day: string, n: number): string {
  const [y, m, d] = parts(day);
  return dayKey(new Date(y, m - 1, d + n));
}

/** Días de a hasta b (b - a). */
export function daysBetween(a: string, b: string): number {
  const [ya, ma, da] = parts(a);
  const [yb, mb, db] = parts(b);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86_400_000);
}

export function at(day: string, hour: number, minute: number): Date {
  const [y, m, d] = parts(day);
  return new Date(y, m - 1, d, hour, minute);
}

// --- Repetición espaciada (cajas de Leitner) ---

// Días hasta volver a ver una pregunta según su caja. Fallar la manda a la caja 1
// (vuelve mañana); acertar la sube una caja, y acertarla a la primera ya la deja en la 2.
export const INTERVALS = [0, 1, 3, 7, 16];
export const MASTERED = 4;

export type Card = { box: number; due: string; seen: number; right: number };

export function review(card: Card | undefined, correct: boolean, today: string): Card {
  const box = !correct ? 1 : card ? Math.min(card.box + 1, MASTERED) : 2;
  return {
    box,
    due: addDays(today, INTERVALS[box]),
    seen: (card?.seen ?? 0) + 1,
    right: (card?.right ?? 0) + (correct ? 1 : 0),
  };
}

// --- Progreso ---

export const GOAL = 5; // preguntas al día para mantener la racha

export type Progress = {
  xp: number;
  cards: Record<string, Card>;
  streak: number; // días seguidos cumpliendo la meta, hasta goalDay
  best: number;
  goalDay: string | null; // último día en que se cumplió la meta
  day: string; // día al que se refieren answered y correct
  answered: number;
  correct: number;
  bestCombo: number;
  reminder: { on: boolean; hour: number; minute: number };
};

export function fresh(today: string): Progress {
  return {
    xp: 0,
    cards: {},
    streak: 0,
    best: 0,
    goalDay: null,
    day: today,
    answered: 0,
    correct: 0,
    bestCombo: 0,
    reminder: { on: true, hour: 19, minute: 30 },
  };
}

/** Al cambiar de día se ponen a cero los contadores de hoy. */
export function rollDay(p: Progress, today: string): Progress {
  return p.day === today ? p : { ...p, day: today, answered: 0, correct: 0 };
}

/** La racha sigue viva si se cumplió la meta hoy o ayer. */
export function liveStreak(p: Progress, today: string): number {
  return p.goalDay === today || p.goalDay === addDays(today, -1) ? p.streak : 0;
}

export const goalDone = (p: Progress, today: string) => p.day === today && p.answered >= GOAL;

// --- XP y niveles ---

export const XP = { right: 10, combo3: 5, combo5: 10, wrong: 2, goal: 25, session: 10, perfect: 30 };

export const LEVELS = [
  'Prompt Rookie',
  'Token Tinkerer',
  'Tool Smith',
  'Context Keeper',
  'Hook Handler',
  'Subagent Wrangler',
  'Orchestrator',
  'Harness Builder',
  'Claude Architect',
  'Certified Legend',
];

/** El nivel n (desde 1) empieza en 50·n·(n−1) XP: 0, 100, 300, 600, 1000… */
const levelStart = (n: number) => 50 * n * (n - 1);

export type Level = { n: number; title: string; from: number; to: number | null };

export function levelOf(xp: number): Level {
  let n = 1;
  while (n < LEVELS.length && xp >= levelStart(n + 1)) n++;
  return { n, title: LEVELS[n - 1], from: levelStart(n), to: n < LEVELS.length ? levelStart(n + 1) : null };
}

export type Outcome = {
  progress: Progress;
  gained: number;
  combo: number;
  goalJustMet: boolean;
  levelUp: Level | null;
};

/** Apunta una respuesta: caja de la pregunta, XP con combo, meta del día y racha. */
export function answer(p0: Progress, id: string, correct: boolean, combo: number, today: string): Outcome {
  const p = rollDay(p0, today);
  const nextCombo = correct ? combo + 1 : 0;
  let gained = correct ? XP.right + (nextCombo >= 5 ? XP.combo5 : nextCombo >= 3 ? XP.combo3 : 0) : XP.wrong;

  const answered = p.answered + 1;
  const goalJustMet = p.answered < GOAL && answered >= GOAL;
  let { streak, best, goalDay } = p;
  if (goalJustMet) {
    gained += XP.goal;
    streak = liveStreak(p, today) + 1;
    best = Math.max(best, streak);
    goalDay = today;
  }

  const progress: Progress = {
    ...p,
    xp: p.xp + gained,
    cards: { ...p.cards, [id]: review(p.cards[id], correct, today) },
    answered,
    correct: p.correct + (correct ? 1 : 0),
    bestCombo: Math.max(p.bestCombo, nextCombo),
    streak,
    best,
    goalDay,
  };
  return { progress, gained, combo: nextCombo, goalJustMet, levelUp: levelChange(p.xp, progress.xp) };
}

export function sessionBonus(right: number, total: number): number {
  if (total === 0) return 0;
  return right === total ? XP.perfect : XP.session;
}

export function addXp(p: Progress, n: number): { progress: Progress; levelUp: Level | null } {
  const progress = { ...p, xp: p.xp + n };
  return { progress, levelUp: levelChange(p.xp, progress.xp) };
}

function levelChange(before: number, after: number): Level | null {
  const l = levelOf(after);
  return l.n > levelOf(before).n ? l : null;
}

// --- Sesiones ---

export function shuffle<T>(items: T[], rand: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Las preguntas de una ronda: primero las que tocan repaso (las más atrasadas y
 * flojas antes), siempre con al menos una nueva si quedan, elegida del dominio que
 * va más retrasado respecto a su peso en el examen. Si no hay bastantes, se
 * adelantan repasos de las cajas más bajas.
 */
export function buildSession(
  qs: Question[],
  p: Progress,
  today: string,
  size = GOAL,
  rand: () => number = Math.random,
): Question[] {
  const card = (q: Question) => p.cards[q.id];
  const due = qs
    .filter((q) => card(q) && card(q).due <= today)
    .sort((a, b) => card(a).due.localeCompare(card(b).due) || card(a).box - card(b).box);
  const unseen = qs.filter((q) => !card(q));

  const picked: Question[] = [];
  const wantNew = unseen.length > 0 ? Math.max(1, size - due.length) : 0;
  picked.push(...due.slice(0, size - Math.min(wantNew, size)));

  const seenIn = (d: Domain) => qs.filter((q) => q.domain === d && (card(q) || picked.includes(q))).length;
  while (picked.length < size) {
    const left = unseen.filter((q) => !picked.includes(q));
    if (left.length === 0) break;
    const domains = DOMAINS.filter((d) => left.some((q) => q.domain === d.id));
    const behind = domains.reduce((a, b) => (seenIn(b.id) / b.weight < seenIn(a.id) / a.weight ? b : a));
    const pool = left.filter((q) => q.domain === behind.id);
    picked.push(pool[Math.floor(rand() * pool.length)]);
  }

  if (picked.length < size) {
    const early = qs
      .filter((q) => card(q) && !picked.includes(q))
      .sort((a, b) => card(a).box - card(b).box || card(a).due.localeCompare(card(b).due));
    picked.push(...early.slice(0, size - picked.length));
  }
  return shuffle(picked, rand);
}

// --- Dominio y preparación ---

/** De 0 a 1: media de la caja de cada pregunta sobre la caja de dominada. */
export function mastery(qs: Question[], p: Progress, domain?: Domain): number {
  const list = domain ? qs.filter((q) => q.domain === domain) : qs;
  if (list.length === 0) return 0;
  return list.reduce((s, q) => s + (p.cards[q.id]?.box ?? 0), 0) / (list.length * MASTERED);
}

/** De 0 a 1: el dominio de cada parte ponderado por su peso en el examen. */
export function readiness(qs: Question[], p: Progress): number {
  return DOMAINS.reduce((s, d) => s + (d.weight / 100) * mastery(qs, p, d.id), 0);
}

export function dueCount(qs: Question[], p: Progress, day: string): number {
  return qs.filter((q) => p.cards[q.id] && p.cards[q.id].due <= day).length;
}
