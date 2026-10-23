// Los prompts de "pregúntale a Claude": mismas letras que en pantalla, sin la respuesta antes de
// contestar y sin comillas invertidas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { claudePrompt, claudeUrl, conceptPrompt } from '../src/ask.ts';
import { QUESTIONS } from '../src/questions.ts';
import { QUESTIONS_ES } from '../src/questions-es.ts';

const q = QUESTIONS[0];

test('las letras siguen el orden en que se vieron las opciones', () => {
  const order = [2, 0, 3, 1]; // la opción original 2 se vio como A
  const prompt = claudePrompt(q, q.answer, 'en', { order, picked: order[3] });
  assert.ok(prompt.includes(`A) ${q.options[2].replace(/`/g, '')}`));
  assert.ok(prompt.includes(`Right answer: ${'ABCD'[order.indexOf(q.answer)]}`));
  assert.ok(prompt.includes('My answer: D'));
});

test('sin contestar y sin respuesta que enseñar', () => {
  assert.ok(claudePrompt(q, q.answer, 'en', { picked: null }).includes('My answer: none'));
  assert.ok(!claudePrompt(q, q.answer, 'en').includes('My answer'));
});

test('antes de contestar no lleva la respuesta buena ni su explicación', () => {
  const prompt = claudePrompt(q, q.answer, 'en', { reveal: false });
  assert.ok(prompt.includes("Don't tell me which option is correct"));
  assert.ok(!prompt.includes('Right answer'));
  assert.ok(!prompt.includes(q.why[q.answer].replace(/`/g, '')));
  assert.ok(prompt.includes('D) '), 'las cuatro opciones sí van');
});

test('en español usa la traducción y no deja comillas invertidas', () => {
  const prompt = claudePrompt(QUESTIONS_ES[q.id], q.answer, 'es');
  assert.ok(prompt.startsWith('Estoy preparando'));
  assert.ok(!prompt.includes('`'));
  assert.ok(claudeUrl(prompt).startsWith('https://claude.ai/new?q='));
});

test('un concepto lleva su nombre y lo que dice la app, sin líneas vacías sueltas', () => {
  const prompt = conceptPrompt('en', 'tool_choice', ['Forces a tool call: `any` or a named tool.', '  ']);
  assert.ok(prompt.includes('concrete example'));
  assert.ok(prompt.endsWith('tool_choice\nForces a tool call: any or a named tool.'));
});
