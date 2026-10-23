// Preguntas nivel examen de respuesta múltiple ("select 2"): largas como las de questions-exam.ts,
// con 5 opciones y 2 buenas. Una por escenario, dentro del simulacro nivel examen (ver bank.ts).
// La traducción va en el mismo fichero, por id, con las opciones en el mismo orden.
import type { Question, QuestionText } from './game.ts';

export const EXAM_LEVEL_MULTI: Question[] = [
  // --- Customer Support Resolution Agent ---
  {
    id: 'ml-support-normalize-and-block-hooks',
    domain: 'agentic',
    setting: 'support',
    ts: '1.5',
    scenario:
      'Your support agent runs on the Agent SDK with the MCP tools `get_customer`, `lookup_order`, `process_refund` and `escalate_to_human`. Orders placed before last year\'s platform migration are served by a legacy backend, so their `lookup_order` results carry Unix timestamps and numeric status codes (`3` = delivered), while newer orders return ISO 8601 dates and named statuses. A system prompt note explaining both formats cut wrong 30-day return-window decisions from 9% to 6%, and no further. Separately, an audit found 11 refunds above $500 among the last 2,300, although the prompt tells the agent to escalate those; compliance now requires that none ever executes without human approval. 84% of refund requests are under $500, first-contact resolution is 78% against an 80% target, and the human queue\'s SLA is 2 hours.',
    ask: 'Which TWO changes should the team make to fix both problems?',
    options: [
      'Extend the system prompt note with a table of every numeric status code and two few-shot examples that turn a Unix timestamp into a calendar date before the 30-day check, so the agent normalizes legacy results itself.',
      'Add a `PostToolUse` hook on `lookup_order` that converts Unix timestamps to ISO 8601 and maps numeric status codes to named statuses, so the agent always reasons over one format whichever backend answered.',
      'Add a `PostToolUse` hook on `process_refund` that checks the refunded amount and, when it exceeds $500, opens a supervisor ticket to review and reverse the refund, leaving the customer\'s flow unchanged.',
      'Add a hook that intercepts outgoing `process_refund` calls, blocks any whose amount exceeds $500 before it reaches the backend, and redirects the case to `escalate_to_human` with the customer ID, order and amount.',
      'Remove `process_refund` from the agent\'s tools and route every refund request through `escalate_to_human`, so no refund of any amount can ever execute without a person approving it first.',
    ],
    answer: 1,
    answers: [1, 3],
    why: [
      'The prompt note already plateaued at 6%: more prompt text is still probabilistic. A hook converts the data deterministically before the model ever sees it.',
      'A `PostToolUse` hook transforms tool results before the model processes them, so heterogeneous timestamps and status codes reach the agent in one consistent format every time.',
      '`PostToolUse` runs after the tool has executed, so the refund has already gone out; that breaks the requirement that none executes without approval.',
      'Intercepting the outgoing call is a deterministic guarantee: refunds above $500 never reach the backend and are redirected to the human workflow, while smaller refunds proceed normally.',
      'It guarantees compliance but sends the 84% of refunds under $500 to a 2-hour queue, pushing first-contact resolution further below its 80% target.',
    ],
    rule: 'Use hooks for guarantees: `PostToolUse` to normalize tool results, interception of outgoing calls to block policy violations before they execute.',
  },
  // --- Code Generation with Claude Code ---
  {
    id: 'ml-codegen-plan-migration-explore',
    domain: 'claude-code',
    setting: 'codegen',
    ts: '3.4',
    scenario:
      'Your team uses Claude Code on a 400,000-line payments monorepo. The deprecated `legacy-http` client must be replaced by the platform team\'s new client before its security support ends in March. A first Grep finds 61 files importing it; some call sites pass custom retry and timeout settings, and the tech lead sees two valid paths: an adapter that keeps the old interface, or direct replacement, which changes retry semantics in the billing services. In a similar attempt last quarter, discovery filled the main session with hundreds of Grep matches and file reads, `/compact` ran twice, and the compacted summary lost which call sites had custom retries, so three services shipped with default ones. The repo\'s CLAUDE.md was recently split into `.claude/rules/` files, and CI takes 18 minutes per run.',
    ask: 'Which TWO choices should the developer make for this migration?',
    options: [
      'Start in plan mode: have Claude explore how the old client is used and propose a design that chooses between the adapter and direct replacement, review it, then switch to direct execution to implement the approved plan.',
      'Start in direct execution on the three billing files the tech lead knows best, let the first changes reveal which approach fits, and switch to plan mode only if unexpected complexity shows up along the way.',
      'Hand call-site discovery to the Explore subagent, so its Grep matches and file reads stay in its own context and only a summary of usage patterns, custom retry settings included, returns to the main conversation.',
      'Keep discovery in the main session but run `/compact` after every 15 files read, so the context never fills up before implementation starts and the session can carry the whole migration from start to finish.',
      'Write one detailed prompt that specifies the exact replacement for each call pattern and run the whole migration in direct execution, so Claude makes no design decisions of its own and finishes all 61 files in a single pass.',
    ],
    answer: 0,
    answers: [0, 2],
    why: [
      'Plan mode suits a 61-file migration with two valid approaches and a retry-semantics decision; once the design is approved, direct execution implements it.',
      'The complexity is known up front (61 files, two approaches), so waiting for it to emerge risks the costly rework plan mode is meant to prevent.',
      'The Explore subagent keeps verbose discovery output in its own context and returns a summary, so the main session neither fills up nor loses details as it did last quarter.',
      'Last quarter `/compact` lost the call sites with custom retry settings; compacting more often in the same context repeats that loss instead of isolating discovery.',
      'Exact per-pattern instructions presuppose a decision nobody has made yet; with two valid approaches the codebase must be explored and the design chosen first.',
    ],
    rule: 'Plan mode for multi-file, multi-approach work, then direct execution; push verbose discovery into the Explore subagent so the main context keeps only a summary.',
  },
  // --- Multi-Agent Research System ---
  {
    id: 'ml-research-context-and-parallel-task',
    domain: 'agentic',
    setting: 'research',
    ts: '1.3',
    scenario:
      'Your research system\'s coordinator delegates through the Task tool to four subagents defined with `AgentDefinition`: web search, document analysis, synthesis and report generation. For a query on EU battery-recycling rules, the trace shows four web-search Task calls on four consecutive coordinator turns, one per subtopic, about 80 s each, then one document-analysis call over 12 PDFs. Synthesis is then invoked with the prompt "Combine the findings gathered so far into a cited summary"; it returns two paragraphs that cite "the sources discussed above" and one URL that appears nowhere in the search results. 9 of the last 20 reports contain unattributed claims. The report subagent\'s Markdown template changed last week and passes its checks. End-to-end runtime is 7 minutes; the product team wants it under 4.',
    ask: 'Which TWO changes address the unattributed claims and the runtime?',
    options: [
      'Pass the complete web-search and document-analysis outputs in the synthesis subagent\'s Task prompt, as structured records that keep each claim apart from its metadata (source URL, document name, page number), so attribution survives.',
      'Add `Task` to the coordinator\'s `allowedTools` and list the synthesis subagent\'s upstream dependencies in its `AgentDefinition` description, so results from earlier subagents are forwarded to it automatically.',
      'Give the synthesis subagent the web search tool too, so that whenever it needs the source behind a claim it can look the claim up itself instead of depending on what the coordinator sends it.',
      'Have the coordinator emit all four web-search Task calls in one response so the subtopics are researched in parallel, rather than one call per turn, and move on to document analysis once they return.',
      'Merge the web search, document analysis and synthesis subagents into a single research subagent holding all their tools, so findings never leave one context and no handoff between agents can drop them.',
    ],
    answer: 0,
    answers: [0, 3],
    why: [
      'Subagents do not inherit the coordinator\'s context, so "the findings gathered so far" gave synthesis nothing to work with. Passing complete findings as structured claim-plus-metadata records gives it the material and preserves attribution.',
      'The trace already shows Task calls succeeding, so `Task` is in `allowedTools`; and no setting forwards earlier results automatically: context has to be passed explicitly in the prompt.',
      'The findings already exist; giving synthesis a search tool duplicates the web-search agent\'s work, invites cross-specialization misuse and adds latency against the 4-minute target.',
      'Multiple Task calls in a single coordinator response run the subagents in parallel, so the four ~80 s searches take about as long as one instead of more than five minutes.',
      'One agent with every tool degrades tool selection, loads 12 PDFs and four searches into one context and serializes the work, which moves runtime away from the 4-minute target.',
    ],
    rule: 'A subagent gets only what its Task prompt contains: pass findings explicitly with their metadata, and emit parallel Task calls in one response.',
  },
  // --- Developer Productivity with Claude ---
  {
    id: 'ml-devprod-scoped-tools-forced-first',
    domain: 'tools',
    setting: 'devprod',
    ts: '2.3',
    scenario:
      'Your team\'s developer-productivity agent, built on the Agent SDK, started with the built-in tools and has since gained MCP servers for Jira, GitHub, internal docs and service scaffolding: 19 tools in a single agent. Logs from 1,200 sessions show it calling `search_docs` where `Grep` was needed and opening Jira issues during read-only exploration of legacy services. Last sprint every tool description was rewritten with input formats, examples and boundaries, and misrouting fell only from 21% to 17%. Separately, the scaffolding flow must begin with `load_service_template`, which pins the team\'s lint and logging setup; in 14% of runs the agent calls `Write` straight away and produces boilerplate from memory. Engineers ask to file a ticket or open a PR in about 3% of exploration sessions. The team moved its CI runners to ARM last month.',
    ask: 'Which TWO changes will most improve the agent\'s tool use?',
    options: [
      'Start each tool description with an "ONLY use this tool when…" line and add a list to the system prompt mapping request keywords to tools, so the agent can keep all 19 tools and still choose reliably among them.',
      'Set `tool_choice: "any"` on the first turn of the scaffolding flow, so the agent is required to call a tool before writing anything instead of answering with boilerplate from memory.',
      'Split the agent into role-scoped subagents behind a coordinator, such as exploration (`Read`, `Grep`, `Glob`, docs search) and scaffolding (template loader, `Write`), each holding only the tools its role needs.',
      'Give each role-scoped subagent the full Jira and GitHub toolsets on top of its own tools, since any exploration session might end with a request to file an issue or open a pull request.',
      'Force `tool_choice` to `{"type": "tool", "name": "load_service_template"}` on the first turn of the scaffolding flow, then let the following turns run on `"auto"` with the template in context.',
    ],
    answer: 2,
    answers: [2, 4],
    why: [
      'Descriptions were already rewritten with formats, examples and boundaries, and misrouting barely moved; with 19 tools the problem is decision complexity, and keyword lists in the system prompt add misrouting of their own.',
      '`"any"` only guarantees that some tool is called; the failing runs already call a tool, `Write`, so they would still skip the template.',
      'Too many tools degrade selection. Scoped subagents with only their role\'s tools cut each choice to a handful and stop exploration from reaching ticketing tools at all.',
      'Tickets and PRs come up in only 3% of exploration sessions; adding full toolsets back re-inflates each agent\'s choice and restores the cross-role misuse seen in the logs. Route those rare requests through the coordinator.',
      'Forced selection guarantees that `load_service_template` runs first; later steps then proceed in follow-up turns with the template already in context.',
    ],
    rule: 'Give each agent only its role\'s tools, and force `tool_choice` when one specific tool must run first; `"any"` only guarantees some tool.',
  },
  // --- Claude Code for Continuous Integration ---
  {
    id: 'ml-ci-explicit-criteria-mute-noisy',
    domain: 'prompting',
    setting: 'ci',
    ts: '4.1',
    scenario:
      'Your CI pipeline runs Claude Code with `-p` on every pull request and posts its findings as inline comments. Over the last 600 PRs developers dismissed 58% of comments, and in a survey several admitted they now skim past all of them, security findings included. Dismissal by category: comment accuracy ("this docstring may be outdated") 83%, naming and style 71%, bugs 14%, security 8%. Two of the last three real SQL-injection findings were merged unaddressed. The prompt reads "Review carefully. Be conservative and only report high-confidence findings." The second sentence was added a month ago and moved dismissal from 61% to 58%. Reviews average 2.4 minutes, the repo mixes TypeScript and Go, and the team plans to move the job to larger runners next quarter.',
    ask: 'Which TWO changes will best restore precision and developer trust?',
    options: [
      'Ask Claude to attach a 1–10 confidence score to every finding and have the pipeline post only findings scored 8 or higher, so uncertain comments are filtered out before developers ever see them.',
      'Replace the "be conservative" instruction with explicit criteria: report bugs that change runtime behavior and security issues, and skip style, naming and patterns that match the surrounding code.',
      'Strengthen the existing instruction with emphasis, such as "Be extremely conservative. False positives are very costly. Only report what you are certain of", so the model raises its own bar in every category.',
      'Run the review three times per pull request and post only findings that appear in at least two of the runs, so one-off noise is filtered out without having to change the review prompt at all.',
      'Temporarily switch off the comment-accuracy and style categories while their criteria are rewritten and tested, keeping bug and security findings on so developers relearn to trust what gets posted.',
    ],
    answer: 1,
    answers: [1, 4],
    why: [
      'This is the confidence-based filtering that explicit criteria should replace: an uncalibrated cut-off at 8 does not define what is worth reporting, and the "high-confidence only" line already moved dismissal by just 3 points.',
      'Specific categorical criteria about what to report and what to skip improve precision where general instructions do not, and they target the categories with 71–83% dismissal.',
      'The month-old "be conservative" line moved dismissal from 61% to 58%; more emphatic general wording still gives the model no definition of what counts as a finding.',
      'The noisy categories are flagged systematically, so they survive a vote, while real bugs caught only intermittently would be suppressed; it also triples the cost.',
      'High false-positive categories erode trust in the accurate ones, as the merged SQL-injection findings show; disabling them temporarily restores trust while their prompts are improved.',
    ],
    rule: 'Precision comes from explicit categorical criteria, not from "be conservative" or confidence filters; mute noisy categories until they are fixed.',
  },
  // --- Structured Data Extraction ---
  {
    id: 'ml-extraction-segment-then-stratify',
    domain: 'context',
    setting: 'extraction',
    ts: '5.5',
    scenario:
      'Your extraction pipeline pulls 23 fields from supplier invoices, contracts and handwritten delivery notes using `tool_use` with a JSON schema; the model also returns a confidence score per field. Three reviewers check extractions by hand, about 900 documents a day, but volume has grown to 4,000 a day. On a 2,000-document labeled validation set, field accuracy is 97% overall, so the operations lead proposes auto-approving every extraction whose fields all score 0.9 or higher (78% of volume) and removing it from review. The 0.9 cut-off was chosen in a planning meeting, not against the labels. A quick look shows handwritten delivery notes, 6% of volume, at 84% accuracy, and `payment_terms` on scanned contracts at 89%. The nightly run uses the Message Batches API, and the schema last changed in May.',
    ask: 'Which TWO changes to the proposal should you make?',
    options: [
      'Approve the proposal as it stands: 97% accuracy on 2,000 labeled documents is strong evidence, and the remaining 22% of extractions roughly matches the 900 documents a day the reviewers can handle.',
      'Raise the auto-approval cut-off from 0.9 to 0.97 for every field, so only extractions the model reports as near-certain skip review, and leave everything below it in the existing review queue.',
      'Break the validation results down by document type and by field, and automate only the segments that meet the accuracy bar, keeping segments such as handwritten delivery notes and contract `payment_terms` in review.',
      'Whatever gets auto-approved, route a stratified random sample of it, drawn per document type and field, to reviewers, so error rates keep being measured and new error patterns are caught as they appear.',
      'Run each document through extraction twice and auto-approve only the fields where both runs return the same value, since agreement between independent runs is a stronger signal than self-reported confidence.',
    ],
    answer: 2,
    answers: [2, 3],
    why: [
      'An aggregate 97% masks weak segments: handwritten notes at 84% and `payment_terms` at 89% would be auto-approved along with everything else.',
      'The cut-off was never checked against labels; a higher but equally arbitrary number is still uncalibrated and can still pass weak segments. Thresholds should be calibrated on the labeled validation set.',
      'Accuracy must be validated by document type and field before high-confidence extractions are automated, so weak segments stay under review.',
      'Stratified random sampling of high-confidence extractions keeps measuring error rates in every segment, rare ones included, and surfaces new error patterns after review is reduced.',
      'Agreement measures consistency, not correctness: a misread handwritten figure tends to be misread the same way twice, and nothing is checked against labeled data.',
    ],
    rule: 'Before cutting review, validate accuracy per document type and field; afterwards, keep stratified sampling of high-confidence output to catch new errors.',
  },
];

export const EXAM_LEVEL_MULTI_ES: Record<string, QuestionText> = {
  // --- Customer Support Resolution Agent ---
  'ml-support-normalize-and-block-hooks': {
    scenario:
      'Tu agente de soporte funciona con el Agent SDK y las herramientas MCP `get_customer`, `lookup_order`, `process_refund` y `escalate_to_human`. Los pedidos anteriores a la migración de plataforma del año pasado los sirve un backend heredado, así que sus resultados de `lookup_order` traen timestamps Unix y códigos de estado numéricos (`3` = entregado), mientras que los pedidos nuevos devuelven fechas ISO 8601 y estados con nombre. Una nota en el system prompt que explica ambos formatos bajó las decisiones erróneas sobre el plazo de devolución de 30 días del 9% al 6%, y de ahí no pasó. Por otro lado, una auditoría encontró 11 reembolsos de más de 500 $ entre los últimos 2.300, aunque el prompt indica al agente que los escale; el equipo de cumplimiento exige ahora que ninguno se ejecute jamás sin aprobación humana. El 84% de las solicitudes de reembolso son de menos de 500 $, la resolución en el primer contacto está en el 78% frente a un objetivo del 80%, y la cola humana tiene un SLA de 2 horas.',
    ask: '¿Qué DOS cambios debería hacer el equipo para corregir ambos problemas?',
    options: [
      'Ampliar la nota del system prompt con una tabla de todos los códigos de estado numéricos y dos ejemplos few-shot que conviertan un timestamp Unix en fecha de calendario antes de comprobar los 30 días, para que el agente normalice él mismo los resultados heredados.',
      'Añadir un hook `PostToolUse` en `lookup_order` que convierta los timestamps Unix a ISO 8601 y traduzca los códigos de estado numéricos a estados con nombre, para que el agente razone siempre sobre un único formato responda el backend que responda.',
      'Añadir un hook `PostToolUse` en `process_refund` que compruebe el importe reembolsado y, si supera 500 $, abra un ticket a un supervisor para revisar y revertir el reembolso, sin cambiar el flujo del cliente.',
      'Añadir un hook que intercepte las llamadas salientes a `process_refund`, bloquee las de importe superior a 500 $ antes de que lleguen al backend y redirija el caso a `escalate_to_human` con el ID de cliente, el pedido y el importe.',
      'Quitar `process_refund` de las herramientas del agente y enviar todas las solicitudes de reembolso por `escalate_to_human`, para que ningún reembolso, sea del importe que sea, pueda ejecutarse sin que una persona lo apruebe antes.',
    ],
    why: [
      'La nota del prompt ya se estancó en el 6%: más texto en el prompt sigue siendo probabilístico. Un hook convierte los datos de forma determinista antes de que el modelo los vea.',
      'Un hook `PostToolUse` transforma los resultados de la herramienta antes de que el modelo los procese, así que timestamps y códigos de estado heterogéneos llegan al agente siempre en un formato coherente.',
      '`PostToolUse` se ejecuta después de que la herramienta se haya ejecutado, así que el reembolso ya ha salido; eso incumple el requisito de que ninguno se ejecute sin aprobación.',
      'Interceptar la llamada saliente es una garantía determinista: los reembolsos de más de 500 $ nunca llegan al backend y se redirigen al flujo humano, mientras que los menores siguen con normalidad.',
      'Garantiza el cumplimiento, pero envía el 84% de reembolsos de menos de 500 $ a una cola de 2 horas y aleja aún más la resolución en el primer contacto del objetivo del 80%.',
    ],
    rule: 'Usa hooks para las garantías: `PostToolUse` para normalizar resultados de herramientas e interceptación de llamadas salientes para bloquear infracciones de política antes de que se ejecuten.',
  },
  // --- Code Generation with Claude Code ---
  'ml-codegen-plan-migration-explore': {
    scenario:
      'Tu equipo usa Claude Code en un monorepo de pagos de 400.000 líneas. El cliente obsoleto `legacy-http` debe sustituirse por el nuevo cliente del equipo de plataforma antes de que termine su soporte de seguridad en marzo. Un primer Grep encuentra 61 archivos que lo importan; algunas llamadas pasan ajustes propios de reintentos y timeouts, y el tech lead ve dos caminos válidos: un adaptador que mantiene la interfaz antigua, o la sustitución directa, que cambia la semántica de reintentos en los servicios de facturación. En un intento parecido el trimestre pasado, el descubrimiento llenó la sesión principal con cientos de coincidencias de Grep y lecturas de archivos, `/compact` se ejecutó dos veces y el resumen compactado perdió qué llamadas tenían reintentos propios, así que tres servicios salieron a producción con los de por defecto. El CLAUDE.md del repo se dividió hace poco en archivos de `.claude/rules/`, y la CI tarda 18 minutos por ejecución.',
    ask: '¿Qué DOS decisiones debería tomar el desarrollador para esta migración?',
    options: [
      'Empezar en plan mode: que Claude explore cómo se usa el cliente antiguo y proponga un diseño que elija entre el adaptador y la sustitución directa, revisarlo y pasar después a ejecución directa para implementar el plan aprobado.',
      'Empezar en ejecución directa con los tres archivos de facturación que mejor conoce el tech lead, dejar que los primeros cambios revelen qué enfoque encaja y pasar a plan mode solo si aparece una complejidad inesperada.',
      'Encargar el descubrimiento de llamadas al subagente Explore, para que sus coincidencias de Grep y lecturas de archivos se queden en su propio contexto y a la conversación principal solo vuelva un resumen de patrones de uso, incluidos los reintentos propios.',
      'Mantener el descubrimiento en la sesión principal pero ejecutar `/compact` cada 15 archivos leídos, para que el contexto no se llene antes de empezar la implementación y la sesión pueda llevar la migración entera de principio a fin.',
      'Escribir un único prompt detallado que especifique el reemplazo exacto de cada patrón de llamada y ejecutar toda la migración en ejecución directa, para que Claude no tome decisiones de diseño propias y termine los 61 archivos en una sola pasada.',
    ],
    why: [
      'Plan mode encaja con una migración de 61 archivos con dos enfoques válidos y una decisión sobre la semántica de reintentos; una vez aprobado el diseño, la ejecución directa lo implementa.',
      'La complejidad se conoce de antemano (61 archivos, dos enfoques), así que esperar a que aparezca arriesga el retrabajo costoso que plan mode pretende evitar.',
      'El subagente Explore mantiene la salida verbosa del descubrimiento en su propio contexto y devuelve un resumen, así que la sesión principal ni se llena ni pierde detalles como el trimestre pasado.',
      'El trimestre pasado `/compact` perdió las llamadas con reintentos propios; compactar más a menudo en el mismo contexto repite esa pérdida en vez de aislar el descubrimiento.',
      'Unas instrucciones exactas por patrón presuponen una decisión que nadie ha tomado aún; con dos enfoques válidos, primero hay que explorar el código y elegir el diseño.',
    ],
    rule: 'Plan mode para trabajo de muchos archivos y varios enfoques, y luego ejecución directa; lleva el descubrimiento verboso al subagente Explore para que el contexto principal guarde solo un resumen.',
  },
  // --- Multi-Agent Research System ---
  'ml-research-context-and-parallel-task': {
    scenario:
      'El coordinador de tu sistema de investigación delega mediante la herramienta Task en cuatro subagentes definidos con `AgentDefinition`: búsqueda web, análisis de documentos, síntesis y generación de informes. Para una consulta sobre la normativa europea de reciclaje de baterías, la traza muestra cuatro llamadas Task de búsqueda web en cuatro turnos consecutivos del coordinador, una por subtema y de unos 80 s cada una, y después una llamada de análisis de documentos sobre 12 PDF. Luego se invoca la síntesis con el prompt «Combina los hallazgos recopilados hasta ahora en un resumen con citas»; devuelve dos párrafos que citan «las fuentes comentadas arriba» y una URL que no aparece en ningún resultado de búsqueda. 9 de los últimos 20 informes contienen afirmaciones sin atribuir. La plantilla Markdown del subagente de informes cambió la semana pasada y pasa sus comprobaciones. El tiempo total es de 7 minutos; el equipo de producto lo quiere por debajo de 4.',
    ask: '¿Qué DOS cambios resuelven las afirmaciones sin atribuir y el tiempo de ejecución?',
    options: [
      'Pasar en el prompt de Task del subagente de síntesis los resultados completos de búsqueda web y análisis de documentos, como registros estructurados que separen cada afirmación de sus metadatos (URL de la fuente, nombre del documento, página), para conservar la atribución.',
      'Añadir `Task` a las `allowedTools` del coordinador y enumerar las dependencias previas del subagente de síntesis en la descripción de su `AgentDefinition`, para que los resultados de subagentes anteriores le lleguen automáticamente.',
      'Dar también al subagente de síntesis la herramienta de búsqueda web, para que cuando necesite la fuente de una afirmación pueda buscarla él mismo en lugar de depender de lo que le envíe el coordinador.',
      'Hacer que el coordinador emita las cuatro llamadas Task de búsqueda web en una sola respuesta para que los subtemas se investiguen en paralelo, en vez de una llamada por turno, y seguir con el análisis de documentos cuando vuelvan.',
      'Fusionar los subagentes de búsqueda web, análisis de documentos y síntesis en un único subagente de investigación con todas sus herramientas, para que los hallazgos nunca salgan de un mismo contexto y ningún traspaso pueda perderlos.',
    ],
    why: [
      'Los subagentes no heredan el contexto del coordinador, así que «los hallazgos recopilados hasta ahora» no le dieron a la síntesis nada con lo que trabajar. Pasar los hallazgos completos como registros estructurados de afirmación y metadatos le da el material y conserva la atribución.',
      'La traza ya muestra llamadas Task que funcionan, así que `Task` está en `allowedTools`; y ningún ajuste reenvía resultados previos automáticamente: el contexto hay que pasarlo explícitamente en el prompt.',
      'Los hallazgos ya existen; dar a la síntesis una herramienta de búsqueda duplica el trabajo del agente de búsqueda, invita a usar herramientas fuera de su especialidad y añade latencia frente al objetivo de 4 minutos.',
      'Varias llamadas Task en una sola respuesta del coordinador ejecutan los subagentes en paralelo, así que las cuatro búsquedas de unos 80 s tardan más o menos lo que una en lugar de más de cinco minutos.',
      'Un agente con todas las herramientas empeora la selección de herramientas, mete 12 PDF y cuatro búsquedas en un mismo contexto y serializa el trabajo, lo que aleja el tiempo del objetivo de 4 minutos.',
    ],
    rule: 'Un subagente solo recibe lo que contiene su prompt de Task: pasa los hallazgos explícitamente con sus metadatos y emite las llamadas Task en paralelo en una sola respuesta.',
  },
  // --- Developer Productivity with Claude ---
  'ml-devprod-scoped-tools-forced-first': {
    scenario:
      'El agente de productividad para desarrolladores de tu equipo, construido con el Agent SDK, empezó con las herramientas integradas y desde entonces ha sumado servidores MCP para Jira, GitHub, documentación interna y scaffolding de servicios: 19 herramientas en un solo agente. Los logs de 1.200 sesiones muestran que llama a `search_docs` cuando hacía falta `Grep` y que abre incidencias de Jira durante exploraciones de solo lectura de servicios heredados. El sprint pasado se reescribieron todas las descripciones de herramientas con formatos de entrada, ejemplos y límites, y los errores de selección solo bajaron del 21% al 17%. Por otro lado, el flujo de scaffolding debe empezar por `load_service_template`, que fija la configuración de lint y logging del equipo; en el 14% de las ejecuciones el agente llama directamente a `Write` y genera el boilerplate de memoria. Los ingenieros piden abrir un ticket o un PR en un 3% de las sesiones de exploración. El equipo pasó sus runners de CI a ARM el mes pasado.',
    ask: '¿Qué DOS cambios mejorarán más el uso de herramientas del agente?',
    options: [
      'Empezar cada descripción de herramienta con una línea «Usa esta herramienta SOLO cuando…» y añadir al system prompt una lista que asocie palabras clave de las peticiones con herramientas, para que el agente conserve las 19 herramientas y aun así elija bien entre ellas.',
      'Poner `tool_choice: "any"` en el primer turno del flujo de scaffolding, para que el agente tenga que llamar a una herramienta antes de escribir nada en lugar de responder con boilerplate de memoria.',
      'Dividir el agente en subagentes acotados por rol bajo un coordinador, como exploración (`Read`, `Grep`, `Glob`, búsqueda en documentación) y scaffolding (cargador de plantillas, `Write`), cada uno solo con las herramientas que necesita su rol.',
      'Dar a cada subagente acotado por rol los conjuntos completos de herramientas de Jira y GitHub además de las suyas, ya que cualquier sesión de exploración podría acabar con una petición de abrir una incidencia o un pull request.',
      'Forzar `tool_choice` a `{"type": "tool", "name": "load_service_template"}` en el primer turno del flujo de scaffolding y dejar que los turnos siguientes vayan con `"auto"` con la plantilla ya en contexto.',
    ],
    why: [
      'Las descripciones ya se reescribieron con formatos, ejemplos y límites, y los errores apenas bajaron; con 19 herramientas el problema es la complejidad de la decisión, y las listas de palabras clave en el system prompt crean sus propias asociaciones erróneas.',
      '`"any"` solo garantiza que se llame a alguna herramienta; las ejecuciones fallidas ya llaman a una, `Write`, así que seguirían saltándose la plantilla.',
      'Demasiadas herramientas empeoran la selección. Subagentes acotados con solo las herramientas de su rol reducen cada elección a unas pocas e impiden que la exploración llegue siquiera a las de tickets.',
      'Los tickets y PR solo aparecen en el 3% de las sesiones de exploración; volver a añadir los conjuntos completos infla otra vez la elección de cada agente y recupera el mal uso entre roles que muestran los logs. Esas peticiones raras deben pasar por el coordinador.',
      'La selección forzada garantiza que `load_service_template` se ejecute primero; los pasos siguientes continúan en turnos posteriores con la plantilla ya en contexto.',
    ],
    rule: 'Da a cada agente solo las herramientas de su rol y fuerza `tool_choice` cuando una herramienta concreta deba ejecutarse primero; `"any"` solo garantiza alguna herramienta.',
  },
  // --- Claude Code for Continuous Integration ---
  'ml-ci-explicit-criteria-mute-noisy': {
    scenario:
      'Tu pipeline de CI ejecuta Claude Code con `-p` en cada pull request y publica sus hallazgos como comentarios en línea. En los últimos 600 PR, los desarrolladores descartaron el 58% de los comentarios, y en una encuesta varios admitieron que ya los pasan todos por encima, incluidos los de seguridad. Descarte por categoría: exactitud de comentarios («puede que este docstring esté desactualizado») 83%, nombres y estilo 71%, bugs 14%, seguridad 8%. Dos de los tres últimos hallazgos reales de inyección SQL se fusionaron sin atender. El prompt dice: «Revisa con cuidado. Sé conservador y reporta solo hallazgos de alta confianza». La segunda frase se añadió hace un mes y movió el descarte del 61% al 58%. Las revisiones tardan 2,4 minutos de media, el repo mezcla TypeScript y Go, y el equipo planea pasar el job a runners más grandes el próximo trimestre.',
    ask: '¿Qué DOS cambios recuperarán mejor la precisión y la confianza de los desarrolladores?',
    options: [
      'Pedir a Claude que añada una puntuación de confianza del 1 al 10 a cada hallazgo y que el pipeline publique solo los de 8 o más, para filtrar los comentarios dudosos antes de que los vean los desarrolladores.',
      'Sustituir la instrucción «sé conservador» por criterios explícitos: reportar bugs que cambien el comportamiento en ejecución y problemas de seguridad, y omitir estilo, nombres y patrones coherentes con el código de alrededor.',
      'Reforzar la instrucción actual con énfasis, por ejemplo «Sé extremadamente conservador. Los falsos positivos son muy costosos. Reporta solo aquello de lo que estés seguro», para que el modelo suba su propio listón en todas las categorías.',
      'Ejecutar la revisión tres veces por pull request y publicar solo los hallazgos que aparezcan en al menos dos de las ejecuciones, para filtrar el ruido puntual sin tener que cambiar en absoluto el prompt de revisión.',
      'Desactivar temporalmente las categorías de exactitud de comentarios y de estilo mientras se reescriben y prueban sus criterios, manteniendo activos los hallazgos de bugs y seguridad para que los desarrolladores vuelvan a confiar en lo que se publica.',
    ],
    why: [
      'Es el filtrado por confianza que los criterios explícitos deben sustituir: un corte sin calibrar en 8 no define qué merece reportarse, y la línea de «solo alta confianza» ya movió el descarte apenas 3 puntos.',
      'Unos criterios categóricos concretos sobre qué reportar y qué omitir mejoran la precisión donde las instrucciones generales no lo hacen, y atacan las categorías con un 71–83% de descarte.',
      'La línea «sé conservador» de hace un mes movió el descarte del 61% al 58%; una redacción general más enfática sigue sin decir al modelo qué cuenta como hallazgo.',
      'Las categorías ruidosas se marcan de forma sistemática, así que sobreviven a una votación, mientras que los bugs reales detectados solo a veces quedarían suprimidos; además triplica el coste.',
      'Las categorías con muchos falsos positivos minan la confianza en las precisas, como muestran los hallazgos de inyección SQL fusionados sin atender; desactivarlas temporalmente recupera esa confianza mientras se mejoran sus prompts.',
    ],
    rule: 'La precisión sale de criterios categóricos explícitos, no de «sé conservador» ni de filtros de confianza; silencia las categorías ruidosas hasta corregirlas.',
  },
  // --- Structured Data Extraction ---
  'ml-extraction-segment-then-stratify': {
    scenario:
      'Tu pipeline de extracción saca 23 campos de facturas de proveedores, contratos y albaranes manuscritos usando `tool_use` con un JSON schema; el modelo devuelve también una puntuación de confianza por campo. Tres revisores comprueban las extracciones a mano, unos 900 documentos al día, pero el volumen ha crecido hasta 4.000 al día. En un conjunto de validación etiquetado de 2.000 documentos, la precisión por campo es del 97% en conjunto, así que la responsable de operaciones propone aprobar automáticamente toda extracción cuyos campos puntúen todos 0,9 o más (el 78% del volumen) y sacarla de revisión. El umbral de 0,9 se eligió en una reunión de planificación, no con las etiquetas. Un vistazo rápido muestra los albaranes manuscritos, el 6% del volumen, con un 84% de precisión, y `payment_terms` en contratos escaneados con un 89%. La ejecución nocturna usa la Message Batches API, y el schema cambió por última vez en mayo.',
    ask: '¿Qué DOS cambios deberías hacer en la propuesta?',
    options: [
      'Aprobar la propuesta tal cual: un 97% de precisión en 2.000 documentos etiquetados es una prueba sólida, y el 22% restante de extracciones encaja más o menos con los 900 documentos diarios que pueden revisar.',
      'Subir el umbral de aprobación automática de 0,9 a 0,97 en todos los campos, para que solo se salten la revisión las extracciones que el modelo da por casi seguras, y dejar todo lo demás en la cola de revisión actual.',
      'Desglosar los resultados de validación por tipo de documento y por campo, y automatizar solo los segmentos que alcancen el listón de precisión, manteniendo en revisión segmentos como los albaranes manuscritos y `payment_terms` de los contratos.',
      'Enviar siempre a los revisores una muestra aleatoria estratificada de lo que se apruebe automáticamente, por tipo de documento y campo, para que se sigan midiendo las tasas de error y se detecten patrones de error nuevos a medida que aparezcan.',
      'Pasar cada documento dos veces por la extracción y aprobar automáticamente solo los campos en que ambas ejecuciones devuelvan el mismo valor, porque el acuerdo entre ejecuciones independientes es mejor señal que la confianza autodeclarada.',
    ],
    why: [
      'Un 97% agregado oculta segmentos débiles: los albaranes manuscritos al 84% y `payment_terms` al 89% se aprobarían automáticamente con todo lo demás.',
      'El umbral nunca se contrastó con las etiquetas; un número más alto pero igual de arbitrario sigue sin calibrar y puede seguir dejando pasar segmentos débiles. Los umbrales se calibran con el conjunto de validación etiquetado.',
      'La precisión debe validarse por tipo de documento y campo antes de automatizar las extracciones de alta confianza, para que los segmentos débiles sigan en revisión.',
      'El muestreo aleatorio estratificado de extracciones de alta confianza sigue midiendo la tasa de error en cada segmento, incluidos los poco frecuentes, y saca a la luz patrones de error nuevos después de reducir la revisión.',
      'El acuerdo mide consistencia, no corrección: una cifra manuscrita mal leída suele leerse mal igual las dos veces, y nada se contrasta con datos etiquetados.',
    ],
    rule: 'Antes de recortar revisión, valida la precisión por tipo de documento y campo; después, mantén un muestreo estratificado de lo de alta confianza para detectar errores nuevos.',
  },
};
