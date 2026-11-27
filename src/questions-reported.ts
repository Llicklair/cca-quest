// Temas que quien ya hizo el examen real se encontró y no estaban en el banco: `--bare` en CI, que
// contó Hugo, y GitHub Actions, que salió en otro examen (noviembre de 2026). Comprobados contra la documentación
// de Claude Code (code.claude.com/docs/en/headless#start-faster-with-bare-mode y /github-actions). Van aparte de QUESTIONS para que
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
  // GitHub Actions: salió en el examen real (noviembre de 2026). Comprobado contra
  // code.claude.com/docs/en/github-actions y la documentación de anthropics/claude-code-action.
  {
    id: 'r-ci-gha-review-every-pr',
    domain: 'claude-code',
    setting: 'ci',
    ts: '3.6',
    scenario:
      'Your team set up Claude Code GitHub Actions with `/install-github-app`. Claude answers well whenever someone writes `@claude` in a PR comment, but the team wants every new PR reviewed by default, and last month 60% of PRs were merged without anyone asking Claude.',
    ask: 'What is the most effective change?',
    options: [
      "Add `auto_review: true` to the action's inputs, so it reviews each new pull request as soon as it opens without anyone mentioning Claude.",
      'Add a scheduled job whose bot account comments `@claude review` on each open PR, so the current mention-driven workflow does the work.',
      'Give the workflow a `prompt` with the review instructions and trigger it on `pull_request`, so it runs on every PR without a mention.',
      'Put the review criteria in `CLAUDE.md` and ask authors in the PR template to mention `@claude`, so every review follows the same rules.',
    ],
    answer: 2,
    why: [
      '`auto_review` is not an input of the action. Runs without a mention come from giving it a `prompt`.',
      'Bot comments are rejected unless the bot is in `allowed_bots`, and a cron adds delay to do what a `prompt` does directly.',
      'With a `prompt` input the action runs on the workflow\'s event instead of waiting for `@claude`; `pull_request` covers every new PR.',
      'It still depends on people remembering to ask: the 60% that nobody mentioned would stay unreviewed.',
    ],
    rule: 'No `prompt`: Claude waits for `@claude`. With a `prompt`: it runs on the event by itself.',
  },
  {
    id: 'r-ci-gha-custom-instructions',
    domain: 'claude-code',
    setting: 'ci',
    ts: '3.6',
    scenario:
      'You are moving a workflow from `claude-code-action@beta` to `@v1`. It used `custom_instructions` to add one rule ("flag SQL built by string concatenation") on top of Claude Code\'s normal review behavior. A draft of the upgrade passes that text as `--system-prompt` in `claude_args`, and in a test run Claude drops its usual review conventions.',
    ask: 'What should the upgraded workflow use for that rule?',
    options: [
      "`--append-system-prompt` in `claude_args`, which adds the rule and keeps Claude Code's default system prompt as it is.",
      "`--system-prompt` with Claude Code's default prompt pasted in before the rule, so nothing is lost when it is replaced.",
      'A `--custom-instructions` flag in `claude_args`, the v1 name of the old input, which keeps the beta behavior exactly.',
      'The `settings` input, with the rule as a JSON key, since v1 moved the old beta inputs into Claude Code settings.',
    ],
    answer: 0,
    why: [
      'In v1, `custom_instructions` becomes `--append-system-prompt`: it appends to the default prompt instead of replacing it.',
      'A hand-copied default prompt is brittle and goes stale with every Claude Code release; appending does the job.',
      'There is no flag named after `custom_instructions`; the documented replacement is `--append-system-prompt`.',
      'Only some inputs moved to `settings` (such as `claude_env`); CLI options like the system prompt flags go in `claude_args`.',
    ],
    rule: '`custom_instructions` becomes `--append-system-prompt`: add to the default prompt, do not replace it.',
  },
  {
    id: 'r-ci-gha-token-no-ci',
    domain: 'claude-code',
    setting: 'ci',
    ts: '3.6',
    scenario:
      'Claude fixes failing tests on PRs through the GitHub Action, and the workflow passes `github_token: ${{ secrets.GITHUB_TOKEN }}`. Claude\'s commits land on the PR branch, but the test workflow never runs on them, so reviewers re-run the tests by hand on about 20 PRs a week.',
    ask: 'What is the most effective fix?',
    options: [
      "Grant the `GITHUB_TOKEN` `actions: write` in the workflow's `permissions`, so the commits it pushes may start other workflows.",
      'Add `on: push` for `claude/**` branches to the test workflow, so it also listens on the branches where Claude pushes commits.',
      'Tell Claude in `CLAUDE.md` to run the whole test suite before each commit, so the PR stops depending on CI for the result.',
      "Stop passing the default `GITHUB_TOKEN`: use the Claude GitHub App or a custom app token, so Claude's commits trigger CI.",
    ],
    answer: 3,
    why: [
      'Permissions do not change the rule: what is pushed with `GITHUB_TOKEN` starts no new workflow runs.',
      'The trigger is not the problem: whatever the branch or event, commits pushed with `GITHUB_TOKEN` start no workflows.',
      'A run inside Claude\'s job is not the team\'s CI check, and an instruction in `CLAUDE.md` is no guarantee.',
      'GitHub does not trigger workflows on commits made with the default `GITHUB_TOKEN`. An app token, like the Claude GitHub App\'s, does.',
    ],
    rule: 'Commits made with `GITHUB_TOKEN` trigger no workflows: use an app token when CI must run on them.',
  },
  {
    id: 'r-ci-gha-allowed-bots',
    domain: 'claude-code',
    setting: 'ci',
    ts: '3.6',
    scenario:
      'Your dependency bot opens about 40 PRs a month and comments `@claude review` on each one. Every run fails before Claude starts, saying the actor is not allowed, while human `@claude` comments on the same PRs work. Only this bot should be able to start Claude; other bots post on these PRs too.',
    ask: 'What should you change?',
    options: [
      "Set `allowed_bots: '*'`, so any bot that comments on these PRs can start Claude and new bots need no extra configuration.",
      'List that bot in `allowed_bots`, so the action accepts runs started by that one bot and keeps rejecting all the others.',
      'Give the bot account write access to the repository, so it passes the write-access check the action runs on each comment.',
      'Add the bot to `allowed_non_write_users`, so the action lets its comments through even though it has no write access.',
    ],
    answer: 1,
    why: [
      "It works, but lets every bot start Claude, which the case rules out. Prefer an explicit list over `'*'`.",
      'Bots are rejected by default so they cannot trigger Claude in a loop; `allowed_bots` lets through only the ones you name.',
      'The run is rejected for being a bot, not for its permissions: bots are blocked unless they are listed in `allowed_bots`.',
      'That input relaxes the write-access check for users, is marked risky and needs your own `github_token`; the bot check is separate.',
    ],
    rule: "Bots cannot start the action unless they are named in `allowed_bots`: name them, do not use `'*'`.",
  },
  {
    id: 'r-ci-gha-claude-md-base',
    domain: 'claude-code',
    setting: 'ci',
    ts: '3.6',
    scenario:
      "A PR edits the repo's `CLAUDE.md` so reviews stop flagging missing docstrings. On that same PR, the GitHub Action's review still flags 12 missing docstrings, as if the change were not there. The author thinks the action is using a cached copy of the old file.",
    ask: 'What explains it, and what should the author do?',
    options: [
      'On PRs the action takes `CLAUDE.md` from the base branch, so a PR cannot change its own review rules: merge it and later PRs use it.',
      'The action caches `CLAUDE.md` per branch between runs: add a step that clears the Actions cache before the review job starts.',
      '`CLAUDE.md` is read only in interactive mode: pass the file with `--append-system-prompt-file CLAUDE.md` in `claude_args`.',
      "Set `restrict_untrusted_prs: false`, so the action trusts the PR's own version of `CLAUDE.md` while it reviews that PR.",
    ],
    answer: 0,
    why: [
      "It is a safeguard: on PRs, `CLAUDE.md` and `.claude/` are restored from the base branch, and the PR's versions are kept under `.claude-pr/` only for reference.",
      'No cache is involved: the action deliberately uses the base branch\'s `CLAUDE.md` when it works on a PR.',
      '`CLAUDE.md` is used in both modes, and the copy in the workspace is the base branch\'s, so this passes the old rules again.',
      'That input stops commands that run repo code on PRs from authors without write access; it does not pick which `CLAUDE.md` is used.',
    ],
    rule: 'On PRs, `CLAUDE.md` and `.claude/` come from the base branch: a PR cannot rewrite its own review rules.',
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
  'r-ci-gha-review-every-pr': {
    scenario:
      'Tu equipo montó Claude Code en GitHub Actions con `/install-github-app`. Claude responde bien cada vez que alguien escribe `@claude` en un comentario de una PR, pero el equipo quiere que todas las PR nuevas se revisen por defecto, y el mes pasado el 60% se fusionaron sin que nadie se lo pidiera a Claude.',
    ask: '¿Cuál es el cambio más eficaz?',
    options: [
      'Añadir `auto_review: true` a los inputs de la action, para que revise cada PR nueva en cuanto se abra sin que nadie mencione a Claude.',
      'Añadir un job programado cuya cuenta de bot comente `@claude review` en cada PR abierta, para que el workflow actual de menciones haga el trabajo.',
      'Darle al workflow un `prompt` con las instrucciones de revisión y lanzarlo con `pull_request`, para que se ejecute en cada PR sin mención.',
      'Poner los criterios de revisión en `CLAUDE.md` y pedir en la plantilla de PR que se mencione a `@claude`, para que todas sigan las mismas reglas.',
    ],
    why: [
      '`auto_review` no es un input de la action. Las ejecuciones sin mención salen de darle un `prompt`.',
      'Los comentarios de bots se rechazan salvo que el bot esté en `allowed_bots`, y un cron añade retraso para hacer lo que un `prompt` hace directamente.',
      'Con el input `prompt`, la action se ejecuta con el evento del workflow en vez de esperar a `@claude`; `pull_request` cubre todas las PR nuevas.',
      'Sigue dependiendo de que la gente se acuerde de pedirlo: el 60% que nadie mencionó seguiría sin revisar.',
    ],
    rule: 'Sin `prompt`, Claude espera a `@claude`. Con un `prompt`, se ejecuta sola con el evento.',
  },
  'r-ci-gha-custom-instructions': {
    scenario:
      'Estás pasando un workflow de `claude-code-action@beta` a `@v1`. Usaba `custom_instructions` para añadir una regla («marca el SQL construido concatenando strings») encima del comportamiento normal de revisión de Claude Code. Un borrador del cambio pasa ese texto como `--system-prompt` en `claude_args`, y en una prueba Claude deja de seguir sus convenciones de revisión habituales.',
    ask: '¿Qué debería usar el workflow actualizado para esa regla?',
    options: [
      '`--append-system-prompt` en `claude_args`, que añade la regla y deja tal cual el system prompt por defecto de Claude Code.',
      '`--system-prompt` con el prompt por defecto de Claude Code pegado antes de la regla, para no perder nada al sustituirlo.',
      'Un flag `--custom-instructions` en `claude_args`, el nombre del antiguo input en la v1, que mantiene igual el comportamiento de la beta.',
      'El input `settings`, con la regla como clave JSON, ya que la v1 llevó los antiguos inputs de la beta a los ajustes de Claude Code.',
    ],
    why: [
      'En la v1, `custom_instructions` pasa a ser `--append-system-prompt`: añade al prompt por defecto en vez de sustituirlo.',
      'Un prompt por defecto copiado a mano es frágil y se queda viejo con cada versión de Claude Code; añadir hace el mismo trabajo.',
      'No hay ningún flag con el nombre de `custom_instructions`; el sustituto documentado es `--append-system-prompt`.',
      'Solo algunos inputs pasaron a `settings` (como `claude_env`); las opciones de la CLI, como los flags del system prompt, van en `claude_args`.',
    ],
    rule: '`custom_instructions` pasa a ser `--append-system-prompt`: añade al prompt por defecto, no lo sustituyas.',
  },
  'r-ci-gha-token-no-ci': {
    scenario:
      'Claude arregla tests que fallan en las PR desde la GitHub Action, y el workflow pasa `github_token: ${{ secrets.GITHUB_TOKEN }}`. Los commits de Claude llegan a la rama de la PR, pero el workflow de tests nunca se ejecuta con ellos, así que los revisores relanzan los tests a mano en unas 20 PR por semana.',
    ask: '¿Cuál es el arreglo más eficaz?',
    options: [
      'Dar al `GITHUB_TOKEN` `actions: write` en los `permissions` del workflow, para que los commits que sube puedan lanzar otros workflows.',
      'Añadir `on: push` para las ramas `claude/**` al workflow de tests, para que escuche también las ramas donde Claude sube sus commits.',
      'Decirle a Claude en `CLAUDE.md` que ejecute toda la suite de tests antes de cada commit, para que la PR no dependa de la CI.',
      'Dejar de pasar el `GITHUB_TOKEN` por defecto: usar la Claude GitHub App o el token de una app propia, para que sus commits lancen la CI.',
    ],
    why: [
      'Los permisos no cambian la regla: lo que se sube con `GITHUB_TOKEN` no lanza ningún workflow nuevo.',
      'El evento no es el problema: sea cual sea la rama o el evento, los commits subidos con `GITHUB_TOKEN` no lanzan workflows.',
      'Una ejecución dentro del job de Claude no es la comprobación de CI del equipo, y una instrucción en `CLAUDE.md` no es una garantía.',
      'GitHub no lanza workflows con los commits hechos con el `GITHUB_TOKEN` por defecto. El token de una app, como el de la Claude GitHub App, sí.',
    ],
    rule: 'Los commits hechos con `GITHUB_TOKEN` no lanzan workflows: usa el token de una app si la CI tiene que correr con ellos.',
  },
  'r-ci-gha-allowed-bots': {
    scenario:
      'Tu bot de dependencias abre unas 40 PR al mes y comenta `@claude review` en cada una. Todas las ejecuciones fallan antes de que Claude empiece, diciendo que el actor no está permitido, mientras que los comentarios `@claude` de personas en esas mismas PR funcionan. Solo este bot debería poder lanzar a Claude; otros bots también comentan en estas PR.',
    ask: '¿Qué deberías cambiar?',
    options: [
      "Poner `allowed_bots: '*'`, para que cualquier bot que comente en estas PR pueda lanzar a Claude y los bots nuevos no necesiten configuración.",
      'Poner ese bot en `allowed_bots`, para que la action acepte las ejecuciones que lanza ese bot y siga rechazando a todos los demás.',
      'Dar a la cuenta del bot permiso de escritura en el repositorio, para que pase la comprobación de escritura que hace la action en cada comentario.',
      'Añadir el bot a `allowed_non_write_users`, para que la action deje pasar sus comentarios aunque no tenga permiso de escritura.',
    ],
    why: [
      "Funciona, pero deja que cualquier bot lance a Claude, y el caso lo descarta. Mejor una lista explícita que `'*'`.",
      'Los bots se rechazan por defecto para que no puedan lanzar a Claude en bucle; `allowed_bots` deja pasar solo a los que nombras.',
      'Se rechaza por ser un bot, no por sus permisos: los bots se bloquean salvo que estén en `allowed_bots`.',
      'Ese input relaja la comprobación de escritura para usuarios, está marcado como arriesgado y necesita tu propio `github_token`; la de bots es otra.',
    ],
    rule: "Los bots no pueden lanzar la action salvo que estén en `allowed_bots`: nómbralos, no uses `'*'`.",
  },
  'r-ci-gha-claude-md-base': {
    scenario:
      'Una PR edita el `CLAUDE.md` del repo para que las revisiones dejen de marcar docstrings que faltan. En esa misma PR, la revisión de la GitHub Action sigue marcando 12 docstrings que faltan, como si el cambio no estuviera. La autora cree que la action usa una copia en caché del fichero antiguo.',
    ask: '¿Qué lo explica y qué debería hacer la autora?',
    options: [
      'En las PR la action toma el `CLAUDE.md` de la rama base, así que una PR no cambia sus propias reglas de revisión: fusionarla y las siguientes PR lo usarán.',
      'La action guarda en caché el `CLAUDE.md` de cada rama entre ejecuciones: añadir un paso que borre la caché de Actions antes del job de revisión.',
      '`CLAUDE.md` solo se lee en modo interactivo: pasar el fichero con `--append-system-prompt-file CLAUDE.md` en `claude_args`.',
      'Poner `restrict_untrusted_prs: false`, para que la action se fíe de la versión de `CLAUDE.md` de la propia PR mientras la revisa.',
    ],
    why: [
      'Es una protección: en las PR, `CLAUDE.md` y `.claude/` se restauran desde la rama base, y las versiones de la PR se guardan en `.claude-pr/` solo como referencia.',
      'No hay ninguna caché: la action usa a propósito el `CLAUDE.md` de la rama base cuando trabaja en una PR.',
      '`CLAUDE.md` se usa en los dos modos, y la copia del espacio de trabajo es la de la rama base, así que esto vuelve a pasar las reglas antiguas.',
      'Ese input frena los comandos que ejecutan código del repo en PR de autores sin permiso de escritura; no decide qué `CLAUDE.md` se usa.',
    ],
    rule: 'En las PR, `CLAUDE.md` y `.claude/` vienen de la rama base: una PR no puede reescribir sus propias reglas de revisión.',
  },
};
