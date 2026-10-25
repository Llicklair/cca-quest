// Contra las trampas en la web: que no se pueda copiar el texto ni hacer capturas de una pregunta
// sin contestar para pegársela a una IA. En la app del móvil no hace nada.
//
// Copiar: en toda la web no se selecciona texto, ni se copia, ni sale el menú del botón derecho,
// ni se imprime (los campos de texto sí: hay que poder escribir y pegar el código de sala).
//
// Capturas: una web no puede impedirlas, pero sí tapar la pregunta antes de que se hagan. Mientras
// hay una pregunta sin contestar en pantalla se tapa todo cuando:
// - la ventana pierde el foco: la herramienta de recortes de Windows, la Game Bar, otra ventana…;
// - se pulsa Win/Cmd: los atajos de captura (Win+Shift+S, Cmd+Shift+3/4/5) empiezan por ella y la
//   tapa ya está pintada cuando llega la última tecla;
// - se pulsa un atajo de captura (Impr Pant, Win/Cmd+Shift, Ctrl+Shift+S de Edge y Firefox): se
//   queda tapado hasta que se toque, que en el Mac la captura se hace después de soltar las teclas.
// Con Impr Pant, además, se pisa el portapapeles para que no quede la imagen.
// Lo que no se puede evitar: una foto con otro móvil, las capturas del propio móvil, y leer el
// código de la web, que es público.

export type Guard = {
  screens: number; // pantallas con una pregunta sin contestar
  away: boolean; // la ventana no tiene el foco
  held: boolean; // Win/Cmd pulsada
  caught: boolean; // se pulsó un atajo de captura: tapado hasta que se toque
};

export type GuardEvent = 'open' | 'close' | 'blur' | 'focus' | 'meta-down' | 'meta-up' | 'shot' | 'dismiss';

export const IDLE: Guard = { screens: 0, away: false, held: false, caught: false };

export function step(g: Guard, e: GuardEvent): Guard {
  switch (e) {
    case 'open':
      return { ...g, screens: g.screens + 1 };
    case 'close': {
      const screens = Math.max(0, g.screens - 1);
      return { ...g, screens, caught: screens > 0 && g.caught };
    }
    case 'blur':
      return { ...g, away: true };
    // Al volver no llega cuándo se soltó Win/Cmd: el foco también la da por soltada.
    case 'focus':
      return { ...g, away: false, held: false };
    case 'meta-down':
      return { ...g, held: true };
    case 'meta-up':
      return { ...g, held: false };
    case 'shot':
      return g.screens > 0 ? { ...g, caught: true } : g;
    case 'dismiss':
      return { ...g, caught: false };
  }
}

/** Si hay que tapar la pantalla. */
export const covered = (g: Guard) => g.screens > 0 && (g.away || g.held || g.caught);

type Keys = { key: string; code: string; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean };

const isMeta = (k: Keys) => k.key === 'Meta' || k.key === 'OS';

/** Atajos de captura: Impr Pant, Win/Cmd+Shift (+S, +3/4/5…) y Ctrl+Shift+S (Edge y Firefox). */
export const screenshotKey = (k: Keys) => k.key === 'PrintScreen' || (k.metaKey && k.shiftKey) || (k.ctrlKey && k.shiftKey && k.code === 'KeyS');

/** Ctrl/Cmd+P: imprimir (o guardar como PDF) es otra forma de copiar el texto. */
export const printKey = (k: Keys) => (k.ctrlKey || k.metaKey) && k.code === 'KeyP';

const CSS = `
* { user-select: none !important; -webkit-user-select: none !important; -webkit-touch-callout: none !important; }
input, textarea, [contenteditable] { user-select: text !important; -webkit-user-select: text !important; }
@media print { #root { display: none !important; } } /* si se imprime desde el menú del navegador */
`;

/** Pone los estilos y escucha teclado y foco. Solo en la web, una vez. */
export function installGuard(send: (e: GuardEvent) => void) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const editable = (t: EventTarget | null) =>
    t instanceof HTMLElement && (t.isContentEditable || t.tagName === 'INPUT' || t.tagName === 'TEXTAREA');
  const block = (e: Event) => {
    if (!editable(e.target)) e.preventDefault();
  };
  for (const type of ['copy', 'cut', 'contextmenu', 'selectstart', 'dragstart']) document.addEventListener(type, block, true);

  document.addEventListener(
    'keydown',
    (e) => {
      if (printKey(e)) e.preventDefault();
      if (isMeta(e)) send('meta-down');
      if (screenshotKey(e)) {
        if (e.ctrlKey) e.preventDefault(); // la captura del navegador sí se puede cancelar
        send('shot');
      }
    },
    true,
  );
  // Windows solo deja ver Impr Pant al soltarla, cuando la captura ya está en el portapapeles.
  document.addEventListener(
    'keyup',
    (e) => {
      if (isMeta(e)) send('meta-up');
      if (e.key === 'PrintScreen') {
        send('shot');
        navigator.clipboard?.writeText('').catch(() => {});
      }
    },
    true,
  );

  window.addEventListener('blur', () => send('blur'));
  window.addEventListener('focus', () => send('focus'));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) send('blur');
    else if (document.hasFocus()) send('focus');
  });
  if (!document.hasFocus()) send('blur');
}
