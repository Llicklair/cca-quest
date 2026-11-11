// Los prompts de "pregúntale a Claude": mismas letras que en pantalla, sin la respuesta antes de
// contestar y sin comillas invertidas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { claudePrompt, claudeUrl, conceptPrompt, selectionPrompt } from '../src/ask.ts';
import { QUESTIONS } from '../src/questions.ts';
import { QUESTIONS_ES } from '../src/questions-es.ts';

const q = QUESTIONS[0];

test('las letras siguen el orden en que se vieron las opciones', () => {
  const order = [2, 0, 3, 1]; // la opción original 2 se vio como A
  const prompt = claudePrompt(q, [q.answer], 'en', { order, picked: [order[3]] });
  assert.ok(prompt.includes(`A) ${q.options[2].replace(/`/g, '')}`));
  assert.ok(prompt.includes(`Right answer(s): ${'ABCD'[order.indexOf(q.answer)]}`));
  assert.ok(prompt.includes('My answer(s): D'));
});

test('sin contestar y sin respuesta que enseñar', () => {
  assert.ok(claudePrompt(q, [q.answer], 'en', { picked: null }).includes('My answer(s): none'));
  assert.ok(!claudePrompt(q, [q.answer], 'en').includes('My answer'));
});

test('antes de contestar no lleva la respuesta buena ni su explicación', () => {
  const prompt = claudePrompt(q, [q.answer], 'en', { reveal: false });
  assert.ok(prompt.includes("Don't tell me which option is correct"));
  assert.ok(!prompt.includes('Right answer'));
  assert.ok(!prompt.includes(q.why[q.answer].replace(/`/g, '')));
  assert.ok(prompt.includes('D) '), 'las cuatro opciones sí van');
});

test('en español usa la traducción y no deja comillas invertidas', () => {
  const prompt = claudePrompt(QUESTIONS_ES[q.id], [q.answer], 'es');
  assert.ok(prompt.startsWith('Estoy preparando'));
  assert.ok(!prompt.includes('`'));
  assert.ok(claudeUrl(prompt).startsWith('https://claude.ai/new?q='));
});

test('un concepto lleva su nombre y lo que dice la app, sin líneas vacías sueltas', () => {
  const prompt = conceptPrompt('en', 'tool_choice', ['Forces a tool call: `any` or a named tool.', '  ']);
  assert.ok(prompt.includes('concrete example'));
  assert.ok(prompt.endsWith('tool_choice\nForces a tool call: any or a named tool.'));
});

test('respuesta múltiple: las dos buenas, las dos elegidas y el porqué de cada buena', () => {
  const multi = { ...q, options: [...q.options, 'A fifth option.'], why: [...q.why, 'Why the fifth is wrong.'] };
  const prompt = claudePrompt(multi, [1, 4], 'en', { picked: [0, 4] });
  assert.ok(prompt.includes('E) A fifth option.'));
  assert.ok(prompt.includes('Right answer(s): B, E'));
  assert.ok(prompt.includes('My answer(s): A, E'));
  assert.equal(prompt.split('Explanation in my study app').length - 1, 2);
});

test('un trozo de lección: la lección de contexto, el trozo y la duda al final', () => {
  const passage = 'Use tool_use, then append the tool_result.';
  const lines = ['Full lesson summary', '- Key idea: keep history', '✗ Trap: do not discard results'];
  const prompt = selectionPrompt('en', '1.1 Agentic loops', `  ${passage}\n`, '  Why append?  ', lines);
  for (const part of ['1.1 Agentic loops', ...lines]) assert.ok(prompt.includes(part), part);
  assert.ok(prompt.includes(`passage from the lesson:\n${passage}\n`));
  assert.ok(prompt.endsWith('\n\nWhy append?'));
  // Una sola petición: no pide además que explique la lección entera.
  assert.ok(!prompt.includes('Explain this concept'));
  assert.equal(new URL(claudeUrl(prompt)).searchParams.get('q'), prompt);
});

test('un trozo sin duda: que lo explique, en el idioma elegido y sin comillas invertidas', () => {
  assert.ok(selectionPrompt('en', '1.1', 'A passage', '  ').endsWith('Explain it in simple words, with a concrete example and how it usually shows up in exam questions.'));
  const es = selectionPrompt('es', '1.1', 'Un `fragmento`', '', ['Una idea con `código`.']);
  assert.ok(es.startsWith('Estoy preparando'));
  assert.ok(es.endsWith('Explícamelo con palabras sencillas, con un ejemplo concreto y cómo suele salir en las preguntas del examen.'));
  assert.ok(!es.includes('`'));
});
