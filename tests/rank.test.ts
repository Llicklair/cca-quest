// La clasificación de todos: qué se publica, cómo se lee lo que llega y que el perfil viaja al sincronizar.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { answer, fresh } from '../src/game.ts';
import { merge, shared } from '../src/merge.ts';
import { QUESTIONS } from '../src/questions.ts';
import { boardList, daysAgo, publish, readBoard, summary } from '../src/rank.ts';

const HOY = '2026-10-27';

test('el resumen cuenta XP, racha, preparación y preguntas vistas, sin nada más', () => {
  let p = fresh(HOY);
  for (const q of QUESTIONS.slice(0, 5)) p = answer(p, q.id, true, 0, HOY, q.answer).progress;
  const s = summary(p, '  Ana  ', HOY);
  assert.equal(s.name, 'Ana');
  assert.equal(s.xp, p.xp);
  assert.equal(s.seen, 5);
  assert.equal(s.streak, 1, 'la meta de 5 está hecha hoy');
  assert.ok(s.ready > 0 && s.ready <= 100);
  assert.deepEqual(Object.keys(s).sort(), ['best', 'day', 'name', 'ready', 'seen', 'streak', 'xp']);
});

test('publicar solo toca tu fila y no cambia nada si es igual', () => {
  const s = summary(fresh(HOY), 'Ana', HOY);
  const b = publish(readBoard(null), 'a', s);
  assert.equal(publish(b, 'a', { ...s }), b, 'igual: mismo documento, no se escribe');
  const two = publish(b, 'b', { ...s, name: 'Bea', xp: 50 });
  assert.deepEqual(boardList(two).map((r) => r.id), ['b', 'a']);
  const hidden = publish(two, 'a', null);
  assert.deepEqual(Object.keys(hidden.players), ['b']);
  assert.equal(publish(hidden, 'a', null), hidden, 'quitar a quien no está no cambia nada');
});

test('lo que llega del servidor con otra forma se descarta', () => {
  const b = readBoard({ players: { a: { name: 'Ana', xp: 10, ready: 400, day: 'ayer' }, b: 'x', c: { xp: 3 } } });
  assert.deepEqual(Object.keys(b.players), ['a']);
  assert.equal(b.players.a.ready, 100);
  assert.equal(b.players.a.day, '');
  assert.deepEqual(readBoard(42), { players: {} });
});

test('hace cuántos días publicó', () => {
  assert.equal(daysAgo(HOY, HOY), 0);
  assert.equal(daysAgo('2026-10-20', HOY), 7);
  assert.equal(daysAgo('', HOY), null);
});

test('el perfil viaja al sincronizar y no se pierde con una copia sin él', () => {
  const movil = { ...fresh(HOY), profile: { id: 'p1', name: 'Ana', public: true }, stamp: 100 };
  const pc = { ...fresh(HOY), stamp: 200 }; // más nueva, pero sin perfil
  assert.deepEqual(merge(pc, shared(movil)).profile, movil.profile);
  assert.deepEqual(merge(movil, shared(pc)).profile, movil.profile);
  const { profile: _, ...antigua } = shared(pc); // de una versión anterior de la app
  assert.deepEqual(merge(movil, antigua as ReturnType<typeof shared>).profile, movil.profile);
  const oculto = { ...movil, profile: { ...movil.profile, public: false }, stamp: 300 };
  assert.equal(merge(movil, shared(oculto)).profile?.public, false, 'ocultarse también viaja');
});
