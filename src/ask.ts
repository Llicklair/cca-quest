// “Pregúntale a Claude”: prompts para llevar a Claude lo que se está estudiando, explicado con
// palabras sencillas. Para cuando la explicación de la app no basta. Tres casos:
// - una pregunta antes de contestar: el escenario y los conceptos, sin decir cuál es la buena;
// - una pregunta ya contestada: por qué la buena es la buena y las otras no;
// - un concepto (lección, ficha o término del glosario): con un ejemplo y cómo sale en el examen.
import type { Lang, QuestionText } from './game.ts';

const TEXT = {
  en: {
    exam: "I'm preparing for the Claude Certified Architect – Foundations exam.",
    before:
      "Help me understand this practice question before I answer: explain in simple words what the scenario describes, what the question is really asking and the concepts I need. Don't tell me which option is correct.",
    after:
      'Help me understand this practice question: explain in simple words why the right answer is right, why each of the others is wrong, and the concept behind it.',
    concept: 'Explain this concept in simple words, with a concrete example and how it usually shows up in exam questions.',
    scenario: 'Scenario',
    question: 'Question',
    right: 'Right answer(s)',
    mine: 'My answer(s)',
    none: 'none (I ran out of time)',
    why: 'Explanation in my study app',
  },
  es: {
    exam: 'Estoy preparando el examen Claude Certified Architect – Foundations.',
    before:
      'Ayúdame a entender esta pregunta de práctica antes de contestarla: explícame con palabras sencillas qué describe el escenario, qué pregunta de verdad y qué conceptos necesito. No me digas cuál es la opción buena.',
    after:
      'Ayúdame a entender esta pregunta de práctica: explícame con palabras sencillas por qué la buena es la buena, por qué cada una de las otras está mal y el concepto que hay detrás.',
    concept: 'Explícame este concepto con palabras sencillas, con un ejemplo concreto y cómo suele salir en las preguntas del examen.',
    scenario: 'Escenario',
    question: 'Pregunta',
    right: 'Respuesta(s) buena(s)',
    mine: 'Mi respuesta',
    none: 'ninguna (se me acabó el tiempo)',
    why: 'Explicación de mi app de estudio',
  },
};

const clean = (lines: string[]) => lines.join('\n').replace(/`/g, '');

/**
 * Una pregunta. `rights` son los índices originales de las opciones buenas (dos en las de respuesta
 * múltiple). `order[pos]` es el índice original de la opción que se enseñó en la posición `pos`,
 * para que las letras coincidan con las de la pantalla. Sin `reveal`, no lleva las respuestas buenas.
 * `picked`: los índices originales elegidos, null si no se contestó y undefined si no viene al caso.
 */
export function claudePrompt(
  tx: QuestionText,
  rights: number[],
  lang: Lang,
  { order = tx.options.map((_, k) => k), picked, reveal = true }: { order?: number[]; picked?: number[] | null; reveal?: boolean } = {},
): string {
  const t = TEXT[lang];
  const letters = (origs: number[]) =>
    origs
      .map((o) => 'ABCDE'[order.indexOf(o)])
      .sort()
      .join(', ');
  return clean([
    `${t.exam} ${reveal ? t.after : t.before}`,
    '',
    `${t.scenario}: ${tx.scenario}`,
    '',
    `${t.question}: ${tx.ask}`,
    ...order.map((orig, pos) => `${'ABCDE'[pos]}) ${tx.options[orig]}`),
    ...(reveal
      ? [
          '',
          `${t.right}: ${letters(rights)}`,
          ...(picked === undefined ? [] : [`${t.mine}: ${picked === null || picked.length === 0 ? t.none : letters(picked)}`]),
          ...rights.map((r) => `${t.why}: ${tx.why[r]}`),
        ]
      : []),
  ]);
}

/** Un concepto: su nombre y lo que dice la app de él (resumen, ideas, trampas…), una cosa por línea. */
export function conceptPrompt(lang: Lang, title: string, lines: string[]): string {
  const t = TEXT[lang];
  return clean([`${t.exam} ${t.concept}`, '', title, ...lines.filter((x) => x.trim())]);
}

/** Abre un chat nuevo de claude.ai con el prompt ya escrito. */
export const claudeUrl = (prompt: string) => `https://claude.ai/new?q=${encodeURIComponent(prompt)}`;
