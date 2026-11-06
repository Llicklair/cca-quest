// Las preguntas de respuesta múltiple ("select 2"): bien formadas, sin pistas que regalen las
// buenas, en los dos idiomas, y metidas en las rondas y el simulacro nivel examen sin tocar los fijos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BANK, LEVEL_BANK } from '../src/bank.ts';
import { DOMAINS, SETTINGS, fixedExams, levelExam, roundPool, type Question, type QuestionText } from '../src/game.ts';
import { QUESTIONS } from '../src/questions.ts';
import { EXAM_LEVEL } from '../src/questions-exam.ts';
import { EXAM_LEVEL_MULTI, EXAM_LEVEL_MULTI_ES } from '../src/questions-exam-multi.ts';
import { MULTI, MULTI_ES } from '../src/questions-multi.ts';

const SETS: [string, Question[], Record<string, QuestionText>, number][] = [
  ['banco', MULTI, MULTI_ES, 2],
  ['nivel examen', EXAM_LEVEL_MULTI, EXAM_LEVEL_MULTI_ES, 1],
];

for (const [name, qs, es, perSetting] of SETS) {
  test(`${name}: ${perSetting} por escenario, 5 opciones y 2 buenas`, () => {
    for (const s of Object.keys(SETTINGS)) assert.equal(qs.filter((q) => q.setting === s).length, perSetting, s);
    for (const q of qs) {
      assert.equal(q.options.length, 5, q.id);
      assert.equal(q.why.length, 5, q.id);
      assert.equal(q.answers?.length, 2, q.id);
      assert.deepEqual([...q.answers!].sort(), q.answers, `${q.id}: answers en orden`);
      assert.equal(q.answer, q.answers![0], `${q.id}: answer es la primera buena`);
      assert.ok(q.answers!.every((a) => a >= 0 && a < 5), q.id);
      assert.equal(new Set(q.options).size, 5, `${q.id}: opciones repetidas`);
      assert.match(q.ask, /TWO/, `${q.id}: la pregunta dice cuántas elegir`);
      const domain = DOMAINS.find((d) => d.id === q.domain)!;
      assert.match(q.ts ?? '', new RegExp(`^${domain.n}\\.[1-7]$`), `${q.id}: task ${q.ts} no es del dominio ${domain.n}`);
    }
  });

  test(`${name}: las dos buenas no son casi siempre las dos más largas`, () => {
    const hits = qs.filter((q) => {
      const top = q.options
        .map((o, i) => [o.length, i])
        .sort((a, b) => b[0] - a[0])
        .slice(0, 2)
        .map(([, i]) => i);
      return q.answers!.every((a) => top.includes(a));
    });
    assert.ok(hits.length / qs.length <= 0.34, `${hits.length}/${qs.length}: ${hits.map((q) => q.id).join(', ')}`);
  });

  test(`${name}: todas traducidas, con las opciones en el mismo orden`, () => {
    assert.equal(Object.keys(es).length, qs.length);
    for (const q of qs) {
      const t = es[q.id];
      assert.ok(t, `${q.id}: sin traducción`);
      assert.equal(t.options.length, 5, q.id);
      assert.equal(t.why.length, 5, q.id);
      assert.match(t.ask, /DOS/, q.id);
      for (const s of [t.scenario, t.ask, t.rule, ...t.options, ...t.why]) {
        assert.ok(s.trim().length > 0, q.id);
        assert.equal(s.split('`').length % 2, 1, `${q.id}: comillas invertidas sin cerrar`);
      }
    }
  });
}

test('las del banco caben en el móvil como el resto', () => {
  for (const q of MULTI) {
    assert.ok(q.scenario.length <= 420, `${q.id}: escenario de ${q.scenario.length}`);
    for (const o of q.options) assert.ok(o.length <= 170, `${q.id}: opción de ${o.length}`);
  }
});

test('las de nivel examen son largas como las demás de su simulacro', () => {
  for (const q of EXAM_LEVEL_MULTI) {
    assert.ok(q.scenario.length >= 550 && q.scenario.length <= 950, `${q.id}: escenario de ${q.scenario.length}`);
    const len = q.options.map((o) => o.length);
    for (const n of len) assert.ok(n >= 160 && n <= 300, `${q.id}: opción de ${n}`);
    assert.ok(Math.max(...len) / Math.min(...len) <= 1.4, `${q.id}: opciones muy desiguales`);
  }
});

test('ids únicos en todo el banco', () => {
  const ids = [...BANK, ...LEVEL_BANK].map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('entran en las rondas y en el simulacro nivel examen, pero no en los fijos', () => {
  const fresh = { cards: {} } as Parameters<typeof roundPool>[2];
  const pool = roundPool(BANK, LEVEL_BANK, fresh);
  for (const q of MULTI) assert.ok(pool.includes(q), q.id);
  const level = levelExam(LEVEL_BANK);
  assert.equal(level.length, EXAM_LEVEL.length + EXAM_LEVEL_MULTI.length);
  for (const q of EXAM_LEVEL_MULTI) assert.ok(level.includes(q), q.id);
  const fixed = fixedExams(QUESTIONS).flat();
  assert.ok(fixed.every((q) => !q.answers), 'los fijos siguen siendo de una respuesta');
});
