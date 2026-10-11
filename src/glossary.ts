// Glosario de términos del examen, en inglés y en español de España, escritos a partir de los task statements
// de la guía oficial (Claude Certified Architect – Foundations Exam Guide v1.0, julio 2026).
// Entre comillas invertidas va el código, que la app resalta.
import type { Term } from './game.ts';

export const TERMS: Term[] = [
  {
    term: 'stop_reason',
    domain: 'agentic',
    def: {
      en: 'Field in Claude\'s response that says why it stopped; the agentic loop checks it to decide whether to continue or finish.',
      es: 'Campo de la respuesta de Claude que indica por qué se detuvo; el bucle agéntico lo consulta para decidir si sigue o termina.',
    },
  },
  {
    term: 'tool_use',
    domain: 'agentic',
    def: {
      en: '`stop_reason` value meaning Claude wants a tool executed: run it, append the result to the history and keep looping.',
      es: 'Valor de `stop_reason` que indica que Claude quiere ejecutar una herramienta: ejecútala, añade el resultado al historial y sigue el bucle.',
    },
  },
  {
    term: 'end_turn',
    domain: 'agentic',
    def: {
      en: '`stop_reason` value meaning Claude has finished; the agentic loop should stop and return the final response.',
      es: 'Valor de `stop_reason` que indica que Claude ha terminado; el bucle agéntico debe parar y devolver la respuesta final.',
    },
  },
  {
    term: 'coordinator',
    domain: 'agentic',
    def: {
      en: 'Agent that decomposes a task, delegates to subagents, aggregates their results and routes all communication between them.',
      es: 'Agente que descompone la tarea, delega en subagentes, agrega sus resultados y enruta toda la comunicación entre ellos.',
    },
  },
  {
    term: 'subagent',
    domain: 'agentic',
    def: {
      en: 'Specialized agent spawned by a coordinator; it runs with isolated context and knows only what is passed in its prompt.',
      es: 'Agente especializado que lanza el coordinador; trabaja con contexto aislado y solo sabe lo que se le pasa en el prompt.',
    },
  },
  {
    term: 'hub-and-spoke',
    domain: 'agentic',
    def: {
      en: 'Multi-agent architecture where the coordinator is the hub: all subagent communication, error handling and routing go through it.',
      es: 'Arquitectura multiagente en la que el coordinador es el centro: toda la comunicación, los errores y el enrutado de los subagentes pasan por él.',
    },
  },
  {
    term: 'Task tool',
    domain: 'agentic',
    def: {
      en: 'Tool a coordinator uses to spawn subagents; the coordinator\'s `allowedTools` must include `Task` for it to work.',
      es: 'Herramienta con la que el coordinador lanza subagentes; su `allowedTools` debe incluir `Task` para que funcione.',
    },
  },
  {
    term: 'AgentDefinition',
    domain: 'agentic',
    def: {
      en: 'Configuration for a subagent type: its description, system prompt and tool restrictions.',
      es: 'Configuración de un tipo de subagente: su descripción, su system prompt y sus restricciones de herramientas.',
    },
  },
  {
    term: 'PostToolUse',
    domain: 'agentic',
    def: {
      en: 'Agent SDK hook that intercepts tool results and transforms them, e.g. normalizing formats, before the model processes them.',
      es: 'Hook del Agent SDK que intercepta los resultados de las herramientas y los transforma (p. ej. normaliza formatos) antes de que los procese el modelo.',
    },
  },
  {
    term: 'programmatic prerequisite',
    domain: 'agentic',
    def: {
      en: 'Code-level gate that blocks a downstream tool call until a required step has completed, e.g. no refund before a verified customer ID.',
      es: 'Barrera en código que bloquea una llamada posterior hasta completar un paso obligatorio, p. ej. ningún reembolso sin ID de cliente verificado.',
    },
  },
  {
    term: 'prompt chaining',
    domain: 'agentic',
    def: {
      en: 'Fixed sequential decomposition into focused steps, e.g. a review pass per file followed by a cross-file integration pass.',
      es: 'Descomposición secuencial fija en pasos acotados, p. ej. una pasada de revisión por archivo y después una pasada de integración entre archivos.',
    },
  },
  {
    term: 'dynamic decomposition',
    domain: 'agentic',
    def: {
      en: 'Adaptive strategy that generates subtasks from what each step discovers; suited to open-ended investigation tasks.',
      es: 'Estrategia adaptativa que genera subtareas según lo que descubre cada paso; adecuada para investigaciones abiertas.',
    },
  },
  {
    term: 'fork_session',
    domain: 'agentic',
    def: {
      en: 'Creates independent branches from a shared analysis baseline so you can explore divergent approaches.',
      es: 'Crea ramas independientes desde una base de análisis común para explorar enfoques distintos.',
    },
  },
  {
    term: '--resume',
    domain: 'agentic',
    def: {
      en: 'Continues a specific prior conversation by name, written as `--resume <session-name>`.',
      es: 'Continúa una conversación anterior concreta por su nombre, con la forma `--resume <session-name>`.',
    },
  },
  {
    term: 'tool description',
    domain: 'tools',
    def: {
      en: 'Text on a tool that says what it does, its inputs and outputs, and when to use it. The main signal the model uses to choose between tools.',
      es: 'Texto de una herramienta que dice qué hace, qué recibe y devuelve, y cuándo usarla. Es la señal principal con la que el modelo elige entre herramientas.',
    },
  },
  {
    term: 'isError',
    domain: 'tools',
    def: {
      en: 'MCP flag in a tool result that tells the agent the tool call failed, so it can decide how to recover.',
      es: 'Flag de MCP en el resultado de una herramienta que indica al agente que la llamada falló, para que decida cómo recuperarse.',
    },
  },
  {
    term: 'errorCategory',
    domain: 'tools',
    def: {
      en: 'Structured error field naming the kind of failure (transient, validation or permission) so the agent can pick the right recovery.',
      es: 'Campo de un error estructurado que indica el tipo de fallo (transient, validation o permission) para que el agente elija la recuperación adecuada.',
    },
  },
  {
    term: 'isRetryable',
    domain: 'tools',
    def: {
      en: 'Boolean in a structured error saying whether a retry could succeed. It prevents wasted retries on errors that will fail again.',
      es: 'Booleano de un error estructurado que indica si reintentar puede funcionar. Evita reintentos inútiles en errores que volverán a fallar.',
    },
  },
  {
    term: 'transient error',
    domain: 'tools',
    def: {
      en: 'Temporary failure such as a timeout or an unavailable service. Usually worth retrying, ideally locally inside the subagent.',
      es: 'Fallo temporal, como un timeout o un servicio no disponible. Suele merecer reintento, idealmente en local dentro del subagente.',
    },
  },
  {
    term: 'valid empty result',
    domain: 'tools',
    def: {
      en: 'A query that ran successfully but found no matches. It is a real answer, not an access failure, and needs no retry.',
      es: 'Consulta que se ejecutó bien pero no encontró coincidencias. Es una respuesta real, no un fallo de acceso, y no requiere reintento.',
    },
  },
  {
    term: 'tool_choice',
    domain: 'tools',
    def: {
      en: 'API setting for tool calls: `"auto"` (model may answer in text), `"any"` (must call some tool) or forced selection of one named tool.',
      es: 'Ajuste de la API para llamadas a herramientas: `"auto"` (puede responder con texto), `"any"` (debe llamar a alguna) o forzar una herramienta concreta.',
    },
  },
  {
    term: 'forced tool selection',
    domain: 'tools',
    def: {
      en: '`tool_choice` set to `{"type": "tool", "name": "..."}` so the model must call that exact tool, e.g. `extract_metadata` first.',
      es: '`tool_choice` con `{"type": "tool", "name": "..."}` para que el modelo llame a esa herramienta exacta, p. ej. `extract_metadata` primero.',
    },
  },
  {
    term: '.mcp.json',
    domain: 'tools',
    def: {
      en: 'Project-scoped MCP server config for shared team tooling. Supports environment variable expansion so secrets are not committed.',
      es: 'Configuración de servidores MCP a nivel de proyecto, para herramientas compartidas del equipo. Admite expansión de variables de entorno para no subir secretos.',
    },
  },
  {
    term: '~/.claude.json',
    domain: 'tools',
    def: {
      en: 'User-scoped config for personal or experimental MCP servers that should not be shared with the team.',
      es: 'Configuración a nivel de usuario para servidores MCP personales o experimentales que no deben compartirse con el equipo.',
    },
  },
  {
    term: 'environment variable expansion',
    domain: 'tools',
    def: {
      en: 'Writing `${VAR}`, e.g. `${GITHUB_TOKEN}`, in `.mcp.json` so the value comes from the environment instead of being committed.',
      es: 'Escribir `${VAR}`, p. ej. `${GITHUB_TOKEN}`, en `.mcp.json` para que el valor salga del entorno en vez de subirse al repositorio.',
    },
  },
  {
    term: 'MCP resources',
    domain: 'tools',
    def: {
      en: 'MCP mechanism to expose content catalogs (issue summaries, doc hierarchies, database schemas) so agents see available data without exploratory calls.',
      es: 'Mecanismo de MCP para exponer catálogos de contenido (issues, jerarquías de docs, esquemas de BD) y que el agente vea los datos sin llamadas exploratorias.',
    },
  },
  {
    term: 'Grep',
    domain: 'tools',
    def: {
      en: 'Built-in tool that searches file contents for patterns such as function names, callers, error messages or imports.',
      es: 'Herramienta integrada que busca patrones dentro del contenido de los ficheros, como nombres de funciones, llamadas, mensajes de error o imports.',
    },
  },
  {
    term: 'Glob',
    domain: 'tools',
    def: {
      en: 'Built-in tool that finds files by path pattern (name or extension), e.g. `**/*.test.tsx`. It does not search file contents.',
      es: 'Herramienta integrada que encuentra ficheros por patrón de ruta (nombre o extensión), p. ej. `**/*.test.tsx`. No busca dentro del contenido.',
    },
  },
  {
    term: 'CLAUDE.md',
    domain: 'claude-code',
    def: {
      en: 'Instruction file Claude Code always loads. It exists at user (`~/.claude/CLAUDE.md`), project (`.claude/CLAUDE.md` or root) and directory level.',
      es: 'Fichero de instrucciones que Claude Code carga siempre. Existe a nivel de usuario (`~/.claude/CLAUDE.md`), de proyecto (`.claude/CLAUDE.md` o raíz) y de directorio.',
    },
  },
  {
    term: '@import',
    domain: 'claude-code',
    def: {
      en: 'Syntax to reference external files from `CLAUDE.md` and keep it modular, e.g. importing only the standards files relevant to a package.',
      es: 'Sintaxis para referenciar ficheros externos desde `CLAUDE.md` y mantenerlo modular, p. ej. importar solo los estándares que aplican a un paquete.',
    },
  },
  {
    term: '.claude/rules/',
    domain: 'claude-code',
    def: {
      en: 'Directory of topic-specific rule files (e.g. `testing.md`), an alternative to one monolithic `CLAUDE.md`. Files can be path-scoped.',
      es: 'Directorio de ficheros de reglas por tema (p. ej. `testing.md`), alternativa a un `CLAUDE.md` monolítico. Los ficheros pueden tener alcance por ruta.',
    },
  },
  {
    term: 'paths frontmatter',
    domain: 'claude-code',
    def: {
      en: 'YAML frontmatter field in a `.claude/rules/` file with glob patterns, e.g. `paths: ["**/*.test.tsx"]`. The rule loads only for matching files.',
      es: 'Campo del frontmatter YAML de un fichero de `.claude/rules/` con patrones glob, p. ej. `paths: ["**/*.test.tsx"]`. La regla solo se carga con ficheros que coinciden.',
    },
  },
  {
    term: '.claude/commands/',
    domain: 'claude-code',
    def: {
      en: 'Project-scoped slash commands committed to the repo and available to every developer. Personal commands go in `~/.claude/commands/` instead.',
      es: 'Slash commands del proyecto guardados en el repo y disponibles para todo el equipo. Los personales van en `~/.claude/commands/`.',
    },
  },
  {
    term: 'SKILL.md',
    domain: 'claude-code',
    def: {
      en: 'File that defines a skill in `.claude/skills/`. Its frontmatter supports `context: fork`, `allowed-tools` and `argument-hint`.',
      es: 'Fichero que define un skill en `.claude/skills/`. Su frontmatter admite `context: fork`, `allowed-tools` y `argument-hint`.',
    },
  },
  {
    term: 'context: fork',
    domain: 'claude-code',
    def: {
      en: '`SKILL.md` frontmatter option that runs the skill in an isolated sub-agent context, keeping its output out of the main conversation.',
      es: 'Opción del frontmatter de `SKILL.md` que ejecuta el skill en un contexto de sub-agente aislado y deja su salida fuera de la conversación principal.',
    },
  },
  {
    term: 'allowed-tools',
    domain: 'claude-code',
    def: {
      en: '`SKILL.md` frontmatter field that restricts which tools the skill can use while it runs, e.g. to prevent destructive actions.',
      es: 'Campo del frontmatter de `SKILL.md` que limita las herramientas que el skill puede usar al ejecutarse, p. ej. para evitar acciones destructivas.',
    },
  },
  {
    term: 'argument-hint',
    domain: 'claude-code',
    def: {
      en: '`SKILL.md` frontmatter field that prompts the developer for required parameters when the skill is invoked without arguments.',
      es: 'Campo del frontmatter de `SKILL.md` que pide al desarrollador los parámetros necesarios cuando invoca el skill sin argumentos.',
    },
  },
  {
    term: 'plan mode',
    domain: 'claude-code',
    def: {
      en: 'Claude Code mode for exploring the codebase and designing an approach before changing code; meant for large, multi-file or architectural tasks.',
      es: 'Modo de Claude Code para explorar el código y diseñar un enfoque antes de cambiar nada; pensado para tareas grandes, multi-fichero o de arquitectura.',
    },
  },
  {
    term: 'Explore subagent',
    domain: 'claude-code',
    def: {
      en: 'Subagent that runs verbose discovery in isolation and returns a summary, preserving the main conversation\'s context window.',
      es: 'Subagente que hace el descubrimiento extenso de forma aislada y devuelve un resumen, preservando la ventana de contexto principal.',
    },
  },
  {
    term: 'interview pattern',
    domain: 'claude-code',
    def: {
      en: 'Having Claude ask you questions before implementing, to surface design considerations you may not have anticipated.',
      es: 'Hacer que Claude te pregunte antes de implementar, para sacar a la luz aspectos de diseño que quizá no habías previsto.',
    },
  },
  {
    term: '-p / --print',
    domain: 'claude-code',
    def: {
      en: 'CLI flag that runs Claude Code non-interactively: it processes the prompt, prints to stdout and exits. Use it in CI to avoid hangs.',
      es: 'Flag de la CLI que ejecuta Claude Code en modo no interactivo: procesa el prompt, escribe en stdout y termina. Úsalo en CI para evitar bloqueos.',
    },
  },
  {
    term: '--json-schema',
    domain: 'claude-code',
    def: {
      en: 'CLI flag used with `--output-format json` to enforce structured, machine-parseable output in CI, e.g. findings to post as PR comments.',
      es: 'Flag de la CLI que, junto con `--output-format json`, impone una salida estructurada y parseable en CI, p. ej. hallazgos para comentarios de PR.',
    },
  },
  {
    term: 'explicit criteria',
    domain: 'prompting',
    def: {
      en: 'Specific, checkable rules in a prompt that define what to report and what to skip, instead of vague advice like "be conservative".',
      es: 'Reglas concretas y comprobables en un prompt que definen qué reportar y qué ignorar, en vez de consejos vagos como "be conservative".',
    },
  },
  {
    term: 'false positive',
    domain: 'prompting',
    def: {
      en: 'A finding reported as an issue that is not a real problem. High false positive rates make developers distrust even accurate findings.',
      es: 'Un hallazgo reportado como problema que en realidad no lo es. Muchos falsos positivos hacen que los devs desconfíen incluso de los hallazgos correctos.',
    },
  },
  {
    term: 'few-shot examples',
    domain: 'prompting',
    def: {
      en: 'Sample inputs with their ideal outputs placed in the prompt to show format, reasoning and how to handle ambiguous cases.',
      es: 'Ejemplos de entrada con su salida ideal incluidos en el prompt para mostrar el formato, el razonamiento y cómo tratar los casos ambiguos.',
    },
  },
  {
    term: 'nullable field',
    domain: 'prompting',
    def: {
      en: 'An optional schema field that may be null, used when the source may lack the data so the model does not fabricate a value.',
      es: 'Campo opcional del schema que puede ser null; se usa cuando la fuente puede no tener el dato, para que el modelo no se invente un valor.',
    },
  },
  {
    term: '"other" + detail',
    domain: 'prompting',
    def: {
      en: 'Enum pattern: an `"other"` value plus a free-text detail field, so new categories can be captured without changing the schema.',
      es: 'Patrón de enum: un valor `"other"` más un campo de texto con el detalle, para recoger categorías nuevas sin cambiar el schema.',
    },
  },
  {
    term: 'semantic error',
    domain: 'prompting',
    def: {
      en: 'Output that is valid JSON but wrong in meaning, e.g. line items that do not sum to the total or values in the wrong field.',
      es: 'Salida que es JSON válido pero con un significado incorrecto, p. ej. líneas que no suman el total o valores en el campo equivocado.',
    },
  },
  {
    term: 'retry-with-error-feedback',
    domain: 'prompting',
    def: {
      en: 'Retrying a failed extraction by sending the document, the failed output and the specific validation errors so the model can correct itself.',
      es: 'Reintentar una extracción fallida enviando el documento, la salida fallida y los errores de validación concretos para que el modelo se corrija.',
    },
  },
  {
    term: 'detected_pattern',
    domain: 'prompting',
    def: {
      en: 'A field on each finding that records which code construct triggered it, used to analyze false positive patterns when developers dismiss findings.',
      es: 'Campo de cada hallazgo que registra qué construcción de código lo provocó; sirve para analizar falsos positivos cuando los devs descartan hallazgos.',
    },
  },
  {
    term: 'Message Batches API',
    domain: 'prompting',
    def: {
      en: 'API for asynchronous bulk requests: 50% cheaper, up to 24 hours to process, no latency SLA, no multi-turn tool calling per request.',
      es: 'API para peticiones masivas asíncronas: un 50% más barata, hasta 24 horas de procesamiento, sin SLA de latencia ni tool calling multi-turno por petición.',
    },
  },
  {
    term: 'custom_id',
    domain: 'prompting',
    def: {
      en: 'An ID you set on each batch request to match it with its response and to resubmit only the items that failed.',
      es: 'Identificador que pones en cada petición del batch para emparejarla con su respuesta y reenviar solo los elementos que fallaron.',
    },
  },
  {
    term: 'independent review instance',
    domain: 'prompting',
    def: {
      en: 'A separate Claude instance without the generator\'s reasoning context. It catches subtle issues better than self-review.',
      es: 'Una instancia de Claude aparte, sin el contexto de razonamiento del generador. Detecta problemas sutiles mejor que la autorrevisión.',
    },
  },
  {
    term: 'multi-pass review',
    domain: 'prompting',
    def: {
      en: 'Splitting a large review into per-file passes for local issues plus an integration pass for cross-file data flow, to avoid attention dilution.',
      es: 'Dividir una revisión grande en pasadas por fichero para problemas locales más una de integración para el flujo entre ficheros, evitando la dilución de atención.',
    },
  },
  {
    term: 'progressive summarization',
    domain: 'context',
    def: {
      en: 'Repeatedly condensing conversation history into summaries; it risks turning exact amounts, dates and customer expectations into vague text.',
      es: 'Condensar una y otra vez el historial en resúmenes; corre el riesgo de convertir importes, fechas y expectativas del cliente en texto vago.',
    },
  },
  {
    term: 'case facts block',
    domain: 'context',
    def: {
      en: 'A persistent block of transactional facts (amounts, dates, order numbers, statuses) included in every prompt, outside the summarized history.',
      es: 'Bloque persistente con datos transaccionales (importes, fechas, números de pedido, estados) que va en cada prompt, fuera del historial resumido.',
    },
  },
  {
    term: 'lost in the middle',
    domain: 'context',
    def: {
      en: 'Effect where models reliably process the beginning and end of long inputs but may omit findings from the middle sections.',
      es: 'Efecto por el que el modelo procesa bien el principio y el final de una entrada larga, pero puede omitir lo que está en las secciones centrales.',
    },
  },
  {
    term: 'context degradation',
    domain: 'context',
    def: {
      en: 'Loss of quality in extended sessions: inconsistent answers and references to \'typical patterns\' instead of specific things found earlier.',
      es: 'Pérdida de calidad en sesiones largas: respuestas inconsistentes y referencias a \'patrones típicos\' en vez de a lo concreto encontrado antes.',
    },
  },
  {
    term: 'escalation trigger',
    domain: 'context',
    def: {
      en: 'A valid reason to hand off to a human: explicit customer request, policy exception or gap, or inability to make meaningful progress.',
      es: 'Motivo válido para pasar a un humano: petición explícita del cliente, excepción o laguna en la política, o imposibilidad de avanzar de verdad.',
    },
  },
  {
    term: 'self-reported confidence',
    domain: 'context',
    def: {
      en: 'A confidence score the model gives about its own answer; poorly calibrated, so it is an unreliable proxy for case complexity.',
      es: 'Puntuación de confianza que el modelo da sobre su propia respuesta; está mal calibrada, así que no es un indicador fiable de complejidad.',
    },
  },
  {
    term: 'structured error context',
    domain: 'context',
    def: {
      en: 'An error report with failure type, attempted query, partial results and alternative approaches, so the coordinator can choose a recovery.',
      es: 'Informe de error con tipo de fallo, consulta intentada, resultados parciales y enfoques alternativos, para que el coordinador elija cómo recuperarse.',
    },
  },
  {
    term: 'coverage annotation',
    domain: 'context',
    def: {
      en: 'A note in synthesis output marking which findings are well supported and which topic areas have gaps due to unavailable sources.',
      es: 'Nota en la síntesis que indica qué hallazgos están bien respaldados y qué áreas tienen huecos por fuentes no disponibles.',
    },
  },
  {
    term: 'scratchpad file',
    domain: 'context',
    def: {
      en: 'A file where an agent records key findings during long work and rereads them later, persisting knowledge across context boundaries.',
      es: 'Fichero donde un agente apunta los hallazgos clave durante un trabajo largo y los relee después, para conservarlos más allá del contexto.',
    },
  },
  {
    term: 'crash-recovery manifest',
    domain: 'context',
    def: {
      en: 'Structured state each agent exports to a known location; on resume, the coordinator loads it and injects it into agent prompts.',
      es: 'Estado estructurado que cada agente exporta a una ubicación conocida; al reanudar, el coordinador lo carga y lo inyecta en los prompts.',
    },
  },
  {
    term: '/compact',
    domain: 'context',
    def: {
      en: 'Claude Code command that reduces context usage in long sessions when the context fills with verbose output.',
      es: 'Comando de Claude Code que reduce el uso de contexto en sesiones largas cuando este se llena de salida verbosa.',
    },
  },
  {
    term: 'stratified random sampling',
    domain: 'context',
    def: {
      en: 'Sampling high-confidence extractions across segments to measure their real error rate and detect novel error patterns.',
      es: 'Muestreo por segmentos de las extracciones de alta confianza para medir su tasa de error real y detectar patrones de error nuevos.',
    },
  },
  {
    term: 'field-level confidence',
    domain: 'context',
    def: {
      en: 'A confidence score per extracted field, calibrated on a labeled validation set to decide which fields need human review.',
      es: 'Puntuación de confianza por campo extraído, calibrada con un conjunto de validación etiquetado para decidir qué campos revisa un humano.',
    },
  },
  {
    term: 'claim-source mapping',
    domain: 'context',
    def: {
      en: 'A structured link from each claim to its source (URL or document name, excerpt) that must survive every summarization and synthesis step.',
      es: 'Vínculo estructurado entre cada afirmación y su fuente (URL o documento, extracto) que debe sobrevivir a cada paso de resumen y síntesis.',
    },
  },
];
