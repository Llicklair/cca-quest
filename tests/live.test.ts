import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seeded } from '../src/game.ts';
import {
  LIVE,
  LIVE_XP,
  addGame,
  advance,
  cleanName,
  everyoneIn,
  join,
  liveXp,
  newGame,
  newRoom,
  parseRoom,
  pick,
  points,
  rankOf,
  rankingList,
  readRanking,
  reveal,
  standings,
  start,
  stateOf,
  timeLeft,
  xpFor,
} from '../src/live.ts';
import { EXAM_LEVEL } from '../src/questions-exam.ts';

const game = (count = 3, secs = 60) => newGame(EXAM_LEVEL, count, secs, seeded(1));
const wrongPos = (right: number) => (right + 1) % 4;

test('el código de sala se lee igual tecleado que desde la URL del QR', () => {
  const code = newRoom(seeded(3));
  assert.equal(code.length, 5);
  assert.equal(parseRoom(code), code);
  assert.equal(parseRoom(` ${code.toUpperCase().slice(0, 2)}-${code.slice(2)} `), code);
  assert.equal(parseRoom(`https://llicklair.github.io/cca-quest/?quiz=${code}`), code);
  assert.equal(parseRoom('abcd'), null);
  assert.equal(parseRoom('abcdi'), null, 'la i no está en el alfabeto');
});

test('los nombres se limpian y se recortan', () => {
  assert.equal(cleanName('  Hugo   Martínez  '), 'Hugo Martínez');
  assert.equal(cleanName('x'.repeat(40)).length, LIVE.maxName);
});

test('los puntos van de 1000 al instante a 500 en el último segundo', () => {
  assert.equal(points(0, 60_000), 1000);
  assert.equal(points(30_000, 60_000), 750);
  assert.equal(points(60_000, 60_000), 500);
  assert.equal(points(90_000, 60_000), 500);
});

test('una partida nueva elige preguntas distintas y apunta dónde cae la buena', () => {
  const g = game(10);
  assert.equal(new Set(g.qids).size, 10);
  g.qids.forEach((id, k) => {
    const q = EXAM_LEVEL.find((x) => x.id === id)!;
    assert.equal(g.orders[k][g.right[k]], q.answer);
  });
});

test('una partida entera: respuestas, corrección, puntos y final', () => {
  let g = join(join(game(2), 'a', 'Ana'), 'b', 'Bea');
  g = start(g, 1_000);
  assert.equal(g.phase, 'question');
  const q0 = g.qids[0];
  g = pick(g, 'a', 'Ana', q0, g.right[0], 1_000); // al instante
  g = pick(g, 'b', 'Bea', q0, wrongPos(g.right[0]), 2_000);
  assert.ok(everyoneIn(g, ['a', 'b']));
  g = reveal(g);
  assert.equal(g.players.a.score, 1000);
  assert.equal(g.players.b.score, 0);
  const s = stateOf(g, 2_000);
  assert.equal(s.right, g.right[0]);
  assert.equal(s.tally.reduce((x, y) => x + y, 0), 2);
  assert.deepEqual(s.board.map((x) => x.id), ['a', 'b']);
  assert.equal(rankOf(s.board, 'b'), 2);

  g = advance(g, 10_000);
  assert.equal(g.i, 1);
  assert.equal(g.players.a.gained, 0, 'los puntos de la última pregunta vuelven a cero');
  g = pick(g, 'b', 'Bea', g.qids[1], g.right[1], 40_000); // a mitad de tiempo
  g = reveal(g);
  assert.equal(g.players.b.score, 750);
  assert.equal(g.players.a.right, 1);
  g = advance(g, 50_000);
  assert.equal(g.phase, 'end');
  assert.equal(stateOf(g, 50_000).qid, null);
});

test('solo vale la primera respuesta, a la pregunta de ahora y a tiempo', () => {
  let g = start(join(game(), 'a', 'Ana'), 0);
  const q0 = g.qids[0];
  g = pick(g, 'a', 'Ana', q0, 1, 100);
  assert.equal(pick(g, 'a', 'Ana', q0, 2, 200), g, 'no se puede cambiar la respuesta');
  const late = start(join(game(), 'a', 'Ana'), 0);
  assert.equal(pick(late, 'a', 'Ana', q0, 1, 60_000 + LIVE.grace + 1), late, 'demasiado tarde');
  assert.equal(pick(late, 'a', 'Ana', 'another-question', 1, 100), late, 'pregunta antigua');
  assert.equal(pick(late, 'a', 'Ana', q0, 7, 100), late, 'opción que no existe');
  const lateButOk = pick(late, 'a', 'Ana', q0, late.right[0], 60_000 + 500);
  assert.equal(reveal(lateButOk).players.a.score, 500, 'dentro del margen puntúa como el último segundo');
});

test('quien contesta sin haberse visto antes entra en la partida', () => {
  let g = start(game(), 0);
  g = pick(g, 'z', 'Zoe', g.qids[0], 0, 10);
  assert.equal(g.players.z.name, 'Zoe');
});

test('al volver a entrar se conservan los puntos', () => {
  let g = start(join(game(), 'a', 'Ana'), 0);
  g = reveal(pick(g, 'a', 'Ana', g.qids[0], g.right[0], 0));
  assert.equal(join(g, 'a', 'Ana').players.a.score, 1000);
  assert.equal(join(g, 'a', 'Ana M').players.a.score, 1000);
});

test('el reloj solo corre en una pregunta y sin nadie conectado no se corrige antes', () => {
  const g = start(game(), 1_000);
  assert.equal(timeLeft(g, 31_000), 30_000);
  assert.equal(timeLeft(reveal(g), 31_000), 0);
  assert.equal(everyoneIn(g, []), false);
});

// Una partida de 2 preguntas ya acabada: Ana acierta las dos al instante, Bea falla una y no contesta la otra.
function finished() {
  let g = start(join(join(join(game(2), 'a', 'Ana'), 'b', 'Bea'), 'c', 'Cris'), 0);
  g = pick(g, 'a', 'Ana', g.qids[0], g.right[0], 0);
  g = pick(g, 'b', 'Bea', g.qids[0], wrongPos(g.right[0]), 0);
  g = advance(reveal(g), 1_000);
  g = pick(g, 'a', 'Ana', g.qids[1], g.right[1], 1_000);
  return advance(reveal(g), 2_000);
}

test('cada uno sabe cuántas contestó', () => {
  const g = finished();
  assert.equal(g.players.a.answered, 2);
  assert.equal(g.players.b.answered, 1);
  assert.equal(g.players.c.answered, 0);
});

test('la XP de una partida: aciertos, fallos y podio', () => {
  const board = stateOf(finished(), 0).board;
  const ana = board.find((s) => s.id === 'a')!;
  const bea = board.find((s) => s.id === 'b')!;
  assert.equal(liveXp(ana, 1, 3), 2 * LIVE_XP.right + LIVE_XP.podium[0]);
  assert.equal(liveXp(bea, 2, 3), LIVE_XP.wrong, 'sin puntos no hay podio');
  assert.equal(liveXp(ana, 1, 1), 2 * LIVE_XP.right, 'jugando solo no hay podio');
});

test('la XP al acabar solo cuenta a quienes contestaron algo', () => {
  const board = stateOf(finished(), 0).board;
  assert.equal(xpFor(board, 'a'), 2 * LIVE_XP.right + LIVE_XP.podium[0]);
  assert.equal(xpFor(board, 'b'), LIVE_XP.wrong);
  assert.equal(xpFor(board, 'c'), null, 'Cris no contestó nada');
  assert.equal(xpFor(board, 'x'), null, 'no estaba en la partida');
});

test('el presentador que juega cuenta como uno más', () => {
  let g = start(join(join(game(1), 'p', 'Pres'), 'a', 'Ana'), 0);
  const online = ['a', 'p']; // los móviles conectados y el propio presentador
  g = pick(g, 'a', 'Ana', g.qids[0], wrongPos(g.right[0]), 0);
  assert.equal(everyoneIn(g, online), false, 'falta el presentador');
  g = pick(g, 'p', 'Pres', g.qids[0], g.right[0], 500);
  assert.equal(everyoneIn(g, online), true);
  const end = advance(reveal(g), 1_000);
  assert.deepEqual(standings(end).map((s) => s.id), ['p', 'a']);
  assert.equal(xpFor(standings(end), 'p'), LIVE_XP.right + LIVE_XP.podium[0]);
});

test('la clasificación suma cada partida una sola vez y solo a quien contestó', () => {
  const g = finished();
  const once = addGame(readRanking(null), g, '2026-10-27');
  assert.deepEqual(Object.keys(once.players).sort(), ['a', 'b']);
  assert.equal(once.players.a.wins, 1);
  assert.equal(once.players.a.points, g.players.a.score);
  assert.equal(addGame(once, g, '2026-10-27'), once, 'la misma partida no cuenta dos veces');
  const again = addGame(once, { ...g, gid: 'otra' }, '2026-10-28');
  assert.equal(again.players.a.games, 2);
  assert.deepEqual(rankingList(again).map((r) => r.id), ['a', 'b']);
  assert.equal(addGame(once, { ...g, phase: 'reveal' }, '2026-10-27'), once, 'solo partidas acabadas');
});

test('lo que llega del servidor con otra forma se descarta', () => {
  const r = readRanking({ players: { x: { name: 'Eva', points: '9', games: 2 }, y: null, z: { points: 5 } }, games: ['g1', 3] });
  assert.deepEqual(Object.keys(r.players), ['x']);
  assert.equal(r.players.x.points, 0);
  assert.equal(r.players.x.games, 2);
  assert.deepEqual(r.games, ['g1']);
  assert.deepEqual(readRanking('basura'), { players: {}, games: [] });
});
