// Preguntas de respuesta múltiple ("select 2"): el examen real también las tiene (guía v1.0,
// "multiple-choice and multiple-response items"). 5 opciones y 2 buenas; solo cuenta acertar
// las dos. Van aparte del banco para que los simulacros fijos 1–4 no cambien (ver bank.ts).
// La traducción va en el mismo fichero, por id, con las opciones en el mismo orden.
import type { Question, QuestionText } from './game.ts';

export const MULTI: Question[] = [
  // --- Customer Support Resolution Agent ---
  {
    id: 'm-refund-gate-and-handoff',
    domain: 'agentic',
    setting: 'support',
    ts: '1.4',
    scenario:
      'Your support agent\'s system prompt says to verify identity with `get_customer` before any refund. An audit of 6,800 refunds finds 3% issued with no verified customer ID. Separately, human agents who receive `escalate_to_human` cases cannot see the chat transcript and get notes like "Customer upset about order, please help", so they re-ask customers for everything.',
    ask: 'Which TWO changes address these problems most reliably?',
    options: [
      'Repeat the verification rule at the start and end of the system prompt and add few-shot examples that call `get_customer` before `process_refund`.',
      'Add a prerequisite gate in code that blocks `process_refund` until `get_customer` has returned a verified customer ID for this conversation.',
      'Run a nightly job that flags refunds issued without a verified customer ID so a supervisor can review and reverse them the next day.',
      'Escalate with only the customer\'s original message, so the human agent forms an unbiased view instead of reusing the agent\'s analysis.',
      'Make `escalate_to_human` require a structured summary: customer ID, root cause, refund amount and recommended action.',
    ],
    answer: 1,
    answers: [1, 4],
    why: [
      'Prompt instructions and examples are still probabilistic guidance; with money at stake, a non-zero skip rate is not acceptable.',
      'A programmatic prerequisite makes the order deterministic: the refund call cannot run until verification has actually succeeded.',
      'An after-the-fact audit only detects the problem once money has moved; it does not enforce the order of the steps.',
      'The human has no transcript, so stripping the agent\'s findings forces them to restart the investigation, which is the current problem.',
      'Humans without the transcript need a structured handoff with customer details, root cause and recommended action to act without re-asking.',
    ],
    rule: 'Enforce critical step order in code, not in the prompt, and hand off to humans with a structured summary they can act on.',
  },
  {
    id: 'm-refund-error-categories',
    domain: 'tools',
    setting: 'support',
    ts: '2.2',
    scenario:
      'Your `process_refund` MCP tool answers every failure with `isError: true` and the text "Operation failed". Of last week\'s 1,140 failures, 61% were payment-gateway timeouts that succeed on a later try, 27% were refunds outside the 30-day policy window and 12% had malformed order IDs. The agent retries each failure 3 times, then tells the customer "a technical problem occurred", even for the policy-window cases.',
    ask: 'Which TWO changes let the agent recover correctly from these failures?',
    options: [
      'Add an `errorCategory` (transient, validation, business, permission), an `isRetryable` flag and a readable description to every error result.',
      'Keep the generic message but raise the agent\'s retry limit from 3 to 5 with exponential backoff, so more of the gateway timeouts get through.',
      'For refunds outside the policy window, return `isRetryable: false` with a customer-friendly explanation of the 30-day rule.',
      'Return policy-window refusals as a successful result with an empty refund record, so the agent does not treat them as failures.',
      'Instruct the agent to call `escalate_to_human` whenever `process_refund` fails, so a person decides what to do with each failure.',
    ],
    answer: 0,
    answers: [0, 2],
    why: [
      'Structured metadata lets the agent retry only the transient timeouts, correct malformed IDs and stop wasting attempts on errors that will never succeed.',
      'More retries still waste attempts on policy and validation errors that will never succeed, and the agent still cannot explain them.',
      'A business rule violation is not retryable; flagging it and adding a plain explanation lets the agent tell the customer why instead of retrying.',
      'Marking a refusal as success hides the failure: the agent may tell the customer the refund went through, and it cannot explain the rule.',
      'Escalating every failure sends humans timeouts that a retry would fix and clear policy cases the agent could explain, hurting first-contact resolution.',
    ],
    rule: 'Give MCP errors a category, a retryable flag and a readable reason so the agent can choose between retrying, correcting and explaining.',
  },
  // --- Code Generation with Claude Code ---
  {
    id: 'm-claude-md-shared-and-imports',
    domain: 'claude-code',
    setting: 'codegen',
    ts: '3.1',
    scenario:
      'Your monorepo\'s root `CLAUDE.md` has grown to 1,400 lines holding the standards of all 6 packages, and in `packages/payments` sessions Claude now applies the web app\'s accessibility rules to API handlers. Two new hires also report that Claude ignores the team\'s commit-message and test-naming rules; it turns out those rules live only in the tech lead\'s `~/.claude/CLAUDE.md`.',
    ask: 'Which TWO changes fix these problems?',
    options: [
      'Have each new hire copy the tech lead\'s `~/.claude/CLAUDE.md` into their own home directory as part of onboarding.',
      'Put the commit and test-naming rules in a `/conventions` slash command in `.claude/commands/` that new hires run when they start a session.',
      'Move the commit and test-naming rules into the project-level `CLAUDE.md` that is committed to the repository.',
      'Move package standards out of the root file and have each package\'s `CLAUDE.md` `@import` only the standards files that apply to it.',
      'Keep every standard in the root `CLAUDE.md` but put each package\'s rules under its own heading so Claude picks the relevant section.',
    ],
    answer: 2,
    answers: [2, 3],
    why: [
      'Copies of a user-level file are not version-controlled, so they drift and miss later updates; shared rules should reach the team through the repository.',
      'A command only applies when someone remembers to run it; standards that should always apply belong in `CLAUDE.md`, which is always loaded.',
      'User-level instructions apply only to that user; the project-level `CLAUDE.md` in version control reaches every teammate automatically.',
      '`@import` keeps configuration modular, so each package loads only the standards its maintainers chose and payments no longer sees web rules.',
      'Every session would still load every package\'s rules and rely on Claude inferring which section applies, which is the current failure.',
    ],
    rule: 'Shared standards go in project-level `CLAUDE.md`; keep it modular with `@import` so each package loads only what applies to it.',
  },
  {
    id: 'm-billing-exploration-drift',
    domain: 'context',
    setting: 'codegen',
    ts: '5.4',
    scenario:
      'You are using Claude Code to map a 4,000-file legacy billing monolith before a refactor. Three hours into one session, with the context full of grep output and file reads, Claude starts describing "a typical service-layer pattern" instead of the `LedgerAdapter` class it traced in the first hour, and gives two different answers about which module computes tax.',
    ask: 'Which TWO practices best counter this degradation for the rest of the exploration?',
    options: [
      'Have Claude keep a scratchpad file of key findings (classes, owners, call paths) and consult it when answering later questions.',
      'Run `/clear` and keep exploring from an empty context, so the earlier grep output no longer competes for the model\'s attention.',
      'Add a `CLAUDE.md` instruction telling Claude to stay consistent with its earlier findings and to always name specific classes.',
      'Read all remaining billing modules into the main session now, so Claude has the full picture before it answers anything else.',
      'Send focused questions such as "trace the tax calculation flow" to subagents and keep only their summaries in the main session.',
    ],
    answer: 0,
    answers: [0, 4],
    why: [
      'A scratchpad persists findings outside the degrading context, so later answers rest on the classes actually discovered rather than on generic patterns.',
      'Clearing discards everything learned so far without saving it, so the exploration starts over and will degrade again.',
      'An instruction cannot restore findings the model no longer tracks reliably, and it does nothing about the context load that causes the drift.',
      'Loading everything upfront fills the context faster and worsens the degradation; exploration should be incremental and targeted.',
      'Subagents absorb the verbose exploration output in their own context while the main session keeps the high-level coordination.',
    ],
    rule: 'In long explorations, persist findings in a scratchpad and push verbose digging into subagents so the main context stays clean.',
  },
  // --- Multi-Agent Research System ---
  {
    id: 'm-coordinator-routing-and-hub',
    domain: 'agentic',
    setting: 'research',
    ts: '1.2',
    scenario:
      'Your research coordinator sends every query through all four subagents (search, analysis, synthesis, report), even "When was the EU AI Act adopted?"; such simple facts are 40% of traffic and take 90 s each. To save time, the team also let the analysis subagent call synthesis directly. Since then 18% of reports silently omit failed analysis tasks, and the coordinator\'s logs show none of those errors.',
    ask: 'Which TWO changes should you make to the orchestration?',
    options: [
      'Let every subagent call any other subagent directly, so each failure is handled by the agent closest to where it happened.',
      'Have the coordinator assess what each query needs and invoke only those subagents, such as a single search for a simple fact.',
      'Merge the four subagents into one generalist agent that has every tool, removing the coordination overhead for all queries.',
      'Route all subagent results and errors back through the coordinator, removing the direct call from analysis to synthesis.',
      'Configure the synthesis subagent to inherit the coordinator\'s conversation history, so it can see which analysis tasks failed.',
    ],
    answer: 1,
    answers: [1, 3],
    why: [
      'Peer-to-peer calls scatter error handling across agents and remove the coordinator\'s view, which is exactly why failures now go unnoticed.',
      'The coordinator should choose subagents by query complexity rather than always running the full pipeline, so simple facts skip needless steps.',
      'One agent with every tool degrades tool selection and loses the specialization and isolated contexts that the subagents provide.',
      'Hub-and-spoke routing gives the coordinator observability, consistent error handling and control over what each subagent receives.',
      'Subagents do not inherit the coordinator\'s history automatically, and the coordinator never saw these errors anyway, so this cannot surface them.',
    ],
    rule: 'The coordinator is the hub: it picks the subagents each query needs, and all subagent traffic flows through it.',
  },
  {
    id: 'm-sourced-dated-findings',
    domain: 'context',
    setting: 'research',
    ts: '5.6',
    scenario:
      'Reviewing 40 reports from your research system, you find 31% of statistics have no source, although the search subagent\'s raw output had a URL for each; the analysis subagent passes findings on as prose. One report gives recycling capacity only as 2.4 Mt: analysis had sent 1.6 Mt (IEA) and 2.4 Mt (industry body) as conflicting figures, but a reviewer found they are 2023 and 2025 data.',
    ask: 'Which TWO changes address the root causes?',
    options: [
      'When sources disagree on a figure, have synthesis keep the most recent value and drop the older one, so each report states one number.',
      'Require subagents to output claim-source mappings (claim, source URL or document, excerpt) that synthesis must preserve and merge.',
      'Require each finding to carry its publication or data-collection date, so figures from different years read as change, not conflict.',
      'Have the report subagent search the web for a source for each unsourced statistic just before the final report is published.',
      'Have synthesis remove any statistic it cannot attribute, so that no unsourced number ever reaches a published report.',
    ],
    answer: 1,
    answers: [1, 2],
    why: [
      'Silently discarding a value hides genuine conflicts and the trend; conflicting figures should be kept and annotated with their sources.',
      'Attribution is lost when findings are compressed into prose; structured claim-source mappings carried through synthesis keep every number traceable.',
      'With dates attached, the 2023 and 2025 figures can be reported as growth instead of being mistaken for a contradiction or reduced to one value.',
      'Searching after the fact reconstructs sources instead of preserving them, and may cite a page that is not where the number came from.',
      'The sources existed upstream, so dropping the numbers discards valid findings and leaves the step that loses attribution unchanged.',
    ],
    rule: 'Provenance travels with each claim: subagents emit sourced, dated findings and synthesis preserves them instead of picking or dropping values.',
  },
  // --- Developer Productivity with Claude ---
  {
    id: 'm-mcp-shared-token-personal-server',
    domain: 'tools',
    setting: 'devprod',
    ts: '2.4',
    scenario:
      'Your team\'s repo commits a `.mcp.json` with a shared GitHub server whose token is written in plain text; the secret scanner flagged it in 3 commits and security has revoked it. An engineer also added his experimental `pg-scratch` server to that file, so all 11 teammates\' sessions now try to connect to a database that only exists on his laptop.',
    ask: 'Which TWO changes fix both problems while keeping the GitHub server shared through the repository?',
    options: [
      'Move the GitHub server into each developer\'s `~/.claude.json` so the token never reaches the repository and everyone keeps a private copy.',
      'Keep the GitHub server in `.mcp.json` but replace the literal token with `${GITHUB_TOKEN}`, set in each developer\'s own environment.',
      'Add `.mcp.json` to `.gitignore` and post a template on the wiki so tokens and personal servers both stay out of version control.',
      'Add a CLAUDE.md note telling Claude to ignore the `pg-scratch` tools whenever that server is unreachable on a teammate\'s machine.',
      'Move `pg-scratch` out of `.mcp.json` into the engineer\'s user-level `~/.claude.json`, where it loads only in his own sessions.',
    ],
    answer: 1,
    answers: [1, 4],
    why: [
      'User-level config is for personal or experimental servers; moving shared tooling there breaks the requirement and leaves every developer maintaining a copy that drifts.',
      'Environment variable expansion in `.mcp.json` keeps the shared server under version control while each developer supplies the credential, so no secret is committed.',
      'Ignoring `.mcp.json` removes the version-controlled team configuration that keeps the GitHub server shared and replaces it with a manual copy step.',
      'A prompt note does not change configuration: the server is still configured for everyone, and every session still tries to connect to it.',
      'Personal and experimental servers belong in the user-scoped `~/.claude.json`, so the engineer keeps his server without affecting teammates.',
    ],
    rule: 'Shared servers go in project `.mcp.json` with `${VAR}` expansion for secrets; personal or experimental servers go in user-level `~/.claude.json`.',
  },
  {
    id: 'm-legacy-map-skill-fork-tools',
    domain: 'claude-code',
    setting: 'devprod',
    ts: '3.2',
    scenario:
      'Your team\'s `legacy-map` skill in `.claude/skills/` greps and reads about 60 files of a legacy module, then writes a map to `docs/maps/`. After each run the main session holds 48k tokens of file contents and later answers lose track of the task. In one run the skill also used Bash to execute `git checkout .`, wiping a developer\'s uncommitted work.',
    ask: 'Which TWO changes to the skill fix both problems reliably for every developer who uses it?',
    options: [
      'Add `context: fork` to the frontmatter so the file reads run in an isolated sub-agent and only the skill\'s summary returns to the session.',
      'Move the skill to `~/.claude/skills/legacy-map/` so its verbose output and tool use stay limited to the developer who runs it.',
      'Add a line to the SKILL.md body telling Claude never to run git commands or any other destructive shell operation.',
      'Set `allowed-tools` in the frontmatter to Read, Grep, Glob and Write so Bash is unavailable while the skill runs.',
      'Move the mapping procedure into the root CLAUDE.md so Claude follows it in every session without needing an invocation.',
    ],
    answer: 0,
    answers: [0, 3],
    why: [
      '`context: fork` runs the skill in an isolated sub-agent context, so the 60 file reads stay out of the main conversation and only the result comes back.',
      'User scope decides who has the skill, not where its output goes: the reads still flood the session that runs it, and teammates lose the shared skill.',
      'A prompt instruction is probabilistic: Bash stays available, so another destructive command can still run in some session.',
      '`allowed-tools` restricts which tools the skill can use, so without Bash it cannot run `git checkout .` or similar commands at all.',
      'CLAUDE.md is always loaded, so this adds the procedure to every session\'s context, and the file reads and Bash still run in the main session.',
    ],
    rule: 'Use `context: fork` to keep a skill\'s verbose work out of the main session and `allowed-tools` to limit what the skill can do.',
  },
  // --- Claude Code for Continuous Integration ---
  {
    id: 'm-ci-fresh-review-json-findings',
    domain: 'claude-code',
    setting: 'ci',
    ts: '3.6',
    scenario:
      'Your CI job runs `claude -p` to implement a ticket, then `claude -p --continue` in the same session to review the change and post inline PR comments. A regex pulls `Line N:` out of the review text, but 31% of findings fail to post because the wording varies. The review approves 94% of the changes it wrote, yet humans later find real bugs in one PR in five.',
    ask: 'Which TWO changes to the pipeline address these problems?',
    options: [
      'Keep `--continue` and tell the review prompt to act as a skeptical senior engineer critiquing code that someone else on the team wrote.',
      'Run the review as a separate `claude -p` call in a fresh session that receives the diff but not the generation session\'s history.',
      'Add `--output-format json` with a `--json-schema` for file, line, severity and message, and post each finding from the parsed JSON.',
      'Keep the regex parser and add a CLAUDE.md rule asking Claude to start every finding with `Line N:` exactly as the parser expects.',
      'Turn on extended thinking for the review step in the same session so Claude reasons longer and harder about each change it made.',
    ],
    answer: 1,
    answers: [1, 2],
    why: [
      'A role instruction does not remove the generator\'s reasoning from context, so the reviewer still tends to agree with its own earlier decisions.',
      'An independent instance without the generation context reviews the change on its merits and is more likely to question decisions the generating session already accepted.',
      '`--output-format json` with `--json-schema` returns machine-parseable findings in a fixed shape, so posting inline comments no longer depends on wording.',
      'A format rule is still followed probabilistically and the parser still reads free text, so some findings will keep failing to post.',
      'More thinking in the same session still starts from the generator\'s reasoning; an independent review instance catches subtle issues better than extended thinking.',
    ],
    rule: 'In CI, review with a fresh `claude -p` session, not the one that wrote the code, and get findings through `--output-format json` with `--json-schema`.',
  },
  {
    id: 'm-billing-pr-file-and-integration-passes',
    domain: 'prompting',
    setting: 'ci',
    ts: '4.6',
    scenario:
      'Your CI review reads all 22 files of a billing PR in one pass. Comments are detailed for the first files and one-liners for the last ones. It flags a missing null check in `invoice.ts` but approves the same code in `credit.ts`, and it misses that `refund.ts` passes cents to `ledger.ts`, which expects dollars. The whole PR uses 40% of the context window.',
    ask: 'Which TWO changes to the review architecture fix these failures?',
    options: [
      'Sort the files by risk so the riskiest are read first and any drop in attention falls on the low-risk files at the end.',
      'Give every per-file pass the other 21 files in full as well, so each pass can also spot problems that cross file boundaries.',
      'Review each file in its own focused pass, with the same criteria for all, to report the local issues within that file.',
      'End the single pass by asking the reviewer to re-read its findings and delete any that contradict each other.',
      'Add a separate integration pass that traces data flow across the changed files, such as the values passed between modules.',
    ],
    answer: 2,
    answers: [2, 4],
    why: [
      'Reordering only moves the attention dilution onto other files: the last files still get a shallow review and contradictions remain possible.',
      'Loading all 22 files into each pass brings back the attention dilution that per-file passes are meant to remove.',
      'Focused per-file passes remove the attention dilution behind the uneven depth and the contradictory findings.',
      'A re-check inside the same pass keeps its own reasoning; deleting contradictions may drop the correct finding and fixes neither the shallow review nor the unit bug.',
      'An integration pass looks at how data moves between files, which is where the cents-versus-dollars mismatch lives, out of sight of any per-file pass.',
    ],
    rule: 'Split large reviews into per-file passes for local issues plus a separate integration pass for cross-file data flow.',
  },
  // --- Structured Data Extraction ---
  {
    id: 'm-unknown-doc-type-any-nullable-po',
    domain: 'prompting',
    setting: 'extraction',
    ts: '4.3',
    scenario:
      'Your extractor gets supplier PDFs of unknown type and defines three tools, `extract_invoice`, `extract_credit_note` and `extract_po`, with `tool_choice` set to `"auto"`. In 6% of calls Claude replies in prose ("This looks like a credit note...") and nothing is stored. On invoices with no purchase order, the required `po_number` field holds invented values like "PO-0000" in 15% of rows.',
    ask: 'Which TWO changes fix these problems?',
    options: [
      'Set `tool_choice` to `"any"` so Claude must call one of the three extraction tools while still choosing the one that fits the document.',
      'Set `tool_choice` to `{"type": "tool", "name": "extract_invoice"}` so that every single response is guaranteed to be a tool call.',
      'Make `po_number` nullable in the schema so Claude can return null when the document carries no purchase order reference.',
      'Keep `po_number` required and add a prompt rule saying never to invent a PO number that is not printed on the document.',
      'Retry each invoice whose `po_number` fails the PO format check, appending the validation error so Claude corrects the value.',
    ],
    answer: 0,
    answers: [0, 2],
    why: [
      '`"any"` guarantees a tool call, which removes the prose replies, and lets the model pick the schema for a document whose type is not known in advance.',
      'Forcing `extract_invoice` also guarantees a tool call, but it pushes credit notes and purchase orders into the invoice schema.',
      'A nullable field gives the model a valid way to say the value is absent, so it no longer has to fabricate one to satisfy the schema.',
      'The schema still demands a value, so the model is caught between the rule and the required field and keeps filling it with placeholders.',
      'Retries cannot fix a value that is missing from the source; the model will just invent a different one that passes the format check.',
    ],
    rule: 'Use `tool_choice: "any"` when several extraction schemas exist and the type is unknown; make fields nullable when the source may not contain them.',
  },
  {
    id: 'm-retry-sum-errors-not-absent-clauses',
    domain: 'prompting',
    setting: 'extraction',
    ts: '4.4',
    scenario:
      'Your extractor validates every `tool_use` result. 5% of invoices fail because line items do not sum to the stated total, mostly from skipped or misread lines; resending the prompt unchanged fixes 1 in 10. Another 3% of contracts fail on `governing_law`: the clause only says "as set out in the Master Agreement", a document the pipeline never gets, and all 3 retries fail.',
    ask: 'Which TWO changes should you make to the validation and retry loop?',
    options: [
      'Turn on strict schema validation for the extraction tool so that line items that do not add up to the stated total are rejected at generation time.',
      'When the line items do not add up, overwrite the stated total with their sum before saving, so the record always passes validation.',
      'Retry the `governing_law` failures with the validation error appended, stating that the field is required and must not be left null.',
      'On a sum mismatch, send a follow-up with the original document, the failed extraction and the exact error, e.g. items 1,180.00 vs total 1,280.00.',
      'Stop retrying `governing_law` when the clause only points to an agreement that was not supplied; flag the record as missing for review.',
    ],
    answer: 3,
    answers: [3, 4],
    why: [
      'Strict schemas through tool use remove syntax errors, not semantic ones: a schema cannot check that line items add up to the total.',
      'Overwriting the total hides the discrepancy and can save a wrong value when the extraction simply missed or misread a line item.',
      'Retries do not help when the information is absent from the source; error feedback just pushes the model to invent a governing law.',
      'Retry with error feedback gives the model the document, its failed output and the specific error, which is what it needs to correct itself.',
      'The value lives in a document the pipeline never sees, so retries cannot succeed; flagging the record avoids wasted calls and fabricated values.',
    ],
    rule: 'Retry with the document, the failed output and the specific error when the error is fixable; do not retry when the information is not in the source.',
  },
];

export const MULTI_ES: Record<string, QuestionText> = {
  // --- Customer Support Resolution Agent ---
  'm-refund-gate-and-handoff': {
    scenario:
      'El system prompt de tu agente de soporte indica que se verifique la identidad con `get_customer` antes de cualquier reembolso. Una auditoría de 6.800 reembolsos revela que el 3% se emitió sin un ID de cliente verificado. Además, los agentes humanos que reciben casos de `escalate_to_human` no pueden ver la transcripción del chat y les llegan notas como «Cliente molesto por un pedido, ayuda por favor», así que vuelven a preguntarle todo al cliente.',
    ask: '¿Qué DOS cambios resuelven estos problemas de forma más fiable?',
    options: [
      'Repetir la regla de verificación al principio y al final del system prompt y añadir ejemplos few-shot que llamen a `get_customer` antes de `process_refund`.',
      'Añadir en código una puerta de prerrequisito que bloquee `process_refund` hasta que `get_customer` haya devuelto un ID de cliente verificado en esta conversación.',
      'Ejecutar un proceso nocturno que marque los reembolsos emitidos sin ID de cliente verificado para que un supervisor los revise y los revierta al día siguiente.',
      'Escalar solo con el mensaje original del cliente, para que el agente humano se forme una opinión sin sesgos en lugar de reutilizar el análisis del agente.',
      'Hacer que `escalate_to_human` exija un resumen estructurado: ID de cliente, causa raíz, importe del reembolso y acción recomendada.',
    ],
    why: [
      'Las instrucciones y los ejemplos en el prompt siguen siendo una guía probabilística; con dinero en juego, una tasa de omisión distinta de cero no es aceptable.',
      'Un prerrequisito programático hace que el orden sea determinista: la llamada de reembolso no puede ejecutarse hasta que la verificación haya tenido éxito de verdad.',
      'Una auditoría a posteriori solo detecta el problema cuando el dinero ya ha salido; no impone el orden de los pasos.',
      'El humano no tiene la transcripción, así que quitarle los hallazgos del agente le obliga a empezar la investigación de cero, que es justo el problema actual.',
      'Los humanos sin acceso a la transcripción necesitan un traspaso estructurado con los datos del cliente, la causa raíz y la acción recomendada para actuar sin volver a preguntar.',
    ],
    rule: 'Impón en código el orden de los pasos críticos, no en el prompt, y traspasa a los humanos con un resumen estructurado con el que puedan actuar.',
  },
  'm-refund-error-categories': {
    scenario:
      'Tu herramienta MCP `process_refund` responde a cualquier fallo con `isError: true` y el texto «Operation failed». De los 1.140 fallos de la semana pasada, el 61% fueron timeouts de la pasarela de pago que funcionan en un intento posterior, el 27% fueron reembolsos fuera del plazo de 30 días de la política y el 12% tenían IDs de pedido mal formados. El agente reintenta cada fallo 3 veces y luego dice al cliente que «ha ocurrido un problema técnico», incluso en los casos fuera de plazo.',
    ask: '¿Qué DOS cambios permiten al agente recuperarse correctamente de estos fallos?',
    options: [
      'Añadir a cada resultado de error un `errorCategory` (transient, validation, business, permission), un indicador `isRetryable` y una descripción legible.',
      'Mantener el mensaje genérico pero subir el límite de reintentos del agente de 3 a 5 con backoff exponencial, para que pasen más timeouts de la pasarela.',
      'Para los reembolsos fuera del plazo de la política, devolver `isRetryable: false` con una explicación de la regla de 30 días comprensible para el cliente.',
      'Devolver los rechazos por plazo como un resultado correcto con un registro de reembolso vacío, para que el agente no los trate como fallos.',
      'Indicar al agente que llame a `escalate_to_human` siempre que falle `process_refund`, para que una persona decida qué hacer con cada fallo.',
    ],
    why: [
      'Los metadatos estructurados permiten al agente reintentar solo los timeouts transitorios, corregir los IDs mal formados y dejar de malgastar intentos en errores que nunca saldrán bien.',
      'Más reintentos siguen malgastando intentos en errores de política y de validación que nunca saldrán bien, y el agente sigue sin poder explicarlos.',
      'Una infracción de una regla de negocio no se puede reintentar; marcarla así y añadir una explicación clara permite al agente decirle al cliente el motivo en lugar de reintentar.',
      'Marcar un rechazo como éxito oculta el fallo: el agente puede decirle al cliente que el reembolso se ha hecho, y no puede explicar la regla.',
      'Escalar todos los fallos manda a los humanos timeouts que un reintento resolvería y casos de política claros que el agente podría explicar, y empeora la resolución en el primer contacto.',
    ],
    rule: 'Dale a los errores MCP una categoría, un indicador de reintento y un motivo legible para que el agente elija entre reintentar, corregir y explicar.',
  },
  // --- Code Generation with Claude Code ---
  'm-claude-md-shared-and-imports': {
    scenario:
      'El `CLAUDE.md` raíz de tu monorepo ha crecido hasta 1.400 líneas con los estándares de los 6 paquetes, y en las sesiones de `packages/payments` Claude aplica ahora las reglas de accesibilidad de la web a los handlers de la API. Además, dos nuevas incorporaciones cuentan que Claude ignora las reglas del equipo sobre mensajes de commit y nombres de tests; resulta que esas reglas solo están en el `~/.claude/CLAUDE.md` del tech lead.',
    ask: '¿Qué DOS cambios resuelven estos problemas?',
    options: [
      'Pedir a cada nueva incorporación que copie el `~/.claude/CLAUDE.md` del tech lead en su propio directorio personal como parte del onboarding.',
      'Poner las reglas de commits y nombres de tests en un slash command `/conventions` en `.claude/commands/` que las nuevas incorporaciones ejecuten al empezar cada sesión.',
      'Mover las reglas de commits y nombres de tests al `CLAUDE.md` de nivel de proyecto que está versionado en el repositorio.',
      'Sacar los estándares de los paquetes del archivo raíz y hacer que el `CLAUDE.md` de cada paquete haga `@import` solo de los archivos de estándares que le aplican.',
      'Mantener todos los estándares en el `CLAUDE.md` raíz, pero poner las reglas de cada paquete bajo su propio encabezado para que Claude elija la sección relevante.',
    ],
    why: [
      'Las copias de un archivo de nivel de usuario no están bajo control de versiones, así que divergen y se pierden las actualizaciones; las reglas compartidas deben llegar al equipo a través del repositorio.',
      'Un comando solo se aplica cuando alguien se acuerda de ejecutarlo; los estándares que deben aplicarse siempre van en `CLAUDE.md`, que se carga siempre.',
      'Las instrucciones de nivel de usuario solo se aplican a ese usuario; el `CLAUDE.md` de proyecto bajo control de versiones llega automáticamente a todo el equipo.',
      '`@import` mantiene la configuración modular, de modo que cada paquete carga solo los estándares que eligieron sus mantenedores y payments deja de ver las reglas de la web.',
      'Cada sesión seguiría cargando las reglas de todos los paquetes y dependería de que Claude deduzca qué sección aplica, que es justo el fallo actual.',
    ],
    rule: 'Los estándares compartidos van en el `CLAUDE.md` de proyecto; mantenlo modular con `@import` para que cada paquete cargue solo lo que le aplica.',
  },
  'm-billing-exploration-drift': {
    scenario:
      'Estás usando Claude Code para mapear un monolito heredado de facturación de 4.000 archivos antes de una refactorización. Tras tres horas en una misma sesión, con el contexto lleno de salidas de grep y lecturas de archivos, Claude empieza a describir «un patrón típico de capa de servicio» en lugar de la clase `LedgerAdapter` que trazó en la primera hora, y da dos respuestas distintas sobre qué módulo calcula los impuestos.',
    ask: '¿Qué DOS prácticas contrarrestan mejor esta degradación durante el resto de la exploración?',
    options: [
      'Hacer que Claude mantenga un archivo scratchpad con los hallazgos clave (clases, responsables, rutas de llamada) y lo consulte al responder preguntas posteriores.',
      'Ejecutar `/clear` y seguir explorando desde un contexto vacío, para que la salida de grep anterior deje de competir por la atención del modelo.',
      'Añadir a `CLAUDE.md` una instrucción que pida a Claude ser coherente con sus hallazgos anteriores y nombrar siempre clases concretas.',
      'Leer ya en la sesión principal todos los módulos de facturación restantes, para que Claude tenga la imagen completa antes de responder nada más.',
      'Enviar preguntas concretas como «traza el flujo del cálculo de impuestos» a subagentes y quedarse solo con sus resúmenes en la sesión principal.',
    ],
    why: [
      'Un scratchpad conserva los hallazgos fuera del contexto que se degrada, así que las respuestas posteriores se basan en las clases descubiertas de verdad y no en patrones genéricos.',
      'Limpiar descarta todo lo aprendido sin guardarlo, así que la exploración vuelve a empezar y se degradará otra vez.',
      'Una instrucción no recupera hallazgos que el modelo ya no sigue de forma fiable, y no hace nada contra la carga de contexto que causa la deriva.',
      'Cargarlo todo de golpe llena el contexto más deprisa y empeora la degradación; la exploración debe ser incremental y dirigida.',
      'Los subagentes absorben la salida verbosa de la exploración en su propio contexto mientras la sesión principal mantiene la coordinación de alto nivel.',
    ],
    rule: 'En exploraciones largas, guarda los hallazgos en un scratchpad y lleva la búsqueda verbosa a subagentes para que el contexto principal siga limpio.',
  },
  // --- Multi-Agent Research System ---
  'm-coordinator-routing-and-hub': {
    scenario:
      'Tu coordinador de investigación envía cada consulta por los cuatro subagentes (búsqueda, análisis, síntesis, informe), incluso «¿Cuándo se aprobó la Ley de IA de la UE?»; estos datos simples son el 40% del tráfico y tardan 90 s cada uno. Para ganar tiempo, el equipo también dejó que el subagente de análisis llame directamente al de síntesis. Desde entonces, el 18% de los informes omite sin avisar tareas de análisis fallidas y los logs del coordinador no muestran ninguno de esos errores.',
    ask: '¿Qué DOS cambios deberías hacer en la orquestación?',
    options: [
      'Dejar que cualquier subagente llame directamente a cualquier otro, para que cada fallo lo gestione el agente más cercano al lugar donde ocurrió.',
      'Hacer que el coordinador evalúe qué necesita cada consulta e invoque solo esos subagentes, por ejemplo una única búsqueda para un dato simple.',
      'Fusionar los cuatro subagentes en un único agente generalista con todas las herramientas, eliminando la sobrecarga de coordinación en todas las consultas.',
      'Encaminar todos los resultados y errores de los subagentes de vuelta a través del coordinador, eliminando la llamada directa de análisis a síntesis.',
      'Configurar el subagente de síntesis para que herede el historial de conversación del coordinador, de modo que vea qué tareas de análisis fallaron.',
    ],
    why: [
      'Las llamadas entre pares dispersan la gestión de errores entre agentes y quitan la visibilidad al coordinador, que es justo por lo que los fallos pasan desapercibidos.',
      'El coordinador debe elegir subagentes según la complejidad de la consulta en lugar de ejecutar siempre el pipeline completo, así los datos simples se saltan pasos innecesarios.',
      'Un agente con todas las herramientas empeora la selección de herramientas y pierde la especialización y los contextos aislados que aportan los subagentes.',
      'El enrutamiento hub-and-spoke da al coordinador observabilidad, una gestión de errores coherente y control sobre lo que recibe cada subagente.',
      'Los subagentes no heredan automáticamente el historial del coordinador, y además el coordinador nunca vio esos errores, así que esto no puede sacarlos a la luz.',
    ],
    rule: 'El coordinador es el hub: elige los subagentes que necesita cada consulta y todo el tráfico de los subagentes pasa por él.',
  },
  'm-sourced-dated-findings': {
    scenario:
      'Al revisar 40 informes de tu sistema de investigación, ves que el 31% de las estadísticas no tienen fuente, aunque la salida bruta del subagente de búsqueda tenía una URL para cada una; el subagente de análisis pasa los hallazgos en prosa. Un informe da la capacidad de reciclaje solo como 2,4 Mt: el análisis había enviado 1,6 Mt (IEA) y 2,4 Mt (asociación del sector) como cifras en conflicto, pero un revisor comprobó que son datos de 2023 y de 2025.',
    ask: '¿Qué DOS cambios atacan las causas de fondo?',
    options: [
      'Cuando las fuentes discrepen en una cifra, hacer que la síntesis se quede con el valor más reciente y descarte el anterior, para que cada informe dé un solo número.',
      'Exigir a los subagentes que devuelvan mapeos afirmación-fuente (afirmación, URL o documento de origen, extracto) que la síntesis deba conservar y combinar.',
      'Exigir que cada hallazgo lleve su fecha de publicación o de recogida de datos, para que cifras de años distintos se lean como un cambio y no como un conflicto.',
      'Hacer que el subagente de informes busque en la web una fuente para cada estadística sin fuente justo antes de publicar el informe final.',
      'Hacer que la síntesis elimine cualquier estadística que no pueda atribuir, para que ningún número sin fuente llegue a un informe publicado.',
    ],
    why: [
      'Descartar un valor sin avisar oculta los conflictos reales y la tendencia; las cifras en conflicto deben conservarse y anotarse con sus fuentes.',
      'La atribución se pierde cuando los hallazgos se comprimen en prosa; los mapeos estructurados afirmación-fuente que atraviesan la síntesis mantienen cada número trazable.',
      'Con las fechas adjuntas, las cifras de 2023 y 2025 pueden presentarse como crecimiento en lugar de confundirse con una contradicción o reducirse a un solo valor.',
      'Buscar a posteriori reconstruye las fuentes en lugar de conservarlas, y puede citar una página que no es de donde salió el número.',
      'Las fuentes existían más arriba en el pipeline, así que eliminar los números descarta hallazgos válidos y deja sin cambiar el paso que pierde la atribución.',
    ],
    rule: 'La procedencia viaja con cada afirmación: los subagentes emiten hallazgos con fuente y fecha, y la síntesis los conserva en lugar de elegir o descartar valores.',
  },
  // --- Developer Productivity with Claude ---
  'm-mcp-shared-token-personal-server': {
    scenario:
      'El repo de tu equipo versiona un `.mcp.json` con un servidor de GitHub compartido cuyo token está escrito en texto plano; el escáner de secretos lo detectó en 3 commits y seguridad ya lo ha revocado. Además, un ingeniero añadió a ese archivo su servidor experimental `pg-scratch`, así que las sesiones de los 11 compañeros intentan conectarse a una base de datos que solo existe en su portátil.',
    ask: '¿Qué DOS cambios resuelven ambos problemas manteniendo el servidor de GitHub compartido a través del repositorio?',
    options: [
      'Mover el servidor de GitHub al `~/.claude.json` de cada desarrollador para que el token nunca llegue al repositorio y cada uno tenga su copia privada.',
      'Mantener el servidor de GitHub en `.mcp.json` pero sustituir el token literal por `${GITHUB_TOKEN}`, definido en el entorno de cada desarrollador.',
      'Añadir `.mcp.json` a `.gitignore` y publicar una plantilla en la wiki para que tokens y servidores personales queden fuera del control de versiones.',
      'Añadir una nota en CLAUDE.md que pida a Claude ignorar las herramientas de `pg-scratch` cuando ese servidor no responda en la máquina de un compañero.',
      'Sacar `pg-scratch` de `.mcp.json` y llevarlo al `~/.claude.json` de usuario del ingeniero, donde solo se carga en sus propias sesiones.',
    ],
    why: [
      'La configuración de usuario es para servidores personales o experimentales; llevar ahí las herramientas compartidas incumple el requisito y obliga a cada desarrollador a mantener una copia que acaba divergiendo.',
      'La expansión de variables de entorno en `.mcp.json` mantiene el servidor compartido bajo control de versiones mientras cada desarrollador aporta la credencial, así que no se versiona ningún secreto.',
      'Ignorar `.mcp.json` elimina la configuración de equipo versionada que mantiene compartido el servidor de GitHub y la sustituye por un paso manual de copia.',
      'Una nota en el prompt no cambia la configuración: el servidor sigue configurado para todos y cada sesión sigue intentando conectarse a él.',
      'Los servidores personales y experimentales van en el `~/.claude.json` de usuario, así el ingeniero conserva su servidor sin afectar a sus compañeros.',
    ],
    rule: 'Los servidores compartidos van en el `.mcp.json` del proyecto con expansión `${VAR}` para los secretos; los personales o experimentales, en el `~/.claude.json` de usuario.',
  },
  'm-legacy-map-skill-fork-tools': {
    scenario:
      'La skill `legacy-map` de tu equipo, en `.claude/skills/`, hace grep y lee unos 60 archivos de un módulo legacy y después escribe un mapa en `docs/maps/`. Tras cada ejecución, la sesión principal contiene 48k tokens de contenido de archivos y las respuestas siguientes pierden el hilo de la tarea. En una ejecución la skill usó además Bash para lanzar `git checkout .` y borró el trabajo sin confirmar de un desarrollador.',
    ask: '¿Qué DOS cambios en la skill resuelven ambos problemas de forma fiable para todos los desarrolladores que la usan?',
    options: [
      'Añadir `context: fork` al frontmatter para que las lecturas de archivos se ejecuten en un subagente aislado y a la sesión solo vuelva el resumen de la skill.',
      'Mover la skill a `~/.claude/skills/legacy-map/` para que su salida extensa y su uso de herramientas queden limitados al desarrollador que la ejecuta.',
      'Añadir una línea al cuerpo de SKILL.md que indique a Claude que nunca ejecute comandos git ni ninguna otra operación destructiva de shell.',
      'Fijar `allowed-tools` en el frontmatter a Read, Grep, Glob y Write para que Bash no esté disponible mientras se ejecuta la skill.',
      'Mover el procedimiento de mapeo al CLAUDE.md raíz para que Claude lo siga en todas las sesiones sin necesidad de invocarlo.',
    ],
    why: [
      '`context: fork` ejecuta la skill en un contexto de subagente aislado, así que las 60 lecturas quedan fuera de la conversación principal y solo vuelve el resultado.',
      'El ámbito de usuario decide quién tiene la skill, no adónde va su salida: las lecturas siguen inundando la sesión que la ejecuta y los compañeros pierden la skill compartida.',
      'Una instrucción en el prompt es probabilística: Bash sigue disponible, así que otro comando destructivo puede volver a ejecutarse en alguna sesión.',
      '`allowed-tools` restringe las herramientas que puede usar la skill, así que sin Bash no puede ejecutar `git checkout .` ni comandos parecidos.',
      'CLAUDE.md se carga siempre, así que añade el procedimiento al contexto de todas las sesiones, y las lecturas y Bash siguen ejecutándose en la sesión principal.',
    ],
    rule: 'Usa `context: fork` para mantener el trabajo extenso de una skill fuera de la sesión principal y `allowed-tools` para limitar lo que la skill puede hacer.',
  },
  // --- Claude Code for Continuous Integration ---
  'm-ci-fresh-review-json-findings': {
    scenario:
      'Tu job de CI ejecuta `claude -p` para implementar un ticket y después `claude -p --continue` en la misma sesión para revisar el cambio y publicar comentarios inline en el PR. Una regex extrae `Line N:` del texto de la revisión, pero el 31% de los hallazgos no se publica porque la redacción varía. La revisión aprueba el 94% de los cambios que ella misma escribió y, aun así, los revisores humanos encuentran después bugs reales en uno de cada cinco PR.',
    ask: '¿Qué DOS cambios en el pipeline resuelven estos problemas?',
    options: [
      'Mantener `--continue` y pedir en el prompt de revisión que actúe como un ingeniero sénior escéptico que critica código escrito por otra persona del equipo.',
      'Ejecutar la revisión como una llamada `claude -p` aparte, en una sesión nueva que recibe el diff pero no el historial de la sesión de generación.',
      'Añadir `--output-format json` con un `--json-schema` de archivo, línea, severidad y mensaje, y publicar cada hallazgo a partir del JSON parseado.',
      'Mantener el parser con regex y añadir una regla en CLAUDE.md que pida a Claude empezar cada hallazgo con `Line N:` tal como espera el parser.',
      'Activar el extended thinking en el paso de revisión dentro de la misma sesión para que Claude razone más y mejor sobre cada cambio que hizo.',
    ],
    why: [
      'Una instrucción de rol no saca del contexto el razonamiento del generador, así que el revisor sigue tendiendo a dar por buenas sus propias decisiones.',
      'Una instancia independiente, sin el contexto de generación, revisa el cambio por sus méritos y es más probable que cuestione decisiones que la sesión generadora ya había aceptado.',
      '`--output-format json` con `--json-schema` devuelve hallazgos parseables por máquina con una forma fija, así que publicar comentarios inline deja de depender de la redacción.',
      'Una regla de formato se sigue de forma probabilística y el parser sigue leyendo texto libre, así que algunos hallazgos seguirán sin publicarse.',
      'Pensar más en la misma sesión sigue partiendo del razonamiento del generador; una instancia de revisión independiente detecta problemas sutiles mejor que el extended thinking.',
    ],
    rule: 'En CI, revisa con una sesión `claude -p` nueva, no con la que escribió el código, y obtén los hallazgos con `--output-format json` y `--json-schema`.',
  },
  'm-billing-pr-file-and-integration-passes': {
    scenario:
      'Tu revisión de CI lee los 22 archivos de un PR de facturación en una sola pasada. Los comentarios son detallados en los primeros archivos y de una línea en los últimos. Señala que falta una comprobación de null en `invoice.ts` pero aprueba el mismo código en `credit.ts`, y no detecta que `refund.ts` pasa céntimos a `ledger.ts`, que espera dólares. Todo el PR ocupa el 40% de la ventana de contexto.',
    ask: '¿Qué DOS cambios en la arquitectura de revisión corrigen estos fallos?',
    options: [
      'Ordenar los archivos por riesgo para que los más arriesgados se lean primero y cualquier caída de atención recaiga en los de poco riesgo del final.',
      'Dar también a cada pasada por archivo los otros 21 archivos completos, para que cada pasada pueda detectar problemas que cruzan de un archivo a otro.',
      'Revisar cada archivo en su propia pasada enfocada, con los mismos criterios para todos, para informar de los problemas locales de ese archivo.',
      'Terminar la pasada única pidiendo al revisor que relea sus hallazgos y borre los que se contradigan entre sí.',
      'Añadir una pasada de integración aparte que siga el flujo de datos entre los archivos cambiados, como los valores que se pasan entre módulos.',
    ],
    why: [
      'Reordenar solo traslada la dilución de atención a otros archivos: los últimos siguen recibiendo una revisión superficial y las contradicciones siguen siendo posibles.',
      'Cargar los 22 archivos en cada pasada devuelve la dilución de atención que las pasadas por archivo deben eliminar.',
      'Las pasadas enfocadas por archivo eliminan la dilución de atención que causa la profundidad desigual y los hallazgos contradictorios.',
      'Una comprobación dentro de la misma pasada conserva su propio razonamiento; borrar contradicciones puede eliminar el hallazgo correcto y no corrige ni la revisión superficial ni el bug de unidades.',
      'Una pasada de integración mira cómo se mueven los datos entre archivos, que es donde está el desajuste entre céntimos y dólares, fuera del alcance de cualquier pasada por archivo.',
    ],
    rule: 'Divide las revisiones grandes en pasadas por archivo para los problemas locales y una pasada de integración aparte para el flujo de datos entre archivos.',
  },
  // --- Structured Data Extraction ---
  'm-unknown-doc-type-any-nullable-po': {
    scenario:
      'Tu extractor recibe PDF de proveedores de tipo desconocido y define tres herramientas, `extract_invoice`, `extract_credit_note` y `extract_po`, con `tool_choice` en `"auto"`. En el 6% de las llamadas Claude responde en prosa («Parece una nota de abono...») y no se guarda nada. En las facturas sin pedido de compra, el campo obligatorio `po_number` contiene valores inventados como «PO-0000» en el 15% de las filas.',
    ask: '¿Qué DOS cambios resuelven estos problemas?',
    options: [
      'Fijar `tool_choice` en `"any"` para que Claude tenga que llamar a una de las tres herramientas de extracción, pero siga eligiendo la que encaja con el documento.',
      'Fijar `tool_choice` en `{"type": "tool", "name": "extract_invoice"}` para que todas las respuestas sean, sin excepción, una llamada a herramienta.',
      'Hacer `po_number` nullable en el esquema para que Claude pueda devolver null cuando el documento no lleva referencia de pedido de compra.',
      'Mantener `po_number` como obligatorio y añadir una regla al prompt que prohíba inventar un número de pedido que no aparezca impreso en el documento.',
      'Reintentar cada factura cuyo `po_number` no pase la comprobación de formato, añadiendo el error de validación para que Claude corrija el valor.',
    ],
    why: [
      '`"any"` garantiza una llamada a herramienta, lo que elimina las respuestas en prosa, y deja que el modelo elija el esquema de un documento cuyo tipo no se conoce de antemano.',
      'Forzar `extract_invoice` también garantiza una llamada a herramienta, pero mete las notas de abono y los pedidos de compra en el esquema de factura.',
      'Un campo nullable da al modelo una forma válida de indicar que el valor no existe, así que ya no tiene que inventarlo para cumplir el esquema.',
      'El esquema sigue exigiendo un valor, así que el modelo queda atrapado entre la regla y el campo obligatorio y sigue rellenándolo con marcadores.',
      'Los reintentos no pueden arreglar un valor que no está en el origen; el modelo solo inventará otro distinto que pase la comprobación de formato.',
    ],
    rule: 'Usa `tool_choice: "any"` cuando hay varios esquemas de extracción y el tipo es desconocido; haz nullable los campos que el origen puede no contener.',
  },
  'm-retry-sum-errors-not-absent-clauses': {
    scenario:
      'Tu extractor valida cada resultado de `tool_use`. El 5% de las facturas falla porque las líneas no suman el total indicado, sobre todo por líneas omitidas o mal leídas; reenviar el prompt sin cambios solo arregla 1 de cada 10. Otro 3% de los contratos falla en `governing_law`: la cláusula solo dice «según lo establecido en el Contrato Marco», un documento que el pipeline nunca recibe, y los 3 reintentos fallan.',
    ask: '¿Qué DOS cambios deberías hacer en el bucle de validación y reintento?',
    options: [
      'Activar la validación estricta del esquema en la herramienta de extracción para que las líneas que no suman el total indicado se rechacen al generarse.',
      'Cuando las líneas no suman, sobrescribir el total indicado con su suma antes de guardar, para que el registro pase siempre la validación.',
      'Reintentar los fallos de `governing_law` añadiendo el error de validación, que indica que el campo es obligatorio y no puede quedar en null.',
      'Ante un descuadre, enviar un seguimiento con el documento original, la extracción fallida y el error exacto, p. ej. líneas 1.180,00 frente a total 1.280,00.',
      'Dejar de reintentar `governing_law` cuando la cláusula solo remite a un contrato que no se ha aportado; marcar el registro como incompleto para revisión.',
    ],
    why: [
      'Los esquemas estrictos con tool use eliminan errores de sintaxis, no semánticos: un esquema no puede comprobar que las líneas sumen el total.',
      'Sobrescribir el total oculta la discrepancia y puede guardar un valor erróneo cuando la extracción simplemente omitió o leyó mal una línea.',
      'Los reintentos no sirven cuando la información no está en el origen; el error solo empuja al modelo a inventarse una ley aplicable.',
      'Reintentar con el error da al modelo el documento, su salida fallida y el error concreto, que es lo que necesita para corregirse.',
      'El valor está en un documento que el pipeline nunca ve, así que los reintentos no pueden funcionar; marcar el registro evita llamadas inútiles y valores inventados.',
    ],
    rule: 'Reintenta con el documento, la salida fallida y el error concreto cuando el error es corregible; no reintentes cuando la información no está en el origen.',
  },
};
