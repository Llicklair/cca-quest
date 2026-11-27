// La calibración: dos tandas de 20 preguntas nuevas con trampas del examen real. Que estén bien
// formadas en los dos idiomas, que no salgan en ningún otro sitio, que no se puedan acertar por cómo
// están escritas y que el informe cuente bien seguridad, trampas y gemelas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BANK, BANK_ES, CALIBRATION, LEVEL_BANK } from '../src/bank.ts';
import { TRAPS, calibReport, canCheck, marked, trapOf } from '../src/calibration.ts';
import {
  CALIBRATION_LABELS,
  DOMAINS,
  SETTINGS,
  examResult,
  firstScore,
  fresh,
  isRepeat,
  isWeighted,
  savedSlots,
  scoreOf,
  type Question,
  type Trap,
} from '../src/game.ts';
import { CALIBRATION_A, CALIBRATION_B, CALIBRATION_ES } from '../src/questions-calibration.ts';

const FORMS = [CALIBRATION_A, CALIBRATION_B];
const ALL = FORMS.flat();
const ticksOk = (s: string) => s.split('`').length % 2 === 1;

test('dos tandas de 20, por etiqueta, ponderadas como el nivel real', () => {
  assert.deepEqual(Object.keys(CALIBRATION), [...CALIBRATION_LABELS]);
  assert.equal(CALIBRATION['calibration A'], CALIBRATION_A);
  assert.equal(CALIBRATION['calibration B'], CALIBRATION_B);
  for (const label of CALIBRATION_LABELS) assert.ok(isWeighted(label), label);
  for (const form of FORMS) assert.equal(form.length, 20);
});

test('cada tanda: 4 escenarios de 5 seguidos y el reparto por dominio de la guía', () => {
  for (const form of FORMS) {
    const settings = [...new Set(form.map((q) => q.setting))];
    assert.equal(settings.length, 4);
    settings.forEach((s, k) => {
      assert.ok(s && s in SETTINGS);
      // Agrupadas por escenario, como el examen: las 5 de cada uno, seguidas.
      assert.ok(form.slice(5 * k, 5 * k + 5).every((q) => q.setting === s), `${s} no va seguido`);
    });
    const want = [5, 4, 4, 4, 3];
    DOMAINS.forEach((d, k) => assert.equal(form.filter((q) => q.domain === d.id).length, want[k], d.id));
    assert.ok(new Set(form.map((q) => q.ts)).size >= 15, 'pocas task statements distintas');
  }
});

test('nunca vistas: ni en las rondas, ni en el repaso, ni en los otros simulacros', () => {
  const elsewhere = new Set([...BANK, ...LEVEL_BANK].map((q) => q.id));
  const ids = ALL.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const q of ALL) assert.ok(!elsewhere.has(q.id), `${q.id} sale también en otro sitio`);
});

test('cada pregunta está completa, con su trampa por opción y su pista dentro del caso', () => {
  for (const q of ALL) {
    assert.equal(q.options.length, 4, q.id);
    assert.equal(q.why.length, 4, q.id);
    assert.equal(new Set(q.options).size, 4, q.id);
    assert.equal(q.answers, undefined, `${q.id}: de una respuesta`);
    const domain = DOMAINS.find((d) => d.id === q.domain);
    assert.ok(domain, q.id);
    assert.match(q.ts ?? '', new RegExp(`^${domain.n}\\.[1-7]$`), q.id);
    assert.ok(q.clue && q.scenario.includes(q.clue), `${q.id}: la pista no está en el caso`);
    if (q.twist) assert.ok(q.ask.includes(q.twist), `${q.id}: el giro no está en la pregunta`);
    assert.equal(q.traps?.length, 4, q.id);
    q.traps!.forEach((t, i) => {
      if (i === q.answer) assert.equal(t, null, `${q.id}: la buena no lleva trampa`);
      else assert.ok(t && t in TRAPS, `${q.id}: opción ${i} sin trampa válida`);
    });
    for (const s of [q.scenario, q.ask, q.rule, ...q.options, ...q.why]) {
      assert.ok(s.trim().length > 0, q.id);
      assert.ok(ticksOk(s), `${q.id}: comillas invertidas sin cerrar`);
    }
    assert.ok(q.scenario.length >= 250 && q.scenario.length <= 950, `${q.id}: caso de ${q.scenario.length}`);
    for (const o of q.options) assert.ok(o.length >= 80 && o.length <= 300, `${q.id}: opción de ${o.length}`);
  }
});

test('la traducción está entera, con su pista y su giro dentro del texto en español', () => {
  assert.equal(Object.keys(CALIBRATION_ES).length, ALL.length);
  for (const q of ALL) {
    const t = CALIBRATION_ES[q.id];
    assert.ok(t, `${q.id}: sin traducir`);
    assert.equal(BANK_ES[q.id], t, `${q.id}: no está en BANK_ES`);
    assert.equal(t.options.length, 4, q.id);
    assert.equal(t.why.length, 4, q.id);
    assert.ok(t.clue && t.scenario.includes(t.clue), `${q.id}: la pista en español no está en el caso`);
    assert.equal(Boolean(t.twist), Boolean(q.twist), `${q.id}: giro en un idioma y no en el otro`);
    if (t.twist) assert.ok(t.ask.includes(t.twist), `${q.id}: el giro en español no está en la pregunta`);
    for (const s of [t.scenario, t.ask, t.rule, ...t.options, ...t.why]) {
      assert.ok(s.trim().length > 0, q.id);
      assert.ok(ticksOk(s), `${q.id}: comillas invertidas sin cerrar`);
    }
  }
});

test('las trampas del examen real: en negativo, primer paso, gemelas y pistas que descartan', () => {
  for (const form of FORMS) {
    const negative = form.filter((q) => q.traps?.includes('negation'));
    assert.ok(negative.length >= 5, `solo ${negative.length} en negativo`);
    for (const q of negative) {
      assert.ok(q.twist, `${q.id}: en negativo sin giro`);
      assert.ok(q.traps!.every((t, i) => i === q.answer || t === 'negation'), `${q.id}: las malas de una en negativo son arreglos válidos`);
    }
    // El examen no sabemos cómo lo marca: unas en mayúsculas y otras no.
    assert.ok(negative.some((q) => q.twist === q.twist!.toUpperCase()));
    assert.ok(negative.some((q) => q.twist !== q.twist!.toUpperCase()));
    assert.ok(form.some((q) => q.traps?.includes('order')), 'sin pregunta de primer paso');
    assert.ok(form.filter((q) => q.traps?.includes('ignored-clue')).length >= 6, 'pocas con pista que descarta');
  }
});

test('las gemelas: mismo caso con una frase cambiada, mismas opciones y otra buena, separadas', () => {
  for (const form of FORMS) {
    const twins = form.filter((q) => q.pair);
    assert.ok(twins.length >= 4, 'cada tanda tiene al menos dos parejas');
    for (const q of twins) {
      const t = form.find((x) => x.id === q.pair);
      assert.ok(t, `${q.id}: su gemela no está en la misma tanda`);
      assert.equal(t.pair, q.id, q.id);
      assert.equal(t.setting, q.setting, q.id);
      assert.deepEqual(t.options, q.options, `${q.id}: opciones distintas`);
      assert.deepEqual(CALIBRATION_ES[t.id].options, CALIBRATION_ES[q.id].options, `${q.id}: opciones en español distintas`);
      assert.notEqual(t.answer, q.answer, `${q.id}: misma buena`);
      assert.ok(Math.abs(form.indexOf(t) - form.indexOf(q)) > 1, `${q.id}: la gemela va justo al lado`);
    }
  }
});

// Un contestador que no sabe nada: prefiere las opciones con vocabulario de la guía y evita las
// palabras que en el banco solo salen en las malas. Al azar acierta el 25 %.
const RED = [/\balways\b/i, /\bnever\b/i, /\bevery\b/i, /\ball\b/i, /\bfixed\b/i, /\bkeyword/i, /\bregex/i, /\blarger\b/i, /\bbigger\b/i, /\bincrease\b/i, /\braise\b/i, /\bmore (retries|tokens|examples)\b/i, /\bmaximum\b/i, /\btrain\b/i, /\bclassifier\b/i, /\bfine-?tun/i, /\bmanual(ly)?\b/i, /\bseparate\b/i, /\bnew (server|service|agent|subagent|pipeline)\b/i, /\bmajority\b/i, /\bvot(e|ing)\b/i, /\bsentiment\b/i, /\bconfidence (score|threshold)\b/i, /\bremind\b/i, /\bwhole\b/i, /\bentire\b/i, /\bwindow\b/i, /\brepeat\b/i, /\blonger\b/i, /\bwhenever\b/i, /\bdisable\b/i, /\bremove\b/i, /\bskip\b/i];
const GUIDE = [/stop_reason/, /\bhooks?\b/i, /PreToolUse|PostToolUse/, /tool_choice/, /\bstructured\b/i, /isError|errorCategory|isRetryable/, /\bschema\b/i, /few-shot|\bexamples?\b/i, /\bexplicit\b/i, /\bcriteria\b/i, /plan mode/i, /CLAUDE\.md/, /\.claude\/rules|\bpaths?\b/i, /\bskills?\b/i, /context: fork/, /\bBatch(es)?\b/, /custom_id/, /\bprovenance\b|\bsource\b/i, /\bscratchpad\b/i, /\bcase facts\b/i, /\bescalat/i, /\bgates?\b/i, /\bprogrammatic/i, /\bvalidat/i, /\bspecific\b/i, /\bonly\b/i, /\bwhile\b/i, /\bunless\b/i, /\bwhen\b/i];
const blind = (q: Question) => {
  const count = (s: string, rx: RegExp[]) => rx.reduce((n, r) => n + (r.test(s) ? 1 : 0), 0);
  const score = q.options.map((o) => count(o, GUIDE) - count(o, RED));
  const best = Math.max(...score);
  const ties = score.map((x, i) => (x === best ? i : -1)).filter((i) => i >= 0);
  return ties.includes(q.answer) ? 1 / ties.length : 0;
};

test('no se aciertan por cómo están escritas: ni por palabras ni por la más larga', () => {
  for (const form of FORMS) {
    const hits = form.reduce((n, q) => n + blind(q), 0) / form.length;
    assert.ok(hits <= 0.35, `el contestador ciego acierta el ${Math.round(100 * hits)} %`);
    const longest = form.filter((q) => {
      const len = q.options.map((o) => o.length);
      return len[q.answer] === Math.max(...len);
    });
    assert.ok(longest.length <= 6, `la buena es la más larga en ${longest.map((q) => q.id).join(', ')}`);
    for (const q of form) {
      const len = q.options.map((o) => o.length);
      assert.ok(Math.max(...len) / Math.min(...len) <= 1.6, `${q.id}: opciones de longitudes ${len.join('/')}`);
    }
  }
});

// --- La lógica del informe, con preguntas de juguete ---

const toy = (id: string, answer: number, traps: (Trap | null)[], pair?: string): Question => ({
  id,
  domain: 'agentic',
  setting: 'support',
  ts: '1.1',
  scenario: 'case',
  ask: 'ask',
  options: ['a', 'b', 'c', 'd'],
  answer,
  why: ['', '', '', ''],
  rule: '',
  traps,
  pair,
});
const neg = toy('neg', 0, [null, 'negation', 'negation', 'negation']);
const first = toy('first', 1, ['order', null, 'capacity', 'order']);
const twinA = toy('twin-a', 2, ['underforce', 'overforce', null, 'ignored-clue'], 'twin-b');
const twinB = toy('twin-b', 1, ['underforce', null, 'overforce', 'ignored-clue'], 'twin-a');

test('trapOf: la trampa de lo que elegiste, nada si acertaste o no contestaste', () => {
  assert.equal(trapOf(neg, 2), 'negation');
  assert.equal(trapOf(neg, 0), null);
  assert.equal(trapOf(neg, null), null);
  assert.equal(trapOf(neg, undefined), null);
  assert.equal(trapOf(first, 2), 'capacity');
});

test('canCheck: solo se corrige con la respuesta completa y seguro o dudo marcado antes', () => {
  assert.equal(canCheck(neg, 1, true), true);
  assert.equal(canCheck(neg, 0, false), true);
  assert.equal(canCheck(neg, 1, null), false); // sin marcar la seguridad, no
  assert.equal(canCheck(neg, 1, undefined), false);
  assert.equal(canCheck(neg, null, true), false); // sin contestar, no
  // en las de elegir 2, solo con las dos marcadas (máscara de bits)
  const two: Question = { ...neg, id: 'two', answers: [0, 2] };
  assert.equal(canCheck(two, 0b0001, true), false);
  assert.equal(canCheck(two, 0b0101, true), true);
});

test('calibReport: seguridad frente a acierto, trampas de la más repetida y gemelas', () => {
  const r = calibReport([
    { q: neg, picked: 1, sure: true, n: 1 }, // fallada estando seguro
    { q: first, picked: 0, sure: true, n: 2 }, // fallada estando seguro
    { q: twinA, picked: 2, sure: false, n: 3 }, // acertada dudando
    { q: toy('neg2', 0, [null, 'negation', 'negation', 'negation']), picked: 3, sure: false, n: 4 },
    { q: twinB, picked: 2, n: 5 }, // sin marcar, fallada
    { q: toy('blank', 0, [null, 'capacity', 'capacity', 'capacity']), picked: null, sure: true, n: 6 }, // sin contestar
  ]);
  assert.deepEqual(r.sureWrong, [1, 2]);
  assert.deepEqual(r.unsureRight, [3]);
  assert.equal(r.unmarked, 1);
  assert.deepEqual(r.traps[0], { trap: 'negation', n: [1, 4] });
  assert.deepEqual(
    r.traps.map((t) => t.trap),
    ['negation', 'order', 'overforce'],
  );
  assert.deepEqual(r.pairs, [{ a: 3, b: 5, okA: true, okB: false }]);
});

test('marked: trocea el texto con las frases resaltadas, todas sus apariciones', () => {
  assert.deepEqual(marked('Which is NOT a fix? NOT this.', ['NOT']), [
    { text: 'Which is ', on: false },
    { text: 'NOT', on: true },
    { text: ' a fix? ', on: false },
    { text: 'NOT', on: true },
    { text: ' this.', on: false },
  ]);
  assert.deepEqual(marked('abc', [undefined, '']), [{ text: 'abc', on: false }]);
  assert.deepEqual(marked('the `--bare` flag', ['`--bare` flag']), [
    { text: 'the ', on: false },
    { text: '`--bare` flag', on: true },
  ]);
  // Si se solapan, gana la que empieza antes.
  assert.deepEqual(marked('abcdef', ['bcd', 'cde']), [
    { text: 'a', on: false },
    { text: 'bcd', on: true },
    { text: 'ef', on: false },
  ]);
});

test('se guarda si estabas seguro y solo cuenta el primer intento', () => {
  const saved = savedSlots([
    { q: neg, order: [0, 1, 2, 3], picked: 1, sure: true },
    { q: first, order: [0, 1, 2, 3], picked: 1, sure: false },
    { q: twinA, order: [0, 1, 2, 3], picked: 2, sure: null },
  ]);
  assert.equal(saved[0].sure, true);
  assert.equal(saved[1].sure, false);
  assert.ok(!('sure' in saved[2]));

  const p = fresh('2026-11-26');
  const old = { ...examResult([{ q: neg, picked: 1 }], '2026-11-01', 60, 'calibration A') };
  const again = { ...examResult([{ q: neg, picked: 0 }], '2026-11-20', 60, 'calibration A') };
  const withBoth = { ...p, exams: [again, old] };
  assert.equal(firstScore(withBoth, 'calibration A'), scoreOf(old));
  assert.equal(firstScore(withBoth, 'calibration B'), null);
  assert.equal(isRepeat(withBoth, again), true);
  assert.equal(isRepeat(withBoth, old), false);
});
