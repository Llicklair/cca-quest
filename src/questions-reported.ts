// Temas que quien ya hizo el examen real se encontró y no estaban en el banco (de momento, `--bare`
// en CI, que contó Hugo en noviembre de 2026). Comprobados contra la documentación de Claude Code
// (code.claude.com/docs/en/headless#start-faster-with-bare-mode). Van aparte de QUESTIONS para que
// los simulacros fijos 1–4 no cambien (ver bank.ts); entran en las rondas, el repaso de su lección y
// los simulacros aleatorio y rápido. La traducción va en el mismo fichero, por id, en el mismo orden.
import type { Question, QuestionText } from './game.ts';

export const REPORTED: Question[] = [
  // --- Claude Code for Continuous Integration ---
  {
    id: 'r-ci-bare-same-start',
    domain: 'claude-code',
    setting: 'ci',
    ts: '3.6',
    scenario:
      "A nightly `claude -p` job gives different results on the team's self-hosted runners. On one runner, a hook in an engineer's `~/.claude` reformats every edited file; on another, an MCP server from an old `.mcp.json` starts and Claude calls it. The team wants every run to start from the same setup, with only what the job passes in.",
    ask: 'What should the architect change?',
    options: [
      "Copy one engineer's `~/.claude` folder into every runner image, so all runners load the same hooks, servers and personal settings.",
      'Add `--output-format json` with a `--json-schema`, so every runner returns its results in exactly the same shape.',
      'Run the job with `--bare`, so nothing on the runner is auto-discovered, and pass in what the job needs with flags.',
      'Add `--max-turns 5`, so the run stops at the same point on every runner, whatever hooks or servers it finds there.',
    ],
    answer: 2,
    why: [
      "Bakes one person's setup into CI: it is still not version-controlled, and it drifts as soon as anyone changes their `~/.claude`.",
      'Fixes the shape of the output, not what each runner loads before the run starts.',
      "Bare mode never reads the host's `~/.claude`, `.mcp.json` or CLAUDE.md, so every machine starts the same. It is the recommended mode for scripted and CI calls.",
      'Caps how long the run lasts; the hooks and servers still load and still differ between runners.',
    ],
    rule: 'In CI, `--bare` gives every machine the same start: nothing is auto-discovered, everything is passed in.',
  },
  {
    id: 'r-ci-bare-review-rules',
    domain: 'claude-code',
    setting: 'ci',
    ts: '3.6',
    scenario:
      "Your PR review job now runs `claude --bare -p` so that every runner behaves the same. Since the switch, reviews ignore the team's criteria in the repo's `CLAUDE.md`: they flag style nits the team excluded and skip the required security checks. Nothing else about the job has changed.",
    ask: 'What is the most effective fix?',
    options: [
      "Pass the repo's rules with `--append-system-prompt-file CLAUDE.md`, which adds them to Claude Code's default system prompt.",
      'Copy the criteria to `~/.claude/CLAUDE.md` on each runner, since bare mode falls back to the user-level file.',
      'Pass the rules with `--system-prompt-file CLAUDE.md`, so they replace the default system prompt and nothing competes with them.',
      'Remove `--bare` and keep `-p`, so the job auto-loads `CLAUDE.md` again along with whatever each runner has in `~/.claude`.',
    ],
    answer: 0,
    why: [
      "Bare mode loads no CLAUDE.md, so the context has to be passed in. Appending keeps Claude Code's default prompt and adds the team's rules.",
      'There is no fallback: bare mode skips every CLAUDE.md, the user-level one included.',
      "Replaces Claude Code's whole default prompt, with its built-in instructions, just to add a few rules.",
      'Brings back the differences between runners that the team switched to bare mode to remove.',
    ],
    rule: 'Bare mode loads nothing on its own: pass the context the job needs, e.g. with `--append-system-prompt-file`.',
  },
  {
    id: 'r-ci-bare-not-print',
    domain: 'claude-code',
    setting: 'ci',
    ts: '3.6',
    scenario:
      'A new CI step runs `claude --bare "Review the diff in pr.diff"`, and the job times out after 6 hours with no output. A teammate says `--bare` already makes Claude Code run without a person, since it skips all the interactive setup.',
    ask: 'What should the architect change?',
    options: [
      'Add `--max-budget-usd 2`, so the run stops once it has spent its budget instead of running for hours.',
      'Pipe the diff in through stdin with `< pr.diff`, so the session already has its input and exits on its own when it is done.',
      'Also set `CLAUDE_CODE_SIMPLE=1`, so bare mode turns off the interactive interface as well.',
      'Add `-p`: `--bare` only skips auto-discovery, and without `-p` the session still waits for input.',
    ],
    answer: 3,
    why: [
      'Works only in print mode, and spend is not the problem: the session is waiting for a person.',
      'Redirecting stdin does not make a session non-interactive; the documented way is `-p`.',
      '`--bare` already sets `CLAUDE_CODE_SIMPLE`; neither one turns off the interactive interface.',
      '`-p` processes the prompt, prints the result and exits. `--bare` and `-p` do different jobs, and CI usually wants both.',
    ],
    rule: '`--bare` is not `-p`: one skips auto-discovery, the other makes the run non-interactive.',
  },
];

export const REPORTED_ES: Record<string, QuestionText> = {
  // --- Claude Code for Continuous Integration ---
  'r-ci-bare-same-start': {
    scenario:
      'Un job nocturno con `claude -p` da resultados distintos en los runners propios del equipo. En uno, un hook del `~/.claude` de un ingeniero reformatea cada fichero editado; en otro arranca un servidor MCP de un `.mcp.json` antiguo y Claude lo llama. El equipo quiere que cada ejecución empiece igual, solo con lo que le pasa el job.',
    ask: '¿Qué debería cambiar el arquitecto?',
    options: [
      'Copiar la carpeta `~/.claude` de un ingeniero en la imagen de cada runner, para que todos carguen los mismos hooks, servidores y ajustes personales.',
      'Añadir `--output-format json` con un `--json-schema`, para que todos los runners devuelvan sus resultados exactamente con la misma forma.',
      'Ejecutar el job con `--bare`, para que no se autodescubra nada del runner, y pasarle con flags lo que necesite el job.',
      'Añadir `--max-turns 5`, para que la ejecución pare en el mismo punto en cada runner, encuentre allí los hooks o servidores que encuentre.',
    ],
    why: [
      'Mete en CI la configuración de una persona: sigue sin estar versionada y se desajusta en cuanto alguien cambia su `~/.claude`.',
      'Arregla la forma de la salida, no lo que carga cada runner antes de empezar.',
      'El modo bare nunca lee el `~/.claude`, el `.mcp.json` ni el CLAUDE.md de la máquina, así que todas empiezan igual. Es el modo recomendado para llamadas desde scripts y CI.',
      'Limita cuánto dura la ejecución; los hooks y servidores se siguen cargando y siguen siendo distintos en cada runner.',
    ],
    rule: 'En CI, `--bare` da a todas las máquinas el mismo arranque: no se autodescubre nada, todo se pasa explícitamente.',
  },
  'r-ci-bare-review-rules': {
    scenario:
      'Tu job de revisión de PR ejecuta ahora `claude --bare -p` para que todos los runners se comporten igual. Desde el cambio, las revisiones ignoran los criterios del equipo en el `CLAUDE.md` del repo: señalan detalles de estilo que el equipo excluyó y se saltan las comprobaciones de seguridad obligatorias. Nada más ha cambiado en el job.',
    ask: '¿Cuál es el arreglo más eficaz?',
    options: [
      'Pasar las reglas del repo con `--append-system-prompt-file CLAUDE.md`, que las añade al system prompt por defecto de Claude Code.',
      'Copiar los criterios a `~/.claude/CLAUDE.md` en cada runner, ya que el modo bare recurre al fichero de nivel de usuario.',
      'Pasar las reglas con `--system-prompt-file CLAUDE.md`, para que sustituyan al system prompt por defecto y nada compita con ellas.',
      'Quitar `--bare` y dejar `-p`, para que el job vuelva a cargar `CLAUDE.md` junto con lo que cada runner tenga en `~/.claude`.',
    ],
    why: [
      'El modo bare no carga ningún CLAUDE.md, así que el contexto hay que pasarlo explícitamente. Añadirlo mantiene el prompt por defecto de Claude Code y suma las reglas del equipo.',
      'No hay ningún fichero de respaldo: el modo bare se salta todos los CLAUDE.md, también el de usuario.',
      'Sustituye todo el prompt por defecto de Claude Code, con sus instrucciones de serie, solo para añadir unas reglas.',
      'Devuelve las diferencias entre runners que el equipo quería quitar al pasar al modo bare.',
    ],
    rule: 'El modo bare no carga nada por su cuenta: pásale el contexto que necesita el job, p. ej. con `--append-system-prompt-file`.',
  },
  'r-ci-bare-not-print': {
    scenario:
      'Un paso nuevo de CI ejecuta `claude --bare "Review the diff in pr.diff"` y el job agota su tiempo a las 6 horas sin ninguna salida. Un compañero dice que `--bare` ya hace que Claude Code funcione sin una persona delante, porque se salta toda la configuración interactiva.',
    ask: '¿Qué debería cambiar el arquitecto?',
    options: [
      'Añadir `--max-budget-usd 2`, para que la ejecución pare al gastar su presupuesto en vez de seguir durante horas.',
      'Pasar el diff por stdin con `< pr.diff`, para que la sesión ya tenga su entrada y termine sola cuando acabe.',
      'Definir también `CLAUDE_CODE_SIMPLE=1`, para que el modo bare desactive además la interfaz interactiva.',
      'Añadir `-p`: `--bare` solo se salta el autodescubrimiento y, sin `-p`, la sesión sigue esperando entrada.',
    ],
    why: [
      'Solo funciona en modo print, y el problema no es el gasto: la sesión está esperando a una persona.',
      'Redirigir stdin no hace que una sesión sea no interactiva; la forma documentada es `-p`.',
      '`--bare` ya define `CLAUDE_CODE_SIMPLE`; ninguno de los dos desactiva la interfaz interactiva.',
      '`-p` procesa el prompt, escribe el resultado y termina. `--bare` y `-p` hacen cosas distintas, y en CI se suelen usar los dos.',
    ],
    rule: '`--bare` no es `-p`: uno se salta el autodescubrimiento y el otro hace que la ejecución no sea interactiva.',
  },
};
