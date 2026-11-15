// El examen de trampas con Claude: el prompt entero, en los dos idiomas, cabe en el enlace aun con
// los puntos débiles, y estos son los task statements que más fallas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_URL, claudeUrl, fitsUrl } from '../src/ask.ts';
import { DOMAINS } from '../src/game.ts';
import { WEAK_TASKS, trapPrompt } from '../src/trap.ts';

const task = (ts: string, right: number, seen: number) => ({ ts, title: '', right, seen });
// Un historial con muchos task statements flojos y los cinco dominios, lo más largo que puede salir.
const full = {
  domains: DOMAINS.map((d) => ({ n: d.n, name: d.name, weight: d.weight, exam: [0, 0] as [number, number], all: [37, 61] as [number, number] })),
  tasks: [
    task('1.1', 2, 5),
    task('1.7', 0, 1),
    task('2.5', 9, 10),
    task('3.3', 1, 4),
    task('4.2', 3, 3),
    task('4.5', 10, 30),
    task('5.6', 12, 20),
    task('3.6', 4, 9),
    task('2.1', 3, 6),
  ],
};

test('el examen de trampas cabe en el enlace en los dos idiomas, con los puntos débiles', () => {
  for (const lang of ['es', 'en'] as const) {
    const prompt = trapPrompt(lang, full);
    assert.ok(fitsUrl(prompt), `${lang}: ${claudeUrl(prompt).length} > ${MAX_URL}`);
    assert.ok(!prompt.includes('`'));
  }
});

test('lo que pidió: 20 preguntas, las 10 trampas, parejas de contraste y otra tanda de 20', () => {
  const es = trapPrompt('es');
  assert.ok(es.startsWith('Estoy preparando el examen Claude Certified Architect – Foundations.'));
  assert.ok(es.includes('- 20 preguntas en modo quiz interactivo'));
  assert.ok(es.includes('otra tanda de 20 preguntas solo sobre mis trampas más repetidas'));
  assert.ok(!es.includes('6–8'));
  for (let k = 1; k <= 10; k++) assert.ok(es.includes(`\n${k}. `), `trampa ${k}`);
  assert.ok(es.includes('## Parejas de contraste (obligatorio)'));
  const en = trapPrompt('en');
  assert.ok(en.includes('- 20 questions in interactive quiz mode'));
  assert.ok(en.includes('another round of 20 questions only on my most repeated traps'));
  for (let k = 1; k <= 10; k++) assert.ok(en.includes(`\n${k}. `), `trap ${k}`);
});

test('los puntos débiles: los peores task statements fallados alguna vez y los dominios', () => {
  const es = trapPrompt('es', full);
  const line = es.split('\n').find((l) => l.startsWith('Dentro del reparto'))!;
  // 1.7 0%, 3.3 25%, 4.5 33%, 1.1 40%, 3.6 44%, 2.1 50%; fuera 5.6 (60%), 2.5 (90%) y 4.2 (siempre bien).
  assert.equal(line, 'Dentro del reparto por dominio, elige sobre todo estos task statements, donde más fallo: 1.7 (0/1), 3.3 (1/4), 4.5 (10/30), 1.1 (2/5), 3.6 (4/9), 2.1 (3/6).');
  assert.equal(line.split('(').length - 1, WEAK_TASKS);
  assert.ok(es.endsWith('Mis aciertos por dominio: D1 61% · D2 61% · D3 61% · D4 61% · D5 61%.'));
});

test('sin nada contestado, el prompt tal cual', () => {
  const empty = { domains: full.domains.map((d) => ({ ...d, all: [0, 0] as [number, number] })), tasks: [] };
  assert.equal(trapPrompt('es', empty), trapPrompt('es'));
  assert.ok(!trapPrompt('en').includes('weak spots'));
});
