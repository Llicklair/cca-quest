// Las preguntas nivel examen: tan completas como el resto, de verdad más largas, sin pistas que
// regalen la respuesta, en los dos idiomas, y fuera de las rondas hasta que se ven en su simulacro.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DOMAINS,
  EXAM,
  EXAM_LEVEL_60_LABEL,
  EXAM_LEVEL_LABEL,
  SETTINGS,
  examResult,
  levelExam,
  roundPool,
  scoreOf,
  type Progress,
} from '../src/game.ts';
import { LEVEL_BANK, LEVEL_BANK_60 } from '../src/bank.ts';
import { QUESTIONS } from '../src/questions.ts';
import { EXAM_LEVEL } from '../src/questions-exam.ts';
import { EXAM_LEVEL_ES } from '../src/questions-exam-es.ts';

const TS = [7, 5, 6, 6, 6].flatMap((n, d) => Array.from({ length: n }, (_, i) => `${d + 1}.${i + 1}`));

test('10 preguntas por escenario, completas y con ids que no chocan con el banco', () => {
  for (const s of Object.keys(SETTINGS)) {
    assert.equal(EXAM_LEVEL.filter((q) => q.setting === s).length, EXAM.levelPerScenario, s);
  }
  const ids = [...QUESTIONS, ...EXAM_LEVEL].map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const q of EXAM_LEVEL) {
    assert.equal(q.options.length, 4, q.id);
    assert.equal(q.why.length, 4, q.id);
    assert.ok(q.answer >= 0 && q.answer < 4, q.id);
    const domain = DOMAINS.find((d) => d.id === q.domain);
    assert.ok(domain, q.id);
    assert.match(q.ts ?? '', new RegExp(`^${domain.n}\\.[1-7]$`), `${q.id}: task ${q.ts} no es del dominio ${domain.n}`);
    assert.equal(new Set(q.options).size, 4, `${q.id}: opciones repetidas`);
    for (const s of [q.scenario, q.ask, q.rule, ...q.why]) assert.ok(s.trim().length > 0, q.id);
  }
});

test('nivel real de 60: 10 por escenario con una de elegir 2, en 2 h', () => {
  const exam = levelExam(LEVEL_BANK_60);
  assert.equal(exam.length, 60);
  for (const s of Object.keys(SETTINGS)) {
    assert.equal(exam.filter((q) => q.setting === s).length, EXAM.levelPerScenario, s);
    assert.equal(exam.filter((q) => q.setting === s && q.answers).length, 1, `${s}: una de elegir 2`);
  }
  assert.equal(exam.length * EXAM.secsPerQuestion, 7200);
});

test('nivel real completo: las 66, 11 por escenario, y el de 60 sale de ellas', () => {
  const exam = levelExam(LEVEL_BANK);
  assert.equal(exam.length, 66);
  for (const s of Object.keys(SETTINGS)) assert.equal(exam.filter((q) => q.setting === s).length, 11, s);
  assert.equal(exam.length * EXAM.secsPerQuestion, 7920);
  assert.ok(LEVEL_BANK_60.every((q) => LEVEL_BANK.includes(q)));
  const out = LEVEL_BANK.filter((q) => !LEVEL_BANK_60.includes(q));
  assert.equal(out.length, 6);
  for (const s of Object.keys(SETTINGS)) assert.equal(out.filter((q) => q.setting === s && !q.answers).length, 1, `${s}: se queda fuera una larga`);
});

test('nivel real de 60: cubre todos los task statements y sigue el peso de cada dominio', () => {
  const exam = levelExam(LEVEL_BANK_60);
  for (const ts of TS) assert.ok(exam.some((q) => q.ts === ts), `sin pregunta nivel examen para ${ts}`);
  const expected: Record<string, number> = {};
  DOMAINS.forEach((d, k) => (expected[d.id] = [16, 11, 12, 12, 9][k]));
  for (const d of DOMAINS) {
    const n = exam.filter((q) => q.domain === d.id).length;
    assert.equal(n, expected[d.id], d.id);
    const share = (100 * n) / exam.length;
    assert.ok(Math.abs(share - d.weight) <= 2, `${d.id}: ${share.toFixed(1)}% frente a ${d.weight}%`);
  }
});

test('son largas como las del examen, pero caben en el móvil', () => {
  for (const q of EXAM_LEVEL) {
    assert.ok(q.scenario.length >= 550 && q.scenario.length <= 950, `${q.id}: escenario de ${q.scenario.length} caracteres`);
    const len = q.options.map((o) => o.length);
    for (const n of len) assert.ok(n >= 160 && n <= 300, `${q.id}: opción de ${n} caracteres`);
    assert.ok(Math.max(...len) / Math.min(...len) <= 1.4, `${q.id}: opciones muy desiguales (${len.join('/')})`);
  }
  const words = (qs: typeof QUESTIONS) =>
    qs.reduce((n, q) => n + [q.scenario, q.ask, ...q.options].join(' ').split(/\s+/).length, 0) / qs.length;
  assert.ok(words(EXAM_LEVEL) >= 1.6 * words(QUESTIONS), `${words(EXAM_LEVEL).toFixed(0)} palabras de media frente a ${words(QUESTIONS).toFixed(0)}`);
});

for (const [name, pick] of [
  ['larga', Math.max],
  ['corta', Math.min],
] as const) {
  test(`la buena no es casi siempre la más ${name}`, () => {
    const hits = EXAM_LEVEL.filter((q) => {
      const len = q.options.map((o) => o.length);
      return len[q.answer] === pick(...len);
    });
    assert.ok(hits.length / EXAM_LEVEL.length <= 0.4, `la correcta es la más ${name} en ${hits.length}/${EXAM_LEVEL.length}`);
  });
}

test('todas están traducidas, con las opciones en el mismo orden', () => {
  assert.equal(Object.keys(EXAM_LEVEL_ES).length, EXAM_LEVEL.length);
  for (const q of EXAM_LEVEL) {
    const t = EXAM_LEVEL_ES[q.id];
    assert.ok(t, `${q.id}: sin traducción`);
    assert.equal(t.options.length, 4, q.id);
    assert.equal(t.why.length, 4, q.id);
    for (const s of [t.scenario, t.ask, t.rule, ...t.options, ...t.why]) assert.ok(s.trim().length > 0, q.id);
    for (const s of [q.scenario, ...q.options, t.scenario, ...t.options]) assert.equal(s.split('`').length % 2, 1, `${q.id}: comillas invertidas sin cerrar`);
  }
});

test('el simulacro va agrupado por escenario y siempre en el mismo orden', () => {
  const exam = levelExam(EXAM_LEVEL);
  assert.equal(exam.length, EXAM_LEVEL.length);
  assert.deepEqual(
    exam.map((q) => q.id),
    levelExam(EXAM_LEVEL).map((q) => q.id),
  );
  const order = exam.map((q) => q.setting).filter((s, k, a) => s !== a[k - 1]);
  assert.deepEqual(order, Object.keys(SETTINGS));
});

test('las de nivel examen entran en las rondas solo cuando ya han salido en su simulacro', () => {
  const [seen, unseen] = EXAM_LEVEL;
  const p = { cards: { [seen.id]: { box: 1, due: '2026-10-14', seen: 1, right: 0 } } } as unknown as Progress;
  const pool = roundPool(QUESTIONS, EXAM_LEVEL, p);
  assert.equal(pool.length, QUESTIONS.length + 1);
  assert.ok(pool.includes(seen));
  assert.ok(!pool.includes(unseen));
});

test('la nota de los dos simulacros reales pondera por dominio con el banco de verdad', () => {
  for (const [label, bank] of [
    [EXAM_LEVEL_60_LABEL, LEVEL_BANK_60],
    [EXAM_LEVEL_LABEL, LEVEL_BANK],
  ] as const) {
    const qs = levelExam(bank);
    const right = (q: (typeof qs)[number]) => (q.answers ? q.answers.reduce((m, i) => m | (1 << i), 0) : q.answer);
    const all = examResult(qs.map((q) => ({ q, picked: right(q) })), '2026-10-10', 1, label);
    assert.equal(scoreOf(all), 1);
    for (const d of DOMAINS) {
      const r = examResult(qs.map((q) => ({ q, picked: q.domain === d.id ? null : right(q) })), '2026-10-10', 1, label);
      assert.ok(Math.abs(scoreOf(r) - (1 - d.weight / 100)) < 1e-12, `${label} ${d.id}`);
    }
  }
});
