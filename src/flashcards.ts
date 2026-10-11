// Fichas para repasar con repetición espaciada, en inglés y en español de España, escritos a partir de los task statements
// de la guía oficial (Claude Certified Architect – Foundations Exam Guide v1.0, julio 2026).
// Entre comillas invertidas va el código, que la app resalta.
import type { Flashcard } from './game.ts';

export const FLASHCARDS: Flashcard[] = [
  {
    id: 'f-1.1-loop-exit',
    ts: '1.1',
    front: {
      en: 'What signal should end an agentic loop?',
      es: '¿Qué señal debe terminar un bucle agéntico?',
    },
    back: {
      en: '`stop_reason` equal to `end_turn`: Claude is saying the task is finished. An iteration cap can exist as a safety net, but it is not the primary way to stop.',
      es: 'Que `stop_reason` sea `end_turn`: Claude indica que ha terminado la tarea. Puede haber un límite de iteraciones como red de seguridad, pero no es la forma principal de parar.',
    },
  },
  {
    id: 'f-1.1-tool-use',
    ts: '1.1',
    front: {
      en: 'What should your loop do when `stop_reason` is `tool_use`?',
      es: '¿Qué debe hacer tu bucle cuando `stop_reason` es `tool_use`?',
    },
    back: {
      en: 'Execute the requested tools, append the results to the conversation history, and send the updated history back to Claude for the next iteration.',
      es: 'Ejecutar las herramientas pedidas, añadir los resultados al historial de la conversación y enviar ese historial actualizado a Claude para la siguiente iteración.',
    },
  },
  {
    id: 'f-1.1-text-check',
    ts: '1.1',
    front: {
      en: 'Why is \'the response contains text\' a bad completion check?',
      es: '¿Por qué \'la respuesta tiene texto\' es un mal criterio de finalización?',
    },
    back: {
      en: 'Text can come together with a tool request, so it does not mean the task is done. Only `stop_reason` (`end_turn` vs `tool_use`) reliably tells you whether to continue.',
      es: 'El texto puede ir junto a una petición de herramienta, así que no significa que la tarea haya terminado. Solo `stop_reason` (`end_turn` o `tool_use`) te dice con fiabilidad si seguir.',
    },
  },
  {
    id: 'f-1.1-model-driven',
    ts: '1.1',
    front: {
      en: 'Model-driven decisions vs a pre-configured decision tree: what is the difference?',
      es: 'Decisión guiada por el modelo frente a árbol de decisión preconfigurado: ¿qué cambia?',
    },
    back: {
      en: 'In an agentic loop Claude reasons about which tool to call next based on the current context. A decision tree or fixed tool sequence defines the steps in advance, in code.',
      es: 'En un bucle agéntico, Claude razona qué herramienta llamar después según el contexto actual. Un árbol de decisión o una secuencia fija define los pasos de antemano en el código.',
    },
  },
  {
    id: 'f-1.2-hub-spoke',
    ts: '1.2',
    front: {
      en: 'In hub-and-spoke orchestration, who routes messages between subagents?',
      es: 'En hub-and-spoke, ¿quién enruta los mensajes entre subagentes?',
    },
    back: {
      en: 'The coordinator. All inter-subagent communication, error handling and information routing go through it, which gives observability and consistent control.',
      es: 'El coordinador. Toda la comunicación entre subagentes, el manejo de errores y el enrutado de información pasan por él, lo que da observabilidad y un control uniforme.',
    },
  },
  {
    id: 'f-1.2-isolated-context',
    ts: '1.2',
    front: {
      en: 'Does a subagent see the coordinator\'s conversation history?',
      es: '¿Ve un subagente el historial de conversación del coordinador?',
    },
    back: {
      en: 'No. Subagents run with isolated context and do not inherit the coordinator\'s history automatically. Anything they need must be passed to them.',
      es: 'No. Los subagentes trabajan con contexto aislado y no heredan automáticamente el historial del coordinador. Todo lo que necesiten hay que pasárselo.',
    },
  },
  {
    id: 'f-1.2-narrow-decomp',
    ts: '1.2',
    front: {
      en: 'A report misses whole subareas, yet every subagent did its job well. Most likely root cause?',
      es: 'Al informe le faltan áreas enteras, pero cada subagente hizo bien su trabajo. ¿Causa más probable?',
    },
    back: {
      en: 'The coordinator\'s task decomposition was too narrow, so those areas were never assigned. Fix the decomposition, not the downstream agents.',
      es: 'La descomposición del coordinador fue demasiado estrecha y nunca asignó esas áreas. Corrige la descomposición, no los agentes que van detrás.',
    },
  },
  {
    id: 'f-1.2-refinement',
    ts: '1.2',
    front: {
      en: 'What is an iterative refinement loop in a multi-agent research system?',
      es: '¿Qué es un bucle de refinamiento iterativo en un sistema de investigación multiagente?',
    },
    back: {
      en: 'The coordinator evaluates the synthesis for gaps, re-delegates targeted queries to the search and analysis subagents, and re-invokes synthesis until coverage is sufficient.',
      es: 'El coordinador evalúa la síntesis buscando huecos, vuelve a delegar consultas concretas a los subagentes de búsqueda y análisis y relanza la síntesis hasta que la cobertura es suficiente.',
    },
  },
  {
    id: 'f-1.2-partition',
    ts: '1.2',
    front: {
      en: 'How do you minimize duplicated work across research subagents?',
      es: '¿Cómo reduces el trabajo duplicado entre subagentes de investigación?',
    },
    back: {
      en: 'Partition the scope: assign each subagent distinct subtopics or source types so their work does not overlap.',
      es: 'Repartiendo el alcance: asigna a cada subagente subtemas o tipos de fuente distintos para que su trabajo no se solape.',
    },
  },
  {
    id: 'f-1.3-task-tool',
    ts: '1.3',
    front: {
      en: 'A coordinator cannot spawn subagents. Which setting do you check first?',
      es: 'Un coordinador no consigue lanzar subagentes. ¿Qué configuración revisas primero?',
    },
    back: {
      en: 'Its `allowedTools`. Subagents are spawned through the `Task` tool, so `allowedTools` must include `Task`.',
      es: 'Su `allowedTools`. Los subagentes se lanzan con la herramienta `Task`, así que `allowedTools` debe incluir `Task`.',
    },
  },
  {
    id: 'f-1.3-explicit-context',
    ts: '1.3',
    front: {
      en: 'How does the synthesis subagent get the findings of the search and analysis subagents?',
      es: '¿Cómo recibe el subagente de síntesis los hallazgos de los subagentes de búsqueda y análisis?',
    },
    back: {
      en: 'The coordinator includes those complete findings directly in the synthesis subagent\'s prompt. Subagents do not inherit parent context or share memory between invocations.',
      es: 'El coordinador mete esos hallazgos completos directamente en el prompt del subagente de síntesis. Los subagentes no heredan el contexto del padre ni comparten memoria entre invocaciones.',
    },
  },
  {
    id: 'f-1.3-parallel',
    ts: '1.3',
    front: {
      en: 'How do you run subagents in parallel?',
      es: '¿Cómo ejecutas subagentes en paralelo?',
    },
    back: {
      en: 'Have the coordinator emit multiple `Task` tool calls in a single response. If it emits them across separate turns, they run one after another.',
      es: 'Haz que el coordinador emita varias llamadas a la herramienta `Task` en una sola respuesta. Si las emite en turnos separados, se ejecutan una detrás de otra.',
    },
  },
  {
    id: 'f-1.3-agentdefinition',
    ts: '1.3',
    front: {
      en: 'What does an `AgentDefinition` configure?',
      es: '¿Qué configura una `AgentDefinition`?',
    },
    back: {
      en: 'A subagent type: its description, its system prompt and its tool restrictions.',
      es: 'Un tipo de subagente: su descripción, su system prompt y sus restricciones de herramientas.',
    },
  },
  {
    id: 'f-1.3-metadata',
    ts: '1.3',
    front: {
      en: 'Why pass context between agents as structured data?',
      es: '¿Por qué pasar el contexto entre agentes como datos estructurados?',
    },
    back: {
      en: 'It separates content from metadata such as source URLs, document names and page numbers, so attribution survives when the synthesis agent combines findings.',
      es: 'Porque separa el contenido de los metadatos (URLs de origen, nombres de documento, números de página) y así la atribución se conserva cuando el agente de síntesis combina hallazgos.',
    },
  },
  {
    id: 'f-1.4-prereq',
    ts: '1.4',
    front: {
      en: 'The agent sometimes skips identity verification before refunds. Most effective fix?',
      es: 'El agente a veces se salta la verificación de identidad antes de reembolsar. ¿Arreglo más eficaz?',
    },
    back: {
      en: 'A programmatic prerequisite that blocks `lookup_order` and `process_refund` until `get_customer` has returned a verified customer ID. It is deterministic; prompt changes are not.',
      es: 'Un prerrequisito programático que bloquee `lookup_order` y `process_refund` hasta que `get_customer` haya devuelto un ID de cliente verificado. Es determinista; cambiar el prompt no lo es.',
    },
  },
  {
    id: 'f-1.4-prompt-limit',
    ts: '1.4',
    front: {
      en: 'Why is a \'mandatory\' rule in the system prompt not enough for financial operations?',
      es: '¿Por qué no basta una regla \'obligatoria\' en el system prompt para operaciones financieras?',
    },
    back: {
      en: 'Prompt instructions give probabilistic compliance with a non-zero failure rate. When errors cost money, you need deterministic enforcement in code.',
      es: 'Las instrucciones del prompt dan un cumplimiento probabilístico, con una tasa de fallo distinta de cero. Si un error cuesta dinero, necesitas imponerlo de forma determinista en código.',
    },
  },
  {
    id: 'f-1.4-handoff',
    ts: '1.4',
    front: {
      en: 'What goes in a structured handoff summary when escalating to a human agent?',
      es: '¿Qué incluye un resumen de traspaso estructurado al escalar a un agente humano?',
    },
    back: {
      en: 'Customer ID, root cause analysis, refund amount and recommended action. The human cannot see the conversation transcript, so the summary must stand on its own.',
      es: 'ID de cliente, análisis de la causa raíz, importe del reembolso y acción recomendada. El humano no ve la transcripción de la conversación, así que el resumen debe valerse por sí solo.',
    },
  },
  {
    id: 'f-1.4-multi-concern',
    ts: '1.4',
    front: {
      en: 'How should the agent handle a message that raises several separate issues?',
      es: '¿Cómo debe tratar el agente un mensaje que plantea varios problemas distintos?',
    },
    back: {
      en: 'Decompose it into distinct items, investigate each in parallel using shared context, then synthesize one unified resolution.',
      es: 'Lo descompone en puntos separados, investiga cada uno en paralelo con contexto compartido y después sintetiza una única resolución.',
    },
  },
  {
    id: 'f-1.5-posttooluse',
    ts: '1.5',
    front: {
      en: 'What does a `PostToolUse` hook do?',
      es: '¿Qué hace un hook `PostToolUse`?',
    },
    back: {
      en: 'It intercepts a tool\'s result and transforms it before the model processes it, for example to normalize data formats.',
      es: 'Intercepta el resultado de una herramienta y lo transforma antes de que el modelo lo procese, por ejemplo para normalizar formatos de datos.',
    },
  },
  {
    id: 'f-1.5-normalize',
    ts: '1.5',
    front: {
      en: 'Tools return Unix timestamps, ISO 8601 dates and numeric status codes. Where do you fix that?',
      es: 'Las herramientas devuelven timestamps Unix, fechas ISO 8601 y códigos de estado numéricos. ¿Dónde lo arreglas?',
    },
    back: {
      en: 'In a `PostToolUse` hook that normalizes the heterogeneous formats into one consistent format before the agent processes the results.',
      es: 'En un hook `PostToolUse` que normalice esos formatos heterogéneos a uno coherente antes de que el agente procese los resultados.',
    },
  },
  {
    id: 'f-1.5-block-refund',
    ts: '1.5',
    front: {
      en: 'How do you guarantee that no refund above $500 is ever processed?',
      es: '¿Cómo garantizas que nunca se procese un reembolso de más de 500 $?',
    },
    back: {
      en: 'With a hook that intercepts outgoing tool calls, blocks the policy-violating refund and redirects to an alternative workflow such as human escalation.',
      es: 'Con un hook que intercepte las llamadas salientes, bloquee el reembolso que viola la política y redirija a un flujo alternativo, como escalar a un humano.',
    },
  },
  {
    id: 'f-1.5-hooks-vs-prompts',
    ts: '1.5',
    front: {
      en: 'Hooks vs prompt instructions for compliance: what is the key difference?',
      es: 'Hooks frente a instrucciones en el prompt para el cumplimiento: ¿diferencia clave?',
    },
    back: {
      en: 'Hooks enforce rules deterministically in code. Prompt instructions only make compliance likely (probabilistic). Choose hooks when business rules require guaranteed compliance.',
      es: 'Los hooks imponen las reglas de forma determinista en código. El prompt solo hace probable el cumplimiento. Elige hooks cuando las reglas de negocio exijan cumplimiento garantizado.',
    },
  },
  {
    id: 'f-1.6-chain-vs-dynamic',
    ts: '1.6',
    front: {
      en: 'When do you choose prompt chaining over dynamic decomposition?',
      es: '¿Cuándo eliges prompt chaining y cuándo descomposición dinámica?',
    },
    back: {
      en: 'Prompt chaining for predictable, multi-aspect work with known steps, like reviews. Dynamic decomposition for open-ended investigations where subtasks depend on intermediate findings.',
      es: 'Prompt chaining para trabajo predecible con varios aspectos y pasos conocidos, como revisiones. Descomposición dinámica para investigaciones abiertas cuyas subtareas dependen de hallazgos intermedios.',
    },
  },
  {
    id: 'f-1.6-multi-file-review',
    ts: '1.6',
    front: {
      en: 'A 14-file review gives shallow and contradictory feedback. How do you restructure it?',
      es: 'Una revisión de 14 archivos da comentarios superficiales y contradictorios. ¿Cómo la reestructuras?',
    },
    back: {
      en: 'Analyze each file individually for local issues, then run a separate integration pass for cross-file data flow. This fixes the attention dilution.',
      es: 'Analiza cada archivo por separado buscando problemas locales y luego haz una pasada de integración aparte para el flujo de datos entre archivos. Así atacas la dilución de la atención.',
    },
  },
  {
    id: 'f-1.6-bigger-context',
    ts: '1.6',
    front: {
      en: 'Will a model with a larger context window fix a one-pass review of many files?',
      es: '¿Arregla un modelo con más ventana de contexto una revisión de muchos archivos en una sola pasada?',
    },
    back: {
      en: 'No. Larger context windows do not solve attention quality issues. Focused per-file passes plus an integration pass do.',
      es: 'No. Más ventana de contexto no resuelve la calidad de la atención. Lo que funciona son pasadas acotadas por archivo más una pasada de integración.',
    },
  },
  {
    id: 'f-1.6-legacy-tests',
    ts: '1.6',
    front: {
      en: 'How do you decompose \'add comprehensive tests to a legacy codebase\'?',
      es: '¿Cómo descompones \'añadir tests completos a un código legacy\'?',
    },
    back: {
      en: 'Map the structure first, identify high-impact areas, then create a prioritized plan that adapts as dependencies are discovered. That is dynamic decomposition.',
      es: 'Primero mapea la estructura, luego identifica las zonas de alto impacto y crea un plan priorizado que se adapte según descubras dependencias. Es descomposición dinámica.',
    },
  },
  {
    id: 'f-1.7-resume',
    ts: '1.7',
    front: {
      en: 'How do you continue a specific named investigation from an earlier work session?',
      es: '¿Cómo continúas una investigación con nombre de una jornada de trabajo anterior?',
    },
    back: {
      en: 'Use `--resume <session-name>`. It resumes that specific prior conversation by its name.',
      es: 'Con `--resume <session-name>`, que reanuda esa conversación concreta por su nombre.',
    },
  },
  {
    id: 'f-1.7-fork',
    ts: '1.7',
    front: {
      en: 'You want to compare two refactoring approaches from the same codebase analysis. What do you use?',
      es: 'Quieres comparar dos enfoques de refactorización desde el mismo análisis del código. ¿Qué usas?',
    },
    back: {
      en: '`fork_session`. It creates independent branches from a shared analysis baseline, so each approach is explored separately.',
      es: '`fork_session`. Crea ramas independientes desde una base de análisis común, así exploras cada enfoque por separado.',
    },
  },
  {
    id: 'f-1.7-stale',
    ts: '1.7',
    front: {
      en: 'Your earlier tool results are stale. Resume the session or start fresh?',
      es: 'Tus resultados de herramientas anteriores están obsoletos. ¿Reanudas o empiezas de cero?',
    },
    back: {
      en: 'Start a new session with an injected structured summary; it is more reliable than resuming with stale tool results. Resume when prior context is mostly still valid.',
      es: 'Empieza una sesión nueva con un resumen estructurado; es más fiable que reanudar con resultados obsoletos. Reanuda cuando el contexto previo sigue siendo válido casi todo.',
    },
  },
  {
    id: 'f-1.7-changed-files',
    ts: '1.7',
    front: {
      en: 'You modified code after an analysis session. What do you do when you resume it?',
      es: 'Has modificado código después de una sesión de análisis. ¿Qué haces al reanudarla?',
    },
    back: {
      en: 'Tell the resumed session exactly which files changed so it re-analyzes them in a targeted way, instead of re-exploring everything or trusting outdated results.',
      es: 'Dile a la sesión reanudada exactamente qué archivos cambiaron para que los vuelva a analizar de forma dirigida, en vez de reexplorarlo todo o fiarse de resultados viejos.',
    },
  },
  {
    id: 'f-2.1-primary-mechanism',
    ts: '2.1',
    front: {
      en: 'What does the model mainly rely on to choose between tools?',
      es: '¿En qué se basa principalmente el modelo para elegir entre herramientas?',
    },
    back: {
      en: 'The tool descriptions. If they are minimal, the model cannot tell similar tools apart, so tool selection becomes unreliable.',
      es: 'En las descripciones de las herramientas. Si son mínimas, no puede distinguir herramientas parecidas y la elección se vuelve poco fiable.',
    },
  },
  {
    id: 'f-2.1-first-fix',
    ts: '2.1',
    front: {
      en: 'Two tools with minimal descriptions keep getting confused in production. Best first step?',
      es: 'Dos herramientas con descripciones mínimas se confunden en producción. ¿Mejor primer paso?',
    },
    back: {
      en: 'Expand each description: input formats, example queries, edge cases and when to use it versus the similar tool. Few-shot examples, routing layers or merging tools cost more and miss the root cause.',
      es: 'Ampliar cada descripción: formatos de entrada, consultas de ejemplo, casos límite y cuándo usarla frente a la parecida. Few-shot, capas de enrutado o fusionar herramientas cuestan más y no atacan la causa raíz.',
    },
  },
  {
    id: 'f-2.1-rename',
    ts: '2.1',
    front: {
      en: '`analyze_content` and `analyze_document` have near-identical descriptions. How do you remove the overlap?',
      es: '`analyze_content` y `analyze_document` tienen descripciones casi idénticas. ¿Cómo eliminas el solapamiento?',
    },
    back: {
      en: 'Rename and re-describe so purposes clearly differ, e.g. `analyze_content` becomes `extract_web_results` with a web-specific description.',
      es: 'Renombra y reescribe para que los propósitos se distingan, p. ej. `analyze_content` pasa a `extract_web_results` con una descripción específica para web.',
    },
  },
  {
    id: 'f-2.1-split',
    ts: '2.1',
    front: {
      en: 'How do you fix a generic `analyze_document` tool that does several different jobs?',
      es: '¿Cómo arreglas una herramienta genérica `analyze_document` que hace varias tareas distintas?',
    },
    back: {
      en: 'Split it into purpose-specific tools with defined input/output contracts: `extract_data_points`, `summarize_content` and `verify_claim_against_source`.',
      es: 'Divídela en herramientas específicas con contratos de entrada y salida definidos: `extract_data_points`, `summarize_content` y `verify_claim_against_source`.',
    },
  },
  {
    id: 'f-2.1-system-prompt',
    ts: '2.1',
    front: {
      en: 'Tool descriptions are good, but the agent still picks the wrong tool. What else do you check?',
      es: 'Las descripciones son buenas, pero el agente sigue eligiendo mal. ¿Qué más revisas?',
    },
    back: {
      en: 'The system prompt. Keyword-sensitive instructions can create unintended tool associations that override well-written descriptions.',
      es: 'El system prompt. Las instrucciones sensibles a palabras clave pueden crear asociaciones no deseadas que anulan descripciones bien escritas.',
    },
  },
  {
    id: 'f-2.2-iserror',
    ts: '2.2',
    front: {
      en: 'How does an MCP tool tell the agent that a call failed?',
      es: '¿Cómo indica una herramienta MCP al agente que una llamada falló?',
    },
    back: {
      en: 'With the `isError` flag, plus structured metadata such as `errorCategory`, `isRetryable` and a human-readable description.',
      es: 'Con el flag `isError`, más metadatos estructurados como `errorCategory`, `isRetryable` y una descripción legible.',
    },
  },
  {
    id: 'f-2.2-empty-vs-failure',
    ts: '2.2',
    front: {
      en: 'Access failure vs valid empty result: what is the difference?',
      es: 'Fallo de acceso frente a resultado vacío válido: ¿qué los diferencia?',
    },
    back: {
      en: 'Access failure: the query could not run (e.g. timeout), so a retry decision is needed. Valid empty result: the query succeeded and found no matches; it is not an error.',
      es: 'Fallo de acceso: la consulta no pudo ejecutarse (p. ej. timeout) y hay que decidir si reintentar. Resultado vacío válido: la consulta funcionó y no hubo coincidencias; no es un error.',
    },
  },
  {
    id: 'f-2.2-generic',
    ts: '2.2',
    front: {
      en: 'Why is a generic "Operation failed" a bad tool error?',
      es: '¿Por qué es un mal error de herramienta un genérico "Operation failed"?',
    },
    back: {
      en: 'Every failure looks the same, so the agent cannot tell whether to retry, fix the input, explain a policy or escalate. Structured metadata enables the right recovery.',
      es: 'Todos los fallos parecen iguales, así que el agente no sabe si reintentar, corregir la entrada, explicar una política o escalar. Los metadatos estructurados permiten recuperarse bien.',
    },
  },
  {
    id: 'f-2.2-business',
    ts: '2.2',
    front: {
      en: 'What should a tool return for a business rule violation, like a refund over the policy limit?',
      es: '¿Qué debe devolver una herramienta ante una violación de regla de negocio, como un reembolso por encima del límite?',
    },
    back: {
      en: 'An error with `retriable: false` and a customer-friendly explanation, so the agent stops retrying and tells the user why.',
      es: 'Un error con `retriable: false` y una explicación apta para el cliente, para que el agente deje de reintentar y le explique el motivo.',
    },
  },
  {
    id: 'f-2.2-local-recovery',
    ts: '2.2',
    front: {
      en: 'A subagent hits a transient timeout. Who should handle it first?',
      es: 'Un subagente sufre un timeout transitorio. ¿Quién debe gestionarlo primero?',
    },
    back: {
      en: 'The subagent, with local recovery. Only if it cannot resolve it does it propagate the error to the coordinator, with partial results and what was attempted.',
      es: 'El propio subagente, recuperándose en local. Solo si no lo resuelve propaga el error al coordinador, con resultados parciales y lo que intentó.',
    },
  },
  {
    id: 'f-2.3-too-many',
    ts: '2.3',
    front: {
      en: 'Why not give one agent all 18 available tools?',
      es: '¿Por qué no dar a un agente las 18 herramientas disponibles?',
    },
    back: {
      en: 'More tools increase decision complexity and make tool selection less reliable. Give each agent only the 4-5 tools its role needs.',
      es: 'Más herramientas aumentan la complejidad de la decisión y hacen la elección menos fiable. Da a cada agente solo las 4-5 que su rol necesita.',
    },
  },
  {
    id: 'f-2.3-auto-vs-any',
    ts: '2.3',
    front: {
      en: '`tool_choice` `"auto"` vs `"any"`: what is the difference?',
      es: '`tool_choice` `"auto"` frente a `"any"`: ¿qué cambia?',
    },
    back: {
      en: '`"auto"`: the model may answer with text instead of calling a tool. `"any"`: the model must call a tool, but it chooses which one.',
      es: '`"auto"`: el modelo puede responder con texto en vez de llamar a una herramienta. `"any"`: debe llamar a una herramienta, pero elige cuál.',
    },
  },
  {
    id: 'f-2.3-any-vs-forced',
    ts: '2.3',
    front: {
      en: '`extract_metadata` must run before any enrichment tool. Is `"any"` enough?',
      es: '`extract_metadata` debe ejecutarse antes que cualquier enriquecimiento. ¿Basta con `"any"`?',
    },
    back: {
      en: 'No. `"any"` only guarantees some tool call. Force it with `{"type": "tool", "name": "extract_metadata"}`, then run later steps in follow-up turns.',
      es: 'No. `"any"` solo garantiza que se llame a alguna herramienta. Fuérzala con `{"type": "tool", "name": "extract_metadata"}` y haz el resto en turnos siguientes.',
    },
  },
  {
    id: 'f-2.3-verify-fact',
    ts: '2.3',
    front: {
      en: 'The synthesis agent often needs simple fact checks. Should you give it all the web search tools?',
      es: 'El agente de síntesis necesita a menudo comprobar datos simples. ¿Le das todas las herramientas de búsqueda web?',
    },
    back: {
      en: 'No. Give it a scoped `verify_fact` tool for the frequent simple checks and keep routing complex verification through the coordinator. Full web tools would over-provision it.',
      es: 'No. Dale una herramienta acotada `verify_fact` para las comprobaciones simples y frecuentes, y sigue enviando las complejas por el coordinador. Darle todo lo sobredimensiona.',
    },
  },
  {
    id: 'f-2.4-project-vs-user',
    ts: '2.4',
    front: {
      en: 'Project `.mcp.json` vs user `~/.claude.json`: what goes where?',
      es: '`.mcp.json` del proyecto frente a `~/.claude.json` del usuario: ¿qué va en cada uno?',
    },
    back: {
      en: '`.mcp.json`: MCP servers shared by the whole team for the project. `~/.claude.json`: your personal or experimental servers that the team should not get.',
      es: '`.mcp.json`: servidores MCP compartidos por todo el equipo en el proyecto. `~/.claude.json`: tus servidores personales o experimentales, que el equipo no debe recibir.',
    },
  },
  {
    id: 'f-2.4-env-expansion',
    ts: '2.4',
    front: {
      en: 'How do you give a shared MCP server an auth token without committing the secret?',
      es: '¿Cómo das un token a un servidor MCP compartido sin subir el secreto al repo?',
    },
    back: {
      en: 'Use environment variable expansion in `.mcp.json`, e.g. `${GITHUB_TOKEN}`. The file only references the variable; the real value comes from the environment.',
      es: 'Con la expansión de variables de entorno en `.mcp.json`, p. ej. `${GITHUB_TOKEN}`. El fichero solo referencia la variable; el valor real sale del entorno.',
    },
  },
  {
    id: 'f-2.4-resources',
    ts: '2.4',
    front: {
      en: 'What are MCP resources for?',
      es: '¿Para qué sirven los MCP resources?',
    },
    back: {
      en: 'Exposing content catalogs, like issue summaries, documentation hierarchies or database schemas, so the agent knows what data exists without exploratory tool calls.',
      es: 'Para exponer catálogos de contenido, como resúmenes de issues, jerarquías de documentación o esquemas de BD, y que el agente sepa qué datos hay sin llamadas exploratorias.',
    },
  },
  {
    id: 'f-2.4-grep-preference',
    ts: '2.4',
    front: {
      en: 'The agent keeps using `Grep` instead of your more capable MCP search tool. What do you fix?',
      es: 'El agente sigue usando `Grep` en vez de tu herramienta MCP de búsqueda, más capaz. ¿Qué arreglas?',
    },
    back: {
      en: 'The MCP tool description. Explain its capabilities and outputs in detail so the agent understands why it beats the built-in tool.',
      es: 'La descripción de la herramienta MCP. Explica con detalle qué hace y qué devuelve para que el agente entienda por qué supera a la integrada.',
    },
  },
  {
    id: 'f-2.4-community',
    ts: '2.4',
    front: {
      en: 'You need a Jira integration. Build a custom MCP server?',
      es: 'Necesitas integrar Jira. ¿Construyes un servidor MCP propio?',
    },
    back: {
      en: 'No. Use an existing community MCP server for standard integrations. Reserve custom servers for workflows specific to your team.',
      es: 'No. Usa un servidor MCP de la comunidad para integraciones estándar. Reserva los servidores propios para flujos específicos de tu equipo.',
    },
  },
  {
    id: 'f-2.5-grep-vs-glob',
    ts: '2.5',
    front: {
      en: 'Find all callers of a function vs find all `*.test.tsx` files: which tool for each?',
      es: 'Encontrar las llamadas a una función frente a encontrar los ficheros `*.test.tsx`: ¿qué herramienta para cada caso?',
    },
    back: {
      en: 'Callers: `Grep`, because it searches file contents. Test files: `Glob`, because it matches file paths, e.g. `**/*.test.tsx`.',
      es: 'Llamadas: `Grep`, porque busca en el contenido. Ficheros de test: `Glob`, porque compara rutas, p. ej. `**/*.test.tsx`.',
    },
  },
  {
    id: 'f-2.5-edit-fallback',
    ts: '2.5',
    front: {
      en: '`Edit` fails because the anchor text is not unique. What now?',
      es: '`Edit` falla porque el texto ancla no es único. ¿Y ahora qué?',
    },
    back: {
      en: 'Fall back to `Read` to load the full file, then `Write` the modified version. It is the reliable path when no unique anchor exists.',
      es: 'Recurre a `Read` para cargar el fichero completo y luego a `Write` con la versión modificada. Es el camino fiable cuando no hay un ancla única.',
    },
  },
  {
    id: 'f-2.5-edit-vs-write',
    ts: '2.5',
    front: {
      en: 'When is `Edit` the right tool rather than `Write`?',
      es: '¿Cuándo es `Edit` la herramienta adecuada en lugar de `Write`?',
    },
    back: {
      en: 'For a targeted change you can anchor on a unique text match. `Write` is for full file operations.',
      es: 'Para un cambio puntual que puedes anclar en un texto único. `Write` es para operaciones sobre el fichero completo.',
    },
  },
  {
    id: 'f-2.5-incremental',
    ts: '2.5',
    front: {
      en: 'How should an agent build understanding of an unfamiliar codebase?',
      es: '¿Cómo debe un agente llegar a entender un código que no conoce?',
    },
    back: {
      en: 'Incrementally: `Grep` to find entry points, then `Read` to follow imports and trace flows. Not by reading every file upfront.',
      es: 'Poco a poco: `Grep` para encontrar puntos de entrada y luego `Read` para seguir imports y trazar flujos. No leyendo todos los ficheros de entrada.',
    },
  },
  {
    id: 'f-2.5-wrappers',
    ts: '2.5',
    front: {
      en: 'A function is re-exported through wrapper modules. How do you find all its uses?',
      es: 'Una función se reexporta a través de módulos envoltorio. ¿Cómo encuentras todos sus usos?',
    },
    back: {
      en: 'First identify every name the wrappers export, then `Grep` for each name across the codebase.',
      es: 'Primero identifica todos los nombres que exportan los envoltorios y luego busca cada uno con `Grep` en todo el código.',
    },
  },
  {
    id: 'f-3.1-user-vs-project',
    ts: '3.1',
    front: {
      en: 'A new teammate doesn\'t get the team\'s Claude instructions, but you do. What is the most likely cause?',
      es: 'Un compañero nuevo no recibe las instrucciones de Claude del equipo, pero tú sí. ¿Cuál es la causa más probable?',
    },
    back: {
      en: 'The instructions are in your user-level `~/.claude/CLAUDE.md`, which is personal and not shared via version control. Move them to the project-level `CLAUDE.md` in the repo.',
      es: 'Las instrucciones están en tu `~/.claude/CLAUDE.md` de usuario, que es personal y no se comparte por control de versiones. Muévelas al `CLAUDE.md` del proyecto, dentro del repo.',
    },
  },
  {
    id: 'f-3.1-three-levels',
    ts: '3.1',
    front: {
      en: 'What are the three levels of the `CLAUDE.md` hierarchy?',
      es: '¿Cuáles son los tres niveles de la jerarquía de `CLAUDE.md`?',
    },
    back: {
      en: 'User level `~/.claude/CLAUDE.md` (only you), project level `.claude/CLAUDE.md` or root `CLAUDE.md` (shared through the repo), and directory level `CLAUDE.md` files in subdirectories.',
      es: 'Usuario, `~/.claude/CLAUDE.md` (solo tú); proyecto, `.claude/CLAUDE.md` o `CLAUDE.md` en la raíz (compartido por el repo); y directorio, ficheros `CLAUDE.md` en subdirectorios.',
    },
  },
  {
    id: 'f-3.1-import',
    ts: '3.1',
    front: {
      en: 'How can each package\'s `CLAUDE.md` include only the standards files that matter to it?',
      es: '¿Cómo puede el `CLAUDE.md` de cada paquete incluir solo los ficheros de estándares que le importan?',
    },
    back: {
      en: 'Use `@import` to reference those external standards files, chosen by the maintainers who know that package. Each `CLAUDE.md` stays small and modular.',
      es: 'Usa `@import` para referenciar esos ficheros de estándares externos, elegidos por quienes mantienen y conocen ese paquete. Cada `CLAUDE.md` queda pequeño y modular.',
    },
  },
  {
    id: 'f-3.1-rules-split',
    ts: '3.1',
    front: {
      en: 'Your root `CLAUDE.md` has become huge and hard to maintain. What is the alternative?',
      es: 'Tu `CLAUDE.md` raíz se ha vuelto enorme y difícil de mantener. ¿Qué alternativa tienes?',
    },
    back: {
      en: 'Split it into focused topic files in `.claude/rules/`, for example `testing.md`, `api-conventions.md` and `deployment.md`.',
      es: 'Divídelo en ficheros por tema dentro de `.claude/rules/`, por ejemplo `testing.md`, `api-conventions.md` y `deployment.md`.',
    },
  },
  {
    id: 'f-3.1-memory',
    ts: '3.1',
    front: {
      en: 'Claude behaves differently across sessions. Which command shows which memory files are loaded?',
      es: 'Claude se comporta distinto según la sesión. ¿Qué comando muestra qué ficheros de memoria están cargados?',
    },
    back: {
      en: '`/memory`. Use it to verify which memory files are loaded and diagnose the inconsistency before changing any content.',
      es: '`/memory`. Úsalo para comprobar qué ficheros de memoria están cargados y diagnosticar la inconsistencia antes de tocar ningún contenido.',
    },
  },
  {
    id: 'f-3.2-team-command',
    ts: '3.2',
    front: {
      en: 'Where do you put a `/review` command that every developer should get when they clone the repo?',
      es: '¿Dónde pones un command `/review` que todo desarrollador debe tener al clonar el repo?',
    },
    back: {
      en: 'In `.claude/commands/` inside the project repo. It is version-controlled, so everyone gets it on clone or pull. `~/.claude/commands/` is for personal commands only.',
      es: 'En `.claude/commands/` dentro del repo del proyecto. Está bajo control de versiones, así que todos lo reciben al hacer clone o pull. `~/.claude/commands/` es solo para commands personales.',
    },
  },
  {
    id: 'f-3.2-context-fork',
    ts: '3.2',
    front: {
      en: 'What does `context: fork` do in a skill\'s `SKILL.md` frontmatter?',
      es: '¿Qué hace `context: fork` en el frontmatter del `SKILL.md` de un skill?',
    },
    back: {
      en: 'It runs the skill in an isolated sub-agent context, so verbose output (e.g. codebase analysis) or exploratory work (e.g. brainstorming) does not pollute the main conversation.',
      es: 'Ejecuta el skill en un contexto de sub-agente aislado, así la salida extensa (p. ej. análisis del código) o el trabajo exploratorio (p. ej. lluvia de ideas) no ensucia la conversación principal.',
    },
  },
  {
    id: 'f-3.2-allowed-tools',
    ts: '3.2',
    front: {
      en: 'How do you stop a skill from taking destructive actions while it runs?',
      es: '¿Cómo evitas que un skill haga acciones destructivas mientras se ejecuta?',
    },
    back: {
      en: 'Set `allowed-tools` in the skill\'s frontmatter to restrict which tools it can use during execution, for example only file write operations.',
      es: 'Define `allowed-tools` en el frontmatter del skill para limitar qué herramientas puede usar durante la ejecución, por ejemplo solo operaciones de escritura de ficheros.',
    },
  },
  {
    id: 'f-3.2-skill-vs-claudemd',
    ts: '3.2',
    front: {
      en: 'Universal team standards vs a task-specific workflow: which goes in `CLAUDE.md` and which in a skill?',
      es: 'Estándares universales del equipo frente a un flujo de una tarea concreta: ¿qué va en `CLAUDE.md` y qué en un skill?',
    },
    back: {
      en: 'Universal standards go in `CLAUDE.md`, which is always loaded. Task-specific workflows go in skills, which are invoked on demand.',
      es: 'Los estándares universales van en `CLAUDE.md`, que se carga siempre. Los flujos de tareas concretas van en skills, que se invocan bajo demanda.',
    },
  },
  {
    id: 'f-3.2-personal-variant',
    ts: '3.2',
    front: {
      en: 'You want your own version of a team skill without affecting teammates. What do you do?',
      es: 'Quieres tu propia versión de un skill del equipo sin afectar a tus compañeros. ¿Qué haces?',
    },
    back: {
      en: 'Create a personal variant in `~/.claude/skills/` with a different name. The shared project skill stays unchanged for everyone else.',
      es: 'Crea una variante personal en `~/.claude/skills/` con otro nombre. El skill compartido del proyecto sigue igual para los demás.',
    },
  },
  {
    id: 'f-3.3-paths-frontmatter',
    ts: '3.3',
    front: {
      en: 'How do you make a rule file in `.claude/rules/` load only for Terraform files?',
      es: '¿Cómo haces que un fichero de `.claude/rules/` se cargue solo con ficheros de Terraform?',
    },
    back: {
      en: 'Add YAML frontmatter with a `paths` field of glob patterns, e.g. `paths: ["terraform/**/*"]`. The rule then loads only when Claude edits matching files.',
      es: 'Añade frontmatter YAML con un campo `paths` de patrones glob, p. ej. `paths: ["terraform/**/*"]`. Así la regla solo se carga cuando Claude edita ficheros que coinciden.',
    },
  },
  {
    id: 'f-3.3-spread-tests',
    ts: '3.3',
    front: {
      en: 'Test files sit next to their source code all over the repo. Path rule or subdirectory `CLAUDE.md`?',
      es: 'Los tests están junto a su código por todo el repo. ¿Regla por ruta o `CLAUDE.md` por subdirectorio?',
    },
    back: {
      en: 'A path rule in `.claude/rules/` with a glob like `**/*.test.tsx`. A subdirectory `CLAUDE.md` is tied to one directory and cannot easily cover files spread across the codebase.',
      es: 'Una regla por ruta en `.claude/rules/` con un glob como `**/*.test.tsx`. Un `CLAUDE.md` de subdirectorio está atado a un directorio y no cubre bien ficheros repartidos por todo el código.',
    },
  },
  {
    id: 'f-3.3-token-benefit',
    ts: '3.3',
    front: {
      en: 'Why do path-scoped rules save context compared with putting every convention in the root `CLAUDE.md`?',
      es: '¿Por qué las reglas por ruta ahorran contexto frente a meter todas las convenciones en el `CLAUDE.md` raíz?',
    },
    back: {
      en: 'They load only when Claude edits matching files, so irrelevant conventions stay out of context and token usage goes down.',
      es: 'Solo se cargan cuando Claude edita ficheros que coinciden, así las convenciones irrelevantes quedan fuera del contexto y se gastan menos tokens.',
    },
  },
  {
    id: 'f-3.3-skill-vs-rule',
    ts: '3.3',
    front: {
      en: 'Conventions must apply automatically based on file path. Why not put them in skills?',
      es: 'Las convenciones deben aplicarse solas según la ruta del fichero. ¿Por qué no meterlas en skills?',
    },
    back: {
      en: 'Skills must be invoked, or depend on Claude choosing to load them. Rules in `.claude/rules/` with `paths` load deterministically whenever a matching file is edited.',
      es: 'Los skills hay que invocarlos o dependen de que Claude decida cargarlos. Las reglas de `.claude/rules/` con `paths` se cargan de forma determinista al editar un fichero que coincide.',
    },
  },
  {
    id: 'f-3.4-microservices',
    ts: '3.4',
    front: {
      en: 'You must split a monolith into microservices across dozens of files. Plan mode or direct execution?',
      es: 'Tienes que partir un monolito en microservicios tocando decenas de ficheros. ¿Plan mode o ejecución directa?',
    },
    back: {
      en: 'Plan mode. The task involves architectural decisions, many files and several valid approaches; exploring and designing first prevents costly rework.',
      es: 'Plan mode. La tarea implica decisiones de arquitectura, muchos ficheros y varios enfoques válidos; explorar y diseñar primero evita retrabajo caro.',
    },
  },
  {
    id: 'f-3.4-single-fix',
    ts: '3.4',
    front: {
      en: 'A bug in one file with a clear stack trace. Plan mode or direct execution?',
      es: 'Un bug en un solo fichero con un stack trace claro. ¿Plan mode o ejecución directa?',
    },
    back: {
      en: 'Direct execution. The change is simple, well understood and clearly scoped, so it does not need a planning phase.',
      es: 'Ejecución directa. El cambio es simple, se entiende bien y está claramente acotado, así que no necesita fase de planificación.',
    },
  },
  {
    id: 'f-3.4-explore',
    ts: '3.4',
    front: {
      en: 'What is the Explore subagent for?',
      es: '¿Para qué sirve el subagente Explore?',
    },
    back: {
      en: 'It runs verbose discovery in isolation and returns a summary, so a multi-phase task does not exhaust the main conversation\'s context window.',
      es: 'Hace el descubrimiento extenso de forma aislada y devuelve un resumen, para que una tarea de varias fases no agote la ventana de contexto principal.',
    },
  },
  {
    id: 'f-3.4-combine',
    ts: '3.4',
    front: {
      en: 'How do plan mode and direct execution work together on a library migration?',
      es: '¿Cómo se combinan plan mode y ejecución directa en una migración de librería?',
    },
    back: {
      en: 'Use plan mode to investigate and design the migration, then switch to direct execution to implement the planned approach.',
      es: 'Usa plan mode para investigar y diseñar la migración, y luego pasa a ejecución directa para implementar el enfoque planificado.',
    },
  },
  {
    id: 'f-3.4-switch-late',
    ts: '3.4',
    front: {
      en: 'Why not start a known-complex task in direct execution and switch to plan mode only if trouble appears?',
      es: '¿Por qué no empezar en ejecución directa una tarea que ya sabes compleja y pasar a plan mode solo si hay problemas?',
    },
    back: {
      en: 'The complexity is already stated in the requirements. Finding dependencies late, during implementation, causes the costly rework that planning first avoids.',
      es: 'La complejidad ya está en los requisitos. Descubrir dependencias tarde, en plena implementación, provoca el retrabajo caro que planificar primero evita.',
    },
  },
  {
    id: 'f-3.5-io-examples',
    ts: '3.5',
    front: {
      en: 'Claude applies your prose description of a transformation inconsistently. What is the best fix?',
      es: 'Claude aplica de forma inconsistente tu descripción en prosa de una transformación. ¿Cuál es la mejor solución?',
    },
    back: {
      en: 'Give 2-3 concrete input/output examples. Examples are the most effective way to communicate an expected transformation when prose is read inconsistently.',
      es: 'Da 2-3 ejemplos concretos de entrada/salida. Los ejemplos son la forma más eficaz de comunicar una transformación cuando la prosa se interpreta de forma inconsistente.',
    },
  },
  {
    id: 'f-3.5-tdd',
    ts: '3.5',
    front: {
      en: 'What is test-driven iteration with Claude Code?',
      es: '¿Qué es la iteración guiada por tests con Claude Code?',
    },
    back: {
      en: 'Write tests for expected behavior, edge cases and performance before implementing, then iterate by sharing the test failures with Claude until they pass.',
      es: 'Escribir tests de comportamiento esperado, casos límite y rendimiento antes de implementar, e iterar compartiendo con Claude los fallos hasta que pasen.',
    },
  },
  {
    id: 'f-3.5-interview',
    ts: '3.5',
    front: {
      en: 'What is the interview pattern and when is it useful?',
      es: '¿Qué es el patrón entrevista y cuándo es útil?',
    },
    back: {
      en: 'Claude asks you questions before implementing, to surface considerations you may have missed, like cache invalidation or failure modes. It helps most in unfamiliar domains.',
      es: 'Claude te hace preguntas antes de implementar para sacar a la luz aspectos que quizá no habías previsto, como la invalidación de caché o los modos de fallo. Ayuda sobre todo en dominios que no conoces.',
    },
  },
  {
    id: 'f-3.5-interacting',
    ts: '3.5',
    front: {
      en: 'You have several issues to fix. One message or one at a time?',
      es: 'Tienes varios problemas que arreglar. ¿Un solo mensaje o de uno en uno?',
    },
    back: {
      en: 'If the fixes interact, describe all the issues in one detailed message. If they are independent, fix them sequentially.',
      es: 'Si los arreglos interactúan, describe todos los problemas en un único mensaje detallado. Si son independientes, arréglalos de uno en uno.',
    },
  },
  {
    id: 'f-3.5-edge-case',
    ts: '3.5',
    front: {
      en: 'A migration script mishandles null values. How do you guide the fix?',
      es: 'Un script de migración trata mal los valores null. ¿Cómo guías el arreglo?',
    },
    back: {
      en: 'Give a specific test case: example input containing nulls plus the expected output, instead of a general description of the problem.',
      es: 'Da un caso de prueba concreto: una entrada de ejemplo con nulls y la salida esperada, en lugar de una descripción general del problema.',
    },
  },
  {
    id: 'f-3.6-hang',
    ts: '3.6',
    front: {
      en: 'A CI job runs `claude "Analyze this PR"` and hangs waiting for input. What is the fix?',
      es: 'Un job de CI ejecuta `claude "Analyze this PR"` y se queda esperando entrada. ¿Cómo se arregla?',
    },
    back: {
      en: 'Add the `-p` (or `--print`) flag. Claude Code then runs non-interactively: it processes the prompt, prints the result to stdout and exits.',
      es: 'Añade el flag `-p` (o `--print`). Así Claude Code se ejecuta en modo no interactivo: procesa el prompt, escribe el resultado en stdout y termina.',
    },
  },
  {
    id: 'f-3.6-json',
    ts: '3.6',
    front: {
      en: 'How do you get CI review findings that a script can post automatically as inline PR comments?',
      es: '¿Cómo obtienes hallazgos de revisión en CI que un script pueda publicar solo como comentarios inline en la PR?',
    },
    back: {
      en: 'Run Claude Code with `--output-format json` and `--json-schema`, so the findings come out structured and machine-parseable.',
      es: 'Ejecuta Claude Code con `--output-format json` y `--json-schema`, para que los hallazgos salgan estructurados y parseables por máquina.',
    },
  },
  {
    id: 'f-3.6-independent-review',
    ts: '3.6',
    front: {
      en: 'Why review code with a separate Claude instance instead of the session that wrote it?',
      es: '¿Por qué revisar el código con otra instancia de Claude y no con la sesión que lo escribió?',
    },
    back: {
      en: 'Session context isolation: the session that generated the code is less effective at reviewing its own changes than an independent review instance.',
      es: 'Aislamiento del contexto de sesión: la sesión que generó el código es menos eficaz revisando sus propios cambios que una instancia de revisión independiente.',
    },
  },
  {
    id: 'f-3.6-rerun',
    ts: '3.6',
    front: {
      en: 'Re-running the review after new commits floods the PR with duplicate comments. What do you change?',
      es: 'Repetir la revisión tras nuevos commits llena la PR de comentarios duplicados. ¿Qué cambias?',
    },
    back: {
      en: 'Include the prior review findings in context and tell Claude to report only new or still-unaddressed issues.',
      es: 'Incluye en el contexto los hallazgos de la revisión anterior y pide a Claude que informe solo de problemas nuevos o aún sin resolver.',
    },
  },
  {
    id: 'f-3.6-test-gen',
    ts: '3.6',
    front: {
      en: 'CI test generation produces low-value tests and repeats existing ones. What helps?',
      es: 'La generación de tests en CI produce tests de poco valor y repite los que ya existen. ¿Qué ayuda?',
    },
    back: {
      en: 'Document testing standards, valuable test criteria and available fixtures in `CLAUDE.md`, and provide the existing test files in context so covered scenarios are not suggested again.',
      es: 'Documenta en `CLAUDE.md` los estándares de testing, qué tests aportan valor y los fixtures disponibles, y pasa los tests existentes en el contexto para no repetir escenarios ya cubiertos.',
    },
  },
  {
    id: 'f-4.1-explicit-vs-vague',
    ts: '4.1',
    front: {
      en: 'Which cuts false positives better: "check that comments are accurate" or a specific rule?',
      es: '¿Qué reduce mejor los falsos positivos: "revisa que los comentarios sean correctos" o una regla concreta?',
    },
    back: {
      en: 'A specific rule, e.g. "flag a comment only when its claimed behavior contradicts the actual code". Explicit criteria define exactly what counts as an issue; vague instructions leave the model guessing.',
      es: 'La regla concreta, p. ej. "marca un comentario solo si lo que dice contradice el código real". Los criterios explícitos definen qué es un problema; las instrucciones vagas dejan al modelo adivinando.',
    },
  },
  {
    id: 'f-4.1-be-conservative',
    ts: '4.1',
    front: {
      en: 'Does adding "be conservative" or "only report high-confidence findings" fix low precision?',
      es: '¿Añadir "be conservative" o "reporta solo hallazgos de alta confianza" arregla la baja precisión?',
    },
    back: {
      en: 'No. General instructions like these do not improve precision. Define categorical criteria instead: which issues to report (bugs, security) and which to skip (minor style, local patterns).',
      es: 'No. Instrucciones genéricas así no mejoran la precisión. Define criterios por categorías: qué reportar (bugs, seguridad) y qué ignorar (estilo menor, patrones locales).',
    },
  },
  {
    id: 'f-4.1-disable-noisy-category',
    ts: '4.1',
    front: {
      en: 'One review category produces many false positives and developers now ignore all findings. Quick fix?',
      es: 'Una categoría de revisión da muchos falsos positivos y los devs ya ignoran todos los hallazgos. ¿Arreglo rápido?',
    },
    back: {
      en: 'Temporarily disable that high false-positive category to restore trust, and improve its prompt criteria before turning it back on. Noisy categories undermine trust in the accurate ones.',
      es: 'Desactiva temporalmente esa categoría para recuperar la confianza y mejora sus criterios en el prompt antes de reactivarla. Las categorías ruidosas minan la confianza en las que aciertan.',
    },
  },
  {
    id: 'f-4.1-severity-examples',
    ts: '4.1',
    front: {
      en: 'How do you get consistent severity classification across findings?',
      es: '¿Cómo consigues una clasificación de severidad consistente entre hallazgos?',
    },
    back: {
      en: 'Define explicit criteria for each severity level and include concrete code examples for every level.',
      es: 'Define criterios explícitos para cada nivel de severidad e incluye ejemplos de código concretos para cada nivel.',
    },
  },
  {
    id: 'f-4.2-when-few-shot',
    ts: '4.2',
    front: {
      en: 'Detailed instructions still give inconsistently formatted output. What is the most effective technique?',
      es: 'Las instrucciones detalladas siguen dando un formato inconsistente. ¿Cuál es la técnica más eficaz?',
    },
    back: {
      en: 'Few-shot examples that show the exact output you want (e.g. location, issue, severity, suggested fix). For format consistency they beat adding more instructions.',
      es: 'Ejemplos few-shot que muestren la salida exacta que quieres (p. ej. ubicación, problema, severidad, corrección sugerida). Para la consistencia de formato funcionan mejor que añadir instrucciones.',
    },
  },
  {
    id: 'f-4.2-ambiguous-reasoning',
    ts: '4.2',
    front: {
      en: 'Besides the right answer, what should few-shot examples for ambiguous cases contain?',
      es: 'Además de la respuesta correcta, ¿qué deben contener los ejemplos few-shot de casos ambiguos?',
    },
    back: {
      en: 'The reasoning for why that action was chosen over plausible alternatives. Use 2-4 targeted examples; the reasoning lets the model generalize to new cases.',
      es: 'El razonamiento de por qué se eligió esa acción frente a alternativas plausibles. Usa 2-4 ejemplos bien elegidos; el razonamiento permite al modelo generalizar a casos nuevos.',
    },
  },
  {
    id: 'f-4.2-generalize',
    ts: '4.2',
    front: {
      en: 'Do few-shot examples only work for the exact cases they show?',
      es: '¿Los ejemplos few-shot solo sirven para los casos exactos que muestran?',
    },
    back: {
      en: 'No. Well-chosen examples let the model generalize its judgment to novel patterns. Examples that separate acceptable code patterns from genuine issues reduce false positives on unseen code.',
      es: 'No. Unos ejemplos bien elegidos permiten al modelo generalizar su criterio a patrones nuevos. Los que separan patrones aceptables de problemas reales reducen falsos positivos en código no visto.',
    },
  },
  {
    id: 'f-4.2-varied-formats',
    ts: '4.2',
    front: {
      en: 'Extraction returns empty or null required fields on documents with unusual layouts. What helps?',
      es: 'La extracción devuelve campos obligatorios vacíos o null en documentos con formatos poco habituales. ¿Qué ayuda?',
    },
    back: {
      en: 'Few-shot examples showing correct extraction from varied formats (inline citations vs bibliographies, methodology sections vs embedded details). They also reduce hallucination.',
      es: 'Ejemplos few-shot con la extracción correcta en formatos variados (citas en línea vs bibliografías, sección de metodología vs detalles repartidos). También reducen las alucinaciones.',
    },
  },
  {
    id: 'f-4.3-most-reliable',
    ts: '4.3',
    front: {
      en: 'What is the most reliable way to get schema-compliant structured output from Claude?',
      es: '¿Cuál es la forma más fiable de obtener de Claude salida estructurada conforme a un schema?',
    },
    back: {
      en: 'Tool use: define a tool whose input schema is your JSON schema and read the data from the `tool_use` response. It eliminates JSON syntax errors.',
      es: 'Tool use: define una herramienta cuyo input schema sea tu JSON schema y lee los datos de la respuesta `tool_use`. Elimina los errores de sintaxis JSON.',
    },
  },
  {
    id: 'f-4.3-tool-choice-modes',
    ts: '4.3',
    front: {
      en: 'Compare `tool_choice` `"auto"`, `"any"` and forced tool selection.',
      es: 'Compara `tool_choice` `"auto"`, `"any"` y forzar una herramienta concreta.',
    },
    back: {
      en: '`"auto"`: the model may answer with text instead. `"any"`: it must call a tool but picks which. Forced, e.g. `{"type": "tool", "name": "extract_metadata"}`: it must call that tool.',
      es: '`"auto"`: el modelo puede responder con texto. `"any"`: debe llamar a una herramienta, pero elige cuál. Forzada, p. ej. `{"type": "tool", "name": "extract_metadata"}`: debe llamar a esa.',
    },
  },
  {
    id: 'f-4.3-unknown-doc-type',
    ts: '4.3',
    front: {
      en: 'You have several extraction schemas and do not know the document type. Which `tool_choice`?',
      es: 'Tienes varios schemas de extracción y no sabes el tipo de documento. ¿Qué `tool_choice` usas?',
    },
    back: {
      en: '`"any"`. It guarantees a tool call, so you always get structured output, while letting the model pick the schema that fits the document.',
      es: '`"any"`. Garantiza una llamada a herramienta, así que siempre obtienes salida estructurada, y deja que el modelo elija el schema que encaja con el documento.',
    },
  },
  {
    id: 'f-4.3-nullable',
    ts: '4.3',
    front: {
      en: 'The model invents values for fields the source does not contain. What schema change fixes it?',
      es: 'El modelo se inventa valores para campos que no están en la fuente. ¿Qué cambio en el schema lo arregla?',
    },
    back: {
      en: 'Make those fields optional (nullable). Required fields push the model to fabricate a value to satisfy the schema; nullable lets it return null.',
      es: 'Haz esos campos opcionales (nullable). Los campos obligatorios empujan al modelo a inventar un valor para cumplir el schema; con nullable puede devolver null.',
    },
  },
  {
    id: 'f-4.3-other-unclear',
    ts: '4.3',
    front: {
      en: 'How do you design an enum for categories that will grow and for ambiguous cases?',
      es: '¿Cómo diseñas un enum para categorías que crecerán y para casos ambiguos?',
    },
    back: {
      en: 'Add an `"other"` value plus a detail string field for new categories, and an `"unclear"` value for ambiguous cases, so the model is not forced into a wrong category.',
      es: 'Añade un valor `"other"` más un campo string de detalle para categorías nuevas, y un valor `"unclear"` para casos ambiguos, para que el modelo no fuerce una categoría incorrecta.',
    },
  },
  {
    id: 'f-4.4-syntax-vs-semantic',
    ts: '4.4',
    front: {
      en: 'Tool use eliminated JSON syntax errors. Which errors can still happen?',
      es: 'Tool use ha eliminado los errores de sintaxis JSON. ¿Qué errores pueden seguir apareciendo?',
    },
    back: {
      en: 'Semantic errors: line items that do not sum to the total, values placed in the wrong field. You need your own validation to catch them.',
      es: 'Errores semánticos: líneas que no suman el total, valores en el campo equivocado. Necesitas tu propia validación para detectarlos.',
    },
  },
  {
    id: 'f-4.4-retry-payload',
    ts: '4.4',
    front: {
      en: 'What should a retry request include so the model can fix a failed extraction?',
      es: '¿Qué debe incluir una petición de reintento para que el modelo corrija una extracción fallida?',
    },
    back: {
      en: 'The original document, the failed extraction and the specific validation errors. This is retry-with-error-feedback.',
      es: 'El documento original, la extracción fallida y los errores de validación concretos. Esto es retry-with-error-feedback.',
    },
  },
  {
    id: 'f-4.4-retry-limits',
    ts: '4.4',
    front: {
      en: 'When will retrying an extraction NOT help?',
      es: '¿Cuándo NO servirá de nada reintentar una extracción?',
    },
    back: {
      en: 'When the required information is absent from the source, e.g. it only exists in an external document you did not provide. Retries do help with format mismatches and structural output errors.',
      es: 'Cuando la información requerida no está en la fuente, p. ej. solo existe en un documento externo que no aportaste. Los reintentos sí ayudan con formatos que no encajan y errores de estructura.',
    },
  },
  {
    id: 'f-4.4-calculated-total',
    ts: '4.4',
    front: {
      en: 'How can the output itself flag that an invoice\'s numbers do not add up?',
      es: '¿Cómo puede la propia salida señalar que los números de una factura no cuadran?',
    },
    back: {
      en: 'Extract `calculated_total` (sum of the line items) alongside `stated_total` and compare them; add a `conflict_detected` boolean when the source data is inconsistent.',
      es: 'Extrae `calculated_total` (suma de las líneas) junto a `stated_total` y compáralos; añade un booleano `conflict_detected` cuando los datos de la fuente sean incoherentes.',
    },
  },
  {
    id: 'f-4.4-detected-pattern',
    ts: '4.4',
    front: {
      en: 'Developers dismiss many review findings. What field helps you find out why?',
      es: 'Los devs descartan muchos hallazgos de la revisión. ¿Qué campo te ayuda a averiguar por qué?',
    },
    back: {
      en: 'A `detected_pattern` field on each finding that records which code construct triggered it, so you can analyze which patterns get dismissed as false positives.',
      es: 'Un campo `detected_pattern` en cada hallazgo que registre qué construcción de código lo provocó, para analizar qué patrones se descartan como falsos positivos.',
    },
  },
  {
    id: 'f-4.5-batch-facts',
    ts: '4.5',
    front: {
      en: 'What are the key facts of the Message Batches API?',
      es: '¿Cuáles son los datos clave de la Message Batches API?',
    },
    back: {
      en: '50% cheaper, a processing window of up to 24 hours, no guaranteed latency SLA, and no multi-turn tool calling inside a single request.',
      es: 'Un 50% más barata, ventana de procesamiento de hasta 24 horas, sin SLA de latencia garantizado y sin tool calling multi-turno dentro de una misma petición.',
    },
  },
  {
    id: 'f-4.5-blocking-vs-overnight',
    ts: '4.5',
    front: {
      en: 'A blocking pre-merge check and an overnight tech-debt report: which should use batches?',
      es: 'Un check pre-merge bloqueante y un informe nocturno de deuda técnica: ¿cuál debería ir por batches?',
    },
    back: {
      en: 'Only the overnight report. Blocking checks need the synchronous API because batches have no latency guarantee; latency-tolerant jobs (overnight, weekly) fit batches.',
      es: 'Solo el informe nocturno. Los checks bloqueantes necesitan la API síncrona porque los batches no garantizan latencia; los trabajos que toleran espera (nocturnos, semanales) encajan en batches.',
    },
  },
  {
    id: 'f-4.5-custom-id',
    ts: '4.5',
    front: {
      en: 'How do you match batch responses to requests and retry only what failed?',
      es: '¿Cómo emparejas las respuestas del batch con sus peticiones y reintentas solo lo que falló?',
    },
    back: {
      en: 'Use `custom_id` on each request. Resubmit only the failed items by `custom_id`, with fixes such as chunking documents that exceeded the context limit.',
      es: 'Usa `custom_id` en cada petición. Reenvía solo los elementos fallidos por `custom_id`, con correcciones como trocear documentos que superaron el límite de contexto.',
    },
  },
  {
    id: 'f-4.5-sla-window',
    ts: '4.5',
    front: {
      en: 'Batches take up to 24 hours and your SLA is 30 hours. How often should you submit?',
      es: 'Los batches tardan hasta 24 horas y tu SLA es de 30 horas. ¿Cada cuánto envías?',
    },
    back: {
      en: 'Every 4 hours. A document waits at most 4 hours for the next submission plus up to 24 hours of processing: 28 hours, inside the 30-hour SLA.',
      es: 'Cada 4 horas. Un documento espera como mucho 4 horas al siguiente envío más hasta 24 horas de procesamiento: 28 horas, dentro del SLA de 30.',
    },
  },
  {
    id: 'f-4.5-sample-first',
    ts: '4.5',
    front: {
      en: 'What should you do before batch-processing a large volume of documents?',
      es: '¿Qué deberías hacer antes de procesar por lotes un gran volumen de documentos?',
    },
    back: {
      en: 'Refine the prompt on a sample set first. Higher first-pass success means fewer failed items and fewer costly resubmissions.',
      es: 'Afinar el prompt con un conjunto de muestra. Más acierto a la primera significa menos fallos y menos reenvíos costosos.',
    },
  },
  {
    id: 'f-4.6-self-review',
    ts: '4.6',
    front: {
      en: 'Why is asking the same session to review its own code weak?',
      es: '¿Por qué es débil pedir a la misma sesión que revise su propio código?',
    },
    back: {
      en: 'The model keeps the reasoning context from generation, so it is less likely to question its own decisions. Self-review instructions and extended thinking do not fix this.',
      es: 'El modelo conserva el razonamiento de la generación y tiende a no cuestionar sus decisiones. Pedirle autorrevisión o usar extended thinking no lo resuelve.',
    },
  },
  {
    id: 'f-4.6-independent-instance',
    ts: '4.6',
    front: {
      en: 'What is the best way to review code that Claude just generated?',
      es: '¿Cuál es la mejor forma de revisar código que Claude acaba de generar?',
    },
    back: {
      en: 'Use a second, independent Claude instance that does not have the generator\'s reasoning context. It catches subtle issues the generator would miss.',
      es: 'Usar una segunda instancia de Claude independiente, sin el contexto de razonamiento del generador. Detecta problemas sutiles que el generador pasaría por alto.',
    },
  },
  {
    id: 'f-4.6-multi-pass',
    ts: '4.6',
    front: {
      en: 'A 14-file PR review is shallow on some files and contradicts itself. How do you restructure it?',
      es: 'La revisión de un PR de 14 ficheros es superficial en algunos y se contradice. ¿Cómo la reestructuras?',
    },
    back: {
      en: 'Multi-pass: analyze each file on its own for local issues, then run a separate integration pass for cross-file data flow. This avoids attention dilution.',
      es: 'Multi-pasada: analiza cada fichero por separado para problemas locales y luego haz una pasada de integración aparte para el flujo de datos entre ficheros. Así evitas la dilución de atención.',
    },
  },
  {
    id: 'f-4.6-wrong-fixes',
    ts: '4.6',
    front: {
      en: 'Why not use a bigger context window, or flag only issues found in 2 of 3 full-PR runs?',
      es: '¿Por qué no usar una ventana de contexto mayor, o marcar solo lo que aparece en 2 de 3 pasadas completas?',
    },
    back: {
      en: 'A bigger context does not fix attention quality. Consensus voting suppresses real bugs that are only caught intermittently. Split the review into focused passes instead.',
      es: 'Más contexto no arregla la calidad de la atención. Votar por consenso suprime bugs reales que solo se detectan a veces. Divide la revisión en pasadas centradas.',
    },
  },
  {
    id: 'f-4.6-confidence-routing',
    ts: '4.6',
    front: {
      en: 'In a verification pass, what can the model add to each finding to route review effort?',
      es: 'En una pasada de verificación, ¿qué puede añadir el modelo a cada hallazgo para enrutar la revisión?',
    },
    back: {
      en: 'A self-reported confidence level next to each finding, which enables calibrated review routing instead of treating every finding the same.',
      es: 'Un nivel de confianza autoevaluado junto a cada hallazgo, que permite enrutar la revisión de forma calibrada en vez de tratar todos los hallazgos igual.',
    },
  },
  {
    id: 'f-5.1-summarization-risk',
    ts: '5.1',
    front: {
      en: 'What does progressive summarization tend to lose in a long support chat?',
      es: '¿Qué suele perder la progressive summarization en un chat de soporte largo?',
    },
    back: {
      en: 'Exact values: amounts, percentages, dates and what the customer was told to expect. They get condensed into vague phrases, so keep them in a separate case facts block.',
      es: 'Los valores exactos: importes, porcentajes, fechas y lo que el cliente espera. Se condensan en frases vagas, así que guárdalos en un bloque de case facts aparte.',
    },
  },
  {
    id: 'f-5.1-case-facts-block',
    ts: '5.1',
    front: {
      en: 'Where should transactional facts like order numbers and amounts live in a long session?',
      es: '¿Dónde deben vivir datos transaccionales como números de pedido e importes en una sesión larga?',
    },
    back: {
      en: 'In a persistent case facts block included in every prompt, outside the summarized history, so summarization never touches them.',
      es: 'En un bloque de case facts persistente que va en cada prompt, fuera del historial resumido, para que la summarization nunca los toque.',
    },
  },
  {
    id: 'f-5.1-lost-in-the-middle',
    ts: '5.1',
    front: {
      en: 'How do you reduce the \'lost in the middle\' effect in a long aggregated input?',
      es: '¿Cómo reduces el efecto \'lost in the middle\' en una entrada agregada larga?',
    },
    back: {
      en: 'Put a key findings summary at the beginning and organize the details under explicit section headers. Models process the start and end of long inputs most reliably.',
      es: 'Pon un resumen de hallazgos clave al principio y organiza el detalle con encabezados de sección explícitos. El modelo procesa mejor el inicio y el final.',
    },
  },
  {
    id: 'f-5.1-trim-tool-output',
    ts: '5.1',
    front: {
      en: 'An order lookup returns 40+ fields; only 5 matter for a return. What should you do?',
      es: 'Una consulta de pedido devuelve más de 40 campos y solo 5 importan para una devolución. ¿Qué haces?',
    },
    back: {
      en: 'Trim the result to the return-relevant fields before it enters context. Tool results accumulate and consume tokens out of proportion to their relevance.',
      es: 'Recorta el resultado a los campos relevantes para la devolución antes de que entre en el contexto. Los resultados se acumulan y gastan tokens desproporcionados.',
    },
  },
  {
    id: 'f-5.1-upstream-structured',
    ts: '5.1',
    front: {
      en: 'A downstream agent has a small context budget. What should upstream agents send it?',
      es: 'Un agente posterior tiene poco presupuesto de contexto. ¿Qué deben enviarle los agentes previos?',
    },
    back: {
      en: 'Structured data: key facts, citations, relevance scores and metadata such as dates and source locations, instead of verbose content and reasoning chains.',
      es: 'Datos estructurados: hechos clave, citas, relevance scores y metadatos como fechas y ubicación de la fuente, en lugar de contenido verboso y cadenas de razonamiento.',
    },
  },
  {
    id: 'f-5.2-explicit-request',
    ts: '5.2',
    front: {
      en: 'Customer says \'I want to talk to a human.\' The issue looks easy. What does the agent do?',
      es: 'El cliente dice \'Quiero hablar con una persona.\' El problema parece fácil. ¿Qué hace el agente?',
    },
    back: {
      en: 'Escalate immediately. An explicit request for a human is honored right away, without investigating or trying to solve the issue first.',
      es: 'Escalar de inmediato. Una petición explícita de un humano se atiende al momento, sin investigar ni intentar resolver el problema antes.',
    },
  },
  {
    id: 'f-5.2-frustrated-simple',
    ts: '5.2',
    front: {
      en: 'The customer is frustrated, but the issue is simple and within the agent\'s capability. Escalate?',
      es: 'El cliente está frustrado, pero el problema es sencillo y el agente puede resolverlo. ¿Escala?',
    },
    back: {
      en: 'Not yet. Acknowledge the frustration and offer to resolve it. Escalate only if the customer repeats that they want a human.',
      es: 'Todavía no. Reconoce la frustración y ofrécete a resolverlo. Escala solo si el cliente insiste en que quiere hablar con una persona.',
    },
  },
  {
    id: 'f-5.2-sentiment-confidence',
    ts: '5.2',
    front: {
      en: 'Why are sentiment and self-reported confidence poor escalation triggers?',
      es: '¿Por qué el sentimiento y la confianza autoevaluada son malos disparadores de escalada?',
    },
    back: {
      en: 'Neither tracks real case complexity. Angry customers often have simple issues, and the model can be confidently wrong on hard cases. Use explicit criteria with few-shot examples.',
      es: 'Ninguno refleja la complejidad real. Un cliente enfadado puede tener un problema simple y el modelo puede fallar muy seguro en casos difíciles. Usa criterios explícitos con few-shot.',
    },
  },
  {
    id: 'f-5.2-multiple-matches',
    ts: '5.2',
    front: {
      en: '`get_customer` returns three customers with the same name. What should the agent do next?',
      es: '`get_customer` devuelve tres clientes con el mismo nombre. ¿Qué debe hacer el agente?',
    },
    back: {
      en: 'Ask the customer for an additional identifier. Don\'t choose one with a heuristic such as most recent activity; a wrong pick acts on the wrong account.',
      es: 'Pedir al cliente un identificador adicional. No elijas con una heurística como la actividad más reciente: si fallas, actúas sobre la cuenta equivocada.',
    },
  },
  {
    id: 'f-5.2-policy-gap',
    ts: '5.2',
    front: {
      en: 'Customer wants a competitor price match; policy only covers own-site price adjustments. What now?',
      es: 'El cliente quiere que iguales el precio de la competencia; la política solo cubre ajustes en tu web. ¿Y ahora?',
    },
    back: {
      en: 'Escalate. When policy is silent or ambiguous on the specific request, that is a policy gap, which is a valid escalation trigger. Don\'t improvise a rule.',
      es: 'Escalar. Si la política calla o es ambigua sobre esa petición concreta, es una laguna, y eso es un disparador válido de escalada. No improvises una norma.',
    },
  },
  {
    id: 'f-5.3-structured-error',
    ts: '5.3',
    front: {
      en: 'What should a subagent\'s error report to the coordinator contain?',
      es: '¿Qué debe incluir el informe de error de un subagente al coordinador?',
    },
    back: {
      en: 'Failure type, what was attempted (e.g. the query), any partial results and possible alternative approaches, so the coordinator can retry, reroute or use partial data.',
      es: 'Tipo de fallo, qué se intentó (p. ej. la consulta), resultados parciales y enfoques alternativos, para que el coordinador reintente, cambie de vía o use lo parcial.',
    },
  },
  {
    id: 'f-5.3-empty-vs-failure',
    ts: '5.3',
    front: {
      en: 'Timeout vs a successful query with zero matches: why report them differently?',
      es: 'Timeout frente a una consulta correcta sin coincidencias: ¿por qué reportarlos distinto?',
    },
    back: {
      en: 'A timeout is an access failure that may need a retry decision. Zero matches is a valid empty result. Mixing them up makes the coordinator retry valid answers or trust missing data.',
      es: 'Un timeout es un fallo de acceso que puede requerir decidir un reintento. Cero coincidencias es un resultado vacío válido. Confundirlos lleva a reintentar lo válido o a fiarse de datos ausentes.',
    },
  },
  {
    id: 'f-5.3-two-antipatterns',
    ts: '5.3',
    front: {
      en: 'Name the two opposite error-handling anti-patterns in multi-agent systems.',
      es: 'Nombra los dos anti-patrones opuestos de gestión de errores en sistemas multiagente.',
    },
    back: {
      en: 'Silently suppressing errors (returning empty results as success) and terminating the whole workflow on a single failure. Both block intelligent recovery.',
      es: 'Suprimir errores en silencio (devolver resultados vacíos como éxito) y terminar todo el flujo por un único fallo. Ambos impiden una recuperación inteligente.',
    },
  },
  {
    id: 'f-5.3-local-recovery',
    ts: '5.3',
    front: {
      en: 'Should a subagent pass every transient failure up to the coordinator?',
      es: '¿Debe un subagente pasar cada fallo transitorio al coordinador?',
    },
    back: {
      en: 'No. It recovers locally from transient failures and propagates only what it cannot resolve, including what it tried and any partial results.',
      es: 'No. Se recupera localmente de los fallos transitorios y solo propaga lo que no puede resolver, incluyendo lo que intentó y los resultados parciales.',
    },
  },
  {
    id: 'f-5.3-coverage-annotation',
    ts: '5.3',
    front: {
      en: 'A source was unavailable during research. How should the final synthesis reflect it?',
      es: 'Una fuente no estuvo disponible durante la investigación. ¿Cómo debe reflejarlo la síntesis final?',
    },
    back: {
      en: 'With coverage annotations: mark which findings are well supported and which topic areas have gaps because of the unavailable source.',
      es: 'Con coverage annotations: indica qué hallazgos están bien respaldados y qué áreas tienen huecos por culpa de la fuente no disponible.',
    },
  },
  {
    id: 'f-5.4-degradation-signs',
    ts: '5.4',
    front: {
      en: 'What are the signs of context degradation in a long codebase exploration session?',
      es: '¿Qué señales indican context degradation en una sesión larga de exploración de código?',
    },
    back: {
      en: 'Inconsistent answers and references to \'typical patterns\' instead of the specific classes the model discovered earlier.',
      es: 'Respuestas inconsistentes y referencias a \'patrones típicos\' en vez de a las clases concretas que el modelo descubrió antes.',
    },
  },
  {
    id: 'f-5.4-scratchpad-file',
    ts: '5.4',
    front: {
      en: 'How do you keep key findings across context boundaries during a long exploration?',
      es: '¿Cómo conservas los hallazgos clave más allá de los límites de contexto en una exploración larga?',
    },
    back: {
      en: 'Have the agent maintain a scratchpad file of key findings and consult it for later questions, instead of relying on what is left in context.',
      es: 'Haz que el agente mantenga un scratchpad file con los hallazgos clave y lo consulte en preguntas posteriores, en vez de fiarse de lo que quede en el contexto.',
    },
  },
  {
    id: 'f-5.4-subagent-isolation',
    ts: '5.4',
    front: {
      en: 'Why delegate \'find all test files\' to a subagent?',
      es: '¿Por qué delegar \'busca todos los ficheros de test\' en un subagente?',
    },
    back: {
      en: 'The subagent absorbs the verbose exploration output in its own context and returns the result, while the main agent keeps high-level coordination.',
      es: 'El subagente absorbe la salida verbosa de la exploración en su propio contexto y devuelve el resultado, mientras el agente principal mantiene la coordinación general.',
    },
  },
  {
    id: 'f-5.4-crash-manifest',
    ts: '5.4',
    front: {
      en: 'How do you design crash recovery for a multi-agent exploration?',
      es: '¿Cómo diseñas la recuperación ante caídas en una exploración multiagente?',
    },
    back: {
      en: 'Each agent exports structured state to a known location. On resume, the coordinator loads the manifest and injects that state into the agent prompts.',
      es: 'Cada agente exporta su estado estructurado a una ubicación conocida. Al reanudar, el coordinador carga el manifest e inyecta ese estado en los prompts de los agentes.',
    },
  },
  {
    id: 'f-5.4-compact',
    ts: '5.4',
    front: {
      en: 'Mid-exploration, context is filling with verbose discovery output. Which command helps?',
      es: 'A mitad de la exploración, el contexto se llena de salida verbosa. ¿Qué comando ayuda?',
    },
    back: {
      en: '`/compact`, which reduces context usage during extended sessions. Keep key findings in a scratchpad file too, so nothing critical depends on what survives.',
      es: '`/compact`, que reduce el uso de contexto en sesiones largas. Guarda también los hallazgos clave en un scratchpad file para que nada crítico dependa de lo que sobreviva.',
    },
  },
  {
    id: 'f-5.5-aggregate-masks',
    ts: '5.5',
    front: {
      en: 'Extraction accuracy is 97% overall. Is it safe to remove human review?',
      es: 'La precisión de extracción es del 97% global. ¿Es seguro quitar la revisión humana?',
    },
    back: {
      en: 'Not yet. The aggregate can hide poor accuracy on specific document types or fields. Validate accuracy per document type and per field first.',
      es: 'Todavía no. El agregado puede ocultar mala precisión en tipos de documento o campos concretos. Valida antes la precisión por tipo de documento y por campo.',
    },
  },
  {
    id: 'f-5.5-stratified-sampling',
    ts: '5.5',
    front: {
      en: 'Why keep stratified random sampling of high-confidence extractions?',
      es: '¿Por qué mantener un stratified random sampling de las extracciones de alta confianza?',
    },
    back: {
      en: 'To keep measuring the real error rate of output that skips review, and to detect novel error patterns that confidence scores alone would not reveal.',
      es: 'Para seguir midiendo la tasa de error real de lo que no pasa por revisión y detectar patrones de error nuevos que la confianza por sí sola no revelaría.',
    },
  },
  {
    id: 'f-5.5-calibration',
    ts: '5.5',
    front: {
      en: 'How do field-level confidence scores become useful for routing to review?',
      es: '¿Cómo se vuelven útiles los field-level confidence scores para enrutar a revisión?',
    },
    back: {
      en: 'Calibrate them against a labeled validation set and use that to set review thresholds. Raw, uncalibrated scores shouldn\'t drive routing on their own.',
      es: 'Calibrándolos con un conjunto de validación etiquetado y usándolo para fijar los umbrales de revisión. Las puntuaciones brutas sin calibrar no deben decidir solas.',
    },
  },
  {
    id: 'f-5.5-review-priority',
    ts: '5.5',
    front: {
      en: 'Reviewer capacity is limited. Which extractions should go to humans?',
      es: 'La capacidad de revisión es limitada. ¿Qué extracciones deben ir a humanos?',
    },
    back: {
      en: 'Those with low model confidence and those coming from ambiguous or contradictory source documents.',
      es: 'Las de baja confianza del modelo y las que vienen de documentos fuente ambiguos o contradictorios.',
    },
  },
  {
    id: 'f-5.6-claim-source-mapping',
    ts: '5.6',
    front: {
      en: 'What must subagents output so provenance survives synthesis?',
      es: '¿Qué deben devolver los subagentes para que la procedencia sobreviva a la síntesis?',
    },
    back: {
      en: 'Structured claim-source mappings: each claim with its source URL or document name and a relevant excerpt. The synthesis agent preserves and merges them.',
      es: 'Claim-source mappings estructurados: cada afirmación con su URL o nombre de documento y un extracto relevante. El agente de síntesis los conserva y fusiona.',
    },
  },
  {
    id: 'f-5.6-conflicting-stats',
    ts: '5.6',
    front: {
      en: 'Two credible sources report different values for the same statistic. What does the analysis do?',
      es: 'Dos fuentes fiables dan valores distintos para la misma estadística. ¿Qué hace el análisis?',
    },
    back: {
      en: 'Include both values, each attributed to its source, and annotate the conflict. Don\'t pick one arbitrarily; the coordinator decides how to reconcile before synthesis.',
      es: 'Incluir ambos valores, cada uno con su fuente, y anotar el conflicto. No elijas uno sin criterio: el coordinador decide cómo conciliarlos antes de la síntesis.',
    },
  },
  {
    id: 'f-5.6-dates',
    ts: '5.6',
    front: {
      en: 'Why require publication or data collection dates in subagent outputs?',
      es: '¿Por qué exigir fechas de publicación o de recogida de datos en la salida de los subagentes?',
    },
    back: {
      en: 'So differences between data from different times are read as change over time, not misinterpreted as contradictions.',
      es: 'Para que las diferencias entre datos de distintas fechas se lean como cambios en el tiempo y no se malinterpreten como contradicciones.',
    },
  },
  {
    id: 'f-5.6-report-sections',
    ts: '5.6',
    front: {
      en: 'How should a multi-source report separate different levels of certainty?',
      es: '¿Cómo debe un informe multifuente separar los distintos niveles de certeza?',
    },
    back: {
      en: 'With explicit sections for well-established findings and for contested ones, keeping the original source characterizations and methodological context.',
      es: 'Con secciones explícitas para los hallazgos consolidados y para los discutidos, conservando cómo los caracteriza la fuente original y su contexto metodológico.',
    },
  },
  {
    id: 'f-5.6-content-types',
    ts: '5.6',
    front: {
      en: 'How should synthesis render financial data, news and technical findings?',
      es: '¿Cómo debe presentar la síntesis datos financieros, noticias y hallazgos técnicos?',
    },
    back: {
      en: 'Financial data as tables, news as prose, technical findings as structured lists. Don\'t convert everything into one uniform format.',
      es: 'Datos financieros en tablas, noticias en prosa y hallazgos técnicos en listas estructuradas. No lo conviertas todo a un formato uniforme.',
    },
  },
];
