// Lo que acompaña a cada lección: un diagrama (MÍRALO) para ver el mecanismo paso a paso o
// comparar dos enfoques, y un ejercicio (PRUÉBALO) de clasificar casos con corrección al momento.
// Escrito a partir de los task statements de la guía oficial, como las lecciones.
import type { LessonExtra } from './game.ts';

export const EXTRAS: LessonExtra[] = [
  {
    ts: '1.1',
    plain: {
      en: 'Like a cook working with a kitchen assistant: Claude says what it needs (`tool_use`), you fetch it and report back, and it carries on. You stop when it says the dish is ready (`end_turn`), not when it merely sounds finished.',
      es: 'Como un cocinero con un ayudante: Claude dice lo que necesita (`tool_use`), tú se lo traes y le cuentas qué ha pasado, y sigue cocinando. Paras cuando dice que el plato está listo (`end_turn`), no cuando parece que ha terminado.',
    },
    see: {
      kind: 'flow',
      title: { en: 'The agentic loop', es: 'El bucle agéntico' },
      steps: [
        {
          label: { en: 'send messages + tools → Claude', es: 'enviar mensajes + herramientas → Claude' },
          note: {
            en: 'Each request carries the whole conversation so far and the tool definitions.',
            es: 'Cada petición lleva toda la conversación hasta ahora y la definición de las herramientas.',
          },
        },
        {
          label: { en: 'read `stop_reason`', es: 'mirar `stop_reason`' },
          note: {
            en: 'Every response says why Claude stopped. That field, not the text, drives the loop.',
            es: 'Cada respuesta dice por qué paró Claude. Ese campo, no el texto, es lo que guía el bucle.',
          },
        },
        {
          label: { en: '`tool_use` → run the tools', es: '`tool_use` → ejecutar las herramientas' },
          note: {
            en: 'Claude asked for one or more tools: run each one. Text in the same response is normal.',
            es: 'Claude ha pedido una o varias herramientas: ejecútalas. Que haya texto en la misma respuesta es normal.',
          },
        },
        {
          label: { en: 'append `tool_result`', es: 'añadir `tool_result`' },
          note: {
            en: 'Add the results to the history and call Claude again, so it can reason about them.',
            es: 'Añade los resultados al historial y vuelve a llamar a Claude para que razone con ellos.',
          },
          loop: 0,
        },
        {
          label: { en: '`end_turn` → show the answer', es: '`end_turn` → mostrar la respuesta' },
          note: {
            en: 'The other branch: Claude is done, so exit the loop. An iteration cap is only a safety net.',
            es: 'La otra rama: Claude ha terminado y se sale del bucle. Un tope de iteraciones es solo una red de seguridad.',
          },
        },
      ],
    },
    drill: {
      title: { en: 'Continue or stop the loop?', es: '¿Seguir o parar el bucle?' },
      buckets: [
        { en: 'continue', es: 'seguir' },
        { en: 'stop', es: 'parar' },
        { en: 'not a signal', es: 'no es una señal' },
      ],
      items: [
        {
          text: { en: '`stop_reason` is `"tool_use"`', es: '`stop_reason` es `"tool_use"`' },
          bucket: 0,
          why: {
            en: 'Claude wants a tool run: execute it and loop again.',
            es: 'Claude quiere usar una herramienta: ejecútala y vuelve a iterar.',
          },
        },
        {
          text: { en: '`stop_reason` is `"end_turn"`', es: '`stop_reason` es `"end_turn"`' },
          bucket: 1,
          why: {
            en: 'Claude finished its turn: exit and show the answer.',
            es: 'Claude ha terminado su turno: sal y muestra la respuesta.',
          },
        },
        {
          text: { en: 'The reply says "All done, anything else?"', es: 'La respuesta dice «Listo, ¿algo más?»' },
          bucket: 2,
          why: {
            en: 'Natural-language phrases are ambiguous and change with the wording; only `stop_reason` counts.',
            es: 'Las frases en lenguaje natural son ambiguas y cambian con la redacción; solo cuenta `stop_reason`.',
          },
        },
        {
          text: { en: 'The reply has text and a `tool_use` block', es: 'La respuesta trae texto y un bloque `tool_use`' },
          bucket: 0,
          why: {
            en: 'Text next to a tool call is normal; the pending tool still has to run.',
            es: 'El texto junto a una llamada a herramienta es normal; la herramienta pendiente tiene que ejecutarse igualmente.',
          },
        },
      ],
    },
  },
  {
    ts: '1.2',
    plain: {
      en: 'Like a newspaper editor: each reporter gets a different beat, files the story with the editor and never with each other, and the editor spots missing angles and sends someone back out. The `coordinator` is the editor; each `subagent` is a reporter.',
      es: 'Como el editor de un periódico: cada periodista cubre una sección distinta, entrega su pieza al editor y nunca a otro periodista, y el editor detecta lo que falta y manda a alguien a cubrirlo. El `coordinator` es el editor; cada `subagent` es un periodista.',
    },
    see: {
      kind: 'flow',
      title: { en: 'A coordinator with a refinement loop', es: 'Un coordinador con bucle de refinamiento' },
      steps: [
        {
          label: { en: 'read the query, pick the subagents', es: 'leer la consulta, elegir los subagentes' },
          note: {
            en: 'The coordinator judges the query\'s complexity: a simple lookup may need one subagent, not the full pipeline.',
            es: 'El coordinador valora la complejidad de la consulta: una búsqueda sencilla puede necesitar un solo subagente, no el pipeline completo.',
          },
        },
        {
          label: { en: 'split the scope without overlaps', es: 'repartir el alcance sin solapes' },
          note: {
            en: 'Each search subagent gets a distinct subtopic or source type, so no work is duplicated and no part of a broad topic is left out.',
            es: 'Cada subagente de búsqueda recibe un subtema o tipo de fuente distinto: nadie repite trabajo y no queda fuera ninguna parte de un tema amplio.',
          },
        },
        {
          label: { en: 'subagents work and report to the hub', es: 'los subagentes trabajan e informan al centro' },
          note: {
            en: 'Each one works in isolated context and returns its result to the coordinator, never directly to another subagent (`hub-and-spoke`).',
            es: 'Cada uno trabaja con contexto aislado y devuelve su resultado al coordinador, nunca directamente a otro subagente (`hub-and-spoke`).',
          },
        },
        {
          label: { en: 'synthesis drafts the combined answer', es: 'la síntesis redacta la respuesta conjunta' },
          note: {
            en: 'The coordinator hands the collected findings to the synthesis subagent, which merges them into one draft.',
            es: 'El coordinador pasa los hallazgos reunidos al subagente de síntesis, que los une en un solo borrador.',
          },
        },
        {
          label: { en: 'gaps? → re-delegate targeted queries', es: '¿huecos? → re-delegar consultas concretas' },
          note: {
            en: 'The coordinator checks the draft for gaps, sends targeted queries back to search and analysis, then re-runs synthesis.',
            es: 'El coordinador busca huecos en el borrador, devuelve consultas concretas a búsqueda y análisis y vuelve a lanzar la síntesis.',
          },
          loop: 2,
        },
        {
          label: { en: 'coverage is enough → final answer', es: 'cobertura suficiente → respuesta final' },
          note: {
            en: 'The other branch: no gaps left, so the coordinator aggregates the results and returns the answer.',
            es: 'La otra rama: no quedan huecos, así que el coordinador agrega los resultados y devuelve la respuesta.',
          },
        },
      ],
    },
    drill: {
      title: { en: 'Sound orchestration or anti-pattern?', es: '¿Orquestación correcta o antipatrón?' },
      buckets: [
        { en: 'sound', es: 'correcto' },
        { en: 'anti-pattern', es: 'antipatrón' },
      ],
      items: [
        {
          text: {
            en: 'Two subagents search the same subtopic in the same sources',
            es: 'Dos subagentes buscan el mismo subtema en las mismas fuentes',
          },
          bucket: 1,
          why: {
            en: 'Duplicated work: give each subagent a distinct subtopic or source type.',
            es: 'Trabajo duplicado: da a cada subagente un subtema o un tipo de fuente distinto.',
          },
        },
        {
          text: {
            en: 'Subagents send their findings straight to each other',
            es: 'Los subagentes se pasan los hallazgos directamente entre ellos',
          },
          bucket: 1,
          why: {
            en: 'Route everything through the coordinator: observability, consistent error handling and a controlled flow.',
            es: 'Todo pasa por el coordinador: observabilidad, errores tratados igual y un flujo de información controlado.',
          },
        },
        {
          text: {
            en: 'A simple factual lookup goes to a single search subagent',
            es: 'Una consulta factual sencilla va a un solo subagente de búsqueda',
          },
          bucket: 0,
          why: {
            en: 'The coordinator picks subagents by query complexity instead of always running the full pipeline.',
            es: 'El coordinador elige subagentes según la complejidad, en vez de pasar siempre por el pipeline completo.',
          },
        },
        {
          text: {
            en: 'The coordinator finds a gap in the synthesis and re-delegates a targeted query',
            es: 'El coordinador ve un hueco en la síntesis y re-delega una consulta concreta',
          },
          bucket: 0,
          why: {
            en: 'That is the iterative refinement loop: repeat until coverage is sufficient.',
            es: 'Es el bucle de refinamiento iterativo: se repite hasta que la cobertura es suficiente.',
          },
        },
        {
          text: {
            en: 'Subagents did their jobs, yet the creative-industries report lacks music: fix them',
            es: 'Los subagentes cumplieron, pero al informe de industrias creativas le falta música: los retocas',
          },
          bucket: 1,
          why: {
            en: 'The gap comes from the coordinator\'s overly narrow decomposition; fix how it splits the topic.',
            es: 'El hueco viene de una descomposición demasiado estrecha del coordinador: corrige cómo reparte el tema.',
          },
        },
      ],
    },
  },
  {
    ts: '1.3',
    plain: {
      en: 'Like briefing a freelancer who missed all your meetings: they know only what is in the brief, so you include every finding and where it came from. A `subagent` starts with just its prompt; none of the `coordinator`\'s history comes along.',
      es: 'Como hacer un encargo a un freelance que no estuvo en ninguna de tus reuniones: solo sabe lo que pone el encargo, así que incluyes cada hallazgo y de dónde sale. Un `subagent` empieza solo con su prompt; no se lleva nada del historial del `coordinator`.',
    },
    see: {
      kind: 'compare',
      title: { en: 'Briefing the synthesis subagent', es: 'Cómo informar al subagente de síntesis' },
      sides: [
        {
          label: { en: 'context assumed', es: 'contexto supuesto' },
          tone: 'bad',
          body: {
            en: 'prompt for the synthesis subagent:\n\'Write the report using the\nfindings from the earlier searches.\'\n\n→ it never saw those searches, so it has nothing to work from',
            es: 'prompt para el subagente de síntesis:\n«Redacta el informe con los\nhallazgos de las búsquedas anteriores.»\n\n→ nunca vio esas búsquedas, así que no tiene nada con qué trabajar',
          },
        },
        {
          label: { en: 'all in the prompt', es: 'todo en el prompt' },
          tone: 'good',
          body: {
            en: 'prompt for the synthesis subagent:\nGoal: report on X, cite every claim\nFindings:\n{claim, source_url, doc, page}\n{claim, source_url, doc, page} …\n\n→ complete context, and every claim keeps its source',
            es: 'prompt para el subagente de síntesis:\nObjetivo: informe sobre X, citar cada afirmación\nHallazgos:\n{claim, source_url, doc, page}\n{claim, source_url, doc, page} …\n\n→ contexto completo, y cada afirmación conserva su fuente',
          },
        },
      ],
      why: {
        en: 'A subagent knows only its prompt. Pass the complete findings with sources in separate fields so synthesis can cite them, and state goals and quality criteria, not fixed steps.',
        es: 'Un subagente solo sabe lo que dice su prompt. Pasa los hallazgos completos con las fuentes en campos aparte para que la síntesis pueda citarlas, y da objetivos y criterios de calidad, no pasos fijos.',
      },
    },
    drill: {
      title: { en: 'Spawned and briefed the right way?', es: '¿Bien lanzado y bien informado?' },
      buckets: [
        { en: 'right', es: 'bien' },
        { en: 'wrong', es: 'mal' },
      ],
      items: [
        {
          text: {
            en: 'Synthesis prompt says \'use the earlier findings\' but includes none',
            es: 'El prompt de síntesis dice «usa los hallazgos previos» pero no incluye ninguno',
          },
          bucket: 1,
          why: {
            en: 'The subagent inherits nothing: if the findings are not in its prompt, it does not have them.',
            es: 'El subagente no hereda nada: si los hallazgos no están en su prompt, no los tiene.',
          },
        },
        {
          text: {
            en: 'Each finding passed as {claim, source URL, document, page}',
            es: 'Cada hallazgo se pasa como {afirmación, URL de la fuente, documento, página}',
          },
          bucket: 0,
          why: {
            en: 'Keeping metadata apart from content preserves attribution all the way through synthesis.',
            es: 'Separar los metadatos del contenido mantiene la atribución hasta el final de la síntesis.',
          },
        },
        {
          text: {
            en: 'Web search and document analysis launched as two `Task` calls in one response',
            es: 'Búsqueda web y análisis de documentos lanzados con dos llamadas a `Task` en una respuesta',
          },
          bucket: 0,
          why: {
            en: 'Several `Task` calls in a single coordinator response run the subagents in parallel.',
            es: 'Varias llamadas a `Task` en una misma respuesta del coordinador ejecutan los subagentes en paralelo.',
          },
        },
        {
          text: {
            en: 'The coordinator\'s `allowedTools` leaves out `Task`',
            es: 'El `allowedTools` del coordinador no incluye `Task`',
          },
          bucket: 1,
          why: {
            en: 'Without `Task` in `allowedTools`, the coordinator cannot spawn any subagent.',
            es: 'Sin `Task` en `allowedTools`, el coordinador no puede lanzar ningún subagente.',
          },
        },
        {
          text: {
            en: 'To run three searches in parallel, the coordinator emits one `Task` call per turn',
            es: 'Para hacer tres búsquedas en paralelo, el coordinador emite una llamada a `Task` por turno',
          },
          bucket: 1,
          why: {
            en: 'Calls in separate turns run one after another; emit all of them in the same response.',
            es: 'Las llamadas en turnos separados se ejecutan una tras otra; emítelas todas en la misma respuesta.',
          },
        },
      ],
    },
  },
  {
    ts: '1.4',
    plain: {
      en: 'A sign saying \'please show your badge\' works most days; a turnstile works every time. A `programmatic prerequisite` is the turnstile: code blocks `process_refund` until identity is verified, while a prompt instruction is only the sign.',
      es: 'Un cartel de «enseña tu acreditación» funciona casi siempre; un torno funciona siempre. Un `programmatic prerequisite` es el torno: el código bloquea `process_refund` hasta que se verifica la identidad, mientras que una instrucción en el prompt es solo el cartel.',
    },
    see: {
      kind: 'flow',
      title: { en: 'Refund gate and handoff', es: 'Barrera del reembolso y traspaso' },
      steps: [
        {
          label: { en: 'the agent wants `process_refund`', es: 'el agente quiere `process_refund`' },
          note: {
            en: 'The customer asks for a refund and the model decides to call the refund tool, maybe before checking who they are.',
            es: 'El cliente pide un reembolso y el modelo decide llamar a la herramienta de reembolso, quizá antes de comprobar quién es.',
          },
        },
        {
          label: { en: 'gate: verified customer ID yet?', es: 'barrera: ¿ID de cliente verificado?' },
          note: {
            en: 'Code, not the prompt, checks whether `get_customer` has already returned a verified customer ID.',
            es: 'El código, no el prompt, comprueba si `get_customer` ya ha devuelto un ID de cliente verificado.',
          },
        },
        {
          label: { en: 'no → blocked: run `get_customer` first', es: 'no → bloqueada: primero `get_customer`' },
          note: {
            en: 'The call is rejected whatever the prompt says. The agent verifies the customer, then tries again.',
            es: 'La llamada se rechaza diga lo que diga el prompt. El agente verifica al cliente y vuelve a intentarlo.',
          },
          loop: 1,
        },
        {
          label: { en: 'yes → the refund goes through', es: 'sí → el reembolso sigue adelante' },
          note: {
            en: 'The other branch: with a verified ID on record, `process_refund` runs. The order holds every time, not just most times.',
            es: 'La otra rama: con un ID verificado, `process_refund` se ejecuta. El orden se cumple siempre, no casi siempre.',
          },
        },
        {
          label: { en: 'needs a human → structured handoff', es: 'hace falta un humano → traspaso estructurado' },
          note: {
            en: 'If the case is escalated mid-process, send customer ID, root cause, refund amount and recommended action: the human never sees the transcript.',
            es: 'Si hay que escalar a mitad de proceso, envía ID de cliente, causa raíz, importe y acción recomendada: el humano nunca ve la transcripción.',
          },
        },
      ],
    },
    drill: {
      title: { en: 'Does it enforce verify-before-refund?', es: '¿Impone verificar antes de reembolsar?' },
      buckets: [
        { en: 'always', es: 'siempre' },
        { en: 'most of the time', es: 'casi siempre' },
        { en: 'not about order', es: 'no toca el orden' },
      ],
      items: [
        {
          text: {
            en: 'Code blocks `process_refund` until `get_customer` returns a verified ID',
            es: 'El código bloquea `process_refund` hasta que `get_customer` devuelve un ID verificado',
          },
          bucket: 0,
          why: {
            en: 'A `programmatic prerequisite` runs in code, so no prompt wording can skip it.',
            es: 'Un `programmatic prerequisite` se ejecuta en código: ninguna redacción del prompt puede saltárselo.',
          },
        },
        {
          text: {
            en: 'System prompt: \'ALWAYS verify identity before any refund\'',
            es: 'System prompt: «Verifica SIEMPRE la identidad antes de cualquier reembolso»',
          },
          bucket: 1,
          why: {
            en: 'Prompt instructions are probabilistic: even emphatic ones have a non-zero failure rate.',
            es: 'Las instrucciones del prompt son probabilísticas: incluso las más enfáticas fallan alguna vez.',
          },
        },
        {
          text: {
            en: 'Few-shot examples that verify identity before every refund',
            es: 'Ejemplos few-shot que verifican la identidad antes de cada reembolso',
          },
          bucket: 1,
          why: {
            en: 'Examples raise the odds but are still guidance the model can skip, not enforcement.',
            es: 'Los ejemplos mejoran la probabilidad, pero siguen siendo una guía que el modelo puede saltarse, no una imposición.',
          },
        },
        {
          text: {
            en: 'A classifier that picks which tools to offer for each request type',
            es: 'Un clasificador que elige qué herramientas ofrecer según el tipo de petición',
          },
          bucket: 2,
          why: {
            en: 'It changes which tools are available, not the order in which they are called.',
            es: 'Cambia qué herramientas están disponibles, no el orden en que se llaman.',
          },
        },
      ],
    },
  },
  {
    ts: '1.5',
    plain: {
      en: 'Like a mailroom: it holds back outgoing parcels that break the rules and relabels incoming ones in one standard format before they reach your desk. Hooks do this in code around every tool call; `PostToolUse` is the incoming side.',
      es: 'Como la sala de correo de una oficina: retiene los paquetes salientes que se saltan las normas y reetiqueta los entrantes con un formato único antes de que lleguen a tu mesa. Los hooks hacen eso en código alrededor de cada llamada a herramienta; `PostToolUse` es la parte de entrada.',
    },
    see: {
      kind: 'flow',
      title: { en: 'Where hooks act on a tool call', es: 'Dónde actúan los hooks en una llamada a herramienta' },
      steps: [
        {
          label: { en: 'Claude requests a tool call', es: 'Claude pide una llamada a herramienta' },
          note: {
            en: 'The model picks a tool and its arguments. Before anything runs, an interception hook sees the outgoing call.',
            es: 'El modelo elige una herramienta y sus argumentos. Antes de que se ejecute nada, un hook de intercepción ve la llamada saliente.',
          },
        },
        {
          label: { en: 'a hook checks the call against policy', es: 'un hook valida la llamada según la política' },
          note: {
            en: 'Code applies the business rule, e.g. no refund above $500. Unlike a prompt rule, it holds every time.',
            es: 'El código aplica la regla de negocio, p. ej. ningún reembolso de más de 500 $. A diferencia del prompt, se cumple siempre.',
          },
        },
        {
          label: { en: 'allowed → the tool runs', es: 'permitida → la herramienta se ejecuta' },
          note: {
            en: 'Each MCP tool returns data in its own format: a Unix timestamp here, an ISO 8601 date there, a numeric status code.',
            es: 'Cada herramienta MCP devuelve datos en su propio formato: aquí un timestamp Unix, allí una fecha ISO 8601, un código de estado numérico.',
          },
        },
        {
          label: { en: '`PostToolUse` normalizes the result', es: '`PostToolUse` normaliza el resultado' },
          note: {
            en: 'Before the model sees the result, the hook converts dates and status codes into one consistent format.',
            es: 'Antes de que el modelo vea el resultado, el hook pasa fechas y códigos de estado a un formato único.',
          },
        },
        {
          label: { en: 'Claude reasons over clean data', es: 'Claude razona con datos limpios' },
          note: {
            en: 'The model gets consistent results instead of having to interpret each tool\'s format on its own.',
            es: 'El modelo recibe resultados coherentes en vez de tener que interpretar por su cuenta el formato de cada herramienta.',
          },
        },
        {
          label: { en: 'over the limit → block and escalate', es: 'fuera del límite → bloquear y escalar' },
          note: {
            en: 'The other branch: the hook blocks the call and redirects the case to an alternative workflow, such as human escalation.',
            es: 'La otra rama: el hook bloquea la llamada y redirige el caso a un flujo alternativo, como escalar a un humano.',
          },
        },
      ],
    },
    drill: {
      title: { en: 'Which hook, if any?', es: '¿Qué hook, si hace falta alguno?' },
      buckets: [
        { en: 'block the call', es: 'bloquear llamada' },
        { en: 'normalize result', es: 'normalizar datos' },
        { en: 'prompt is enough', es: 'basta el prompt' },
      ],
      items: [
        {
          text: { en: 'Refunds above $500 must never be issued', es: 'Nunca se puede emitir un reembolso de más de 500 $' },
          bucket: 0,
          why: {
            en: 'A hard business rule: intercept the outgoing call, block it and route the case to a human.',
            es: 'Es una regla de negocio estricta: intercepta la llamada, bloquéala y deriva el caso a un humano.',
          },
        },
        {
          text: {
            en: 'One tool returns Unix timestamps, another ISO 8601 dates',
            es: 'Una herramienta devuelve timestamps Unix y otra, fechas ISO 8601',
          },
          bucket: 1,
          why: {
            en: 'Convert both in a `PostToolUse` hook so the model sees a single date format.',
            es: 'Conviértelas en un hook `PostToolUse` para que el modelo vea un único formato de fecha.',
          },
        },
        {
          text: { en: 'Replies should sound warm and stay brief', es: 'Las respuestas deben sonar cercanas y ser breves' },
          bucket: 2,
          why: {
            en: 'Tone is guidance, not a business rule that needs a guarantee; a prompt instruction fits.',
            es: 'El tono es una pauta, no una regla de negocio que necesite garantía; basta con una instrucción en el prompt.',
          },
        },
        {
          text: {
            en: 'Order status arrives as numeric codes such as `3`',
            es: 'El estado del pedido llega como código numérico, p. ej. `3`',
          },
          bucket: 1,
          why: {
            en: 'Map the codes to readable statuses in `PostToolUse` before the agent reasons about them.',
            es: 'Traduce los códigos a estados legibles en `PostToolUse` antes de que el agente razone con ellos.',
          },
        },
        {
          text: {
            en: 'The prompt already says \'no refunds over $500\', yet a $650 one went through',
            es: 'El prompt ya dice «nada de reembolsos de más de 500 $», pero pasó uno de 650 $',
          },
          bucket: 0,
          why: {
            en: 'Prompt rules are probabilistic. An interception hook makes the limit hold every time.',
            es: 'Las reglas en el prompt son probabilísticas. Un hook de intercepción hace que el límite se cumpla siempre.',
          },
        },
      ],
    },
  },
  {
    ts: '1.6',
    plain: {
      en: 'A building inspector follows a fixed checklist: each room, then how the rooms connect. A detective\'s next step depends on the last clue. `prompt chaining` is the checklist; `dynamic decomposition` is the detective.',
      es: 'Un inspector de edificios sigue una lista fija: cada habitación y después cómo se conectan entre sí. Un detective decide el siguiente paso según la última pista. El `prompt chaining` es la lista; la `dynamic decomposition` es el detective.',
    },
    see: {
      kind: 'compare',
      title: { en: 'Two ways to split the work', es: 'Dos formas de repartir el trabajo' },
      sides: [
        {
          label: { en: 'prompt chaining', es: 'prompt chaining' },
          tone: 'neutral',
          body: {
            en: 'steps known in advance\n1. review `cart.ts` on its own\n2. review `api.ts` on its own\n   … one pass per file\n3. cross-file integration pass\n\n→ even depth on every file, no attention dilution',
            es: 'pasos conocidos de antemano\n1. revisar `cart.ts` por separado\n2. revisar `api.ts` por separado\n   … una pasada por archivo\n3. pasada de integración entre archivos\n\n→ la misma profundidad en cada archivo, sin dilución de la atención',
          },
        },
        {
          label: { en: 'dynamic decomposition', es: 'descomposición dinámica' },
          tone: 'neutral',
          body: {
            en: '\'Add tests to this legacy codebase\'\n1. map the structure\n2. find the high-impact areas\n3. write a prioritized plan\n4. hidden dependency found → re-plan\n\n→ each subtask comes from what the last step found',
            es: '«Añade tests a este código legacy»\n1. mapear la estructura\n2. localizar las zonas de alto impacto\n3. escribir un plan priorizado\n4. aparece una dependencia → replanificar\n\n→ cada subtarea sale de lo que encontró el paso anterior',
          },
        },
      ],
      why: {
        en: 'Chaining wins when the steps are predictable, like a multi-aspect review. Dynamic decomposition wins when the next subtask depends on what you have just discovered.',
        es: 'El chaining gana cuando los pasos son predecibles, como en una revisión con varios aspectos. La descomposición dinámica gana cuando la siguiente subtarea depende de lo que acabas de descubrir.',
      },
    },
    drill: {
      title: { en: '`prompt chaining` or `dynamic decomposition`?', es: '¿`prompt chaining` o `dynamic decomposition`?' },
      buckets: [
        { en: 'prompt chaining', es: 'prompt chaining' },
        { en: 'dynamic', es: 'dinámica' },
      ],
      items: [
        {
          text: {
            en: 'Check every PR for style, then security, then tests',
            es: 'Revisar cada PR: estilo, luego seguridad, luego tests',
          },
          bucket: 0,
          why: {
            en: 'The same steps every time, in a known order: a fixed chain fits.',
            es: 'Los mismos pasos siempre y en un orden conocido: encaja una cadena fija.',
          },
        },
        {
          text: {
            en: 'Find out why checkout fails for some users but not others',
            es: 'Averiguar por qué el pago falla a unos usuarios y a otros no',
          },
          bucket: 1,
          why: {
            en: 'Open-ended: each finding decides what to look at next.',
            es: 'Es una investigación abierta: cada hallazgo decide qué mirar después.',
          },
        },
        {
          text: { en: 'Add comprehensive tests to a legacy codebase', es: 'Añadir tests completos a un código legacy' },
          bucket: 1,
          why: {
            en: 'Map the structure, find high-impact areas, then follow a prioritized plan that adapts as dependencies appear.',
            es: 'Mapea la estructura, localiza las zonas de alto impacto y sigue un plan priorizado que se adapta según aparecen dependencias.',
          },
        },
        {
          text: {
            en: 'A 14-file PR review that went deep on some files and shallow on others',
            es: 'La revisión de un PR de 14 archivos salió profunda en unos y superficial en otros',
          },
          bucket: 0,
          why: {
            en: 'Chain per-file local passes, then a cross-file integration pass, to avoid attention dilution.',
            es: 'Encadena pasadas locales por archivo y luego una de integración entre archivos para evitar la dilución de la atención.',
          },
        },
      ],
    },
  },
  {
    ts: '1.7',
    plain: {
      en: 'Like saved games: load a save to keep playing (`--resume`), or copy it to try two routes from the same point (`fork_session`). If a game update changed the map since you saved, start over with notes on what you learned: the old save would mislead you.',
      es: 'Como las partidas guardadas: cargas una para seguir jugando (`--resume`) o la copias para probar dos caminos desde el mismo punto (`fork_session`). Si una actualización ha cambiado el mapa desde que guardaste, empiezas de nuevo con notas de lo aprendido: la partida vieja te engañaría.',
    },
    see: {
      kind: 'compare',
      title: { en: 'Picking up yesterday\'s analysis', es: 'Retomar el análisis de ayer' },
      sides: [
        {
          label: { en: 'resume', es: 'reanudar' },
          tone: 'neutral',
          body: {
            en: '`--resume auth-audit`\n\'Since yesterday, `token.ts` and\n`session.ts` changed: re-check them.\'\n\n→ keeps the valid analysis and re-reads only what changed',
            es: '`--resume auth-audit`\n«Desde ayer han cambiado `token.ts`\ny `session.ts`: revísalos.»\n\n→ conserva el análisis válido y solo vuelve a leer lo que cambió',
          },
        },
        {
          label: { en: 'fresh + summary', es: 'de cero + resumen' },
          tone: 'neutral',
          body: {
            en: 'new session, prompt starts with:\nSummary: modules mapped,\n3 open findings, decisions so far…\n\n→ no stale tool results for the agent to trust',
            es: 'sesión nueva; el prompt empieza con:\nResumen: módulos mapeados,\n3 hallazgos abiertos, decisiones hasta ahora…\n\n→ sin resultados obsoletos de los que el agente se fíe',
          },
        },
      ],
      why: {
        en: 'Resume when most of the earlier context is still valid, and name the files that changed. Start fresh with a structured summary when old tool results no longer match the code.',
        es: 'Reanuda si casi todo el contexto anterior sigue siendo válido, y nombra los archivos que cambiaron. Empieza de cero con un resumen estructurado si los resultados antiguos ya no coinciden con el código.',
      },
    },
    drill: {
      title: { en: 'Resume, fork or start fresh?', es: '¿Reanudar, bifurcar o empezar de cero?' },
      buckets: [
        { en: 'resume', es: 'reanudar' },
        { en: 'fork', es: 'bifurcar' },
        { en: 'fresh + summary', es: 'de cero + resumen' },
      ],
      items: [
        {
          text: {
            en: 'Continue yesterday\'s investigation; no code has changed since',
            es: 'Seguir con la investigación de ayer; el código no ha cambiado',
          },
          bucket: 0,
          why: {
            en: 'The prior context is fully valid: `--resume` with the session name picks it up.',
            es: 'El contexto previo sigue siendo válido: `--resume` con el nombre de la sesión lo retoma.',
          },
        },
        {
          text: {
            en: 'Compare two refactoring approaches built on the same codebase analysis',
            es: 'Comparar dos enfoques de refactorización sobre el mismo análisis del código',
          },
          bucket: 1,
          why: {
            en: '`fork_session` branches both from the shared baseline, so each one stays independent.',
            es: '`fork_session` crea las dos ramas desde la base común, así cada una queda independiente.',
          },
        },
        {
          text: {
            en: 'A month-old session; a big refactor has since rewritten most files',
            es: 'Una sesión de hace un mes; un gran refactor ha reescrito casi todos los archivos',
          },
          bucket: 2,
          why: {
            en: 'Most tool results are stale. A new session with a structured summary is more reliable.',
            es: 'Casi todos los resultados de las herramientas están obsoletos. Una sesión nueva con un resumen estructurado es más fiable.',
          },
        },
        {
          text: {
            en: 'Two of the 40 analyzed files changed overnight; the rest still holds',
            es: 'Dos de los 40 archivos analizados cambiaron anoche; el resto sigue igual',
          },
          bucket: 0,
          why: {
            en: 'Context is mostly valid: resume and name the two files so it re-analyzes just those.',
            es: 'El contexto sigue siendo válido casi todo: reanuda y nombra los dos archivos para que revise solo esos.',
          },
        },
      ],
    },
  },
  {
    ts: '2.1',
    plain: {
      en: 'Like a receptionist routing calls with the staff directory: if two desks are both listed as "handles requests", calls land at the wrong one. Each `tool description` must say what that tool handles, what input it takes, and when the similar tool next door is the right one.',
      es: 'Como una recepcionista que pasa llamadas con el directorio de la oficina: si dos puestos dicen «atiende peticiones», las llamadas acaban en el equivocado. Cada `tool description` debe decir qué atiende esa herramienta, qué entrada recibe y cuándo toca la herramienta parecida de al lado.',
    },
    see: {
      kind: 'compare',
      title: { en: 'Telling similar tools apart', es: 'Distinguir herramientas parecidas' },
      sides: [
        {
          label: { en: 'vague and overlapping', es: 'vagas y solapadas' },
          tone: 'bad',
          body: {
            en: '`analyze_content`\n"Analyzes content."\n\n`analyze_document`\n"Analyzes a document."\n\n→ the model guesses: web results reach the wrong tool',
            es: '`analyze_content`\n"Analiza contenido."\n\n`analyze_document`\n"Analiza un documento."\n\n→ el modelo adivina: los resultados web van a la herramienta equivocada',
          },
        },
        {
          label: { en: 'renamed + boundaries', es: 'renombrada + fronteras' },
          tone: 'good',
          body: {
            en: '`extract_web_results`\nInput: web search results (URL + snippet)\nExample: "latest news on topic X"\nNot for uploaded files: use `analyze_document`\n\n→ input, example and boundary: one obvious pick',
            es: '`extract_web_results`\nEntrada: resultados de búsqueda web (URL + snippet)\nEjemplo: «últimas noticias sobre el tema X»\nNo para archivos subidos: usa `analyze_document`\n\n→ entrada, ejemplo y frontera: la elección es obvia',
          },
        },
      ],
      why: {
        en: 'The model chooses by reading descriptions. Give each tool its own name, input, example and limits, then check the system prompt for keywords that still pull toward the wrong tool.',
        es: 'El modelo elige leyendo las descripciones. Da a cada herramienta su nombre, entrada, ejemplo y límites, y luego revisa el system prompt por si alguna palabra clave sigue empujando hacia la herramienta equivocada.',
      },
    },
    drill: {
      title: { en: 'Which fix comes first?', es: '¿Qué arreglas primero?' },
      buckets: [
        { en: 'fix description', es: 'mejorar descripción' },
        { en: 'split the tool', es: 'dividir la herramienta' },
        { en: 'fix system prompt', es: 'revisar system prompt' },
      ],
      items: [
        {
          text: {
            en: 'A tool\'s whole description is "Retrieves order details."',
            es: 'Toda la descripción de una herramienta es "Retrieves order details."',
          },
          bucket: 0,
          why: {
            en: 'Too little to choose by: add the input format, an example query, edge cases and when to use the similar tool.',
            es: 'Con tan poco no se puede elegir: añade formato de entrada, una consulta de ejemplo, casos límite y cuándo usar la herramienta parecida.',
          },
        },
        {
          text: {
            en: 'One generic `analyze_document` extracts data, summarizes and checks claims',
            es: 'Una `analyze_document` genérica extrae datos, resume y verifica afirmaciones',
          },
          bucket: 1,
          why: {
            en: 'Split it into `extract_data_points`, `summarize_content` and `verify_claim_against_source`, each with its own input/output contract.',
            es: 'Divídela en `extract_data_points`, `summarize_content` y `verify_claim_against_source`, cada una con su contrato de entrada y salida.',
          },
        },
        {
          text: {
            en: '`analyze_content` and `analyze_document` have near-identical descriptions',
            es: '`analyze_content` y `analyze_document` tienen descripciones casi idénticas',
          },
          bucket: 0,
          why: {
            en: 'Remove the overlap: rename `analyze_content` to `extract_web_results` and give it a web-specific description.',
            es: 'Elimina el solapamiento: renombra `analyze_content` a `extract_web_results` con una descripción específica para web.',
          },
        },
        {
          text: {
            en: 'Descriptions are clear, but the prompt line "always analyze sources" misroutes',
            es: 'Las descripciones son claras, pero la línea del prompt "always analyze sources" enruta mal',
          },
          bucket: 2,
          why: {
            en: 'Keyword-sensitive wording ties "analyze" to the `analyze_*` tools and overrides good descriptions. Reword the prompt.',
            es: 'Una instrucción sensible a palabras clave liga "analyze" a las herramientas `analyze_*` y anula buenas descripciones. Reescribe el prompt.',
          },
        },
        {
          text: {
            en: 'Minimal descriptions misroute order queries; the team proposes few-shot examples',
            es: 'Descripciones mínimas enrutan mal las consultas de pedidos; el equipo propone ejemplos few-shot',
          },
          bucket: 0,
          why: {
            en: 'Few-shot adds tokens without fixing the root cause. Richer descriptions are the cheap, direct first step.',
            es: 'Los few-shot añaden tokens sin arreglar la causa raíz. Mejorar las descripciones es el primer paso, directo y barato.',
          },
        },
      ],
    },
  },
  {
    ts: '2.2',
    plain: {
      en: 'Like a courier\'s delivery slip: "nobody home, we\'ll retry tomorrow" and "this address does not exist" call for different next steps, and a slip that just says "failed" helps nobody. A tool error says it the same way: `isError`, the kind of failure (`errorCategory`) and whether trying again can work (`isRetryable`).',
      es: 'Como el aviso de un repartidor: «no había nadie, volvemos mañana» y «esa dirección no existe» piden pasos distintos, y un aviso que solo dice «fallido» no ayuda a nadie. Un error de herramienta se explica igual: `isError`, el tipo de fallo (`errorCategory`) y si reintentar puede servir (`isRetryable`).',
    },
    see: {
      kind: 'flow',
      title: { en: 'When a tool call fails', es: 'Cuando falla una llamada a herramienta' },
      steps: [
        {
          label: { en: 'the `subagent` calls a tool', es: 'el `subagent` llama a una herramienta' },
          note: {
            en: 'Three outcomes are possible: it works, it works but finds nothing, or it fails. Each one needs a different reply.',
            es: 'Puede funcionar, funcionar sin encontrar nada o fallar. Cada caso pide una respuesta distinta.',
          },
        },
        {
          label: { en: 'it fails → `isError` + metadata', es: 'falla → `isError` + metadatos' },
          note: {
            en: 'The result is flagged with `isError` and carries `errorCategory`, `isRetryable` and a readable message, never just "Operation failed".',
            es: 'El resultado se marca con `isError` y lleva `errorCategory`, `isRetryable` y un mensaje legible, nunca un simple "Operation failed".',
          },
        },
        {
          label: { en: 'transient → retry locally', es: 'transitorio → reintentar en local' },
          note: {
            en: 'A timeout or a service outage (`isRetryable: true`): the subagent retries on its own, without bothering the coordinator.',
            es: 'Un timeout o un servicio caído (`isRetryable: true`): el subagente reintenta por su cuenta, sin molestar al coordinador.',
          },
          loop: 0,
        },
        {
          label: { en: 'validation, business, permission → no retry', es: 'validación, negocio, permisos → sin reintento' },
          note: {
            en: 'Repeating the call fails again: fix bad input, relay the customer-friendly reason for a policy block (`retriable: false`), or escalate.',
            es: 'Repetir la llamada vuelve a fallar: corrige la entrada, transmite el motivo apto para el cliente si es un bloqueo de política (`retriable: false`) o escala.',
          },
        },
        {
          label: { en: 'still stuck → up to the `coordinator`', es: 'sin arreglo → sube al `coordinator`' },
          note: {
            en: 'Only what cannot be solved locally goes up, with partial results and what was already tried, so the coordinator can decide.',
            es: 'Solo sube lo que no se resuelve en local, con los resultados parciales y lo ya intentado, para que el coordinador decida.',
          },
        },
        {
          label: { en: '0 matches → `valid empty result`', es: '0 coincidencias → `valid empty result`' },
          note: {
            en: 'The other branch: the query ran and found nothing. That is a success, not an error; only a query that could not run needs a retry decision.',
            es: 'La otra rama: la consulta se ejecutó y no encontró nada. Es un éxito, no un error; solo una consulta que no pudo ejecutarse pide decidir si reintentar.',
          },
        },
      ],
    },
    drill: {
      title: { en: 'How should the tool report it?', es: '¿Cómo debe informarlo la herramienta?' },
      buckets: [
        { en: 'retryable error', es: 'error reintentable' },
        { en: 'non-retryable', es: 'no reintentable' },
        { en: 'not an error', es: 'no es un error' },
      ],
      items: [
        {
          text: { en: 'The shipping service timed out', es: 'El servicio de envíos ha dado timeout' },
          bucket: 0,
          why: {
            en: 'A `transient error`: the same call may work in a moment, so `isRetryable: true`.',
            es: 'Un `transient error`: la misma llamada puede funcionar en un momento, así que `isRetryable: true`.',
          },
        },
        {
          text: {
            en: 'Refund refused: the order is past the 30-day return window',
            es: 'Reembolso rechazado: el pedido supera el plazo de devolución de 30 días',
          },
          bucket: 1,
          why: {
            en: 'A business rule: retrying changes nothing. Mark it `retriable: false` with a customer-friendly reason to pass on.',
            es: 'Una regla de negocio: reintentar no cambia nada. Márcalo `retriable: false` con un motivo apto para el cliente.',
          },
        },
        {
          text: {
            en: 'The order search ran fine and matched no orders',
            es: 'La búsqueda de pedidos se ejecutó bien y no encontró ninguno',
          },
          bucket: 2,
          why: {
            en: 'A `valid empty result`: the query succeeded, and "no orders" is the real answer. Nothing to retry.',
            es: 'Un `valid empty result`: la consulta tuvo éxito y «no hay pedidos» es la respuesta real. No hay nada que reintentar.',
          },
        },
        {
          text: {
            en: 'Date sent as `31/02/2026`; the field expects `YYYY-MM-DD`',
            es: 'Fecha enviada como `31/02/2026`; el campo espera `YYYY-MM-DD`',
          },
          bucket: 1,
          why: {
            en: 'A validation error: the same input fails every time. The agent must fix the input, not repeat the call.',
            es: 'Un error de validación: la misma entrada falla siempre. El agente debe corregirla, no repetir la llamada.',
          },
        },
        {
          text: {
            en: 'The database was unreachable, so the search got zero rows',
            es: 'La base de datos no respondía, así que la búsqueda obtuvo cero filas',
          },
          bucket: 0,
          why: {
            en: 'An access failure, not an empty result. Flag `isError` as transient and retryable, or the agent reports "no data" as fact.',
            es: 'Un fallo de acceso, no un resultado vacío. Marca `isError` como transitorio y reintentable, o el agente dará «sin datos» por bueno.',
          },
        },
      ],
    },
  },
  {
    ts: '2.3',
    plain: {
      en: 'Like a kitchen split into stations: the pastry bench holds pastry tools, not the grill. With 18 gadgets on every bench, cooks grab the wrong one; with 4-5 they pick fast and right. `tool_choice` is the head chef saying "use a tool now" or "this one first".',
      es: 'Como una cocina por partidas: el banco de repostería tiene utensilios de repostería, no la parrilla. Con 18 cacharros en cada banco, los cocineros cogen el que no es; con 4-5 eligen rápido y bien. `tool_choice` es el jefe de cocina diciendo «usa una herramienta ya» o «primero esta».',
    },
    see: {
      kind: 'compare',
      title: { en: 'Handing out tools to agents', es: 'Repartir las herramientas entre agentes' },
      sides: [
        {
          label: { en: 'every tool to everyone', es: 'todas para todos' },
          tone: 'bad',
          body: {
            en: 'synthesis agent → 18 tools:\n`web_search`, `fetch_url`, `run_sql`,\n`send_email`, `summarize`, …\n\n→ shakier picks, and it runs web searches that are not its job',
            es: 'agente de síntesis → 18 herramientas:\n`web_search`, `fetch_url`, `run_sql`,\n`send_email`, `summarize`, …\n\n→ elige peor y hace búsquedas web que no le tocan',
          },
        },
        {
          label: { en: '4-5 tools per role', es: '4-5 herramientas por rol' },
          tone: 'good',
          body: {
            en: 'search agent: `web_search`, `load_document`\nsynthesis agent: `summarize`, `cite`\n  + `verify_fact` (one scoped extra)\ncomplex checks → via the `coordinator`\n\n→ reliable picks, each agent stays in its lane',
            es: 'agente de búsqueda: `web_search`, `load_document`\nagente de síntesis: `summarize`, `cite`\n  + `verify_fact` (un extra acotado)\ncomprobaciones complejas → vía el `coordinator`\n\n→ elige bien y cada agente se ciñe a su rol',
          },
        },
      ],
      why: {
        en: 'A few role-fit tools select more reliably than 18. Add one scoped cross-role tool like `verify_fact` for a frequent need, and route complex cases through the coordinator.',
        es: 'Pocas herramientas ajustadas al rol eligen mejor que 18. Añade una herramienta acotada de otro rol, como `verify_fact`, para una necesidad frecuente, y manda los casos complejos por el coordinador.',
      },
    },
    drill: {
      title: { en: 'Which `tool_choice`?', es: '¿Qué `tool_choice`?' },
      buckets: [
        { en: '"auto"', es: '"auto"' },
        { en: '"any"', es: '"any"' },
        { en: 'forced tool', es: 'herramienta forzada' },
      ],
      items: [
        {
          text: {
            en: 'A chat assistant that may just answer in text, or use a tool if needed',
            es: 'Un asistente que puede responder solo con texto o usar una herramienta si hace falta',
          },
          bucket: 0,
          why: {
            en: 'The model decides whether a tool is needed at all. That is exactly `"auto"`.',
            es: 'El modelo decide si hace falta una herramienta o no. Eso es justo `"auto"`.',
          },
        },
        {
          text: {
            en: 'Every reply must be a tool call, never plain text; any tool will do',
            es: 'Cada respuesta debe ser una llamada a herramienta, nunca texto; cualquier herramienta vale',
          },
          bucket: 1,
          why: {
            en: '`"any"` guarantees a tool call and lets the model choose which one.',
            es: '`"any"` garantiza una llamada a herramienta y deja que el modelo elija cuál.',
          },
        },
        {
          text: {
            en: '`extract_metadata` must run before any enrichment tool',
            es: '`extract_metadata` debe ejecutarse antes que cualquier herramienta de enriquecimiento',
          },
          bucket: 2,
          why: {
            en: 'Force `{"type": "tool", "name": "extract_metadata"}` on the first request; enrichment follows in later turns.',
            es: 'Fuerza `{"type": "tool", "name": "extract_metadata"}` en la primera petición; el enriquecimiento va en turnos siguientes.',
          },
        },
        {
          text: {
            en: 'Three extraction schemas, unknown document type, no text replies allowed',
            es: 'Tres esquemas de extracción, tipo de documento desconocido, sin respuestas de texto',
          },
          bucket: 1,
          why: {
            en: 'You cannot know which schema fits in advance: `"any"` forces a tool call and lets the model pick the right one.',
            es: 'No sabes de antemano qué esquema encaja: `"any"` obliga a llamar a una herramienta y deja que el modelo elija la adecuada.',
          },
        },
        {
          text: {
            en: '`"any"` is set, yet the model sometimes calls an enrichment tool first',
            es: 'Está puesto `"any"`, pero a veces el modelo llama antes a una herramienta de enriquecimiento',
          },
          bucket: 2,
          why: {
            en: '`"any"` still lets the model choose. Only forcing `extract_metadata` guarantees that exact tool runs first.',
            es: '`"any"` sigue dejando elegir al modelo. Solo forzar `extract_metadata` garantiza que esa herramienta va primero.',
          },
        },
      ],
    },
  },
  {
    ts: '2.4',
    plain: {
      en: 'Like a team\'s shared toolbox and your own drawer: what everyone needs goes in the box that ships with the project (`.mcp.json`); what you are only trying out stays in your drawer (`~/.claude.json`). Keys are never taped to the box: each person brings their own (`${GITHUB_TOKEN}`).',
      es: 'Como la caja de herramientas del equipo y tu propio cajón: lo que necesitan todos va en la caja que viaja con el proyecto (`.mcp.json`); lo que solo estás probando se queda en tu cajón (`~/.claude.json`). Las llaves nunca van pegadas a la caja: cada uno trae las suyas (`${GITHUB_TOKEN}`).',
    },
    see: {
      kind: 'flow',
      title: { en: 'From config to tool call', es: 'De la configuración a la llamada a la herramienta' },
      steps: [
        {
          label: { en: 'team server → project `.mcp.json`', es: 'servidor del equipo → `.mcp.json`' },
          note: {
            en: 'Shared tooling is committed with the repo, so every teammate gets it. The token is written as `${GITHUB_TOKEN}`, never pasted in.',
            es: 'Las herramientas compartidas se suben con el repo y le llegan a todo el equipo. El token se escribe como `${GITHUB_TOKEN}`, nunca pegado tal cual.',
          },
        },
        {
          label: { en: 'your experiment → `~/.claude.json`', es: 'tu experimento → `~/.claude.json`' },
          note: {
            en: 'A personal or experimental server lives in your user config, so it never reaches the rest of the team.',
            es: 'Un servidor personal o experimental vive en tu configuración de usuario y no le llega al resto del equipo.',
          },
        },
        {
          label: { en: 'connect → every server\'s tools found', es: 'al conectar → se descubren todas las herramientas' },
          note: {
            en: 'At connection time the tools of all configured servers are discovered, and the agent can use all of them at the same time.',
            es: 'Al conectar se descubren las herramientas de todos los servidores configurados, y el agente puede usarlas todas a la vez.',
          },
        },
        {
          label: { en: '`MCP resources` show what data exists', es: 'los `MCP resources` muestran qué datos hay' },
          note: {
            en: 'Catalogs like issue summaries, doc hierarchies or database schemas are exposed upfront, so the agent skips exploratory calls.',
            es: 'Catálogos como resúmenes de issues, jerarquías de docs o esquemas de BD quedan a la vista, y el agente se ahorra llamadas exploratorias.',
          },
        },
        {
          label: { en: 'the agent picks a tool by its description', es: 'el agente elige la herramienta por su descripción' },
          note: {
            en: 'Describe what the MCP tool can do and what it returns in detail, or the agent may fall back to a built-in like `Grep`.',
            es: 'Describe con detalle qué hace y qué devuelve la herramienta MCP; si no, el agente puede preferir una integrada como `Grep`.',
          },
        },
      ],
    },
    drill: {
      title: { en: 'Where does this MCP server go?', es: '¿Dónde va este servidor MCP?' },
      buckets: [
        { en: '.mcp.json', es: '.mcp.json' },
        { en: '~/.claude.json', es: '~/.claude.json' },
      ],
      items: [
        {
          text: { en: 'A GitHub server the whole team uses', es: 'Un servidor de GitHub que usa todo el equipo' },
          bucket: 0,
          why: {
            en: 'Shared team tooling belongs in the project config, committed with the repo.',
            es: 'Las herramientas compartidas del equipo van en la configuración del proyecto, subida con el repo.',
          },
        },
        {
          text: { en: 'A server you are trying out just for yourself', es: 'Un servidor que estás probando solo para ti' },
          bucket: 1,
          why: {
            en: 'Personal or experimental servers stay in your user config, away from the team.',
            es: 'Los servidores personales o experimentales se quedan en tu configuración de usuario, lejos del equipo.',
          },
        },
        {
          text: {
            en: 'The team needs Jira, and a community MCP server for it exists',
            es: 'El equipo necesita Jira y existe un servidor MCP de la comunidad para ello',
          },
          bucket: 0,
          why: {
            en: 'Shared, so project scope. And for a standard integration, use the community server instead of building one.',
            es: 'Es compartido, así que ámbito de proyecto. Y para una integración estándar, usa el de la comunidad en vez de construir uno.',
          },
        },
        {
          text: {
            en: 'A team database server where each dev signs in with their own password',
            es: 'Un servidor de base de datos del equipo donde cada dev entra con su contraseña',
          },
          bucket: 0,
          why: {
            en: 'Personal credentials do not make it personal: keep it shared and write the secret as `${DB_PASSWORD}`.',
            es: 'Que cada uno tenga su credencial no lo hace personal: sigue siendo compartido, con el secreto como `${DB_PASSWORD}`.',
          },
        },
        {
          text: {
            en: 'Your own build of the team server, to test before proposing it',
            es: 'Tu propia versión del servidor del equipo, para probarla antes de proponerla',
          },
          bucket: 1,
          why: {
            en: 'It is still an experiment: keep it in your user config until the team adopts it.',
            es: 'Sigue siendo un experimento: déjalo en tu configuración de usuario hasta que el equipo lo adopte.',
          },
        },
      ],
    },
  },
  {
    ts: '2.5',
    plain: {
      en: 'Think of a library: the catalog finds books by their title (`Glob`), and the index finds every page that mentions a word (`Grep`). You check the index, then open only those pages (`Read`), instead of reading the whole library.',
      es: 'Piensa en una biblioteca: el catálogo encuentra libros por su título (`Glob`) y el índice, cada página que menciona una palabra (`Grep`). Miras el índice y abres solo esas páginas (`Read`), en vez de leerte la biblioteca entera.',
    },
    see: {
      kind: 'flow',
      title: { en: 'From search to change', es: 'De la búsqueda al cambio' },
      steps: [
        {
          label: { en: '`Grep` the name → entry points', es: '`Grep` del nombre → puntos de entrada' },
          note: {
            en: 'Search file contents for the function name or an error message to find where to start, instead of reading every file.',
            es: 'Busca en el contenido el nombre de la función o un mensaje de error para saber por dónde empezar, en vez de leerlo todo.',
          },
        },
        {
          label: { en: '`Read` a hit, follow its imports', es: '`Read` de un resultado, seguir sus imports' },
          note: {
            en: 'Load only the files the trail leads to, and follow their imports to trace the flow one step at a time.',
            es: 'Carga solo los ficheros a los que lleva la pista y sigue sus imports para trazar el flujo paso a paso.',
          },
        },
        {
          label: { en: 'a wrapper re-exports it → list its names', es: 'un envoltorio lo reexporta → lista sus nombres' },
          note: {
            en: 'If a module re-exports the function under other names, first identify every name that module exports.',
            es: 'Si un módulo reexporta la función con otros nombres, identifica primero todos los nombres que exporta.',
          },
        },
        {
          label: { en: '`Grep` each exported name', es: '`Grep` de cada nombre exportado' },
          note: {
            en: 'Search the whole codebase for each of those names; every hit is a new trail to `Read`.',
            es: 'Busca cada uno de esos nombres en todo el código; cada coincidencia es una pista nueva para `Read`.',
          },
          loop: 1,
        },
        {
          label: { en: 'change it: `Edit`, or `Read` + `Write`', es: 'cambiarlo: `Edit`, o `Read` + `Write`' },
          note: {
            en: '`Edit` needs anchor text that appears only once. If the match is not unique, `Read` the whole file and `Write` the new version.',
            es: '`Edit` necesita un texto ancla que aparezca una sola vez. Si no es único, haz `Read` del fichero entero y `Write` de la nueva versión.',
          },
        },
      ],
    },
    drill: {
      title: { en: 'Which built-in tool?', es: '¿Qué herramienta integrada?' },
      buckets: [
        { en: 'Grep', es: 'Grep' },
        { en: 'Glob', es: 'Glob' },
        { en: 'Read + Write', es: 'Read + Write' },
      ],
      items: [
        {
          text: { en: 'Find every test file named `*.test.tsx`', es: 'Encontrar todos los tests con nombre `*.test.tsx`' },
          bucket: 1,
          why: {
            en: 'A file-name pattern: `Glob` matches paths, like `**/*.test.tsx`.',
            es: 'Un patrón de nombre de fichero: `Glob` compara rutas, como `**/*.test.tsx`.',
          },
        },
        {
          text: { en: 'Find every place that calls `formatPrice(`', es: 'Encontrar cada sitio que llama a `formatPrice(`' },
          bucket: 0,
          why: {
            en: 'Calls live inside files, so this is a content search: `Grep`.',
            es: 'Las llamadas están dentro de los ficheros, así que es buscar en el contenido: `Grep`.',
          },
        },
        {
          text: {
            en: '`Edit` failed: its anchor text appears 3 times in the file',
            es: '`Edit` ha fallado: su texto ancla aparece 3 veces en el fichero',
          },
          bucket: 2,
          why: {
            en: 'Retrying `Edit` will not help. `Read` the full file, then `Write` the modified version.',
            es: 'Reintentar `Edit` no sirve. Haz `Read` del fichero completo y luego `Write` con la versión modificada.',
          },
        },
        {
          text: { en: 'Find the files whose name contains `Payment`', es: 'Encontrar los ficheros cuyo nombre contiene `Payment`' },
          bucket: 1,
          why: {
            en: '"Contains" refers to the file name, not its text: `**/*Payment*` is a path pattern for `Glob`.',
            es: 'El «contiene» va sobre el nombre, no sobre el texto: `**/*Payment*` es un patrón de ruta para `Glob`.',
          },
        },
        {
          text: { en: 'Find which files import from `./money`', es: 'Encontrar qué ficheros importan de `./money`' },
          bucket: 0,
          why: {
            en: 'It looks like a path, but an import statement is text inside files: a job for `Grep`.',
            es: 'Parece una ruta, pero una sentencia import es texto dentro de los ficheros: trabajo para `Grep`.',
          },
        },
      ],
    },
  },
  {
    ts: '3.1',
    plain: {
      en: 'Like rules at work: your own sticky notes that only you see, the team handbook every new hire receives, and a sign on one room\'s door. `~/.claude/CLAUDE.md` is your sticky note; team rules belong in the project `CLAUDE.md`, so everyone gets them.',
      es: 'Como las normas en el trabajo: tus pósits, que solo ves tú; el manual del equipo, que recibe cada persona nueva, y un cartel en la puerta de una sala. `~/.claude/CLAUDE.md` es tu pósit; las normas del equipo van en el `CLAUDE.md` del proyecto, para que lleguen a todos.',
    },
    see: {
      kind: 'flow',
      title: { en: 'The `CLAUDE.md` hierarchy', es: 'La jerarquía de `CLAUDE.md`' },
      steps: [
        {
          label: { en: 'you: `~/.claude/CLAUDE.md`', es: 'tú: `~/.claude/CLAUDE.md`' },
          note: {
            en: 'User level: your personal instructions. The file lives on your machine, outside the repo, so no teammate ever gets it.',
            es: 'Nivel de usuario: tus instrucciones personales. El fichero vive en tu máquina, fuera del repo, así que ningún compañero lo recibe.',
          },
        },
        {
          label: { en: 'team: the project `CLAUDE.md`', es: 'equipo: el `CLAUDE.md` del proyecto' },
          note: {
            en: 'Root `CLAUDE.md` or `.claude/CLAUDE.md`, committed to the repo: everyone who clones it gets the same instructions.',
            es: '`CLAUDE.md` en la raíz o `.claude/CLAUDE.md`, subido al repo: todo el que lo clona recibe las mismas instrucciones.',
          },
        },
        {
          label: { en: 'split by topic: `.claude/rules/`', es: 'dividido por temas: `.claude/rules/`' },
          note: {
            en: 'Instead of one giant file: `testing.md`, `api-conventions.md`, `deployment.md`. Each one is small and easy to maintain.',
            es: 'En vez de un fichero gigante: `testing.md`, `api-conventions.md`, `deployment.md`. Cada uno es pequeño y fácil de mantener.',
          },
        },
        {
          label: { en: 'a folder: `packages/billing/CLAUDE.md`', es: 'una carpeta: `packages/billing/CLAUDE.md`' },
          note: {
            en: 'Directory level: a `CLAUDE.md` in a subfolder adds instructions for the code in that part of the tree.',
            es: 'Nivel de directorio: un `CLAUDE.md` en una subcarpeta añade instrucciones para el código de esa parte del árbol.',
          },
        },
        {
          label: { en: 'pull in only needed standards: `@import`', es: 'trae solo los estándares necesarios: `@import`' },
          note: {
            en: 'Billing\'s `CLAUDE.md` imports the security standards file; the UI package does not. Each package\'s maintainers pick what it needs.',
            es: 'El `CLAUDE.md` de billing importa el fichero de estándares de seguridad; el paquete de UI no. Quien mantiene cada paquete elige lo que necesita.',
          },
        },
        {
          label: { en: 'check what loaded: `/memory`', es: 'comprueba qué se cargó: `/memory`' },
          note: {
            en: 'Lists the memory files actually loaded. Run it first when Claude behaves differently across sessions or teammates.',
            es: 'Muestra qué ficheros de memoria se han cargado de verdad. Úsalo primero cuando Claude se comporta distinto entre sesiones o compañeros.',
          },
        },
      ],
    },
    drill: {
      title: { en: 'Does a new teammate get this rule?', es: '¿Le llega esta regla a un compañero nuevo?' },
      buckets: [
        { en: 'gets it', es: 'le llega' },
        { en: 'never gets it', es: 'nunca le llega' },
      ],
      items: [
        {
          text: { en: 'In the root `CLAUDE.md` of the repo they cloned', es: 'En el `CLAUDE.md` raíz del repo que ha clonado' },
          bucket: 0,
          why: {
            en: 'Project level and committed: everyone who clones the repo gets it.',
            es: 'Nivel de proyecto y en el repo: le llega a todo el que lo clona.',
          },
        },
        {
          text: { en: 'In your `~/.claude/CLAUDE.md`', es: 'En tu `~/.claude/CLAUDE.md`' },
          bucket: 1,
          why: {
            en: 'User level stays on your machine; it never goes through version control.',
            es: 'El nivel de usuario se queda en tu máquina; nunca pasa por el control de versiones.',
          },
        },
        {
          text: { en: 'In `.claude/CLAUDE.md`, committed', es: 'En `.claude/CLAUDE.md`, subido al repo' },
          bucket: 0,
          why: {
            en: 'The other project-level location: it is in the repo, so it is shared like a root `CLAUDE.md`.',
            es: 'La otra ubicación de nivel de proyecto: está en el repo, así que se comparte como un `CLAUDE.md` raíz.',
          },
        },
        {
          text: { en: 'In `.claude/rules/testing.md`, committed', es: 'En `.claude/rules/testing.md`, subido al repo' },
          bucket: 0,
          why: {
            en: 'Topic files in `.claude/rules/` live in the repo, so the whole team gets them.',
            es: 'Los ficheros por tema de `.claude/rules/` viven en el repo, así que le llegan a todo el equipo.',
          },
        },
        {
          text: {
            en: 'A repo file imported with `@import` only from your `~/.claude/CLAUDE.md`',
            es: 'Un fichero del repo importado con `@import` solo desde tu `~/.claude/CLAUDE.md`',
          },
          bucket: 1,
          why: {
            en: 'The file is in the repo, but only your personal file imports it. Import it from the project `CLAUDE.md` instead.',
            es: 'El fichero está en el repo, pero solo lo importa tu fichero personal. Impórtalo desde el `CLAUDE.md` del proyecto.',
          },
        },
      ],
    },
  },
  {
    ts: '3.2',
    plain: {
      en: 'Like a kitchen: the rules on the wall apply to every dish, while a recipe card comes out only when you cook that dish. `CLAUDE.md` is the wall, always loaded; a skill is a recipe card, run on demand for one kind of task.',
      es: 'Como en una cocina: las normas de la pared valen para todos los platos, y una ficha de receta solo sale cuando cocinas ese plato. `CLAUDE.md` es la pared, siempre cargada; un skill es una ficha, que se usa bajo demanda para un tipo de tarea.',
    },
    see: {
      kind: 'compare',
      title: { en: 'Team or personal?', es: '¿Del equipo o personal?' },
      sides: [
        {
          label: { en: 'project `.claude/`', es: 'proyecto `.claude/`' },
          tone: 'neutral',
          body: {
            en: '`.claude/commands/review.md`\n`.claude/skills/analyze/SKILL.md`\ncommitted with the repo\n\n→ every teammate gets them on clone or pull',
            es: '`.claude/commands/review.md`\n`.claude/skills/analyze/SKILL.md`\nse suben con el repo\n\n→ todo el equipo los recibe al hacer clone o pull',
          },
        },
        {
          label: { en: 'personal `~/.claude/`', es: 'personal `~/.claude/`' },
          tone: 'neutral',
          body: {
            en: '`~/.claude/commands/standup.md`\n`~/.claude/skills/my-analyze/SKILL.md`\nonly on your machine\nyour variant gets a new name\n\n→ only you have them; the team\'s `analyze` stays as agreed',
            es: '`~/.claude/commands/standup.md`\n`~/.claude/skills/my-analyze/SKILL.md`\nsolo en tu máquina\ntu variante lleva otro nombre\n\n→ solo los tienes tú; el `analyze` del equipo sigue como se acordó',
          },
        },
      ],
      why: {
        en: 'What the whole team should run goes in the repo\'s `.claude/`. Your own shortcuts, and your variants of team skills under a different name, go in `~/.claude/`.',
        es: 'Lo que debe usar todo el equipo va en el `.claude/` del repo. Tus atajos, y tus variantes de skills del equipo con otro nombre, van en `~/.claude/`.',
      },
    },
    drill: {
      title: { en: 'Which `SKILL.md` field solves it?', es: '¿Qué campo de `SKILL.md` lo resuelve?' },
      buckets: [
        { en: '`context: fork`', es: '`context: fork`' },
        { en: '`allowed-tools`', es: '`allowed-tools`' },
        { en: '`argument-hint`', es: '`argument-hint`' },
      ],
      items: [
        {
          text: { en: 'The skill must never be able to delete anything', es: 'El skill no debe poder borrar nada nunca' },
          bucket: 1,
          why: {
            en: 'List only the tools it needs; anything destructive stays out of reach while it runs.',
            es: 'Lista solo las herramientas que necesita; lo destructivo queda fuera de su alcance mientras se ejecuta.',
          },
        },
        {
          text: {
            en: 'People type `/migrate` alone and it has to guess which table',
            es: 'La gente escribe `/migrate` a secas y tiene que adivinar qué tabla',
          },
          bucket: 2,
          why: {
            en: '`argument-hint` prompts for the missing parameter when the skill is invoked without arguments.',
            es: '`argument-hint` pide el parámetro que falta cuando se invoca el skill sin argumentos.',
          },
        },
        {
          text: {
            en: 'A codebase analysis that prints pages of findings',
            es: 'Un análisis del código que suelta páginas de hallazgos',
          },
          bucket: 0,
          why: {
            en: '`context: fork` runs it in an isolated sub-agent context, so those pages stay out of your session.',
            es: '`context: fork` lo ejecuta en un contexto de sub-agente aislado, y esas páginas no entran en tu sesión.',
          },
        },
        {
          text: { en: 'A skill that may write files but do nothing else', es: 'Un skill que puede escribir ficheros y nada más' },
          bucket: 1,
          why: {
            en: 'Restricting a skill to file writes is exactly what `allowed-tools` is for.',
            es: 'Limitar un skill a escribir ficheros es justo para lo que sirve `allowed-tools`.',
          },
        },
        {
          text: {
            en: 'Brainstormed alternatives keep cluttering the conversation afterwards',
            es: 'Las alternativas de una lluvia de ideas siguen ensuciando la conversación después',
          },
          bucket: 0,
          why: {
            en: 'Exploratory context belongs in a fork, so it does not pollute the main conversation you keep working in.',
            es: 'El contexto exploratorio va en un fork, para que no ensucie la conversación principal en la que sigues trabajando.',
          },
        },
      ],
    },
  },
  {
    ts: '3.3',
    plain: {
      en: 'Like a note stuck on the cupboard where the glasses are: you only read it when you open that cupboard. A rule with `paths` only shows up when Claude touches matching files, instead of being repeated in every session.',
      es: 'Como una nota pegada en el armario de los vasos: solo la lees cuando abres ese armario. Una regla con `paths` solo aparece cuando Claude toca archivos que encajan, en vez de repetirse en todas las sesiones.',
    },
    see: {
      kind: 'compare',
      title: { en: 'Conventions for test files', es: 'Convenciones para los tests' },
      sides: [
        {
          label: { en: 'root CLAUDE.md', es: 'CLAUDE.md raíz' },
          tone: 'bad',
          body: {
            en: '`CLAUDE.md`\n## Testing\nUse Testing Library, no snapshots…\n## API\n…\n\n→ loads in every session, even when no test file is touched',
            es: '`CLAUDE.md`\n## Testing\nUsa Testing Library, sin snapshots…\n## API\n…\n\n→ se carga en todas las sesiones, aunque no se toque ningún test',
          },
        },
        {
          label: { en: 'path-scoped rule', es: 'regla por ruta' },
          tone: 'good',
          body: {
            en: '`.claude/rules/testing.md`\n---\npaths: ["**/*.test.tsx"]\n---\nUse Testing Library, no snapshots…\n\n→ loads only when Claude edits a matching file, wherever it lives',
            es: '`.claude/rules/testing.md`\n---\npaths: ["**/*.test.tsx"]\n---\nUsa Testing Library, sin snapshots…\n\n→ se carga solo al editar un archivo que encaja, esté donde esté',
          },
        },
      ],
      why: {
        en: 'A `paths` glob applies conventions by file pattern across the whole repo and keeps them out of sessions that do not need them. A directory `CLAUDE.md` cannot cover test files spread everywhere.',
        es: 'Un glob en `paths` aplica las convenciones por patrón de archivo en todo el repo y las deja fuera de las sesiones que no las necesitan. Un `CLAUDE.md` de directorio no cubre tests repartidos por todas partes.',
      },
    },
    drill: {
      title: { en: 'Does a rule with `paths: ["src/api/**/*.ts"]` load?', es: '¿Se carga una regla con `paths: ["src/api/**/*.ts"]`?' },
      buckets: [
        { en: 'loads', es: 'se carga' },
        { en: 'does not load', es: 'no se carga' },
      ],
      items: [
        {
          text: { en: 'Editing `src/api/users/get.ts`', es: 'Editando `src/api/users/get.ts`' },
          bucket: 0,
          why: {
            en: '`**` matches any depth under `src/api`, and the file ends in `.ts`.',
            es: '`**` encaja a cualquier profundidad dentro de `src/api`, y el archivo acaba en `.ts`.',
          },
        },
        {
          text: { en: 'Editing `src/api/index.ts`', es: 'Editando `src/api/index.ts`' },
          bucket: 0,
          why: {
            en: '`**` also matches zero folders, so files directly in `src/api` count.',
            es: '`**` también encaja con cero carpetas, así que los archivos que están directamente en `src/api` cuentan.',
          },
        },
        {
          text: { en: 'Editing `src/api/users/get.tsx`', es: 'Editando `src/api/users/get.tsx`' },
          bucket: 1,
          why: {
            en: '`*.ts` does not match `.tsx`: the extension has to be exact.',
            es: '`*.ts` no encaja con `.tsx`: la extensión tiene que ser exacta.',
          },
        },
        {
          text: { en: 'Editing `src/web/App.ts`', es: 'Editando `src/web/App.ts`' },
          bucket: 1,
          why: {
            en: 'Outside `src/api`, so the rule stays out of context.',
            es: 'Está fuera de `src/api`, así que la regla no entra en el contexto.',
          },
        },
      ],
    },
  },
  {
    ts: '3.4',
    plain: {
      en: 'Like home repairs: you change a light bulb straight away, but you don\'t knock down a wall without plans. `plan mode` is drawing the plans (explore, compare, agree) before touching code; direct execution is simply doing a small, clear job.',
      es: 'Como las obras en casa: una bombilla la cambias sin más, pero no tiras un tabique sin planos. `plan mode` es hacer los planos (explorar, comparar, acordar) antes de tocar código; la ejecución directa es hacer sin más un trabajo pequeño y claro.',
    },
    see: {
      kind: 'flow',
      title: { en: 'Plan first, then execute', es: 'Primero planificar, luego ejecutar' },
      steps: [
        {
          label: { en: 'size up the task', es: 'evalúa la tarea' },
          note: {
            en: 'One clear, well-scoped change? Or many files, several valid approaches, architectural impact?',
            es: '¿Un cambio claro y acotado? ¿O muchos ficheros, varios enfoques válidos, impacto en la arquitectura?',
          },
        },
        {
          label: { en: 'complex → enter `plan mode`', es: 'compleja → entra en `plan mode`' },
          note: {
            en: 'Claude explores and designs without changing code, so dependencies show up before they cause costly rework.',
            es: 'Claude explora y diseña sin cambiar código, así las dependencias aparecen antes de provocar retrabajo caro.',
          },
        },
        {
          label: { en: 'verbose discovery → `Explore subagent`', es: 'descubrimiento extenso → `Explore subagent`' },
          note: {
            en: 'It digs through the codebase in its own context and returns a summary, so your main context window does not fill up.',
            es: 'Rastrea el código en su propio contexto y devuelve un resumen, para que no se llene tu ventana de contexto principal.',
          },
        },
        {
          label: { en: 'compare approaches, agree a plan', es: 'compara enfoques y acuerda un plan' },
          note: {
            en: 'E.g. two integration options with different infrastructure needs: pick one before anything is edited.',
            es: 'P. ej. dos opciones de integración con distintas necesidades de infraestructura: elige una antes de editar nada.',
          },
        },
        {
          label: { en: 'implement it with direct execution', es: 'impleméntalo con ejecución directa' },
          note: {
            en: 'With the plan agreed, the scope is clear: switch to direct execution and make the changes.',
            es: 'Con el plan acordado, el alcance está claro: pasa a ejecución directa y haz los cambios.',
          },
        },
        {
          label: { en: 'simple → direct execution right away', es: 'simple → ejecución directa sin más' },
          note: {
            en: 'The other branch: a date check in one function, or a single-file fix with a clear stack trace, needs no plan.',
            es: 'La otra rama: una validación de fecha en una función, o un arreglo en un solo fichero con un stack trace claro, no necesita plan.',
          },
        },
      ],
    },
    drill: {
      title: { en: 'Plan mode or direct execution?', es: '¿Plan mode o ejecución directa?' },
      buckets: [
        { en: 'plan mode', es: 'plan mode' },
        { en: 'direct execution', es: 'ejecución directa' },
      ],
      items: [
        {
          text: { en: 'Add a date validation check to one function', es: 'Añadir una validación de fecha a una función' },
          bucket: 1,
          why: {
            en: 'One function, clear scope, one obvious way to do it: just make the change.',
            es: 'Una función, alcance claro y una forma obvia de hacerlo: haz el cambio sin más.',
          },
        },
        {
          text: { en: 'Migrate a library used in 45+ files', es: 'Migrar una librería usada en más de 45 ficheros' },
          bucket: 0,
          why: {
            en: 'Large-scale and multi-file: explore and plan first to avoid costly rework.',
            es: 'Gran escala y multi-fichero: explora y planifica primero para evitar retrabajo caro.',
          },
        },
        {
          text: { en: 'Single-file bug with a clear stack trace', es: 'Bug en un solo fichero con un stack trace claro' },
          bucket: 1,
          why: {
            en: 'The stack trace already points to the cause; there is nothing to design.',
            es: 'El stack trace ya señala la causa; no hay nada que diseñar.',
          },
        },
        {
          text: {
            en: 'Pick between two integrations with different infrastructure needs',
            es: 'Elegir entre dos integraciones con distintas necesidades de infraestructura',
          },
          bucket: 0,
          why: {
            en: 'Several valid approaches with architectural impact: compare them in plan mode before building.',
            es: 'Varios enfoques válidos con impacto en la arquitectura: compáralos en plan mode antes de construir.',
          },
        },
        {
          text: {
            en: 'Microservice restructure, with very detailed instructions already written',
            es: 'Reestructurar en microservicios, con instrucciones muy detalladas ya escritas',
          },
          bucket: 0,
          why: {
            en: 'Detailed instructions assume you know the right structure without exploring the code. Plan first.',
            es: 'Unas instrucciones detalladas dan por hecho que conoces la estructura correcta sin explorar el código. Planifica primero.',
          },
        },
      ],
    },
  },
  {
    ts: '3.5',
    plain: {
      en: 'Like asking a hairdresser for "short, but not too short": everyone reads it differently, but two photos get the same cut every time. When Claude keeps misreading a prose description, stop rewording it: show 2-3 concrete input/output examples.',
      es: 'Como pedir en la peluquería «corto, pero no mucho»: cada cual lo entiende a su manera, pero con dos fotos sale siempre el mismo corte. Si Claude interpreta mal una descripción en prosa, no la reformules: enséñale 2-3 ejemplos concretos de entrada/salida.',
    },
    see: {
      kind: 'compare',
      title: { en: 'Two bugs whose fixes interact', es: 'Dos bugs cuyos arreglos interactúan' },
      sides: [
        {
          label: { en: 'one at a time', es: 'de uno en uno' },
          tone: 'bad',
          body: {
            en: 'msg 1: fix the rounding of totals\nmsg 2: now fix the currency conversion\n(that fix changes the rounding)\nmsg 3: rounding is wrong again…\n\n→ each fix undoes the other: ping-pong',
            es: 'msg 1: arregla el redondeo de los totales\nmsg 2: ahora arregla la conversión de moneda\n(ese arreglo cambia el redondeo)\nmsg 3: el redondeo vuelve a fallar…\n\n→ cada arreglo deshace el otro: ping-pong',
          },
        },
        {
          label: { en: 'one detailed message', es: 'un mensaje detallado' },
          tone: 'good',
          body: {
            en: 'one message:\n1. totals are rounded wrong\n2. currency conversion is off\n3. they interact: conversion uses the rounded total\n\n→ one fix that accounts for both',
            es: 'un solo mensaje:\n1. los totales se redondean mal\n2. la conversión de moneda falla\n3. interactúan: la conversión usa el total redondeado\n\n→ un arreglo que tiene en cuenta los dos',
          },
        },
      ],
      why: {
        en: 'When fixes affect each other, Claude needs the whole picture in one message. Independent problems are different: fix them one at a time.',
        es: 'Cuando los arreglos se afectan entre sí, Claude necesita el cuadro completo en un mensaje. Los problemas independientes son otra cosa: arréglalos de uno en uno.',
      },
    },
    drill: {
      title: { en: 'Which technique fits?', es: '¿Qué técnica encaja?' },
      buckets: [
        { en: 'I/O examples', es: 'ejemplos de E/S' },
        { en: 'interview first', es: 'entrevista primero' },
        { en: 'tests first', es: 'tests primero' },
      ],
      items: [
        {
          text: {
            en: 'Claude formats dates differently every run, from your written description',
            es: 'Claude formatea las fechas distinto en cada ejecución, a partir de tu descripción escrita',
          },
          bucket: 0,
          why: {
            en: 'Prose is being read inconsistently; 2-3 input/output pairs show exactly what you want.',
            es: 'La prosa se interpreta de forma inconsistente; 2-3 pares de entrada/salida muestran justo lo que quieres.',
          },
        },
        {
          text: {
            en: 'Adding a cache in a domain you have never worked in',
            es: 'Añadir una caché en un dominio en el que nunca has trabajado',
          },
          bucket: 1,
          why: {
            en: 'Use the `interview pattern`: Claude asks first about invalidation, failure modes… things you may not have anticipated.',
            es: 'Usa el patrón entrevista (`interview pattern`): Claude pregunta primero por la invalidación, los modos de fallo… cosas que quizá no habías previsto.',
          },
        },
        {
          text: {
            en: 'You want behavior, edge cases and performance pinned down before any code',
            es: 'Quieres fijar comportamiento, casos límite y rendimiento antes de escribir código',
          },
          bucket: 2,
          why: {
            en: 'Write the test suite first; it becomes the target Claude iterates against.',
            es: 'Escribe primero la suite de tests; será el objetivo contra el que itera Claude.',
          },
        },
        {
          text: {
            en: 'After each attempt, Claude should see exactly which cases still fail',
            es: 'Tras cada intento, Claude debe ver exactamente qué casos siguen fallando',
          },
          bucket: 2,
          why: {
            en: 'Share the failing test output each round: concrete evidence beats "it still doesn\'t work".',
            es: 'Comparte la salida de los tests que fallan en cada vuelta: la evidencia concreta gana a «sigue sin funcionar».',
          },
        },
        {
          text: {
            en: 'You made the prose description longer, yet outputs still vary',
            es: 'Has alargado la descripción en prosa y aun así la salida sigue variando',
          },
          bucket: 0,
          why: {
            en: 'More prose is still prose. Concrete input/output examples remove the ambiguity that words leave.',
            es: 'Más prosa sigue siendo prosa. Los ejemplos concretos de entrada/salida quitan la ambigüedad que dejan las palabras.',
          },
        },
      ],
    },
  },
  {
    ts: '3.6',
    plain: {
      en: 'Like a night-shift inspector working alone: nobody is around to answer questions, and the morning team reads a fixed form, not a chatty note. In CI, `-p` runs Claude Code without waiting for input, and `--json-schema` makes it fill in the form.',
      es: 'Como un inspector del turno de noche que trabaja solo: no hay nadie a quien preguntar, y el equipo de la mañana lee un formulario fijo, no una nota escrita a su manera. En CI, `-p` ejecuta Claude Code sin esperar entrada y `--json-schema` le hace rellenar el formulario.',
    },
    see: {
      kind: 'flow',
      title: { en: 'A PR review job in CI', es: 'Un job de revisión de PR en CI' },
      steps: [
        {
          label: { en: 'new PR → CI runs `claude -p`', es: 'PR nueva → CI ejecuta `claude -p`' },
          note: {
            en: '`-p` runs non-interactively: it processes the prompt, prints the result and exits. Without it, the job waits for input forever.',
            es: '`-p` ejecuta en modo no interactivo: procesa el prompt, escribe el resultado y termina. Sin él, el job espera entrada para siempre.',
          },
        },
        {
          label: { en: 'project context from `CLAUDE.md`', es: 'contexto del proyecto desde `CLAUDE.md`' },
          note: {
            en: 'The committed `CLAUDE.md` gives the CI run its review criteria, testing standards and fixture conventions.',
            es: 'El `CLAUDE.md` del repo da a la ejecución en CI sus criterios de revisión, estándares de testing y convenciones de fixtures.',
          },
        },
        {
          label: { en: 'a fresh instance reviews the code', es: 'una instancia nueva revisa el código' },
          note: {
            en: 'Not the session that wrote it: an `independent review instance` has none of the author\'s reasoning, so it questions those decisions.',
            es: 'No la sesión que lo escribió: una `independent review instance` no arrastra el razonamiento del autor, así que cuestiona sus decisiones.',
          },
        },
        {
          label: { en: 'JSON findings via `--json-schema`', es: 'hallazgos en JSON con `--json-schema`' },
          note: {
            en: 'With `--output-format json` and `--json-schema`, findings follow your schema, so a script parses them instead of guessing from prose.',
            es: 'Con `--output-format json` y `--json-schema`, los hallazgos siguen tu esquema y un script los parsea sin adivinar a partir de prosa.',
          },
        },
        {
          label: { en: 'a script posts inline PR comments', es: 'un script publica comentarios inline' },
          note: {
            en: 'Each finding carries fields such as file and line, so it lands as a comment right where the problem is.',
            es: 'Cada hallazgo trae campos como fichero y línea, así que acaba como comentario justo donde está el problema.',
          },
        },
        {
          label: { en: 'new push → rerun with prior findings', es: 'nuevo push → repetir con hallazgos previos' },
          note: {
            en: 'Pass the earlier findings and ask only for new or still-unaddressed issues, so no comment is posted twice.',
            es: 'Pasa los hallazgos anteriores y pide solo problemas nuevos o aún sin resolver, para no publicar ningún comentario dos veces.',
          },
          loop: 0,
        },
      ],
    },
    drill: {
      title: { en: 'What fixes this CI problem?', es: '¿Qué arregla este problema de CI?' },
      buckets: [
        { en: 'add `-p`', es: 'añadir `-p`' },
        { en: 'JSON + schema', es: 'JSON + esquema' },
        { en: 'add to context', es: 'añadir al contexto' },
      ],
      items: [
        {
          text: {
            en: 'The job hangs: Claude Code is waiting for interactive input',
            es: 'El job se cuelga: Claude Code está esperando entrada interactiva',
          },
          bucket: 0,
          why: {
            en: '`-p` processes the prompt, prints and exits, so nothing waits for a human.',
            es: '`-p` procesa el prompt, escribe y termina, así que nada espera a una persona.',
          },
        },
        {
          text: {
            en: 'The script that posts PR comments can\'t parse free-form prose',
            es: 'El script que publica comentarios en la PR no puede parsear prosa libre',
          },
          bucket: 1,
          why: {
            en: '`--output-format json` with `--json-schema` returns findings in a fixed, machine-parseable shape.',
            es: '`--output-format json` con `--json-schema` devuelve los hallazgos con una forma fija y parseable.',
          },
        },
        {
          text: {
            en: 'Generated tests repeat scenarios the suite already covers',
            es: 'Los tests generados repiten escenarios que la suite ya cubre',
          },
          bucket: 2,
          why: {
            en: 'Put the existing test files in context so Claude can see what is already covered.',
            es: 'Pon los ficheros de test existentes en el contexto para que Claude vea lo que ya está cubierto.',
          },
        },
        {
          text: {
            en: 'Generated tests are low-value and ignore the fixtures you already have',
            es: 'Los tests generados aportan poco e ignoran los fixtures que ya tenéis',
          },
          bucket: 2,
          why: {
            en: 'Document testing standards, what makes a test valuable and the available fixtures in `CLAUDE.md`.',
            es: 'Documenta en `CLAUDE.md` los estándares de testing, qué hace valioso un test y los fixtures disponibles.',
          },
        },
        {
          text: {
            en: 'To stop the hang, a teammate suggests setting `CLAUDE_HEADLESS=true`',
            es: 'Para que no se cuelgue, alguien propone poner `CLAUDE_HEADLESS=true`',
          },
          bucket: 0,
          why: {
            en: 'No such variable exists. The documented non-interactive mode is `-p / --print`.',
            es: 'Esa variable no existe. El modo no interactivo documentado es `-p / --print`.',
          },
        },
      ],
    },
  },
  {
    ts: '4.1',
    plain: {
      en: 'Tell a doorman "keep out anyone dodgy" and he guesses; tell him "no name on the list, no entry" and he gets it right every time. A review prompt works the same: `explicit criteria` (report bugs and security, skip style) cut `false positive` findings; "be conservative" does not.',
      es: 'Si a un portero le dices «no dejes pasar a nadie raro», adivina; si le dices «quien no esté en la lista no entra», acierta siempre. Con un prompt de revisión pasa igual: los `explicit criteria` (reporta bugs y seguridad, ignora el estilo) reducen los `false positive`; «sé prudente» no.',
    },
    see: {
      kind: 'compare',
      title: { en: 'Same reviewer, two prompts', es: 'El mismo revisor, dos prompts' },
      sides: [
        {
          label: { en: 'vague advice', es: 'consejo vago' },
          tone: 'bad',
          body: {
            en: 'Review this PR.\nBe conservative.\nOnly report high-confidence findings.\nCheck that comments are accurate.\n\n→ the style nits and comment noise stay; devs start ignoring the real bugs too',
            es: 'Revisa este PR.\nSé prudente.\nReporta solo hallazgos de alta confianza.\nRevisa que los comentarios sean correctos.\n\n→ sigue el ruido de estilo y de comentarios; los devs acaban ignorando también los bugs reales',
          },
        },
        {
          label: { en: 'explicit criteria', es: 'criterios explícitos' },
          tone: 'good',
          body: {
            en: 'Report: bugs, security issues\nSkip: minor style, local patterns\nComments: flag only if the claim\ncontradicts what the code does\nEach severity: a concrete code example\n\n→ fewer false positives, and devs trust it again',
            es: 'Reporta: bugs, problemas de seguridad\nIgnora: estilo menor, patrones locales\nComentarios: solo si lo que dicen\ncontradice lo que hace el código\nCada severidad: un ejemplo de código\n\n→ menos falsos positivos, y los devs vuelven a fiarse',
          },
        },
      ],
      why: {
        en: '"Be conservative" names no category, so nothing changes; categories say what to drop. If one stays noisy, switch it off while you fix its criteria: its noise makes devs doubt the accurate ones.',
        es: '«Sé prudente» no nombra ninguna categoría, así que nada cambia; las categorías dicen qué descartar. Si una sigue siendo ruidosa, desactívala mientras corriges sus criterios: su ruido hace dudar de las que aciertan.',
      },
    },
    drill: {
      title: { en: 'Explicit criterion or vague advice?', es: '¿Criterio explícito o consejo vago?' },
      buckets: [
        { en: 'explicit criterion', es: 'criterio explícito' },
        { en: 'vague advice', es: 'consejo vago' },
      ],
      items: [
        {
          text: { en: '"Be careful and conservative."', es: '«Ten cuidado y sé prudente.»' },
          bucket: 1,
          why: {
            en: 'It names no issue type, so the model has no rule for what to drop.',
            es: 'No nombra ningún tipo de problema, así que el modelo no tiene una regla para saber qué descartar.',
          },
        },
        {
          text: {
            en: '"Report bugs and security issues; skip minor style."',
            es: '«Reporta bugs y problemas de seguridad; ignora el estilo menor.»',
          },
          bucket: 0,
          why: { en: 'It says which categories to report and which to skip.', es: 'Dice qué categorías reportar y cuáles ignorar.' },
        },
        {
          text: {
            en: '"Flag a comment only if its claim contradicts the code."',
            es: '«Marca un comentario solo si lo que dice contradice al código.»',
          },
          bucket: 0,
          why: {
            en: 'A testable condition: the comment either matches what the code does or it does not.',
            es: 'Es una condición comprobable: el comentario coincide con lo que hace el código o no.',
          },
        },
        {
          text: {
            en: '"Only report findings you are highly confident about."',
            es: '«Reporta solo hallazgos en los que tengas mucha confianza.»',
          },
          bucket: 1,
          why: {
            en: 'Sounds strict, but filtering by confidence defines no category and does not raise precision.',
            es: 'Suena estricto, pero filtrar por confianza no define ninguna categoría y no mejora la precisión.',
          },
        },
        {
          text: {
            en: '"Severity: critical = serious issues, minor = small ones."',
            es: '«Severidad: critical = problemas graves, minor = problemas pequeños.»',
          },
          bucket: 1,
          why: {
            en: 'Adjectives only. Without a concrete code example per level, the same issue gets different severities.',
            es: 'Solo adjetivos. Sin un ejemplo de código concreto por nivel, el mismo problema recibe severidades distintas.',
          },
        },
      ],
    },
  },
  {
    ts: '4.2',
    plain: {
      en: 'Like training a new waiter: a page of rules still gets you messy order tickets, but three filled-in tickets, including a tricky one with a note on why it was written that way, make them all look the same. That is what `few-shot examples` do for Claude.',
      es: 'Como formar a un camarero nuevo: una página de normas sigue dando comandas desordenadas, pero tres comandas ya rellenas, incluida una difícil con una nota de por qué se escribió así, hacen que todas salgan iguales. Eso hacen los `few-shot examples` con Claude.',
    },
    see: {
      kind: 'compare',
      title: { en: 'Getting the same format every time', es: 'El mismo formato en cada respuesta' },
      sides: [
        {
          label: { en: 'more instructions', es: 'más instrucciones' },
          tone: 'bad',
          body: {
            en: 'Always give location, issue,\nseverity and a suggested fix.\nBe consistent.\nUse judgment on edge cases.\n(…three more paragraphs…)\n\n→ the layout still drifts and edge cases go either way',
            es: 'Indica siempre ubicación, problema,\nseveridad y una corrección.\nSé consistente.\nUsa tu criterio en los casos límite.\n(…tres párrafos más…)\n\n→ el formato sigue variando y los casos límite salen a cara o cruz',
          },
        },
        {
          label: { en: '2–4 few-shot examples', es: '2–4 ejemplos few-shot' },
          tone: 'good',
          body: {
            en: 'Example 2 of 3 (an ambiguous case)\nlocation: api.ts:42\nissue: … · severity: high · fix: …\nWhy a real bug and not a local pattern: …\n\n→ the same layout every time, and the judgment carries over to new cases',
            es: 'Ejemplo 2 de 3 (un caso ambiguo)\nubicación: api.ts:42\nproblema: … · severidad: high · corrección: …\nPor qué es un bug real y no un patrón local: …\n\n→ el mismo formato siempre, y el criterio se traslada a casos nuevos',
          },
        },
      ],
      why: {
        en: 'When instructions alone stay inconsistent, examples are the most effective fix. Aim 2–4 at the ambiguous cases and show the reasoning, so the model generalizes instead of copying.',
        es: 'Cuando las instrucciones solas siguen siendo inconsistentes, los ejemplos son lo más eficaz. Dedica 2–4 a los casos ambiguos y muestra el razonamiento, para que el modelo generalice en vez de copiar.',
      },
    },
    drill: {
      title: { en: 'Will this few-shot set help?', es: '¿Servirán estos ejemplos few-shot?' },
      buckets: [
        { en: 'helps', es: 'sirve' },
        { en: 'falls short', es: 'se queda corto' },
      ],
      items: [
        {
          text: {
            en: '3 examples showing the exact layout: location, issue, severity, fix',
            es: '3 ejemplos con el formato exacto: ubicación, problema, severidad, corrección',
          },
          bucket: 0,
          why: {
            en: 'Showing the format you want is the most reliable way to get it every time.',
            es: 'Mostrar el formato que quieres es la forma más fiable de obtenerlo siempre.',
          },
        },
        {
          text: {
            en: 'Twenty examples, all from the same clean invoice template',
            es: 'Veinte ejemplos, todos de la misma plantilla de factura limpia',
          },
          bucket: 1,
          why: {
            en: 'Uniform examples teach nothing about the layouts that fail. Pick 2–4 targeted, varied ones.',
            es: 'Los ejemplos uniformes no enseñan nada sobre los formatos que fallan. Elige 2–4 dirigidos y variados.',
          },
        },
        {
          text: {
            en: 'One paper with inline citations, one with a bibliography',
            es: 'Un paper con citas en línea y otro con bibliografía',
          },
          bucket: 0,
          why: {
            en: 'Varied structures show where the data can hide, which fixes required fields coming back null.',
            es: 'Las estructuras variadas muestran dónde puede estar el dato, y eso corrige los campos obligatorios que vuelven null.',
          },
        },
        {
          text: {
            en: 'An accepted codebase pattern next to a real bug, each explained',
            es: 'Un patrón aceptado en el código junto a un bug real, cada uno explicado',
          },
          bucket: 0,
          why: {
            en: 'Contrasting acceptable code with genuine issues cuts false positives and generalizes to new patterns.',
            es: 'Contrastar código aceptable con problemas reales reduce los falsos positivos y generaliza a patrones nuevos.',
          },
        },
        {
          text: {
            en: 'Ambiguous requests showing only which tool was picked',
            es: 'Peticiones ambiguas que solo muestran qué herramienta se eligió',
          },
          bucket: 1,
          why: {
            en: 'Without the reason one tool beat the plausible alternative, the model copies surface patterns.',
            es: 'Sin el motivo por el que una herramienta ganó a la alternativa plausible, el modelo copia patrones superficiales.',
          },
        },
      ],
    },
  },
  {
    ts: '4.3',
    plain: {
      en: 'Like a paper form instead of a blank sheet: the answers always land in the right boxes. A tool\'s JSON schema is that form, read back from the `tool_use` block. Make a box mandatory when the data may be missing, though, and people invent something: use a `nullable field`.',
      es: 'Como un formulario en vez de una hoja en blanco: las respuestas siempre caen en su casilla. El JSON schema de una herramienta es ese formulario, y lo lees del bloque `tool_use`. Pero si haces obligatoria una casilla cuyo dato puede faltar, la gente se inventa algo: usa un `nullable field`.',
    },
    see: {
      kind: 'flow',
      title: { en: 'From document to structured data', es: 'Del documento a datos estructurados' },
      steps: [
        {
          label: { en: 'describe the output as a tool schema', es: 'describir la salida como schema de una herramienta' },
          note: {
            en: 'e.g. an `extract_invoice` tool whose input schema lists the fields you want. The arguments Claude fills in are your data.',
            es: 'P. ej., una herramienta `extract_invoice` cuyo input schema lista los campos que quieres. Los argumentos que rellena Claude son tus datos.',
          },
        },
        {
          label: { en: 'allow `null`, `"other"` and `"unclear"`', es: 'permitir `null`, `"other"` y `"unclear"`' },
          note: {
            en: 'Each field the source may lack is a `nullable field`, so nothing is invented; enums get `"other" + detail` and `"unclear"` for ambiguous cases.',
            es: 'Cada campo que puede faltar en la fuente es un `nullable field`, así no se inventa nada; los enums llevan `"other" + detail` y `"unclear"` para los casos ambiguos.',
          },
        },
        {
          label: { en: 'add format rules to the prompt', es: 'añadir reglas de formato al prompt' },
          note: {
            en: 'Sources write dates and amounts in many ways; normalization rules in the prompt, next to the strict schema, keep the values consistent.',
            es: 'Las fuentes escriben fechas e importes de mil maneras; las reglas de normalización en el prompt, junto al schema estricto, hacen que los valores salgan uniformes.',
          },
        },
        {
          label: { en: 'set `tool_choice`', es: 'elegir `tool_choice`' },
          note: {
            en: '`"auto"` may answer in text; `"any"` must call one of your tools; `forced tool selection` makes one named tool, e.g. `extract_metadata`, run first.',
            es: '`"auto"` puede responder con texto; `"any"` obliga a llamar a una de tus herramientas; `forced tool selection` hace que una herramienta concreta, p. ej. `extract_metadata`, vaya primero.',
          },
        },
        {
          label: { en: 'read `tool_use`, then check the meaning', es: 'leer `tool_use` y revisar el contenido' },
          note: {
            en: 'No JSON syntax errors to fix, but a `semantic error` can remain: line items that do not add up to the total, a value in the wrong field.',
            es: 'No hay errores de sintaxis JSON que corregir, pero puede quedar un `semantic error`: líneas que no suman el total, un valor en el campo equivocado.',
          },
        },
      ],
    },
    drill: {
      title: { en: 'Which `tool_choice`?', es: '¿Qué `tool_choice`?' },
      buckets: [
        { en: '"auto"', es: '"auto"' },
        { en: '"any"', es: '"any"' },
        { en: 'forced tool', es: 'herramienta forzada' },
      ],
      items: [
        {
          text: {
            en: 'Help-desk chat that may answer in words or look up an order',
            es: 'Chat de soporte que puede responder con texto o buscar un pedido',
          },
          bucket: 0,
          why: {
            en: 'A plain-text reply is fine here, so let the model decide whether to call a tool.',
            es: 'Aquí una respuesta en texto vale, así que deja que el modelo decida si llama a una herramienta.',
          },
        },
        {
          text: {
            en: '`extract_metadata` must always run before enrichment',
            es: '`extract_metadata` siempre tiene que ejecutarse antes del enriquecimiento',
          },
          bucket: 2,
          why: {
            en: 'Forcing `{"type": "tool", "name": "extract_metadata"}` guarantees that exact tool runs first.',
            es: 'Forzar `{"type": "tool", "name": "extract_metadata"}` garantiza que esa herramienta exacta se ejecute primero.',
          },
        },
        {
          text: {
            en: 'Mixed invoices and contracts, type unknown, one extraction tool per type',
            es: 'Facturas y contratos mezclados, tipo desconocido, una herramienta de extracción por tipo',
          },
          bucket: 1,
          why: {
            en: 'It must call a tool, but it should pick the schema that fits each document.',
            es: 'Tiene que llamar a una herramienta, pero debe elegir el schema que encaja con cada documento.',
          },
        },
        {
          text: {
            en: 'Unknown doc types, 3 extraction tools, and some replies come back as prose',
            es: 'Tipos de documento desconocidos, 3 herramientas de extracción y algunas respuestas llegan en texto',
          },
          bucket: 1,
          why: {
            en: 'Prose means it is on `"auto"`. `"any"` forces a tool call and still lets Claude pick the schema.',
            es: 'Que llegue texto indica `"auto"`. `"any"` obliga a llamar a una herramienta y sigue dejando a Claude elegir el schema.',
          },
        },
        {
          text: {
            en: '`"any"` is set, yet enrichment sometimes runs before `extract_metadata`',
            es: '`"any"` está puesto, pero a veces el enriquecimiento va antes que `extract_metadata`',
          },
          bucket: 2,
          why: {
            en: '`"any"` only guarantees some tool call, not which one. Force `extract_metadata` by name.',
            es: '`"any"` solo garantiza que se llame a alguna herramienta, no a cuál. Fuerza `extract_metadata` por su nombre.',
          },
        },
      ],
    },
  },
  {
    ts: '4.4',
    plain: {
      en: 'Like handing a form back to a clerk with the wrong boxes circled in red: next time they fix exactly those. That is `retry-with-error-feedback`. But if the number lives in a file you never gave them, sending it back again changes nothing.',
      es: 'Como devolver un formulario a un administrativo con las casillas mal rodeadas en rojo: a la siguiente corrige justo esas. Eso es `retry-with-error-feedback`. Pero si el dato está en un archivo que nunca le diste, devolvérselo otra vez no cambia nada.',
    },
    see: {
      kind: 'flow',
      title: { en: 'Validate, retry or stop', es: 'Validar, reintentar o parar' },
      steps: [
        {
          label: { en: 'extract, with check fields', es: 'extraer, con campos de control' },
          note: {
            en: 'Ask for `calculated_total` (the sum of the lines) next to `stated_total` (the printed one), so a mismatch shows up on its own.',
            es: 'Pide `calculated_total` (la suma de las líneas) junto a `stated_total` (el que viene impreso), para que una discrepancia salte sola.',
          },
        },
        {
          label: { en: 'validate the values in code', es: 'validar los valores en código' },
          note: {
            en: 'Schema-valid does not mean correct. All checks pass? Store it. Here they fail: the lines add up to 940 and the invoice says 1,000.',
            es: 'Cumplir el schema no significa que esté bien. ¿Pasan todas las comprobaciones? Guárdalo. Aquí fallan: las líneas suman 940 y la factura dice 1.000.',
          },
        },
        {
          label: { en: 'retry: doc + failed output + exact error', es: 'reintentar: doc + salida fallida + error exacto' },
          note: {
            en: 'Send the original document, the failed extraction and the specific validation error. Format and structure mistakes get fixed this way.',
            es: 'Envía el documento original, la extracción fallida y el error de validación concreto. Así se corrigen los fallos de formato y de estructura.',
          },
          loop: 1,
        },
        {
          label: { en: 'data not in the doc? stop and flag it', es: '¿el dato no está en el doc? parar y marcar' },
          note: {
            en: 'The other branch: if the missing amount is only in a contract you never sent, retries cannot create it. Set `conflict_detected` and send it to review.',
            es: 'La otra rama: si el importe que falta solo está en un contrato que no enviaste, los reintentos no pueden crearlo. Marca `conflict_detected` y pásalo a revisión.',
          },
        },
      ],
    },
    drill: {
      title: { en: 'What handles this failure?', es: '¿Qué resuelve este fallo?' },
      buckets: [
        { en: 'retry with errors', es: 'reintento + error' },
        { en: 'stop and flag', es: 'parar y marcar' },
        { en: 'schema prevents it', es: 'el schema lo evita' },
      ],
      items: [
        {
          text: {
            en: 'A date came back as "3 March"; your format needs 2026-03-03',
            es: 'Una fecha llegó como «3 de marzo»; tu formato pide 2026-03-03',
          },
          bucket: 0,
          why: {
            en: 'A format mismatch: send the document, the output and this exact error, and the retry fixes it.',
            es: 'Es un formato que no encaja: envía el documento, la salida y este error exacto, y el reintento lo arregla.',
          },
        },
        {
          text: {
            en: 'The order number only appears in a contract you did not send',
            es: 'El número de pedido solo aparece en un contrato que no enviaste',
          },
          bucket: 1,
          why: {
            en: 'Retries cannot create information the model never saw. Flag it for a person to review.',
            es: 'Los reintentos no pueden crear información que el modelo nunca vio. Márcalo para que lo revise una persona.',
          },
        },
        {
          text: {
            en: 'A trailing comma makes the JSON impossible to parse',
            es: 'Una coma final hace que el JSON no se pueda parsear',
          },
          bucket: 2,
          why: {
            en: 'Tool use with a JSON schema eliminates syntax errors, so this one never reaches you.',
            es: 'Usar herramientas con un JSON schema elimina los errores de sintaxis, así que este nunca te llega.',
          },
        },
        {
          text: {
            en: 'Schema-valid output, but the vendor name sits in the `address` field',
            es: 'Salida válida según el schema, pero el nombre del proveedor está en el campo `address`',
          },
          bucket: 0,
          why: {
            en: 'Wrong field placement is a `semantic error` the schema cannot stop, but a retry that names it can fix it.',
            es: 'Un campo mal colocado es un `semantic error` que el schema no evita, pero un reintento que lo señale puede corregirlo.',
          },
        },
        {
          text: {
            en: 'Checked the original: its own lines sum to 940, but its printed total is 1,000',
            es: 'Has mirado el original: sus propias líneas suman 940, pero el total impreso es 1.000',
          },
          bucket: 1,
          why: {
            en: 'The extraction is right; the source contradicts itself. Set `conflict_detected` instead of retrying.',
            es: 'La extracción es correcta; es la fuente la que se contradice. Marca `conflict_detected` en vez de reintentar.',
          },
        },
      ],
    },
  },
  {
    ts: '4.5',
    plain: {
      en: 'Standard shipping versus a courier: real-time is the courier who comes right now at full price; the `Message Batches API` is the overnight van at half price, fine whenever nobody is waiting at the door.',
      es: 'Envío estándar frente a mensajero urgente: el tiempo real es el mensajero que viene ya y cobra el precio completo; la `Message Batches API` es la furgoneta nocturna a mitad de precio, perfecta cuando nadie espera en la puerta.',
    },
    see: {
      kind: 'compare',
      title: { en: 'Real-time call or Message Batches API', es: 'Llamada en tiempo real o Message Batches API' },
      sides: [
        {
          label: { en: 'real-time', es: 'tiempo real' },
          tone: 'neutral',
          body: {
            en: 'answer in seconds\nfull price\nmulti-turn tool calling ✓\n\n→ for anything someone is waiting on',
            es: 'respuesta en segundos\nprecio completo\nllamadas a herramientas en varios turnos ✓\n\n→ para todo lo que alguien está esperando',
          },
        },
        {
          label: { en: 'Batches API', es: 'Batches API' },
          tone: 'neutral',
          body: {
            en: 'up to 24 h, no latency SLA\n50% cheaper\none request, one response:\nno multi-turn tool calling\n`custom_id` pairs results\n\n→ for overnight or weekly jobs',
            es: 'hasta 24 h, sin SLA de latencia\n50% más barato\nuna petición, una respuesta:\nsin llamadas a herramientas en varios turnos\n`custom_id` empareja resultados\n\n→ para trabajos nocturnos o semanales',
          },
        },
      ],
      why: {
        en: 'Decide by who is waiting: a blocking check needs real-time; a report read tomorrow can wait and costs half.',
        es: 'Decide según quién espera: una comprobación que bloquea necesita tiempo real; un informe que se lee mañana puede esperar y cuesta la mitad.',
      },
    },
    drill: {
      title: { en: 'Batch or real-time?', es: '¿Batch o tiempo real?' },
      buckets: [
        { en: 'Batches API', es: 'Batches API' },
        { en: 'real-time', es: 'tiempo real' },
      ],
      items: [
        {
          text: {
            en: 'Overnight tech-debt report, read the next morning',
            es: 'Informe de deuda técnica nocturno, que se lee por la mañana',
          },
          bucket: 0,
          why: {
            en: 'Nobody is waiting on it, so it can take hours and cost half.',
            es: 'Nadie lo está esperando: puede tardar horas y costar la mitad.',
          },
        },
        {
          text: { en: 'Blocking pre-merge check', es: 'Comprobación que bloquea el merge' },
          bucket: 1,
          why: {
            en: 'Developers are waiting to merge, and batches have no latency guarantee.',
            es: 'Hay gente esperando para hacer merge, y los batches no garantizan latencia.',
          },
        },
        {
          text: {
            en: 'Re-extracting 40,000 archived invoices this week',
            es: 'Volver a extraer 40.000 facturas archivadas esta semana',
          },
          bucket: 0,
          why: {
            en: 'Large, non-urgent and single-turn: a textbook batch job, with `custom_id` mapping results back.',
            es: 'Grande, sin prisa y de un solo turno: un trabajo de batch de manual, con `custom_id` para emparejar resultados.',
          },
        },
        {
          text: {
            en: 'Support agent that calls tools across several turns',
            es: 'Agente de soporte que llama a herramientas en varios turnos',
          },
          bucket: 1,
          why: {
            en: 'A batch request cannot do multi-turn tool calling, and the customer is waiting.',
            es: 'Una petición en batch no puede hacer llamadas a herramientas en varios turnos, y el cliente está esperando.',
          },
        },
      ],
    },
  },
  {
    ts: '4.6',
    plain: {
      en: 'Like proofreading: you miss your own typos because you read what you meant to write, while a colleague who never saw the draft spots them. That is an `independent review instance`. And a long book is checked chapter by chapter, then once for the plot: `multi-pass review`.',
      es: 'Como al corregir un texto: no ves tus propias erratas porque lees lo que querías escribir, y un compañero que no vio el borrador las encuentra. Eso es una `independent review instance`. Y un libro largo se revisa capítulo a capítulo y luego una vez la trama: `multi-pass review`.',
    },
    see: {
      kind: 'flow',
      title: { en: 'Reviewing a 14-file PR', es: 'Revisar un PR de 14 ficheros' },
      steps: [
        {
          label: { en: 'session A writes the code', es: 'la sesión A escribe el código' },
          note: {
            en: 'Its context holds its own reasoning, so asking it to double-check mostly confirms its choices. Extended thinking does not change that.',
            es: 'Su contexto guarda su propio razonamiento, así que pedirle que lo revise casi siempre confirma sus decisiones. Extended thinking no cambia eso.',
          },
        },
        {
          label: { en: 'fresh instance B gets only the code', es: 'una instancia nueva B recibe solo el código' },
          note: {
            en: 'With no prior reasoning to defend, it catches subtle issues the author would explain away.',
            es: 'Sin un razonamiento previo que defender, detecta problemas sutiles que el autor daría por buenos.',
          },
        },
        {
          label: { en: 'one pass per file: local issues', es: 'una pasada por fichero: problemas locales' },
          note: {
            en: 'Each file gets full attention, so depth is even and identical code gets the same verdict in every file.',
            es: 'Cada fichero recibe toda la atención: la profundidad es pareja y el mismo código recibe el mismo veredicto en todos los ficheros.',
          },
        },
        {
          label: { en: 'integration pass: data across files', es: 'pasada de integración: datos entre ficheros' },
          note: {
            en: 'A separate pass follows data as it moves between files, catching the bugs no single-file pass can see.',
            es: 'Una pasada aparte sigue el flujo de datos entre ficheros, donde están los bugs que ninguna pasada de un solo fichero puede ver.',
          },
        },
        {
          label: { en: 'verify: confidence on each finding', es: 'verificar: confianza en cada hallazgo' },
          note: {
            en: 'A verification pass has the model state its confidence next to each finding, so each finding can be routed to review based on it.',
            es: 'Una pasada de verificación hace que el modelo indique su confianza junto a cada hallazgo, para enrutar cada hallazgo a revisión según esa confianza.',
          },
        },
      ],
    },
    drill: {
      title: { en: 'Does this make the review better?', es: '¿Mejora esto la revisión?' },
      buckets: [
        { en: 'improves it', es: 'la mejora' },
        { en: 'does not help', es: 'no ayuda' },
      ],
      items: [
        {
          text: {
            en: 'Ask the session that wrote the code to review it',
            es: 'Pedir a la sesión que escribió el código que lo revise',
          },
          bucket: 1,
          why: {
            en: 'It keeps the reasoning it generated with, so it rarely questions its own decisions.',
            es: 'Conserva el razonamiento con el que generó el código, así que rara vez cuestiona sus decisiones.',
          },
        },
        {
          text: {
            en: 'Give the diff to a fresh Claude instance with no prior context',
            es: 'Dar el diff a una instancia nueva de Claude sin contexto previo',
          },
          bucket: 0,
          why: {
            en: 'Without the author\'s reasoning, it judges the code on its own and catches subtler issues.',
            es: 'Sin el razonamiento del autor, juzga el código por sí mismo y detecta problemas más sutiles.',
          },
        },
        {
          text: {
            en: 'Per-file passes, then one pass for data flow across files',
            es: 'Pasadas por fichero y luego una para el flujo de datos entre ficheros',
          },
          bucket: 0,
          why: {
            en: 'Local issues get full attention per file, and cross-file bugs get a pass of their own.',
            es: 'Los problemas locales reciben toda la atención en cada fichero, y los bugs entre ficheros, su propia pasada.',
          },
        },
        {
          text: {
            en: 'Keep one pass over all 14 files, on a model with a larger context window',
            es: 'Mantener una sola pasada sobre los 14 ficheros, con un modelo de más ventana de contexto',
          },
          bucket: 1,
          why: {
            en: 'Fitting more in does not deepen attention; the dilution and the contradictory findings stay.',
            es: 'Que quepa más no hace la atención más profunda; la dilución y los hallazgos contradictorios siguen ahí.',
          },
        },
        {
          text: {
            en: 'Turn on extended thinking in the session that wrote the code',
            es: 'Activar extended thinking en la sesión que escribió el código',
          },
          bucket: 1,
          why: {
            en: 'More thinking in the same context keeps the same blind spots; an independent instance does better.',
            es: 'Pensar más en el mismo contexto mantiene los mismos puntos ciegos; una instancia independiente lo hace mejor.',
          },
        },
      ],
    },
  },
  {
    ts: '5.1',
    plain: {
      en: 'Like a waiter\'s order pad: the small talk with the table can fade, but "table 4, two steaks, no salt" stays written down exactly. Keep amounts, dates and order IDs in a `case facts block` sent with every prompt, not in a summary that blurs them.',
      es: 'Como la libreta de un camarero: la charla con la mesa se puede olvidar, pero «mesa 4, dos entrecots, sin sal» queda apuntado tal cual. Guarda importes, fechas e IDs de pedido en un `case facts block` que va en cada prompt, no en un resumen que los difumina.',
    },
    see: {
      kind: 'compare',
      title: { en: 'Remembering what was promised', es: 'Recordar lo que se prometió' },
      sides: [
        {
          label: { en: 'summary only', es: 'solo el resumen' },
          tone: 'bad',
          body: {
            en: '[summary of turns 1–35]\n"Customer had two order issues;\nwe offered a partial refund soon."\n\n→ $89.00, order #A-1042 and "before the 12th" are gone',
            es: '[resumen de los turnos 1–35]\n«El cliente tenía dos incidencias;\nle ofrecimos un reembolso parcial pronto.»\n\n→ 89,00 $, el pedido #A-1042 y «antes del 12» se han perdido',
          },
        },
        {
          label: { en: 'case facts block', es: 'bloque de case facts' },
          tone: 'good',
          body: {
            en: 'CASE FACTS (in every prompt)\n#A-1042 · refund $89.00 · approved\n#B-2210 · return label · pending\ncustomer: "I need it before the 12th"\n+ summary of older turns\n\n→ exact values survive any number of summaries',
            es: 'CASE FACTS (en cada prompt)\n#A-1042 · reembolso 89,00 $ · aprobado\n#B-2210 · etiqueta de devolución · pendiente\ncliente: «lo necesito antes del 12»\n+ resumen de los turnos antiguos\n\n→ los valores exactos sobreviven a todos los resúmenes',
          },
        },
      ],
      why: {
        en: 'Summaries are fine for the story, not for figures. What the agent must act on lives outside the summarized history, one entry per issue, so no round of condensing can blur it.',
        es: 'Los resúmenes valen para la historia, no para las cifras. Lo que el agente necesita para actuar vive fuera del historial resumido, una entrada por incidencia, y ningún resumen lo puede difuminar.',
      },
    },
    drill: {
      title: { en: 'Which fix does this need?', es: '¿Qué arreglo necesita?' },
      buckets: [
        { en: 'case facts block', es: 'bloque case facts' },
        { en: 'trim tool output', es: 'recortar resultados' },
        { en: 'key findings first', es: 'hallazgos delante' },
      ],
      items: [
        {
          text: {
            en: 'The agent forgets the $89 refund it promised 30 turns ago',
            es: 'El agente olvida el reembolso de 89 $ que prometió hace 30 turnos',
          },
          bucket: 0,
          why: {
            en: 'A promised amount must survive summaries: pin it in a block that goes with every prompt.',
            es: 'Un importe prometido debe sobrevivir a los resúmenes: fíjalo en un bloque que va en cada prompt.',
          },
        },
        {
          text: {
            en: 'Each order lookup adds 40+ fields; a return needs 5 of them',
            es: 'Cada consulta de pedido mete 40+ campos; una devolución necesita 5',
          },
          bucket: 1,
          why: {
            en: 'Keep only the return-relevant fields before results pile up and crowd out what matters.',
            es: 'Quédate solo con los campos útiles para la devolución antes de que se acumulen y desplacen lo importante.',
          },
        },
        {
          text: {
            en: 'Seven subagent reports pasted end to end; the middle ones get missed',
            es: 'Siete informes de subagentes pegados seguidos; se pasan por alto los del centro',
          },
          bucket: 2,
          why: {
            en: '`lost in the middle`: open with a key findings summary and give each report its own section header.',
            es: '`lost in the middle`: abre con un resumen de hallazgos clave y da a cada informe su propio encabezado de sección.',
          },
        },
        {
          text: {
            en: '"Before my flight on the 12th" became "soon" in the summary',
            es: '«Antes de mi vuelo del día 12» se convirtió en «pronto» en el resumen',
          },
          bucket: 0,
          why: {
            en: 'What the customer said they expect blurs just like numbers do; record it exactly, outside the summary.',
            es: 'Lo que el cliente dice que espera se difumina igual que las cifras: apúntalo tal cual, fuera del resumen.',
          },
        },
        {
          text: {
            en: 'Three issues in one chat; the $89 refund gets tied to the wrong order',
            es: 'Tres incidencias en un chat; el reembolso de 89 $ acaba asociado al pedido equivocado',
          },
          bucket: 0,
          why: {
            en: 'Multi-issue sessions need structured data per issue (order ID, amount, status) in a separate context layer.',
            es: 'Con varias incidencias hace falta un registro estructurado por incidencia (ID de pedido, importe, estado) en una capa de contexto aparte.',
          },
        },
      ],
    },
  },
  {
    ts: '5.2',
    plain: {
      en: 'Like a good shop assistant: they fetch the manager when you ask for one or when the rulebook doesn\'t cover your request, not just because you sound annoyed. That\'s an `escalation trigger`: what the case needs, not how anyone feels.',
      es: 'Como un buen dependiente: llama al encargado si se lo pides o si el reglamento no cubre lo que quieres, no solo porque suenes molesto. Eso es un `escalation trigger`: lo que necesita el caso, no cómo se siente nadie.',
    },
    see: {
      kind: 'compare',
      title: { en: 'Deciding when to hand off', es: 'Decidir cuándo pasar a un humano' },
      sides: [
        {
          label: { en: 'sentiment + score', es: 'sentimiento + nota' },
          tone: 'bad',
          body: {
            en: 'if sentiment < -0.6 → human\nif self-rated confidence < 5 → human\n\nangry, simple reship → escalated\ncalm, needs a policy exception\n  → handled alone, confidently wrong\n\n→ easy cases go up, hard ones stay',
            es: 'si sentimiento < -0,6 → humano\nsi confianza autoevaluada < 5 → humano\n\nenfadado, reenvío sencillo → escalado\ntranquilo, pide una excepción\n  → lo resuelve solo, muy seguro y mal\n\n→ suben los fáciles, se quedan los difíciles',
          },
        },
        {
          label: { en: 'explicit criteria', es: 'criterios explícitos' },
          tone: 'good',
          body: {
            en: 'system prompt:\nEscalate when the customer asks for a\nhuman, policy is silent or needs an\nexception, or no progress is possible.\nOtherwise resolve.\n+ few-shot: escalate vs resolve cases\n\n→ the case decides, not the mood',
            es: 'system prompt:\nEscala si el cliente pide un humano,\nsi la política calla o exige una\nexcepción, o si no se puede avanzar.\nSi no, resuélvelo.\n+ few-shot: casos de escalar y de resolver\n\n→ decide el caso, no el estado de ánimo',
          },
        },
      ],
      why: {
        en: 'Frustration and self-rated confidence don\'t track how hard a case is. Explicit criteria with few-shot examples fix the decision boundary itself: the proportionate first step before a classifier.',
        es: 'El enfado y la confianza autoevaluada no reflejan lo difícil que es un caso. Criterios explícitos con ejemplos few-shot arreglan la frontera de decisión: el primer paso proporcionado, antes de un clasificador.',
      },
    },
    drill: {
      title: { en: 'Escalate, resolve or ask?', es: '¿Escalar, resolver o preguntar?' },
      buckets: [
        { en: 'escalate', es: 'escalar' },
        { en: 'resolve', es: 'resolver' },
        { en: 'ask for an ID', es: 'pedir otro dato' },
      ],
      items: [
        {
          text: { en: 'Customer: "I want to talk to a person."', es: 'Cliente: «Quiero hablar con una persona.»' },
          bucket: 0,
          why: {
            en: 'An explicit request for a human is honored right away, with no troubleshooting first.',
            es: 'Una petición explícita de un humano se atiende enseguida, sin diagnósticos previos.',
          },
        },
        {
          text: { en: 'Lookup for "Maria Lopez" returns three accounts', es: 'La búsqueda de «María López» devuelve tres cuentas' },
          bucket: 2,
          why: {
            en: 'Picking the likeliest match risks acting on the wrong customer; ask for an email or order number.',
            es: 'Elegir la más probable puede hacerte actuar sobre otro cliente; pide un email o un número de pedido.',
          },
        },
        {
          text: {
            en: 'Angry about a late parcel; a standard reship fixes it',
            es: 'Enfadado por un paquete con retraso; un reenvío estándar lo arregla',
          },
          bucket: 1,
          why: {
            en: 'Anger isn\'t a trigger: acknowledge it and offer the fix; escalate if they then insist on a human.',
            es: 'El enfado no es un disparador: reconócelo y ofrece la solución; escala si después insiste en un humano.',
          },
        },
        {
          text: {
            en: 'Wants a competitor\'s price matched; policy covers own-site prices only',
            es: 'Pide igualar el precio de la competencia; la política solo cubre la propia web',
          },
          bucket: 0,
          why: {
            en: 'Policy is silent on this request. A gap goes to a human; the agent doesn\'t invent a rule.',
            es: 'La política no dice nada de esto. Una laguna va a un humano; el agente no se inventa una norma.',
          },
        },
        {
          text: {
            en: 'Asks for a human, though the fix looks like a 2-minute address change',
            es: 'Pide un humano, aunque parece un cambio de dirección de 2 minutos',
          },
          bucket: 0,
          why: {
            en: 'An explicit request wins even when the fix looks easy: escalate without investigating or trying first.',
            es: 'Una petición explícita manda aunque el arreglo parezca fácil: escala sin investigar ni intentarlo antes.',
          },
        },
      ],
    },
  },
  {
    ts: '5.3',
    plain: {
      en: 'Like a courier who couldn\'t deliver: a useful note says what failed, what they tried and what you can do next. A blank note, or "delivered" when it wasn\'t, leaves you stuck. A `subagent` owes its `coordinator` that note: `structured error context`.',
      es: 'Como un repartidor que no pudo entregar: un aviso útil dice qué falló, qué intentó y qué puedes hacer ahora. Un aviso en blanco, o «entregado» cuando no lo está, te deja tirado. Un `subagent` le debe ese aviso a su `coordinator`: `structured error context`.',
    },
    see: {
      kind: 'flow',
      title: { en: 'When a subagent\'s search fails', es: 'Cuando falla la búsqueda de un subagente' },
      steps: [
        {
          label: { en: 'subagent runs a search', es: 'el subagente lanza una búsqueda' },
          note: {
            en: 'The web search subagent queries one subtopic of the research, say music production.',
            es: 'El subagente de búsqueda web consulta un subtema de la investigación, por ejemplo la producción musical.',
          },
        },
        {
          label: { en: 'timeout → retry locally', es: 'timeout → reintentar en local' },
          note: {
            en: 'A `transient error` is handled where it happens: the subagent retries on its own before bothering anyone.',
            es: 'Un `transient error` se resuelve donde ocurre: el subagente reintenta por su cuenta antes de molestar a nadie.',
          },
          loop: 0,
        },
        {
          label: { en: 'still failing → `structured error context`', es: 'sigue fallando → `structured error context`' },
          note: {
            en: 'It reports failure type, the query it tried, partial results and alternatives; never just "search unavailable".',
            es: 'Reporta el tipo de fallo, la consulta intentada, los resultados parciales y alternativas; nunca solo «search unavailable».',
          },
        },
        {
          label: { en: '`coordinator` picks a recovery', es: 'el `coordinator` elige cómo seguir' },
          note: {
            en: 'It can retry a narrower query, try another source or go on with the partial results; the whole run does not die.',
            es: 'Puede reintentar una consulta más acotada, probar otra fuente o seguir con lo parcial; la ejecución entera no se cae.',
          },
        },
        {
          label: { en: 'report flags the gap', es: 'el informe marca el hueco' },
          note: {
            en: 'If the gap remains, a `coverage annotation` says which findings are well supported and which subtopic lacks sources.',
            es: 'Si el hueco sigue, una `coverage annotation` indica qué hallazgos están bien respaldados y qué subtema se queda sin fuentes.',
          },
        },
        {
          label: { en: 'no matches → `valid empty result`', es: 'sin coincidencias → `valid empty result`' },
          note: {
            en: 'The other branch: the search worked and found nothing. That\'s an answer to pass on, not an error to retry.',
            es: 'La otra rama: la búsqueda funcionó y no encontró nada. Es una respuesta que se transmite, no un error que reintentar.',
          },
        },
      ],
    },
    drill: {
      title: { en: 'What should the subagent do?', es: '¿Qué debe hacer el subagente?' },
      buckets: [
        { en: 'retry locally', es: 'reintentar en local' },
        { en: 'structured error', es: 'error estructurado' },
        { en: 'valid empty result', es: 'vacío válido' },
      ],
      items: [
        {
          text: { en: 'The query ran fine and no papers match it', es: 'La consulta funcionó y no hay ningún artículo que encaje' },
          bucket: 2,
          why: {
            en: 'Zero matches from a working query is an answer, not a failure; retrying only wastes time.',
            es: 'Cero coincidencias en una consulta que funciona es una respuesta, no un fallo; reintentar solo pierde tiempo.',
          },
        },
        {
          text: {
            en: 'A call times out once; a second try will likely work',
            es: 'Una llamada hace timeout una vez; un segundo intento probablemente funcione',
          },
          bucket: 0,
          why: {
            en: 'A `transient error` is fixed locally; only what the subagent can\'t resolve goes up.',
            es: 'Un `transient error` se arregla en local; solo sube lo que el subagente no puede resolver.',
          },
        },
        {
          text: {
            en: 'Still timing out after local retries; 4 sources already read',
            es: 'Sigue haciendo timeout tras reintentar en local; ya ha leído 4 fuentes',
          },
          bucket: 1,
          why: {
            en: 'Send failure type, the query, the 4 partial results and alternatives so the coordinator can choose.',
            es: 'Envía tipo de fallo, consulta, los 4 resultados parciales y alternativas para que el coordinador decida.',
          },
        },
        {
          text: {
            en: 'Access denied: its credentials can\'t read that database',
            es: 'Acceso denegado: sus credenciales no pueden leer esa base de datos',
          },
          bucket: 1,
          why: {
            en: 'Retrying won\'t fix access rights: report what failed and what was tried so the coordinator can reroute.',
            es: 'Reintentar no arregla los permisos: informa de qué falló y qué se intentó para que el coordinador busque otra vía.',
          },
        },
        {
          text: {
            en: 'Retries ran out; returning `[]` as success would keep the run going',
            es: 'Se agotaron los reintentos; devolver `[]` como éxito dejaría seguir la ejecución',
          },
          bucket: 1,
          why: {
            en: 'That disguises an access failure as a valid empty result: the coordinator would think the topic has no sources.',
            es: 'Eso disfraza un fallo de acceso de resultado vacío válido: el coordinador creería que el tema no tiene fuentes.',
          },
        },
      ],
    },
  },
  {
    ts: '5.4',
    plain: {
      en: 'Like detectives on a big case: the lead sends officers to check specific leads, pins what they bring back on the case board, and anyone joining later starts from the board, not from memory. That board is a `scratchpad file`.',
      es: 'Como detectives en un caso grande: la jefa manda a agentes a comprobar pistas concretas, clava en el tablón lo que traen, y quien se incorpora después empieza por el tablón, no por la memoria. Ese tablón es un `scratchpad file`.',
    },
    see: {
      kind: 'flow',
      title: { en: 'Exploring a big codebase without drifting', es: 'Explorar un codebase grande sin perderse' },
      steps: [
        {
          label: { en: 'hand a focused question to a `subagent`', es: 'pasar una pregunta concreta a un `subagent`' },
          note: {
            en: '"Find all test files" goes to a subagent, so its verbose search output stays in that subagent\'s context.',
            es: '«Busca todos los ficheros de test» va a un subagente, y su salida verbosa se queda en el contexto de ese subagente.',
          },
        },
        {
          label: { en: 'only a summary comes back', es: 'solo vuelve un resumen' },
          note: {
            en: 'The main agent gets the key findings, not the noise, and keeps coordinating the high-level picture.',
            es: 'El agente principal recibe los hallazgos clave, no el ruido, y sigue coordinando la visión de conjunto.',
          },
        },
        {
          label: { en: 'write it to a `scratchpad file`', es: 'apuntarlo en un `scratchpad file`' },
          note: {
            en: 'Key findings go into a file the agent rereads for later questions, so specific classes survive context boundaries.',
            es: 'Los hallazgos clave van a un fichero que el agente relee en preguntas posteriores, y las clases concretas sobreviven a los límites de contexto.',
          },
        },
        {
          label: { en: 'next phase starts from that summary', es: 'la siguiente fase parte de ese resumen' },
          note: {
            en: 'Summarize the phase\'s findings and inject them into the next subagents\' initial context, so they don\'t start blind.',
            es: 'Resume los hallazgos de la fase e inyéctalos en el contexto inicial de los siguientes subagentes, para que no empiecen a ciegas.',
          },
          loop: 0,
        },
        {
          label: { en: 'context filling up → `/compact`', es: 'contexto lleno → `/compact`' },
          note: {
            en: 'When verbose discovery output fills a long session, `/compact` reduces context use; the scratchpad keeps the specifics.',
            es: 'Cuando la salida verbosa llena una sesión larga, `/compact` reduce el uso de contexto; el scratchpad conserva lo concreto.',
          },
        },
        {
          label: { en: 'crash → load the `crash-recovery manifest`', es: 'caída → cargar el `crash-recovery manifest`' },
          note: {
            en: 'If the run dies instead: each agent exported its state to a known location; the coordinator loads it and injects it into prompts.',
            es: 'Si en cambio la ejecución se cae: cada agente exportó su estado a una ubicación conocida; el coordinador lo carga y lo inyecta en los prompts.',
          },
        },
      ],
    },
    drill: {
      title: { en: 'Subagent, scratchpad or manifest?', es: '¿Subagente, scratchpad o manifest?' },
      buckets: [
        { en: 'subagent', es: 'subagente' },
        { en: 'scratchpad file', es: 'scratchpad file' },
        { en: 'manifest', es: 'manifest' },
      ],
      items: [
        {
          text: {
            en: 'Find all test files: thousands of lines of search output',
            es: 'Buscar todos los tests: miles de líneas de resultados',
          },
          bucket: 0,
          why: {
            en: 'A focused question with verbose output: delegate it and get back only the summary.',
            es: 'Pregunta concreta con salida verbosa: delégala y recibe solo el resumen.',
          },
        },
        {
          text: {
            en: 'Resume after a crash without redoing finished agents\' work',
            es: 'Reanudar tras una caída sin repetir lo que ya hicieron los agentes',
          },
          bucket: 2,
          why: {
            en: 'Each agent exported its state to a known location; on resume the coordinator loads the manifest.',
            es: 'Cada agente exportó su estado a una ubicación conocida; al reanudar, el coordinador carga el manifest.',
          },
        },
        {
          text: {
            en: 'Keep the exact classes found in hour 1 for questions in hour 3',
            es: 'Conservar las clases exactas de la primera hora para preguntas de la tercera',
          },
          bucket: 1,
          why: {
            en: 'Write key findings to a file and reread it, instead of trusting a long, degrading context.',
            es: 'Apunta los hallazgos clave en un fichero y reléelo, en vez de fiarte de un contexto largo que se degrada.',
          },
        },
        {
          text: {
            en: 'Trace refund dependencies while the main agent keeps the big picture',
            es: 'Trazar las dependencias de reembolsos mientras el principal mantiene la visión global',
          },
          bucket: 0,
          why: {
            en: 'Isolating the digging in a subagent keeps the main context free for high-level coordination.',
            es: 'Aislar la exploración en un subagente deja el contexto principal libre para coordinar.',
          },
        },
        {
          text: {
            en: 'Answers now cite "typical patterns", not the classes found earlier',
            es: 'Las respuestas ya hablan de «patrones típicos», no de las clases encontradas',
          },
          bucket: 1,
          why: {
            en: 'That\'s `context degradation`: record key findings in a scratchpad file and reread them for later questions.',
            es: 'Es `context degradation`: apunta los hallazgos clave en un scratchpad file y reléelos en preguntas posteriores.',
          },
        },
      ],
    },
  },
  {
    ts: '5.5',
    plain: {
      en: 'Like quality control in a factory: a 97% pass rate can hide one machine making bad parts, so you check machine by machine, send doubtful parts to an inspector, and keep spot-checking the ones that look fine. Here: accuracy by document type and field, plus `stratified random sampling`.',
      es: 'Como el control de calidad de una fábrica: un 97% de piezas buenas puede esconder una máquina que falla, así que miras máquina a máquina, mandas las dudosas a un inspector y sigues revisando al azar las que parecen bien. Aquí: precisión por tipo de documento y campo, y `stratified random sampling`.',
    },
    see: {
      kind: 'flow',
      title: { en: 'Cutting human review safely', es: 'Reducir la revisión humana sin riesgos' },
      steps: [
        {
          label: { en: 'split accuracy by doc type and field', es: 'desglosar la precisión por tipo y campo' },
          note: {
            en: 'A 97% average can hide one document type or field that fails; check every segment before reducing review.',
            es: 'Un 97% de media puede esconder un tipo de documento o un campo que falla; revisa cada segmento antes de reducir la revisión.',
          },
        },
        {
          label: { en: 'model outputs `field-level confidence`', es: 'el modelo da `field-level confidence`' },
          note: {
            en: 'Each extracted field gets its own confidence score, so review can target one field instead of a whole document.',
            es: 'Cada campo extraído lleva su propia puntuación de confianza, y la revisión puede centrarse en un campo y no en todo el documento.',
          },
        },
        {
          label: { en: 'calibrate thresholds on labeled data', es: 'calibrar umbrales con datos etiquetados' },
          note: {
            en: 'Check the scores against a labeled validation set to learn which confidence level is actually reliable.',
            es: 'Contrasta las puntuaciones con un conjunto de validación etiquetado para saber qué nivel de confianza es fiable de verdad.',
          },
        },
        {
          label: { en: 'doubtful cases → human review', es: 'lo dudoso → revisión humana' },
          note: {
            en: 'Low-confidence fields and ambiguous or contradictory source documents go to people: scarce reviewer time goes where it matters.',
            es: 'Los campos de baja confianza y los documentos fuente ambiguos o contradictorios van a personas: el poco tiempo de revisión va donde importa.',
          },
        },
        {
          label: { en: 'keep sampling the confident ones', es: 'seguir muestreando lo de alta confianza' },
          note: {
            en: '`stratified random sampling` of high-confidence extractions keeps measuring the real error rate and catches new error patterns.',
            es: 'El `stratified random sampling` de las extracciones de alta confianza sigue midiendo la tasa de error real y detecta patrones de error nuevos.',
          },
          loop: 0,
        },
      ],
    },
    drill: {
      title: { en: 'Review, accept or validate first?', es: '¿Revisar, aceptar o validar antes?' },
      buckets: [
        { en: 'human review', es: 'revisión humana' },
        { en: 'auto-accept', es: 'aceptar sin revisar' },
        { en: 'validate first', es: 'validar antes' },
      ],
      items: [
        {
          text: {
            en: '`total` scored far below its calibrated threshold',
            es: '`total` puntúa muy por debajo de su umbral calibrado',
          },
          bucket: 0,
          why: {
            en: 'Low confidence on a calibrated scale is exactly what scarce reviewer time is for.',
            es: 'Baja confianza en una escala calibrada: justo para eso está el poco tiempo de los revisores.',
          },
        },
        {
          text: {
            en: 'Validated document type, every field above its calibrated threshold',
            es: 'Tipo de documento validado y todos los campos por encima de su umbral calibrado',
          },
          bucket: 1,
          why: {
            en: 'Validated and above calibrated thresholds: accept it, while stratified sampling keeps checking a share.',
            es: 'Validado y por encima de umbrales calibrados: se acepta, mientras el muestreo estratificado sigue revisando una parte.',
          },
        },
        {
          text: {
            en: 'Team wants to drop review for a type; only "97% overall" is known',
            es: 'El equipo quiere quitar la revisión de un tipo; solo se sabe «un 97% global»',
          },
          bucket: 2,
          why: {
            en: 'An average can hide a weak type or field: measure accuracy per segment before automating.',
            es: 'Una media puede ocultar un tipo o un campo flojo: mide la precisión por segmento antes de automatizar.',
          },
        },
        {
          text: {
            en: 'Confident, but the source PDF shows two different totals',
            es: 'Confianza alta, pero el PDF original muestra dos totales distintos',
          },
          bucket: 0,
          why: {
            en: 'Ambiguous or contradictory source documents go to a person, whatever the model\'s confidence.',
            es: 'Los documentos fuente ambiguos o contradictorios van a una persona, diga lo que diga la confianza del modelo.',
          },
        },
        {
          text: {
            en: 'Confident, validated type, and drawn in this week\'s stratified sample',
            es: 'Confianza alta, tipo validado y elegido en el muestreo estratificado de la semana',
          },
          bucket: 0,
          why: {
            en: 'Sampled high-confidence items get human eyes: that is how the real error rate and new patterns are measured.',
            es: 'Lo de alta confianza que sale en la muestra lo mira un humano: así se mide la tasa de error real y se ven patrones nuevos.',
          },
        },
      ],
    },
  },
  {
    ts: '5.6',
    plain: {
      en: 'Like a newsroom: every quote keeps its byline and date, and when two sources disagree the story says who said what instead of quietly picking one. In a pipeline that byline is a `claim-source mapping`, and it has to survive every summary.',
      es: 'Como una redacción de periódico: cada cita conserva su autor y su fecha, y si dos fuentes discrepan la noticia cuenta quién dijo qué en vez de elegir una en silencio. En un pipeline, esa firma es un `claim-source mapping`, y tiene que sobrevivir a cada resumen.',
    },
    see: {
      kind: 'compare',
      title: { en: 'Two credible sources disagree', es: 'Dos fuentes fiables discrepan' },
      sides: [
        {
          label: { en: 'flattened summary', es: 'resumen aplanado' },
          tone: 'bad',
          body: {
            en: '"Adoption has reached 41%."\n\nwhich source? which year? excerpt?\nthe 34% survey? dropped\n\n→ nobody can check it, and the doubt is hidden',
            es: '«La adopción ha llegado al 41%.»\n\n¿qué fuente? ¿qué año? ¿qué extracto?\n¿la encuesta del 34%? descartada\n\n→ nadie puede comprobarlo y la duda queda oculta',
          },
        },
        {
          label: { en: 'claim-source mapping', es: 'claim-source mapping' },
          tone: 'good',
          body: {
            en: '34% · Survey A, 2024, 1,200 firms\n  "34% of firms have adopted…"\n41% · Report B, 2024, member panel\n  "41% of members now use…"\n\nContested: both kept, conflict noted\n\n→ the reader sees who says what and how they measured',
            es: '34% · Encuesta A, 2024, 1.200 empresas\n  «el 34% de las empresas ha adoptado…»\n41% · Informe B, 2024, panel de socios\n  «el 41% de los socios ya usa…»\n\nDiscutido: se conservan ambos y se anota\n\n→ el lector ve quién dice qué y cómo lo midió',
          },
        },
      ],
      why: {
        en: 'Each claim stays tied to its source, excerpt and date through every step. When credible sources disagree, annotate the conflict and let the coordinator reconcile; don\'t pick one.',
        es: 'Cada afirmación sigue unida a su fuente, su extracto y su fecha en cada paso. Si fuentes fiables discrepan, anota el conflicto y deja que el coordinador lo concilie; no elijas una.',
      },
    },
    drill: {
      title: { en: 'Established, contested or a trend?', es: '¿Consolidado, discutido o evolución?' },
      buckets: [
        { en: 'established', es: 'consolidado' },
        { en: 'contested', es: 'discutido' },
        { en: 'change over time', es: 'cambio en el tiempo' },
      ],
      items: [
        {
          text: {
            en: 'Three independent sources report the same 2024 figure',
            es: 'Tres fuentes independientes dan la misma cifra de 2024',
          },
          bucket: 0,
          why: {
            en: 'Independent agreement on the same period: it goes in the well-established section, sources attached.',
            es: 'Coinciden fuentes independientes sobre el mismo periodo: va a la sección de consolidados, con sus fuentes.',
          },
        },
        {
          text: {
            en: 'Two credible studies of 2024 data: 34% vs 41%',
            es: 'Dos estudios fiables con datos de 2024: 34% frente a 41%',
          },
          bucket: 1,
          why: {
            en: 'Same period, different values: keep both with attribution, annotate the conflict, let the coordinator reconcile.',
            es: 'Mismo periodo, valores distintos: conserva ambos con su fuente, anota el conflicto y que el coordinador concilie.',
          },
        },
        {
          text: { en: 'A 2021 report says 12%; a 2024 report says 18%', es: 'Un informe de 2021 dice 12%; uno de 2024 dice 18%' },
          bucket: 2,
          why: {
            en: 'With dates attached, the gap reads as change over time, not as a contradiction.',
            es: 'Con las fechas delante, la diferencia es una evolución en el tiempo, no una contradicción.',
          },
        },
        {
          text: {
            en: 'Same 2024 period, two credible reports differ; one is far better known',
            es: 'Mismo periodo de 2024, dos informes fiables difieren; uno es mucho más conocido',
          },
          bucket: 1,
          why: {
            en: 'Fame isn\'t a reason to drop a credible source: annotate the conflict instead of choosing one.',
            es: 'La fama no es motivo para descartar una fuente fiable: anota el conflicto en vez de elegir una.',
          },
        },
        {
          text: {
            en: 'Two figures differ; both published in 2025, data collected 2022 vs 2025',
            es: 'Dos cifras difieren; ambas publicadas en 2025, con datos recogidos en 2022 y 2025',
          },
          bucket: 2,
          why: {
            en: 'Collection dates, not just publication dates, show the two figures describe different moments.',
            es: 'Las fechas de recogida, no solo las de publicación, muestran que las cifras describen momentos distintos.',
          },
        },
      ],
    },
  },
];
