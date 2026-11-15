// “Pregúntale a Claude”: prompts para llevar a Claude lo que se está estudiando, explicado con
// palabras sencillas. Para cuando la explicación de la app no basta. Tres casos:
// - una pregunta antes de contestar: el escenario y los conceptos, sin decir cuál es la buena;
// - una pregunta ya contestada: por qué la buena es la buena y las otras no;
// - un concepto (lección, ficha o término del glosario): con un ejemplo y cómo sale en el examen;
// - un trozo de una lección (en la web, al seleccionarlo): la lección de contexto y la duda sobre él;
// - un simulacro entero: todas sus preguntas en un solo mensaje, las falladas primero;
// - todas las falladas (las que fallaste la última vez que salieron), en un solo mensaje;
// - todo tu historial (simulacros y todo lo contestado) para que diga dónde fallas y qué estudiar.
import type { Lang, QuestionText } from './game.ts';

const TEXT = {
  en: {
    exam: "I'm preparing for the Claude Certified Architect – Foundations exam.",
    before:
      "Help me understand this practice question before I answer: explain in simple words what the scenario describes, what the question is really asking and the concepts I need. Don't tell me which option is correct.",
    after:
      'Help me understand this practice question: explain in simple words why the right answer is right, why each of the others is wrong, and the concept behind it.',
    concept: 'Explain this concept in simple words, with a concrete example and how it usually shows up in exam questions.',
    lesson: 'This is a lesson from my study app:',
    passage: 'My question is about this passage from the lesson:',
    explainPassage: 'Explain it in simple words, with a concrete example and how it usually shows up in exam questions.',
    scenario: 'Scenario',
    question: 'Question',
    right: 'Right answer(s)',
    mine: 'My answer(s)',
    none: 'none (I ran out of time)',
    why: 'Explanation in my study app',
    examIntro: (title: string) => `These are the questions from a practice exam I took (${title}), with my answers.`,
    examAsk:
      'Go through them in order. For each one I got wrong: explain in simple words why the right answer is right, why my answer is wrong and the concept behind it. For each one I got right: one or two lines on why it is right, so I know I did not just guess. At the end, list the concepts I should review, grouped by the patterns in my mistakes.',
    examAskUnknown:
      'My answers were not saved. Go through them in order: for each one, explain briefly why the right answer is right and why each of the others is wrong. At the end, list the key concepts these questions test.',
    examIntroUnknown: (title: string) => `These are the questions from a practice exam I took (${title}).`,
    wrong: (n: number) => `=== WRONG (${n}) ===`,
    gotRight: (n: number) => `=== RIGHT (${n}) ===`,
    all: (n: number) => `=== QUESTIONS (${n}) ===`,
    q: 'Q',
    flagged: 'flagged for review',
    note: 'My note during the exam',
    missesAsk: (n: number) =>
      `These are the ${n} questions I got wrong the last time they came up in my study app (daily rounds and practice exams). Go through them in order: for each one, explain in simple words why the right answer is right, why my answer is wrong and the concept behind it. At the end, list the concepts I should review, grouped by the patterns in my mistakes.`,
    lastAnswer: 'My last answer(s)',
    times: (seen: number, right: number) => `answered ${seen} ${seen === 1 ? 'time' : 'times'}, ${right} right`,
    studyIntro: (exams: number, questions: number, answers: number) =>
      `Below is my whole practice record from my study app: ${exams} practice ${exams === 1 ? 'exam' : 'exams'} and ${questions} different questions answered (${answers} answers in total, in practice exams and daily rounds).`,
    studyAsk:
      'Analyse it and tell me: 1) my weakest domains and task statements, taking into account how much each domain weighs in the real exam; 2) the patterns behind my mistakes (traps I keep falling for, concepts I confuse), using the questions I got wrong; 3) what I already master; 4) a prioritized study plan for the coming days. Be concrete and refer to the task statements.',
    examsHead: (n: number) => `=== PRACTICE EXAMS (${n}, most recent first) ===`,
    weighted: 'weighted by domain',
    noExams: '(none yet)',
    domainsHead: '=== BY DOMAIN ===',
    inExams: 'in practice exams',
    allPractice: 'all practice',
    ofExam: (w: number) => `${w}% of the exam`,
    tasksHead: '=== BY TASK STATEMENT (all practice) ===',
    wrongNowHead: (n: number) => `=== QUESTIONS I GOT WRONG THE LAST TIME (${n}) ===`,
    shakyHead: (n: number) => `=== RIGHT THE LAST TIME, BUT I HAVE FAILED THEM BEFORE (${n}) ===`,
    solidHead: (n: number) => `=== ALWAYS RIGHT (${n}) ===`,
  },
  es: {
    exam: 'Estoy preparando el examen Claude Certified Architect – Foundations.',
    before:
      'Ayúdame a entender esta pregunta de práctica antes de contestarla: explícame con palabras sencillas qué describe el escenario, qué pregunta de verdad y qué conceptos necesito. No me digas cuál es la opción buena.',
    after:
      'Ayúdame a entender esta pregunta de práctica: explícame con palabras sencillas por qué la buena es la buena, por qué cada una de las otras está mal y el concepto que hay detrás.',
    concept: 'Explícame este concepto con palabras sencillas, con un ejemplo concreto y cómo suele salir en las preguntas del examen.',
    lesson: 'Esta es una lección de mi app de estudio:',
    passage: 'Mi duda es sobre este fragmento de la lección:',
    explainPassage: 'Explícamelo con palabras sencillas, con un ejemplo concreto y cómo suele salir en las preguntas del examen.',
    scenario: 'Escenario',
    question: 'Pregunta',
    right: 'Respuesta(s) buena(s)',
    mine: 'Mi respuesta',
    none: 'ninguna (se me acabó el tiempo)',
    why: 'Explicación de mi app de estudio',
    examIntro: (title: string) => `Estas son las preguntas de un simulacro que he hecho (${title}), con mis respuestas.`,
    examAsk:
      'Repásalas en orden. En cada una que fallé: explícame con palabras sencillas por qué la buena es la buena, por qué la mía está mal y el concepto que hay detrás. En cada una que acerté: una o dos líneas de por qué es la buena, para saber que no acerté de chiripa. Al final, dime qué conceptos debo repasar, agrupados por los patrones de mis fallos.',
    examAskUnknown:
      'Mis respuestas no se guardaron. Repásalas en orden: en cada una, explícame brevemente por qué la buena es la buena y por qué cada una de las otras está mal. Al final, dime los conceptos clave que evalúan estas preguntas.',
    examIntroUnknown: (title: string) => `Estas son las preguntas de un simulacro que he hecho (${title}).`,
    wrong: (n: number) => `=== FALLADAS (${n}) ===`,
    gotRight: (n: number) => `=== ACERTADAS (${n}) ===`,
    all: (n: number) => `=== PREGUNTAS (${n}) ===`,
    q: 'P',
    flagged: 'marcada para revisar',
    note: 'Mi nota durante el simulacro',
    missesAsk: (n: number) =>
      `Estas son las ${n} preguntas que fallé la última vez que me salieron en mi app de estudio (rondas diarias y simulacros). Repásalas en orden: en cada una, explícame con palabras sencillas por qué la buena es la buena, por qué la mía está mal y el concepto que hay detrás. Al final, dime qué conceptos debo repasar, agrupados por los patrones de mis fallos.`,
    lastAnswer: 'Mi última respuesta',
    times: (seen: number, right: number) => `contestada ${seen} ${seen === 1 ? 'vez' : 'veces'}, ${right} bien`,
    studyIntro: (exams: number, questions: number, answers: number) =>
      `Abajo está todo mi historial de práctica de mi app de estudio: ${exams} ${exams === 1 ? 'simulacro' : 'simulacros'} y ${questions} preguntas distintas contestadas (${answers} respuestas en total, entre simulacros y rondas diarias).`,
    studyAsk:
      'Analízalo y dime: 1) mis dominios y task statements más débiles, teniendo en cuenta cuánto pesa cada dominio en el examen real; 2) los patrones de mis fallos (trampas en las que caigo, conceptos que confundo), a partir de las preguntas que fallé; 3) lo que ya domino; 4) un plan de estudio priorizado para los próximos días. Sé concreto y cita los task statements.',
    examsHead: (n: number) => `=== SIMULACROS (${n}, el más reciente primero) ===`,
    weighted: 'ponderada por dominio',
    noExams: '(aún ninguno)',
    domainsHead: '=== POR DOMINIO ===',
    inExams: 'en simulacros',
    allPractice: 'en toda la práctica',
    ofExam: (w: number) => `${w} % del examen`,
    tasksHead: '=== POR TASK STATEMENT (toda la práctica) ===',
    wrongNowHead: (n: number) => `=== LAS QUE FALLÉ LA ÚLTIMA VEZ (${n}) ===`,
    shakyHead: (n: number) => `=== BIEN LA ÚLTIMA VEZ, PERO LAS HE FALLADO ANTES (${n}) ===`,
    solidHead: (n: number) => `=== SIEMPRE BIEN (${n}) ===`,
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
  return clean([`${t.exam} ${reveal ? t.after : t.before}`, '', ...block(t, tx, rights, order, { picked, reveal, why: true })]);
}

/** El escenario, la pregunta y las opciones con sus letras; con `reveal`, la buena, la tuya y (con `why`) el porqué. */
function block(
  t: (typeof TEXT)[Lang],
  tx: QuestionText,
  rights: number[],
  order: number[],
  { picked, reveal, why }: { picked?: number[] | null; reveal: boolean; why: boolean },
): string[] {
  const letters = (origs: number[]) =>
    origs
      .map((o) => 'ABCDE'[order.indexOf(o)])
      .sort()
      .join(', ');
  return [
    `${t.scenario}: ${tx.scenario}`,
    '',
    `${t.question}: ${tx.ask}`,
    ...order.map((orig, pos) => `${'ABCDE'[pos]}) ${tx.options[orig]}`),
    ...(reveal
      ? [
          '',
          `${t.right}: ${letters(rights)}`,
          ...(picked === undefined ? [] : [`${t.mine}: ${picked === null || picked.length === 0 ? t.none : letters(picked)}`]),
          ...(why ? rights.map((r) => `${t.why}: ${tx.why[r]}`) : []),
        ]
      : []),
  ];
}

/**
 * Una pregunta de un simulacro, para mandarlo entero. `n`: su número en el simulacro. `picked`
 * como en claudePrompt; undefined en los simulacros antiguos, que no guardaban las respuestas.
 */
export type ExamItem = {
  n: number;
  tx: QuestionText;
  rights: number[];
  ok: boolean;
  order?: number[];
  picked?: number[] | null;
  ts?: string;
  flag?: boolean;
  note?: string;
};

/**
 * Un simulacro entero en un solo mensaje: las falladas primero y a fondo (con la explicación de la
 * app), luego las acertadas, que Claude confirma en una o dos líneas. Cada una con su número del
 * simulacro y las letras como se vieron. Sin respuestas guardadas, todas juntas y sin "mi respuesta".
 */
export function examPrompt(lang: Lang, title: string, items: ExamItem[]): string {
  const t = TEXT[lang];
  const known = items.every((x) => x.picked !== undefined);
  const one = (x: ExamItem) => [
    '',
    `${t.q}${x.n}${x.ts ? ` [task ${x.ts}]` : ''}${x.flag ? ` (${t.flagged})` : ''}`,
    ...block(t, x.tx, x.rights, x.order ?? x.tx.options.map((_, k) => k), { picked: x.picked, reveal: true, why: known && !x.ok }),
    ...(x.note?.trim() ? [`${t.note}: ${x.note.trim()}`] : []),
  ];
  if (!known) return clean([`${t.exam} ${t.examIntroUnknown(title)} ${t.examAskUnknown}`, '', t.all(items.length), ...items.flatMap(one)]);
  const wrong = items.filter((x) => !x.ok);
  const right = items.filter((x) => x.ok);
  return clean([
    `${t.exam} ${t.examIntro(title)} ${t.examAsk}`,
    ...(wrong.length ? ['', t.wrong(wrong.length), ...wrong.flatMap(one)] : []),
    ...(right.length ? ['', t.gotRight(right.length), ...right.flatMap(one)] : []),
  ]);
}

/**
 * Una pregunta según tu historial: cuántas veces la contestaste y cuántas bien, si la última vez
 * la fallaste y qué elegiste entonces (índices originales; null si no se sabe).
 */
export type RecordItem = { tx: QuestionText; rights: number[]; ts?: string; seen: number; right: number; lastWrong: boolean; last: number[] | null };

const pct = (r: number, t: number) => (t ? Math.round((100 * r) / t) : 0);
const frac = (r: number, t: number) => `${r}/${t} (${pct(r, t)}%)`;

/** Una fallada de tu historial: el escenario, la pregunta, las opciones, la buena y tu última respuesta. */
function recordBlock(t: (typeof TEXT)[Lang], x: RecordItem, head: string): string[] {
  const order = x.tx.options.map((_, k) => k);
  const lines = block(t, x.tx, x.rights, order, { picked: undefined, reveal: true, why: true });
  const letters = (origs: number[]) => origs.map((o) => 'ABCDE'[o]).sort().join(', ');
  // La última respuesta va justo después de la buena, antes de las explicaciones.
  const at = lines.findIndex((l) => l.startsWith(`${t.right}:`)) + 1;
  if (x.last?.length) lines.splice(at, 0, `${t.lastAnswer}: ${letters(x.last)}`);
  return ['', head, ...lines];
}

/** Todas las falladas en un solo mensaje, cada una con su escenario, lo que elegiste y el porqué de la buena. */
export function missesPrompt(lang: Lang, items: RecordItem[]): string {
  const t = TEXT[lang];
  return clean([
    `${t.exam} ${t.missesAsk(items.length)}`,
    ...items.flatMap((x, k) => recordBlock(t, x, `${k + 1}.${x.ts ? ` [task ${x.ts}]` : ''} ${t.times(x.seen, x.right)}`)),
  ]);
}

/**
 * Todo tu historial para que Claude diga dónde fallas: los simulacros con su nota, los aciertos por
 * dominio (en simulacros y en toda la práctica) y por task statement, las falladas la última vez
 * enteras y el resto en una línea con su regla. Los números vienen ya contados (ver study.ts).
 */
export type StudyRecord = {
  exams: { day: string; label: string; score: number; right: number; total: number; weighted: boolean; byDomain: [number, number, number][] }[]; // [n, aciertos, preguntas]
  domains: { n: number; name: string; weight: number; exam: [number, number]; all: [number, number] }[];
  tasks: { ts: string; title: string; right: number; seen: number }[];
  items: RecordItem[];
};

export function studyPrompt(lang: Lang, r: StudyRecord): string {
  const t = TEXT[lang];
  const answers = r.items.reduce((sum, x) => sum + x.seen, 0);
  const wrongNow = r.items.filter((x) => x.lastWrong);
  const shaky = r.items.filter((x) => !x.lastWrong && x.right < x.seen);
  const solid = r.items.filter((x) => !x.lastWrong && x.right === x.seen);
  const tag = (x: RecordItem) => (x.ts ? `[task ${x.ts}] ` : '');
  // En una línea, la regla que evalúa (el concepto), que dice más que el enunciado suelto.
  const oneLine = (x: RecordItem) => `- ${tag(x)}${x.right}/${x.seen} · ${x.tx.rule}`;
  const examLine = (e: StudyRecord['exams'][number]) =>
    `${e.day} · ${e.label} · ${e.score}%${e.weighted ? ` (${t.weighted})` : ''} · ${e.right}/${e.total}` +
    e.byDomain.map(([n, ok, all]) => ` · D${n} ${ok}/${all}`).join('');
  const domainLine = (d: StudyRecord['domains'][number]) =>
    `D${d.n} ${d.name} (${t.ofExam(d.weight)}): ${t.inExams} ${d.exam[1] ? frac(d.exam[0], d.exam[1]) : '-'} · ${t.allPractice} ${d.all[1] ? frac(d.all[0], d.all[1]) : '-'}`;
  return clean([
    `${t.exam} ${t.studyIntro(r.exams.length, r.items.length, answers)} ${t.studyAsk}`,
    '',
    t.examsHead(r.exams.length),
    ...(r.exams.length ? r.exams.map(examLine) : [t.noExams]),
    '',
    t.domainsHead,
    ...r.domains.map(domainLine),
    '',
    t.tasksHead,
    ...r.tasks.map((x) => `${x.ts} ${x.title}: ${frac(x.right, x.seen)}`),
    ...(wrongNow.length ? ['', t.wrongNowHead(wrongNow.length), ...wrongNow.flatMap((x) => recordBlock(t, x, `${tag(x)}${t.times(x.seen, x.right)}`))] : []),
    ...(shaky.length ? ['', t.shakyHead(shaky.length), ...shaky.map(oneLine)] : []),
    ...(solid.length ? ['', t.solidHead(solid.length), ...solid.map(oneLine)] : []),
  ]);
}

/** Un concepto: su nombre y lo que dice la app de él (resumen, ideas, trampas…), una cosa por línea. */
export function conceptPrompt(lang: Lang, title: string, lines: string[]): string {
  const t = TEXT[lang];
  return clean([`${t.exam} ${t.concept}`, '', title, ...lines.filter((x) => x.trim())]);
}

/** Abre un chat nuevo de claude.ai con el prompt ya escrito. */
export const claudeUrl = (prompt: string) => `https://claude.ai/new?q=${encodeURIComponent(prompt)}`;

/** Un chat nuevo vacío, para cuando el prompt no cabe en la dirección y hay que pegarlo. */
export const CLAUDE_NEW = 'https://claude.ai/new';

/**
 * Hasta dónde se fía uno de meter el prompt en la dirección de claude.ai. Medido el 2026-11-15: su
 * Cloudflare acepta hasta ~48 KB y a partir de 64 KB da 414; el servidor de detrás no se puede medir
 * sin sesión, y lo habitual (Node) es un tope de 16 KB para la dirección y las cabeceras juntas, con
 * las cookies de la sesión dentro. 10 500 deja margen y cabe el examen de trampas (trap.ts) con tus
 * puntos débiles. Un simulacro entero, todas las falladas o "dónde fallo" con un historial de verdad
 * ocupan decenas o cientos de KB: esos se copian y se pegan. Si alguno de los que caben se abriera
 * vacío, también se copió (sendToClaude) y basta con pegarlo.
 */
export const MAX_URL = 10_500;
export const fitsUrl = (prompt: string) => claudeUrl(prompt).length <= MAX_URL;

/**
 * El enlace de tu chat de Claude, para mandarlo todo al mismo: https://claude.ai/chat/<id>, tal
 * cual sale en la barra de direcciones (con o sin https://, www o lo que lleve detrás). Los enlaces
 * de compartir (/share/…) no valen: son una copia de solo lectura.
 */
export function chatUrl(input: string): string | null {
  const m = input.trim().match(/^(?:https?:\/\/)?(?:www\.)?claude\.ai\/chat\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:[/?#].*)?$/i);
  return m ? `https://claude.ai/chat/${m[1].toLowerCase()}` : null;
}

/**
 * Un trozo de una lección: la lección entera de contexto, el trozo y la duda. Sin duda, que lo
 * explique. Una sola petición al final, para que Claude no explique además la lección entera.
 */
export function selectionPrompt(lang: Lang, title: string, passage: string, question = '', lines: string[] = []): string {
  const t = TEXT[lang];
  return clean([
    `${t.exam} ${t.lesson}`,
    '',
    title,
    ...lines.filter((x) => x.trim()),
    '',
    t.passage,
    passage.trim(),
    '',
    question.trim() || t.explainPassage,
  ]);
}
