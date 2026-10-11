import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  GOAL,
  XP,
  addDays,
  answer,
  buildSession,
  daysBetween,
  dueCount,
  fresh,
  levelOf,
  liveStreak,
  mastery,
  readiness,
  review,
  sessionBonus,
  shuffle,
  type Progress,
  type Question,
} from '../src/game.ts';
import { plan } from '../src/remind.ts';

const HOY = '2026-10-11';

// Generador repetible para que las rondas sean deterministas en los tests.
function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
}

const q = (id: string, domain: Question['domain']): Question => ({
  id,
  domain,
  scenario: '',
  ask: '',
  options: ['a', 'b', 'c', 'd'],
  answer: 0,
  why: ['', '', '', ''],
  rule: '',
});

test('fechas', () => {
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(daysBetween('2026-10-11', '2026-10-27'), 16);
  // cambio de hora de octubre en España: sigue siendo un día
  assert.equal(addDays('2026-10-24', 1), '2026-10-25');
  assert.equal(addDays('2026-10-25', 1), '2026-10-26');
});

test('cajas: acertar sube, fallar vuelve mañana', () => {
  const first = review(undefined, true, HOY);
  assert.deepEqual(first, { box: 2, due: '2026-10-14', seen: 1, right: 1 });
  const again = review(first, true, '2026-10-14');
  assert.deepEqual(again, { box: 3, due: '2026-10-21', seen: 2, right: 2 });
  const top = review(review(again, true, HOY), true, HOY);
  assert.equal(top.box, 4);
  assert.equal(top.due, '2026-10-27');
  const miss = review(top, false, HOY);
  assert.deepEqual(miss, { box: 1, due: '2026-10-12', seen: 5, right: 4 });
  assert.equal(review(undefined, false, HOY).box, 1);
});

test('XP con combo', () => {
  let p = fresh(HOY);
  let combo = 0;
  const gains: number[] = [];
  for (const ok of [true, true, true, true, true, false]) {
    const o = answer(p, `q${gains.length}`, ok, combo, HOY);
    p = o.progress;
    combo = o.combo;
    gains.push(o.gained);
  }
  // 3.º acierto seguido: +5; 5.º: +10 y además la meta del día; fallo: 2
  assert.deepEqual(gains, [10, 10, 15, 15, 20 + XP.goal, 2]);
  assert.equal(combo, 0);
  assert.equal(p.bestCombo, 5);
  assert.equal(p.answered, 6);
  assert.equal(p.correct, 5);
});

test('la meta del día alarga la racha una sola vez', () => {
  const play = (p: Progress, day: string, n: number) => {
    for (let i = 0; i < n; i++) p = answer(p, `${day}-${i}`, true, 0, day).progress;
    return p;
  };
  let p = play(fresh(HOY), HOY, GOAL + 3);
  assert.equal(p.streak, 1);
  assert.equal(p.goalDay, HOY);
  p = play(p, '2026-10-12', GOAL);
  assert.equal(p.streak, 2);
  assert.equal(liveStreak(p, '2026-10-13'), 2); // aún se puede salvar
  assert.equal(liveStreak(p, '2026-10-14'), 0); // un día sin jugar la rompe
  p = play(p, '2026-10-14', GOAL);
  assert.equal(p.streak, 1);
  assert.equal(p.best, 2);
});

test('niveles', () => {
  assert.deepEqual(levelOf(0), { n: 1, title: 'Prompt Rookie', from: 0, to: 100 });
  assert.equal(levelOf(99).n, 1);
  assert.equal(levelOf(100).n, 2);
  assert.equal(levelOf(600).title, 'Context Keeper');
  assert.equal(levelOf(1e9).to, null);
  const o = answer({ ...fresh(HOY), xp: 95 }, 'x', true, 0, HOY);
  assert.equal(o.levelUp?.n, 2);
  assert.equal(sessionBonus(5, 5), XP.perfect);
  assert.equal(sessionBonus(3, 5), XP.session);
});

test('la ronda empieza por lo que toca repasar y mete al menos una nueva', () => {
  const qs = [q('a1', 'agentic'), q('a2', 'agentic'), q('c1', 'claude-code'), q('p1', 'prompting'), q('t1', 'tools'), q('x1', 'context'), q('x2', 'context')];
  const p = fresh(HOY);
  p.cards = {
    a1: { box: 1, due: '2026-10-10', seen: 1, right: 0 },
    c1: { box: 2, due: HOY, seen: 1, right: 1 },
    p1: { box: 1, due: '2026-10-09', seen: 1, right: 0 },
    t1: { box: 3, due: HOY, seen: 2, right: 2 },
    x1: { box: 1, due: HOY, seen: 1, right: 0 },
  };
  const ids = buildSession(qs, p, HOY, 5, seeded(1)).map((x) => x.id).sort();
  // 5 pendientes: entran las 4 más atrasadas/flojas y queda hueco para una nueva
  assert.equal(ids.length, 5);
  assert.ok(ids.includes('p1') && ids.includes('a1') && ids.includes('x1') && ids.includes('c1'));
  assert.ok(!ids.includes('t1'));
  assert.ok(ids.includes('a2') || ids.includes('x2'));
});

test('las nuevas salen del dominio más retrasado respecto a su peso', () => {
  const qs = [q('a1', 'agentic'), q('a2', 'agentic'), q('c1', 'claude-code'), q('c2', 'claude-code'), q('x1', 'context')];
  const ids = buildSession(qs, fresh(HOY), HOY, 3, seeded(7)).map((x) => x.id);
  const domains = ids.map((id) => id[0]).sort();
  // agentic (27) va primero, luego claude-code (20), luego context (15)
  assert.deepEqual(domains, ['a', 'c', 'x']);
});

test('sin nuevas ni pendientes se adelantan los repasos más flojos', () => {
  const qs = [q('a1', 'agentic'), q('a2', 'agentic'), q('a3', 'agentic')];
  const p = fresh(HOY);
  p.cards = {
    a1: { box: 4, due: '2026-10-30', seen: 4, right: 4 },
    a2: { box: 2, due: '2026-10-13', seen: 1, right: 1 },
    a3: { box: 3, due: '2026-10-15', seen: 2, right: 2 },
  };
  const ids = buildSession(qs, p, HOY, 2, seeded(3)).map((x) => x.id).sort();
  assert.deepEqual(ids, ['a2', 'a3']);
});

test('barajar no pierde ni repite', () => {
  const r = shuffle([0, 1, 2, 3], seeded(42));
  assert.deepEqual([...r].sort(), [0, 1, 2, 3]);
});

test('dominio, preparación y pendientes', () => {
  const qs = [q('a1', 'agentic'), q('c1', 'claude-code')];
  const p = fresh(HOY);
  p.cards = { a1: { box: 4, due: '2026-10-20', seen: 3, right: 3 } };
  assert.equal(mastery(qs, p, 'agentic'), 1);
  assert.equal(mastery(qs, p), 0.5);
  assert.equal(readiness(qs, p).toFixed(2), '0.27');
  assert.equal(dueCount(qs, p, HOY), 0);
  assert.equal(dueCount(qs, p, '2026-10-20'), 1);
});

test('recordatorios: hoy no avisa si ya se cumplió la meta', () => {
  const qs = [q('a1', 'agentic')];
  let p = fresh(HOY);
  const morning = new Date(2026, 9, 11, 9, 0);
  let r = plan(qs, p, morning, 2);
  assert.deepEqual(
    r.map((x) => [x.at.getDate(), x.at.getHours()]),
    [
      [11, 19],
      [11, 22],
      [12, 19],
      [12, 22],
    ],
  );
  for (let i = 0; i < GOAL; i++) p = answer(p, `q${i}`, true, 0, HOY).progress;
  r = plan(qs, p, morning, 2);
  assert.deepEqual(r.map((x) => x.at.getDate()), [12, 12]);
});

test('recordatorios: racha en peligro y nada en el pasado', () => {
  const p = { ...fresh(HOY), streak: 6, best: 6, goalDay: '2026-10-10', answered: 2 };
  const night = new Date(2026, 9, 11, 20, 0);
  const r = plan([], p, night, 1);
  assert.equal(r.length, 1);
  assert.equal(r[0].title, '⚠️ Your 6-day streak ends at midnight');
  assert.equal(r[0].body, '3 questions keep the flame alive.');
  assert.deepEqual(plan([], { ...p, reminder: { ...p.reminder, on: false } }, night), []);
});
