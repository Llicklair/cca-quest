// El banco de preguntas es el golden set de la app: estos tests vigilan que cada
// pregunta esté bien formada y que el conjunto no tenga pistas que regalen la respuesta.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DOMAINS, SETTINGS } from '../src/game.ts';
import { QUESTIONS } from '../src/questions.ts';

test('cada pregunta está completa', () => {
  for (const q of QUESTIONS) {
    assert.equal(q.options.length, 4, q.id);
    assert.equal(q.why.length, q.options.length, q.id);
    assert.ok(q.answer >= 0 && q.answer < q.options.length, q.id);
    const domain = DOMAINS.find((d) => d.id === q.domain);
    assert.ok(domain, q.id);
    if (q.ts) assert.match(q.ts, new RegExp(`^${domain.n}\\.[1-7]$`), `${q.id}: task ${q.ts} no es del dominio ${domain.n}`);
    if (q.setting) assert.ok(q.setting in SETTINGS, q.id);
    for (const s of [q.scenario, q.ask, q.rule, ...q.options, ...q.why]) assert.ok(s.trim().length > 0, q.id);
    assert.equal(new Set(q.options).size, q.options.length, `${q.id}: opciones repetidas`);
  }
});

test('ids únicos', () => {
  const ids = QUESTIONS.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('el reparto sigue el peso de cada dominio', () => {
  const total = QUESTIONS.length;
  for (const d of DOMAINS) {
    const share = (100 * QUESTIONS.filter((q) => q.domain === d.id).length) / total;
    assert.ok(Math.abs(share - d.weight) <= 4, `${d.id}: ${share.toFixed(1)}% frente a ${d.weight}%`);
  }
});

// Si la buena suele ser la más larga (o la más corta), se acierta sin entender nada.
for (const [name, pick] of [
  ['larga', Math.max],
  ['corta', Math.min],
] as const) {
  test(`la buena no es casi siempre la más ${name}`, () => {
    const hits = QUESTIONS.filter((q) => {
      const len = q.options.map((o) => o.length);
      return len[q.answer] === pick(...len);
    });
    assert.ok(
      hits.length / QUESTIONS.length <= 0.4,
      `la correcta es la más ${name} en ${hits.length}/${QUESTIONS.length}: ${hits.map((q) => q.id).join(', ')}`,
    );
  });
}

test('las opciones caben en una pantalla de móvil', () => {
  for (const q of QUESTIONS) {
    for (const o of q.options) assert.ok(o.length <= 170, `${q.id}: opción de ${o.length} caracteres`);
    assert.ok(q.scenario.length <= 420, `${q.id}: escenario de ${q.scenario.length} caracteres`);
  }
});
