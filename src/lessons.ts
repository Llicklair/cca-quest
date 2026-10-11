// Una lección por task statement, en inglés y en español de España, escritos a partir de los task statements
// de la guía oficial (Claude Certified Architect – Foundations Exam Guide v1.0, julio 2026).
// Entre comillas invertidas va el código, que la app resalta.
import type { Lesson } from './game.ts';

export const LESSONS: Lesson[] = [
  {
    ts: '1.1',
    title: {
      en: 'Agentic loops driven by `stop_reason`',
      es: 'Bucles agénticos guiados por `stop_reason`',
    },
    tldr: {
      en: 'Send a request, check `stop_reason`, run the requested tools, append the results to the history and repeat. Continue on `tool_use`; stop on `end_turn`.',
      es: 'Envía la petición, mira `stop_reason`, ejecuta las herramientas pedidas, añade los resultados al historial y repite. Sigue con `tool_use`; para con `end_turn`.',
    },
    ideas: [
      {
        en: 'The loop: send the messages to Claude, inspect `stop_reason`, execute the requested tools, then send the results back for the next iteration.',
        es: 'El ciclo: envías los mensajes a Claude, miras `stop_reason`, ejecutas las herramientas que pide y le devuelves los resultados para la siguiente iteración.',
      },
      {
        en: 'If `stop_reason` is `tool_use`, Claude wants a tool run: execute it and keep looping. If it is `end_turn`, Claude is done: exit the loop.',
        es: 'Si `stop_reason` es `tool_use`, Claude quiere usar una herramienta: ejecútala y sigue. Si es `end_turn`, ha terminado: sal del bucle.',
      },
      {
        en: 'Append each tool result to the conversation history so the model can reason about it when it decides the next action.',
        es: 'Añade cada resultado de herramienta al historial de la conversación para que el modelo lo tenga en cuenta al decidir el siguiente paso.',
      },
      {
        en: 'Model-driven: Claude picks the next tool by reasoning over the context. That is different from a pre-configured decision tree or fixed tool sequence.',
        es: 'Decisión guiada por el modelo: Claude elige la siguiente herramienta según el contexto. No es un árbol de decisión ni una secuencia fija preprogramada.',
      },
    ],
    traps: [
      {
        en: 'Do not end the loop by parsing natural-language phrases like \'I am done\'; text is ambiguous. The reliable signal is `stop_reason`.',
        es: 'No decidas que el bucle ha acabado buscando frases como \'ya he terminado\' en el texto; es ambiguo. La señal fiable es `stop_reason`.',
      },
      {
        en: 'Do not use an arbitrary iteration cap as the primary way to stop. It can be a safety net, but the loop should end on `end_turn`.',
        es: 'No uses un límite arbitrario de iteraciones como forma principal de parar. Puede ser una red de seguridad, pero el bucle debe acabar con `end_turn`.',
      },
      {
        en: 'Do not treat \'the response contains text\' as completion: Claude can write text and request a tool in the same response.',
        es: 'No tomes \'la respuesta tiene texto\' como señal de fin: Claude puede escribir texto y pedir una herramienta en la misma respuesta.',
      },
      {
        en: 'Do not drop tool results between iterations; if they are not in the context, the model cannot use the new information.',
        es: 'No descartes los resultados de las herramientas entre iteraciones: si no están en el contexto, el modelo no puede usar esa información nueva.',
      },
    ],
    example: {
      en: 'A support agent needs `get_customer` and then `lookup_order`. Your loop runs each requested tool, appends the result to the messages and calls Claude again while `stop_reason` is `tool_use`. When it returns `end_turn`, you show the final answer to the customer.',
      es: 'Un agente de soporte necesita `get_customer` y luego `lookup_order`. Tu bucle ejecuta cada herramienta pedida, añade el resultado a los mensajes y vuelve a llamar a Claude mientras `stop_reason` sea `tool_use`. Cuando llega `end_turn`, muestras la respuesta final al cliente.',
    },
  },
  {
    ts: '1.2',
    title: {
      en: 'Coordinator-subagent orchestration',
      es: 'Orquestación coordinador-subagente',
    },
    tldr: {
      en: 'A coordinator decomposes the task, delegates to subagents, aggregates results and routes all communication. Subagents have isolated context and do not see its history.',
      es: 'Un coordinador descompone la tarea, delega en subagentes, agrega resultados y enruta toda la comunicación. Los subagentes tienen contexto aislado y no ven su historial.',
    },
    ideas: [
      {
        en: 'Hub-and-spoke: the coordinator manages all communication between subagents, error handling and information routing.',
        es: 'Hub-and-spoke: el coordinador gestiona toda la comunicación entre subagentes, el manejo de errores y el enrutado de la información.',
      },
      {
        en: 'Subagents run with isolated context. They do not automatically inherit the coordinator\'s conversation history.',
        es: 'Los subagentes trabajan con contexto aislado: no heredan automáticamente el historial de conversación del coordinador.',
      },
      {
        en: 'The coordinator decomposes the task, delegates, aggregates results and decides which subagents to invoke based on query complexity.',
        es: 'El coordinador descompone la tarea, delega, agrega los resultados y decide qué subagentes invocar según la complejidad de la consulta.',
      },
      {
        en: 'Select subagents dynamically for each query instead of always running the full pipeline.',
        es: 'Elige los subagentes de forma dinámica en cada consulta en vez de pasar siempre por el pipeline completo.',
      },
      {
        en: 'Partition the research scope to avoid duplication: give each subagent distinct subtopics or source types.',
        es: 'Reparte el alcance de la investigación para evitar duplicados: asigna a cada subagente subtemas o tipos de fuente distintos.',
      },
      {
        en: 'Iterative refinement: check the synthesis for gaps, re-delegate targeted queries to search and analysis, re-run synthesis until coverage is enough.',
        es: 'Refinamiento iterativo: busca huecos en la síntesis, re-delega consultas concretas a búsqueda y análisis y repite la síntesis hasta cubrir lo suficiente.',
      },
    ],
    traps: [
      {
        en: 'Do not decompose a broad topic too narrowly. Splitting \'creative industries\' into only visual-arts subtasks loses music, writing and film.',
        es: 'No descompongas un tema amplio de forma demasiado estrecha. Si \'industrias creativas\' se divide solo en artes visuales, se pierden música, escritura y cine.',
      },
      {
        en: 'Do not blame downstream subagents when coverage is missing but they did their assigned work well; the gap comes from the decomposition.',
        es: 'No culpes a los subagentes si falta cobertura pero hicieron bien lo que se les asignó; el hueco viene de la descomposición del coordinador.',
      },
      {
        en: 'Do not let subagents talk to each other directly; routing through the coordinator keeps observability, consistent error handling and control.',
        es: 'No dejes que los subagentes se comuniquen directamente; pasar por el coordinador da observabilidad, errores uniformes y un flujo controlado.',
      },
      {
        en: 'Do not send every request through the full pipeline; a simple query may need only one subagent.',
        es: 'No mandes todas las peticiones por el pipeline completo; una consulta sencilla puede necesitar un solo subagente.',
      },
    ],
    example: {
      en: 'A report on \'AI in creative industries\' covers only visual arts. The logs show the coordinator created three subtasks (digital art, graphic design, photography) and every subagent did its job. Fix the coordinator\'s decomposition so it also covers music, writing and film, and have it check the synthesis for gaps before finishing.',
      es: 'Un informe sobre \'IA en las industrias creativas\' solo cubre artes visuales. Los logs muestran que el coordinador creó tres subtareas (arte digital, diseño gráfico, fotografía) y que cada subagente cumplió. Corrige la descomposición del coordinador para que incluya música, escritura y cine, y haz que revise la síntesis en busca de huecos antes de terminar.',
    },
  },
  {
    ts: '1.3',
    title: {
      en: 'Spawning subagents and passing context',
      es: 'Lanzar subagentes y pasarles contexto',
    },
    tldr: {
      en: 'Subagents are spawned with the `Task` tool, so the coordinator\'s `allowedTools` must include `Task`. Pass everything a subagent needs in its prompt; it inherits nothing.',
      es: 'Los subagentes se lanzan con la herramienta `Task`, así que el `allowedTools` del coordinador debe incluir `Task`. Pasa en el prompt todo lo que necesiten: no heredan nada.',
    },
    ideas: [
      {
        en: 'The `Task` tool spawns subagents. A coordinator can invoke them only if its `allowedTools` includes `Task`.',
        es: 'La herramienta `Task` lanza subagentes. Un coordinador solo puede invocarlos si su `allowedTools` incluye `Task`.',
      },
      {
        en: 'Context must be explicit: put prior agents\' complete findings in the subagent\'s prompt. Subagents share no memory between invocations.',
        es: 'El contexto debe ser explícito: mete los hallazgos completos de los agentes previos en el prompt del subagente. No comparten memoria entre invocaciones.',
      },
      {
        en: 'An `AgentDefinition` sets each subagent type\'s description, system prompt and tool restrictions.',
        es: 'Una `AgentDefinition` fija la descripción, el system prompt y las restricciones de herramientas de cada tipo de subagente.',
      },
      {
        en: 'Use structured data that separates content from metadata (source URL, document name, page number) so attribution survives.',
        es: 'Usa datos estructurados que separen contenido y metadatos (URL de la fuente, nombre del documento, página) para no perder la atribución.',
      },
      {
        en: 'For parallel subagents, emit several `Task` calls in a single coordinator response, not one per turn.',
        es: 'Para subagentes en paralelo, emite varias llamadas a `Task` en una sola respuesta del coordinador, no una por turno.',
      },
      {
        en: 'Fork-based sessions let you explore divergent approaches from a shared analysis baseline.',
        es: 'Las sesiones con fork te permiten explorar enfoques distintos a partir de una base de análisis común.',
      },
    ],
    traps: [
      {
        en: 'Do not assume a subagent remembers earlier work or sees the parent\'s context; if it is not in the prompt, the subagent does not have it.',
        es: 'No des por hecho que un subagente recuerda trabajo anterior o ve el contexto del padre; si no está en el prompt, no lo tiene.',
      },
      {
        en: 'Do not spawn \'parallel\' subagents across separate turns; that runs them one after another. Emit all `Task` calls in one response.',
        es: 'No lances subagentes \'en paralelo\' en turnos separados: así se ejecutan uno tras otro. Emite todas las llamadas a `Task` en una respuesta.',
      },
      {
        en: 'Do not pass findings as loose prose that mixes claims and sources; attribution gets lost in synthesis. Keep metadata in separate fields.',
        es: 'No pases los hallazgos como texto suelto que mezcla afirmaciones y fuentes; la atribución se pierde en la síntesis. Separa los metadatos en campos.',
      },
      {
        en: 'Do not write coordinator prompts as rigid step-by-step procedures; state research goals and quality criteria so subagents can adapt.',
        es: 'No escribas prompts de coordinador como procedimientos paso a paso; da objetivos y criterios de calidad para que los subagentes puedan adaptarse.',
      },
    ],
    example: {
      en: 'The coordinator launches the web search and document analysis subagents with two `Task` calls in the same response, so they run in parallel. It then spawns the synthesis subagent with both outputs in full inside its prompt, each finding stored as a claim plus source URL, document name and page number.',
      es: 'El coordinador lanza los subagentes de búsqueda web y de análisis de documentos con dos llamadas a `Task` en la misma respuesta, así que corren en paralelo. Después lanza el subagente de síntesis con ambos resultados completos en su prompt, cada hallazgo como afirmación más URL de la fuente, nombre del documento y página.',
    },
  },
  {
    ts: '1.4',
    title: {
      en: 'Workflow enforcement and handoffs',
      es: 'Forzar el orden del flujo y traspasos',
    },
    tldr: {
      en: 'When a step order must always hold, like verifying identity before a refund, enforce it in code with prerequisite gates or hooks. Prompts alone have a non-zero failure rate.',
      es: 'Cuando un orden de pasos debe cumplirse siempre, como verificar la identidad antes de un reembolso, impónlo en código con prerrequisitos o hooks. Los prompts solos fallan a veces.',
    },
    ideas: [
      {
        en: 'Programmatic enforcement (hooks, prerequisite gates) is deterministic. Prompt-based guidance is probabilistic and sometimes fails.',
        es: 'La imposición programática (hooks, prerrequisitos) es determinista. Las instrucciones en el prompt son probabilísticas y a veces fallan.',
      },
      {
        en: 'When compliance must be deterministic, like identity checks before financial operations, prompt instructions alone are not enough.',
        es: 'Cuando el cumplimiento debe ser determinista, como verificar la identidad antes de operaciones financieras, el prompt solo no basta.',
      },
      {
        en: 'A programmatic prerequisite blocks downstream calls, e.g. `process_refund`, until `get_customer` has returned a verified customer ID.',
        es: 'Un prerrequisito programático bloquea las llamadas posteriores, p. ej. `process_refund`, hasta que `get_customer` devuelve un ID de cliente verificado.',
      },
      {
        en: 'Split a multi-concern request into distinct items, investigate each in parallel with shared context, then give one unified resolution.',
        es: 'Divide una petición con varios problemas en puntos separados, investiga cada uno en paralelo con contexto compartido y da una resolución unificada.',
      },
      {
        en: 'When escalating mid-process, give the human a structured handoff: customer details, root cause analysis and recommended actions.',
        es: 'Al escalar a mitad de proceso, da al humano un traspaso estructurado: datos del cliente, análisis de la causa raíz y acciones recomendadas.',
      },
    ],
    traps: [
      {
        en: 'Do not fix a skipped critical step with a stronger system prompt or few-shot examples; both still rely on probabilistic compliance.',
        es: 'No arregles un paso crítico que se salta con un system prompt más enfático o ejemplos few-shot: ambos siguen siendo cumplimiento probabilístico.',
      },
      {
        en: 'Do not use a tool-routing classifier for an ordering problem; it changes which tools are available, not the order they are called in.',
        es: 'No uses un clasificador que filtre herramientas para un problema de orden: cambia qué herramientas hay disponibles, no en qué orden se llaman.',
      },
      {
        en: 'Do not escalate with a vague note; the human agent cannot see the transcript, so include customer ID, root cause, amount and next action.',
        es: 'No escales con una nota vaga: el agente humano no ve la transcripción, así que incluye ID de cliente, causa raíz, importe y acción recomendada.',
      },
      {
        en: 'Do not treat a multi-issue message as one blob; split it into separate concerns so none of them gets lost.',
        es: 'No trates un mensaje con varios problemas como un bloque único; sepáralo en asuntos distintos para que no se pierda ninguno.',
      },
    ],
    example: {
      en: 'In 12% of cases the agent skips `get_customer` and calls `lookup_order` with only the customer\'s stated name, causing wrong refunds. Add a programmatic prerequisite that blocks `lookup_order` and `process_refund` until `get_customer` returns a verified customer ID. A stricter prompt or few-shot examples would still fail sometimes.',
      es: 'En el 12% de los casos el agente se salta `get_customer` y llama a `lookup_order` solo con el nombre que da el cliente, lo que provoca reembolsos erróneos. Añade un prerrequisito programático que bloquee `lookup_order` y `process_refund` hasta que `get_customer` devuelva un ID de cliente verificado. Un prompt más estricto o ejemplos few-shot seguirían fallando a veces.',
    },
  },
  {
    ts: '1.5',
    title: {
      en: 'Agent SDK hooks: interception and normalization',
      es: 'Hooks del Agent SDK: interceptar y normalizar',
    },
    tldr: {
      en: 'Hooks act in code: `PostToolUse` transforms tool results before the model sees them, and interception hooks block policy-violating calls. Use them when compliance must be guaranteed.',
      es: 'Los hooks actúan en código: `PostToolUse` transforma los resultados antes de que los vea el modelo y los de intercepción bloquean llamadas prohibidas. Úsalos si el cumplimiento debe estar garantizado.',
    },
    ideas: [
      {
        en: 'A `PostToolUse` hook intercepts a tool result and transforms it before the model processes it.',
        es: 'Un hook `PostToolUse` intercepta el resultado de una herramienta y lo transforma antes de que el modelo lo procese.',
      },
      {
        en: 'Use `PostToolUse` to normalize mixed formats from different MCP tools, such as Unix timestamps, ISO 8601 dates and numeric status codes.',
        es: 'Usa `PostToolUse` para normalizar formatos mezclados de distintas herramientas MCP: timestamps Unix, fechas ISO 8601, códigos de estado numéricos.',
      },
      {
        en: 'Another hook pattern intercepts outgoing tool calls to enforce compliance rules, e.g. blocking refunds above a threshold.',
        es: 'Otro patrón de hook intercepta las llamadas salientes a herramientas para imponer reglas, p. ej. bloquear reembolsos por encima de un umbral.',
      },
      {
        en: 'When a hook blocks a policy-violating action, it can redirect to an alternative workflow such as human escalation.',
        es: 'Cuando un hook bloquea una acción que viola la política, puede redirigirla a un flujo alternativo, como escalar a un humano.',
      },
      {
        en: 'Hooks give deterministic guarantees; prompt instructions give probabilistic compliance. Pick hooks when business rules must always hold.',
        es: 'Los hooks dan garantías deterministas; el prompt, cumplimiento probabilístico. Elige hooks si las reglas de negocio deben cumplirse siempre.',
      },
    ],
    traps: [
      {
        en: 'Do not enforce a hard limit like \'no refunds over $500\' only with prompt text; the model will sometimes break it. Use an interception hook.',
        es: 'No impongas un límite estricto como \'nada de reembolsos de más de 500 $\' solo con el prompt: a veces se lo saltará. Usa un hook de intercepción.',
      },
      {
        en: 'Do not leave the model to interpret inconsistent date and status formats from each tool; normalize them first in a `PostToolUse` hook.',
        es: 'No dejes que el modelo interprete formatos de fecha y estado distintos según la herramienta; normalízalos antes en un hook `PostToolUse`.',
      },
      {
        en: 'Do not stop at blocking a violating action; route it to an alternative path, such as human escalation, so the case still moves forward.',
        es: 'No te quedes en bloquear la acción prohibida; redirígela a otra vía, como escalar a un humano, para que el caso siga avanzando.',
      },
    ],
    example: {
      en: 'Two MCP tools return dates as Unix timestamps and as ISO 8601 strings, plus numeric status codes. A `PostToolUse` hook converts them to one format before Claude reads them. A second hook intercepts `process_refund` calls above $500, blocks them and redirects the case to human escalation.',
      es: 'Dos herramientas MCP devuelven fechas como timestamps Unix y como cadenas ISO 8601, además de códigos de estado numéricos. Un hook `PostToolUse` lo pasa todo a un único formato antes de que Claude lo lea. Un segundo hook intercepta las llamadas a `process_refund` de más de 500 $, las bloquea y redirige el caso a escalado humano.',
    },
  },
  {
    ts: '1.6',
    title: {
      en: 'Task decomposition strategies',
      es: 'Estrategias de descomposición de tareas',
    },
    tldr: {
      en: 'Use prompt chaining (fixed sequential steps) for predictable multi-aspect work, and dynamic decomposition for open-ended investigations where next subtasks depend on findings.',
      es: 'Usa prompt chaining (pasos fijos en secuencia) para trabajo predecible con varios aspectos, y descomposición dinámica para investigaciones abiertas donde las subtareas dependen de lo que descubres.',
    },
    ideas: [
      {
        en: 'Prompt chaining is a fixed sequential pipeline of focused steps. It fits predictable, multi-aspect reviews.',
        es: 'El prompt chaining es un pipeline secuencial fijo de pasos acotados. Encaja en revisiones predecibles con varios aspectos.',
      },
      {
        en: 'Dynamic adaptive decomposition generates subtasks from intermediate findings. It fits open-ended investigation tasks.',
        es: 'La descomposición dinámica y adaptativa genera subtareas a partir de hallazgos intermedios. Encaja en investigaciones abiertas.',
      },
      {
        en: 'Large code review: analyze each file individually for local issues, then run a separate cross-file integration pass.',
        es: 'Revisión de código grande: analiza cada archivo por separado buscando problemas locales y luego haz una pasada de integración entre archivos.',
      },
      {
        en: 'Per-file passes avoid attention dilution, which shows up as uneven depth, missed bugs and contradictory feedback.',
        es: 'Las pasadas por archivo evitan la dilución de la atención, que se nota en profundidad desigual, bugs que se escapan y comentarios contradictorios.',
      },
      {
        en: 'Open-ended task, e.g. \'add comprehensive tests to a legacy codebase\': map structure, find high-impact areas, then build a prioritized plan that adapts.',
        es: 'Tarea abierta, p. ej. \'añadir tests completos a código legacy\': mapea la estructura, localiza las zonas de alto impacto y haz un plan priorizado que se adapte.',
      },
    ],
    traps: [
      {
        en: 'Do not review many files in a single pass; attention gets diluted and the feedback becomes shallow or contradictory.',
        es: 'No revises muchos archivos en una sola pasada: la atención se diluye y los comentarios salen superficiales o contradictorios.',
      },
      {
        en: 'Do not expect a bigger context window to fix attention quality; it does not. Split the work into focused passes instead.',
        es: 'No esperes que una ventana de contexto mayor arregle la calidad de la atención: no lo hace. Divide el trabajo en pasadas acotadas.',
      },
      {
        en: 'Do not force a fixed pipeline onto an open-ended investigation; you cannot plan steps for things you have not discovered yet.',
        es: 'No impongas un pipeline fijo a una investigación abierta: no puedes planificar pasos para lo que aún no has descubierto.',
      },
      {
        en: 'Do not flag only issues found in 2 of 3 repeated runs; that consensus rule suppresses real bugs that are caught only intermittently.',
        es: 'No marques solo los problemas que salen en 2 de 3 ejecuciones repetidas: ese consenso oculta bugs reales que solo se detectan a veces.',
      },
    ],
    example: {
      en: 'A PR changes 14 files and the single-pass review is inconsistent: deep on some files, shallow on others, and contradictory on identical code. Restructure it as a chain: one local-analysis pass per file, then a separate integration pass that checks data flow across files.',
      es: 'Un PR toca 14 archivos y la revisión en una sola pasada es irregular: profunda en unos, superficial en otros y contradictoria con código idéntico. Reestructúrala como cadena: una pasada de análisis local por archivo y luego una pasada de integración aparte que revise el flujo de datos entre archivos.',
    },
  },
  {
    ts: '1.7',
    title: {
      en: 'Session resumption and forking',
      es: 'Reanudar y bifurcar sesiones',
    },
    tldr: {
      en: 'Resume a named session with `--resume <session-name>` when its context is still valid, branch with `fork_session`, and start fresh with a structured summary when tool results are stale.',
      es: 'Reanuda una sesión con nombre con `--resume <session-name>` si su contexto sigue siendo válido, bifurca con `fork_session` y empieza de cero con un resumen estructurado si los resultados están obsoletos.',
    },
    ideas: [
      {
        en: '`--resume <session-name>` continues a specific prior conversation, so a named investigation can span several work sessions.',
        es: '`--resume <session-name>` continúa una conversación concreta anterior, así una investigación con nombre puede durar varias jornadas.',
      },
      {
        en: '`fork_session` creates independent branches from a shared analysis baseline to explore divergent approaches.',
        es: '`fork_session` crea ramas independientes a partir de una base de análisis común para explorar enfoques distintos.',
      },
      {
        en: 'Typical fork use: compare two testing strategies or two refactoring approaches built on the same codebase analysis.',
        es: 'Uso típico de un fork: comparar dos estrategias de testing o dos enfoques de refactorización sobre el mismo análisis del código.',
      },
      {
        en: 'Resume when prior context is mostly valid. Start fresh with an injected structured summary when earlier tool results are stale.',
        es: 'Reanuda si el contexto previo sigue siendo válido casi todo. Empieza de cero con un resumen estructurado si los resultados de herramientas están obsoletos.',
      },
      {
        en: 'After code changes, tell the resumed session which files changed so it re-analyzes just those instead of re-exploring everything.',
        es: 'Tras cambiar código, dile a la sesión reanudada qué archivos cambiaron para que vuelva a analizar solo esos en vez de explorarlo todo otra vez.',
      },
    ],
    traps: [
      {
        en: 'Do not resume a session full of stale tool results and trust them; a new session with a structured summary is more reliable.',
        es: 'No reanudes una sesión llena de resultados obsoletos y te fíes de ellos; una sesión nueva con un resumen estructurado es más fiable.',
      },
      {
        en: 'Do not resume after editing files without saying so; the agent will reason from its outdated analysis of those files.',
        es: 'No reanudes tras editar archivos sin avisar: el agente razonará con su análisis desactualizado de esos archivos.',
      },
      {
        en: 'Do not force a full re-exploration after small changes; point the resumed session at the specific files that changed.',
        es: 'No obligues a reexplorar todo tras cambios pequeños; señala a la sesión reanudada los archivos concretos que cambiaron.',
      },
      {
        en: 'Do not try two competing approaches one after another in one linear session; fork from the shared baseline so each branch stays independent.',
        es: 'No pruebes dos enfoques rivales uno tras otro en una sola sesión lineal; bifurca desde la base común para que cada rama sea independiente.',
      },
    ],
    example: {
      en: 'Yesterday you analyzed a service in a session named `auth-audit`. Today you resume it with `--resume auth-audit` and say which two files changed overnight, so it re-checks only those. To compare two refactoring approaches, you use `fork_session` to branch both from that same analysis.',
      es: 'Ayer analizaste un servicio en una sesión llamada `auth-audit`. Hoy la reanudas con `--resume auth-audit` y le dices qué dos archivos cambiaron durante la noche, para que revise solo esos. Para comparar dos enfoques de refactorización, usas `fork_session` y creas ambas ramas desde ese mismo análisis.',
    },
  },
  {
    ts: '2.1',
    title: {
      en: 'Tool descriptions drive tool selection',
      es: 'La descripción decide qué herramienta se usa',
    },
    tldr: {
      en: 'The model picks tools mainly by reading their descriptions. Each one must say what the tool does, what it takes and returns, and when to use it instead of a similar tool.',
      es: 'El modelo elige herramientas sobre todo leyendo sus descripciones. Cada una debe decir qué hace, qué recibe y qué devuelve, y cuándo usarla en lugar de otra parecida.',
    },
    ideas: [
      {
        en: 'Descriptions are the main signal for tool selection. Minimal ones like "Retrieves order details" force the model to guess between similar tools.',
        es: 'La descripción es la señal principal para elegir herramienta. Si es mínima, como "Retrieves order details", el modelo adivina entre herramientas parecidas.',
      },
      {
        en: 'A good description covers input formats, example queries, edge cases and boundaries: when to use this tool and when to use the similar one instead.',
        es: 'Una buena descripción incluye formatos de entrada, consultas de ejemplo, casos límite y fronteras: cuándo usar esta herramienta y cuándo la otra parecida.',
      },
      {
        en: 'Overlapping names or descriptions cause misrouting. Rename and rewrite to remove overlap, e.g. `analyze_content` becomes `extract_web_results`.',
        es: 'Nombres o descripciones que se solapan provocan errores de enrutado. Renombra y reescribe: `analyze_content` pasa a ser `extract_web_results`.',
      },
      {
        en: 'Split a generic tool into focused tools with defined input/output contracts, e.g. `extract_data_points`, `summarize_content`, `verify_claim_against_source`.',
        es: 'Divide una herramienta genérica en varias concretas con contrato de entrada/salida: `extract_data_points`, `summarize_content`, `verify_claim_against_source`.',
      },
      {
        en: 'System prompt wording also steers selection. Keyword-sensitive instructions can tie a word to the wrong tool and override a good description.',
        es: 'El system prompt también influye. Instrucciones sensibles a palabras clave pueden ligar un término a la herramienta errónea y anular una buena descripción.',
      },
    ],
    traps: [
      {
        en: 'Don\'t jump to few-shot examples or a keyword routing layer when descriptions are minimal. Fix the descriptions first: root cause and cheapest fix.',
        es: 'No saltes a ejemplos few-shot ni a un enrutado por palabras clave si las descripciones son mínimas. Arréglalas primero: es la causa raíz y lo más barato.',
      },
      {
        en: 'Don\'t merge similar tools into one catch-all like `lookup_entity` as a first step. It can be valid design, but it costs more than fixing descriptions.',
        es: 'No fusiones herramientas parecidas en una genérica como `lookup_entity` como primer paso. Puede ser válido, pero cuesta más que mejorar las descripciones.',
      },
      {
        en: 'Don\'t keep two tools with near-identical descriptions, like `analyze_content` vs `analyze_document`. The model cannot tell them apart and misroutes.',
        es: 'No mantengas dos herramientas con descripciones casi idénticas, como `analyze_content` y `analyze_document`. El modelo no las distingue y enruta mal.',
      },
    ],
    example: {
      en: 'In a research system, `analyze_content` and `analyze_document` have near-identical descriptions, so web results often reach the wrong tool. The fix: rename `analyze_content` to `extract_web_results` with a web-specific description, and review the system prompt for keywords that still push the model toward the wrong tool.',
      es: 'En un sistema de investigación, `analyze_content` y `analyze_document` tienen descripciones casi idénticas y los resultados web acaban en la herramienta equivocada. La solución: renombrar `analyze_content` a `extract_web_results` con una descripción específica para web, y revisar el system prompt por si alguna palabra clave sigue empujando al modelo hacia la herramienta errónea.',
    },
  },
  {
    ts: '2.2',
    title: {
      en: 'Structured error responses for MCP tools',
      es: 'Errores estructurados en herramientas MCP',
    },
    tldr: {
      en: 'When a tool fails, set `isError` and return structured metadata (category, retryable flag, clear message) so the agent can choose: retry, fix the input, explain, or escalate.',
      es: 'Si una herramienta falla, marca `isError` y devuelve metadatos estructurados (categoría, si es reintentable, mensaje claro) para que el agente decida: reintentar, corregir, explicar o escalar.',
    },
    ideas: [
      {
        en: 'Use the MCP `isError` flag to tell the agent a tool call failed, and include structured details so it can plan its recovery.',
        es: 'Usa el flag `isError` de MCP para indicar al agente que la llamada falló, e incluye detalles estructurados para que pueda planificar la recuperación.',
      },
      {
        en: 'Know the four kinds: transient (timeout, service down), validation (invalid input), business (policy violation) and permission errors.',
        es: 'Distingue los cuatro tipos: transitorios (timeout, servicio caído), de validación (entrada inválida), de negocio (violación de política) y de permisos.',
      },
      {
        en: 'Return `errorCategory` (transient/validation/permission), an `isRetryable` boolean and a human-readable description to avoid wasted retries.',
        es: 'Devuelve `errorCategory` (transient/validation/permission), un booleano `isRetryable` y una descripción legible para evitar reintentos inútiles.',
      },
      {
        en: 'For business rule violations, add `retriable: false` and a customer-friendly explanation the agent can pass on to the user.',
        es: 'En violaciones de reglas de negocio, añade `retriable: false` y una explicación apta para el cliente que el agente pueda transmitir al usuario.',
      },
      {
        en: 'Subagents retry transient failures locally. Only errors they cannot fix go to the coordinator, with partial results and what was already tried.',
        es: 'Los subagentes reintentan en local los fallos transitorios. Solo suben al coordinador lo que no pueden resolver, con resultados parciales y lo ya intentado.',
      },
      {
        en: 'An access failure (the query could not run) needs a retry decision. A valid empty result (it ran, nothing matched) is a success.',
        es: 'Un fallo de acceso (la consulta no pudo ejecutarse) exige decidir si reintentar. Un resultado vacío válido (se ejecutó y no hubo coincidencias) es un éxito.',
      },
    ],
    traps: [
      {
        en: 'Don\'t return a generic "Operation failed". It hides whether to retry, fix the input or tell the user, so the agent cannot recover well.',
        es: 'No devuelvas un genérico "Operation failed". Oculta si hay que reintentar, corregir la entrada o avisar al usuario, y el agente no puede recuperarse bien.',
      },
      {
        en: 'Don\'t turn a timeout into an empty result marked as success. The agent takes "no data" as a real answer and never retries or reports the gap.',
        es: 'No conviertas un timeout en un resultado vacío marcado como éxito. El agente toma "sin datos" como respuesta real y nunca reintenta ni informa del hueco.',
      },
      {
        en: 'Don\'t retry validation, business or permission errors as if they were transient. Repeating the same bad input or blocked action only wastes calls.',
        es: 'No reintentes errores de validación, negocio o permisos como si fueran transitorios. Repetir la misma entrada inválida o acción bloqueada solo gasta llamadas.',
      },
      {
        en: 'Don\'t send every failure straight to the coordinator, or stop the whole workflow on one failure. Recover locally first, then escalate with context.',
        es: 'No mandes cada fallo directo al coordinador ni detengas todo el flujo por un solo fallo. Recupera primero en local y luego escala con contexto.',
      },
    ],
    example: {
      en: '`process_refund` rejects a refund that breaks the return policy. A plain "Operation failed" would make the agent retry pointlessly. Instead the tool sets `isError`, marks the error `retriable: false` and adds a customer-friendly explanation, so the agent stops retrying and explains the reason to the customer, or escalates.',
      es: '`process_refund` rechaza un reembolso que incumple la política de devoluciones. Con un simple "Operation failed" el agente reintentaría sin sentido. En su lugar, la herramienta marca `isError`, indica `retriable: false` y añade una explicación apta para el cliente, así el agente deja de reintentar y le explica el motivo, o escala.',
    },
  },
  {
    ts: '2.3',
    title: {
      en: 'Scoped tool sets and `tool_choice`',
      es: 'Herramientas acotadas por agente y `tool_choice`',
    },
    tldr: {
      en: 'Give each agent only the few tools its role needs; too many tools make selection unreliable. Use `tool_choice` to control whether the model must call a tool, and which one.',
      es: 'Da a cada agente solo las pocas herramientas que su rol necesita; con demasiadas, elige peor. Usa `tool_choice` para controlar si el modelo debe llamar a una herramienta y a cuál.',
    },
    ideas: [
      {
        en: 'More tools means harder choices: an agent with 18 tools selects less reliably than one with 4-5. Keep each tool set small and role-focused.',
        es: 'Más herramientas, decisiones más difíciles: un agente con 18 elige peor que uno con 4-5. Mantén cada conjunto pequeño y centrado en su rol.',
      },
      {
        en: 'Agents misuse tools outside their specialty, like a synthesis agent running web searches. Restrict each subagent to the tools of its role.',
        es: 'Los agentes usan mal herramientas ajenas a su especialidad, como un agente de síntesis haciendo búsquedas web. Limita cada subagente a las de su rol.',
      },
      {
        en: 'Replace generic tools with constrained ones: instead of `fetch_url`, offer `load_document`, which validates document URLs.',
        es: 'Sustituye herramientas genéricas por otras acotadas: en lugar de `fetch_url`, ofrece `load_document`, que valida las URLs de documentos.',
      },
      {
        en: 'For a frequent cross-role need, add one scoped tool (e.g. `verify_fact` for the synthesis agent) and keep complex cases going through the coordinator.',
        es: 'Para una necesidad frecuente de otro rol, añade una herramienta acotada (p. ej. `verify_fact` para síntesis) y deja los casos complejos al coordinador.',
      },
      {
        en: '`tool_choice` `"auto"`: the model may reply with text instead of calling a tool. `"any"`: it must call a tool, but it chooses which one.',
        es: '`tool_choice` `"auto"`: el modelo puede responder con texto en vez de llamar a una herramienta. `"any"`: debe llamar a una, pero elige cuál.',
      },
      {
        en: 'Forced selection `{"type": "tool", "name": "..."}` makes the model call that exact tool, e.g. `extract_metadata` first; later steps go in follow-up turns.',
        es: 'La selección forzada `{"type": "tool", "name": "..."}` obliga a llamar a esa herramienta, p. ej. `extract_metadata` primero; el resto va en turnos siguientes.',
      },
    ],
    traps: [
      {
        en: 'Don\'t give the synthesis agent all the web search tools to save round trips. It over-provisions the agent and breaks separation of concerns.',
        es: 'No des al agente de síntesis todas las herramientas de búsqueda web para ahorrar idas y vueltas. Lo sobredimensionas y rompes la separación de funciones.',
      },
      {
        en: 'Don\'t use `"auto"` when you need a guaranteed tool call. With `"auto"` the model may return plain text; use `"any"` or a forced tool.',
        es: 'No uses `"auto"` si necesitas una llamada a herramienta garantizada. Con `"auto"` el modelo puede responder con texto; usa `"any"` o fuerza la herramienta.',
      },
      {
        en: 'Don\'t use `"any"` when one specific tool must run first. `"any"` lets the model pick; only forced selection guarantees that exact tool.',
        es: 'No uses `"any"` si una herramienta concreta debe ejecutarse primero. Con `"any"` el modelo elige; solo la selección forzada garantiza esa herramienta.',
      },
      {
        en: 'Don\'t hand every agent every tool just in case. Extra tools add decision complexity and invite misuse outside the agent\'s role.',
        es: 'No des todas las herramientas a todos los agentes por si acaso. Las de más añaden complejidad a la decisión y favorecen usos fuera del rol.',
      },
    ],
    example: {
      en: 'An extraction pipeline must run `extract_metadata` before any enrichment tool, but the model sometimes calls an enrichment tool first or just answers in text. Set `tool_choice` to `{"type": "tool", "name": "extract_metadata"}` for the first request, then run the enrichment steps in follow-up turns.',
      es: 'Un pipeline de extracción debe ejecutar `extract_metadata` antes que cualquier herramienta de enriquecimiento, pero a veces el modelo llama antes a otra o responde solo con texto. Pon `tool_choice` a `{"type": "tool", "name": "extract_metadata"}` en la primera petición y haz el enriquecimiento en los turnos siguientes.',
    },
  },
  {
    ts: '2.4',
    title: {
      en: 'Integrating MCP servers',
      es: 'Integrar servidores MCP',
    },
    tldr: {
      en: 'Shared team servers go in the project `.mcp.json`, with `${VAR}` expansion for secrets; personal or experimental ones go in `~/.claude.json`. All their tools are available together.',
      es: 'Los servidores del equipo van en el `.mcp.json` del proyecto, con expansión `${VAR}` para secretos; los personales o experimentales, en `~/.claude.json`. Todas sus herramientas conviven.',
    },
    ideas: [
      {
        en: 'Project scope `.mcp.json` is for shared team tooling. User scope `~/.claude.json` is for your personal or experimental servers.',
        es: 'Ámbito de proyecto, `.mcp.json`: herramientas compartidas del equipo. Ámbito de usuario, `~/.claude.json`: tus servidores personales o experimentales.',
      },
      {
        en: 'Use environment variable expansion in `.mcp.json`, e.g. `${GITHUB_TOKEN}`, so the shared config uses credentials without committing secrets.',
        es: 'Usa la expansión de variables de entorno en `.mcp.json`, p. ej. `${GITHUB_TOKEN}`, para usar credenciales sin subir secretos al repositorio.',
      },
      {
        en: 'Tools from every configured MCP server are discovered at connection time and are all available to the agent at the same time.',
        es: 'Las herramientas de todos los servidores MCP configurados se descubren al conectar y el agente las tiene disponibles todas a la vez.',
      },
      {
        en: 'MCP resources expose content catalogs (issue summaries, doc hierarchies, database schemas) so the agent sees what exists without exploratory calls.',
        es: 'Los MCP resources exponen catálogos de contenido (resúmenes de issues, jerarquías de docs, esquemas de BD) para ver qué hay sin llamadas exploratorias.',
      },
      {
        en: 'Describe MCP tools\' capabilities and outputs in detail, or the agent may prefer a built-in tool like `Grep` over the more capable MCP tool.',
        es: 'Describe con detalle qué hacen y qué devuelven tus herramientas MCP; si no, el agente puede preferir una integrada como `Grep` a la herramienta MCP, más capaz.',
      },
      {
        en: 'Prefer existing community MCP servers for standard integrations like Jira. Build custom servers only for team-specific workflows.',
        es: 'Para integraciones estándar como Jira, usa servidores MCP de la comunidad. Reserva los servidores propios para flujos específicos de tu equipo.',
      },
    ],
    traps: [
      {
        en: 'Don\'t hardcode tokens in `.mcp.json`. It is shared with the team; reference them with environment variable expansion like `${GITHUB_TOKEN}`.',
        es: 'No escribas tokens a mano en `.mcp.json`. Se comparte con el equipo; referéncialos con expansión de variables de entorno, como `${GITHUB_TOKEN}`.',
      },
      {
        en: 'Don\'t put a personal or experimental server in the project `.mcp.json`, where it reaches the whole team. Use `~/.claude.json`.',
        es: 'No metas un servidor personal o experimental en el `.mcp.json` del proyecto, donde le llega a todo el equipo. Usa `~/.claude.json`.',
      },
      {
        en: 'Don\'t build a custom MCP server for a standard integration like Jira when a community server already exists.',
        es: 'No construyas un servidor MCP propio para una integración estándar como Jira si ya existe uno de la comunidad.',
      },
      {
        en: 'Don\'t make the agent run many exploratory tool calls just to learn what data exists. Expose the catalog as an MCP resource instead.',
        es: 'No obligues al agente a hacer muchas llamadas exploratorias solo para saber qué datos hay. Expón el catálogo como MCP resource.',
      },
    ],
    example: {
      en: 'Your team needs a GitHub MCP server for everyone, and you want to try an experimental server just for yourself. Add the GitHub server to the project `.mcp.json` using `${GITHUB_TOKEN}` for auth, and add the experimental one to your `~/.claude.json`. The tools of both servers are available in the same session.',
      es: 'Tu equipo necesita un servidor MCP de GitHub para todos, y tú quieres probar otro experimental solo para ti. Añade el de GitHub al `.mcp.json` del proyecto con `${GITHUB_TOKEN}` para la autenticación, y el experimental a tu `~/.claude.json`. Las herramientas de ambos estarán disponibles en la misma sesión.',
    },
  },
  {
    ts: '2.5',
    title: {
      en: 'Using the built-in tools well',
      es: 'Usar bien las herramientas integradas',
    },
    tldr: {
      en: '`Grep` searches file contents, `Glob` finds files by path pattern, `Edit` changes a unique text match, and `Read` + `Write` handle whole files. Explore step by step.',
      es: '`Grep` busca en el contenido, `Glob` encuentra ficheros por patrón de ruta, `Edit` cambia un texto único y `Read` + `Write` trabajan con el fichero entero. Explora paso a paso.',
    },
    ideas: [
      {
        en: '`Grep` searches inside files for patterns: function names, callers, error messages, import statements.',
        es: '`Grep` busca patrones dentro de los ficheros: nombres de funciones, llamadas, mensajes de error, sentencias import.',
      },
      {
        en: '`Glob` matches file paths by name or extension, e.g. `**/*.test.tsx` to find every test file. It does not look inside files.',
        es: '`Glob` encuentra rutas de ficheros por nombre o extensión, p. ej. `**/*.test.tsx` para todos los tests. No mira dentro de los ficheros.',
      },
      {
        en: '`Read` and `Write` work on whole files. `Edit` makes targeted changes by matching a unique piece of text in the file.',
        es: '`Read` y `Write` trabajan con ficheros completos. `Edit` hace cambios puntuales localizando un fragmento de texto único en el fichero.',
      },
      {
        en: 'If `Edit` fails because its anchor text is not unique, fall back to `Read` the full file, then `Write` the modified version.',
        es: 'Si `Edit` falla porque el texto ancla no es único, recurre a `Read` del fichero completo y después a `Write` con la versión modificada.',
      },
      {
        en: 'Build understanding incrementally: `Grep` to find entry points, then `Read` to follow imports and trace the flow. Don\'t load every file upfront.',
        es: 'Entiende el código poco a poco: `Grep` para encontrar puntos de entrada y luego `Read` para seguir imports y el flujo. No cargues todos los ficheros de golpe.',
      },
      {
        en: 'To trace usage through wrapper modules, first list every exported name, then `Grep` for each name across the codebase.',
        es: 'Para seguir el uso a través de módulos envoltorio, primero identifica todos los nombres exportados y luego busca cada uno con `Grep` en todo el código.',
      },
    ],
    traps: [
      {
        en: 'Don\'t use `Glob` to find where a function is called. `Glob` matches file paths, not contents; use `Grep`.',
        es: 'No uses `Glob` para encontrar dónde se llama a una función. `Glob` compara rutas, no contenido; usa `Grep`.',
      },
      {
        en: 'Don\'t use `Grep` to list files by a name pattern like `**/*.test.tsx`. That is a path match, which is the job of `Glob`.',
        es: 'No uses `Grep` para listar ficheros por un patrón de nombre como `**/*.test.tsx`. Eso es buscar rutas, y es tarea de `Glob`.',
      },
      {
        en: 'Don\'t keep retrying `Edit` when the anchor text appears several times. Switch to `Read` + `Write` for a reliable change.',
        es: 'No sigas reintentando `Edit` cuando el texto ancla aparece varias veces. Pasa a `Read` + `Write` para un cambio fiable.',
      },
      {
        en: 'Don\'t read the whole codebase upfront to understand it. Search first, then read only the files the trail leads to.',
        es: 'No leas todo el código de entrada para entenderlo. Busca primero y lee solo los ficheros a los que te lleve la pista.',
      },
    ],
    example: {
      en: 'You must find every caller of `formatPrice` in an unfamiliar repo, but a wrapper module re-exports it under other names. First identify all the names the wrapper exports, then `Grep` for each one across the codebase, and `Read` only the matching files to trace the flow.',
      es: 'Tienes que encontrar todas las llamadas a `formatPrice` en un repo que no conoces, pero un módulo envoltorio lo reexporta con otros nombres. Primero identifica todos los nombres que exporta el envoltorio, luego busca cada uno con `Grep` en todo el código y usa `Read` solo en los ficheros que coincidan para trazar el flujo.',
    },
  },
  {
    ts: '3.1',
    title: {
      en: 'CLAUDE.md hierarchy, scope and modular files',
      es: 'Jerarquía de CLAUDE.md, alcance y ficheros modulares',
    },
    tldr: {
      en: '`CLAUDE.md` exists at user, project and directory level. Team rules belong at project level; keep the file modular with `@import` and `.claude/rules/`.',
      es: '`CLAUDE.md` existe a nivel de usuario, proyecto y directorio. Las reglas del equipo van a nivel de proyecto; mantenlo modular con `@import` y `.claude/rules/`.',
    },
    ideas: [
      {
        en: 'User level is `~/.claude/CLAUDE.md`. It applies only to you and is not shared with teammates through version control.',
        es: 'El nivel de usuario es `~/.claude/CLAUDE.md`. Solo se aplica a ti y no se comparte con el equipo a través del control de versiones.',
      },
      {
        en: 'Project level is `.claude/CLAUDE.md` or a root `CLAUDE.md`. It lives in the repo, so everyone who clones it gets the same instructions.',
        es: 'El nivel de proyecto es `.claude/CLAUDE.md` o un `CLAUDE.md` en la raíz. Vive en el repo, así que todo el que lo clona recibe las mismas instrucciones.',
      },
      {
        en: 'Directory level is a `CLAUDE.md` inside a subdirectory. It adds instructions for the code in that part of the tree.',
        es: 'El nivel de directorio es un `CLAUDE.md` dentro de un subdirectorio. Añade instrucciones para el código de esa parte del árbol.',
      },
      {
        en: 'Use `@import` to pull in external standards files, so each package\'s `CLAUDE.md` includes only the standards relevant to it.',
        es: 'Usa `@import` para traer ficheros de estándares externos, de modo que el `CLAUDE.md` de cada paquete incluya solo los que le aplican.',
      },
      {
        en: 'Split a large `CLAUDE.md` into topic files in `.claude/rules/`, such as `testing.md`, `api-conventions.md` and `deployment.md`.',
        es: 'Divide un `CLAUDE.md` enorme en ficheros por tema dentro de `.claude/rules/`, como `testing.md`, `api-conventions.md` y `deployment.md`.',
      },
      {
        en: 'Run `/memory` to see which memory files are actually loaded when behavior is inconsistent across sessions or teammates.',
        es: 'Ejecuta `/memory` para ver qué ficheros de memoria están cargados de verdad cuando el comportamiento cambia entre sesiones o compañeros.',
      },
    ],
    traps: [
      {
        en: 'Do not put team standards in `~/.claude/CLAUDE.md`: they stay on your machine, so a new teammate never receives them.',
        es: 'No pongas estándares del equipo en `~/.claude/CLAUDE.md`: se quedan en tu máquina y un compañero nuevo nunca los recibe.',
      },
      {
        en: 'Do not keep growing one monolithic `CLAUDE.md`; it becomes hard to maintain. Split it by topic into `.claude/rules/` or use `@import`.',
        es: 'No sigas engordando un `CLAUDE.md` monolítico; se vuelve difícil de mantener. Divídelo por temas en `.claude/rules/` o usa `@import`.',
      },
      {
        en: 'Do not guess why instructions are ignored. Check with `/memory` which files are loaded before you rewrite their content.',
        es: 'No adivines por qué se ignoran las instrucciones. Comprueba con `/memory` qué ficheros se cargan antes de reescribir su contenido.',
      },
    ],
    example: {
      en: 'A new developer says Claude ignores the team\'s naming conventions, but it follows them for you. `/memory` shows the conventions live in your `~/.claude/CLAUDE.md`, which is never committed. Move them into the project-level `CLAUDE.md` (or a file in `.claude/rules/`) so everyone gets them through version control.',
      es: 'Una desarrolladora nueva dice que Claude ignora las convenciones de nombres del equipo, pero contigo las sigue. Con `/memory` ves que están en tu `~/.claude/CLAUDE.md`, que nunca se sube al repo. Muévelas al `CLAUDE.md` del proyecto (o a un fichero de `.claude/rules/`) para que todos las reciban por control de versiones.',
    },
  },
  {
    ts: '3.2',
    title: {
      en: 'Custom slash commands and skills',
      es: 'Slash commands y skills personalizados',
    },
    tldr: {
      en: 'Commands and skills under `.claude/` are shared with the team; those under `~/.claude/` are personal. Skills run on demand and are set up with `SKILL.md` frontmatter.',
      es: 'Los commands y skills bajo `.claude/` se comparten con el equipo; los de `~/.claude/` son personales. Los skills se invocan bajo demanda y se configuran con el frontmatter de `SKILL.md`.',
    },
    ideas: [
      {
        en: '`.claude/commands/` holds project commands shared through version control; `~/.claude/commands/` holds personal commands only you can use.',
        es: '`.claude/commands/` guarda commands del proyecto compartidos por control de versiones; `~/.claude/commands/` guarda commands personales solo para ti.',
      },
      {
        en: 'Skills live in `.claude/skills/` with a `SKILL.md` file whose frontmatter supports `context: fork`, `allowed-tools` and `argument-hint`.',
        es: 'Los skills viven en `.claude/skills/` con un fichero `SKILL.md` cuyo frontmatter admite `context: fork`, `allowed-tools` y `argument-hint`.',
      },
      {
        en: '`context: fork` runs the skill in an isolated sub-agent context, so verbose output or brainstorming does not pollute the main conversation.',
        es: '`context: fork` ejecuta el skill en un contexto de sub-agente aislado, así su salida extensa o su lluvia de ideas no ensucia la conversación principal.',
      },
      {
        en: '`allowed-tools` restricts which tools the skill may use while it runs, for example only file writes, to prevent destructive actions.',
        es: '`allowed-tools` limita las herramientas que puede usar el skill mientras se ejecuta, por ejemplo solo escribir ficheros, para evitar acciones destructivas.',
      },
      {
        en: '`argument-hint` prompts the developer for the required parameters when they invoke the skill without arguments.',
        es: '`argument-hint` pide al desarrollador los parámetros necesarios cuando invoca el skill sin argumentos.',
      },
      {
        en: 'Skills are invoked on demand for task-specific workflows; `CLAUDE.md` is always loaded and holds universal standards.',
        es: 'Los skills se invocan bajo demanda para flujos de una tarea concreta; `CLAUDE.md` se carga siempre y contiene los estándares universales.',
      },
    ],
    traps: [
      {
        en: 'Do not put a team command in `~/.claude/commands/`: it is personal, so teammates will not get it when they clone or pull.',
        es: 'No pongas un command del equipo en `~/.claude/commands/`: es personal, así que tus compañeros no lo recibirán al hacer clone o pull.',
      },
      {
        en: 'Do not define commands in `CLAUDE.md` or in an invented config file; `CLAUDE.md` is for instructions and context, not command definitions.',
        es: 'No definas commands en `CLAUDE.md` ni en un fichero de configuración inventado; `CLAUDE.md` es para instrucciones y contexto, no para commands.',
      },
      {
        en: 'Do not edit a shared project skill to suit your own taste; create a personal variant in `~/.claude/skills/` with a different name.',
        es: 'No modifiques un skill compartido del proyecto a tu gusto; crea una variante personal en `~/.claude/skills/` con otro nombre.',
      },
      {
        en: 'Do not put task-specific workflows in `CLAUDE.md`, where they load in every session. Make them skills that run on demand.',
        es: 'No metas flujos de una tarea concreta en `CLAUDE.md`, donde se cargan en cada sesión. Conviértelos en skills que se invocan bajo demanda.',
      },
    ],
    example: {
      en: 'Your team wants a codebase-analysis skill that prints pages of findings and must never delete files. Create it in `.claude/skills/` with `context: fork` so the verbose output stays out of the main session, `allowed-tools` limited to the tools it needs, and an `argument-hint` that asks for the module to analyze.',
      es: 'Tu equipo quiere un skill de análisis del código que suelta páginas de hallazgos y nunca debe borrar ficheros. Créalo en `.claude/skills/` con `context: fork` para que la salida extensa no entre en la sesión principal, `allowed-tools` limitado a las herramientas que necesita y un `argument-hint` que pida el módulo a analizar.',
    },
  },
  {
    ts: '3.3',
    title: {
      en: 'Path-specific rules with glob patterns',
      es: 'Reglas por ruta con patrones glob',
    },
    tldr: {
      en: 'A `.claude/rules/` file with a `paths` glob in its YAML frontmatter loads only when Claude edits matching files, so a convention follows a file type anywhere in the repo.',
      es: 'Un fichero de `.claude/rules/` con un glob `paths` en su frontmatter YAML solo se carga al editar ficheros que coinciden, así una convención sigue a un tipo de fichero en todo el repo.',
    },
    ideas: [
      {
        en: 'Give a rule file YAML frontmatter with a `paths` field of glob patterns, e.g. `paths: ["terraform/**/*"]`, to activate it conditionally.',
        es: 'Pon en un fichero de reglas frontmatter YAML con un campo `paths` de patrones glob, p. ej. `paths: ["terraform/**/*"]`, para activarlo según la ruta.',
      },
      {
        en: 'A path-scoped rule loads only when you edit a matching file, which cuts irrelevant context and token usage.',
        es: 'Una regla con alcance por ruta solo se carga al editar un fichero que coincide, lo que reduce el contexto irrelevante y el uso de tokens.',
      },
      {
        en: 'Globs match by file type regardless of folder: `**/*.test.tsx` covers every test file wherever it lives.',
        es: 'Los globs filtran por tipo de fichero sin importar la carpeta: `**/*.test.tsx` cubre todos los tests, estén donde estén.',
      },
      {
        en: 'A subdirectory `CLAUDE.md` is bound to one directory; glob rules handle conventions that span many directories.',
        es: 'Un `CLAUDE.md` de subdirectorio está atado a un directorio; las reglas con glob cubren convenciones repartidas por muchos directorios.',
      },
      {
        en: 'Path rules apply automatically by matching file paths: nobody has to invoke them and Claude does not have to guess which section applies.',
        es: 'Las reglas por ruta se aplican solas al coincidir la ruta del fichero: nadie tiene que invocarlas y Claude no tiene que adivinar qué sección aplica.',
      },
    ],
    traps: [
      {
        en: 'Do not drop a `CLAUDE.md` into every folder for test conventions when test files sit next to their code all over the repo.',
        es: 'No pongas un `CLAUDE.md` en cada carpeta para las convenciones de tests cuando los tests están junto a su código por todo el repo.',
      },
      {
        en: 'Do not stack every area\'s conventions under headers in the root `CLAUDE.md` and hope Claude infers which applies; that is unreliable.',
        es: 'No amontones las convenciones de cada área bajo encabezados en el `CLAUDE.md` raíz esperando que Claude deduzca cuál aplica; no es fiable.',
      },
      {
        en: 'Do not use skills for conventions that must apply automatically: skills need invocation, while path rules load on matching files.',
        es: 'No uses skills para convenciones que deben aplicarse solas: los skills hay que invocarlos, y las reglas por ruta se cargan al coincidir el fichero.',
      },
    ],
    example: {
      en: 'Test files like `Button.test.tsx` sit next to their components all over the repo, and every test must follow the same conventions. Create `.claude/rules/testing.md` with the frontmatter `paths: ["**/*.test.tsx"]`. The rule loads only when Claude edits a test file, wherever it lives.',
      es: 'Ficheros como `Button.test.tsx` están junto a sus componentes por todo el repo y todos los tests deben seguir las mismas convenciones. Crea `.claude/rules/testing.md` con el frontmatter `paths: ["**/*.test.tsx"]`. La regla solo se carga cuando Claude edita un test, esté donde esté.',
    },
  },
  {
    ts: '3.4',
    title: {
      en: 'Plan mode vs direct execution',
      es: 'Plan mode frente a ejecución directa',
    },
    tldr: {
      en: 'Use plan mode for large, multi-file or architectural work with several valid approaches; use direct execution for simple, well-scoped changes. You can plan first, then execute.',
      es: 'Usa plan mode para trabajo grande, multi-fichero o de arquitectura con varios enfoques válidos, y ejecución directa para cambios simples y acotados. Puedes planificar y luego ejecutar.',
    },
    ideas: [
      {
        en: 'Plan mode fits large-scale changes, multiple valid approaches, architectural decisions and modifications across many files.',
        es: 'Plan mode encaja con cambios a gran escala, varios enfoques válidos, decisiones de arquitectura y modificaciones en muchos ficheros.',
      },
      {
        en: 'Plan mode lets Claude explore the codebase and design safely before committing to changes, which prevents costly rework.',
        es: 'Plan mode permite a Claude explorar el código y diseñar con seguridad antes de comprometerse con cambios, lo que evita retrabajo caro.',
      },
      {
        en: 'Direct execution fits clear, well-scoped changes: a single-file bug fix with a clear stack trace, or adding a date validation check.',
        es: 'La ejecución directa encaja con cambios claros y acotados: un bug en un solo fichero con un stack trace claro o añadir una validación de fecha.',
      },
      {
        en: 'The Explore subagent isolates verbose discovery output and returns a summary, preserving the main conversation\'s context window.',
        es: 'El subagente Explore aísla la salida extensa de la fase de descubrimiento y devuelve un resumen, preservando la ventana de contexto principal.',
      },
      {
        en: 'Combine both: investigate and plan in plan mode (e.g. a library migration), then implement the agreed plan with direct execution.',
        es: 'Combina ambos: investiga y planifica en plan mode (p. ej. una migración de librería) y luego implementa el plan acordado con ejecución directa.',
      },
    ],
    traps: [
      {
        en: 'Do not start a task you already know is complex in direct execution, planning to switch only if trouble appears; the complexity is already stated.',
        es: 'No empieces en ejecución directa una tarea que ya sabes compleja, pensando en cambiar solo si hay problemas; la complejidad ya está clara.',
      },
      {
        en: 'Do not let the implementation reveal the architecture; finding dependencies late in a multi-file change causes costly rework.',
        es: 'No dejes que la implementación vaya revelando la arquitectura; descubrir dependencias tarde en un cambio multi-fichero provoca retrabajo caro.',
      },
      {
        en: 'Do not use plan mode for a small, well-understood fix with a clear scope; direct execution is the right fit there.',
        es: 'No uses plan mode para un arreglo pequeño, bien entendido y con alcance claro; ahí lo adecuado es la ejecución directa.',
      },
      {
        en: 'Do not run long discovery phases in the main session; delegate them to the Explore subagent so the context window is not exhausted.',
        es: 'No hagas fases largas de descubrimiento en la sesión principal; delégalas en el subagente Explore para no agotar la ventana de contexto.',
      },
    ],
    example: {
      en: 'You must migrate a library used in 45+ files, and there are two integration approaches with different infrastructure needs. Enter plan mode, use the Explore subagent for the verbose discovery so the main context stays clean, compare the approaches and agree a plan. Then switch to direct execution to implement it.',
      es: 'Tienes que migrar una librería usada en más de 45 ficheros y hay dos enfoques de integración con distintas necesidades de infraestructura. Entra en plan mode, usa el subagente Explore para el descubrimiento extenso y así mantener limpio el contexto principal, compara enfoques y acuerda un plan. Después pasa a ejecución directa para implementarlo.',
    },
  },
  {
    ts: '3.5',
    title: {
      en: 'Iterative refinement techniques',
      es: 'Técnicas de refinamiento iterativo',
    },
    tldr: {
      en: 'When prose is not enough, show 2-3 input/output examples, write tests first and share failures, let Claude interview you, and send interacting issues together.',
      es: 'Cuando la prosa no basta, enseña 2-3 ejemplos de entrada/salida, escribe los tests primero y comparte los fallos, deja que Claude te entreviste y envía juntos los problemas que interactúan.',
    },
    ideas: [
      {
        en: 'If prose descriptions are interpreted inconsistently, give 2-3 concrete input/output examples of the expected transformation.',
        es: 'Si las descripciones en prosa se interpretan de forma inconsistente, da 2-3 ejemplos concretos de entrada/salida de la transformación esperada.',
      },
      {
        en: 'Test-driven iteration: first write tests for expected behavior, edge cases and performance, then iterate by sharing the failures.',
        es: 'Iteración guiada por tests: escribe primero tests de comportamiento esperado, casos límite y rendimiento, y luego itera compartiendo los fallos.',
      },
      {
        en: 'Interview pattern: let Claude question you first to surface issues like cache invalidation or failure modes in unfamiliar domains.',
        es: 'Patrón entrevista: deja que Claude te pregunte primero para sacar a la luz temas como la invalidación de caché o los modos de fallo en dominios nuevos.',
      },
      {
        en: 'To fix an edge case, give a specific test case with example input and expected output, e.g. null values in a migration script.',
        es: 'Para arreglar un caso límite, da un caso de prueba concreto con entrada de ejemplo y salida esperada, p. ej. valores null en un script de migración.',
      },
      {
        en: 'Interacting problems go together in one detailed message; independent problems can be fixed one at a time.',
        es: 'Los problemas que interactúan van juntos en un único mensaje detallado; los independientes se pueden arreglar de uno en uno.',
      },
    ],
    traps: [
      {
        en: 'Do not keep rewording a prose description that Claude keeps reading differently; switch to concrete input/output examples.',
        es: 'No sigas reformulando una descripción en prosa que Claude interpreta cada vez de una forma; pasa a ejemplos concretos de entrada/salida.',
      },
      {
        en: 'Do not fix interacting issues one by one: their fixes affect each other. Describe them together in one detailed message.',
        es: 'No arregles de uno en uno problemas que interactúan: sus arreglos se afectan entre sí. Descríbelos juntos en un mensaje detallado.',
      },
      {
        en: 'Do not jump straight into implementation in an unfamiliar domain; use the interview pattern to surface what you have not considered.',
        es: 'No te lances a implementar en un dominio que no conoces; usa el patrón entrevista para descubrir lo que no habías tenido en cuenta.',
      },
    ],
    example: {
      en: 'Your date-normalizing function keeps producing mixed formats, even though you described the format in detail. Stop rewording: give 2-3 concrete input/output pairs, write tests for the edge cases (empty and null dates), and share the failing test output with Claude after each iteration until the suite passes.',
      es: 'Tu función que normaliza fechas sigue dando formatos mezclados aunque describiste el formato al detalle. Deja de reformular: da 2-3 pares concretos de entrada/salida, escribe tests para los casos límite (fechas vacías y null) y comparte con Claude la salida de los tests que fallan tras cada iteración hasta que pase la suite.',
    },
  },
  {
    ts: '3.6',
    title: {
      en: 'Claude Code in CI/CD pipelines',
      es: 'Claude Code en pipelines de CI/CD',
    },
    tldr: {
      en: 'In CI, run Claude Code with `-p` so it never waits for input, use `--output-format json` with `--json-schema` for parseable results, and give project context via `CLAUDE.md`.',
      es: 'En CI, ejecuta Claude Code con `-p` para que nunca espere entrada, usa `--output-format json` con `--json-schema` para resultados parseables y da el contexto del proyecto con `CLAUDE.md`.',
    },
    ideas: [
      {
        en: '`-p` (or `--print`) runs Claude Code non-interactively: it processes the prompt, prints to stdout and exits, so the job does not hang.',
        es: '`-p` (o `--print`) ejecuta Claude Code en modo no interactivo: procesa el prompt, escribe en stdout y termina, así el job no se cuelga.',
      },
      {
        en: '`--output-format json` with `--json-schema` gives machine-parseable structured findings you can post automatically as inline PR comments.',
        es: '`--output-format json` con `--json-schema` da hallazgos estructurados y parseables que puedes publicar solos como comentarios inline en la PR.',
      },
      {
        en: '`CLAUDE.md` gives CI-invoked Claude Code its project context: testing standards, fixture conventions and review criteria.',
        es: '`CLAUDE.md` da a Claude Code en CI el contexto del proyecto: estándares de testing, convenciones de fixtures y criterios de revisión.',
      },
      {
        en: 'The session that generated code is less effective at reviewing it; use an independent review instance instead of self-review.',
        es: 'La sesión que generó el código es menos eficaz revisándolo; usa una instancia de revisión independiente en lugar de la autorrevisión.',
      },
      {
        en: 'When re-reviewing after new commits, include the prior findings and ask only for new or still-unaddressed issues to avoid duplicates.',
        es: 'Al revisar de nuevo tras más commits, incluye los hallazgos anteriores y pide solo problemas nuevos o aún sin resolver para no duplicar.',
      },
      {
        en: 'Provide the existing test files in context so generated tests do not repeat scenarios the suite already covers.',
        es: 'Pasa los ficheros de test existentes en el contexto para que los tests generados no repitan escenarios que la suite ya cubre.',
      },
    ],
    traps: [
      {
        en: 'Do not fix a hanging CI job with stdin redirection or made-up options like a `CLAUDE_HEADLESS` variable or a `--batch` flag; use `-p`.',
        es: 'No arregles un job de CI colgado redirigiendo stdin ni con opciones inventadas como una variable `CLAUDE_HEADLESS` o un flag `--batch`; usa `-p`.',
      },
      {
        en: 'Do not ask the same session that wrote the code to review it; an independent review instance catches more.',
        es: 'No pidas a la misma sesión que escribió el código que lo revise; una instancia de revisión independiente detecta más.',
      },
      {
        en: 'Do not re-run a review without the previous findings in context; Claude will repost issues already reported as duplicate comments.',
        es: 'No repitas una revisión sin los hallazgos anteriores en el contexto; Claude volverá a publicar problemas ya reportados como comentarios duplicados.',
      },
      {
        en: 'Do not parse free-form prose output in CI; enforce structure with `--output-format json` and `--json-schema`.',
        es: 'No parsees en CI una salida en prosa libre; impón la estructura con `--output-format json` y `--json-schema`.',
      },
    ],
    example: {
      en: 'Your PR review job hangs, and once fixed its comments repeat on every push. Run `claude -p` with `--output-format json` and `--json-schema` so findings can be posted as inline comments, keep review criteria in `CLAUDE.md`, and pass the previous findings so Claude reports only new or still-unaddressed issues.',
      es: 'Tu job de revisión de PR se cuelga y, una vez arreglado, sus comentarios se repiten en cada push. Ejecuta `claude -p` con `--output-format json` y `--json-schema` para publicar los hallazgos como comentarios inline, deja los criterios de revisión en `CLAUDE.md` y pasa los hallazgos anteriores para que Claude informe solo de problemas nuevos o sin resolver.',
    },
  },
  {
    ts: '4.1',
    title: {
      en: 'Explicit criteria to cut false positives',
      es: 'Criterios explícitos para reducir falsos positivos',
    },
    tldr: {
      en: 'Precision comes from specific, categorical criteria that say what to report and what to skip, not from vague advice like "be conservative" or "only high-confidence findings".',
      es: 'La precisión sale de criterios concretos y por categorías que dicen qué reportar y qué ignorar, no de consejos vagos como "be conservative" o "solo hallazgos de alta confianza".',
    },
    ideas: [
      {
        en: 'Make criteria testable: "flag a comment only if its claimed behavior contradicts the code" beats "check that comments are accurate".',
        es: 'Haz criterios comprobables: "marca un comentario solo si lo que dice contradice al código" es mejor que "revisa que los comentarios sean correctos".',
      },
      {
        en: 'Say which issue types to report (bugs, security) and which to skip (minor style, local patterns) instead of filtering by confidence.',
        es: 'Define qué tipos de problema reportar (bugs, seguridad) y cuáles ignorar (estilo menor, patrones locales) en vez de filtrar por confianza.',
      },
      {
        en: 'Generic instructions like "be conservative" or "only report high-confidence findings" do not raise precision; specific categories do.',
        es: 'Instrucciones genéricas como "be conservative" o "reporta solo hallazgos de alta confianza" no mejoran la precisión; las categorías concretas sí.',
      },
      {
        en: 'False positives cost trust: one noisy category makes developers doubt the accurate categories too.',
        es: 'Los falsos positivos destruyen la confianza: una categoría ruidosa hace que los desarrolladores duden también de las que aciertan.',
      },
      {
        en: 'Define each severity level with concrete code examples so findings are classified the same way every time.',
        es: 'Define cada nivel de severidad con ejemplos de código concretos para que los hallazgos se clasifiquen siempre igual.',
      },
      {
        en: 'While you improve the prompt for a high false-positive category, disable that category temporarily to restore developer trust.',
        es: 'Mientras mejoras el prompt de una categoría con muchos falsos positivos, desactívala temporalmente para recuperar la confianza de los devs.',
      },
    ],
    traps: [
      {
        en: 'Do not answer a precision problem with "be conservative" or "only high-confidence findings"; they stay vague and do not cut false positives.',
        es: 'No respondas a un problema de precisión con "be conservative" o "solo alta confianza"; siguen siendo vagos y no reducen los falsos positivos.',
      },
      {
        en: 'Do not keep a noisy category running while you tune it; its false positives drag down trust in every other category.',
        es: 'No mantengas activa una categoría ruidosa mientras la ajustas; sus falsos positivos arrastran la confianza en todas las demás.',
      },
      {
        en: 'Do not define severity with adjectives only ("critical", "minor"); without concrete code examples per level, classification drifts.',
        es: 'No definas la severidad solo con adjetivos ("critical", "minor"); sin ejemplos de código por nivel, la clasificación se vuelve inconsistente.',
      },
    ],
    example: {
      en: 'Your PR reviewer flags many style nits and stale-comment warnings, and developers start ignoring all of its output, even real bugs. Rewrite the prompt to report only bugs and security issues, list what to skip (minor style, local patterns) and add code examples per severity level. Disable the comment-accuracy category until its criteria are fixed.',
      es: 'Tu revisor de PRs marca muchos detalles de estilo y comentarios desactualizados, y los devs empiezan a ignorarlo todo, incluso los bugs reales. Reescribe el prompt para reportar solo bugs y problemas de seguridad, lista lo que debe ignorar (estilo menor, patrones locales) y añade ejemplos de código por nivel de severidad. Desactiva la categoría de comentarios hasta corregir sus criterios.',
    },
  },
  {
    ts: '4.2',
    title: {
      en: 'Few-shot examples for consistent output',
      es: 'Ejemplos few-shot para una salida consistente',
    },
    tldr: {
      en: 'When detailed instructions still give inconsistent results, 2-4 targeted few-shot examples are the most effective fix for output format, ambiguous cases and extraction quality.',
      es: 'Cuando las instrucciones detalladas siguen dando resultados inconsistentes, 2-4 ejemplos few-shot bien elegidos son lo más eficaz para el formato, los casos ambiguos y la extracción.',
    },
    ideas: [
      {
        en: 'Few-shot examples are the most effective way to get consistently formatted, actionable output when instructions alone are not enough.',
        es: 'Los ejemplos few-shot son la forma más eficaz de lograr una salida accionable y con formato consistente cuando las instrucciones no bastan.',
      },
      {
        en: 'Target ambiguous cases with 2-4 examples that show why one action was chosen over plausible alternatives, not just the answer.',
        es: 'Apunta a los casos ambiguos con 2-4 ejemplos que muestren por qué se eligió una acción frente a alternativas plausibles, no solo la respuesta.',
      },
      {
        en: 'Show the exact output format you want, e.g. location, issue, severity and suggested fix, so every finding looks the same.',
        es: 'Muestra el formato exacto que quieres, p. ej. ubicación, problema, severidad y corrección sugerida, para que todos los hallazgos salgan iguales.',
      },
      {
        en: 'Include examples that contrast acceptable code patterns with genuine issues to reduce false positives.',
        es: 'Incluye ejemplos que contrasten patrones de código aceptables con problemas reales para reducir los falsos positivos.',
      },
      {
        en: 'Good examples teach judgment: the model generalizes to novel patterns instead of only matching the cases you listed.',
        es: 'Los buenos ejemplos enseñan criterio: el modelo generaliza a patrones nuevos en vez de limitarse a los casos que listaste.',
      },
      {
        en: 'In extraction, examples over varied document formats reduce hallucination and fix required fields coming back empty or null.',
        es: 'En extracción, ejemplos con formatos de documento variados reducen las alucinaciones y evitan campos obligatorios vacíos o null.',
      },
    ],
    traps: [
      {
        en: 'Do not keep adding more detailed instructions when output stays inconsistent; show the desired output with examples instead.',
        es: 'No sigas añadiendo instrucciones más detalladas si la salida sigue siendo inconsistente; muestra la salida deseada con ejemplos.',
      },
      {
        en: 'Do not show only the answer in ambiguous examples; without the reasoning, the model copies surface patterns and cannot generalize.',
        es: 'No muestres solo la respuesta en los ejemplos ambiguos; sin el razonamiento, el modelo copia patrones superficiales y no generaliza.',
      },
      {
        en: 'Do not use only clean, uniform documents as examples; varied formats (inline citations vs bibliographies) are what fix extraction gaps.',
        es: 'No uses solo documentos limpios y uniformes como ejemplo; los formatos variados (citas en línea vs bibliografías) son los que corrigen los huecos.',
      },
      {
        en: 'Do not rely on few-shot examples for rules that must always hold, like identity checks before refunds; prompts are probabilistic, enforce those in code.',
        es: 'No confíes en few-shot para reglas que deben cumplirse siempre, como verificar identidad antes de reembolsar; el prompt es probabilístico, imponlas en código.',
      },
    ],
    example: {
      en: 'A paper-extraction pipeline often returns null for the citations field when a paper uses a bibliography instead of inline citations. Add few-shot examples that extract citations from each layout (inline, bibliography) and from a methodology section vs details embedded in the text. The model then also handles new structures you did not show it.',
      es: 'Un pipeline que extrae datos de papers devuelve a menudo null en el campo de citas cuando el paper usa bibliografía en vez de citas en línea. Añade ejemplos few-shot que extraigan las citas de cada formato (en línea, bibliografía) y de una sección de metodología frente a detalles repartidos por el texto. Así el modelo maneja también estructuras nuevas que no le enseñaste.',
    },
  },
  {
    ts: '4.3',
    title: {
      en: 'Structured output with tool use and JSON schemas',
      es: 'Salida estructurada con tool use y JSON schemas',
    },
    tldr: {
      en: 'Define an extraction tool with a JSON schema as its input and read the data from the `tool_use` block. This removes syntax errors; good schema design prevents fabricated values.',
      es: 'Define una herramienta de extracción con un JSON schema como input y lee los datos del bloque `tool_use`. Así eliminas los errores de sintaxis; un buen diseño del schema evita valores inventados.',
    },
    ideas: [
      {
        en: '`tool_use` with a JSON schema is the most reliable way to get schema-compliant output; it eliminates JSON syntax errors.',
        es: '`tool_use` con un JSON schema es la vía más fiable para obtener salida conforme al schema; elimina los errores de sintaxis JSON.',
      },
      {
        en: '`tool_choice` `"auto"` lets the model reply with text; `"any"` forces a call to some tool; a forced tool forces that specific named tool.',
        es: '`tool_choice` `"auto"` permite responder con texto; `"any"` obliga a llamar a alguna herramienta; forzar una herramienta obliga a usar esa en concreto.',
      },
      {
        en: 'Use `"any"` when several extraction schemas exist and the document type is unknown; force `extract_metadata` when it must run before enrichment.',
        es: 'Usa `"any"` si hay varios schemas de extracción y no sabes el tipo de documento; fuerza `extract_metadata` si debe ejecutarse antes del enriquecimiento.',
      },
      {
        en: 'Make fields optional (nullable) when the source may lack the data; a required field pushes the model to invent a value.',
        es: 'Haz los campos opcionales (nullable) si la fuente puede no tener el dato; un campo obligatorio empuja al modelo a inventarse un valor.',
      },
      {
        en: 'For categories, add `"other"` plus a detail string for extensibility and an `"unclear"` value for ambiguous cases.',
        es: 'En las categorías, añade `"other"` más un string de detalle para ampliarlas y un valor `"unclear"` para los casos ambiguos.',
      },
      {
        en: 'Put format normalization rules in the prompt next to the strict schema to handle inconsistently formatted source data.',
        es: 'Pon reglas de normalización de formato en el prompt junto al schema estricto para manejar fuentes con formatos inconsistentes.',
      },
    ],
    traps: [
      {
        en: 'Do not mark every field as required; if the document lacks the data, the model fabricates a value to satisfy the schema.',
        es: 'No marques todos los campos como obligatorios; si el documento no tiene el dato, el modelo se inventa un valor para cumplir el schema.',
      },
      {
        en: 'Do not leave `tool_choice` on `"auto"` when you need guaranteed structured output; the model may reply with plain text.',
        es: 'No dejes `tool_choice` en `"auto"` si necesitas salida estructurada garantizada; el modelo puede responder con texto plano.',
      },
      {
        en: 'Do not assume valid JSON means correct data; tool use removes syntax errors but not semantic ones like totals that do not add up.',
        es: 'No asumas que un JSON válido implica datos correctos; tool use elimina errores de sintaxis, no semánticos como totales que no cuadran.',
      },
      {
        en: 'Do not use a closed enum for categories that will grow; without `"other"` + detail, new cases get forced into a wrong value.',
        es: 'No uses un enum cerrado para categorías que crecerán; sin `"other"` + detalle, los casos nuevos acaban forzados en un valor incorrecto.',
      },
    ],
    example: {
      en: 'You extract data from a mix of invoices and contracts and do not know each file\'s type. Define one extraction tool per type with its JSON schema, set `tool_choice` to `"any"` and read the result from the `tool_use` block. Make fields that may be missing, like a due date, nullable so they come back as null instead of an invented date.',
      es: 'Extraes datos de una mezcla de facturas y contratos y no sabes el tipo de cada fichero. Define una herramienta de extracción por tipo con su JSON schema, pon `tool_choice` en `"any"` y lee el resultado del bloque `tool_use`. Haz nullable los campos que pueden faltar, como la fecha de vencimiento, para que vuelvan como null en vez de con una fecha inventada.',
    },
  },
  {
    ts: '4.4',
    title: {
      en: 'Validation, retries and feedback loops',
      es: 'Validación, reintentos y bucles de feedback',
    },
    tldr: {
      en: 'Validate each extraction, retry with the specific errors appended, and recognize when retrying is pointless because the information is not in the source.',
      es: 'Valida cada extracción, reintenta añadiendo los errores concretos y aprende a ver cuándo reintentar no sirve porque el dato no está en la fuente.',
    },
    ideas: [
      {
        en: 'Retry with error feedback: send the original document, the failed extraction and the specific validation errors so the model can fix itself.',
        es: 'Reintento con feedback: envía el documento original, la extracción fallida y los errores de validación concretos para que el modelo se corrija.',
      },
      {
        en: 'Retries fix format mismatches and structural output errors; they fail when data is absent, e.g. it is only in an external document not provided.',
        es: 'Los reintentos arreglan formatos que no encajan y errores de estructura; no sirven si falta el dato, p. ej. si solo está en un documento externo no aportado.',
      },
      {
        en: 'Semantic validation errors (values that do not sum, wrong field placement) survive tool use; schema syntax errors do not.',
        es: 'Los errores semánticos (valores que no suman, campos mal colocados) sobreviven a tool use; los errores de sintaxis del schema no.',
      },
      {
        en: 'Extract `calculated_total` next to `stated_total` to flag discrepancies, and add a `conflict_detected` boolean for inconsistent source data.',
        es: 'Extrae `calculated_total` junto a `stated_total` para detectar discrepancias y añade un booleano `conflict_detected` si la fuente es incoherente.',
      },
      {
        en: 'Add a `detected_pattern` field to each finding so you can analyze which code constructs trigger findings that developers dismiss.',
        es: 'Añade un campo `detected_pattern` a cada hallazgo para analizar qué construcciones de código generan los hallazgos que los devs descartan.',
      },
    ],
    traps: [
      {
        en: 'Do not retry blindly with the same prompt; without the specific validation errors, the model has nothing to correct against.',
        es: 'No reintentes a ciegas con el mismo prompt; sin los errores de validación concretos, el modelo no sabe qué corregir.',
      },
      {
        en: 'Do not keep retrying when the information is missing from the source; retries cannot create absent data.',
        es: 'No sigas reintentando si el dato falta en la fuente; los reintentos no pueden crear información que no existe.',
      },
      {
        en: 'Do not trust a total just because the output matched the schema; compare `calculated_total` with `stated_total`.',
        es: 'No te fíes de un total solo porque la salida cumple el schema; compara `calculated_total` con `stated_total`.',
      },
    ],
    example: {
      en: 'An invoice extraction fails validation: the line items add up to 940 but the stated total is 1,000. Send a follow-up with the original invoice, the failed output and that exact error. If the missing amount only appears in a referenced contract you did not include, stop retrying: set `conflict_detected` and send it to review.',
      es: 'Una extracción de factura falla la validación: las líneas suman 940 pero el total indicado es 1.000. Envía una petición de seguimiento con la factura original, la salida fallida y ese error exacto. Si el importe que falta solo aparece en un contrato referenciado que no incluiste, deja de reintentar: marca `conflict_detected` y pásalo a revisión.',
    },
  },
  {
    ts: '4.5',
    title: {
      en: 'Batch processing with the Message Batches API',
      es: 'Procesamiento por lotes con la Message Batches API',
    },
    tldr: {
      en: 'The Message Batches API is 50% cheaper but can take up to 24 hours with no latency SLA: use it for latency-tolerant jobs, never for blocking checks.',
      es: 'La Message Batches API es un 50% más barata pero puede tardar hasta 24 horas sin SLA de latencia: úsala para trabajos que toleran espera, nunca para checks bloqueantes.',
    },
    ideas: [
      {
        en: 'Batches: 50% cheaper, a processing window of up to 24 hours, and no guaranteed latency SLA.',
        es: 'Batches: un 50% más baratos, ventana de procesamiento de hasta 24 horas y sin SLA de latencia garantizado.',
      },
      {
        en: 'Good fit: overnight reports, weekly audits, nightly test generation. Bad fit: blocking work like pre-merge checks; use the synchronous API there.',
        es: 'Encaja: informes nocturnos, auditorías semanales, generación nocturna de tests. No encaja: trabajo bloqueante como checks pre-merge; ahí, API síncrona.',
      },
      {
        en: 'A batch request cannot do multi-turn tool calling: it cannot run tools mid-request and send the results back.',
        es: 'Una petición batch no admite tool calling multi-turno: no puede ejecutar herramientas a mitad de petición y devolver los resultados.',
      },
      {
        en: 'Give every request a `custom_id` to match each response to its request and to resubmit only the failed items.',
        es: 'Pon un `custom_id` en cada petición para emparejar cada respuesta con su petición y reenviar solo las que fallaron.',
      },
      {
        en: 'Set submission frequency from the SLA: with 24-hour processing and a 30-hour SLA, submit every 4 hours (4 + 24 = 28 hours worst case).',
        es: 'Ajusta la frecuencia de envío al SLA: con 24 h de procesamiento y un SLA de 30 h, envía cada 4 horas (4 + 24 = 28 h en el peor caso).',
      },
      {
        en: 'Refine the prompt on a small sample before batching large volumes, so first-pass success is high and resubmissions are few.',
        es: 'Afina el prompt con una muestra pequeña antes de procesar grandes volúmenes, para maximizar el acierto a la primera y reducir reenvíos.',
      },
    ],
    traps: [
      {
        en: 'Do not move a blocking pre-merge check to batches to save money; there is no latency guarantee and developers could wait up to 24 hours.',
        es: 'No pases un check pre-merge bloqueante a batches para ahorrar; no hay garantía de latencia y los devs podrían esperar hasta 24 horas.',
      },
      {
        en: 'Do not add polling or a timeout fallback to real-time to force batches into blocking work; match each workflow to the right API.',
        es: 'No añadas polling ni un fallback a tiempo real para forzar batches en trabajo bloqueante; asigna a cada flujo la API que le corresponde.',
      },
      {
        en: 'Do not resubmit the whole batch after partial failures; resend only failed items by `custom_id`, fixed (e.g. chunk docs over the context limit).',
        es: 'No reenvíes todo el batch tras fallos parciales; reenvía solo los fallidos por `custom_id`, corregidos (p. ej. troceando docs que excedían el contexto).',
      },
      {
        en: 'Do not reject batches over result-ordering worries; `custom_id` correlates each response with its request.',
        es: 'No descartes los batches por miedo al orden de los resultados; `custom_id` empareja cada respuesta con su petición.',
      },
    ],
    example: {
      en: 'Your team runs a blocking pre-merge review and a nightly tech-debt report, and wants to cut costs. Move only the nightly report to the Message Batches API (50% cheaper, results by morning) and keep the pre-merge check synchronous. When some batch items fail for exceeding the context limit, chunk those documents and resubmit only them by `custom_id`.',
      es: 'Tu equipo tiene una revisión pre-merge bloqueante y un informe nocturno de deuda técnica, y quiere ahorrar. Pasa solo el informe nocturno a la Message Batches API (50% más barata, resultados por la mañana) y deja el check pre-merge síncrono. Si algunos elementos fallan por exceder el límite de contexto, trocea esos documentos y reenvía solo esos por `custom_id`.',
    },
  },
  {
    ts: '4.6',
    title: {
      en: 'Multi-instance and multi-pass review',
      es: 'Revisión multi-instancia y multi-pasada',
    },
    tldr: {
      en: 'Review generated work with an independent instance that lacks the generator\'s reasoning, and split large reviews into per-file passes plus a cross-file integration pass.',
      es: 'Revisa el trabajo generado con una instancia independiente sin el razonamiento del generador, y divide las revisiones grandes en pasadas por fichero más una de integración.',
    },
    ideas: [
      {
        en: 'Self-review is weak: in the same session the model keeps its generation reasoning and is less likely to question its own decisions.',
        es: 'La autorrevisión es débil: en la misma sesión el modelo conserva su razonamiento de generación y cuestiona menos sus propias decisiones.',
      },
      {
        en: 'A second, independent Claude instance without that context catches subtle issues better than self-review prompts or extended thinking.',
        es: 'Una segunda instancia de Claude independiente, sin ese contexto, detecta problemas sutiles mejor que pedir autorrevisión o usar extended thinking.',
      },
      {
        en: 'Large multi-file reviews in one pass suffer attention dilution: uneven depth, missed bugs and contradictory findings.',
        es: 'Las revisiones de muchos ficheros en una sola pasada sufren dilución de atención: profundidad desigual, bugs perdidos y hallazgos contradictorios.',
      },
      {
        en: 'Multi-pass review: focused per-file passes for local issues, then a separate integration pass for cross-file data flow.',
        es: 'Revisión multi-pasada: pasadas centradas en cada fichero para problemas locales y luego una pasada de integración para el flujo de datos entre ficheros.',
      },
      {
        en: 'Add a verification pass where the model reports its confidence next to each finding, to route findings for calibrated review.',
        es: 'Añade una pasada de verificación en la que el modelo indique su confianza junto a cada hallazgo, para enrutar la revisión de forma calibrada.',
      },
    ],
    traps: [
      {
        en: 'Do not just ask the generator to "review your own code" or rely on extended thinking; it shares its own blind spots. Use an independent instance.',
        es: 'No te limites a pedir al generador que "revise su propio código" ni confíes en extended thinking; tiene sus mismos puntos ciegos. Usa otra instancia.',
      },
      {
        en: 'Do not fix attention dilution with a bigger context window or model; more context does not improve attention quality.',
        es: 'No arregles la dilución de atención con más ventana de contexto o un modelo mayor; más contexto no mejora la calidad de la atención.',
      },
      {
        en: 'Do not require agreement across several full-PR runs; consensus voting suppresses real bugs that are caught only intermittently.',
        es: 'No exijas que varias pasadas sobre el PR completo coincidan; votar por consenso suprime bugs reales que solo se detectan a veces.',
      },
      {
        en: 'Do not push the problem onto developers by forcing smaller PRs; restructure the review itself.',
        es: 'No traslades el problema a los desarrolladores obligándoles a hacer PRs más pequeños; reestructura la propia revisión.',
      },
    ],
    example: {
      en: 'A PR touches 14 files. The single-pass review is shallow on some files and flags a pattern in one file while approving identical code in another. Split it: one focused pass per file for local issues, then an integration pass for data flow across files. Run the review in a fresh instance that did not write the code.',
      es: 'Un PR toca 14 ficheros. La revisión en una sola pasada es superficial en algunos y marca un patrón en un fichero mientras aprueba código idéntico en otro. Divídela: una pasada por fichero para problemas locales y luego una de integración para el flujo de datos entre ficheros. Ejecuta la revisión en una instancia nueva que no escribió el código.',
    },
  },
  {
    ts: '5.1',
    title: {
      en: 'Keep critical facts alive in long conversations',
      es: 'Conserva los datos críticos en conversaciones largas',
    },
    tldr: {
      en: 'Summaries blur numbers, dates and promises, and long inputs lose their middle. Pin key facts in a persistent block, trim tool output, and put key findings first.',
      es: 'Los resúmenes difuminan cifras, fechas y compromisos, y en entradas largas se pierde el centro. Fija los hechos clave en un bloque persistente, recorta la salida de herramientas y pon lo importante delante.',
    },
    ideas: [
      {
        en: 'Progressive summarization condenses amounts, percentages, dates and what the customer expects into vague text. Keep those exact values somewhere else.',
        es: 'La progressive summarization reduce importes, porcentajes, fechas y lo que espera el cliente a frases vagas. Guarda esos valores exactos aparte.',
      },
      {
        en: 'Keep a persistent case facts block (amounts, dates, order IDs, statuses) in every prompt, outside summarized history; one entry per issue if there are several.',
        es: 'Mete en cada prompt un bloque de case facts persistente (importes, fechas, IDs de pedido, estados), fuera del historial resumido; una entrada por incidencia.',
      },
      {
        en: 'Lost in the middle: the start and end of long inputs are processed reliably, the middle may be missed. Lead with a key findings summary and section headers.',
        es: 'Lost in the middle: el inicio y el final de una entrada larga se procesan bien, el centro puede perderse. Abre con un resumen de hallazgos y usa encabezados.',
      },
      {
        en: 'Tool results pile up and use tokens out of proportion to their value. Trim each one to the relevant fields (e.g. 5 of 40+ order fields) before it accumulates.',
        es: 'Los resultados de herramientas se acumulan y gastan más tokens de lo que aportan. Recórtalos a los campos útiles (p. ej. 5 de 40+) antes de que se acumulen.',
      },
      {
        en: 'Pass the complete conversation history in every later API request to keep the conversation coherent.',
        es: 'Envía el historial completo de la conversación en cada petición posterior a la API para mantener la coherencia.',
      },
      {
        en: 'When downstream context is tight, have upstream agents return structured data (key facts, citations, relevance scores, dates, sources), not verbose reasoning.',
        es: 'Con poco contexto aguas abajo, pide a los agentes previos datos estructurados (hechos clave, citas, relevance scores, fechas, fuentes), no razonamientos largos.',
      },
    ],
    traps: [
      {
        en: 'Don\'t rely on a running summary to carry refund amounts or dates; it turns \'$247.50 by March 3\' into \'a partial refund soon\'.',
        es: 'No confíes en un resumen acumulado para conservar importes o fechas: \'247,50 $ antes del 3 de marzo\' acaba siendo \'un reembolso parcial pronto\'.',
      },
      {
        en: 'Don\'t paste full 40-field tool responses into context; irrelevant fields crowd out what matters and burn tokens.',
        es: 'No metas en el contexto respuestas de herramientas con 40 campos: los irrelevantes desplazan lo importante y queman tokens.',
      },
      {
        en: 'Don\'t bury key findings in the middle of a long aggregated input with no headers; they may be skipped.',
        es: 'No entierres los hallazgos clave en mitad de una entrada larga sin encabezados: es fácil que se pasen por alto.',
      },
      {
        en: 'Don\'t send only the latest user message to the API; without the full history the model loses the thread of the conversation.',
        es: 'No envíes a la API solo el último mensaje del usuario: sin el historial completo, el modelo pierde el hilo de la conversación.',
      },
    ],
    example: {
      en: 'A support agent handles three issues in a 40-turn chat. After summarization it \'forgets\' the $89 refund it promised. Right move: extract order IDs, amounts and statuses into a case facts block sent with every prompt, and trim order lookups to the return-relevant fields.',
      es: 'Un agente de soporte gestiona tres incidencias en un chat de 40 turnos. Tras resumir, \'olvida\' el reembolso de 89 $ que había prometido. Lo correcto: extraer IDs de pedido, importes y estados a un bloque de case facts que va en cada prompt, y recortar las consultas de pedidos a los campos relevantes para devoluciones.',
    },
  },
  {
    ts: '5.2',
    title: {
      en: 'Escalate on the right triggers, clarify ambiguity',
      es: 'Escala cuando toca y resuelve la ambigüedad',
    },
    tldr: {
      en: 'Escalate when the customer asks for a human, when policy is silent or needs an exception, or when you can\'t progress. Ignore sentiment and self-rated confidence; ask for more identifiers on multiple matches.',
      es: 'Escala si el cliente pide un humano, si la política no cubre el caso o exige una excepción, o si no puedes avanzar. No te fíes del sentimiento ni de la confianza autoevaluada; con varias coincidencias, pide otro dato.',
    },
    ideas: [
      {
        en: 'Valid escalation triggers: the customer asks for a human, a policy exception or gap (not just a complex case), or no meaningful progress is possible.',
        es: 'Disparadores válidos: el cliente pide un humano, hay una excepción o laguna en la política (no basta con que sea complejo) o no se puede avanzar de verdad.',
      },
      {
        en: 'Explicit request for a human: escalate immediately, without investigating or trying to solve the issue first.',
        es: 'Petición explícita de un humano: escala de inmediato, sin investigar ni intentar resolver el problema antes.',
      },
      {
        en: 'Frustrated customer, simple issue you can handle: acknowledge the frustration, offer to resolve it, and escalate only if they repeat that they want a human.',
        es: 'Cliente frustrado con un problema sencillo que puedes resolver: reconoce su frustración, ofrécete a resolverlo y escala solo si insiste en pedir una persona.',
      },
      {
        en: 'Policy silent or ambiguous on the request (e.g. competitor price match when policy only covers own-site adjustments): escalate, don\'t improvise.',
        es: 'Si la política calla o es ambigua (p. ej. igualar el precio de la competencia cuando solo cubre ajustes en tu web): escala, no improvises.',
      },
      {
        en: 'Tool returns multiple customer matches: ask for an additional identifier instead of choosing one with a heuristic.',
        es: 'Si la herramienta devuelve varios clientes que coinciden, pide un identificador adicional en lugar de elegir uno con una heurística.',
      },
      {
        en: 'To fix poor calibration, add explicit escalation criteria to the system prompt with few-shot examples of when to escalate and when to resolve.',
        es: 'Para calibrar la escalada, añade al system prompt criterios explícitos con ejemplos few-shot de cuándo escalar y cuándo resolver por tu cuenta.',
      },
    ],
    traps: [
      {
        en: 'Don\'t escalate on sentiment; frustration doesn\'t track case complexity, so you escalate easy cases and keep hard ones.',
        es: 'No escales por sentimiento: el enfado no refleja la complejidad del caso, así que escalas casos fáciles y te quedas con los difíciles.',
      },
      {
        en: 'Don\'t route on self-reported confidence scores; the model is often confidently wrong on exactly the hard cases.',
        es: 'No enrutes según un confidence score autoevaluado: el modelo suele estar muy seguro justo en los casos difíciles que falla.',
      },
      {
        en: 'Don\'t pick the \'most likely\' account when a lookup returns several matches; a wrong guess acts on the wrong customer.',
        es: 'No elijas la cuenta \'más probable\' cuando la búsqueda da varias coincidencias: si fallas, actúas sobre el cliente equivocado.',
      },
      {
        en: 'Don\'t make a customer sit through troubleshooting after they explicitly ask for a human; honor the request right away.',
        es: 'No hagas pasar al cliente por diagnósticos después de pedir explícitamente un humano: atiende su petición enseguida.',
      },
    ],
    example: {
      en: 'A customer writes: \'A competitor sells this for $20 less, match it.\' Your policy only covers price adjustments on your own site. The agent should not invent a rule or refuse on its own: the policy is silent on competitor matching, so this is a policy gap and the right move is to escalate to a human.',
      es: 'Un cliente escribe: \'La competencia lo vende 20 $ más barato, igualadlo.\' Tu política solo cubre ajustes de precio en tu propia web. El agente no debe inventarse una norma ni negarse por su cuenta: la política no dice nada de igualar a la competencia, así que es una laguna y lo correcto es escalar a un humano.',
    },
  },
  {
    ts: '5.3',
    title: {
      en: 'Propagate errors with structured context',
      es: 'Propaga los errores con contexto estructurado',
    },
    tldr: {
      en: 'Subagents fix transient failures locally and report what they can\'t fix with structured context, so the coordinator can retry, reroute or continue with partial results.',
      es: 'Los subagentes resuelven localmente los fallos transitorios y reportan lo que no pueden arreglar con contexto estructurado, para que el coordinador reintente, cambie de enfoque o siga con resultados parciales.',
    },
    ideas: [
      {
        en: 'Structured error context: failure type, the query attempted, any partial results and possible alternatives. It lets the coordinator choose a smart recovery.',
        es: 'Structured error context: tipo de fallo, consulta intentada, resultados parciales y alternativas posibles. Así el coordinador elige bien cómo recuperarse.',
      },
      {
        en: 'An access failure (e.g. timeout) is not a valid empty result (query worked, no matches). Report them differently; only the first may need a retry.',
        es: 'Un fallo de acceso (p. ej. timeout) no es un resultado vacío válido (consulta correcta sin coincidencias). Repórtalos distinto: solo el primero pide reintento.',
      },
      {
        en: 'A generic status like \'search unavailable\' hides exactly what the coordinator needs to decide the next step.',
        es: 'Un estado genérico como \'search unavailable\' oculta justo lo que el coordinador necesita para decidir el siguiente paso.',
      },
      {
        en: 'Subagents recover locally from transient failures and propagate only what they can\'t resolve, with what they tried and any partial results.',
        es: 'Los subagentes se recuperan solos de los fallos transitorios y solo propagan lo que no pueden resolver, con lo que intentaron y los resultados parciales.',
      },
      {
        en: 'Add coverage annotations to synthesis output: which findings are well supported and which topic areas have gaps because a source was unavailable.',
        es: 'Añade coverage annotations a la síntesis: qué hallazgos están bien respaldados y qué áreas tienen huecos porque una fuente no estaba disponible.',
      },
    ],
    traps: [
      {
        en: 'Don\'t catch a failure and return an empty result marked as success; the error is hidden and recovery becomes impossible.',
        es: 'No captures un fallo para devolver un resultado vacío marcado como éxito: ocultas el error y la recuperación se vuelve imposible.',
      },
      {
        en: 'Don\'t let one subagent failure terminate the whole workflow when a retry, an alternative or partial results could still work.',
        es: 'No dejes que el fallo de un subagente termine todo el flujo si un reintento, una alternativa o los resultados parciales aún pueden servir.',
      },
      {
        en: 'Don\'t retry silently and then return only \'search unavailable\'; the coordinator loses the failure type, the query and the partial results.',
        es: 'No reintentes en silencio para acabar devolviendo solo \'search unavailable\': el coordinador pierde el tipo de fallo, la consulta y lo parcial.',
      },
      {
        en: 'Don\'t treat \'no matches\' as an error to retry; a successful query with zero results is a valid answer.',
        es: 'No trates \'sin coincidencias\' como un error que reintentar: una consulta correcta con cero resultados es una respuesta válida.',
      },
    ],
    example: {
      en: 'The web search subagent times out on one subtopic. Instead of failing the whole run or returning an empty list as success, it reports: failure type timeout, the attempted query, three partial results and a narrower query to try. The coordinator retries the narrower query and, if that also fails, the final report marks the gap.',
      es: 'El subagente de búsqueda web hace timeout en un subtema. En vez de tumbar toda la ejecución o devolver una lista vacía como éxito, reporta: tipo de fallo timeout, la consulta intentada, tres resultados parciales y una consulta más acotada. El coordinador la reintenta y, si también falla, el informe final marca el hueco.',
    },
  },
  {
    ts: '5.4',
    title: {
      en: 'Manage context in large codebase exploration',
      es: 'Gestiona el contexto al explorar un codebase grande',
    },
    tldr: {
      en: 'Long exploration sessions degrade and answers drift to \'typical patterns\'. Delegate verbose digging to subagents, keep findings in a scratchpad file, use `/compact`, and export state for crash recovery.',
      es: 'En sesiones largas el contexto se degrada y las respuestas derivan a \'patrones típicos\'. Delega la exploración verbosa en subagentes, apunta hallazgos en un scratchpad, usa `/compact` y exporta estado ante caídas.',
    },
    ideas: [
      {
        en: 'Context degradation: in long sessions the model gives inconsistent answers and cites \'typical patterns\' instead of the specific classes it found earlier.',
        es: 'Context degradation: en sesiones largas el modelo responde de forma inconsistente y habla de \'patrones típicos\' en vez de las clases concretas que encontró.',
      },
      {
        en: 'Keep a scratchpad file of key findings and refer to it for later questions, so findings survive context boundaries.',
        es: 'Mantén un scratchpad file con los hallazgos clave y consúltalo en preguntas posteriores para que sobrevivan a los límites de contexto.',
      },
      {
        en: 'Spawn subagents for focused questions (\'find all test files\', \'trace refund flow dependencies\'); the main agent keeps high-level coordination.',
        es: 'Lanza subagentes para preguntas concretas (\'busca todos los tests\', \'traza las dependencias del flujo de reembolsos\'); el agente principal coordina.',
      },
      {
        en: 'Between phases, summarize key findings and inject that summary into the initial context of the next phase\'s subagents.',
        es: 'Entre fases, resume los hallazgos clave e inyecta ese resumen en el contexto inicial de los subagentes de la siguiente fase.',
      },
      {
        en: 'Crash recovery: each agent exports structured state to a known location; on resume the coordinator loads the manifest and injects it into agent prompts.',
        es: 'Crash recovery: cada agente exporta su estado estructurado a una ubicación conocida; al reanudar, el coordinador carga el manifest y lo inyecta en los prompts.',
      },
      {
        en: 'Use `/compact` to reduce context usage when a long exploration fills the context with verbose discovery output.',
        es: 'Usa `/compact` para reducir el uso de contexto cuando una exploración larga lo llena de salida verbosa.',
      },
    ],
    traps: [
      {
        en: 'Don\'t do all exploration in the main session; verbose output fills the context and later answers turn generic and inconsistent.',
        es: 'No hagas toda la exploración en la sesión principal: la salida verbosa llena el contexto y las respuestas posteriores se vuelven genéricas.',
      },
      {
        en: 'Don\'t start next-phase subagents without a summary of earlier findings; they start blind and repeat work.',
        es: 'No lances subagentes de la siguiente fase sin un resumen de lo ya encontrado: empiezan a ciegas y repiten trabajo.',
      },
      {
        en: 'Don\'t use the conversation as the only record of progress; without exported state and a manifest, a crash means starting over.',
        es: 'No uses la conversación como único registro del progreso: sin estado exportado y un manifest, una caída te obliga a empezar de cero.',
      },
    ],
    example: {
      en: 'Mapping a legacy payments monolith, Claude starts talking about a generic \'service layer\' instead of the `RefundProcessor` class it found an hour ago. Right move: write key findings to a scratchpad file, run `/compact`, and delegate \'trace refund flow dependencies\' to a subagent that returns only a summary.',
      es: 'Mapeando un monolito de pagos heredado, Claude empieza a hablar de una \'capa de servicios\' genérica en vez de la clase `RefundProcessor` que encontró hace una hora. Lo correcto: guardar los hallazgos clave en un scratchpad file, ejecutar `/compact` y delegar \'traza las dependencias del flujo de reembolsos\' en un subagente que devuelva solo un resumen.',
    },
  },
  {
    ts: '5.5',
    title: {
      en: 'Human review workflows and confidence calibration',
      es: 'Revisión humana y calibración de la confianza',
    },
    tldr: {
      en: 'A high overall accuracy can hide weak document types or fields. Validate per segment, calibrate field-level confidence on labeled data, sample high-confidence output, and route doubtful cases to humans.',
      es: 'Una precisión global alta puede ocultar tipos de documento o campos flojos. Valida por segmento, calibra la confianza por campo con datos etiquetados, muestrea lo de alta confianza y manda lo dudoso a humanos.',
    },
    ideas: [
      {
        en: 'Aggregate accuracy (e.g. 97% overall) can mask poor results on specific document types or fields.',
        es: 'La precisión agregada (p. ej. un 97% global) puede ocultar malos resultados en tipos de documento o campos concretos.',
      },
      {
        en: 'Before reducing human review, check accuracy by document type and by field to confirm every segment performs consistently.',
        es: 'Antes de reducir la revisión humana, mide la precisión por tipo de documento y por campo para confirmar que todos los segmentos rinden igual.',
      },
      {
        en: 'Have the model output field-level confidence scores, then set review thresholds by calibrating them on a labeled validation set.',
        es: 'Haz que el modelo dé field-level confidence scores y fija los umbrales de revisión calibrándolos con un conjunto de validación etiquetado.',
      },
      {
        en: 'Keep stratified random sampling of high-confidence extractions to measure the ongoing error rate and detect novel error patterns.',
        es: 'Mantén un stratified random sampling de las extracciones de alta confianza para medir la tasa de error continua y detectar patrones de error nuevos.',
      },
      {
        en: 'Send low-confidence extractions and ambiguous or contradictory source documents to human review, so limited reviewer time goes where it matters.',
        es: 'Manda a revisión humana lo de baja confianza y los documentos fuente ambiguos o contradictorios: así priorizas el poco tiempo de los revisores.',
      },
    ],
    traps: [
      {
        en: 'Don\'t automate just because overall accuracy looks high; one document type or field can be failing behind the average.',
        es: 'No automatices solo porque la precisión global sea alta: un tipo de documento o un campo puede estar fallando detrás de la media.',
      },
      {
        en: 'Don\'t route on raw model confidence; scores must be calibrated against labeled data before they set review thresholds.',
        es: 'No enrutes con la confianza bruta del modelo: hay que calibrarla con datos etiquetados antes de usarla para fijar umbrales de revisión.',
      },
      {
        en: 'Don\'t stop checking high-confidence output entirely; without ongoing sampling, new error patterns go unnoticed.',
        es: 'No dejes de revisar del todo lo de alta confianza: sin muestreo continuo, los patrones de error nuevos pasan desapercibidos.',
      },
      {
        en: 'Don\'t spread scarce reviewer time evenly across all items; focus it on low-confidence and contradictory cases.',
        es: 'No repartas por igual el poco tiempo de revisión entre todos los elementos: céntralo en casos de baja confianza o contradictorios.',
      },
    ],
    example: {
      en: 'An invoice extraction pipeline shows 97% accuracy and the team wants to drop human review. Split by document type, credit notes reach only 71% on `total_amount`. Right move: keep review for that segment, calibrate field-level thresholds on a labeled validation set, and keep stratified sampling of the high-confidence rest.',
      es: 'Un pipeline de extracción de facturas marca un 97% de precisión y el equipo quiere quitar la revisión humana. Por tipo de documento, las facturas rectificativas solo llegan al 71% en `total_amount`. Lo correcto: mantener la revisión en ese segmento, calibrar umbrales por campo con un conjunto de validación etiquetado y seguir muestreando de forma estratificada el resto.',
    },
  },
  {
    ts: '5.6',
    title: {
      en: 'Keep provenance and uncertainty in synthesis',
      es: 'Conserva la procedencia y la incertidumbre en la síntesis',
    },
    tldr: {
      en: 'Summaries drop sources unless claim-source mappings travel through every step. Annotate conflicts instead of picking one value, include dates, and separate established from contested findings.',
      es: 'Los resúmenes pierden las fuentes si los claim-source mappings no viajan en cada paso. Anota los conflictos en vez de elegir un valor, incluye fechas y separa lo consolidado de lo discutido.',
    },
    ideas: [
      {
        en: 'Attribution is lost when findings are compressed without claim-source mappings. Subagents output each claim with its source URL or document name and an excerpt.',
        es: 'La atribución se pierde al comprimir hallazgos sin claim-source mappings. Los subagentes dan cada afirmación con su URL o documento fuente y un extracto.',
      },
      {
        en: 'The synthesis agent must preserve and merge claim-source mappings when combining findings, not flatten them into unsourced text.',
        es: 'El agente de síntesis debe conservar y fusionar los claim-source mappings al combinar hallazgos, no aplanarlos en texto sin fuentes.',
      },
      {
        en: 'Credible sources disagree on a statistic: keep both values with attribution and annotate the conflict; the coordinator decides how to reconcile.',
        es: 'Si fuentes fiables discrepan en una cifra, conserva ambos valores con su fuente y anota el conflicto; el coordinador decide cómo conciliarlos.',
      },
      {
        en: 'Require publication or data collection dates in structured outputs so differences over time aren\'t misread as contradictions.',
        es: 'Exige fechas de publicación o de recogida de datos en las salidas estructuradas para que los cambios en el tiempo no parezcan contradicciones.',
      },
      {
        en: 'Give reports separate sections for well-established and contested findings, keeping source characterizations and methodological context.',
        es: 'Separa en el informe los hallazgos consolidados de los discutidos, conservando cómo los describe cada fuente y su contexto metodológico.',
      },
      {
        en: 'Render by content type: financial data as tables, news as prose, technical findings as structured lists, not one uniform format.',
        es: 'Presenta según el tipo de contenido: datos financieros en tablas, noticias en prosa, hallazgos técnicos en listas estructuradas; no un formato único.',
      },
    ],
    traps: [
      {
        en: 'Don\'t arbitrarily pick one of two conflicting figures from credible sources; you hide real uncertainty from the reader.',
        es: 'No elijas sin criterio una de dos cifras contradictorias de fuentes fiables: le ocultas al lector una incertidumbre real.',
      },
      {
        en: 'Don\'t treat a 2021 figure and a 2024 figure as a contradiction; without dates, change over time looks like conflict.',
        es: 'No trates una cifra de 2021 y otra de 2024 como una contradicción: sin fechas, un cambio en el tiempo parece un conflicto.',
      },
      {
        en: 'Don\'t let a summarization step drop sources; once the claim-source link is gone, downstream agents can\'t reliably restore it.',
        es: 'No dejes que un paso de resumen elimine las fuentes: perdido el vínculo afirmación-fuente, los agentes posteriores no pueden recuperarlo con fiabilidad.',
      },
      {
        en: 'Don\'t force every content type into one uniform format; tables, prose and lists each suit different kinds of data.',
        es: 'No fuerces todo el contenido a un formato uniforme: tablas, prosa y listas encajan con tipos de datos distintos.',
      },
    ],
    example: {
      en: 'Two credible reports give market growth of 12% and 18%. The analysis subagent keeps both, each with source, excerpt and publication date, and flags the conflict. The coordinator sees one is from 2022 and the other from 2024, so the report presents them as change over time in a dated table instead of choosing one.',
      es: 'Dos informes fiables dan un crecimiento de mercado del 12% y del 18%. El subagente de análisis conserva ambos, cada uno con fuente, extracto y fecha de publicación, y marca el conflicto. El coordinador ve que uno es de 2022 y otro de 2024, así que el informe los presenta como evolución en una tabla con fechas, en vez de elegir uno.',
    },
  },
];
