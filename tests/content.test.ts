// Lecciones, fichas y glosario: completos en los dos idiomas y enganchados a las preguntas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DOMAINS, type Bi } from '../src/game.ts';
import { FLASHCARDS } from '../src/flashcards.ts';
import { TERMS } from '../src/glossary.ts';
import { LESSONS } from '../src/lessons.ts';
import { QUESTIONS } from '../src/questions.ts';

// Task statements de la guía oficial: 7, 5, 6, 6 y 6 por dominio.
const TS = [7, 5, 6, 6, 6].flatMap((n, d) => Array.from({ length: n }, (_, i) => `${d + 1}.${i + 1}`));

const ok = (b: Bi, where: string) => {
  for (const lang of ['en', 'es'] as const) {
    assert.ok(b[lang].trim().length > 0, `${where}: falta ${lang}`);
    assert.equal(b[lang].split('`').length % 2, 1, `${where}: comillas invertidas sin cerrar en ${lang}`);
  }
};

test('una lección por cada task statement, en orden', () => {
  assert.deepEqual(
    LESSONS.map((l) => l.ts),
    TS,
  );
});

test('las lecciones están completas en inglés y español', () => {
  for (const l of LESSONS) {
    for (const b of [l.title, l.tldr, l.example, ...l.ideas, ...l.traps]) ok(b, `lección ${l.ts}`);
    assert.ok(l.ideas.length >= 3 && l.traps.length >= 2, `lección ${l.ts}: pocas ideas o trampas`);
  }
});

test('cada lección tiene preguntas para practicarla', () => {
  for (const ts of TS) assert.ok(QUESTIONS.some((q) => q.ts === ts), `sin preguntas para ${ts}`);
});

test('fichas: ids únicos, de una tarea que existe y completas', () => {
  assert.equal(new Set(FLASHCARDS.map((f) => f.id)).size, FLASHCARDS.length);
  const questionIds = new Set(QUESTIONS.map((q) => q.id));
  for (const f of FLASHCARDS) {
    assert.ok(TS.includes(f.ts), f.id);
    assert.ok(f.id.startsWith(`f-${f.ts}-`), f.id);
    assert.ok(!questionIds.has(f.id), `${f.id} choca con una pregunta`);
    ok(f.front, f.id);
    ok(f.back, f.id);
  }
  for (const ts of TS) assert.ok(FLASHCARDS.some((f) => f.ts === ts), `sin fichas para ${ts}`);
});

test('cada pregunta tiene su traducción completa y en el mismo orden', async () => {
  const { QUESTIONS_ES } = await import('../src/questions-es.ts');
  for (const q of QUESTIONS) {
    const t = QUESTIONS_ES[q.id];
    assert.ok(t, `${q.id}: sin traducir`);
    assert.equal(t.options.length, q.options.length, q.id);
    assert.equal(t.why.length, q.why.length, q.id);
    for (const s of [t.scenario, t.ask, t.rule, ...t.options, ...t.why]) {
      assert.ok(s.trim().length > 0, `${q.id}: texto vacío`);
      assert.equal(s.split('`').length % 2, 1, `${q.id}: comillas invertidas sin cerrar`);
    }
  }
  assert.equal(Object.keys(QUESTIONS_ES).length, QUESTIONS.length);
});

test('glosario: cada término una vez y de un dominio válido', () => {
  const keys = TERMS.map((t) => t.term.toLowerCase().replace(/[^a-z0-9]/g, ''));
  assert.equal(new Set(keys).size, keys.length);
  for (const t of TERMS) {
    assert.ok(DOMAINS.some((d) => d.id === t.domain), t.term);
    ok(t.def, t.term);
  }
});
