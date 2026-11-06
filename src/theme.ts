import type { Domain, Theme } from './game.ts';

// Terminal de fósforo verde: negro casi puro, verde para lo importante,
// ámbar para avisos y recordatorios, cian para el código y rojo para los fallos.
const DARK = {
  bg: '#07090A',
  panel: '#0B110E',
  line: '#1A2820',
  lineHi: '#2A4535',
  green: '#4BF58A',
  greenDim: '#2C8A52',
  greenBg: '#0E2619',
  text: '#C9F2D5',
  muted: '#5E7D69',
  amber: '#FFB547',
  amberBg: '#2A2110',
  cyan: '#62D6E8',
  red: '#FF5F6D',
  redBg: '#2A0F14',
  heatLo: '#1E5A37',
  heatHi: '#3CC873',
};

// El mismo terminal impreso en papel: fondo claro y los mismos tonos, más oscuros para que se lean.
const LIGHT: typeof DARK = {
  bg: '#F3F6F1',
  panel: '#FFFFFF',
  line: '#D6E0D8',
  lineHi: '#AFC4B5',
  green: '#0F7F3E',
  greenDim: '#5FA97D',
  greenBg: '#E1F2E7',
  text: '#15251B',
  muted: '#5A6E61',
  amber: '#A35F00',
  amberBg: '#FCEFD9',
  cyan: '#0A6F7E',
  red: '#C8283A',
  redBg: '#FBE2E5',
  heatLo: '#BFE3CC',
  heatHi: '#2E9E5C',
};

const DOMAIN_DARK: Record<Domain, string> = {
  agentic: '#4BF58A',
  tools: '#62D6E8',
  'claude-code': '#B48CFF',
  prompting: '#FFB547',
  context: '#FF7FB0',
};

const DOMAIN_LIGHT: Record<Domain, string> = {
  agentic: '#0F7F3E',
  tools: '#0A6F7E',
  'claude-code': '#7448D0',
  prompting: '#A35F00',
  context: '#BF3474',
};

// Se cambian en su sitio al elegir tema, así que todo lo que los lee al pintar sale ya con el nuevo.
export const c = { ...DARK };
export const domainColor: Record<Domain, string> = { ...DOMAIN_DARK };

let theme: Theme = 'dark';
let version = 0;

export function setTheme(next: Theme): void {
  if (next === theme) return;
  theme = next;
  version += 1;
  Object.assign(c, next === 'light' ? LIGHT : DARK);
  Object.assign(domainColor, next === 'light' ? DOMAIN_LIGHT : DOMAIN_DARK);
}

/**
 * Para los StyleSheet.create de cada pantalla: se crean al cargar el módulo y se quedarían con los
 * colores de entonces. Así se rehacen la primera vez que se leen después de cambiar de tema.
 */
export function themed<T extends object>(make: () => T): T {
  let made = make();
  let at = version;
  return new Proxy(made, {
    get(_, key) {
      if (at !== version) {
        made = make();
        at = version;
      }
      return made[key as keyof T];
    },
  });
}

// Nombres con los que se cargan las fuentes en App.tsx (useFonts).
export const font = { regular: 'Mono', bold: 'MonoBold' };
