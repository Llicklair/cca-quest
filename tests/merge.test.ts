// Juntar el progreso del móvil y del PC: no se pierde ninguna respuesta y gana lo más reciente.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { answer, fresh, readLesson, type Progress } from '../src/game.ts';
import { canonical, merge, sameShared, shared } from '../src/merge.ts';

const HOY = '2026-10-20';
const AYER = '2026-10-19';

const at = (p: Progress, stamp: number): Progress => ({ ...p, stamp });

test('un PC recién abierto se queda con todo lo del móvil', () => {
  let movil = fresh(HOY);
  movil = answer(movil, 'q1', true, 0, HOY, 0).progress;
  movil = answer(movil, 'q2', false, 1, HOY, 2).progress;
  movil = at({ ...movil, lang: 'es' }, 100);

  const pc = merge(fresh(HOY), shared(movil));
  assert.deepEqual(shared(pc), shared(movil));
});

test('los avisos son de cada dispositivo y no viajan', () => {
  const movil = at({ ...fresh(HOY), reminder: { on: true, hour: 8, minute: 0 } }, 200);
  const pc = at({ ...fresh(HOY), reminder: { on: false, hour: 19, minute: 30 } }, 100);
  assert.equal('reminder' in shared(movil), false);
  assert.deepEqual(merge(pc, shared(movil)).reminder, pc.reminder);
});

test('si se estudió en los dos sin sincronizar, se quedan todas las preguntas', () => {
  const base = at(answer(fresh(HOY), 'q1', true, 0, HOY).progress, 10);
  const movil = at(answer(base, 'q2', true, 0, HOY).progress, 20);
  const pc = at(answer(base, 'q3', false, 0, HOY).progress, 30);

  const m = merge(movil, shared(pc));
  assert.deepEqual(Object.keys(m.cards).sort(), ['q1', 'q2', 'q3']);
  assert.equal(m.xp, Math.max(movil.xp, pc.xp));
  assert.equal(m.history[HOY], 2); // el máximo de cada día, no la suma
});

test('de una misma pregunta gana la copia con más respuestas', () => {
  let movil = fresh(HOY);
  for (let i = 0; i < 3; i++) movil = answer(movil, 'q1', true, 0, HOY).progress;
  const pc = at(answer(fresh(HOY), 'q1', false, 0, HOY).progress, 999); // más reciente pero con menos historia

  assert.deepEqual(merge(at(movil, 1), shared(pc)).cards.q1, movil.cards.q1);
  assert.deepEqual(merge(pc, shared(at(movil, 1))).cards.q1, movil.cards.q1);
});

test('el idioma y el simulacro a medias vienen de la copia más reciente', () => {
  const draft = { label: 'quick', ids: ['q1'], orders: [[0, 1, 2, 3]], picked: [null], i: 0, elapsed: 40, limit: 120 };
  const movil = at({ ...fresh(HOY), lang: 'es' as const, examDraft: draft }, 50);
  const pc = at(fresh(HOY), 10);

  const enPc = merge(pc, shared(movil));
  assert.equal(enPc.lang, 'es');
  assert.deepEqual(enPc.examDraft, draft);

  // Terminar el simulacro en el PC lo quita también del móvil.
  const terminado = at({ ...enPc, examDraft: null }, 80);
  assert.equal(merge(movil, shared(terminado)).examDraft, null);
});

test('los contadores de hoy no se mezclan con los de ayer', () => {
  const ayer = at({ ...fresh(AYER), answered: 7, correct: 6 }, 10);
  const hoy = at({ ...fresh(HOY), answered: 2, correct: 1 }, 5);
  const m = merge(ayer, shared(hoy));
  assert.deepEqual([m.day, m.answered, m.correct], [HOY, 2, 1]);
});

test('la racha viene de la copia que cumplió la meta más tarde', () => {
  const a = at({ ...fresh(HOY), streak: 4, best: 9, goalDay: AYER }, 10);
  const b = at({ ...fresh(HOY), streak: 5, best: 5, goalDay: HOY }, 5);
  const m = merge(a, shared(b));
  assert.deepEqual([m.streak, m.goalDay, m.best], [5, HOY, 9]);
});

test('lecciones y simulacros se suman sin repetirse', () => {
  const a = at(readLesson(fresh(HOY), '1.1', AYER).progress, 10);
  const b = at(readLesson(readLesson(fresh(HOY), '1.1', HOY).progress, '2.3', HOY).progress, 20);
  const exam = { label: 'quick', day: AYER, right: 15, total: 20, secs: 900, byDomain: {} };
  const nuevo = { ...exam, day: HOY, right: 18 };

  const m = merge({ ...a, exams: [exam] }, shared({ ...b, exams: [nuevo, exam] }));
  assert.deepEqual(m.lessons, { '1.1': AYER, '2.3': HOY }); // se conserva el primer día de lectura
  assert.deepEqual(m.exams, [nuevo, exam]);
});

test('juntar dos veces da lo mismo: la sincronización se estabiliza', () => {
  const movil = at(answer(fresh(HOY), 'q1', true, 0, HOY).progress, 20);
  const pc = at(answer(fresh(HOY), 'q2', true, 0, HOY).progress, 30);
  const once = merge(movil, shared(pc));
  assert.ok(sameShared(shared(merge(once, shared(once))), shared(once)));
  assert.ok(sameShared(shared(merge(pc, shared(once))), shared(once)));
});

test('canonical no depende del orden de las claves', () => {
  assert.equal(canonical({ b: 1, a: { d: 2, c: [3, { f: 1, e: 0 }] } }), canonical({ a: { c: [3, { e: 0, f: 1 }], d: 2 }, b: 1 }));
});
