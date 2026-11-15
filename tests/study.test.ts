// "Dónde fallo": todo tu historial contado para Claude, y todas las falladas en un solo mensaje.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { missesPrompt, studyPrompt } from '../src/ask.ts';
import { BANK } from '../src/bank.ts';
import { answer, examResult, fresh, isMulti, maskOf, type Progress, type Question } from '../src/game.ts';
import { QUESTIONS } from '../src/questions.ts';
import { recordItem, studyRecord } from '../src/study.ts';

const HOY = '2026-11-15';
const wrong = (q: Question) => (q.answer + 1) % q.options.length;
const strip = (x: string) => x.replace(/`/g, '');

// Tres preguntas de dominios y task statements distintos.
const a = QUESTIONS.find((q) => q.ts === '1.1')!;
const b = QUESTIONS.find((q) => q.ts === '2.1')!;
const c = QUESTIONS.find((q) => q.ts === '4.2')!;

function played(): Progress {
  let p = fresh(HOY);
  // a: bien, mal, mal → fallada la última vez. b: mal y luego bien → floja. c: bien dos veces → sólida.
  for (const [q, ok] of [[a, true], [a, false], [a, false], [b, false], [b, true], [c, true], [c, true]] as const)
    p = answer(p, q.id, ok, 0, HOY, ok ? q.answer : wrong(q)).progress;
  const exam = examResult(
    [a, b, c].map((q) => ({ q, picked: q === a ? wrong(q) : q.answer })),
    HOY,
    600,
    'quick',
  );
  return { ...p, exams: [exam] };
}

test('cada pregunta con su ficha: veces, aciertos, si la fallaste la última vez y qué elegiste', () => {
  const p = played();
  assert.deepEqual(
    (({ seen, right, lastWrong, last }) => ({ seen, right, lastWrong, last }))(recordItem(a, p, 'en')!),
    { seen: 3, right: 1, lastWrong: true, last: [wrong(a)] },
  );
  assert.equal(recordItem(b, p, 'en')?.lastWrong, false);
  assert.equal(recordItem(QUESTIONS[QUESTIONS.length - 1], p, 'en'), null, 'nunca contestada');
  // En las de respuesta múltiple, lo elegido es una máscara: salen las dos opciones.
  const multi = BANK.find(isMulti)!;
  const q = answer(fresh(HOY), multi.id, false, 0, HOY, maskOf([0, 2])).progress;
  assert.deepEqual(recordItem(multi, q, 'en')?.last, [0, 2]);
});

test('el historial: simulacros, dominios (en simulacros y en todo), task statements con su lección', () => {
  const r = studyRecord(played(), 'en');
  assert.equal(r.exams.length, 1);
  assert.equal(r.exams[0].label, 'quick');
  assert.equal(r.exams[0].score, 67);
  assert.deepEqual(r.items.map((x) => x.ts), ['1.1', '2.1', '4.2'], 'por task statement');
  const d1 = r.domains.find((d) => d.n === 1)!;
  assert.deepEqual(d1.exam, [0, 1]);
  assert.deepEqual(d1.all, [1, 3]);
  assert.deepEqual(r.tasks.map((x) => [x.ts, x.right, x.seen]), [['1.1', 1, 3], ['2.1', 1, 2], ['4.2', 2, 2]]);
  assert.ok(r.tasks[0].title.length > 0, 'el título de la lección');
});

test('dónde fallo: las falladas enteras, las flojas y las sólidas en una línea', () => {
  const prompt = studyPrompt('en', studyRecord(played(), 'en'));
  assert.ok(prompt.includes('1 practice exam and 3 different questions answered (7 answers in total'));
  assert.ok(prompt.includes('my weakest domains and task statements'));
  assert.ok(prompt.includes('=== QUESTIONS I GOT WRONG THE LAST TIME (1) ==='));
  assert.ok(prompt.includes(`[task 1.1] answered 3 times, 1 right`));
  assert.ok(prompt.includes(strip(a.scenario)), 'la fallada lleva su escenario');
  assert.ok(prompt.includes(`My last answer(s): ${'ABCD'[wrong(a)]}`));
  assert.ok(prompt.includes(`=== RIGHT THE LAST TIME, BUT I HAVE FAILED THEM BEFORE (1) ===\n- [task 2.1] 1/2 · ${strip(b.rule)}`));
  assert.ok(prompt.includes(`=== ALWAYS RIGHT (1) ===\n- [task 4.2] 2/2 · ${strip(c.rule)}`));
  assert.ok(!prompt.includes(strip(c.scenario)), 'las sólidas, sin escenario');
  assert.ok(prompt.includes('D1 Agentic Architecture & Orchestration (27% of the exam): in practice exams 0/1 (0%) · all practice 1/3 (33%)'));
  assert.ok(prompt.includes(`${HOY} · quick · 67% · 2/3`));
  assert.ok(!prompt.includes('`'));
});

test('dónde fallo sin nada aún, y en español', () => {
  const empty = studyPrompt('en', studyRecord(fresh(HOY), 'en'));
  assert.ok(empty.includes('(none yet)'));
  assert.ok(!empty.includes('WRONG THE LAST TIME'));
  const es = studyPrompt('es', studyRecord(played(), 'es'));
  assert.ok(es.startsWith('Estoy preparando'));
  assert.ok(es.includes('=== LAS QUE FALLÉ LA ÚLTIMA VEZ (1) ==='));
  assert.ok(es.includes('contestada 3 veces, 1 bien'));
  assert.ok(es.includes('rápido'), 'la etiqueta del simulacro, traducida');
});

test('todas las falladas a la vez: numeradas, con su escenario y tu última respuesta', () => {
  const p = played();
  const prompt = missesPrompt('en', [a, b].map((q) => recordItem(q, p, 'en')!));
  assert.ok(prompt.includes('These are the 2 questions I got wrong'));
  assert.ok(prompt.includes('\n1. [task 1.1] answered 3 times, 1 right\n'));
  assert.ok(prompt.includes('\n2. [task 2.1] answered 2 times, 1 right\n'));
  assert.ok(prompt.includes(strip(a.why[a.answer])), 'el porqué de la buena');
  const at = prompt.indexOf('Right answer(s)');
  assert.ok(at > 0 && prompt.indexOf('My last answer(s)') > at, 'tu respuesta después de la buena');
});
