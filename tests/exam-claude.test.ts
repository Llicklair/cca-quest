// Un simulacro entero a Claude en un solo mensaje, los simulacros ya hechos que se vuelven a abrir,
// tu chat de Claude (para mandarlo todo al mismo) y los niveles hasta el 1000.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chatUrl, claudeUrl, examPrompt, fitsUrl, type ExamItem } from '../src/ask.ts';
import { LEVEL_BANK } from '../src/bank.ts';
import { MAX_LEVEL, examResult, fresh, levelOf, replayExam, savedSlots, type ExamResult, type Question } from '../src/game.ts';
import { merge, sameShared, shared } from '../src/merge.ts';
import { QUESTIONS } from '../src/questions.ts';

const HOY = '2026-11-15';
const [q1, q2, q3] = QUESTIONS;
const item = (q: Question, n: number, ok: boolean, picked: number[] | null | undefined, extra: Partial<ExamItem> = {}): ExamItem => ({
  n,
  tx: q,
  rights: [q.answer],
  ok,
  picked,
  ts: q.ts,
  ...extra,
});
const wrongPick = (q: Question) => (q.answer + 1) % q.options.length;

test('simulacro entero: las falladas primero, cada una con su número, y luego las acertadas', () => {
  const prompt = examPrompt('en', 'exam 2 · 2026-11-15 · 67%', [
    item(q1, 1, true, [q1.answer]),
    item(q2, 2, false, [wrongPick(q2)], { flag: true, note: '  no idea  ' }),
    item(q3, 3, false, null),
  ]);
  assert.ok(prompt.startsWith("I'm preparing"));
  assert.ok(prompt.includes('(exam 2 · 2026-11-15 · 67%)'));
  const wrongAt = prompt.indexOf('=== WRONG (2) ===');
  const rightAt = prompt.indexOf('=== RIGHT (1) ===');
  assert.ok(wrongAt > 0 && rightAt > wrongAt, 'las falladas van antes');
  assert.ok(prompt.indexOf('\nQ2 ') > wrongAt && prompt.indexOf('\nQ3 ') > wrongAt && prompt.indexOf('\nQ1 ') > rightAt);
  assert.ok(prompt.includes(`Q2 [task ${q2.ts}] (flagged for review)`));
  assert.ok(prompt.includes('My note during the exam: no idea'));
  assert.ok(prompt.includes('My answer(s): none'), 'la que se quedó sin contestar');
  // La explicación de la app solo en las falladas, para no alargarlo de más.
  assert.ok(prompt.includes(q2.why[q2.answer].replace(/`/g, '')));
  assert.ok(!prompt.includes(q1.why[q1.answer].replace(/`/g, '')));
  assert.ok(!prompt.includes('`'));
});

test('simulacro entero: las letras como se vieron', () => {
  const order = [3, 1, 0, 2];
  const prompt = examPrompt('en', 'quick', [item(q1, 7, false, [order[0]], { order })]);
  assert.ok(prompt.includes(`A) ${q1.options[3].replace(/`/g, '')}`));
  assert.ok(prompt.includes(`Right answer(s): ${'ABCD'[order.indexOf(q1.answer)]}`));
  assert.ok(prompt.includes('My answer(s): A'));
});

test('simulacro antiguo sin respuestas: todas juntas, sin "mi respuesta" y en español si toca', () => {
  const prompt = examPrompt('es', 'examen 1', [item(q1, 1, false, undefined), item(q2, 2, false, undefined)]);
  assert.ok(prompt.startsWith('Estoy preparando'));
  assert.ok(prompt.includes('Mis respuestas no se guardaron'));
  assert.ok(prompt.includes('=== PREGUNTAS (2) ==='));
  assert.ok(prompt.includes('\nP1 ') && prompt.includes('\nP2 '));
  assert.ok(!prompt.includes('Mi respuesta:'));
  assert.ok(!prompt.includes('FALLADAS'));
});

test('un simulacro de 60 no cabe en el enlace: se copia y se pega', () => {
  const items = LEVEL_BANK.slice(0, 60).map((q, k) => item(q, k + 1, k % 3 === 0, [q.answers?.[0] ?? q.answer]));
  const prompt = examPrompt('en', 'level · 60', items);
  assert.equal(fitsUrl(prompt), false);
  assert.equal(fitsUrl('short question'), true);
  assert.ok(claudeUrl('x').length < 8000);
});

test('el enlace de tu chat: tal cual de la barra de direcciones, y nada que no sea un chat', () => {
  const id = '0f1e2d3c-4b5a-6978-8a9b-0c1d2e3f4a5b';
  const clean = `https://claude.ai/chat/${id}`;
  assert.equal(chatUrl(clean), clean);
  assert.equal(chatUrl(`  claude.ai/chat/${id.toUpperCase()}?foo=1#end `), clean);
  assert.equal(chatUrl(`https://www.claude.ai/chat/${id}/`), clean);
  assert.equal(chatUrl(`https://claude.ai/share/${id}`), null, 'un enlace de compartir es una copia de solo lectura');
  assert.equal(chatUrl('https://claude.ai/new'), null);
  assert.equal(chatUrl(`https://evil.example/claude.ai/chat/${id}`), null);
  assert.equal(chatUrl(''), null);
});

test('al entregar se guardan las preguntas, sin marcas ni notas vacías', () => {
  const saved = savedSlots([
    { q: q1, order: [1, 0, 2, 3], picked: 1, flag: false, note: '  ' },
    { q: q2, order: [0, 1, 2, 3], picked: null, flag: true, note: ' ojo ' },
  ]);
  assert.deepEqual(saved, [
    { id: q1.id, order: [1, 0, 2, 3], picked: 1 },
    { id: q2.id, order: [0, 1, 2, 3], picked: null, flag: true, note: 'ojo' },
  ]);
});

test('volver a abrir un simulacro: con lo guardado, tal cual', () => {
  const byId = new Map(QUESTIONS.map((q) => [q.id, q]));
  const slots = [
    { q: q1, order: [1, 0, 2, 3], picked: 1 },
    { q: q2, order: [0, 1, 2, 3], picked: null, flag: true, note: 'ojo' },
  ];
  const e: ExamResult = { ...examResult(slots, HOY, 90, 'random'), slots: savedSlots(slots) };
  const r = replayExam(e, byId, {});
  assert.equal(r?.known, true);
  assert.deepEqual(
    r?.slots.map((x) => [x.q.id, x.order, x.picked, x.flag, x.note]),
    [
      [q1.id, [1, 0, 2, 3], 1, undefined, undefined],
      [q2.id, [0, 1, 2, 3], null, true, 'ojo'],
    ],
  );
  // Una pregunta que ya no está en el banco se salta; sin ninguna, no hay nada que abrir.
  assert.equal(replayExam({ ...e, slots: [{ id: 'gone', order: [0], picked: 0 }] }, byId, {}), null);
});

test('volver a abrir un simulacro antiguo: solo los fijos, y solo si cuadran sus preguntas', () => {
  const byId = new Map<string, Question>();
  const fixed = { 'exam 1': [q1, q2, q3] };
  const old = examResult([q1, q2, q3].map((q) => ({ q, picked: q.answer })), HOY, 60, 'exam 1');
  const r = replayExam(old, byId, fixed);
  assert.equal(r?.known, false);
  assert.deepEqual(r?.slots.map((x) => x.q.id), [q1.id, q2.id, q3.id]);
  assert.equal(r?.slots[0].picked, undefined, 'sin tus respuestas');
  assert.equal(replayExam({ ...old, label: 'random' }, byId, fixed), null, 'los aleatorios no se pueden rehacer');
  assert.equal(replayExam({ ...old, total: 4 }, byId, fixed), null, 'el fijo cambió desde entonces');
  const other = { ...old, byDomain: { prompting: [3, 3] as [number, number] } };
  assert.equal(replayExam(other, byId, fixed), null, 'mismo total pero otros dominios');
});

test('sincronizar: del mismo simulacro gana la copia que guardó sus preguntas', () => {
  const slots = [{ q: q1, order: [0, 1, 2, 3], picked: q1.answer }];
  const plain = examResult(slots, HOY, 30, 'quick');
  const full = { ...plain, slots: savedSlots(slots) };
  // La más nueva viene de una versión anterior de la app, sin las preguntas.
  const viejo = { ...fresh(HOY), exams: [plain], stamp: 200 };
  const nuevo = { ...fresh(HOY), exams: [full], stamp: 100 };
  assert.deepEqual(merge(nuevo, shared(viejo)).exams, [full]);
  assert.deepEqual(merge(viejo, shared(nuevo)).exams, [full]);
});

test('sincronizar: tu chat de Claude viaja, olvidarlo también, y sin chat ni la clave', () => {
  const chat = 'https://claude.ai/chat/0f1e2d3c-4b5a-6978-8a9b-0c1d2e3f4a5b';
  const pc = { ...fresh(HOY), claudeChat: chat, stamp: 100 };
  const movil = { ...fresh(HOY), stamp: 200 };
  assert.equal(merge(movil, shared(pc)).claudeChat, chat, 'el móvil no tenía ninguno');
  assert.equal(merge(pc, shared(movil)).claudeChat, chat);
  const olvidado = { ...pc, claudeChat: null, stamp: 300 };
  assert.equal(merge(pc, shared(olvidado)).claudeChat, null);
  assert.equal(merge(olvidado, shared(pc)).claudeChat, null);
  // Sin chat en ninguna, la clave no aparece: una versión anterior de la app no ve diferencias.
  const sin = merge(fresh(HOY), shared({ ...fresh(HOY), stamp: 50 }));
  assert.equal('claudeChat' in sin, false);
  assert.ok(sameShared(shared(sin), shared({ ...fresh(HOY), stamp: 50 })));
});

test('niveles hasta el 1000: los diez de siempre y luego 1000 XP por nivel', () => {
  assert.equal(levelOf(4499).n, 9);
  assert.deepEqual(levelOf(4500), { n: 10, title: 'Certified Legend', from: 4500, to: 5500 });
  assert.deepEqual(levelOf(5500), { n: 11, title: 'Certified Legend', from: 5500, to: 6500 });
  assert.equal(levelOf(4500 + 15 * 1000).title, 'Agent Whisperer'); // nivel 25
  assert.equal(levelOf(4500 + 90 * 1000 - 1).n, 99);
  assert.deepEqual(levelOf(94_500), { n: 100, title: 'Context Sage', from: 94_500, to: 95_500 });
  assert.equal(MAX_LEVEL, 1000);
  assert.deepEqual(levelOf(994_500), { n: 1000, title: 'Claude Ascendant', from: 994_500, to: null });
  assert.equal(levelOf(1e9).n, 1000);
  // Cada nivel sigue al anterior sin saltos ni huecos.
  let last = 1;
  for (let xp = 0; xp <= 1_000_000; xp += 250) {
    const n = levelOf(xp).n;
    assert.ok(n === last || n === last + 1, `xp ${xp}`);
    last = n;
  }
  assert.equal(last, 1000);
});
