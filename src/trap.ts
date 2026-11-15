// El examen de trampas: un prompt para que Claude haga un examen de práctica de 20 preguntas que no
// solo mide si aciertas, sino en qué trampas caes (función inventada, forzar de más o de menos…),
// con parejas de contraste y, al pegarle los resultados, el recuento por trampa y otra tanda de 20
// sobre las que más se repiten. El texto en español es el que escribió Marcos; el inglés, su traducción.
// Lleva al final tus puntos débiles (de study.ts), para que dentro del reparto por dominio insista en ellos.
import type { StudyRecord } from './ask.ts';
import type { Lang } from './game.ts';

const ES = `Estoy preparando el examen Claude Certified Architect – Foundations. Quiero un examen de práctica que no solo mida si acierto, sino que detecte EN QUÉ TRAMPAS caigo.

## Formato
- 20 preguntas en modo quiz interactivo si lo tienes disponible (NO flashcards). Si no, preséntalas numeradas y espera mis respuestas antes de corregir.
- Estilo del examen real: cada pregunta se enmarca en uno de los 6 escenarios oficiales (Customer Support Resolution Agent, Code Generation with Claude Code, Multi-Agent Research System, Developer Productivity with Claude, Claude Code for Continuous Integration, Structured Data Extraction). Parte de evidencia de producción con cifras (porcentajes, costes, tiempos, volúmenes) y pregunta "What is the most effective… / most proportionate first step / most likely root cause".
- 4 opciones, una sola buena, salvo 2 preguntas de "Choose TWO" con 5 opciones. Si el quiz solo admite una respuesta, en esas haz que cada opción sea una pareja de cambios (p. ej. "A and D").
- Las opciones deben tener longitud parecida: la longitud no puede delatar la buena.

## Temario: mézclalo todo, repartido según el peso de cada dominio
- D1 Agentic Architecture & Orchestration (27%) → 5–6 preguntas: 1.1 bucles guiados por stop_reason · 1.2 orquestación coordinador–subagentes · 1.3 lanzar subagentes y pasarles contexto · 1.4 imponer el flujo y handoffs · 1.5 hooks del Agent SDK · 1.6 estrategias de descomposición · 1.7 resume y fork de sesiones
- D2 Tool Design & MCP Integration (18%) → 3–4: 2.1 las descripciones guían la elección de tool · 2.2 errores estructurados en tools MCP · 2.3 conjuntos de tools acotados y tool_choice · 2.4 integración de servidores MCP · 2.5 buen uso de las tools integradas (Read, Write, Edit, Grep, Glob, Bash)
- D3 Claude Code Configuration & Workflows (20%) → 4: 3.1 jerarquía y alcance de CLAUDE.md · 3.2 slash commands y skills · 3.3 rules por ruta con globs · 3.4 plan mode frente a ejecución directa · 3.5 refinamiento iterativo · 3.6 Claude Code en CI/CD
- D4 Prompt Engineering & Structured Output (20%) → 4: 4.1 criterios explícitos contra falsos positivos · 4.2 few-shot · 4.3 salida estructurada con tool use y JSON schema · 4.4 validación, reintentos y bucles de feedback · 4.5 Message Batches API · 4.6 revisión con varias instancias o varias pasadas
- D5 Context Management & Reliability (15%) → 3: 5.1 hechos críticos en conversaciones largas · 5.2 escalar con los disparadores correctos · 5.3 propagar errores con contexto estructurado · 5.4 contexto al explorar codebases grandes · 5.5 revisión humana y calibración de la confianza · 5.6 procedencia e incertidumbre en la síntesis

## Parejas de contraste (obligatorio)
- Al menos 6 preguntas forman 3 parejas: escenarios muy parecidos con las MISMAS opciones (o casi), pero con respuesta buena distinta porque cambia el problema. Ejemplos: "nadie invoca la skill" frente a "la skill se invoca pero le falta un parámetro"; "el modelo no llama a la tool" frente a "la llama pero inventa datos en un campo"; "no hay riesgo, solo un turno de más" frente a "dinero o compliance exige cero casos".
- Separa las dos preguntas de cada pareja dentro del examen y NO las etiquetes; lo revelas en la corrección.

## Distractores
Cada opción mala representa UNA de estas trampas y debe ser plausible:
1. Función inventada: un flag, parámetro, clave de frontmatter o ajuste que no existe y que resolvería el problema demasiado bien.
2. Forzar de más: hook, gate, plan mode o capa nueva para algo sin riesgo real.
3. Forzar de menos: prompt, revisión posterior o umbral de confianza cuando hay una garantía, dinero o compliance en juego.
4. Más capacidad: ventana de contexto mayor, más max_tokens, más reintentos, meterlo todo en el contexto.
5. Construir de más: servidor, subagente o componente nuevo cuando basta un cambio pequeño en lo que ya existe.
6. Diagnosticar "le falta una tool" cuando el problema es la información que le llega (contexto aislado, errores sin metadatos).
7. tool_choice para todo: usarlo para paralelizar, para bucles en batch o para arreglar datos dentro de los campos.
8. Ignorar una pista del escenario: proponer algo que el escenario dice que ya se probó, o que una cifra o frase descarta.
9. Confundir piezas: Glob frente a Grep (nombre frente a contenido); CLAUDE.md, rules con paths, skills, context: fork, allowed-tools, argument-hint, ~/.claude/CLAUDE.md frente al CLAUDE.md del proyecto.
10. Votación o autoconsistencia (repetir N veces y quedarse con la mayoría), o filtrar por sentimiento o confianza sin calibrar, en vez de criterios explícitos o un enrutamiento calibrado.

Reglas:
- Como respuesta BUENA usa solo funciones documentadas y reales; si dudas de que algo exista, no lo uses como buena.
- Reparte la letra de la buena de forma equilibrada.
- Mete en cada escenario al menos una pista que decida la respuesta ("has never changed an outcome", "requires zero", "already tried last quarter", "15% don't follow the naming convention").

## Pista de cada pregunta
Que me ayude a diagnosticar sin regalar la respuesta, p. ej. "Does it already call the tool?" o "Any money, security or compliance risk?".

## Explicación de cada pregunta
1. El problema dicho en tres palabras (p. ej. "NADIE INVOCA LA SKILL").
2. Por qué la buena lo resuelve.
3. Para cada opción mala, en una línea: por qué falla y la trampa entre corchetes, p. ej. "[Trampa 1 · función inventada]".
4. Una regla para recordar, en una línea.

## Cuando te pegue mis resultados
- Nota ponderada por dominio con los pesos de arriba (el objetivo es el 72%) y aciertos por dominio.
- Recuento de mis fallos POR TRAMPA: cuáles se repiten.
- Las parejas de contraste: cuáles acerté enteras (dominadas) y en cuáles fallé una.
- Las 2 o 3 ideas que no me han entrado, explicadas con otro enfoque (comparación entre escenarios, analogía o regla de descarte), no repitiendo la misma explicación.
- Después ofréceme otra tanda de 20 preguntas solo sobre mis trampas más repetidas, con las parejas de contraste etiquetadas.`;

const EN = `I'm preparing for the Claude Certified Architect – Foundations exam. I want a practice exam that doesn't just measure whether I get it right, but detects WHICH TRAPS I fall into.

## Format
- 20 questions in interactive quiz mode if you have it available (NOT flashcards). If not, present them numbered and wait for my answers before marking.
- Real exam style: each question is framed in one of the 6 official scenarios (Customer Support Resolution Agent, Code Generation with Claude Code, Multi-Agent Research System, Developer Productivity with Claude, Claude Code for Continuous Integration, Structured Data Extraction). Start from production evidence with figures (percentages, costs, times, volumes) and ask "What is the most effective… / most proportionate first step / most likely root cause".
- 4 options, only one right, except 2 "Choose TWO" questions with 5 options. If the quiz only allows one answer, make each option in those a pair of changes (e.g. "A and D").
- Options must be of similar length: length must not give the right one away.

## Syllabus: mix everything, split by each domain's weight
- D1 Agentic Architecture & Orchestration (27%) → 5–6 questions: 1.1 loops driven by stop_reason · 1.2 coordinator–subagent orchestration · 1.3 spawning subagents and passing them context · 1.4 enforcing the workflow and handoffs · 1.5 Agent SDK hooks · 1.6 decomposition strategies · 1.7 session resume and fork
- D2 Tool Design & MCP Integration (18%) → 3–4: 2.1 descriptions drive tool choice · 2.2 structured errors in MCP tools · 2.3 scoped tool sets and tool_choice · 2.4 MCP server integration · 2.5 good use of the built-in tools (Read, Write, Edit, Grep, Glob, Bash)
- D3 Claude Code Configuration & Workflows (20%) → 4: 3.1 CLAUDE.md hierarchy and scope · 3.2 slash commands and skills · 3.3 path-specific rules with globs · 3.4 plan mode vs direct execution · 3.5 iterative refinement · 3.6 Claude Code in CI/CD
- D4 Prompt Engineering & Structured Output (20%) → 4: 4.1 explicit criteria against false positives · 4.2 few-shot · 4.3 structured output with tool use and JSON schema · 4.4 validation, retries and feedback loops · 4.5 Message Batches API · 4.6 review with multiple instances or multiple passes
- D5 Context Management & Reliability (15%) → 3: 5.1 critical facts in long conversations · 5.2 escalating on the right triggers · 5.3 propagating errors with structured context · 5.4 context when exploring large codebases · 5.5 human review and confidence calibration · 5.6 provenance and uncertainty in synthesis

## Contrast pairs (mandatory)
- At least 6 questions form 3 pairs: very similar scenarios with the SAME options (or nearly), but a different right answer because the problem changes. Examples: "nobody invokes the skill" vs "the skill is invoked but a parameter is missing"; "the model doesn't call the tool" vs "it calls it but makes up data in a field"; "no risk, just one extra turn" vs "money or compliance requires zero cases".
- Keep the two questions of each pair apart in the exam and do NOT label them; reveal them when marking.

## Distractors
Each wrong option stands for ONE of these traps and must be plausible:
1. Made-up feature: a flag, parameter, frontmatter key or setting that doesn't exist and would solve the problem too neatly.
2. Over-enforcing: a hook, gate, plan mode or new layer for something with no real risk.
3. Under-enforcing: a prompt, after-the-fact review or confidence threshold when a guarantee, money or compliance is at stake.
4. More capacity: a bigger context window, more max_tokens, more retries, putting everything in context.
5. Over-building: a new server, subagent or component when a small change to what exists is enough.
6. Diagnosing "it's missing a tool" when the problem is the information it gets (isolated context, errors without metadata).
7. tool_choice for everything: using it to parallelize, for batch loops or to fix data inside fields.
8. Ignoring a clue in the scenario: proposing something the scenario says was already tried, or that a figure or phrase rules out.
9. Mixing up pieces: Glob vs Grep (name vs content); CLAUDE.md, rules with paths, skills, context: fork, allowed-tools, argument-hint, ~/.claude/CLAUDE.md vs the project CLAUDE.md.
10. Voting or self-consistency (repeat N times and keep the majority), or filtering by sentiment or uncalibrated confidence, instead of explicit criteria or calibrated routing.

Rules:
- As the RIGHT answer, use only real, documented features; if you doubt something exists, don't use it as the right answer.
- Spread the right answer's letter evenly.
- Put at least one deciding clue in each scenario ("has never changed an outcome", "requires zero", "already tried last quarter", "15% don't follow the naming convention").

## Hint for each question
It should help me diagnose without giving the answer away, e.g. "Does it already call the tool?" or "Any money, security or compliance risk?".

## Explanation for each question
1. The problem in three words (e.g. "NOBODY INVOKES THE SKILL").
2. Why the right answer solves it.
3. For each wrong option, in one line: why it fails and the trap in brackets, e.g. "[Trap 1 · made-up feature]".
4. One rule to remember, in one line.

## When I paste my results
- Score weighted by domain with the weights above (the target is 72%) and hits per domain.
- Count of my misses BY TRAP: which ones repeat.
- The contrast pairs: which ones I got fully right (mastered) and in which I missed one.
- The 2 or 3 ideas that haven't sunk in, explained from another angle (comparing scenarios, an analogy or an elimination rule), not repeating the same explanation.
- Then offer me another round of 20 questions only on my most repeated traps, with the contrast pairs labelled.`;

const WEAK = {
  es: {
    head: '## Mis puntos débiles (de mi app de estudio)',
    tasks: (list: string) => `Dentro del reparto por dominio, elige sobre todo estos task statements, donde más fallo: ${list}.`,
    domains: (list: string) => `Mis aciertos por dominio: ${list}.`,
  },
  en: {
    head: '## My weak spots (from my study app)',
    tasks: (list: string) => `Within the split by domain, pick mostly these task statements, where I fail the most: ${list}.`,
    domains: (list: string) => `My hits by domain: ${list}.`,
  },
};

/** Cuántos task statements flojos se mandan: los justos para orientar sin alargar el enlace. */
export const WEAK_TASKS = 6;

/**
 * El prompt del examen de trampas y, si ya has contestado algo, tus puntos débiles: los task
 * statements con peor porcentaje (los que has fallado alguna vez) y los aciertos por dominio.
 */
export function trapPrompt(lang: Lang, record?: Pick<StudyRecord, 'domains' | 'tasks'>): string {
  const base = lang === 'es' ? ES : EN;
  if (!record) return base;
  const t = WEAK[lang];
  const weak = record.tasks
    .filter((x) => x.right < x.seen)
    .sort((a, b) => a.right / a.seen - b.right / b.seen || b.seen - a.seen)
    .slice(0, WEAK_TASKS)
    .map((x) => `${x.ts} (${x.right}/${x.seen})`);
  const domains = record.domains.filter((d) => d.all[1] > 0).map((d) => `D${d.n} ${Math.round((100 * d.all[0]) / d.all[1])}%`);
  if (!weak.length && !domains.length) return base;
  return [base, '', t.head, ...(weak.length ? [t.tasks(weak.join(', '))] : []), ...(domains.length ? [t.domains(domains.join(' · '))] : [])].join('\n');
}
