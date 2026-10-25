// Contra las trampas en la web: cuándo se tapa la pregunta y qué cuenta como atajo de captura.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IDLE, covered, printKey, screenshotKey, step, type Guard, type GuardEvent } from '../src/guard.ts';

const run = (...events: GuardEvent[]): Guard => events.reduce(step, IDLE);
const key = (k: string, code = '', mods: { meta?: boolean; ctrl?: boolean; shift?: boolean } = {}) => ({
  key: k,
  code,
  metaKey: !!mods.meta,
  ctrlKey: !!mods.ctrl,
  shiftKey: !!mods.shift,
});

test('sin una pregunta sin contestar en pantalla no se tapa nada', () => {
  assert.equal(covered(run('blur')), false);
  assert.equal(covered(run('meta-down')), false);
  assert.equal(covered(run('shot', 'open')), false); // la captura de antes de abrir la pregunta no cuenta
});

test('salir de la ventana tapa la pregunta y volver la destapa', () => {
  assert.equal(covered(run('open', 'blur')), true);
  assert.equal(covered(run('open', 'blur', 'focus')), false);
});

test('Win/Cmd tapa mientras está pulsada, y el foco la da por soltada', () => {
  assert.equal(covered(run('open', 'meta-down')), true);
  assert.equal(covered(run('open', 'meta-down', 'meta-up')), false);
  // Win+Shift+S: la herramienta de recortes se lleva el foco y el keyup de Win no llega.
  assert.equal(covered(run('open', 'meta-down', 'blur', 'focus')), false);
});

test('un atajo de captura deja tapado hasta que se toca', () => {
  const caught = run('open', 'meta-down', 'shot', 'meta-up', 'blur', 'focus');
  assert.equal(covered(caught), true);
  assert.equal(covered(step(caught, 'dismiss')), false);
});

test('al cerrar la última pregunta se olvida la captura', () => {
  assert.equal(covered(run('open', 'shot', 'close', 'open')), false);
  // RoundView se monta de nuevo en cada pregunta: dos abiertas a la vez un instante.
  assert.equal(covered(run('open', 'open', 'shot', 'close')), true);
});

test('atajos de captura de Windows, Mac y navegadores', () => {
  assert.ok(screenshotKey(key('PrintScreen', 'PrintScreen')));
  assert.ok(screenshotKey(key('Shift', 'ShiftLeft', { meta: true, shift: true }))); // Win+Shift(+S) y Cmd+Shift(+3/4/5)
  assert.ok(screenshotKey(key('Meta', 'MetaLeft', { meta: true, shift: true }))); // Shift primero y luego Win/Cmd
  assert.ok(screenshotKey(key('S', 'KeyS', { ctrl: true, shift: true }))); // Edge y Firefox
  assert.ok(!screenshotKey(key('Shift', 'ShiftLeft', { shift: true })));
  assert.ok(!screenshotKey(key('Meta', 'MetaLeft', { meta: true })));
  assert.ok(!screenshotKey(key('c', 'KeyC', { ctrl: true })));
});

test('imprimir se bloquea con Ctrl o Cmd', () => {
  assert.ok(printKey(key('p', 'KeyP', { ctrl: true })));
  assert.ok(printKey(key('p', 'KeyP', { meta: true })));
  assert.ok(!printKey(key('p', 'KeyP')));
});
