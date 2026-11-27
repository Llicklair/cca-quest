// La calibración: cuatro tandas de 10 parejas de gemelas que no salen en ningún otro sitio de la app, para
// entrenar antes del examen real. El examen pone trampas que el banco no entrenaba (preguntas en
// negativo, una frase que cambia la respuesta), y los simulacros, de tanto repetirlos, se reconocen en
// vez de razonarse, así que su nota sale más alta de lo que toca. Es un entrenamiento de patrones: cada
// pregunta sale dos veces seguidas, el mismo caso con una sola frase cambiada y otra respuesta buena, y al
// corregir la segunda se ven las dos frases juntas, cada una con su respuesta. Cada opción mala lleva su
// trampa y, mientras se contesta, salen resaltadas la palabra que le da la vuelta a la pregunta y la frase
// del caso que decide, para aprender a fijarse en ellas y reconocerlas en el examen. En cada
// pregunta se marca si estabas seguro o dudabas y después se corrige al momento: la buena, el porqué de
// cada opción y la trampa en la que caíste. Se repite las veces que haga falta: cada informe compara
// con el intento anterior, para ir viendo si vas calibrando.
import type { Bi, Question, Trap } from './game.ts';
import { isRight, pickedOf, rightOf } from './game.ts';

/** Cada trampa, con su nombre y la pregunta que hay que hacerse para no caer. */
export const TRAPS: Record<Trap, { name: Bi; tip: Bi }> = {
  negation: {
    name: { en: 'negative question', es: 'pregunta en negativo' },
    tip: {
      en: 'It asked for the option that does NOT work and you picked one that does. Underline NOT, LEAST, EXCEPT before reading the options.',
      es: 'Pedía la opción que NO funciona y elegiste una que sí. Subraya NOT, LEAST, EXCEPT antes de leer las opciones.',
    },
  },
  order: {
    name: { en: 'right step, wrong moment', es: 'paso bueno, momento equivocado' },
    tip: {
      en: 'It asked for the FIRST step. A good later step is still wrong: first diagnose or measure, then fix.',
      es: 'Pedía el PRIMER paso. Un buen paso posterior sigue estando mal: primero diagnostica o mide, luego arregla.',
    },
  },
  'ignored-clue': {
    name: { en: 'ignored a clue in the case', es: 'ignorar una pista del caso' },
    tip: {
      en: 'The textbook answer, but the case rules it out (already tried, forbidden, contradicted by a figure). Reread the case before choosing.',
      es: 'La respuesta de manual, pero el caso la descarta (ya se probó, está prohibido, una cifra la contradice). Relee el caso antes de elegir.',
    },
  },
  invented: {
    name: { en: 'invented feature', es: 'función inventada' },
    tip: {
      en: 'A flag, setting or key that does not exist and solves the problem too neatly. If you have never seen it in the docs, distrust it.',
      es: 'Un flag, ajuste o clave que no existe y resuelve el problema demasiado bien. Si nunca lo has visto en la documentación, desconfía.',
    },
  },
  overforce: {
    name: { en: 'too much enforcement', es: 'forzar de más' },
    tip: {
      en: 'A hook, gate or approval step for something with no real risk. Ask: what is lost if it fails once?',
      es: 'Un hook, gate o paso de aprobación para algo sin riesgo real. Pregúntate: ¿qué se pierde si falla una vez?',
    },
  },
  underforce: {
    name: { en: 'too little enforcement', es: 'forzar de menos' },
    tip: {
      en: 'A prompt instruction or later review where money, security or compliance needs a guarantee. Prompts are probabilistic; code is not.',
      es: 'Una instrucción en el prompt o una revisión posterior donde el dinero, la seguridad o el compliance exigen una garantía. El prompt es probabilístico; el código, no.',
    },
  },
  capacity: {
    name: { en: 'more capacity', es: 'más capacidad' },
    tip: {
      en: 'A bigger context window, more tokens or more retries hides the problem instead of fixing what the model receives.',
      es: 'Más ventana de contexto, más tokens o más reintentos tapan el problema en vez de arreglar lo que recibe el modelo.',
    },
  },
  overbuild: {
    name: { en: 'building too much', es: 'construir de más' },
    tip: {
      en: 'A new server, subagent or service when a small change to what exists is enough. Prefer the smallest change that fixes the cause.',
      es: 'Un servidor, subagent o servicio nuevo cuando basta un cambio pequeño en lo que ya hay. Elige el cambio más pequeño que arregla la causa.',
    },
  },
  'wrong-diagnosis': {
    name: { en: 'wrong diagnosis', es: 'diagnóstico equivocado' },
    tip: {
      en: 'It fixes another layer: often "add a tool" when the problem is the information the model gets. Find where the failure starts.',
      es: 'Arregla otra capa: a menudo «añadir una tool» cuando el problema es la información que le llega al modelo. Busca dónde empieza el fallo.',
    },
  },
  'mixed-up': {
    name: { en: 'mixed-up pieces', es: 'confundir piezas' },
    tip: {
      en: 'Two similar features swapped: Glob vs Grep, CLAUDE.md vs path rules vs skills, --system-prompt vs --append-system-prompt…',
      es: 'Dos piezas parecidas cambiadas: Glob frente a Grep, CLAUDE.md frente a rules por ruta o skills, --system-prompt frente a --append-system-prompt…',
    },
  },
  voting: {
    name: { en: 'voting or self-reported confidence', es: 'votación o confianza sin calibrar' },
    tip: {
      en: 'Majority votes and the model rating its own confidence are not criteria. Use explicit criteria or calibrated routing.',
      es: 'Votar por mayoría o que el modelo puntúe su propia confianza no son criterios. Usa criterios explícitos o un enrutamiento calibrado.',
    },
  },
};

/** Una pregunta de la calibración tal como se contestó: `sure` true seguro, false dudo, null o undefined sin marcar. */
export type CalibItem = { q: Question; picked?: number | null; sure?: boolean | null; n: number };

export type CalibReport = {
  sureWrong: number[]; // números de pregunta falladas estando seguro: las trampas que no ves
  unsureRight: number[]; // acertadas dudando
  unmarked: number; // contestadas sin marcar la seguridad
  traps: { trap: Trap; n: number[] }[]; // en qué trampas caíste, de la más repetida a la menos
  pairs: { a: number; b: number; okA: boolean; okB: boolean }[]; // las gemelas que salieron enteras
};

/**
 * Si una pregunta de la calibración ya se puede corregir: con la respuesta completa y la seguridad
 * marcada antes de ver la buena, para que el seguro o dudo mida lo que pensabas de verdad.
 */
export function canCheck(q: Question, picked: number | null | undefined, sure: boolean | null | undefined): boolean {
  if (picked === null || picked === undefined || typeof sure !== 'boolean') return false;
  return pickedOf(q, picked).length === rightOf(q).length;
}

/** La trampa de lo que elegiste, o null si acertaste o no contestaste. */
export function trapOf(q: Question, picked: number | null | undefined): Trap | null {
  if (picked === null || picked === undefined || isRight(q, picked)) return null;
  const wrong = pickedOf(q, picked).find((i) => !(q.answers ?? [q.answer]).includes(i));
  return wrong === undefined ? null : (q.traps?.[wrong] ?? null);
}

/** El resumen de la calibración: seguridad frente a acierto, trampas en las que caíste y parejas. */
export function calibReport(items: CalibItem[]): CalibReport {
  const answered = items.filter((x) => x.picked !== null && x.picked !== undefined);
  const ok = (x: CalibItem) => isRight(x.q, x.picked ?? null);
  const byTrap = new Map<Trap, number[]>();
  for (const x of items) {
    const t = trapOf(x.q, x.picked);
    if (t) byTrap.set(t, [...(byTrap.get(t) ?? []), x.n]);
  }
  const pairs: CalibReport['pairs'] = [];
  for (const x of items) {
    const twin = x.q.pair ? items.find((y) => y.q.id === x.q.pair) : undefined;
    if (twin && x.n < twin.n) pairs.push({ a: x.n, b: twin.n, okA: ok(x), okB: ok(twin) });
  }
  return {
    sureWrong: answered.filter((x) => x.sure === true && !ok(x)).map((x) => x.n),
    unsureRight: answered.filter((x) => x.sure === false && ok(x)).map((x) => x.n),
    unmarked: answered.filter((x) => typeof x.sure !== 'boolean').length,
    traps: [...byTrap].map(([trap, n]) => ({ trap, n })).sort((a, b) => b.n.length - a.n.length),
    pairs,
  };
}

/**
 * Trozos de un texto con las frases que hay que resaltar (todas sus apariciones), para pintarlas de
 * otro color. Si se solapan, gana la primera que empieza. Las frases vacías no resaltan nada.
 */
export function marked(text: string, marks: (string | undefined)[]): { text: string; on: boolean }[] {
  const ranges: [number, number][] = [];
  for (const m of marks) {
    if (!m) continue;
    for (let i = text.indexOf(m); i >= 0; i = text.indexOf(m, i + m.length)) ranges.push([i, i + m.length]);
  }
  ranges.sort((a, b) => a[0] - b[0]);
  const out: { text: string; on: boolean }[] = [];
  let at = 0;
  for (const [a, b] of ranges) {
    if (a < at) continue;
    if (a > at) out.push({ text: text.slice(at, a), on: false });
    out.push({ text: text.slice(a, b), on: true });
    at = b;
  }
  if (at < text.length) out.push({ text: text.slice(at), on: false });
  return out;
}
