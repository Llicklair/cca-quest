import { Platform } from 'react-native';

import type { Domain } from './game.ts';

// Paleta de juego nocturno: azul noche, llama naranja y verde/rojo de acierto/fallo.
export const c = {
  bg: '#0F1222',
  card: '#1A1F36',
  cardHi: '#232A48',
  line: '#2D3558',
  ink: '#F4F1EA',
  inkSoft: '#C9CDE0',
  muted: '#8C95B4',
  flame: '#FF8A3D',
  flameSoft: '#3A2A26',
  gold: '#FFC857',
  good: '#3DDC97',
  goodSoft: '#16362C',
  bad: '#FF5C7A',
  badSoft: '#3B1D29',
};

export const domainColor: Record<Domain, string> = {
  agentic: '#FF8A3D',
  tools: '#6C8CFF',
  'claude-code': '#3DDC97',
  prompting: '#C77DFF',
  context: '#FFC857',
};

export const mono = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
