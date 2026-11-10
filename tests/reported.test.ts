// Los temas que quien hizo el examen echó en falta: bien formados, en los dos idiomas, sin pistas
// que regalen la respuesta, dentro de las rondas y del repaso de su lección y fuera de los fijos 1–4.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BANK, BANK_ES } from '../src/bank.ts';
import { FLASHCARDS } from '../src/flashcards.ts';
import { DOMAINS, SETTINGS, fixedExams } from '../src/game.ts';
import { TERMS } from '../src/glossary.ts';
import { LESSONS } from '../src/lessons.ts';
import { QUESTIONS } from '../src/questions.ts';
import { REPORTED, REPORTED_ES } from '../src/questions-reported.ts';

const ticksOk = (s: string) => s.split('`').length % 2 === 1;

test('cada pregunta está completa y cabe en el móvil', () => {
  for (const q of REPORTED) {
    assert.equal(q.options.length, 4, q.id);
    assert.equal(q.why.length, 4, q.id);
    assert.ok(q.answer >= 0 && q.answer < 4, q.id);
    assert.equal(q.answers, undefined, `${q.id}: estas son de una respuesta`);
    const domain = DOMAINS.find((d) => d.id === q.domain);
    assert.ok(domain, q.id);
    assert.match(q.ts ?? '', new RegExp(`^${domain.n}\\.[1-7]$`), `${q.id}: task ${q.ts} no es del dominio ${domain.n}`);
    assert.ok(q.setting && q.setting in SETTINGS, q.id);
    assert.equal(new Set(q.options).size, 4, `${q.id}: opciones repetidas`);
    for (const s of [q.scenario, q.ask, q.rule, ...q.options, ...q.why]) {
      assert.ok(s.trim().length > 0, q.id);
      assert.ok(ticksOk(s), `${q.id}: comillas invertidas sin cerrar`);
    }
    assert.ok(q.scenario.length <= 420, `${q.id}: escenario de ${q.scenario.length}`);
    for (const o of q.options) assert.ok(o.length <= 170, `${q.id}: opción de ${o.length}`);
  }
});

test('cada pregunta tiene su traducción completa y en el mismo orden', () => {
  assert.equal(Object.keys(REPORTED_ES).length, REPORTED.length);
  for (const q of REPORTED) {
    const t = REPORTED_ES[q.id];
    assert.ok(t, `${q.id}: sin traducir`);
    assert.equal(t.options.length, q.options.length, q.id);
    assert.equal(t.why.length, q.why.length, q.id);
    for (const s of [t.scenario, t.ask, t.rule, ...t.options, ...t.why]) {
      assert.ok(s.trim().length > 0, `${q.id}: texto vacío`);
      assert.ok(ticksOk(s), `${q.id}: comillas invertidas sin cerrar`);
    }
  }
});

test('la buena no está siempre en el mismo sitio ni es casi siempre la más larga', () => {
  assert.ok(new Set(REPORTED.map((q) => q.answer)).size > 1);
  const longest = REPORTED.filter((q) => {
    const len = q.options.map((o) => o.length);
    return len[q.answer] === Math.max(...len);
  });
  assert.ok(longest.length <= REPORTED.length / 2, `la buena es la más larga en ${longest.map((q) => q.id).join(', ')}`);
});

test('entran en las rondas y en el repaso de su lección, pero no en los simulacros fijos', () => {
  const fixed = new Set(fixedExams(QUESTIONS).flat().map((q) => q.id));
  for (const q of REPORTED) {
    assert.ok(BANK.includes(q), q.id);
    assert.ok(BANK_ES[q.id], q.id);
    assert.ok(!QUESTIONS.includes(q), q.id);
    assert.ok(!fixed.has(q.id), q.id);
    assert.ok(BANK.filter((x) => x.ts === q.ts).includes(q), `${q.id}: no sale al practicar la ${q.ts}`);
  }
});

test('la lección 3.6, el glosario y las fichas cuentan --bare y --append-system-prompt', () => {
  const lesson = LESSONS.find((l) => l.ts === '3.6');
  assert.ok(lesson);
  const text = JSON.stringify(lesson);
  for (const flag of ['--bare', '--append-system-prompt']) {
    assert.ok(text.includes(flag), `la lección 3.6 no habla de ${flag}`);
    assert.ok(TERMS.some((t) => t.term === flag), `${flag} no está en el glosario`);
  }
  assert.ok(FLASHCARDS.some((f) => f.ts === '3.6' && f.back.en.includes('--bare')));
});
