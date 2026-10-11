import type { Domain } from './game.ts';

// Terminal de fósforo verde: negro casi puro, verde para lo importante,
// ámbar para avisos y recordatorios, cian para el código y rojo para los fallos.
export const c = {
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
  cyan: '#62D6E8',
  red: '#FF5F6D',
  redBg: '#2A0F14',
};

export const domainColor: Record<Domain, string> = {
  agentic: '#4BF58A',
  tools: '#62D6E8',
  'claude-code': '#B48CFF',
  prompting: '#FFB547',
  context: '#FF7FB0',
};

// Nombres con los que se cargan las fuentes en App.tsx (useFonts).
export const font = { regular: 'Mono', bold: 'MonoBold' };
