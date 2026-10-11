// Traducción al español de cada pregunta, por id. Se ve con el botón EN|ES de arriba
// a la derecha; las opciones y explicaciones van en el mismo orden que en inglés.
// Los identificadores de código, herramientas, rutas y flags se quedan como en el original.
import type { QuestionText } from './game.ts';

export const QUESTIONS_ES: Record<string, QuestionText> = {
  's-loop-text-ends-turn': {
    scenario:
      'El bucle de tu agente de soporte da una respuesta por final siempre que contiene algo de texto. Los logs muestran que el 9% de las conversaciones se detienen justo después de «Déjame revisar ese pedido». Esa misma respuesta incluía también un bloque tool_use de lookup_order que nunca se ejecutó, así que el cliente nunca recibe respuesta.',
    ask: '¿Cuál es la corrección más eficaz del flujo de control del bucle?',
    options: [
      'Añadir una regla al system prompt que indique al agente que nunca escriba texto en una respuesta que también contenga una tool call.',
      'Buscar en cada respuesta frases como «déjame revisar» o «un momento» y mantener el bucle en marcha cuando aparezca alguna.',
      'Seguir iterando mientras stop_reason sea "tool_use", ejecutando las tools y añadiendo sus resultados; parar con "end_turn".',
      'Ejecutar el bucle durante 8 iteraciones fijas en cada conversación para que las tool calls pendientes siempre tengan tiempo de terminar.',
    ],
    why: [
      'Que haya texto junto a una tool call es normal, y una regla en el prompt es probabilística. La comprobación de terminación defectuosa seguiría ahí.',
      'Analizar frases en lenguaje natural para decidir cuándo termina el bucle es un anti-patrón: la redacción varía y la comprobación se dejará casos.',
      'El campo stop_reason es la señal fiable: "tool_use" significa ejecutar las tools y devolver los resultados; solo "end_turn" significa que el agente ha terminado.',
      'Un límite arbitrario de iteraciones como regla principal de parada desperdicia llamadas en los casos sencillos y corta los complejos.',
    ],
    rule: 'Controla el bucle con stop_reason, no por la presencia de texto del asistente.',
  },
  's2-fixed-sequence-vs-model-driven': {
    scenario:
      'Para que el comportamiento fuera predecible, el equipo sustituyó las elecciones de tools del modelo por una secuencia fija en todas las conversaciones: get_customer, luego lookup_order y luego process_refund. Las devoluciones siguen funcionando, pero las consultas de facturación y de cuenta fallan: el 27% de esos chats falla porque se llama a lookup_order sin ningún pedido que consultar.',
    ask: '¿Qué enfoque corrige mejor esto sin perder las salvaguardas críticas?',
    options: [
      'Entrenar un clasificador aparte con tickets anteriores para elegir qué secuencia fija ejecutar antes de que el agente empiece con cada solicitud.',
      'Añadir ramas a la secuencia fija para cada tipo de solicitud (devoluciones, facturación, cuenta) y elegir la rama por coincidencia de palabras clave.',
      'Mantener la secuencia, pero hacer que lookup_order devuelva un resultado vacío si no recibe ID de pedido, para que el pipeline llegue al final.',
      'Volver a dejar que Claude elija cada siguiente tool según el contexto y garantizar solo el orden de los pasos críticos con hooks o gates.',
    ],
    why: [
      'Es una infraestructura pesada que sigue metiendo cada caso en una secuencia predefinida en lugar de razonar a partir de los resultados intermedios.',
      'Los árboles de decisión hechos a mano se vuelven más frágiles con cada nuevo tipo de solicitud, y el enrutado por palabras clave falla con solicitudes mixtas o poco habituales.',
      'Oculta el síntoma: el agente sigue ejecutando pasos que no tienen sentido para la solicitud y puede llegar a process_refund sin motivo.',
      'Las decisiones guiadas por el modelo se adaptan a lo que necesita cada conversación, mientras que los gates programáticos mantienen los pocos órdenes que deben cumplirse siempre, como verificar la identidad antes de reembolsar.',
    ],
    rule: 'Deja que Claude elija las tools; fija en código solo los órdenes que deben cumplirse siempre.',
  },
  's2-iteration-cap-primary-stop': {
    scenario:
      'Para evitar costes descontrolados, tu bucle se detiene tras 4 iteraciones pase lo que pase. Los casos con varios pedidos (get_customer, tres llamadas a lookup_order y luego process_refund) se cortan a medias: el 11% de las conversaciones acaba sin respuesta, y el último stop_reason registrado en todas ellas es "tool_use".',
    ask: '¿Cuál es el cambio más eficaz en el bucle?',
    options: [
      'Subir el límite a 12 iteraciones, que cubre la conversación con varios pedidos más larga encontrada en los logs de producción del mes pasado.',
      'Continuar mientras stop_reason sea "tool_use" y parar con "end_turn", con un límite holgado solo como red de seguridad ante bucles descontrolados.',
      'Pedir al modelo que termine cada respuesta final con el token RESOLVED y seguir iterando hasta que ese token aparezca en una respuesta.',
      'Fusionar get_customer y lookup_order en una sola tool para que los casos típicos con varios pedidos quepan en el límite actual de cuatro iteraciones.',
    ],
    why: [
      'Un límite arbitrario más alto sigue siendo la regla principal de parada; el siguiente caso con más pedidos se cortará igual.',
      'stop_reason indica si el modelo quiere hacer más tool calls. Un límite alto mantenido como respaldo protege frente a bugs sin cortar el trabajo normal.',
      'Analizar marcadores en lenguaje natural para decidir la terminación es un anti-patrón: el token puede faltar, estar mal escrito o aparecer demasiado pronto.',
      'Rediseñar las tools para que encajen en un límite arbitrario trata el síntoma; los casos con más pedidos seguirían truncándose.',
    ],
    rule: 'Para con end_turn; el límite de iteraciones es una red de seguridad, no la regla de parada.',
  },
  's2-tool-results-not-appended': {
    scenario:
      'Los logs muestran al agente llamando a lookup_order con el mismo ID de pedido cuatro o cinco veces seguidas y luego diciendo al cliente «No he podido recuperar tu pedido». Todas las llamadas devolvieron el pedido completo sin errores. El código de tu bucle ejecuta la tool solicitada, registra su resultado en los logs y envía la siguiente petición con el mismo array messages que antes.',
    ask: '¿Cuál es la causa raíz más probable?',
    options: [
      'Las respuestas de lookup_order son demasiado grandes, así que cada resultado queda fuera de la atención del modelo antes de que pueda leer los datos del pedido.',
      'La descripción de lookup_order es demasiado vaga, así que el modelo no tiene claro si la llamada funcionó y la repite por si acaso.',
      'Los resultados de las tools nunca se añaden al historial de la conversación, así que en cada iteración el modelo no sabe que la llamada se ejecutó.',
      'El bucle no tiene límite de iteraciones, así que el modelo puede llamar a la misma tool una y otra vez hasta que acaba rindiéndose con la solicitud.',
    ],
    why: [
      'Los resultados verbosos pueden diluir la atención, pero aquí el resultado ni siquiera llega al modelo, porque la siguiente petición reutiliza los mensajes antiguos.',
      'Las descripciones determinan qué tool se elige, no si se ve un resultado. El modelo no puede fijarse en un resultado que nunca se le devolvió.',
      'Cada resultado de tool debe añadirse a messages como tool_result antes de la siguiente petición; si no, el modelo razona como si la tool nunca se hubiera ejecutado.',
      'Un límite solo cortaría antes la repetición mientras el modelo sigue sin los datos. Los límites de iteraciones no son el mecanismo de control principal.',
    ],
    rule: 'Añade cada resultado de tool al historial antes de la siguiente petición.',
  },
  's2-coordinator-invokes-all-subagents': {
    scenario:
      'Has dividido el agente en un coordinador con subagentes de facturación, devoluciones y cuenta. El coordinador pasa cada solicitud por los tres y combina sus respuestas. Las preguntas sencillas sobre restablecer la contraseña tardan ahora 14 segundos en vez de 4, y las respuestas combinadas a veces incluyen notas de facturación irrelevantes.',
    ask: '¿Cuál es la mejora más eficaz?',
    options: [
      'Que el coordinador analice cada solicitud e invoque solo los subagentes que necesita, usando varios solo en los casos con varios asuntos.',
      'Ejecutar los tres subagentes en paralelo en vez de en secuencia para que el pipeline completo termine antes en cualquier tipo de solicitud.',
      'Indicar a cada subagente que responda «no aplica» cuando una solicitud quede fuera de su especialidad, para que la combinación la descarte.',
      'Volver a fusionar los tres subagentes en un solo agente con todas sus tools, ya que el patrón coordinador añade demasiada latencia.',
    ],
    why: [
      'Un coordinador debe seleccionar los subagentes según lo que requiera la solicitud en lugar de ejecutar siempre el pipeline completo; así desaparecen tanto el retraso como el ruido.',
      'El paralelismo reduce algo de latencia, pero sigue pagando por cada subagente innecesario y sigue metiendo salida irrelevante en la combinación.',
      'Todos los subagentes siguen ejecutándose en cada solicitud, así que el coste y la mayor parte de la latencia se mantienen; solo parchea el paso de combinación.',
      'Desecha una separación de roles útil en lugar de corregir la decisión de enrutado que realmente causa el problema.',
    ],
    rule: 'Un coordinador invoca solo los subagentes que la solicitud realmente necesita.',
  },
  's2-parallel-task-calls': {
    scenario:
      'Un cliente informa de problemas con tres pedidos distintos. El agente lanza un subagente de investigación por pedido, pero los logs muestran que emite una llamada a Task, espera su resultado y emite la siguiente llamada a Task en un turno posterior. Estas conversaciones duran 41 segundos de media, y las tres investigaciones no dependen unas de otras.',
    ask: '¿Cuál es la forma más eficaz de reducir esta latencia?',
    options: [
      'Dar a cada subagente un system prompt más corto y un conjunto de tools más pequeño para que cada investigación individual termine antes.',
      'Prescindir de los subagentes y que el agente principal investigue él mismo los tres pedidos, uno tras otro, en su propio bucle.',
      'Hacer que el agente emita las tres llamadas a Task en una sola respuesta para que las investigaciones independientes corran en paralelo.',
      'Pedir al cliente que elija primero el pedido más urgente y que abra conversaciones separadas para los otros dos pedidos.',
    ],
    why: [
      'Los prompts más cortos recortan un poco cada ejecución, pero el lanzamiento de uno en uno que triplica la latencia sigue ahí.',
      'Mantiene el trabajo estrictamente secuencial y llena el contexto del agente principal con los detalles de las tres investigaciones.',
      'Varias llamadas a Task emitidas en una misma respuesta del coordinador se ejecutan de forma concurrente, así que las investigaciones independientes dejan de esperarse entre sí.',
      'Traslada el coste al cliente y reduce la resolución en el primer contacto en un problema que el agente puede resolver.',
    ],
    rule: 'Lanza los subagentes independientes con varias llamadas a Task en una sola respuesta.',
  },
  's2-subagent-missing-case-context': {
    scenario:
      'En las disputas de facturación, el agente principal lanza un subagente de investigación mediante la tool Task con el prompt «Investiga el cargo duplicado del cliente». Los logs muestran al subagente llamando a get_customer con nombres inventados y pidiendo el número de pedido, aunque el agente principal ya había verificado al cliente C-5521 y el pedido #7730.',
    ask: '¿Cuál es la corrección más eficaz?',
    options: [
      'Dar al subagente una tool que lea el historial completo de la conversación del agente principal para que busque él mismo cualquier dato que necesite.',
      'Incluir el ID de cliente verificado, el número de pedido, los importes de los cargos y las fechas directamente en el prompt de Task del subagente.',
      'Permitir que el subagente escriba directamente al cliente para que reúna los identificadores que falten antes de empezar a investigar.',
      'Activar la opción de memoria compartida en la AgentDefinition del subagente para que herede automáticamente el contexto del agente padre.',
    ],
    why: [
      'Añade una tool extra y le lanza al subagente toda la transcripción verbosa cuando solo necesita un puñado de datos verificados.',
      'Los subagentes empiezan con un contexto aislado, así que todo lo que necesitan debe pasárseles explícitamente en el prompt; los datos verificados acaban con las conjeturas y las preguntas repetidas.',
      'Volver a pedir al cliente datos que ya estaban verificados empeora la experiencia y se salta al coordinador.',
      'No existe tal opción: AgentDefinition no tiene herencia automática de contexto, así que el contexto del subagente debe proporcionarse en el prompt.',
    ],
    rule: 'Los subagentes no heredan nada: pásales en el prompt los datos que necesitan.',
  },
  'a-human-gate': {
    scenario:
      'Un agente redacta y envía emails de seguimiento a los clientes. La mayoría están bien, pero cada semana algunos contienen promesas erróneas sobre fechas de entrega, y una vez enviados el daño ya está hecho.',
    ask: '¿Dónde debería intervenir una persona?',
    options: [
      'Hacer una auditoría humana semanal sobre una muestra aleatoria de emails enviados y llevar lo encontrado al prompt.',
      'Exigir que una persona apruebe el email antes de enviarlo, al menos cuando mencione fechas o compromisos.',
      'En ningún sitio: añadir al prompt «nunca prometas fechas de entrega que no puedas verificar en el sistema de pedidos».',
      'Quitar al agente la capacidad de enviar emails, para que una persona escriba y envíe a mano cada seguimiento.',
    ],
    why: [
      'Detecta el problema después de la acción irreversible.',
      'Coloca el gate justo antes de la acción irreversible y de alto riesgo. El agente sigue encargándose de redactar.',
      'Ayuda, pero el fallo sale caro y el prompt no es una garantía.',
      'Se pasa de frenada y pierde la mayor parte del valor.',
    ],
    rule: 'La aprobación humana va justo antes de las acciones irreversibles y de alto impacto.',
  },
  's-escalation-handoff-summary': {
    scenario:
      'Cuando el agente escala, escalate_to_human solo recibe «El cliente necesita ayuda con un reembolso». Los agentes humanos no pueden ver la transcripción de la conversación. Dedican una media de 6 minutos a volver a pedir a los clientes los números de pedido y lo que ya se ha intentado, y los casos escalados obtienen un 2,1/5 en satisfacción.',
    ask: '¿Cuál es la mejora más eficaz?',
    options: [
      'Adjuntar a cada escalado la transcripción completa en bruto, con todas las salidas de las tools, para que la persona pueda leerla entera.',
      'Incluir la puntuación de sentimiento del cliente y la confianza del agente para que las personas prioricen a los clientes más enfadados.',
      'Hacer que escalate_to_human reciba un resumen con ID de cliente, pedidos, causa raíz, importe del reembolso y acción recomendada.',
      'Hacer que el agente envíe al cliente un mensaje más cálido disculpándose por la espera y prometiendo que pronto le atenderá una persona.',
    ],
    why: [
      'Un volcado en bruto obliga a la persona a rebuscar los datos entre salidas verbosas de tools, y no aporta diagnóstico ni recomendación.',
      'El sentimiento y la confianza autoevaluada son indicadores poco fiables, y priorizar es un problema distinto al de que falten datos del caso.',
      'Un handoff estructurado da a la persona, que no tiene la transcripción, los hechos, la causa raíz y un siguiente paso propuesto, así que no se pregunta nada dos veces.',
      'El tono con el cliente no es el problema; la persona sigue empezando de cero.',
    ],
    rule: 'Los escalados llevan un handoff estructurado: quién, qué, por qué, cuánto y siguiente paso.',
  },
  's-multi-issue-decomposition': {
    scenario:
      'Un cliente escribe: «El pedido #4411 llegó roto, me cobraron dos veces el #4420 y no puedo iniciar sesión». En el 38% de los mensajes con varios problemas como este, el agente resuelve el primero y cierra la conversación. Los demás problemas vuelven como tickets nuevos, lo que reduce la resolución en el primer contacto.',
    ask: '¿Qué enfoque mejora más la resolución de estos mensajes?',
    options: [
      'Escalar a una persona todo mensaje que plantee más de un problema, ya que los casos con varios problemas son demasiado complejos para el agente.',
      'Pedir al cliente que abra un ticket distinto para cada problema, de modo que cada uno se gestione limpiamente en su propia conversación.',
      'Aumentar max_tokens en cada respuesta para que el agente tenga espacio suficiente para tratar todos los problemas en su respuesta final.',
      'Hacer que el agente divida el mensaje en problemas separados, investigue cada uno con el contexto del cliente compartido y responda una sola vez.',
    ],
    why: [
      'Tener varios problemas no hace complejo un caso; el escalado debe responder a huecos en la política, peticiones explícitas o falta de avance. Esto perjudica la resolución en el primer contacto.',
      'Traslada el trabajo al cliente y garantiza más de un contacto por problema.',
      'Las respuestas no se truncan; el agente se detiene tras un problema porque nunca planificó los demás.',
      'Descomponer la solicitud en elementos, investigar cada uno (en paralelo cuando sea posible) con contexto compartido y combinarlos en una sola respuesta cubre todas las cuestiones.',
    ],
    rule: 'Divide las solicitudes con varios problemas, trabaja cada uno y responde una sola vez.',
  },
  's2-gate-checks-call-not-result': {
    scenario:
      'Añadiste un gate que bloquea process_refund hasta que se haya llamado a get_customer en la sesión. Aun así, una auditoría encuentra 23 reembolsos en la cuenta equivocada el mes pasado. En todos ellos, get_customer había devuelto "multiple matches" o "not found", y después el agente reembolsó un pedido que el cliente había mencionado.',
    ask: '¿Cuál es la causa raíz más probable?',
    options: [
      'El gate solo comprueba que se llamó a get_customer, no que devolviera un único ID de cliente verificado que sea el titular del pedido.',
      'El system prompt no recalca con suficiente fuerza que la verificación de identidad debe completarse antes de emitir cualquier reembolso.',
      'Los mensajes de error de get_customer son poco claros, así que el agente no puede saber que su búsqueda no logró verificar al cliente.',
      'El modelo gestiona mal la identidad ambigua y debería sustituirse por un modelo más grande con mayor capacidad de razonamiento.',
    ],
    why: [
      'Un gate de prerrequisito debe comprobar el resultado: bloquear process_refund hasta que exista un ID de cliente verificado que coincida con el pedido que se reembolsa.',
      'El énfasis en el prompt es probabilístico, y esta regla ya se aplica en código; el hueco está en lo que comprueba el código.',
      'Unos errores más claros podrían cambiar el comportamiento del agente, pero el gate seguiría dejando pasar reembolsos tras una búsqueda fallida.',
      'Un modelo más grande sigue teniendo una tasa de fallo distinta de cero; lo que garantiza la regla es un gate determinista con la condición correcta.',
    ],
    rule: 'Condiciona el gate al resultado verificado, no a que se haya llamado a una tool.',
  },
  's2-soft-ordering-prompt-guidance': {
    scenario:
      'En el 20% de los chats de devoluciones, el agente pregunta «¿Cuál es tu número de pedido?» aunque get_customer ya devolvió el único pedido reciente del cliente. Cuesta un turno extra, pero nunca provoca un reembolso erróneo, porque process_refund ya está protegido por un gate que exige un ID de cliente verificado. Quieres menos turnos desperdiciados.',
    ask: '¿Cuál es el primer paso más proporcionado?',
    options: [
      'Construir una capa de enrutado que precargue los pedidos recientes de cada cliente y los inyecte antes del primer turno del agente.',
      'Añadir un hook que bloquee cualquier respuesta que pida un número de pedido hasta que se haya llamado a lookup_order con el pedido reciente del cliente.',
      'Forzar tool_choice a lookup_order en la segunda petición de cada conversación para que siempre se obtenga el pedido reciente.',
      'Añadir al system prompt una pauta y un ejemplo: cuando get_customer muestre un único pedido reciente, confirmarlo en lugar de preguntar.',
    ],
    why: [
      'Añade infraestructura para un problema menor de experiencia antes siquiera de probar la solución barata en el prompt.',
      'Los gates duros son para reglas que deben cumplirse siempre, como verificar la identidad antes de reembolsar. Este, además, bloquearía preguntas legítimas.',
      'Forzar una tool en un turno fijo rompe los chats en los que el cliente tiene varios pedidos o un problema totalmente distinto.',
      'Es una preferencia blanda sin riesgo económico, así que una pauta en el prompt es la solución proporcionada; aquí no hace falta una aplicación determinista.',
    ],
    rule: 'Gates duros para reglas que deben cumplirse siempre; pautas en el prompt para preferencias blandas.',
  },
  'a-refund-cap': {
    scenario:
      'Un agente de soporte tiene dos tools: lookup_order e issue_refund. La política dice que los reembolsos de más de $500 necesitan aprobación humana, y el system prompt lo indica con claridad. En producción, el agente sigue emitiendo de vez en cuando reembolsos de $800 sin escalar.',
    ask: '¿Cuál es el cambio más adecuado?',
    options: [
      'Repetir la regla en mayúsculas al principio y al final del system prompt, y añadir un recordatorio en la descripción de la tool issue_refund.',
      'Imponer el límite en código: issue_refund rechaza importes de más de $500 con un error que indica al agente que escale.',
      'Cambiar a un modelo más grande que siga mejor las instrucciones y bajar la temperatura para que su comportamiento sea más consistente.',
      'Añadir ejemplos few-shot de reembolsos grandes escalados correctamente, cubriendo casos límite como reembolsos divididos o parciales.',
    ],
    why: [
      'El prompt ya indicaba la regla. Gritarla más fuerte sigue siendo probabilístico.',
      'Una regla de negocio estricta debe cumplirse siempre, así que va en código determinista. El error estructurado le dice al agente qué hacer a continuación.',
      'Menos fallos, nunca cero, y a mayor coste. Esquiva la cuestión de fondo.',
      'Mejora la tendencia, no la garantía.',
    ],
    rule: 'Las reglas que deben cumplirse siempre van en código, no en el prompt.',
  },
  's-posttooluse-normalization': {
    scenario:
      'lookup_order devuelve las fechas de entrega como timestamps Unix y el estado como códigos numéricos (3 = entregado), mientras que get_customer devuelve fechas ISO 8601. En el 7% de las comprobaciones de si procede una devolución, el agente calcula mal la ventana de 30 días o interpreta mal el estado del pedido.',
    ask: '¿Cuál es la corrección más eficaz?',
    options: [
      'Añadir al system prompt una tabla de códigos de estado y reglas de conversión de timestamps para que el agente decodifique él mismo los valores en bruto.',
      'Añadir un hook PostToolUse que convierta los timestamps a ISO 8601 y los códigos de estado a etiquetas antes de que el agente los vea.',
      'Añadir una tool date_calculator a la que el agente pueda llamar siempre que necesite comparar fechas o interpretar un código de estado.',
      'Reconstruir los servicios de backend detrás de cada tool MCP para que todos guarden y devuelvan fechas y estados en un formato común.',
    ],
    why: [
      'Sigue pidiendo al modelo que convierta correctamente los valores en bruto en cada llamada, lo cual es probabilístico y propenso a errores.',
      'Un hook PostToolUse transforma los resultados de las tools de forma determinista antes de que el modelo los procese, así que el agente siempre razona sobre formatos coherentes.',
      'Añade un paso que el agente puede saltarse, y los datos en bruto e incoherentes siguen llegando al contexto.',
      'Es un cambio grande y arriesgado en sistemas compartidos cuando normalizar en la frontera del agente resuelve el problema.',
    ],
    rule: 'Normaliza los formatos mezclados de las tools en un hook PostToolUse antes de que Claude los vea.',
  },
  's-refund-threshold-hook': {
    scenario:
      'Cumplimiento normativo exige aprobación humana para cualquier reembolso de más de $500. La regla está en el system prompt con cuatro ejemplos few-shot, pero una auditoría mensual encuentra que 9 de 2100 reembolsos grandes los procesó el agente por su cuenta, uno de ellos de $2300. Un solo caso que se escape cuesta mucho más que un escalado de más.',
    ask: '¿Cuál es la forma más eficaz de garantizar la regla?',
    options: [
      'Añadir un hook que intercepte las llamadas a process_refund de más de $500, las bloquee y redirija al agente a escalate_to_human.',
      'Añadir un hook PostToolUse que revise cada reembolso completado y avise a un supervisor siempre que el importe supere los $500.',
      'Mover la regla de los $500 al principio del system prompt, repetirla en la descripción de process_refund y añadir más ejemplos.',
      'Hacer que el agente puntúe su confianza antes de cada reembolso y pasar a un agente humano todo reembolso con menos de 8 sobre 10.',
    ],
    why: [
      'Un hook que intercepta la tool call saliente aplica la regla de forma determinista antes de que se mueva el dinero y envía el caso al flujo adecuado.',
      'PostToolUse se ejecuta después de que la tool se haya ejecutado, así que el reembolso ya ha salido; detecta las infracciones en lugar de evitarlas.',
      'Las instrucciones y los ejemplos en el prompt tienen una tasa de fallo distinta de cero, y esta configuración ya falló con una regla en el prompt más ejemplos.',
      'La confianza autoevaluada está mal calibrada y no tiene relación con el importe, que es de lo que depende la regla.',
    ],
    rule: 'Una regla que debe cumplirse siempre va en un hook, no en el prompt.',
  },
  's2-blocked-refund-silent': {
    scenario:
      'Un hook previo a la ejecución bloquea ahora las llamadas a process_refund de más de $500. Cuando bloquea una llamada, devuelve un resultado vacío sin ningún error. Desde el lanzamiento, a 64 clientes se les dijo «Tu reembolso de $640 se ha procesado» por reembolsos que nunca se hicieron, y ninguno de esos casos llegó nunca a una persona.',
    ask: '¿Cuál es la corrección más eficaz?',
    options: [
      'Mover la comprobación a un hook PostToolUse que revierta los reembolsos de más de $500 después de ejecutarse y avise al equipo de finanzas.',
      'Añadir una regla al system prompt que indique al agente que nunca confirme un reembolso salvo que esté seguro de que realmente se hizo.',
      'Hacer que el hook devuelva un resultado de bloqueo explícito que indique el límite de $500 y pida al agente que llame a escalate_to_human.',
      'Quitar el hook y subir el límite a $1000 para que se bloqueen menos reembolsos y menos clientes reciban mensajes incorrectos.',
    ],
    why: [
      'Dejar que el reembolso se ejecute y luego revertirlo es detección, no prevención, y añade movimientos de dinero que también pueden fallar.',
      'El agente recibe un resultado vacío que parece un éxito, así que una regla en el prompt no sirve de nada; es el propio hook el que debe decir que la llamada se bloqueó.',
      'Los hooks de interceptación deben bloquear la acción y redirigir al flujo adecuado; un resultado explícito le dice al agente qué ha pasado y qué hacer a continuación.',
      'Cambiar la política para ocultar un bug no es una solución, y los reembolsos por encima del nuevo límite fallarían igual de silenciosamente.',
    ],
    rule: 'Un hook que bloquea debe explicar por qué y redirigir, nunca fallar en silencio.',
  },
  's2-posttooluse-redact-card-data': {
    scenario:
      'get_customer devuelve números de tarjeta de pago completos y respuestas a preguntas de seguridad. El system prompt dice que nunca se repitan, pero QA encuentra un número de tarjeta completo citado en el 0,4% de los chats, y los mismos valores aparecen en los resúmenes de escalado. El agente solo necesita los cuatro últimos dígitos de la tarjeta.',
    ask: '¿Cuál es la forma más eficaz de garantizar que estos datos no aparezcan en las respuestas?',
    options: [
      'Repetir la regla en la descripción de get_customer y añadir ejemplos few-shot que muestren al agente enmascarando números de tarjeta en sus respuestas.',
      'Añadir un hook PostToolUse que elimine las respuestas de seguridad y enmascare las tarjetas salvo los cuatro últimos dígitos antes de que el modelo las vea.',
      'Revisar cada respuesta saliente con una expresión regular y bloquear cualquier mensaje que contenga un número con forma de tarjeta antes de enviarlo.',
      'Pedir al equipo de backend un endpoint get_customer_v2 sin los campos sensibles y migrar a todos los que lo llaman antes del lanzamiento.',
    ],
    why: [
      'Las instrucciones y los ejemplos son probabilísticos, la regla del prompt ya ha fallado y el modelo sigue teniendo los valores en bruto.',
      'Un hook PostToolUse transforma los resultados de las tools de forma determinista antes de que el modelo los procese, así que los valores en bruto nunca pueden llegar a una respuesta ni a un resumen.',
      'Detecta algunas filtraciones a posteriori, pero se le escapan las respuestas de seguridad y los formatos poco habituales, y los datos en bruto siguen en el contexto.',
      'Un cambio en el backend puede ser un buen paso a largo plazo, pero es lento y amplio cuando un hook en la frontera del agente lo resuelve ya.',
    ],
    rule: 'Elimina en un hook PostToolUse los datos que el agente nunca debe usar.',
  },
  's2-adaptive-billing-investigation': {
    scenario:
      'Las disputas de facturación pasan por una cadena fija: verificar al cliente, listar los cargos, compararlos con los pedidos y reembolsar el duplicado. Una cadena del mismo estilo funciona bien para las devoluciones, pero el 38% de las disputas se escalan porque la causa era algo que la cadena nunca comprueba: una suscripción renovada, una conversión de divisa o una autorización pendiente.',
    ask: '¿Qué enfoque de descomposición encaja mejor con las disputas de facturación?',
    options: [
      'Usar una investigación adaptativa que elija cada siguiente paso según lo que revelen los hallazgos anteriores; mantener la cadena fija para devoluciones.',
      'Añadir a la cadena pasos para renovaciones, conversión de divisa y retenciones pendientes, ejecutándolos todos en orden en cada disputa.',
      'Sustituir la cadena por un único prompt grande que enumere todas las causas de disputa conocidas y pida al agente revisarlas todas a la vez.',
      'Escalar cualquier disputa cuyo paso de comparación no encuentre un cargo duplicado, ya que las causas inusuales necesitan que las resuelva una persona.',
    ],
    why: [
      'Las investigaciones abiertas necesitan una descomposición dinámica que genere subtareas a partir de los hallazgos intermedios; los flujos predecibles como las devoluciones encajan con una cadena fija.',
      'Una cadena fija más larga desperdicia pasos en la mayoría de las disputas y seguirá sin detectar la siguiente causa que nadie previó.',
      'Revisarlo todo de una pasada diluye la atención y sigue sin poder adaptarse a lo que descubren las comprobaciones anteriores.',
      'La mayoría de estas causas están al alcance del agente, así que escalarlas reduce sin motivo la resolución en el primer contacto.',
    ],
    rule: 'Cadenas fijas para el trabajo predecible; planes adaptativos para las investigaciones abiertas.',
  },
  's2-stale-session-resume': {
    scenario:
      'Los clientes suelen volver un día después por el mismo caso, y el agente reanuda su sesión anterior. Los logs muestran que les dice «Tu reembolso sigue pendiente» o «el pedido aún no se ha enviado» basándose en resultados de tools de la sesión antigua, aunque ambas cosas habían cambiado durante la noche. El 17% de los chats reanudados repite un estado desactualizado.',
    ask: '¿Cuál es el enfoque más eficaz para estos clientes que vuelven?',
    options: [
      'Guardar las transcripciones completas de las sesiones anteriores y pegarlas en la nueva sesión para que el agente vuelva a tener todo el historial.',
      'Reanudar la sesión antigua y añadir una nota de sistema avisando de que algunos resultados anteriores de tools pueden estar desfasados, para que el agente sea prudente.',
      'Reanudar la sesión antigua con un modelo de ventana de contexto más grande para que el agente pueda contrastar entre sí todos los resultados anteriores de tools.',
      'Empezar una sesión nueva a partir de un resumen estructurado de los datos del caso y hacer que el agente vuelva a consultar el estado actual del pedido.',
    ],
    why: [
      'Vuelve a cargar en la nueva sesión los mismos resultados desactualizados de las tools, y además mucho ruido.',
      'Un aviso vago no dice qué datos han cambiado, así que el agente sigue razonando a partir de los resultados desactualizados.',
      'El tamaño del contexto no es el problema: los resultados antiguos son erróneos, y tener más espacio no los actualiza.',
      'Cuando los resultados de tools anteriores están desactualizados, una sesión nueva con un resumen inyectado y consultas nuevas es más fiable que reanudar.',
    ],
    rule: '¿Resultados de tools desactualizados? Empieza de cero con un resumen en lugar de reanudar.',
  },
  's-prompt-keyword-misrouting': {
    scenario:
      'Después de ampliar las descripciones de ambas tools, los errores de enrutado bajaron pero no desaparecieron. Con mensajes como «mi cuenta muestra el pedido #8812 como entregado, pero nunca llegó», el agente llama a get_customer en lugar de a lookup_order el 70% de las veces. El system prompt dice: «Siempre que el cliente mencione su cuenta, usa get_customer».',
    ask: '¿Cuál es la causa raíz más probable?',
    options: [
      'La regla basada en palabras clave del system prompt se impone a las descripciones de las tools y asocia cualquier mención de «cuenta» con get_customer.',
      'Las descripciones de las tools siguen siendo demasiado cortas, así que el modelo no distingue lookup_order de get_customer en preguntas sobre pedidos.',
      'El modelo no extrae de forma fiable los números de pedido del texto libre, así que recurre a buscar al cliente como primera llamada más segura.',
      'Las dos tools aceptan identificadores que se solapan, así que deberían fusionarse en una tool de búsqueda que elija el backend por sí misma.',
    ],
    why: [
      'Las instrucciones del system prompt sensibles a palabras clave pueden crear asociaciones no deseadas con tools que se imponen a descripciones bien escritas. Reformula o elimina esa regla.',
      'Las descripciones ya se ampliaron, y los fallos se concentran en mensajes que contienen la palabra «cuenta».',
      'Nada apunta a un problema de extracción: el número de pedido está ahí mismo, y el error de enrutado sigue a una palabra concreta.',
      'Fusionar tools es un rediseño mayor que no toca la instrucción que realmente causa el error de enrutado.',
    ],
    rule: 'Revisa si el system prompt tiene reglas por palabras clave que se impongan a las descripciones de las tools.',
  },
  's2-rename-overlapping-status-tool': {
    scenario:
      'Añadiste check_status, descrita como "Checks the status," para informar del progreso de los reembolsos. Desde entonces, el 31% de las preguntas del tipo «¿dónde está mi paquete?» llaman a check_status, que devuelve datos de reembolsos, así que el agente responde que no hay ningún reembolso en curso. lookup_order, que contiene el estado del envío, está descrita como "Gets order status."',
    ask: '¿Cuál es el primer paso más eficaz?',
    options: [
      'Fusionar check_status en lookup_order para que una sola tool devuelva tanto el estado del envío como el del reembolso de cada pedido.',
      'Añadir una regla de enrutado al system prompt: cualquier pregunta con las palabras «paquete» o «envío» debe usar siempre lookup_order.',
      'Renombrar check_status a get_refund_status y reescribir ambas descripciones para indicar qué cubre cada una y cuándo usar la otra.',
      'Añadir un clasificador antes de cada turno que distinga preguntas de envío y de reembolso y exponga solo la tool de estado correspondiente.',
    ],
    why: [
      'Fusionar es un rediseño mayor que infla cada consulta con datos de reembolsos; no es el primer paso proporcionado.',
      'Las reglas por palabras clave son frágiles y pueden crear nuevas asociaciones no deseadas con tools; el solapamiento está en los nombres y descripciones de las tools.',
      'Renombrar la tool y reescribir las descripciones elimina el solapamiento funcional en su origen, que es el primer paso barato y directo.',
      'Un clasificador es sobreingeniería cuando son las propias tools las que tienen nombres y descripciones ambiguos.',
    ],
    rule: 'Elimina primero el solapamiento entre tools con nombres y descripciones precisos.',
  },
  's2-split-generic-order-tool': {
    scenario:
      'Una tool nueva, manage_order(order_id, action, params), gestiona cancelaciones, cambios de producto, cambios de dirección y crédito en tienda a través de su campo action, y su descripción ocupa una línea. Los logs muestran la action equivocada en el 9% de las llamadas, como "cancel" en solicitudes de cambio de producto, además de params a los que les faltan campos que solo necesitan algunas acciones.',
    ask: '¿Cuál es el rediseño más eficaz?',
    options: [
      'Mantener la tool única y añadir al system prompt una tabla que asigne a cada tipo de solicitud del cliente el valor de action correcto.',
      'Dividirla en tools con un propósito específico, como cancel_order y request_exchange, cada una con sus propias entradas y descripción.',
      'Añadir una capa de validación que rechace las llamadas cuyos params no encajen con la action y devuelva un error genérico "invalid request".',
      'Añadir al system prompt ejemplos few-shot de llamadas correctas a manage_order para cada action, cubriendo las solicitudes más comunes.',
    ],
    why: [
      'Traslada la documentación de la tool al system prompt y deja la ambigüedad dentro de un único campo action.',
      'Las tools con un propósito específico, entradas definidas y descripciones claras hacen explícita la elección: el modelo elige una tool en lugar de un modo oculto.',
      'Detecta algunas llamadas erróneas a posteriori, y un error genérico no le da al agente nada con lo que corregirse.',
      'Los ejemplos pueden ayudar un poco, pero no arreglan una tool cuyo propósito y entradas obligatorias cambian con un solo campo.',
    ],
    rule: 'Divide una tool que lo hace todo en tools con propósito específico y contratos claros.',
  },
  't-descriptions': {
    scenario:
      'Un agente tiene search_customers (búsqueda aproximada por nombre o email) y get_customer (obtención exacta por ID). Ambas son necesarias, pero el agente llama a menudo a la equivocada. Cada tool tiene una descripción de una línea.',
    ask: '¿Cuál es la corrección más eficaz?',
    options: [
      'Ampliar cada descripción: qué hace, cuándo usarla, cuándo no y qué significa cada parámetro.',
      'Renombrarlas con nombres más largos y autoexplicativos, como fuzzy_search_customers, y mantener las descripciones.',
      'Añadir al system prompt una regla que indique qué tool usar para cada tipo de solicitud de cliente.',
      'Fusionarlas en una sola tool de clientes con un parámetro de modo que alterne entre búsqueda y obtención.',
    ],
    why: [
      'Las descripciones son lo que usa el modelo para elegir. Explicar cuándo usar cada tool corrige la elección justo donde se toma.',
      'Los nombres ayudan un poco; el significado lo llevan las descripciones.',
      'Separa la documentación de la tool de la propia tool.',
      'Esconde la misma ambigüedad dentro de un parámetro.',
    ],
    rule: 'Las descripciones de las tools son prompts: di cuándo usarlas y cuándo no.',
  },
  's-refund-error-metadata': {
    scenario:
      'process_refund devuelve {"isError": true, "content": "Operation failed"} en cualquier fallo. Los logs muestran que el agente reintenta hasta cinco veces reembolsos bloqueados por la política de devolución de 30 días, pero se rinde ante timeouts de la pasarela de pago que habrían funcionado al segundo intento.',
    ask: '¿Cuál es la corrección más eficaz?',
    options: [
      'Reintentar dentro de la tool tres veces ante cualquier fallo y devolver "Operation failed" solo cuando hayan fallado los tres intentos.',
      'Dar a cada error una categoría (transient, validation, business, permission), isRetryable y un motivo comprensible para el cliente.',
      'Añadir una regla al system prompt: reintentar cada reembolso fallido exactamente una vez y, si sigue sin funcionar, escalar a un agente humano.',
      'Devolver los fallos como resultados normales con isError a false y un registro de reembolso vacío para que la conversación pueda continuar.',
    ],
    why: [
      'Desperdicia reintentos en fallos por reglas de negocio que nunca pueden funcionar, y el mensaje genérico sigue ocultando por qué falló la llamada.',
      'Los metadatos de error estructurados permiten al agente reintentar los fallos transitorios, parar en los no reintentables y explicar al cliente los bloqueos por política.',
      'Una sola regla para todos los fallos sigue sin distinguir un bloqueo por política de un timeout, así que escala casos que el agente debería limitarse a explicar.',
      'Suprimir los errores en silencio puede llevar al agente a decir a los clientes que un reembolso se ha hecho cuando no es así.',
    ],
    rule: 'Los errores de las tools necesitan una categoría, un flag isRetryable y un motivo legible.',
  },
  's2-empty-vs-access-failure': {
    scenario:
      'Durante una caída de 25 minutos de la base de datos de pedidos, lookup_order devolvió {"orders": []} porque su handler captura todas las excepciones y devuelve una lista vacía. El agente dijo a 212 clientes «No encuentro ningún pedido en tu cuenta», y algunos volvieron a hacer pedidos que ya habían pagado.',
    ask: '¿Cuál es la corrección más eficaz?',
    options: [
      'Devolver los fallos con isError, un errorCategory de tipo transient e isRetryable: true, para que nunca parezcan un resultado vacío válido.',
      'Hacer que el agente llame dos veces a lookup_order y solo se fíe de un resultado vacío cuando ambas llamadas devuelvan la misma lista vacía.',
      'Añadir una regla al prompt para que el agente escale a una persona cada vez que lookup_order no devuelva ningún pedido de un cliente.',
      'Mantener las listas vacías para los errores, pero añadir a cada respuesta de lookup_order un campo "note" que diga "results may be incomplete".',
    ],
    why: [
      'Un fallo de acceso requiere decidir si reintentar, mientras que un resultado vacío significa que la consulta funcionó sin coincidencias; los errores estructurados mantienen separadas ambas cosas.',
      'Durante una caída, dos llamadas devuelven dos listas vacías idénticas, y la llamada extra duplica la carga cuando el sistema está sano.',
      'Muchos clientes de verdad no tienen pedidos que coincidan; escalarlos a todos perjudica la resolución y sigue dejando los datos falsos en su sitio.',
      'Un aviso permanente hace que todos los resultados reales parezcan dudosos y sigue sin revelar cuándo está ocurriendo realmente una caída.',
    ],
    rule: 'Nunca presentes un fallo de acceso como un éxito vacío.',
  },
  's2-validation-error-detail': {
    scenario:
      'process_refund devuelve {"isError": true, "errorCategory": "validation"} sin más detalle. En el 6% de los intentos de reembolso, el agente se rinde y escala tras este error. Las reproducciones muestran que las entradas tenían problemas corregibles: un importe enviado como "$47.80", un reason_code ausente o un ID de pedido sin su prefijo "ORD-".',
    ask: '¿Cuál es la mejora más eficaz?',
    options: [
      'Enumerar en el system prompt todas las reglas de formato de las entradas e indicar al agente que revise cada llamada de reembolso antes de enviarla.',
      'Marcar los errores de validación como isRetryable: true para que el agente siga reenviando la misma solicitud de reembolso hasta que se procese.',
      'Hacer que la tool corrija en silencio todas las entradas que pueda y procese el reembolso sin decirle al agente qué ha cambiado.',
      'Describir cada error de validación (campo, valor recibido, formato esperado) para que el agente pueda corregir su entrada y reintentar.',
    ],
    why: [
      'Puede evitar algunos errores, pero cuando una llamada sí falla, el agente sigue sin recibir ninguna señal de qué estaba mal.',
      'Reenviar la misma entrada falla de la misma forma; los errores de validación necesitan una entrada corregida, no reintentos a ciegas.',
      'Adivinar en silencio puede reembolsar el pedido o el importe equivocados, y el agente no puede explicar al cliente qué ha pasado.',
      'Una descripción concreta y legible le dice al agente exactamente qué corregir, y convierte un callejón sin salida en una autocorrección rápida.',
    ],
    rule: 'Los errores de validación deben indicar qué campo falló y qué se esperaba.',
  },
  's-forced-first-tool-choice': {
    scenario:
      'Los clientes inician sesión, así que cada sesión ya incluye su ID de cliente. Quieres que se llame primero a get_customer en todas las conversaciones. Con tool_choice en "auto", el 14% de los primeros turnos van directamente a lookup_order o a una respuesta de texto, y algunos reembolsos posteriores se basan en datos de cuenta desactualizados.',
    ask: '¿Qué configuración garantiza mejor esa primera llamada?',
    options: [
      'Poner tool_choice en "any" en la primera petición para que el modelo tenga que llamar a alguna tool antes de poder responder al cliente.',
      'Mantener "auto" y añadir una regla al system prompt de que get_customer debe ser siempre la primera tool llamada en cada conversación.',
      'En la primera petición, poner tool_choice en {"type": "tool", "name": "get_customer"} y luego usar "auto" en los turnos siguientes.',
      'Poner tool_choice en {"type": "tool", "name": "get_customer"} en todas las peticiones para refrescar siempre primero los datos de la cuenta.',
    ],
    why: [
      'La opción "any" garantiza una tool call, no qué tool; el modelo puede seguir eligiendo lookup_order.',
      'Una regla en el prompt es probabilística, y el 14% de fallos ya se produce con "auto".',
      'Forzar la selección de tool garantiza una primera llamada concreta; volver a "auto" permite después al agente elegir tools y terminar con normalidad.',
      'Forzar la misma tool en cada turno impide que el agente llame a otras tools o termine con una respuesta.',
    ],
    rule: 'Fuerza una primera tool concreta y luego vuelve a "auto".',
  },
  's2-generic-backend-tool': {
    scenario:
      'Para ir rápido, un compañero dio al agente call_backend_api(method, path, body) junto a las cuatro tools de soporte. En una semana, los logs muestran que se ha usado para consultar pedidos con rutas erróneas, para un PATCH que cambió el email de un cliente y para un reembolso que se saltó el hook que protege process_refund.',
    ask: '¿Cuál es la corrección más eficaz?',
    options: [
      'Mantener call_backend_api, pero añadir una regla al system prompt que enumere qué endpoints y métodos HTTP puede llamar el agente.',
      'Eliminar call_backend_api y añadir una tool acotada y específica para cada necesidad real, con entradas validadas y descripciones claras.',
      'Mantener call_backend_api, pero restringirla a peticiones GET para que el agente pueda leer cualquier endpoint sin poder modificar datos.',
      'Añadir un hook PostToolUse que registre cada petición a call_backend_api para que el equipo de seguridad revise y revierta a diario los abusos.',
    ],
    why: [
      'Una regla en el prompt es probabilística, y la tool genérica sigue ofreciendo una vía para saltarse los hooks que protegen los reembolsos.',
      'Las tools acotadas exponen solo las acciones permitidas con entradas validadas, así que los hooks de política no pueden saltarse y la selección de tools se vuelve más clara.',
      'El acceso de solo lectura impide las escrituras, pero el agente sigue adivinando rutas y puede leer datos que su rol no debería ver.',
      'Registrar a posteriori detecta el mal uso pero no lo evita; el cambio de email y el reembolso ya se han producido.',
    ],
    rule: 'Sustituye las tools genéricas por tools acotadas y específicas.',
  },
  's2-too-many-tools': {
    scenario:
      'En seis meses, el agente de soporte pasó de 4 tools a 19, con tools de inventario, etiquetas de envío, notas de CRM, consentimiento de marketing y analítica. Las llamadas a la tool equivocada subieron del 2% al 13%, sobre todo en reembolsos y consultas de pedidos, y 15 de las nuevas tools se usan cada una en menos del 1% de las conversaciones.',
    ask: '¿Cuál es el cambio más eficaz?',
    options: [
      'Añadir una sección al system prompt que ordene las 19 tools por prioridad para que el agente pruebe primero las más importantes.',
      'Escribir descripciones más largas para las 19 tools para que al modelo le resulte más fácil distinguirlas al elegir a cuál llamar.',
      'Cambiar a un modelo más grande que pueda manejar un conjunto más amplio de tools sin perder precisión en las tareas de soporte básicas.',
      'Quedarse con las tools básicas de soporte y las pocas muy usadas, y pasar las tareas raras a un subagente con sus propias tools acotadas.',
    ],
    why: [
      'Una lista de prioridades añade más texto que el modelo tiene que sopesar y no elimina las opciones irrelevantes.',
      'Las mejores descripciones ayudan con tools parecidas, pero 19 opciones siguen saturando la elección cuando la mayoría rara vez es relevante.',
      'Un modelo más grande no elimina la complejidad de decisión que añaden las tools que quedan fuera del rol del agente.',
      'Demasiadas tools aumentan la complejidad de decisión; limitar el conjunto del agente a su rol recupera la fiabilidad de la selección, y el trabajo poco común se delega.',
    ],
    rule: 'Dale a cada agente solo las tools que su rol necesita.',
  },
  's2-policy-catalog-resource': {
    scenario:
      'El agente busca las políticas con una tool search_policies. Los logs muestran unas 6 búsquedas por conversación, muchas casi duplicadas como «plazo de devolución» y «periodo de devoluciones», antes de encontrar el artículo correcto entre 140. Las búsquedas de políticas suponen el 35% de toda la latencia de tools.',
    ask: '¿Qué cambio reduce mejor estas llamadas exploratorias?',
    options: [
      'Pegar los 140 artículos de políticas en el system prompt para que el agente nunca tenga que buscar ninguno durante una conversación.',
      'Subir de 5 a 25 el número de resultados que devuelve search_policies para que el artículo correcto aparezca más a menudo en la primera búsqueda.',
      'Exponer el catálogo de políticas (títulos, temas, qué cubre cada artículo) como un recurso MCP que el agente pueda leer sin buscar.',
      'Poner una caché delante de search_policies para que las consultas repetidas o casi duplicadas respondan más rápido sin llegar al backend.',
    ],
    why: [
      'Inunda cada petición de contenido mayoritariamente irrelevante y empeora los problemas de atención.',
      'Los conjuntos de resultados más grandes añaden texto irrelevante al contexto y siguen sin decirle al agente qué contiene el catálogo.',
      'Los recursos MCP exponen catálogos de contenido, así que el agente sabe qué existe y va directo al artículo correcto en lugar de explorar a base de prueba y error.',
      'La caché abarata las llamadas repetidas pero no las elimina; el agente sigue explorando a ciegas.',
    ],
    rule: 'Expón los catálogos de contenido como recursos MCP para reducir las llamadas exploratorias.',
  },
  's-case-facts-block': {
    scenario:
      'Las disputas de facturación largas (más de 40 turnos) se resumen progresivamente para ahorrar contexto. QA detecta que, tras el resumen, el agente dice «se habló de un reembolso parcial» y ofrece $25, aunque al cliente se le habían prometido $47.80 por el pedido #A-7731 para el viernes.',
    ask: '¿Cuál es la corrección más eficaz?',
    options: [
      'Guardar importes, fechas, IDs de pedido y promesas en un bloque persistente de datos del caso que va en cada prompt, fuera del resumen.',
      'Resumir con menos frecuencia, esperando a que el contexto esté lleno al 95%, para que cada ronda de resumen pierda menos detalles.',
      'Indicar al resumidor que sea lo más detallado posible para que conserve los números importantes al condensar los turnos antiguos.',
      'Pasar a un modelo con una ventana de contexto más grande para que toda la conversación quepa y no haya que resumirla nunca.',
    ],
    why: [
      'Los datos transaccionales extraídos a su propio bloque sobreviven intactos al resumen y siguen visibles en cada turno.',
      'Se siguen perdiendo detalles cada vez que se resume, y un contexto casi lleno agrava el efecto lost-in-the-middle.',
      'El resumen progresivo tiende a convertir valores exactos en frases vagas; una instrucción vaga no lo impide de forma fiable.',
      'Una ventana más grande aplaza el problema y no resuelve la atención en entradas muy largas.',
    ],
    rule: 'Guarda los datos exactos del caso en un bloque persistente, fuera del historial resumido.',
  },
  's-trim-order-lookups': {
    scenario:
      'lookup_order devuelve 46 campos por pedido, incluidos códigos de almacén, eventos del transportista y líneas de impuestos. Cuando los clientes preguntan por varios pedidos, el contexto se llena tras unas seis consultas y el agente empieza a pasar por alto las fechas límite de devolución de resultados anteriores. Para las devoluciones solo importan unos cinco campos.',
    ask: '¿Qué enfoque resuelve mejor esto?',
    options: [
      'Resumir toda la conversación cada tres turnos para que las salidas de tools antiguas se compriman pronto en texto breve.',
      'Limitar cada conversación a dos consultas de pedidos y escalar a una persona cuando un cliente pregunte por más pedidos.',
      'Cachear cada respuesta completa de lookup_order para que las preguntas repetidas sobre el mismo pedido se ahorren una nueva tool call.',
      'Recortar cada resultado de lookup_order a lo que necesitan las devoluciones (ID de pedido, artículos, fecha de entrega, estado) antes de que entre en contexto.',
    ],
    why: [
      'Los resúmenes en prosa tienden a difuminar las fechas e importes exactos, justo los datos que al agente se le escapan.',
      'Un límite artificial fuerza escalados innecesarios y perjudica la resolución en el primer contacto.',
      'La caché ataca la latencia, que es otro problema; los registros completos seguirían inundando el contexto.',
      'Los resultados verbosos de las tools consumen tokens muy por encima de su relevancia; quedarse solo con los campos necesarios deja sitio para lo que importa.',
    ],
    rule: 'Recorta los resultados de las tools a los campos que necesita la tarea antes de que se acumulen.',
  },
  's2-full-history-each-request': {
    scenario:
      'Para ahorrar tokens, tu app envía cada petición solo con el system prompt y el último mensaje del cliente. Los logs muestran al agente pidiendo el número de pedido dos turnos después de que el cliente lo diera, y en una ocasión ofreciendo un reembolso que el cliente ya había rechazado. Las quejas por «tener que repetirme» se duplicaron.',
    ask: '¿Cuál es la causa raíz más probable?',
    options: [
      'Las peticiones no incluyen la conversación anterior, así que el modelo no tiene constancia de lo que el cliente dijo en turnos previos.',
      'El modelo pierde el hilo de los detalles en chats de varios turnos y necesita una ventana de contexto más grande para tenerlos todos presentes.',
      'Al system prompt le falta una instrucción para recordar los números de pedido y las decisiones del cliente durante todo el chat.',
      'Los resultados de las tools del agente son demasiado verbosos y desplazan los mensajes anteriores del cliente fuera de la ventana de contexto.',
    ],
    why: [
      'La API no tiene estado: cada petición debe llevar el historial de la conversación (o una versión condensada fiel) para mantener la coherencia.',
      'El contexto no está ni de lejos lleno; los turnos anteriores simplemente nunca se envían, así que una ventana más grande no cambia nada.',
      'El modelo no puede recordar lo que nunca recibe, y una instrucción no sustituye al historial que falta.',
      'Solo se envía el último mensaje, así que no hay salidas de tools acumuladas que desplacen nada.',
    ],
    rule: 'Envía el historial de la conversación en cada petición; la API no guarda memoria.',
  },
  's2-prior-tickets-lost-in-middle': {
    scenario:
      'Antes de cada chat, el agente recibe los 12 últimos tickets de soporte del cliente como un único bloque largo de texto. QA detecta que pasa por alto compromisos de los tickets intermedios: un crédito de $30 prometido en el ticket 6 nunca se aplicó, mientras que los detalles del primer y el último ticket se usaron correctamente.',
    ask: '¿Qué enfoque resuelve mejor esto?',
    options: [
      'Cambiar a un modelo con una ventana de contexto más grande para que los 12 tickets quepan holgadamente y reciban la misma atención del agente.',
      'Poner arriba un resumen de datos clave con promesas pendientes e importes, y colocar cada ticket bajo un encabezado de sección claro.',
      'Invertir el orden de los tickets para que los más antiguos queden al final, donde es más probable que el modelo se fije en lo que contienen.',
      'Cargar solo los tres tickets más recientes, ya que los antiguos rara vez contienen información que siga siendo relevante para el caso.',
    ],
    why: [
      'Los tickets ya caben; es el efecto lost-in-the-middle, que una ventana más grande no corrige.',
      'Los hallazgos clave al principio y los encabezados de sección explícitos mitigan los efectos de posición, así que los compromisos enterrados en mitad de la entrada no se pierden.',
      'Reordenar solo cambia qué tickets quedan en el medio, así que parte del contenido se seguirá pasando por alto.',
      'Descarta obligaciones reales como el crédito prometido, que puede estar en cualquier ticket antiguo.',
    ],
    rule: 'Empieza con un resumen de datos clave y usa encabezados para combatir el lost-in-the-middle.',
  },
  's-explicit-human-request': {
    scenario:
      'Un cliente empieza con: «Quiero hablar con una persona, ya». Los logs muestran que el agente responde «¡Puedo ayudarte! ¿Cuál es tu número de pedido?» y llama a lookup_order. En estos chats, el 31% de los clientes abandona, y las quejas hablan de sentirse ignorados.',
    ask: '¿Cuál es el cambio más eficaz en el comportamiento del agente?',
    options: [
      'Intentar primero una resolución rápida y escalar solo si el cliente repite por segunda vez la petición de hablar con una persona.',
      'Atender de inmediato las peticiones explícitas de hablar con una persona llamando a escalate_to_human, sin investigar antes el caso.',
      'Escalar solo cuando el análisis de sentimiento del mensaje muestre una frustración fuerte además de la petición de hablar con una persona.',
      'Explicar todo lo que puede hacer el agente, preguntar si el cliente sigue prefiriendo a una persona y esperar a que lo confirme.',
    ],
    why: [
      'Ofrecer resolver primero encaja con un cliente frustrado que no ha pedido una persona; una exigencia explícita debe atenderse.',
      'Una petición explícita de hablar con una persona es por sí sola un desencadenante de escalado y debe atenderse de inmediato, con un resumen de handoff.',
      'El sentimiento es un indicador poco fiable, y la petición explícita ya es el desencadenante.',
      'Sigue retrasando y cuestionando una petición clara.',
    ],
    rule: 'Un cliente que pide explícitamente hablar con una persona se escala de inmediato.',
  },
  's-multiple-customer-matches': {
    scenario:
      'Una búsqueda de get_customer por el nombre «Maria Lopez» devuelve tres cuentas. Los logs muestran que el agente suele elegir la cuenta con el pedido más reciente. Una auditoría revela que 1 de cada 6 de esas elecciones era el cliente equivocado, lo que expuso los datos de pedidos de otra persona.',
    ask: '¿Cuál es la corrección más eficaz?',
    options: [
      'Hacer que el agente elija la cuenta cuya ciudad de envío mejor encaje con lo que dijo el cliente y, después, la del pedido más reciente.',
      'Hacer que el agente puntúe su confianza en la coincidencia y continúe con la primera cuenta solo cuando la confianza supere el 90%.',
      'Cuando get_customer devuelva varias coincidencias, hacer que el agente pida otro identificador, como el email o un número de pedido.',
      'Escalar a una persona siempre que get_customer devuelva más de una coincidencia, para que alguien elija la cuenta correcta.',
    ],
    why: [
      'Cambia una heurística por otra; una elección equivocada sigue exponiendo los datos de otra persona.',
      'La confianza autoevaluada está mal calibrada y no aporta información para distinguir las cuentas.',
      'Varias coincidencias requieren una aclaración: un identificador más resuelve la ambigüedad sin adivinar.',
      'El agente puede resolver esto con una sola pregunta; escalar perjudica la resolución en el primer contacto.',
    ],
    rule: 'Varias coincidencias de cliente: pide otro identificador, nunca adivines.',
  },
  's2-frustrated-but-resolvable': {
    scenario:
      'Los logs muestran que el agente escala el 22% de los chats en los que los clientes escriben enfadados, p. ej., «¡Esto es ridículo, mi paquete lleva una semana de retraso!», aunque la mayoría son reembolsos por entrega tardía claramente dentro de la política. Ninguno de estos clientes pidió hablar con una persona, y los chats escalados esperan 3 horas de media.',
    ask: '¿Cuál es el cambio más eficaz en el comportamiento del agente?',
    options: [
      'No escalar nunca por el tono y seguir trabajando en el caso incluso cuando el cliente pida explícitamente hablar con una persona.',
      'Escalar solo cuando una puntuación de sentimiento supere un umbral más alto, para que solo se pase a personas a los clientes más enfadados.',
      'Preguntar a cada cliente enfadado si prefiere un agente humano antes de hacer ningún tipo de trabajo sobre su solicitud.',
      'Reconocer la frustración, ofrecer la resolución que permite la política y escalar solo si el cliente pide entonces hablar con una persona.',
    ],
    why: [
      'Ignorar el tono es correcto, pero una petición explícita de hablar con una persona debe atenderse.',
      'El sentimiento es un indicador poco fiable de la complejidad del caso; un umbral más alto sigue escalando casos sencillos.',
      'Invita a escalar casos que el agente puede resolver en el momento y retrasa la solución.',
      'Cuando el problema está al alcance del agente, debe reconocer la frustración y resolverlo, escalando si el cliente pide entonces hablar con una persona.',
    ],
    rule: 'La frustración por sí sola no es un desencadenante: reconoce, resuelve y escala si te lo piden.',
  },
  's2-policy-silent-escalate': {
    scenario:
      'Un cliente se perdió un concierto porque las entradas se enviaron tarde y pide que le devuelvan los $180 de las entradas, no solo los $12 de gastos de envío. La política cubre el reembolso del envío por entrega tardía, pero no dice nada de pérdidas como esta. Los logs muestran que el agente, según el chat, se inventa un crédito de cortesía de $50 o se niega en redondo.',
    ask: '¿Cómo debería gestionar el agente solicitudes como esta?',
    options: [
      'Reembolsar los $12 de envío que cubre la política y escalar después la solicitud de $180 a una persona con un resumen de handoff.',
      'Permitir que el agente ofrezca a su criterio un crédito de cortesía de hasta $50, para que la mayoría de clientes se resuelvan sin una persona.',
      'Rechazar todo lo que la política no cubra explícitamente y explicar al cliente que solo se reembolsan los gastos de envío.',
      'Hacer que el agente valore lo justa que parece la solicitud y escalar solo cuando su confianza en un resultado justo sea inferior al 70%.',
    ],
    why: [
      'Cuando la política no dice nada sobre una solicitud, ese hueco es un desencadenante de escalado: resuelve lo que cubre la política y pasa el resto a una persona con los hechos.',
      'Eso es inventarse la política; una compensación discrecional es una decisión de negocio que no se ha delegado en el agente.',
      'Que la política no diga nada no es una prohibición; una negativa en redondo decide una excepción que el agente no está autorizado a decidir.',
      'La confianza autoevaluada está mal calibrada y no identifica un hueco en la política.',
    ],
    rule: 'Cuando la política no dice nada sobre una solicitud, escala en lugar de improvisar.',
  },
  's2-one-timeout-aborts-case': {
    scenario:
      'En las quejas con varios pedidos, el agente ejecuta un subagente de investigación por pedido. Cuando cualquier subagente sufre un timeout de la API del transportista, toda la conversación termina con «Error del sistema, inténtalo de nuevo más tarde». Esto ocurre en el 7% de los chats con varios pedidos, incluso cuando los demás pedidos se habían resuelto por completo.',
    ask: '¿Qué diseño de gestión de errores mejora más estos casos?',
    options: [
      'Reintentar dentro del subagente hasta que la llamada funcione, tarde lo que tarde, para que el coordinador nunca vea una investigación fallida.',
      'Capturar el timeout en el subagente y devolver un resultado vacío pero exitoso para que los demás pedidos puedan completarse.',
      'Reintentar el fallo transitorio dentro del subagente; si persiste, devolver el tipo de error, lo que se intentó y los datos parciales que haya.',
      'Devolver desde el subagente un estado breve "investigation unavailable" para que el coordinador sepa que este pedido concreto ha fallado.',
    ],
    why: [
      'Los reintentos sin límite pueden bloquear toda la conversación, y el coordinador nunca se entera de que algo va mal.',
      'Presentar un fallo como un éxito lo oculta, así que al cliente se le puede decir que el pedido no tiene ningún problema.',
      'La recuperación local gestiona los errores transitorios, y el contexto estructurado sobre lo que sigue fallando permite al coordinador resolver los demás pedidos y planificar este.',
      'Un estado genérico oculta lo que se intentó y si existen datos parciales, lo que limita las opciones de recuperación del coordinador.',
    ],
    rule: 'Recupérate localmente; propaga los errores no resueltos con contexto y resultados parciales.',
  },
  's2-crash-recovery-case-state': {
    scenario:
      'Cuando el servicio del agente se reinicia durante un deploy, las conversaciones en curso se reanudan solo a partir del texto de la transcripción. La semana pasada, a 14 clientes se les reembolsó dos veces: process_refund había funcionado antes del reinicio, pero el agente reanudado no veía constancia de ello y volvió a emitir el reembolso.',
    ask: '¿Cuál es la corrección más eficaz?',
    options: [
      'Añadir una instrucción al system prompt para que el agente pregunte al cliente si ya se emitió un reembolso antes de reembolsar.',
      'Guardar el estado estructurado del caso tras cada tool call, con los IDs de reembolso, y cargarlo en el prompt del agente al reanudar.',
      'Pausar los deploys en horario laboral para que los reinicios solo ocurran cuando queden pocas conversaciones en curso.',
      'Hacer que el agente vuelva a ejecutar al reiniciar todas las tool calls de la conversación original para reconstruir su visión del caso.',
    ],
    why: [
      'Puede que los clientes no lo sepan o respondan mal, y una instrucción no le da al agente los datos que le faltan.',
      'El estado exportado a una ubicación conocida e inyectado al reanudar permite al agente continuar desde lo que realmente ocurrió, reembolsos completados incluidos.',
      'Hace el problema menos frecuente, pero deja cada reinicio, incluidos los crashes, igual de inseguro.',
      'Repetir las llamadas volvería a ejecutar acciones como process_refund, que es justo lo que provoca los reembolsos dobles.',
    ],
    rule: 'Persiste el estado estructurado para que un reinicio continúe desde los hechos, no desde cero.',
  },
  's2-aggregate-accuracy-masks-segment': {
    scenario:
      'QA revisa el 10% de los chats resueltos e informa de un 95% de resoluciones correctas en total, así que la dirección quiere dejar la revisión humana. Tu desglose muestra un 98% en devoluciones y estado de pedidos, pero un 71% en disputas por renovación de suscripción, que son el 6% del volumen y las más caras cuando se fallan.',
    ask: '¿Qué plan responde mejor a la propuesta de dejar la revisión humana?',
    options: [
      'Reducir la revisión solo en los tipos de caso que ya cumplen el objetivo, seguir revisando todas las disputas de renovación y usar muestreo estratificado en todo.',
      'Dejar toda la revisión humana, ya que el 95% de precisión global ya supera el objetivo de calidad del 90% fijado al inicio del proyecto.',
      'Seguir revisando un 10% de todos los chats elegidos al azar, ya que una muestra aleatoria uniforme es la medida de calidad más justa.',
      'Enviar los chats a revisión humana siempre que la confianza autoevaluada del agente en su resolución baje del 80% para ese chat.',
    ],
    why: [
      'La precisión debe mantenerse en cada segmento antes de reducir la revisión, y el muestreo estratificado sigue midiendo las tasas de error y detecta nuevos patrones de error.',
      'La cifra agregada oculta el segmento débil de las disputas por renovación, que además es el más caro cuando se falla.',
      'El muestreo uniforme dedica la mayor parte del esfuerzo de revisión a segmentos que ya son precisos y deja pocas muestras para el débil.',
      'La confianza autoevaluada sin calibrar no es una señal de enrutado fiable; el agente a menudo está seguro cuando se equivoca.',
    ],
    rule: 'Comprueba la precisión por segmento antes de recortar la revisión; las tasas globales ocultan huecos.',
  },
  's2-claim-source-handoff': {
    scenario:
      'Los agentes humanos señalan que los resúmenes de escalado mezclan lo que dijeron los clientes con lo que confirmaron los sistemas. Un resumen decía «al cliente se le cobró dos veces el #5120»; la persona reembolsó $89, pero facturación mostraba un único cargo. Los revisores no pueden distinguir qué hechos verificó una tool y cuáles solo se afirmaron.',
    ask: '¿Qué cambio corrige mejor esto?',
    options: [
      'Adjuntar a cada escalado las salidas completas en bruto de las tools para que los agentes humanos comprueben ellos mismos cada afirmación del resumen.',
      'Incluir en el resumen solo los hechos confirmados por tools y omitir todo lo que dijo el cliente que no se haya verificado.',
      'Etiquetar cada hecho del resumen con su fuente: la tool y el registro que lo confirmaron, o "customer-stated" si no está verificado.',
      'Añadir a cada resumen una puntuación de confianza global para que los agentes humanos sepan cuánto fiarse de su contenido antes de actuar.',
    ],
    why: [
      'Los volcados en bruto entierran los hechos y siguen sin mostrar de dónde sale cada afirmación del resumen.',
      'Descartar lo que afirma el cliente hace perder el motivo del escalado; las afirmaciones no verificadas son útiles cuando están claramente etiquetadas.',
      'Mapear cada afirmación a su fuente conserva la procedencia a través del resumen, así que las personas actúan sobre hechos verificados y saben qué afirmaciones aún hay que comprobar.',
      'Una única puntuación autoevaluada no muestra qué hechos están verificados, y además está mal calibrada.',
    ],
    rule: 'Etiqueta cada hecho del handoff con su fuente: registro verificado o afirmación del cliente.',
  },
  'g2-adaptive-upgrade-plan': {
    scenario:
      'Claude está actualizando la app del framework v4 a v5 con un plan fijo de seis pasos escrito antes de mirar el código. En el paso 2 descubre que el plugin de auth no tiene versión para v5 y que 30 ficheros dependen de él. Aun así pasa al paso 3, y los pasos siguientes fallan.',
    ask: '¿Qué estrategia de descomposición encaja mejor con esta tarea?',
    options: [
      'Descomposición dinámica: mapear primero las dependencias y luego añadir y reordenar subtareas según surjan hallazgos como lo del plugin.',
      'Un plan fijo más largo, escrito de antemano, con un paso específico para cada plugin, para que ninguna dependencia pueda sorprenderle después.',
      'Ejecutar los seis pasos en subagentes en paralelo, para que un paso que falla no impida que los demás pasos terminen.',
      'Mantener el plan fijo, pero reintentar cada paso fallido hasta tres veces antes de pasar al siguiente paso de la lista.',
    ],
    why: [
      'Las actualizaciones con incompatibilidades desconocidas son tareas abiertas; los planes adaptativos crean subtareas a partir de lo que descubre cada paso.',
      'Ninguna lista previa puede anticipar todas las incompatibilidades, y un plan fijo sigue sin poder reaccionar a lo que descubre.',
      'Los pasos dependen unos de otros, así que ejecutarlos en paralelo produce cambios conflictivos y rotos.',
      'Reintentar no arregla un plan que ya no se corresponde con la realidad; los fallos se deben a que falta el plugin, no a que sean intermitentes.',
    ],
    rule: 'Trabajo abierto en el que los hallazgos cambian el plan: descomposición dinámica.',
  },
  'g2-chain-endpoint-artifacts': {
    scenario:
      'Cada nuevo endpoint de la API necesita los mismos cuatro artefactos, en orden: un schema OpenAPI, un handler construido a partir de él, tests construidos a partir de ambos y documentación de referencia. Pedir los cuatro en un solo prompt da handlers cuyos campos no coinciden con el schema y documentación que describe parámetros que no existen.',
    ask: '¿Qué descomposición deberías usar?',
    options: [
      'Descomposición dinámica adaptativa, dejando que Claude invente un conjunto nuevo de subtareas para cada endpoint según lo que encuentre.',
      'Cuatro subagentes en paralelo, uno por artefacto, cada uno con la descripción del endpoint, para que los cuatro terminen antes.',
      'Un solo prompt con un checklist de los cuatro artefactos y la instrucción de revisar al final que sean consistentes entre sí.',
      'Una cadena fija de prompts: el schema, luego el handler, luego los tests y luego la documentación, y cada paso usa las salidas anteriores.',
    ],
    why: [
      'Los pasos son conocidos y siempre los mismos; la planificación adaptativa añade coste y variación a un flujo predecible.',
      'Cada artefacto depende de los anteriores, así que agentes en paralelo que solo trabajan con la descripción acabarían divergiendo.',
      'Una sola pasada sigue manejando los cuatro artefactos a la vez, y una autorrevisión al final no es fiable.',
      'El prompt chaining encaja con trabajo predecible de varios pasos; cada paso, centrado en una cosa, se apoya en la salida del anterior.',
    ],
    rule: 'Pasos predecibles y dependientes: una cadena fija de prompts (prompt chaining).',
  },
  'g-fork-two-refactors': {
    scenario:
      'Tras una sesión de dos horas de Claude Code analizando el módulo de pagos, quieres comparar dos enfoques de refactor: un patrón strategy y una máquina de estados. Cada intento debe partir del análisis compartido sin que se cuelen en él las ediciones ni el razonamiento del otro intento.',
    ask: '¿Qué enfoque deberías seguir?',
    options: [
      'Seguir en la misma sesión: probar el patrón strategy, revertir sus ediciones y después probar la máquina de estados.',
      'Usar fork_session para crear dos ramas independientes desde la base del análisis, una para cada enfoque de refactor.',
      'Abrir dos sesiones nuevas y repetir en cada una el análisis de dos horas, para que cada enfoque parta de un contexto limpio.',
      'Reanudar la misma sesión con nombre en dos terminales a la vez, uno por enfoque, para que ambos compartan el análisis en vivo.',
    ],
    why: [
      'Revertir ficheros no elimina del contexto el razonamiento del primer intento, así que condiciona el segundo.',
      'fork_session crea ramas independientes desde una base compartida, que es justo lo que hace falta para comparar enfoques divergentes.',
      'Esto desperdicia el análisis existente; la base es válida y se puede compartir en lugar de reconstruirla.',
      'Ambos terminales escribirían en un mismo historial de conversación, así que los dos enfoques no serían independientes.',
    ],
    rule: 'Comparar dos enfoques desde un mismo análisis compartido: fork_session.',
  },
  'g2-named-sessions-resume': {
    scenario:
      'Durante una semana has alternado dos investigaciones en una misma sesión de Claude Code: un test de checkout intermitente (flaky) y una consulta lenta del informe mensual. Ahora Claude las mezcla; por ejemplo, sugiere que el índice que le falta a la consulta del informe es la causa de que el test falle de forma intermitente.',
    ask: '¿Qué enfoque deberías seguir?',
    options: [
      'Mantener la sesión única, pero ejecutar /compact cada vez que cambies de tema para que la otra investigación quede resumida.',
      'Cada vez que cambies de tema, usar fork_session sobre la sesión compartida para que el tema al que vuelves tenga su propia rama.',
      'Dar a cada investigación su propia sesión con nombre y continuar cada una con --resume <session-name> cuando vuelvas a ella.',
      'Empezar cada mañana una sesión nueva sin nombre y volver a explicar ambas investigaciones a partir de tus notas antes de seguir.',
    ],
    why: [
      'La compactación mantiene ambos temas en un mismo contexto, solo que más corto, así que pueden seguir mezclándose.',
      'Un fork copia una base que ya está mezclada; fork_session sirve para explorar enfoques divergentes desde un análisis compartido.',
      'Las sesiones con nombre mantienen separado el contexto de cada investigación, y --resume continúa exactamente la que necesitas.',
      'Volver a explicarlo todo cada día tira contexto válido y aun así mete ambos temas en una misma sesión.',
    ],
    rule: 'Líneas de trabajo separadas: sesiones con nombre separadas, que se continúan con --resume.',
  },
  'g2-glob-spec-files': {
    scenario:
      'Le pides a Claude que liste todos los ficheros spec de Playwright, con nombre *.spec.ts y repartidos por apps/ y packages/, para añadirle una etiqueta a cada uno. Claude ejecuta Grep con el patrón "spec" y obtiene 2.400 coincidencias, la mayoría comentarios, imports y llamadas a un helper inspect().',
    ask: '¿Qué herramienta debería haber elegido Claude?',
    options: [
      'Repetir el Grep de "spec" solo en ficheros .ts y luego hacer Read de cada coincidencia para confirmar si es un spec.',
      'Leer la config de Playwright y todos los ficheros que referencia, para que Claude deduzca cuáles son ficheros spec.',
      'Glob con un patrón como **/*.spec.ts, ya que el objetivo es encontrar ficheros por su nombre, no por su contenido.',
      'Bash con ls en cada directorio de apps/ y packages/, y luego filtrar a mano los listados buscando nombres de spec.',
    ],
    why: [
      'Restringir el tipo de fichero sigue buscando en el contenido, así que el ruido se mantiene, y leer cada coincidencia gasta contexto.',
      'Leer la configuración y los ficheros a los que hace referencia es lento e indirecto para una pregunta sobre nombres de fichero.',
      'Glob sirve para encontrar rutas de fichero por patrón; Grep sirve para buscar dentro del contenido de los ficheros.',
      'Los listados manuales de directorios son lentos y propensos a errores cuando un único patrón de Glob responde directamente a la pregunta.',
    ],
    rule: 'Buscar ficheros por nombre: Glob. Buscar texto dentro de ficheros: Grep.',
  },
  'g2-trace-wrapper-exports': {
    scenario:
      'Antes de cambiar la firma de sendEmail, Claude hizo grep de "sendEmail(" y actualizó 12 llamadas. Tras el deploy, el restablecimiento de contraseñas se rompió: lib/notify/index.ts reexporta sendEmail como notifyUser, y jobs/mailer.ts lo envuelve en deliverDigest. Ninguno de esos nombres se llegó a buscar.',
    ask: '¿Cómo debería rastrear Claude los usos la próxima vez?',
    options: [
      'Usar Glob para encontrar ficheros cuyo nombre contenga "mail" o "notify", ya que los módulos wrapper suelen llamarse así.',
      'Recopilar primero todos los nombres con los que los wrappers exportan sendEmail y luego hacer Grep de cada uno en todo el código.',
      'Leer todos los ficheros de lib/ y jobs/ antes de editar, para tener en contexto todos los alias y wrappers antes del cambio.',
      'Volver a hacer Grep con un patrón "email" que no distinga mayúsculas, para que también coincidan variantes como notifyUser.',
    ],
    why: [
      'Glob encuentra nombres de fichero, no usos; las llamadas a notifyUser pueden estar en ficheros con cualquier nombre.',
      'Rastrear a través de wrappers significa identificar primero todos los nombres exportados y luego buscar cada uno en todo el código.',
      'Leer carpetas enteras de antemano llena el contexto y aun así se escapan las llamadas que hay fuera de lib/ y jobs/.',
      'Los alias no tienen por qué contener la palabra original: notifyUser no lleva "email", y el patrón amplio añade ruido.',
    ],
    rule: 'Rastrear wrappers: encuentra todos los alias exportados y luego haz Grep de cada nombre.',
  },
  'c-team-claude-md': {
    scenario:
      'El Claude Code del tech lead sigue a la perfección las convenciones del equipo. Las sesiones de las nuevas incorporaciones, no. Las convenciones están en el ~/.claude/CLAUDE.md del tech lead.',
    ask: '¿Dónde deberían estar las convenciones?',
    options: [
      'En un fichero CLAUDE.local.md en la raíz del repositorio, que Claude Code carga junto con CLAUDE.md.',
      'En el ./CLAUDE.md del proyecto, versionado en el repositorio para que todas las sesiones lo carguen.',
      'En el ~/.claude/CLAUDE.md de cada nueva incorporación, copiado por el tech lead durante el onboarding.',
      'En una página de la wiki que los desarrolladores pegan en el primer prompt de cada sesión nueva.',
    ],
    why: [
      'CLAUDE.local.md es para notas personales y debería estar en el .gitignore.',
      'El CLAUDE.md del proyecto se comparte mediante control de versiones, así que todos reciben las mismas instrucciones.',
      'Las copias se desincronizan con el tiempo y hay que repetirlo con cada incorporación.',
      'Es manual y fácil de olvidar.',
    ],
    rule: 'Instrucciones del equipo → CLAUDE.md del proyecto, en el repo.',
  },
  'g-import-package-standards': {
    scenario:
      'Tu monorepo tiene tres paquetes: payments, web y data-pipelines. Cada equipo guarda sus estándares en docs/standards/ (pci.md, react.md, airflow.md, logging.md...). El CLAUDE.md raíz los pega todos, 1.400 líneas, y Claude ha empezado a aplicar las reglas PCI sobre datos de tarjeta a código de UI normal en web/.',
    ask: '¿Cuál es la forma más mantenible de darle a cada paquete solo los estándares que le aplican?',
    options: [
      'Mantener un único CLAUDE.md raíz, pero añadir arriba una nota que diga a Claude que aplique cada sección solo al paquete que nombra.',
      'Dar a cada paquete su propio CLAUDE.md que use @import para traer solo los ficheros de estándares que sus mantenedores consideran relevantes.',
      'Mover los estándares de PCI y Airflow al ~/.claude/CLAUDE.md de los mantenedores para que solo los carguen sus propias sesiones.',
      'Crear un manifiesto .claude/standards.json que asigne a cada directorio de paquete la lista de ficheros de estándares que debe cargar.',
    ],
    why: [
      'Las 1.400 líneas siguen cargándose en todas partes, y depende de que Claude deduzca qué sección aplica, que es justo lo que falla hoy.',
      '@import mantiene CLAUDE.md modular: el fichero de cada paquete incluye solo los estándares relevantes, elegidos por quienes conocen ese paquete.',
      'Los ficheros de nivel de usuario no se comparten por control de versiones, así que otros desarrolladores que trabajen en payments perderían las reglas PCI.',
      'Claude Code no tiene ningún mecanismo .claude/standards.json; ese fichero de configuración no existe.',
    ],
    rule: 'Estándares específicos de un paquete: un CLAUDE.md por paquete que hace @import de los ficheros relevantes.',
  },
  'g-memory-diagnose': {
    scenario:
      'Dos desarrolladores trabajan en la misma rama del mismo repo. Las sesiones de Claude Code de Ana siempre añaden logging estructurado a los nuevos handlers de la API; las de Luis nunca lo hacen. El CLAUDE.md raíz no dice nada sobre logging, y ambos usan el mismo modelo y la misma versión de Claude Code.',
    ask: '¿Cuál es el primer paso más eficaz para encontrar la causa de la diferencia?',
    options: [
      'Añadir una línea "SIEMPRE añade logging estructurado" al CLAUDE.md raíz y comprobar si las sesiones de Luis empiezan a seguirla.',
      'Pedir a ambos desarrolladores que exporten sus prompts recientes para encontrar qué redacción hace que Claude añada el logging.',
      'Ejecutar /memory en las sesiones de ambos desarrolladores para ver qué ficheros de memoria carga cada uno y comparar las instrucciones.',
      'Borrar el CLAUDE.md raíz y regenerarlo con /init para que ambos desarrolladores vuelvan a partir de un fichero de proyecto idéntico.',
    ],
    why: [
      'Esto cambia el comportamiento antes de conocer la causa. Si la regla está en el fichero de nivel de usuario de Ana, estás adivinando en vez de diagnosticar.',
      'La diferencia es constante en todas las sesiones, lo que apunta a la configuración cargada y no a cómo redacta cada uno sus prompts.',
      '/memory muestra qué ficheros de memoria están cargados. Probablemente revelará una regla de logging en el ~/.claude/CLAUDE.md de Ana, que nunca se comparte por control de versiones.',
      'Ambos desarrolladores ya comparten el mismo CLAUDE.md raíz, así que regenerarlo no puede explicar la diferencia y puede descartar instrucciones del equipo.',
    ],
    rule: '¿El comportamiento difiere entre desarrolladores? Ejecuta /memory para ver qué ficheros se cargan.',
  },
  'g2-import-single-source': {
    scenario:
      'El CLAUDE.md raíz contiene una copia pegada de docs/testing-guide.md, que el equipo de QA también mantiene para lectores humanos. El mes pasado QA sustituyó en la guía los antiguos helpers de fixtures, pero nadie actualizó la copia, así que Claude sigue generando tests que usan los helpers eliminados.',
    ask: '¿Cuál es la solución más mantenible?',
    options: [
      'Añadir un script nocturno que copie docs/testing-guide.md en CLAUDE.md, para que la sección pegada nunca esté desactualizada mucho tiempo.',
      'Sustituir la copia por una línea en CLAUDE.md que diga a Claude que la guía de testing está en docs/ y que la lea cuando sea relevante.',
      'Que el equipo de QA incluya la guía en un manifiesto .claude/imports.json que Claude Code sincroniza en CLAUDE.md al arrancar.',
      'Sustituir la copia pegada por un @import de docs/testing-guide.md, para que CLAUDE.md cargue siempre el único fichero mantenido.',
    ],
    why: [
      'Esto mantiene dos copias más un job de sincronización que vigilar; la copia sigue desactualizada entre ejecuciones y la duplicación continúa.',
      'Un puntero depende de que Claude decida abrir el fichero; @import lo carga de forma determinista en todas las sesiones.',
      'Claude Code no tiene ningún manifiesto .claude/imports.json; ese fichero de configuración no existe.',
      '@import referencia el fichero externo directamente, lo que mantiene CLAUDE.md modular con una única fuente de verdad.',
    ],
    rule: 'Reutiliza la documentación existente con @import en lugar de pegar copias en CLAUDE.md.',
  },
  'g2-mobile-directory-claude-md': {
    scenario:
      'En tu monorepo, el CLAUDE.md raíz dice que los tests usan Jest. El mes pasado apps/mobile/ se pasó a Vitest, y todo su código y sus tests están dentro de esa carpeta. Claude sigue escribiendo tests de Jest para el código de mobile. El resto del repo sigue usando Jest.',
    ask: '¿Dónde debería ir la guía sobre Vitest?',
    options: [
      'En el ~/.claude/CLAUDE.md de cada desarrollador de mobile, para que sus sesiones sepan siempre que los tests de mobile usan Vitest.',
      'En apps/mobile/CLAUDE.md, un fichero a nivel de directorio que añade guía específica del paquete cuando Claude trabaja en esa carpeta.',
      'En el CLAUDE.md raíz, sustituyendo la línea de Jest por una instrucción para elegir el test runner que encaje en cada paquete.',
      'En un ajuste testRunner en .claude/settings.json, asociado a apps/mobile/ para que Claude Code seleccione Vitest ahí.',
    ],
    why: [
      'Los ficheros de nivel de usuario no se comparten, así que otros contribuidores se quedan sin la guía, y además se cuela en el trabajo de esos desarrolladores fuera de mobile.',
      'Cuando una convención está ligada a un directorio, un CLAUDE.md a nivel de directorio es el sitio natural; afina el CLAUDE.md raíz para ese paquete.',
      'Esto elimina la guía explícita para todo el repo y depende de que Claude deduzca el runner correcto para cada paquete.',
      'Claude Code no tiene ningún ajuste testRunner; esa opción de configuración no existe.',
    ],
    rule: '¿Convención ligada a un directorio? Ponla en el CLAUDE.md de ese directorio.',
  },
  'g2-personal-prefs-user-level': {
    scenario:
      'Marta hizo commit de tres líneas en el CLAUDE.md raíz del proyecto: respuestas cortas, nada de resúmenes al final de cada tarea y mostrar siempre un diff antes de aplicar ediciones. Son sus hábitos personales para cualquier repositorio en el que trabaja. Ahora sus compañeros se quejan de que Claude ha dejado de explicarles sus cambios.',
    ask: '¿Dónde deberían ir las preferencias de Marta?',
    options: [
      'En el ~/.claude/CLAUDE.md de Marta, que aplica a todas sus sesiones y no se comparte con sus compañeros.',
      'En el CLAUDE.md raíz, bajo un encabezado que diga que estas preferencias aplican solo cuando quien usa Claude es Marta.',
      'En un fichero .claude/rules/marta.md cuyo frontmatter paths coincida con las carpetas en las que Marta suele trabajar.',
      'En un CLAUDE.md que guarde solo en sus propias ramas de feature, para que main no cambie para nadie más.',
    ],
    why: [
      'El CLAUDE.md de nivel de usuario es personal: aplica en todos sus proyectos y nunca se comparte por control de versiones.',
      'Claude no puede saber de forma fiable quién está escribiendo, así que depende de una inferencia, y las líneas se siguen cargando para todo el equipo.',
      'Las reglas por ruta se aplican a ficheros, no a personas; cualquiera que edite esas carpetas, compañeros incluidos, recibiría los hábitos de Marta.',
      'El contenido de las ramas acaba mergeado en main, y sus preferencias seguirían faltando en todos los demás repositorios que usa.',
    ],
    rule: 'Las preferencias personales van en ~/.claude/CLAUDE.md; los estándares del equipo, en el proyecto.',
  },
  'g2-rules-topic-split': {
    scenario:
      'Tu CLAUDE.md raíz ha crecido hasta 1.100 líneas. Lo editan cuatro grupos: testing, diseño de API, despliegue y seguridad. Casi todos los PR que lo tocan tienen conflictos de merge, y nadie sabe qué sección está al día. Todos estos estándares tienen que seguir aplicándose en todas las sesiones.',
    ask: '¿Cuál es la forma más mantenible de reestructurarlo?',
    options: [
      'Mover la sección de cada grupo a un CLAUDE.md dentro de la carpeta que ese grupo gestiona, como tests/, api/ y deploy/.',
      'Convertir cada sección en una skill en .claude/skills/ que los desarrolladores invocan cuando trabajan en el tema de ese grupo.',
      'Dividirlo en ficheros temáticos más pequeños en .claude/rules/, como testing.md, api-conventions.md y deployment.md.',
      'Mover las secciones a docs/ y añadir una línea en CLAUDE.md que diga a Claude que lea el fichero relevante cuando lo vea necesario.',
    ],
    why: [
      'Los ficheros a nivel de directorio solo se cargan al trabajar en esa carpeta, pero los estándares de testing y seguridad aplican a código de todo el repo.',
      'Las skills se cargan bajo demanda, así que estos estándares, que siempre hacen falta, faltarían cada vez que nadie invoque la skill adecuada.',
      '.claude/rules/ es la alternativa prevista a un CLAUDE.md monolítico: cada tema tiene su propio fichero, y se siguen cargando en todas las sesiones.',
      'Esto depende de que Claude decida leer los ficheros. @import o los ficheros de reglas cargan el contenido de forma determinista.',
    ],
    rule: '¿CLAUDE.md monolítico? Divídelo en ficheros temáticos en .claude/rules/.',
  },
  'c-skills': {
    scenario:
      'El equipo pegó 30 procedimientos largos (release, hotfix, backfill de datos…) en CLAUDE.md. Cada sesión empieza con un contexto hinchado, y Claude los sigue de forma inconsistente.',
    ask: '¿Cuál es la mejor reestructuración?',
    options: [
      'Comprimir CLAUDE.md con abreviaturas y notación abreviada para que el mismo contenido use menos tokens.',
      'Ejecutar /compact al inicio de cada sesión para que los procedimientos ocupen menos contexto.',
      'Dividir CLAUDE.md en 30 ficheros CLAUDE.md anidados repartidos por las carpetas del repositorio.',
      'Mover cada procedimiento a su propia skill, con una descripción clara de cuándo aplica.',
    ],
    why: [
      'Más difícil de leer, tanto para las personas como para el modelo.',
      'La compactación resume la conversación; no arregla lo que se carga al arrancar.',
      'Los CLAUDE.md anidados se cargan cuando Claude lee ficheros de esas carpetas, lo que no tiene nada que ver con la tarea.',
      'Solo las descripciones de las skills están en el contexto. El procedimiento completo se carga cuando es relevante.',
    ],
    rule: 'Procedimientos ocasionales → skills (progressive disclosure, carga progresiva).',
  },
  'g-skill-allowed-tools': {
    scenario:
      'Una skill de proyecto, /gen-docs, escribe páginas de referencia en Markdown a partir del código fuente. En una ejecución usó Bash para borrar una carpeta de docs que consideró obsoleta, y eliminó páginas escritas a mano. La skill solo necesita leer ficheros fuente y escribir documentación.',
    ask: '¿Cuál es la forma más eficaz de evitar que vuelva a ocurrir?',
    options: [
      'Poner en el frontmatter del SKILL.md un allowed-tools con solo las herramientas de lectura y escritura de ficheros que necesita, sin Bash.',
      'Añadir una línea a las instrucciones de la skill: "Nunca borres ficheros ni ejecutes comandos de shell mientras generas documentación."',
      'Añadir context: fork al frontmatter de la skill para que cualquier paso destructivo quede dentro de un contexto aislado de sub-agente.',
      'Mover la skill de .claude/skills/ al ~/.claude/skills/ de cada desarrollador para que solo los usuarios con experiencia puedan lanzarla.',
    ],
    why: [
      'allowed-tools restringe las herramientas disponibles mientras se ejecuta la skill, así que borrar con Bash pasa a ser imposible en vez de solo desaconsejado.',
      'Una instrucción es una guía probabilística; la skill ya decidió por su cuenta borrar, y podría volver a hacerlo.',
      'context: fork aísla el contexto de la conversación, no los efectos secundarios. Los ficheros borrados desde un contexto fork siguen borrados.',
      'Cambiar el ámbito saca la skill del repo compartido del equipo y no restringe en absoluto qué herramientas puede usar.',
    ],
    rule: 'Limita lo que puede hacer una skill con allowed-tools, no con instrucciones.',
  },
  'g-skill-argument-hint': {
    scenario:
      'Los desarrolladores escriben a menudo /new-endpoint sin argumentos. La skill entonces adivina el nombre del recurso a partir de los ficheros que haya abiertos y genera las rutas para el recurso equivocado. Cuando se da el nombre, como en /new-endpoint invoices, el resultado es correcto.',
    ask: '¿Cuál es el cambio más eficaz?',
    options: [
      'Añadir una regla al CLAUDE.md raíz que diga a Claude que confirme siempre el nombre del recurso antes de generar cualquier endpoint.',
      'Convertir la skill en un comando en .claude/commands/, donde Claude Code rechaza los comandos invocados sin argumentos.',
      'Añadir argument-hint al frontmatter del SKILL.md para que se pida a los desarrolladores el nombre del recurso al invocarla.',
      'Documentar el uso en el README del equipo y pedir a los revisores que rechacen los PR cuyos endpoints apunten al recurso equivocado.',
    ],
    why: [
      'Una regla siempre cargada para la entrada de una sola skill añade contexto a todas las sesiones y sigue dependiendo de que Claude decida preguntar.',
      'Los comandos de .claude/commands/ no rechazan llamadas sin argumentos; ese comportamiento no existe.',
      'argument-hint es la opción del frontmatter pensada para pedir a los desarrolladores los parámetros obligatorios cuando los omiten.',
      'Esto traslada la carga a desarrolladores y revisores, y detecta el error tarde, cuando el código equivocado ya se ha generado.',
    ],
    rule: '¿La skill necesita un parámetro? Añade argument-hint al frontmatter de su SKILL.md.',
  },
  'g-skill-fork-verbose': {
    scenario:
      'La skill /map-deps del equipo analiza el grafo de dependencias entre módulos e imprime unos 25.000 tokens de salida intermedia antes de su resumen final. Los desarrolladores cuentan que, después de ejecutarla a mitad de una tarea, Claude pierde el hilo de lo que estaban haciendo y tienen que volver a explicarle la tarea.',
    ask: '¿Qué cambio en la skill lo soluciona mejor?',
    options: [
      'Añadir allowed-tools: Read, Grep al frontmatter del SKILL.md para que la skill solo pueda leer ficheros mientras construye el grafo.',
      'Mover las instrucciones de mapeo de dependencias al CLAUDE.md raíz para que Claude ya conozca el procedimiento en todas las sesiones.',
      'Pedir a los desarrolladores que ejecuten /compact justo después de cada ejecución de /map-deps para que la salida extensa quede resumida.',
      'Añadir context: fork al frontmatter del SKILL.md para que la skill se ejecute en un sub-agente aislado y devuelva solo su resultado.',
    ],
    why: [
      'allowed-tools limita qué herramientas puede usar la skill; no evita que su salida extensa acabe en la conversación principal.',
      'CLAUDE.md se carga siempre, así que esto añade tokens a todas las sesiones, y la salida del análisis sigue cayendo en el contexto principal.',
      'Esto traslada la carga a los desarrolladores, y la compactación solo ocurre cuando la salida ya ha desplazado el contexto de la tarea.',
      'context: fork ejecuta la skill en su propio contexto de sub-agente, así que el análisis extenso nunca contamina la sesión principal.',
    ],
    rule: '¿Skill con salida extensa o exploratoria? Añade context: fork.',
  },
  'g2-gitignored-commands': {
    scenario:
      'Ravi creó .claude/commands/changelog.md, y /changelog funciona en sus sesiones. Los compañeros que han hecho pull de main no tienen el comando. En la máquina de Ravi, git status indica un working tree limpio, y git log muestra que ningún commit ha tocado nunca .claude/commands/.',
    ask: '¿Cuál es la causa raíz más probable?',
    options: [
      'Los comandos de proyecto solo están disponibles para otros después de que cada desarrollador los copie una vez a ~/.claude/commands/.',
      'Los comandos de .claude/commands/ también necesitan una entrada en el CLAUDE.md raíz para que las sesiones de los compañeros puedan cargarlos.',
      'El .gitignore del repositorio excluye el directorio .claude/, así que el fichero del comando nunca se llegó a commitear ni a compartir.',
      'Los comandos personales de los compañeros en ~/.claude/commands/ tienen prioridad y ocultan todos los comandos de proyecto.',
    ],
    why: [
      'Los comandos de proyecto en .claude/commands/ se comparten mediante control de versiones; no hace falta una copia por desarrollador.',
      'CLAUDE.md contiene instrucciones y contexto; no registra comandos, y esa entrada no existe.',
      'Un status limpio sin commits significa que git está ignorando el fichero; los comandos de proyecto solo se comparten una vez commiteados.',
      'Los comandos de nivel de usuario no ocultan los comandos de proyecto, y aquí el fichero ni siquiera llegó a los clones de los compañeros.',
    ],
    rule: 'Los comandos de proyecto solo se comparten si .claude/ está realmente commiteado.',
  },
  'g2-personal-skill-variant': {
    scenario:
      'La skill de proyecto del equipo /review está en .claude/skills/review/. Priya quiere una pasada extra de accesibilidad, más estricta, para su propio trabajo de front-end. Editó el SKILL.md compartido, lo commiteó sin querer, y de repente las reviews de sus compañeros se llenaron de hallazgos de accesibilidad que no habían pedido.',
    ask: '¿Qué debería hacer Priya en su lugar?',
    options: [
      'Mantener el cambio en el SKILL.md compartido, con una condición que aplique la pasada más estricta solo cuando la ejecute Priya.',
      'Crear una skill personal en ~/.claude/skills/ con un nombre distinto, como review-a11y, y dejar /review tal como está.',
      'Añadir el checklist de accesibilidad al CLAUDE.md raíz del proyecto, para que se cargue y se aplique en todas las reviews.',
      'Apuntar una entrada skillOverrides de .claude/settings.local.json a una copia más estricta de /review solo para su máquina.',
    ],
    why: [
      'Claude no puede saber de forma fiable quién invocó la skill, así que depende de una inferencia, y la skill compartida cambia igualmente para todos.',
      'Las variantes personales van en ~/.claude/skills/ con otro nombre, así que el /review compartido del equipo no se ve afectado.',
      'CLAUDE.md se carga siempre para todo el equipo, lo que extiende su preferencia a todos y a todas las sesiones.',
      'Claude Code no tiene ningún ajuste skillOverrides; esa opción de configuración no existe.',
    ],
    rule: 'Ajuste personal de una skill del equipo: un nombre nuevo en ~/.claude/skills/.',
  },
  'g2-skill-fork-and-readonly': {
    scenario:
      'La skill /legacy-audit lee más de 200 ficheros e informa de patrones de riesgo. Hay dos quejas: su larga salida intermedia entierra la tarea en la que estaba el desarrollador, y en una ejecución reescribió código sobre el que solo debía informar.',
    ask: '¿Qué cambio en la skill resuelve mejor ambos problemas?',
    options: [
      'Añadir context: fork y limitar allowed-tools a herramientas de solo lectura como Read, Grep y Glob para que no pueda editar ficheros.',
      'Añadir solo context: fork, ya que una skill que se ejecuta en un sub-agente aislado no puede cambiar ningún fichero del proyecto.',
      'Limitar solo allowed-tools a herramientas de solo lectura, ya que una skill con menos herramientas también produce mucha menos salida.',
      'Añadir context: fork y una línea en el cuerpo del SKILL.md que diga a la skill que solo informe de hallazgos y nunca edite ficheros.',
    ],
    why: [
      'context: fork mantiene la salida extensa en un sub-agente aislado, y allowed-tools elimina la capacidad de editar ficheros.',
      'context: fork aísla el contexto de la conversación, no los efectos secundarios; una skill con fork puede seguir editando ficheros.',
      'allowed-tools restringe acciones, no salida; el análisis largo seguiría cayendo en la conversación principal.',
      'El fork resuelve el problema de la salida, pero una instrucción es solo una guía; allowed-tools es lo que elimina la capacidad de editar.',
    ],
    rule: '¿Salida extensa y no debe editar? context: fork más allowed-tools de solo lectura.',
  },
  'g2-universal-standards-not-skill': {
    scenario:
      'Para reducir CLAUDE.md, el equipo movió sus estándares de seguridad (no escribir nunca tokens de auth en los logs, usar siempre SQL parametrizado) a una skill /secure-coding. Desde entonces, el código generado en sesiones en las que nadie ejecutó /secure-coding ha vuelto a escribir tokens en los logs.',
    ask: '¿Cuál es la solución más eficaz?',
    options: [
      'Pedir a los desarrolladores que ejecuten /secure-coding al inicio de cada sesión, antes de pedir cualquier generación de código.',
      'Añadir context: fork al frontmatter de la skill para que, una vez invocada, sus estándares persistan durante toda la sesión.',
      'Añadir argument-hint al frontmatter de la skill para que Claude Code pida a los desarrolladores ejecutarla cuando la seguridad sea relevante.',
      'Devolver estos estándares universales a contenido de CLAUDE.md siempre cargado y reservar las skills para flujos bajo demanda.',
    ],
    why: [
      'Esto traslada la carga a los desarrolladores; basta con olvidar una invocación para que vuelvan las infracciones.',
      'context: fork ejecuta la skill en un sub-agente aislado, lo que mantiene su contenido fuera de la sesión principal: justo lo contrario de lo que se busca.',
      'argument-hint pide los parámetros que faltan cuando se invoca una skill; nunca lanza la skill por sí mismo.',
      'Los estándares que deben cumplirse en todas las sesiones van en CLAUDE.md, que siempre está cargado; las skills son para usos específicos de una tarea.',
    ],
    rule: 'Estándares siempre activos: CLAUDE.md. Flujos bajo demanda: skills.',
  },
  'g-rules-migrations-glob': {
    scenario:
      'Cada uno de tus 14 servicios tiene su propia carpeta migrations/ con ficheros SQL. Las reglas para escribir migraciones reversibles ocupan 300 líneas del CLAUDE.md raíz, así que se cargan en todas las sesiones, incluso para trabajo de front-end. Quieres que se apliquen automáticamente, pero solo cuando Claude edite ficheros de migración.',
    ask: '¿Cuál es la mejor forma de configurarlo?',
    options: [
      'Poner un CLAUDE.md con las reglas de migración dentro de cada una de las 14 carpetas migrations/ para que se carguen junto a los ficheros SQL.',
      'Convertir las reglas en una skill /migration-rules que los desarrolladores invoquen antes de pedir a Claude que escriba una migración.',
      'Mantener las reglas en el CLAUDE.md raíz bajo un encabezado que diga que solo aplican al editar ficheros de migración.',
      'Mover las reglas a un fichero de .claude/rules/ cuyo frontmatter YAML fije paths: ["**/migrations/**/*.sql"].',
    ],
    why: [
      'Los CLAUDE.md ligados a directorios suponen 14 copias que mantener sincronizadas; una sola regla con glob cubre ficheros repartidos por el repo.',
      'Las skills requieren invocación manual o que Claude decida cargarlas, así que las reglas no se aplicarían automáticamente.',
      'Las reglas siguen cargándose en todas las sesiones y Claude tiene que deducir cuándo aplican, así que se desperdician tokens y la aplicación no es fiable.',
      'Las reglas con ámbito por ruta solo se cargan cuando Claude edita ficheros que coinciden, estén donde estén, lo que ahorra tokens en todo lo demás.',
    ],
    rule: 'Convenciones para ficheros repartidos por el repo: .claude/rules/ con globs en paths.',
  },
  'g2-rules-glob-depth': {
    scenario:
      '.claude/rules/components.md tiene un frontmatter YAML paths: ["src/components/*.tsx"]. Claude sigue sus convenciones al editar src/components/Button.tsx, pero no al editar src/components/forms/DatePicker.tsx. No hay ningún CLAUDE.md en ninguna de las dos carpetas.',
    ask: '¿Cuál es la causa raíz más probable?',
    options: [
      'La carpeta forms/ necesita su propio CLAUDE.md, porque las reglas de .claude/rules/ solo llegan a las carpetas que tienen uno.',
      'Los patrones de ruta se comparan solo con el nombre del fichero, así que el prefijo src/components/ impide que la regla coincida.',
      'Las reglas con ámbito por ruta solo se cargan una vez por sesión, así que dejan de aplicarse tras editar el primer fichero que coincide.',
      'Un solo * no cruza niveles de carpeta; un patrón como src/components/**/*.tsx también coincide con carpetas anidadas.',
    ],
    why: [
      'Las reglas de .claude/rules/ no dependen de los CLAUDE.md de directorio, y Button.tsx recibe la regla sin tener uno.',
      'Los patrones se comparan con rutas relativas al proyecto, y por eso Button.tsx, bajo el mismo prefijo, sí coincide.',
      'Las reglas se cargan siempre que Claude trabaja con ficheros que coinciden; la evidencia se divide por profundidad de carpeta, no por el orden de las ediciones.',
      'En los patrones glob, * se queda dentro de un directorio mientras que ** abarca subdirectorios, así que los componentes anidados nunca coincidieron.',
    ],
    rule: 'Usa ** en los globs de las reglas para llegar a ficheros en carpetas anidadas.',
  },
  'g2-rules-missing-paths': {
    scenario:
      'Para reducir el uso de tokens, el equipo movió 250 líneas de convenciones de Terraform de CLAUDE.md a .claude/rules/terraform.md. Una semana después, las sesiones de front-end siguen cargando las reglas de Terraform, y Claude saca el naming de módulos en conversaciones sobre React. El fichero empieza directamente con el encabezado "# Terraform conventions".',
    ask: '¿Cuál es la causa raíz más probable?',
    options: [
      'Los ficheros de reglas solo se cargan cuando CLAUDE.md los referencia con @import, así que se sigue usando el contenido antiguo de CLAUDE.md.',
      'El fichero no tiene frontmatter YAML con paths, como ["terraform/**/*"], así que se carga en todas las sesiones.',
      'El directorio .claude/rules/ es global por diseño, así que limitar por ruta requiere en su lugar un fichero terraform/CLAUDE.md.',
      'Claude Code cachea las reglas por desarrollador, así que el cambio solo surte efecto cuando cada persona limpia su ~/.claude/.',
    ],
    why: [
      'Los ficheros de .claude/rules/ se cargan por sí solos, y el contenido se sacó de CLAUDE.md, así que no se está cargando desde ahí.',
      'Un fichero de reglas sin campo paths aplica de forma incondicional; añadir globs en paths hace que solo se cargue para ficheros que coinciden.',
      'Las reglas admiten ámbito por ruta mediante frontmatter YAML; no hace falta un CLAUDE.md de directorio para eso.',
      'No existe ninguna caché de reglas por desarrollador que limpiar; el comportamiento viene de que al fichero le falta el frontmatter.',
    ],
    rule: 'Un fichero de reglas sin frontmatter paths se carga en todas las sesiones.',
  },
  'g2-rules-stories-spread': {
    scenario:
      'Las convenciones de Storybook (formato CSF3, nombres de args) están en src/components/CLAUDE.md. Los ficheros de stories también están junto a sus componentes en packages/ui/, apps/admin/ y unas 30 carpetas más. Claude solo sigue las convenciones en las stories que hay bajo src/components/.',
    ask: '¿Qué cambio hace que las convenciones se apliquen allá donde haya ficheros de stories?',
    options: [
      'Copiar src/components/CLAUDE.md en cada carpeta con un fichero .stories.tsx y añadir una comprobación en la code review.',
      'Mover las convenciones al CLAUDE.md raíz con una nota: aplican a todo fichero cuyo nombre acabe en .stories.tsx.',
      'Crear .claude/rules/stories.md con frontmatter YAML paths: ["**/*.stories.tsx"] y las convenciones en su cuerpo.',
      'Crear una skill /story-conventions y una línea en CLAUDE.md que pida a Claude invocarla antes de escribir cualquier story.',
    ],
    why: [
      'Las copias ligadas a directorios en más de 30 carpetas se desincronizan y no cubren ninguna carpeta nueva en la que aparezca una story.',
      'Las convenciones se cargan en todas las sesiones y Claude tiene que deducir cuándo aplican, lo cual no es fiable y desperdicia tokens.',
      'Una regla con glob se aplica por tipo de fichero independientemente del directorio, y solo se carga cuando Claude trabaja en ficheros de stories.',
      'Las skills se cargan bajo demanda o cuando Claude lo decide; esto no da una aplicación determinista basada en rutas.',
    ],
    rule: 'Mismo tipo de fichero en muchas carpetas: un único fichero en .claude/rules/ con un glob **.',
  },
  'g-explore-subagent-discovery': {
    scenario:
      'Una tarea en tres fases: (1) encontrar todos los sitios donde se usa el bus de eventos legacy, (2) diseñar su sustituto, (3) implementarlo. En una prueba, solo la fase 1 produjo cientos de resultados de búsqueda y lecturas de ficheros; al llegar a la fase 2, el contexto de Claude estaba casi lleno y había olvidado decisiones tempranas.',
    ask: '¿Cuál es la forma más eficaz de ejecutar la fase 1?',
    options: [
      'Delegar la fase 1 al subagente Explore para que su extensa salida de descubrimiento quede aislada y solo vuelva un resumen.',
      'Saltarse una fase de descubrimiento separada y usar ejecución directa, editando cada uso del bus de eventos a medida que Claude lo encuentra.',
      'Pedir a Claude que haga Read de cada módulo que importa el bus de eventos al principio, para tener todos los hallazgos en contexto desde el inicio.',
      'Ejecutar cada fase en una sesión completamente nueva sin contexto arrastrado, para que ninguna fase herede la salida de la anterior.',
    ],
    why: [
      'El subagente Explore aísla el descubrimiento verboso y devuelve un resumen, preservando el contexto principal para el diseño y la implementación.',
      'Sustituir un bus de eventos es un cambio de arquitectura; editar antes de la fase de diseño invita a cambios inconsistentes y a rehacer trabajo.',
      'Leerlo todo de antemano llena el contexto aún más rápido, que es exactamente el fallo que se vio en la prueba.',
      'Empezar de cero sin arrastrar nada desecha los hallazgos de la fase 1 de los que depende la fase de diseño.',
    ],
    rule: '¿Fase de descubrimiento verbosa? Usa el subagente Explore y quédate solo con su resumen.',
  },
  'g-plan-then-execute-migration': {
    scenario:
      'Tienes que sustituir una librería de cliente HTTP obsoleta por una nueva. Se usa en unos 50 ficheros, y hay dos enfoques válidos: envolver el nuevo cliente en un módulo adaptador compartido o llamarlo directamente en todas partes. Los dos enfoques requieren una gestión distinta de reintentos y timeouts.',
    ask: '¿Qué flujo de trabajo deberías usar?',
    options: [
      'Usar ejecución directa y convertir fichero a fichero, dejando que Claude elija sobre la marcha adaptador o llamadas directas.',
      'Usar plan mode para explorar los usos y elegir un enfoque, y después cambiar a ejecución directa para implementar el plan.',
      'Usar ejecución directa con un prompt detallado que imponga el adaptador, y saltarse la exploración para ganar tiempo.',
      'Empezar en ejecución directa con algunos ficheros y pasar a plan mode solo si fallan los tests de los ficheros convertidos.',
    ],
    why: [
      'Decidir fichero a fichero produce un código inconsistente y arriesga rehacer trabajo costoso cuando afloran dependencias entre ficheros.',
      'Plan mode encaja con cambios en varios ficheros con varios enfoques válidos; una vez cerrado el diseño, la ejecución directa lo implementa.',
      'Esto se compromete con una arquitectura antes de ver cómo se usa realmente el cliente, que es justo lo que plan mode existe para comprobar.',
      'La complejidad se conoce desde el principio: unos 50 ficheros y dos diseños en competencia. Esperar a los fallos invita a rehacer trabajo.',
    ],
    rule: 'Plan mode para investigar y decidir; luego ejecución directa para implementar.',
  },
  'g2-direct-exec-stack-trace': {
    scenario:
      'Un error en producción dice: TypeError: Cannot read properties of undefined (reading \'toISOString\') at formatDueDate (src/billing/dates.ts:42). Las facturas sin fecha de vencimiento deberían mostrar "N/A". Ningún otro comportamiento tiene que cambiar.',
    ask: '¿Qué enfoque deberías seguir?',
    options: [
      'Usar ejecución directa para añadir la comprobación de fecha ausente en formatDueDate, más un test para el caso undefined.',
      'Entrar en plan mode para mapear todas las llamadas a formatDueDate y diseñar antes una estrategia de manejo de nulos para todo el código.',
      'Delegar en el subagente Explore para que resuma el módulo de facturación antes de decidir dónde va la comprobación.',
      'Usar el patrón de entrevista para que Claude pregunte por zonas horarias, locales y formatos de fecha antes de tocar el código.',
    ],
    why: [
      'Un arreglo en un solo fichero, con un stack trace claro y un comportamiento esperado claro, es exactamente para lo que sirve la ejecución directa.',
      'Plan mode encaja con trabajo arquitectónico en varios ficheros; aquí el alcance es una función y el arreglo ya se conoce.',
      'El stack trace ya señala el fichero y la línea, así que una fase de descubrimiento añade coste sin información nueva.',
      'El patrón de entrevista saca a la luz incógnitas en dominios poco conocidos; aquí el requisito está totalmente especificado.',
    ],
    rule: 'Stack trace claro y arreglo en un solo fichero: ejecución directa.',
  },
  'g2-plan-mode-safe-design': {
    scenario:
      'Te piden que propongas cómo dividir un OrderService de 4.000 líneas en módulos más pequeños. Quieres que Claude lea el código y sugiera un diseño que puedas discutir con el equipo. Tu working tree tiene trabajo sin commitear, y no debe cambiar nada hasta que se acuerde el diseño.',
    ask: '¿Qué enfoque deberías seguir?',
    options: [
      'Usar ejecución directa con una línea en CLAUDE.md que prohíba editar ficheros en las charlas de diseño, y pedir una propuesta.',
      'Usar plan mode, para que Claude explore el código y proponga un diseño sin cambiar ningún fichero hasta que tú lo apruebes.',
      'Usar ejecución directa y dejar que Claude haga la división de inmediato, y luego revisar el diff y revertirlo si hace falta.',
      'Ejecutar primero /compact para que haya sitio para todo el OrderService, y luego pedir un diseño en ejecución directa.',
    ],
    why: [
      'Una línea en CLAUDE.md es una guía, no una garantía, y añade una regla siempre cargada solo para esta tarea.',
      'Plan mode sirve para explorar y diseñar de forma segura antes de comprometerse con cambios, lo que evita rehacer trabajo costoso.',
      'Cambiar código antes de acordar el diseño arriesga rehacer trabajo y mezcla las ediciones de Claude con tu trabajo sin commitear.',
      '/compact libera contexto, pero no impide en absoluto que Claude edite ficheros durante la fase de diseño.',
    ],
    rule: 'Explorar y diseñar antes de que cambie nada: plan mode.',
  },
  'g2-switch-to-plan-midtask': {
    scenario:
      'En ejecución directa, le pediste a Claude que añadiera una validación de formato de email al handler de registro. Claude informa de que la validación de email está reimplementada en 11 servicios con tres regex distintas. Ahora tu lead quiere que este ticket las consolide, ya sea en una librería compartida o en un servicio de validación.',
    ask: '¿Cómo deberías continuar?',
    options: [
      'Seguir en ejecución directa y dejar que Claude actualice los 11 servicios a la regex más estricta según va encontrando cada copia.',
      'Seguir en ejecución directa con un prompt largo que imponga la librería compartida, para no gastar tiempo en explorar.',
      'Pasar a plan mode para explorar los 11 servicios y elegir entre una librería y un servicio antes de editar.',
      'Usar el subagente Explore para listar las 11 copias y luego editarlas en ejecución directa en el orden en que se encontraron.',
    ],
    why: [
      'La consolidación es ahora una decisión de arquitectura; editar sobre la marcha arriesga cambios inconsistentes y rehacer trabajo.',
      'Esto se compromete con una arquitectura sin comprobar cómo usa cada servicio la validación, que es para lo que existe plan mode.',
      'La tarea se ha convertido en un cambio en varios ficheros con dos diseños válidos, que es exactamente para lo que sirve plan mode.',
      'Explore ayuda en el descubrimiento, pero la elección de diseño entre una librería y un servicio tiene que llegar antes de editar.',
    ],
    rule: 'Cuando una tarea se vuelve arquitectónica, pasa a plan mode antes de editar.',
  },
  'g-interacting-issues': {
    scenario:
      'Claude refactorizó la calculadora de facturas. Encuentras tres problemas: el descuento se aplica después de impuestos en vez de antes, el impuesto se redondea por línea en vez de sobre el subtotal, y el subtotal impreso ya no coincide con el total cobrado. Cambiar cualquiera de ellos cambia los números que producen los otros.',
    ask: '¿Cómo deberías pedirle a Claude que los arregle?',
    options: [
      'Reportar un problema por mensaje, esperando cada arreglo antes de plantear el siguiente, para que cada cambio sea fácil de verificar.',
      'Pedir a Claude que "revise la calculadora de facturas y arregle cualquier bug de cálculo" y dejar que encuentre los problemas por sí mismo.',
      'Describir los tres problemas en un único mensaje detallado, explicando cómo interactúan, para que Claude los arregle juntos.',
      'Revertir el refactor y lanzar otra vez el mismo prompt de refactorización, con la esperanza de que el siguiente intento evite los tres problemas.',
    ],
    why: [
      'Los arreglos secuenciales encajan con problemas independientes. Aquí cada arreglo cambia los resultados de los otros, así que ir de uno en uno provoca idas y venidas.',
      'Una petición vaga desecha los problemas concretos que ya encontraste y puede arreglar algunos sin tener en cuenta cómo interactúan.',
      'Cuando los arreglos interactúan, darlos juntos en un mensaje detallado permite a Claude diseñar una solución coherente.',
      'Relanzar el mismo prompt no aporta información nueva, así que es probable que vuelvan los mismos errores.',
    ],
    rule: 'Problemas que interactúan: un mensaje detallado. Problemas independientes: de uno en uno.',
  },
  'g2-mixed-interacting-issues': {
    scenario:
      'Al revisar el nuevo endpoint /orders de Claude, encuentras cuatro problemas: (1) los offsets de página empiezan en 1 en vez de en 0, (2) total_count reutiliza esa lógica de offset y también está mal, (3) una errata en el mensaje de error 404, (4) falta el docstring del módulo. Arreglar (1) cambia lo que debe devolver (2); (3) y (4) no afectan a nada más.',
    ask: '¿Cómo deberías pedirle a Claude que los arregle?',
    options: [
      'Enviar los cuatro problemas en un mensaje largo, para que Claude haga todos los arreglos en una sola pasada y tú revises una vez.',
      'Enviar (1) y (2) juntos en un mensaje detallado que explique cómo interactúan, y luego plantear (3) y (4) por separado.',
      'Reportar los cuatro problemas uno por mensaje en el orden en que los encontraste, comprobando cada arreglo antes del siguiente.',
      'Pedir a Claude que revise de nuevo todo el endpoint y arregle lo que encuentre, sin enumerar los problemas que encontraste.',
    ],
    why: [
      'Mezclar arreglos no relacionados con otros que interactúan hace cada cambio más difícil de verificar; los problemas independientes encajan con la iteración secuencial.',
      'Los problemas que interactúan necesitan un único mensaje para que los arreglos sean coherentes; los independientes se arreglan y comprueban mejor de uno en uno.',
      'Separar (1) y (2) implica que el primer arreglo cambia lo que tiene que hacer el segundo, lo que provoca idas y venidas entre rondas.',
      'Una petición vaga descarta los problemas concretos que ya encontraste y puede pasar por alto cómo interactúan (1) y (2).',
    ],
    rule: 'Agrupa los problemas que interactúan en un mensaje; trata los independientes por separado.',
  },
  'g2-null-edge-test-cases': {
    scenario:
      'Claude escribió una migración que divide full_name en first_name y last_name. En staging falla en las filas donde full_name es NULL, y mete nombres de una sola palabra como "Cher" en last_name. Dos veces le pediste que "gestionara mejor los nulos y los casos límite", y cada intento se comportó de forma distinta.',
    ask: '¿Qué deberías hacer a continuación?',
    options: [
      'Dar casos de prueba concretos: filas de entrada con NULL y "Cher", cada una con el first_name y el last_name exactos esperados.',
      'Repetir la petición con palabras más firmes, insistiendo en que la migración no debe fallar nunca con ningún caso límite posible.',
      'Usar el patrón de entrevista, para que Claude te pregunte por el motor de base de datos y el framework de migraciones antes de reintentar.',
      'Abrir una sesión nueva y pegar la petición original, para que Claude lo reintente sin los intentos fallidos anteriores.',
    ],
    why: [
      'Entradas concretas con salidas esperadas eliminan la ambigüedad que dejan las peticiones vagas, así que los casos límite se resuelven como se pretende.',
      'Unas palabras más firmes siguen siendo vagas; Claude sigue teniendo que adivinar la salida correcta para cada caso límite.',
      'Lo desconocido es la salida esperada para filas concretas, no el entorno técnico, así que la entrevista no lo resuelve.',
      'La misma petición sin información nueva lo más probable es que produzca otra suposición más.',
    ],
    rule: '¿Casos límite mal resueltos? Da casos de prueba con entrada exacta y salida esperada.',
  },
  'g2-tdd-rate-limiter': {
    scenario:
      'Claude está implementando un rate limiter de token bucket para la API. Tras cinco rondas de feedback como "sigue dejando pasar ráfagas" y "ahora bloquea el tráfico normal", cada arreglo rompe algo que una ronda anterior había arreglado. Todavía no hay tests para el limiter.',
    ask: '¿Cuál es la forma más eficaz de continuar?',
    options: [
      'Escribir una especificación en prosa más larga que describa todos los problemas hasta ahora, y pedir a Claude que reescriba el limiter desde cero.',
      'Pedir a Claude que añada logging detallado al limiter, y luego pegarle extractos de los logs de staging después de cada ronda.',
      'Pasar a plan mode y pedir a Claude que diseñe tres algoritmos alternativos de rate limiting antes de que elijas uno.',
      'Escribir primero tests para tasas normales, ráfagas, casos límite de recarga y un presupuesto de latencia, y luego compartir cada fallo.',
    ],
    why: [
      'Más prosa sigue estando abierta a interpretación, y una reescritura puede traer de vuelta las mismas regresiones sin nada que las detecte.',
      'Los logs hacen cada ronda más lenta e indirecta; no definen el comportamiento esperado ni detectan regresiones.',
      'El problema no es que falte una decisión de diseño, sino las regresiones entre rondas, que es lo que detecta una suite de tests.',
      'La iteración guiada por tests fija de antemano el comportamiento, los casos límite y el rendimiento, y cada fallo guía el siguiente paso.',
    ],
    rule: '¿Los arreglos siguen provocando regresiones? Escribe primero los tests y luego itera sobre los fallos.',
  },
  'g2-ci-conventions-project-claude-md': {
    scenario:
      'Un job nocturno ejecuta claude -p "Write unit tests for today\'s changed files". En los portátiles, Claude usa las factories de test del equipo y nunca llama a la red en los tests. En CI, los tests generados construyen los objetos a mano y llaman a APIs reales. Las convenciones de fixtures están en el ~/.claude/CLAUDE.md de cada desarrollador, copiadas de un repo compartido de dotfiles.',
    ask: '¿Cuál es la solución más eficaz?',
    options: [
      'Añadir --output-format json con un --json-schema que enumere los campos de fixtures, para que la salida de CI tenga que seguir las convenciones.',
      'Ejecutar el job nocturno con --resume sobre una sesión local reciente de un desarrollador, para que las convenciones pasen a CI.',
      'Añadir "follow the team\'s usual fixture conventions" al prompt de -p, para que Claude las aplique también en el pipeline.',
      'Mover las convenciones de fixtures al CLAUDE.md del proyecto, versionado en el repo, para que Claude Code invocado desde CI las cargue.',
    ],
    why: [
      'Estos flags dan forma a la salida para que la procese una máquina; no le dan a Claude las convenciones de testing del equipo.',
      'Las sesiones locales de los desarrolladores no existen en el runner de CI, y reanudar una sesión no es la forma de aportar contexto de proyecto.',
      'Las convenciones no están en ningún sitio del contexto del runner de CI, así que Claude no tiene nada concreto que seguir.',
      'El CLAUDE.md del repo es el mecanismo para dar contexto de proyecto, como las convenciones de fixtures, a Claude Code invocado desde CI.',
    ],
    rule: 'CI obtiene el contexto del proyecto del CLAUDE.md del repo, no de las carpetas home.',
  },
  'g-scratchpad-degradation': {
    scenario:
      'Tras tres horas de una sesión de Claude Code explorando una base de código grande, las respuestas empeoran. Cuando le preguntas dónde se escribe en el ledger, Claude dice "normalmente una clase repositorio se encarga de la persistencia" en lugar de nombrar LedgerWriteRepository, que encontró una hora antes, y contradice una respuesta que dio previamente.',
    ask: '¿Cuál es la forma más eficaz de contrarrestar esto en sesiones largas de exploración?',
    options: [
      'Cambiar a un modelo con una ventana de contexto mayor para que toda la exploración anterior siga disponible en la sesión.',
      'Añadir una regla en CLAUDE.md que diga a Claude que nombre siempre las clases concretas que encontró y nunca describa patrones genéricos.',
      'Hacer que Claude registre los hallazgos clave en un fichero scratchpad mientras explora, y consultar ese fichero en preguntas posteriores.',
      'Pedir a Claude que vuelva a leer todos los ficheros que exploró antes en la sesión cada vez que una nueva pregunta toque esa zona.',
    ],
    why: [
      'Una ventana mayor no evita la degradación en sesiones largas; los hallazgos enterrados en un contexto enorme se siguen usando de forma poco fiable.',
      'Una instrucción no puede recuperar hallazgos que el modelo ya no usa de forma fiable; el problema es el contexto, no la intención.',
      'Un fichero scratchpad conserva los hallazgos clave fuera del contexto que se degrada, así que las respuestas posteriores se apoyan en hechos registrados.',
      'Volver a leer añade todavía más salida verbosa a un contexto ya degradado, lo que empeora el problema.',
    ],
    rule: 'Exploración larga: guarda los hallazgos clave en un fichero scratchpad y reutilízalos.',
  },
  'g2-compact-not-clear': {
    scenario:
      'Tras dos horas rastreando un bug de corrupción de datos, la sesión está llena de resultados de grep y volcados de ficheros de pistas que no llevaron a nada, y Claude avisa de que el contexto está casi lleno. Todavía necesitas lo que has aprendido: qué hipótesis se descartaron y qué función parece sospechosa.',
    ask: '¿Qué deberías hacer?',
    options: [
      'Ejecutar /compact para condensar la salida verbosa del descubrimiento conservando las conclusiones que necesitas para seguir.',
      'Ejecutar /clear y empezar de nuevo, volviendo a explicar el bug para que Claude trabaje otra vez desde un contexto totalmente vacío.',
      'Pedir a Claude que vuelva a leer ahora los ficheros sospechosos, para que el código más relevante sea lo más reciente de su contexto.',
      'Cambiar a un modelo con una ventana de contexto mayor y seguir explorando igual, sin cambiar nada de la sesión.',
    ],
    why: [
      '/compact reduce el uso de contexto en sesiones largas de exploración resumiendo la salida verbosa, así que los hallazgos sobreviven.',
      '/clear encaja con tareas nuevas no relacionadas; aquí tiraría las hipótesis descartadas y el sospechoso que encontraste.',
      'Volver a leer añade más salida verbosa a un contexto casi lleno, lo que empeora el problema.',
      'Una ventana mayor retrasa el límite pero no la degradación; la salida de las pistas fallidas sigue desplazando lo importante.',
    ],
    rule: 'Contexto lleno de salida de descubrimiento a mitad de tarea: /compact, no /clear.',
  },
  'g2-phase-summary-subagents': {
    scenario:
      'La fase 1 de un refactor mapeó cómo el módulo de auth legacy emite y renueva tokens. Para la fase 2 lanzas tres subagentes que actualizan los servicios de API, worker y admin. Cada uno vuelve a explorar el módulo de auth desde cero, y dos hacen suposiciones contradictorias sobre la expiración de los tokens.',
    ask: '¿Cuál es la solución más eficaz?',
    options: [
      'Confiar en que los subagentes heredan el contexto de la sesión principal, y añadir una nota en CLAUDE.md diciéndoles que lo reutilicen.',
      'Pasar a cada subagente la transcripción completa de la fase 1, incluidas todas las lecturas de ficheros, para que no falte ningún detalle.',
      'Hacer los tres servicios uno detrás de otro en la sesión principal, para que los hallazgos de la fase 1 se queden en un único contexto.',
      'Resumir los hallazgos clave de la fase 1, incluidas las reglas de expiración de tokens, e inyectar ese resumen en el prompt de cada subagente.',
    ],
    why: [
      'Los subagentes no heredan automáticamente la conversación principal; los hallazgos hay que pasárselos de forma explícita.',
      'Una transcripción completa inunda cada subagente de salida verbosa; un resumen destilado transmite lo que importa.',
      'Apilar tres implementaciones encima de la fase 1 en un solo contexto invita al agotamiento y a la degradación.',
      'Resumir los hallazgos de una fase e inyectarlos en los subagentes de la siguiente los mantiene coherentes y enfocados.',
    ],
    rule: 'Entre fases, da a los subagentes un resumen de los hallazgos, no el historial en bruto.',
  },
  'g2-specific-question-subagents': {
    scenario:
      'Antes de diseñar un refactor necesitas tres respuestas: dónde se leen los feature flags, qué tests cubren el checkout y de qué depende el flujo de reintentos de pago. La última vez que hiciste preguntas así en la sesión principal, su contexto se llenó de resultados de búsqueda antes incluso de empezar con el diseño.',
    ask: '¿Cuál es el enfoque más eficaz?',
    options: [
      'Lanzar un subagente con la instrucción de explorar todo el código e informar de todo lo que pueda ser relevante para el refactor.',
      'Lanzar un subagente por cada pregunta concreta, cada uno devolviendo una respuesta corta, mientras la sesión principal mantiene el diseño.',
      'Hacer que la sesión principal haga Read de todos los ficheros de las carpetas de checkout y payments, y luego responda las tres preguntas.',
      'Responder las preguntas en la sesión principal y luego ejecutar /clear antes del diseño para que desaparezcan los resultados de búsqueda.',
    ],
    why: [
      'Un encargo vago y abierto produce un informe enorme que vuelve a meter la salida verbosa en la sesión principal.',
      'Los subagentes acotados a preguntas concretas aíslan la búsqueda verbosa y devuelven solo lo que necesita la coordinación.',
      'Leer carpetas enteras de antemano llena el contexto principal, que es el fallo que se vio la última vez.',
      '/clear elimina las respuestas junto con el ruido, así que el diseño empieza sin ellas.',
    ],
    rule: 'Lanza subagentes para preguntas concretas; deja la sesión principal para coordinar.',
  },
  'x-clear-between-tasks': {
    scenario:
      'Un desarrollador mantiene abierta una única sesión de Claude Code todo el día, saltando entre tareas no relacionadas. Por la tarde, Claude confunde ficheros y recupera decisiones de la mañana.',
    ask: '¿Cuál es la buena práctica?',
    options: [
      'Ejecutar /compact cada hora para que la sesión se mantenga ordenada y los detalles antiguos queden resumidos.',
      'Pegar un resumen de las decisiones anteriores del día en cada prompt nuevo para mantener a Claude alineado.',
      'Cambiar a un modelo con una ventana de contexto mayor para que todo el día quepa sin confusión.',
      'Ejecutar /clear entre tareas no relacionadas, y guardar en CLAUDE.md el conocimiento que deba perdurar.',
    ],
    why: [
      'La compactación conserva un resumen del trabajo antiguo no relacionado.',
      'Añade todavía más contexto mezclado.',
      'Más espacio para la confusión, no menos.',
      'Un contexto limpio por tarea, con los datos duraderos recargados desde CLAUDE.md.',
    ],
    rule: 'Una tarea, un contexto. /clear entre trabajos no relacionados.',
  },
  'c-deny-migrations': {
    scenario:
      'El CLAUDE.md del proyecto dice “nunca edites ficheros de migrations/”. Aun así, Claude Code los edita de vez en cuando, y el equipo necesita una garantía.',
    ask: '¿Cuál es el cambio más adecuado?',
    options: [
      'Repetir la regla en mayúsculas al principio de CLAUDE.md y explicar por qué las migraciones nunca deben cambiar.',
      'Copiar la regla en el ~/.claude/CLAUDE.md de cada desarrollador para que se cargue en todas las sesiones que abra.',
      'Añadir una regla deny para ediciones bajo migrations/ en el .claude/settings.json del proyecto, versionado para que aplique a todos.',
      'Pedir a los revisores que bloqueen cualquier PR que toque migrations/ y mencionarlo en la guía de contribución.',
    ],
    why: [
      'CLAUDE.md es contexto, no configuración que se haga cumplir.',
      'El mismo problema, ahora repartido entre máquinas.',
      'Las reglas de permisos las hace cumplir el propio Claude Code, y los settings versionados aplican a todo el equipo. Un hook PreToolUse también serviría.',
      'Lo detecta tarde y depende de las personas.',
    ],
    rule: 'CLAUDE.md orienta; los permisos y los hooks obligan.',
  },
  'c-posttooluse-format': {
    scenario:
      'El equipo quiere que todos los ficheros que edita Claude pasen por el formateador. CLAUDE.md lo pide, pero Claude se olvida aproximadamente una de cada tres veces.',
    ask: '¿Cuál es el mecanismo adecuado?',
    options: [
      'Un hook PreToolUse en Edit|Write que ejecute el formateador sobre el fichero que Claude va a cambiar.',
      'Un hook PostToolUse en Edit|Write que ejecute el formateador sobre cada fichero que Claude ha cambiado.',
      'Un slash command /format que los desarrolladores ejecuten cada vez que terminen una tanda de ediciones.',
      'Una instrucción más contundente en CLAUDE.md que indique el comando del formateador y explique por qué importa.',
    ],
    why: [
      'Se ejecuta antes de la edición, así que todavía no hay nada nuevo que formatear.',
      'Se ejecuta automáticamente después de cada edición, de forma determinista.',
      'Depende de que las personas se acuerden.',
      'Sigue siendo probabilístico.',
    ],
    rule: 'Debe ocurrir tras cada edición → hook PostToolUse.',
  },
  'r-loop-iteration-cap': {
    scenario:
      'El bucle del coordinador usa un tope de 5 iteraciones como regla principal de parada. En temas amplios, el 30% de las ejecuciones no devuelve ningún informe sintetizado. Las trazas muestran que la quinta respuesta tenía stop_reason "tool_use" con una llamada a Task pendiente al subagente de síntesis que el bucle nunca ejecutó.',
    ask: '¿Cuál es el cambio más eficaz?',
    options: [
      'Mantener el tope, pero cuando se alcance con stop_reason "tool_use", permitir una iteración extra para la llamada pendiente.',
      'Iterar mientras stop_reason sea "tool_use", ejecutando cada llamada a Task y devolviendo su resultado; parar en "end_turn".',
      'Indicar al coordinador que llame al subagente de síntesis dentro de sus cinco primeras respuestas, sea cual sea el tema.',
      'Terminar el bucle cuando el texto del coordinador incluya "informe final" y, si no, seguir iterando hasta un timeout.',
    ],
    why: [
      'El tope sigue siendo la regla principal de parada. Un turno extra solo cubre la siguiente llamada pendiente, y el coordinador puede necesitar varias más.',
      'El modelo indica cuándo necesita tools ("tool_use") y cuándo ha terminado ("end_turn"). Un tope alto puede quedarse como red de seguridad, no como regla principal.',
      'Encaja a la fuerza la delegación que decide el modelo dentro de un tope que ya falla y depende de que se cumpla el prompt; el bucle sigue perdiendo las tool calls pendientes.',
      'Detectar el final analizando frases en lenguaje natural es un antipatrón; puede que el coordinador nunca use exactamente esas palabras.',
    ],
    rule: 'Los topes de iteraciones son redes de seguridad; stop_reason decide cuándo termina el bucle.',
  },
  'r2-loop-only-first-tool-use': {
    scenario:
      'El coordinador suele emitir cuatro llamadas a Task en una misma respuesta, una por subtema. Las trazas muestran que en ese turno solo se ejecuta el primer subagente; en los turnos siguientes el coordinador vuelve a emitir las llamadas restantes de una en una, y la fase de búsqueda tarda cuatro veces más de lo previsto. El código del bucle solo lee response.content[0] cuando stop_reason es "tool_use".',
    ask: '¿Cuál es la solución más eficaz?',
    options: [
      'Ejecutar todos los bloques tool_use de la respuesta y devolver todos sus resultados juntos antes de enviar la siguiente petición.',
      'Indicar al coordinador que emita solo una llamada a Task por respuesta, para que el bucle nunca reciba más llamadas de las que puede gestionar.',
      'Forzar la tool Task con tool_choice para que el coordinador produzca exactamente una delegación bien formada en cada turno.',
      'Encolar las llamadas a Task sobrantes y ejecutarlas tras la siguiente respuesta "end_turn" del coordinador, cuando acabe su razonamiento principal.',
    ],
    why: [
      'Una respuesta puede contener varios bloques tool_use. El bucle debe ejecutarlos todos y devolver cada resultado; esto es también lo que permite que los subagentes trabajen en paralelo.',
      'Oculta el bug del bucle renunciando al paralelismo, así que la fase de búsqueda sigue siendo secuencial y lenta.',
      'Forzar la selección de tool controla qué tool se llama, no cuántas llamadas se gestionan; el bucle seguiría perdiendo las llamadas extra.',
      'Tras "end_turn" el coordinador ya ha terminado sin esos resultados, así que ejecutarlos más tarde rompe el ciclo petición-resultado.',
    ],
    rule: 'Ejecuta todos los bloques tool_use de una respuesta y devuelve después todos los resultados.',
  },
  'r2-loop-results-not-appended': {
    scenario:
      'Las trazas muestran que el coordinador lanza el mismo subagente de búsqueda web con un prompt idéntico tres o cuatro veces por ejecución, y el coste por ejecución se ha triplicado. El bucle comprueba stop_reason correctamente y ejecuta todas las llamadas a Task, pero el código solo escribe en los logs el resultado de cada subagente; la siguiente petición envía el mismo array de messages que antes.',
    ask: '¿Cuál es la causa raíz más probable?',
    options: [
      'El prompt del coordinador no le indica que lleve un registro de los subtemas que ya ha delegado, así que los vuelve a delegar.',
      'El subagente de búsqueda web devuelve resultados demasiado vagos, así que el coordinador repite la búsqueda con la esperanza de obtener algo mejor.',
      'Los resultados de los subagentes nunca se añaden al historial como tool results, así que en cada petición la llamada parece no haberse hecho.',
      'El bucle no tiene un tope de iteraciones por subtema, así que nada impide que el coordinador delegue el mismo subtema más de una vez.',
    ],
    why: [
      'El modelo no puede llevar la cuenta de resultados que nunca se le mostraron. Una regla en el prompt no arregla un bucle que deja los tool results fuera del historial.',
      'Culpa a un agente posterior. La traza muestra que los resultados no llegan al coordinador en ningún caso, sea cual sea su calidad.',
      'En el bucle agéntico, los tool results deben añadirse al historial de la conversación para que el modelo pueda razonar su siguiente acción; sin ellos, repite la llamada.',
      'Los topes arbitrarios no son el mecanismo de parada, y un tope ocultaría el bug real: el coordinador nunca ve los resultados que pidió.',
    ],
    rule: 'Añade cada tool result al historial antes de la siguiente petición.',
  },
  'a-delegation-brief': {
    scenario:
      'Un orquestador les dice a tres subagentes “investigad el mercado de patinetes eléctricos”. Dos de ellos cubren los mismos competidores y nadie mira la regulación.',
    ask: '¿Qué debería cambiar?',
    options: [
      'Dar a cada subagente un brief explícito: objetivo, alcance, formato de salida y qué cubre el resto.',
      'Añadir dos subagentes más con la misma instrucción para que las búsquedas extra cubran los huecos.',
      'Dejar que los subagentes se envíen mensajes mientras trabajan para repartirse el mercado entre ellos.',
      'Sustituir los tres subagentes por un único agente que investigue todo el mercado de principio a fin.',
    ],
    why: [
      'Una delegación vaga provoca trabajo duplicado y huecos. El trabajo del orquestador es dividir la tarea de forma explícita.',
      'Más solapamiento y más coste; la cobertura sigue siendo aleatoria.',
      'Añade sobrecarga de coordinación y no garantiza un reparto sensato.',
      'Se pierden el paralelismo y el aislamiento de contexto.',
    ],
    rule: 'Delega con un brief explícito: objetivo, límites y formato de salida.',
  },
  'r-coordinator-refinement-loop': {
    scenario:
      'Los revisores detectan huecos en el 25% de los informes. Un informe sobre reciclaje de baterías cubre costes y química, pero no dice nada de regulación. Los logs muestran que el coordinador invoca la síntesis una vez y devuelve su salida como informe final, incluso cuando la propia salida de la síntesis indica "no se encontraron fuentes sobre marcos regulatorios".',
    ask: '¿Qué cambio lo soluciona mejor?',
    options: [
      'Indicar al subagente de síntesis que rellene cualquier hueco que detecte con su propio conocimiento general para que cada informe parezca completo.',
      'Permitir que el subagente de síntesis llame directamente al subagente de búsqueda web cuando encuentre un hueco, saltándose al coordinador.',
      'Hacer que el subagente de búsqueda web devuelva el doble de resultados en cada consulta para que los huecos de cobertura sean menos probables.',
      'Hacer que el coordinador revise la síntesis buscando huecos, envíe consultas concretas de vuelta a búsqueda y análisis y repita la síntesis.',
    ],
    why: [
      'Rellenar sin fuentes incumple el requisito de informe con citas y oculta el hueco en lugar de cerrarlo.',
      'Las llamadas directas entre subagentes rompen el hub-and-spoke: el coordinador pierde observabilidad, un manejo de errores consistente y el control del flujo de información.',
      'Más resultados en todas partes es fuerza bruta: añade ruido sin apuntar al subtema que falta.',
      'Un bucle de refinamiento iterativo permite al coordinador evaluar la cobertura, enviar consultas de seguimiento concretas y volver a sintetizar hasta que la cobertura sea suficiente.',
    ],
    rule: 'El coordinador revisa la síntesis en busca de huecos y vuelve a delegar consultas concretas.',
  },
  'r2-coordinator-dynamic-routing': {
    scenario:
      'Cerca del 40% de las peticiones son preguntas factuales concretas como "¿Cuándo entró en vigor la Ley de IA de la UE?". Aun así, todas las peticiones pasan por búsqueda web, análisis de documentos, síntesis y generación del informe, así que estas respuestas de una línea tardan unos 3 minutos y cuestan lo mismo que un informe completo. Los usuarios puntúan la velocidad de las respuestas factuales con un 2,1/5.',
    ask: '¿Qué cambio resuelve mejor esto?',
    options: [
      'Pasar todos los subagentes a un modelo más pequeño y rápido para que el pipeline completo de cuatro etapas termine antes en todas las peticiones.',
      'Cachear las respuestas finales a preguntas factuales anteriores para que las preguntas repetidas se salten el pipeline y devuelvan el informe guardado.',
      'Eliminar la etapa de análisis de documentos en todas las peticiones, ya que la mayoría de los resultados web pueden ir directamente a síntesis.',
      'Hacer que el coordinador evalúe la complejidad de cada consulta e invoque solo los subagentes que necesita, en vez de ejecutar siempre los cuatro.',
    ],
    why: [
      'Sacrifica calidad en los informes complejos a cambio de velocidad y sigue ejecutando cuatro etapas para una respuesta de una línea.',
      'Una caché especulativa solo ayuda con repeticiones exactas y puede servir datos desactualizados; las preguntas sencillas nuevas siguen pagando el pipeline completo.',
      'Un recorte general perjudica a la investigación compleja que necesita análisis de documentos; el problema es el enrutamiento fijo, no una etapa concreta.',
      'Parte del papel del coordinador es elegir qué subagentes invocar según la complejidad de la consulta, en lugar de pasar siempre por el pipeline completo.',
    ],
    rule: 'El coordinador elige los subagentes según la consulta; no todas las consultas los necesitan todos.',
  },
  'r2-hub-and-spoke-bypass': {
    scenario:
      'Para reducir la latencia, el equipo dejó que el subagente de búsqueda web escribiera sus resultados directamente en una cola compartida que lee el subagente de síntesis. Desde entonces, el 9% de los informes omite en silencio subtemas enteros. Los logs del coordinador muestran todas las ejecuciones como correctas, y nadie sabe si una búsqueda falló, no devolvió nada o la síntesis nunca la leyó.',
    ask: '¿Cuál es el cambio más eficaz?',
    options: [
      'Añadir al subagente de síntesis una comprobación que compare el contenido de la cola con el tema y pida más al subagente de búsqueda.',
      'Enrutar todos los resultados de los subagentes de vuelta por el coordinador, que los revisa, gestiona los errores y los pasa a síntesis.',
      'Hacer que el subagente de búsqueda web escriba un registro de estado junto a cada resultado de la cola para que síntesis detecte búsquedas fallidas.',
      'Enviar los logs de cada subagente a un dashboard central para que los ingenieros revisen las búsquedas fallidas y relancen los informes afectados.',
    ],
    why: [
      'Hace que la síntesis haga el trabajo del coordinador y añade otra vía directa entre subagentes, lo que dispersa aún más el control.',
      'Enrutar todo por el coordinador aporta observabilidad, un manejo de errores consistente y un flujo de información controlado; el atajo eliminó las tres cosas.',
      'La síntesis sigue decidiendo sola qué hacer con los fallos, así que el manejo de errores sigue disperso e invisible para el coordinador.',
      'Añade visibilidad a posteriori, pero nada puede recuperarse durante la ejecución; el coordinador sigue a ciegas.',
    ],
    rule: 'Enruta toda la comunicación de los subagentes a través del coordinador.',
  },
  'r-parallel-task-calls': {
    scenario:
      'Para cada tema, el coordinador asigna cuatro subtemas distintos a subagentes de búsqueda web. Las trazas muestran que emite una llamada a Task por respuesta y espera cada resultado antes de la siguiente. Cada subagente tarda unos 60 segundos, pero la fase de búsqueda dura más de 4 minutos.',
    ask: '¿Qué cambio reduce mejor la latencia de la fase de búsqueda?',
    options: [
      'Hacer que el coordinador emita las cuatro llamadas a Task en una sola respuesta para que los cuatro subagentes corran en paralelo.',
      'Fusionar los cuatro subtemas en una consulta amplia para un único subagente de búsqueda web y evitar el coste de lanzar subagentes.',
      'Lanzar cada subagente con fork_session para que parta del historial del coordinador y necesite menos tiempo para ponerse en marcha.',
      'Poner tool_choice a "any" en el coordinador para que se vea obligado a llamar a la tool Task en todos los turnos sin hacer pausas.',
    ],
    why: [
      'Varias llamadas a Task en una misma respuesta del coordinador lanzan los subagentes en paralelo, así que la fase dura más o menos lo que tarde el más lento.',
      'Pierde la partición que evita duplicados y reduce la cobertura, y un solo agente sigue recorriendo los subtemas uno a uno.',
      'Hacer fork con fork_session bifurca una sesión para explorar enfoques divergentes desde una base común; no convierte un lanzamiento secuencial en paralelo.',
      'Poner tool_choice a "any" fuerza alguna tool call en cada turno, pero no hace que el coordinador emita varias llamadas a la vez.',
    ],
    rule: 'Subagentes en paralelo = varias llamadas a Task en una misma respuesta del coordinador.',
  },
  'r-synthesis-missing-findings': {
    scenario:
      'El coordinador lanza el subagente de síntesis con el prompt "Sintetiza en un resumen con citas los hallazgos recopilados hasta ahora." La salida es genérica y no tiene citas. Su traza no menciona ninguna de las 14 fuentes que los subagentes de búsqueda y análisis devolvieron antes en la conversación del coordinador.',
    ask: '¿Cuál es la causa raíz más probable?',
    options: [
      'La ventana de contexto del subagente de síntesis es demasiado pequeña para 14 fuentes a la vez, así que las descartó y escribió de memoria.',
      'Los subagentes no heredan el historial del coordinador, así que los hallazgos nunca estuvieron en su prompt; hay que pasárselos.',
      'A la AgentDefinition del subagente de síntesis le faltan tools de búsqueda web, así que no pudo volver a obtener las fuentes que debía citar.',
      'El prompt no especificaba un formato de cita, así que el subagente decidió omitir por completo las citas de su resumen.',
    ],
    why: [
      'Las fuentes nunca llegaron al subagente, así que el tamaño de la ventana no es el problema.',
      'Los subagentes se ejecutan con contexto aislado. El coordinador debe incluir en el prompt del subagente los hallazgos previos completos, con los metadatos de sus fuentes.',
      'La síntesis debe trabajar con los hallazgos que recibe, no volver a buscar; añadirle tools de búsqueda invita a usarlas fuera de su rol y oculta la causa real.',
      'Una instrucción de formato no sirve si el subagente no tiene nada que citar; la traza muestra que nunca vio las fuentes.',
    ],
    rule: 'Los subagentes empiezan en blanco: pásales explícitamente en su prompt los hallazgos previos.',
  },
  'r2-coordinator-flattens-metadata': {
    scenario:
      'Los subagentes de búsqueda y análisis devuelven hallazgos en JSON con los campos claim, source_url, document, page y date. Aun así, los informes finales atribuyen mal el 27% de las citas. Los logs muestran que el coordinador construye el prompt de síntesis uniendo todos los hallazgos en un único párrafo en prosa, con todas las fuentes listadas juntas al final.',
    ask: '¿Cuál es la solución más eficaz?',
    options: [
      'Añadir al system prompt del subagente de síntesis una instrucción que le pida citar con cuidado y comprobar dos veces cada atribución.',
      'Hacer que el subagente de generación de informes vuelva a buscar cada afirmación citada y sustituya las citas que no pueda confirmar online.',
      'Hacer que el coordinador pase los hallazgos a síntesis como registros estructurados que mantengan juntos cada afirmación y los metadatos de su fuente.',
      'Añadir campos de autor y editorial a los hallazgos JSON de los subagentes para que síntesis tenga más metadatos con los que emparejar afirmaciones y fuentes.',
    ],
    why: [
      'Culpa al agente de síntesis, que no puede recuperar vínculos que el coordinador eliminó antes de que llegara a ver los hallazgos.',
      'Buscar citas a posteriori puede asignar una fuente que nunca fue la base de la afirmación, y además añade latencia.',
      'Los formatos estructurados que separan contenido y metadatos preservan la atribución cuando el contexto pasa de un agente a otro; es en el coordinador donde se perdieron los vínculos.',
      'La salida de origen ya es estructurada; los campos extra se aplanarían igual y se seguiría perdiendo el vínculo afirmación-fuente.',
    ],
    rule: 'Pasa los hallazgos entre agentes como registros estructurados, no como prosa aplanada.',
  },
  'r2-goals-not-procedures': {
    scenario:
      'El coordinador da a cada subagente de búsqueda un procedimiento fijo de 7 pasos: ejecutar la consulta Q en un índice académico, tomar los 5 primeros resultados, resumir cada abstract y parar. En temas de nicho, los primeros resultados suelen estar fuera de tema o tras un paywall, pero los subagentes siguen los pasos y devuelven 5 abstracts flojos; el 31% de los subtemas acaba sin ninguna fuente útil.',
    ask: '¿Qué cambio en los prompts de delegación del coordinador mejoraría más los resultados?',
    options: [
      'Indicar el objetivo de investigación y los criterios de calidad, como actualidad y tipo de fuente, y dejar que cada subagente decida cómo cumplirlos.',
      'Detallar más el procedimiento, con pasos alternativos para resultados tras paywall o fuera de tema, para que el subagente sepa exactamente qué hacer.',
      'Subir el número de primeros resultados de 5 a 20 para que incluso los temas de nicho tengan suficientes fuentes pertinentes entre los resultados.',
      'Hacer que el coordinador revise los 5 abstracts tras cada ejecución y, si son flojos, envíe un nuevo procedimiento de 7 pasos con la consulta reformulada.',
    ],
    why: [
      'Los prompts de delegación que indican objetivos y criterios de calidad, en lugar de procedimientos paso a paso, permiten a los subagentes adaptarse cuando falla el camino previsto.',
      'Cada caso límite nuevo necesita otra regla; un guion más largo sigue siendo frágil y sigue impidiendo la adaptación.',
      'Más resultados implican más ruido y coste, y el subagente sigue sin poder cambiar de estrategia cuando el índice no es el sitio donde buscar.',
      'Añade idas y vueltas con el coordinador para parchear cada fallo en lugar de dejar que el subagente se adapte dentro de su propia ejecución.',
    ],
    rule: 'Delega objetivos y criterios de calidad, no procedimientos paso a paso.',
  },
  'r2-task-not-in-allowed-tools': {
    scenario:
      'Se configuró un nuevo coordinador con AgentDefinitions para cuatro subagentes y un prompt que le pide delegar cada subtema. En las pruebas nunca lanza un subagente: las trazas muestran cero llamadas a Task, y escribe los informes con su propio conocimiento, sin citas. Su lista allowedTools es ["Read", "Write"].',
    ask: '¿Cuál es la causa raíz más probable?',
    options: [
      'Las descripciones de las AgentDefinition de los subagentes son demasiado cortas, así que el coordinador no sabe qué subagente encaja con cada subtema.',
      'El allowedTools del coordinador no incluye "Task", así que no tiene forma de lanzar los subagentes definidos para él.',
      'La instrucción de delegación es demasiado suave; necesita una redacción más contundente, como "DEBES delegar", para que el coordinador actúe.',
      'El coordinador necesita tool_choice con valor "any" para verse obligado a llamar a una tool en lugar de responder con texto plano.',
    ],
    why: [
      'Las descripciones vagas provocan elecciones de subagente erróneas, no cero delegación; el coordinador ni siquiera intentó llamar a Task.',
      'Los subagentes se lanzan mediante la tool Task, así que el allowedTools del coordinador debe incluir "Task" para que pueda haber delegación.',
      'Ninguna redacción puede hacer que el modelo llame a una tool que no se le ha dado; la causa es la configuración, no la fuerza del prompt.',
      'Con "any" el coordinador solo podría elegir Read o Write; forzar una tool call no añade la tool Task que falta.',
    ],
    rule: 'Un coordinador solo puede lanzar subagentes si allowedTools incluye "Task".',
  },
  'r2-publish-gate-verification': {
    scenario:
      'Los contratos con clientes exigen que todo informe publicado pase antes por verify_citations. El prompt del subagente de generación de informes lo indica en negrita, y los ejemplos few-shot muestran el orden. Aun así, las auditorías detectan que el 6% de los informes publicados se saltó la verificación, y dos citaban páginas que no existen.',
    ask: '¿Cuál es el cambio más eficaz?',
    options: [
      'Mover la regla de verificación al principio del system prompt y repetirla al final, para que la instrucción nunca se pierda en el medio.',
      'Ejecutar un job de auditoría nocturno que revise cada informe publicado ese día y retire los que tengan citas que no pasen la verificación.',
      'Añadir más ejemplos few-shot que muestren al agente llamando a verify_citations antes de publish_report en distintos tipos de informe.',
      'Bloquear publish_report de forma programática hasta que verify_citations dé el visto bueno al borrador actual del informe.',
    ],
    why: [
      'La posición ayuda a la atención, pero las instrucciones del prompt mantienen una tasa de fallo distinta de cero cuando el cumplimiento tiene que estar garantizado.',
      'Detecta las infracciones cuando los clientes ya han recibido el informe; no las evita.',
      'Los ejemplos aumentan el cumplimiento pero siguen siendo probabilísticos, y el prompt ya tiene ejemplos.',
      'Cuando un orden es obligatorio por contrato, un prerrequisito programático da una garantía determinista que las indicaciones del prompt no pueden dar.',
    ],
    rule: 'Orden de pasos obligatorio: imponlo con un bloqueo programático, no con la redacción.',
  },
  'r2-blocked-domain-interception': {
    scenario:
      'La licencia de un cliente prohíbe usar contenido de tres dominios concretos de proveedores de datos. El prompt del subagente de búsqueda enumera esos dominios y dice que nunca acceda a ellos. Las auditorías muestran que el 4% de los informes aún los cita, normalmente cuando un resultado de uno de esos dominios parecía la mejor coincidencia.',
    ask: '¿Qué enfoque garantiza mejor el cumplimiento?',
    options: [
      'Hacer que el subagente de generación de informes elimine cualquier cita a los dominios prohibidos justo antes de publicar el informe final.',
      'Repetir también la lista de dominios en el prompt del coordinador, para que dos agentes distintos vigilen las fuentes prohibidas.',
      'Añadir un hook que intercepte las llamadas de fetch a los dominios prohibidos, las bloquee y le diga al agente que busque otra fuente.',
      'Bajar el ranking de esos dominios en los resultados de la tool de búsqueda para que el agente tenga menos probabilidad de elegirlos de entrada.',
    ],
    why: [
      'Quitar las citas al final deja afirmaciones sin respaldo, o mantiene en el informe contenido sacado de fuentes prohibidas.',
      'Dos comprobaciones probabilísticas siguen siendo probabilísticas; ninguna de las dos garantiza la regla.',
      'Un hook que intercepta las tool calls salientes aplica la regla de forma determinista y redirige al agente hacia una alternativa.',
      'Un ranking más bajo hace que las infracciones sean menos frecuentes, pero no las impide, y una regla de licencia necesita una garantía.',
    ],
    rule: 'Cumplimiento de políticas garantizado: intercepta la tool call con un hook.',
  },
  'r2-posttooluse-date-normalization': {
    scenario:
      'Los agentes de investigación usan tres tools MCP: una API de noticias devuelve timestamps Unix, una tool de documentación regulatoria devuelve fechas como "03/04/2024" (con el día primero) y un índice académico devuelve ISO 8601. Las cronologías del 18% de los informes ordenan mal los eventos, y la síntesis a veces presenta un mismo evento con dos fechas contradictorias.',
    ask: '¿Qué enfoque lo soluciona mejor?',
    options: [
      'Añadir al system prompt una instrucción que pida a todos los agentes convertir todas las fechas a ISO 8601 antes de usarlas al razonar o en la salida.',
      'Añadir un hook PostToolUse que convierta a ISO 8601 las fechas de los resultados de cada tool antes de que el agente los procese.',
      'Hacer que la síntesis devuelva cada conflicto de fechas al coordinador para que el subagente de búsqueda web lo revise antes de que escriba.',
      'Pedir a los proveedores de las tres tools que cambien sus APIs para que todas devuelvan fechas en ISO 8601 en una versión futura.',
    ],
    why: [
      'La conversión mediante el prompt es probabilística, y un formato como "03/04" se puede leer fácilmente con el mes primero.',
      'Los hooks PostToolUse interceptan los resultados de las tools y normalizan formatos heterogéneos de forma determinista antes de que el modelo los vea.',
      'Trata un problema de formato como un conflicto de investigación y añade idas y vueltas costosas por cada fecha.',
      'Está fuera de tu control y es lento; mientras tanto los informes siguen saliendo mal, mientras que un hook lo arregla ya.',
    ],
    rule: 'Normaliza los formatos mixtos de las tools en un hook PostToolUse, no en el prompt.',
  },
  'r2-adaptive-decomposition': {
    scenario:
      'Para preguntas como "¿Por qué perdió cuota de mercado la marca X en 2025?", el coordinador escribe cinco subconsultas fijas al principio y las ejecuta como un pipeline. En una ejecución, los primeros hallazgos apuntaban a una retirada de producto, pero ningún paso posterior la investigó y el informe culpó al precio. Los revisores dicen que el 40% de estos informes no da con la causa clave.',
    ask: '¿Qué estrategia de descomposición encaja mejor con estas peticiones?',
    options: [
      'Descomposición dinámica: que el coordinador cree nuevas subtareas a partir de hallazgos intermedios, como la retirada, sobre la marcha.',
      'Aumentar las subconsultas fijas de cinco a doce para que el plan inicial cubra más causas posibles antes de lanzar ninguna búsqueda.',
      'Mantener el pipeline fijo pero añadir un subagente final de revisión que liste causas que el informe pudo pasar por alto, para que las investigue el usuario.',
      'Prompt chaining con pasadas de mercado, precios, producto y competencia, aplicadas en el mismo orden fijo a todas las preguntas.',
    ],
    why: [
      'Las investigaciones abiertas necesitan planes adaptativos que generen subtareas según lo que descubre cada paso.',
      'Una lista inicial más larga sigue sin poder anticipar hallazgos como la retirada, y añade coste a cada pregunta.',
      'Informa de los huecos en lugar de investigarlos, así que el hueco principal de la investigación sigue abierto.',
      'El prompt chaining va bien para trabajo predecible con varios aspectos; una secuencia fija no puede seguir pistas inesperadas.',
    ],
    rule: 'Investigación abierta: descompón de forma adaptativa según lo que vayas encontrando.',
  },
  'r-stale-session-fresh-summary': {
    scenario:
      'Una sesión de investigación con nombre sobre las cadenas de suministro de baterías para vehículos eléctricos estuvo en pausa tres semanas. Al reanudarla, el agente cita precios y el estado de un arancel a partir de tool results obtenidos antes de la pausa. Las comprobaciones puntuales muestran que varias de esas cifras, y dos de las páginas citadas, han cambiado desde entonces.',
    ask: '¿Cuál es la forma más eficaz de continuar el trabajo?',
    options: [
      'Reanudar la sesión como antes, añadiendo una instrucción para revisar cualquier cifra de la que el agente no esté del todo seguro.',
      'Usar fork_session sobre la sesión antigua para que la nueva rama conserve todos los tool results previos y la original quede intacta.',
      'Reanudar la sesión con un modelo con una ventana de contexto mayor para que pueda comparar lado a lado los tool results antiguos y los nuevos.',
      'Empezar una sesión nueva con un resumen de los hallazgos previos, marcando las cifras sensibles al tiempo para volver a obtenerlas.',
    ],
    why: [
      'Los resultados obsoletos siguen en el contexto y el agente no puede saber cuáles están desactualizados; su propia valoración de confianza no los detectará.',
      'Un fork copia la misma base obsoleta. fork_session sirve para explorar enfoques divergentes, no para refrescar datos.',
      'El tamaño del contexto no hace que los datos obsoletos pasen a estar al día.',
      'Cuando los tool results previos están obsoletos, una sesión nueva con un resumen inyectado es más fiable que reanudar; reanudar encaja cuando el contexto sigue siendo válido en su mayoría.',
    ],
    rule: 'Tool results obsoletos: empieza de cero con un resumen en lugar de reanudar.',
  },
  'r2-fork-two-framings': {
    scenario:
      'Tras una sesión de 50 minutos analizando 35 documentos sobre políticas contra el calor urbano, el cliente quiere dos borradores de informe: uno enfocado en los costes y otro en la salud pública. Hoy el equipo repite el análisis completo en dos sesiones nuevas, lo que duplica el coste, y los borradores discrepan en hechos básicos porque cada ejecución eligió fuentes distintas.',
    ask: '¿Cuál es el enfoque más eficaz?',
    options: [
      'Reanudar la sesión de análisis con --resume y escribir el borrador de costes, y luego seguir en esa misma sesión para escribir el de salud.',
      'Empezar dos sesiones nuevas, cada una con un breve resumen del análisis, y escribir uno de los dos enfoques en cada una de ellas.',
      'Pedir a la sesión original que escriba los dos enfoques en una sola respuesta para que compartan el mismo análisis y las mismas fuentes.',
      'Usar fork_session para crear dos ramas a partir del análisis terminado y desarrollar un enfoque en cada rama.',
    ],
    why: [
      'El borrador de salud heredaría el razonamiento y el enfoque del de costes, así que las dos exploraciones no son independientes.',
      'Un resumen breve pierde gran parte del análisis detallado, que sigue siendo válido; el fork lo mantiene intacto sin volver a analizar.',
      'Mezclar dos enfoques en un mismo contexto hace que cada uno sesgue al otro, y una única respuesta que cubra ambos sale larga y superficial.',
      'fork_session crea ramas independientes a partir de una base de análisis compartida, así que ambos borradores usan los mismos hechos pero pueden divergir libremente.',
    ],
    rule: 'Opciones divergentes a partir de una misma base compartida: usa fork_session.',
  },
  'r2-resume-with-changed-docs': {
    scenario:
      'Una sesión con nombre, "lithium-policy", analizó 30 documentos fuente la semana pasada. Desde entonces, dos de ellos se han sustituido por versiones revisadas (una nueva edición del informe de una agencia y una normativa modificada). Los otros 28 no han cambiado. El equipo tiene que actualizar el análisis hoy.',
    ask: '¿Cuál es la forma más eficaz de continuar?',
    options: [
      'Empezar una sesión nueva con un resumen de los hallazgos de la semana pasada y hacer que vuelva a analizar los 30 documentos por seguridad.',
      'Reanudar "lithium-policy" con --resume y decirle al agente qué dos documentos han cambiado para que vuelva a analizar solo esos.',
      'Reanudar "lithium-policy" con --resume y pedirle que continúe; se dará cuenta por sí mismo de los documentos revisados.',
      'Usar fork_session para crear una rama de "lithium-policy" y hacer que la nueva rama relea los 30 documentos junto a la original.',
    ],
    why: [
      'La mayor parte del contexto previo sigue siendo válida; volver a analizarlo todo hace perder tiempo y tira trabajo bueno.',
      'Cuando la mayor parte del contexto es válida, reanudar e indicar los cambios concretos permite un reanálisis dirigido en lugar de una reexploración completa.',
      'La sesión contiene los tool results antiguos y no tiene forma de saber que los documentos cambiaron, así que sigue razonando con contenido obsoleto.',
      'El fork sirve para explorar enfoques divergentes; copia los mismos resultados obsoletos y duplica el trabajo.',
    ],
    rule: 'Sesión válida en su mayoría: reanúdala e indica exactamente qué ha cambiado.',
  },
  'r-split-generic-analysis-tool': {
    scenario:
      'El subagente de análisis de documentos tiene una sola tool, analyze_document(text, instructions), que se usa para extraer estadísticas, resumir papers y contrastar afirmaciones con una fuente. En el 22% de las comprobaciones de afirmaciones devuelve un resumen general en vez de un veredicto supported/unsupported, y el coordinador a menudo no consigue parsear la salida.',
    ask: '¿Qué cambio mejora más la fiabilidad?',
    options: [
      'Mantener la tool única y añadir ejemplos few-shot de comprobaciones de afirmaciones que terminen con un veredicto claro supported o unsupported.',
      'Buscar la palabra "supported" en cada salida de analyze_document y volver a llamar a la tool con la misma entrada cuando no aparezca.',
      'Dividirla en extract_data_points, summarize_content y verify_claim_against_source, cada una con su propia salida definida.',
      'Pasar la comprobación de afirmaciones al subagente de búsqueda web, ya que puede buscar fuentes adicionales que confirmen o refuten cada afirmación.',
    ],
    why: [
      'Los ejemplos ayudan de forma probabilística, pero una tool genérica sigue sin tener un contrato de salida definido para los veredictos.',
      'Buscar cadenas en una salida en lenguaje natural es frágil, y reintentar con la misma tool ambigua repite el mismo fallo.',
      'Las tools de propósito específico con contratos claros de entrada/salida eliminan la ambigüedad sobre qué debe devolver cada llamada.',
      'Culpa al componente equivocado: contrastar una afirmación con una fuente dada es trabajo de análisis de documentos, y las fuentes nuevas responden a otra pregunta.',
    ],
    rule: 'Divide las tools genéricas en tools de propósito específico con contratos claros.',
  },
  'r2-rename-overlapping-tool': {
    scenario:
      'El subagente de análisis tiene parse_source ("Analiza el contenido de la fuente") y parse_document ("Analiza el contenido de un documento"). parse_document espera PDFs con números de página; parse_source gestiona páginas web. En el 28% de las tareas con páginas web el agente elige parse_document, que devuelve hallazgos con referencias de página vacías que rompen las citas.',
    ask: '¿Cuál es el primer paso más eficaz?',
    options: [
      'Renombrar parse_source a extract_web_page_content y describir sus entradas (solo web), sus salidas y cuándo usar parse_document.',
      'Añadir un clasificador delante del subagente de análisis que inspeccione cada URL y llame a la tool correcta sin que intervenga el modelo.',
      'Hacer que parse_document acepte también páginas web, generando números de página a partir de la longitud del texto para que toda cita tenga uno.',
      'Añadir un reintento que llame a parse_source cada vez que parse_document devuelva hallazgos con referencias de página vacías para una fuente.',
    ],
    why: [
      'Los nombres y descripciones que se solapan provocan errores de enrutamiento; renombrar las tools y diferenciarlas con claridad corrige la causa raíz con poco esfuerzo.',
      'Una capa de enrutamiento es sobreingeniería para un primer paso y se salta la selección de tools del modelo en lugar de arreglar las descripciones.',
      'Los números de página inventados crearían citas falsas; oculta el error de enrutamiento en lugar de corregirlo.',
      'Paga primero la llamada equivocada y trata el síntoma, mientras las descripciones ambiguas siguen provocando errores de enrutamiento.',
    ],
    rule: 'Tools que se solapan: renómbralas y diferencia sus descripciones.',
  },
  'r2-system-prompt-keyword-routing': {
    scenario:
      'El subagente de búsqueda tiene search_web y search_academic, y las descripciones de ambas se reescribieron con entradas, ejemplos y límites. Aun así, las consultas que contienen "informe" o "estudio", como "informe de consultoría sobre IA en retail", siguen yendo a search_academic y no encuentran nada. El system prompt dice: "Para cualquier estudio o informe, usa el índice académico."',
    ask: '¿Cuál es el siguiente paso más eficaz?',
    options: [
      'Ampliar otra vez las descripciones de las dos tools, con más consultas de ejemplo que muestren que los informes de consultoría y de prensa van a search_web.',
      'Fusionar search_web y search_academic en una única tool de búsqueda que consulte ambas fuentes y devuelva siempre los resultados combinados.',
      'Reescribir la instrucción del system prompt para que deje de asociar las palabras "estudio" e "informe" con el índice académico.',
      'Añadir un paso de preprocesado que elimine las palabras "estudio" e "informe" de las consultas antes de que lleguen al subagente de búsqueda.',
    ],
    why: [
      'Las descripciones ya son buenas; la regla de palabras clave del system prompt las anula, así que más ejemplos no lo van a impedir.',
      'Fusionarlas pierde contratos claros entre tools y duplica el coste por consulta, mientras la instrucción engañosa sigue ahí.',
      'Las instrucciones del system prompt sensibles a palabras clave pueden crear asociaciones no deseadas con tools que anulan descripciones bien escritas, así que hay que corregir el origen.',
      'Quitar palabras cambia lo que preguntó el usuario y esquiva la causa real, que es la instrucción del prompt.',
    ],
    rule: 'Revisa el system prompt en busca de reglas por palabras clave que anulen las descripciones de las tools.',
  },
  'r2-error-page-without-iserror': {
    scenario:
      'Los auditores encontraron frases como "Access denied - please enable cookies" y "Service temporarily unavailable" citadas como hallazgos en el 3% de los informes. Los logs muestran que la tool MCP fetch_page devuelve las cargas de página bloqueadas o fallidas como resultados normales y correctos que contienen el texto de la página de error.',
    ask: '¿Cuál es la solución más eficaz?',
    options: [
      'Añadir a la síntesis una instrucción para ignorar cualquier hallazgo que parezca un mensaje de error o un aviso de cookies antes de escribir el informe.',
      'Hacer que fetch_page detecte las cargas fallidas y las devuelva con el flag isError más una categoría, como transient o permission.',
      'Añadir al subagente de generación de informes un filtro que elimine las frases que contengan palabras como "denied" o "unavailable".',
      'Hacer que fetch_page devuelva una cadena vacía en las cargas fallidas para que ningún texto de error llegue nunca a los subagentes de análisis.',
    ],
    why: [
      'Pide a un agente posterior que adivine, lo cual es probabilístico y culpa al componente equivocado; es la tool la que etiqueta mal el fallo.',
      'El flag isError de MCP le dice al agente que la llamada falló, y la categoría le permite decidir si reintentar o buscar otra fuente.',
      'Filtrar por palabras clave es frágil, puede eliminar hallazgos reales que usen esas palabras y deja sin gestionar la carga fallida.',
      'Un éxito vacío parece una página válida sin contenido, así que el fallo se suprime en silencio y nadie reintenta.',
    ],
    rule: 'Los fallos de las tools deben volver con isError, nunca como contenido normal.',
  },
  'r2-paywall-not-retryable': {
    scenario:
      'Cuando una revista está tras un paywall, la tool MCP fetch_article devuelve isError con el mensaje "Request failed." El subagente de búsqueda reintenta cada una de esas llamadas 5 veces con backoff, lo que añade unos 90 segundos por fuente con paywall, y el 22% de las fuentes tienen paywall. Sus tools de búsqueda podrían encontrar copias en acceso abierto de muchas de ellas, pero nunca lo intenta.',
    ask: '¿Cuál es la causa raíz más probable del tiempo perdido?',
    options: [
      'El backoff de los reintentos empieza con esperas demasiado largas, así que cinco intentos tardan mucho más de lo que pretendía la política de reintentos.',
      'El prompt del subagente no tiene ninguna regla sobre paywalls, así que nunca se le ocurre buscar una copia en acceso abierto de un artículo bloqueado.',
      'El subagente de búsqueda no tiene una tool dedicada a buscar en acceso abierto, así que no puede recuperarse cuando un artículo resulta estar tras un paywall.',
      'El error no lleva categoría ni flag de reintentable, así que el subagente trata un fallo de permisos permanente como si fuera uno transitorio.',
    ],
    why: [
      'Ajustar las esperas solo acelera unos reintentos inútiles; un artículo tras un paywall nunca cargará al reintentar, se configure como se configure el backoff.',
      'Una regla sobre paywalls parchea un caso, pero mientras todos los errores digan solo "Request failed" el agente no puede distinguir un paywall de un timeout.',
      'Sus tools de búsqueda actuales ya pueden encontrar copias en acceso abierto; nunca llega a usarlas porque sigue reintentando.',
      'Sin errorCategory ni isRetryable el agente no puede distinguir los fallos reintentables de los que no lo son; los metadatos estructurados evitan reintentos inútiles.',
    ],
    rule: 'Sin un flag de reintentable, los agentes malgastan reintentos en errores permanentes.',
  },
  't-structured-errors': {
    scenario:
      'Cuando una tool falla, devuelve la cadena “Error”. El agente o bien reintenta la misma llamada indefinidamente, o bien se rinde y le dice al usuario que no puede ayudarle.',
    ask: '¿Qué debería devolver la tool en su lugar?',
    options: [
      'Un resultado vacío, para que el agente pueda seguir con el resto de la tarea sin quedarse atascado.',
      'Una excepción que detenga el bucle del agente, para que el fallo quede registrado y lo revise una persona.',
      'Marcar isError con una categoría de error, si un reintento podría ayudar y qué debería intentar el agente en su lugar.',
      'El stack trace completo y el payload de la petición, para que el agente tenga todo el detalle que necesita para depurar.',
    ],
    why: [
      'El agente pensará que no hay datos, lo cual es peor que un error.',
      'Termina la conversación en lugar de permitir que se recupere.',
      'Con isError, una categoría (transient, validation, business, permission) e isRetryable, el agente puede reintentar más tarde, pedir un ID válido o tomar otro camino.',
      'Mete ruido y rara vez le dice al agente qué hacer.',
    ],
    rule: 'Los errores son para que el agente actúe: tipo, si es reintentable y siguiente paso.',
  },
  'r-scoped-subagent-tools': {
    scenario:
      'Para simplificar, se dieron las mismas 18 tools a todos los subagentes. Las trazas muestran que el subagente de síntesis lanza sus propias búsquedas web en el 40% de las tareas, lo que añade fuentes que el subagente de búsqueda nunca validó, y los errores de selección de tools han aumentado en los cuatro subagentes.',
    ask: '¿Cuál es el cambio más eficaz?',
    options: [
      'Mantener las 18 tools en todos los subagentes, pero añadir a cada prompt una línea con las tools que debería preferir para su rol.',
      'Sustituir las 18 tools por un único dispatcher run_tool que reciba un nombre de tool y argumentos, para que cada agente vea una sola tool.',
      'Añadir una comprobación del coordinador tras cada ejecución de subagente que descarte los hallazgos obtenidos con tools ajenas al rol de ese agente.',
      'Dar a cada subagente solo las pocas tools que necesita su rol, más una tool verify_fact acotada para que síntesis pueda hacer comprobaciones rápidas.',
    ],
    why: [
      'Las preferencias en el prompt son probabilísticas, y 18 opciones siguen aumentando la complejidad de decisión en cada llamada.',
      'Esconde la misma elección dentro de un argumento y pierde las descripciones de cada tool en las que se apoya el modelo para elegir bien.',
      'Desperdicia el trabajo a posteriori y no impide el mal uso.',
      'Los conjuntos de tools acotados reducen la complejidad de decisión y evitan el mal uso entre roles, mientras que una única tool limitada de otro rol cubre una necesidad frecuente.',
    ],
    rule: 'Cada agente recibe solo las tools de su rol, más alguna acotada de otro rol.',
  },
  'r2-forced-metadata-first': {
    scenario:
      'El subagente de análisis debería llamar a extract_document_metadata (título, autores, fecha de publicación) antes que a extract_claims, para que cada afirmación pueda llevar su fecha. En el 17% de las ejecuciones llama primero a extract_claims y nunca vuelve a los metadatos. El prompt ya indica el orden, y tool_choice es "auto".',
    ask: '¿Cuál es la solución más eficaz?',
    options: [
      'Forzar extract_document_metadata con tool_choice en el primer turno y luego ejecutar extract_claims en los turnos siguientes.',
      'Poner tool_choice a "any" en todos los turnos para que el subagente tenga que llamar siempre a una tool en lugar de responder con texto.',
      'Fusionar ambas tools en una única tool extract_all que devuelva los metadatos y las afirmaciones juntos en un solo objeto grande.',
      'Repetir el orden requerido al final del prompt y añadir dos ejemplos few-shot que muestren primero la extracción de metadatos.',
    ],
    why: [
      'La selección forzada de tool garantiza que una tool concreta se ejecute primero; los pasos posteriores ocurren en los turnos siguientes.',
      'Con "any" se garantiza alguna tool call, pero el modelo elige cuál, así que extract_claims puede seguir yendo primero.',
      'Una tool fusionada es un rediseño mayor que difumina dos contratos claros; forzar la primera llamada arregla el orden directamente.',
      'Más indicaciones en el prompt siguen siendo probabilísticas; el prompt ya indica el orden y aun así se lo salta.',
    ],
    rule: 'Si una tool tiene que ir primero: fuérzala con tool_choice y luego continúa.',
  },
  'r2-load-document-constrained': {
    scenario:
      'El subagente de análisis de documentos usa una tool genérica fetch_url. Las trazas muestran que el 14% de los "documentos" que analiza son páginas de resultados de búsqueda, pantallas de login o páginas de inicio de sitios web, porque sigue cualquier URL que encuentra. Sus análisis de esas páginas producen hallazgos sin ninguna fuente real detrás.',
    ask: '¿Qué cambio lo evita mejor?',
    options: [
      'Añadir una nota al prompt del subagente diciendo que solo debe hacer fetch de URLs que apunten a documentos reales, nunca a otras páginas.',
      'Dar también al subagente las tools de búsqueda web, para que pueda buscar un documento adecuado cuando una página obtenida no sirva.',
      'Sustituir fetch_url por una tool load_document que compruebe que la URL apunta a un tipo de documento soportado antes de cargarlo.',
      'Hacer que el coordinador revise cada hallazgo cuando el subagente termine y descarte los que no tengan un documento como fuente.',
    ],
    why: [
      'Las indicaciones en el prompt son probabilísticas, y la tool genérica sigue aceptando cualquier URL.',
      'Da al subagente tools ajenas a su rol, lo que invita al mal uso entre especializaciones.',
      'Sustituir una tool genérica por una alternativa restringida que valida su entrada elimina el mal uso en el origen.',
      'Detecta el problema cuando el trabajo ya se ha desperdiciado, y el subagente sigue cargando páginas equivocadas.',
    ],
    rule: 'Cambia las tools genéricas por otras restringidas que validen su entrada.',
  },
  'r2-mcp-resource-catalog': {
    scenario:
      'La biblioteca interna de investigación de la empresa contiene unos 4000 informes detrás de un MCP server con las tools list_reports y search_reports. Las trazas muestran que el subagente de análisis gasta entre 12 y 20 llamadas exploratorias por tarea solo para averiguar qué colecciones y años existen antes de leer nada.',
    ask: '¿Qué cambio reduce mejor estas llamadas exploratorias?',
    options: [
      'Subir el tamaño de página de list_reports de 50 a 1000 para que el subagente pueda ver toda la biblioteca en menos llamadas.',
      'Añadir una capa de caché que guarde cada resultado de list_reports para que la exploración repetida en tareas posteriores responda más rápido.',
      'Construir un nuevo MCP server propio con una única tool que devuelva el listado completo de la biblioteca cada vez que se la llame.',
      'Exponer el catálogo de colecciones y años de la biblioteca como un MCP resource para que el agente vea lo que existe sin explorar.',
    ],
    why: [
      'Volcar miles de entradas en el contexto lo satura, y el agente sigue teniendo que explorar para entenderlas.',
      'La caché abarata las mismas llamadas exploratorias pero mantiene el patrón; el agente sigue sin una visión general.',
      'Un listado completo en cada llamada es enorme y caro, y un servidor nuevo cuesta más esfuerzo que exponer un catálogo.',
      'Los MCP resources exponen catálogos de contenido y dan a los agentes visibilidad de los datos disponibles sin llamadas exploratorias a tools.',
    ],
    rule: 'Expón los catálogos de contenido como MCP resources para evitar llamadas exploratorias.',
  },
  'r2-grep-vs-glob-corpus': {
    scenario:
      'El subagente de análisis trabaja sobre un corpus local de 2300 ficheros Markdown convertidos desde PDF. Cuando se le pidió encontrar todos los documentos que mencionan el "Reglamento 2023/1115", ejecutó Glob con el patrón "**/*2023*1115*" y encontró 2 ficheros. Una revisión manual encuentra 19 documentos que citan el reglamento.',
    ask: '¿Qué debería haber hecho el subagente?',
    options: [
      'Ejecutar Glob con un patrón más amplio como "**/*2023*" y luego hacer Read de cada fichero coincidente para ver si menciona el reglamento.',
      'Usar Grep para buscar el número del reglamento en el contenido de los ficheros y luego hacer Read solo de los que coincidan para analizar cada mención.',
      'Cargar primero en contexto los 2300 ficheros con Read y luego recorrerlos buscando el reglamento para que no se escape ninguna mención a una tool de búsqueda.',
      'Usar Bash para listar todos los nombres de fichero del corpus y pedir al modelo que juzgue qué nombres sugieren que se menciona el reglamento.',
    ],
    why: [
      'Glob compara rutas de ficheros, no su contenido, así que un patrón de nombre más amplio sigue perdiendo documentos cuyo nombre no lleva el año.',
      'Grep busca un patrón en el contenido de los ficheros, y después Read carga solo los relevantes, construyendo la comprensión de forma incremental.',
      'Leerlo todo de entrada agota el contexto mucho antes de llegar a 2300 ficheros y pierde detalle en la parte central.',
      'Los nombres de fichero dicen poco del contenido; sigue siendo comparación de rutas, solo que menos fiable.',
    ],
    rule: 'Busca texto dentro de ficheros con Grep; busca ficheros por nombre con Glob.',
  },
  'a-subagent-transcripts': {
    scenario:
      'Un orquestador lanza 10 subagentes de investigación en paralelo. Cada uno devuelve su transcripción completa (búsquedas, páginas leídas, razonamiento). La síntesis final va a peor: mezcla datos, olvida hallazgos iniciales y a veces se corta.',
    ask: '¿Qué debería cambiar el arquitecto?',
    options: [
      'Dar al orquestador un modelo con una ventana de contexto mayor para que las diez transcripciones quepan con margen.',
      'Reducir a 3 subagentes y dar a cada uno un área de investigación más amplia para que el volumen total siga siendo manejable.',
      'Hacer que cada subagente devuelva un resultado condensado y estructurado con sus hallazgos, fuentes y nivel de confianza.',
      'Ejecutar los subagentes de forma secuencial para que el orquestador digiera cada transcripción antes de que llegue la siguiente.',
    ],
    why: [
      'Retrasa el problema. Diez transcripciones siguen siendo sobre todo ruido, y el centro de un contexto largo recibe menos atención.',
      'Trata el síntoma reduciendo el alcance de la investigación.',
      'Los subagentes existen para aislar contexto: hacen el trabajo sucio en su propia ventana y devuelven solo lo que importa.',
      'El contexto acumulado es el mismo, y además es más lento.',
    ],
    rule: 'Los subagentes devuelven resultados destilados, nunca su transcripción completa.',
  },
  'r2-lost-in-middle-aggregation': {
    scenario:
      'El coordinador pasa a síntesis las salidas de 10 subagentes como un único bloque largo, en el orden en que terminaron. Las revisiones muestran que los hallazgos de las salidas 4 a 7 faltan en el 38% de los informes, mientras que la primera y la última salida casi siempre se cubren. Cada salida por separado es precisa y está bien citada.',
    ask: '¿Cuál es el cambio más eficaz?',
    options: [
      'Abrir la entrada agregada con un resumen de hallazgos clave y dar a la salida detallada de cada subagente su propio encabezado de sección claro.',
      'Ejecutar la síntesis con un modelo con una ventana de contexto mayor para que las 10 salidas quepan cómodamente y con mucho margen de sobra.',
      'Barajar el orden de las salidas de los subagentes en cada ejecución para que ningún subtema quede siempre atrapado en el medio de la entrada.',
      'Pedir a los subagentes que hagan sus hallazgos más largos y detallados para que las salidas del medio tengan más peso en la síntesis.',
    ],
    why: [
      'Poner primero un resumen de hallazgos clave y organizar los detalles bajo encabezados explícitos mitiga el efecto lost-in-the-middle.',
      'La entrada ya cabe; una ventana mayor no cambia cómo cae la atención en el medio de las entradas largas.',
      'Barajar solo cambia qué hallazgos se pierden: las omisiones pasan a ser aleatorias en lugar de corregirse.',
      'Entradas más largas agrandan el medio y empeoran el efecto.',
    ],
    rule: 'Hallazgos clave primero y encabezados de sección claros: así se combate el lost-in-the-middle.',
  },
  'r2-summarization-loses-figures': {
    scenario:
      'En las ejecuciones largas, el coordinador comprime su historial en un resumen cada 15 turnos. Un subagente informó de "4200 M$ en 2023, CAGR del 11,3%, según la AIE (mayo de 2024)"; tras dos pasadas de resumen, las notas del coordinador dicen "el mercado es grande y crece rápido", y los informes finales no tienen cifras en el 23% de los temas.',
    ask: '¿Cuál es la solución más eficaz?',
    options: [
      'Resumir con menos frecuencia, cada 30 turnos en lugar de cada 15, para que las cifras clave sobrevivan más tiempo antes de condensarse.',
      'Hacer que el subagente de generación de informes busque al final las cifras de mercado actuales para rellenar los números que falten.',
      'Mantener los datos clave, como cifras, fechas y sus fuentes, en un bloque persistente que se envía con cada prompt y nunca se resume.',
      'Cambiar el coordinador a un modelo con una ventana de contexto mayor para que el historial no tenga que resumirse nunca.',
    ],
    why: [
      'Menos pasadas retrasan la pérdida, pero no la evitan; cada resumen sigue comprimiendo los números en frases vagas.',
      'Volver a buscar añade latencia y puede citar fuentes distintas de las que se analizaron originalmente.',
      'El resumen progresivo difumina números y fechas; un bloque persistente de datos fuera del historial resumido los conserva exactos.',
      'Una ventana mayor aplaza el problema en las ejecuciones largas y no hace nada por la atención a detalles enterrados en un historial largo.',
    ],
    rule: 'Guarda las cifras exactas en un bloque persistente de datos, fuera de los resúmenes.',
  },
  'r2-ambiguous-entity-clarify': {
    scenario:
      'Un cliente pide "un análisis competitivo del crecimiento de Apollo desde 2022". El subagente de búsqueda encuentra tres empresas llamadas Apollo (gestión de activos, healthtech y una startup SaaS). El coordinador eligió la que tenía más resultados de búsqueda; en peticiones similares del mes pasado, 3 de 11 informes trataron la empresa equivocada.',
    ask: '¿Cuál es el cambio más eficaz?',
    options: [
      'Elegir la empresa con más ingresos o mayor valor de mercado, ya que las grandes empresas son el tema más probable de las peticiones de clientes.',
      'Investigar a fondo las tres empresas y entregar un único informe combinado con una sección separada para cada una de ellas.',
      'Hacer que el coordinador puntúe su confianza en la coincidencia y continúe solo cuando esa puntuación autoevaluada supere 0,8.',
      'Cuando una entidad coincida con más de una empresa, pedir al cliente un identificador, como el sector o el ticker, antes de investigar.',
    ],
    why: [
      'Es otra heurística; el coordinador sigue adivinando, solo que con una regla distinta.',
      'Triplica el coste y deja que el cliente busque la sección correcta, todo por no hacer una pregunta de una línea.',
      'La confianza autoevaluada está mal calibrada; el coordinador ya estaba seguro de sus elecciones erróneas.',
      'Varias coincidencias exigen pedir un identificador adicional en lugar de elegir por heurística.',
    ],
    rule: 'Varias coincidencias: pide un identificador, no elijas por heurística.',
  },
  'r-timeout-vs-empty-result': {
    scenario:
      'Cuando la base de datos académica da timeout, el subagente de análisis de documentos devuelve {"status": "ok", "results": []}, la misma respuesta que una consulta sin coincidencias. La semana pasada el coordinador informó de 60 huecos de "no se encontró literatura"; 41 de ellos eran en realidad timeouts.',
    ask: '¿Cuál es el cambio más eficaz?',
    options: [
      'Reintentar los fallos transitorios en el subagente y luego notificar los no resueltos como errores con tipo de fallo, consulta y resultados parciales.',
      'Hacer que el coordinador vuelva a pasar cada resultado vacío por una segunda consulta, ya que cualquiera podría ocultar una búsqueda fallida.',
      'Tratar los resultados vacíos como errores fatales que detienen toda la ejecución para que el equipo investigue el problema de la base de datos.',
      'Devolver "búsqueda no disponible" tanto para los timeouts como para las consultas sin coincidencias, para que el coordinador trate igual ambos casos.',
    ],
    why: [
      'La recuperación local gestiona los problemas transitorios; lo que no se resuelve sube con contexto estructurado, así que los fallos de acceso no se confunden con resultados vacíos válidos.',
      'Duplica el trabajo para los resultados vacíos reales y sigue sin poder distinguir los dos casos.',
      'Un resultado vacío es un desenlace válido, y terminar todo el flujo por un único fallo es un antipatrón.',
      'Un estado genérico oculta justo la diferencia que el coordinador necesita para decidir cómo recuperarse.',
    ],
    rule: 'Separa los fallos de acceso de los resultados vacíos válidos; informa de los errores con contexto.',
  },
  'r2-coverage-annotations': {
    scenario:
      'En un informe sobre los riesgos de la eólica marina, las fuentes clave de dos de los seis subtemas (permisos y conexión a la red) dieron timeout, incluso tras reintentos locales y una nueva delegación específica. La síntesis escribió las otras cuatro secciones y el informe parece completo; un cliente concluyó que no había riesgos de permisos.',
    ask: '¿Qué cambio lo evita mejor?',
    options: [
      'Abortar y descartar todo el informe cuando falle cualquier subtema, y repetir la investigación completa más tarde cuando respondan todas las fuentes.',
      'Hacer que la síntesis rellene los subtemas fallidos con el conocimiento general del modelo para que todas las secciones del informe tengan contenido.',
      'Hacer que la síntesis anote la cobertura, marcando los hallazgos bien respaldados y nombrando los subtemas con huecos por fuentes no disponibles.',
      'Quitar los subtemas fallidos del índice del informe para que los lectores solo vean secciones respaldadas por fuentes verificadas.',
    ],
    why: [
      'Terminar todo el flujo por un único fallo es un antipatrón, y se pierden cuatro secciones de buena investigación.',
      'El contenido sin fuentes incumple el requisito de informe con citas y oculta el hueco al lector.',
      'Las anotaciones de cobertura muestran qué áreas están bien respaldadas y cuáles tienen huecos, para que la falta de evidencia no se lea como "sin riesgo".',
      'Quitar las secciones en silencio es la misma supresión que engañó al cliente.',
    ],
    rule: 'Anota los huecos de cobertura en la síntesis; que un hueco nunca parezca algo completo.',
  },
  'r2-manifest-crash-recovery': {
    scenario:
      'Las ejecuciones de investigación profunda duran unas 3 horas con 12 subagentes. La semana pasada, un reinicio del host del coordinador en la marca de 2h40m obligó a empezar de cero tres ejecuciones, porque el progreso de cada subagente solo existía en su propio contexto. Cada reinicio repite unas 3 horas de trabajo.',
    ask: '¿Qué diseño facilita mejor la recuperación?',
    options: [
      'Usar --resume en la sesión del coordinador tras el reinicio para que continúe la ejecución desde donde se detuvo su conversación.',
      'Hacer que cada agente exporte su estado a una ubicación conocida, y que el coordinador cargue un manifest al reiniciar y lo inyecte en los prompts.',
      'Mover el trabajo de los 12 subagentes al propio contexto del coordinador para que una sola sesión guardada contenga el progreso de todos los agentes.',
      'Aumentar el timeout de reinicio de los hosts y añadir alertas de monitorización para que las caídas durante las ejecuciones largas sean menos frecuentes.',
    ],
    why: [
      'Reanudar solo restaura la conversación del coordinador; el trabajo en curso dentro de los contextos aislados de los subagentes se sigue perdiendo.',
      'Las exportaciones de estado estructuradas más un manifest cargado al reanudar permiten al coordinador restaurar el progreso y volver a darle el contexto a cada agente.',
      'Elimina el aislamiento de contexto que hace útiles a los subagentes y satura la ventana del coordinador.',
      'Menos caídas ayudan, pero cuando ocurre una la ejecución sigue perdiéndolo todo; no hay vía de recuperación.',
    ],
    rule: 'Ejecuciones multiagente largas: exporta el estado de los agentes y reanuda desde un manifest.',
  },
  'r2-accuracy-by-segment': {
    scenario:
      'Las comprobaciones de citas muestran que el 97% de las afirmaciones de los informes de alta confianza están bien respaldadas, así que el equipo planea eliminar la revisión humana en ellos. Después, la comprobación puntual de un revisor encontró que 6 de 20 estadísticas sacadas de informes financieros oficiales estaban mal citadas, mientras que las afirmaciones de prensa y académicas eran casi perfectas. No existe ningún desglose por fuente ni por tipo de afirmación.',
    ask: '¿Cuál es el siguiente paso más eficaz?',
    options: [
      'Medir la precisión por tipo de fuente y tipo de afirmación antes de recortar la revisión, y mantener un muestreo estratificado de las afirmaciones de alta confianza.',
      'Eliminar la revisión de los informes de alta confianza según lo previsto, ya que un 97% de precisión global está muy por encima del umbral objetivo del equipo.',
      'Mantener indefinidamente la revisión humana completa de todos los informes, porque cualquier comprobación automática de citas puede pasar por alto errores sutiles.',
      'Subir de 0,8 a 0,95 el umbral de confianza para saltarse la revisión en todos los informes y, por lo demás, mantener el plan sin cambios.',
    ],
    why: [
      'La precisión agregada puede ocultar segmentos débiles; valida primero por segmento y luego mantén un muestreo estratificado para medir errores y detectar patrones nuevos.',
      'La media del 97% enmascara un segmento débil; la comprobación puntual ya muestra que las estadísticas financieras fallan mucho más a menudo.',
      'Corrige en exceso: los datos permiten automatizar los segmentos fuertes una vez verificados, manteniendo a personas donde se concentran los errores.',
      'Un umbral global más alto no está calibrado por segmento, sigue mezclando segmentos fuertes y débiles y puede recortar informes que están bien.',
    ],
    rule: 'Comprueba la precisión por segmento antes de fiarte de una cifra agregada.',
  },
  'a-conflicting-data': {
    scenario:
      'En un sistema de investigación multiagente, dos subagentes dan tamaños de mercado distintos para el mismo segmento (2100 M$ frente a 3400 M$). El orquestador elige uno en silencio, y más tarde los usuarios descubren la discrepancia.',
    ask: '¿Cuál es la solución más adecuada?',
    options: [
      'Hacer que el orquestador promedie las cifras en conflicto e indique que el dato es una estimación.',
      'Volver a ejecutar ambos subagentes con instrucciones más estrictas hasta que sus cifras coincidan con un margen del 10%.',
      'Exigir fuente y fecha con cada cifra, y que el orquestador señale los conflictos de forma explícita en el informe.',
      'Descartar cualquier cifra en la que discrepen dos subagentes, para que el informe final solo contenga datos confirmados.',
    ],
    why: [
      'Produce un número que nadie ha publicado.',
      'Malgasta tokens; coincidir a base de repetir no es evidencia.',
      'La procedencia permite resolver con una regla clara (más reciente, más autorizada) o mostrar el conflicto al usuario con honestidad.',
      'Tira información que el usuario puede necesitar.',
    ],
    rule: 'Arrastra la procedencia por todo el pipeline; saca a la luz los conflictos, no los escondas.',
  },
  'r-claim-source-mappings': {
    scenario:
      'Los subagentes de búsqueda devuelven resúmenes en prosa como "Varios estudios muestran que la adopción creció con fuerza en 2023." En una auditoría de 120 afirmaciones de informes finales, el 34% no tenía cita o citaba la fuente equivocada. El agente de síntesis no puede saber qué fuente respalda cada afirmación.',
    ask: '¿Cuál es la solución más eficaz?',
    options: [
      'Hacer que el subagente de informes busque en la web, al final, cada afirmación sin cita y adjunte la primera fuente que la respalde.',
      'Hacer que el subagente de informes añada una bibliografía estructurada con todas las URLs que visitaron los subagentes de búsqueda para el tema.',
      'Exigir a los subagentes que devuelvan mapeos afirmación-fuente (afirmación, URL o documento fuente, extracto, fecha) que la síntesis debe conservar.',
      'Pasar al agente de síntesis el texto completo en bruto de cada fuente para que pueda deducir qué fuente respalda cada afirmación.',
    ],
    why: [
      'Buscar citas a posteriori puede asignar una fuente que nunca fue la base de la afirmación, y además añade latencia.',
      'Una lista de fuentes no dice qué afirmación respalda cada una, así que se sigue perdiendo la atribución por afirmación.',
      'La atribución se pierde cuando los hallazgos se comprimen sin vínculos afirmación-fuente; los mapeos estructurados que se conservan durante la síntesis hacen trazable cada afirmación.',
      'Satura el contexto y deja la atribución a la inferencia, con riesgo de lost-in-the-middle.',
    ],
    rule: 'Pasa mapeos afirmación-fuente a las etapas siguientes; los resúmenes en prosa pierden la atribución.',
  },
  'r-conflicting-statistics': {
    scenario:
      'Dos fuentes creíbles dan tasas distintas de reciclaje de residuos electrónicos en 2024: 22,3% (un informe de la ONU) y 17,4% (una encuesta del sector con una definición más estrecha). El informe final dice "alrededor del 20%" sin cita; en otras ejecuciones, el agente de síntesis se queda en silencio con uno de los dos valores.',
    ask: '¿Qué enfoque lo gestiona mejor?',
    options: [
      'Hacer que el agente de síntesis se quede con el valor de la fuente de mayor autoridad y cite solo esa fuente en el informe.',
      'Dar ambos valores, cada uno atribuido a su fuente y su método, y colocar la cifra en una sección de hallazgos discutidos.',
      'Promediar las dos cifras y citar ambas fuentes, para que los lectores tengan un número claro respaldado por toda la evidencia disponible.',
      'Eliminar cualquier estadística en la que discrepen las fuentes, para que el informe solo incluya cifras en las que coincidan todas las fuentes creíbles.',
    ],
    why: [
      'Elegir un valor de forma arbitraria oculta un desacuerdo real y pierde información que el lector necesita.',
      'Los conflictos entre fuentes creíbles se anotan con su atribución y su contexto metodológico, separando los hallazgos discutidos de los bien establecidos.',
      'La media es un número que ninguna de las fuentes dio, y las citas tergiversarían a ambas.',
      'Eliminar la evidencia discutida deja huecos y oculta hallazgos relevantes.',
    ],
    rule: 'Fuentes creíbles en conflicto: conserva ambos valores, cada uno con su atribución.',
  },
  'r2-publication-dates-temporal': {
    scenario:
      'Los informes sobre adopción de renovables siguen marcando "fuentes en conflicto": una fuente dice que la solar aportó el 4,5% de la electricidad del país y otra dice que el 8,9%. La investigación muestra que la primera cifra se basa en datos de 2021 y la segunda en datos de 2024. Las salidas de los subagentes incluyen cada afirmación y la URL de su fuente, pero no fechas.',
    ask: '¿Cuál es la solución más eficaz?',
    options: [
      'Quedarse solo con la fuente publicada más recientemente para cada estadística y eliminar por completo del informe la más antigua.',
      'Colocar cada estadística marcada en una sección de hallazgos discutidos que muestre ambos valores, cada uno atribuido a su fuente.',
      'Hacer que la síntesis deduzca el año de cada cifra a partir de la redacción de su extracto antes de decidir si dos valores están en conflicto.',
      'Exigir a los subagentes fechas de publicación y de recogida de datos en cada afirmación, para que la síntesis pueda interpretar el cambio.',
    ],
    why: [
      'Tira la tendencia, y la publicación más reciente no siempre es la que tiene los datos más recientes.',
      'Ambos valores son correctos para años distintos; etiquetar una tendencia como discutida confunde a los lectores sobre la evidencia.',
      'Inferir a partir de la redacción no es fiable cuando muchos extractos nunca indican su año; las fechas estructuradas lo hacen explícito.',
      'Las fechas de publicación y de recogida en salidas estructuradas permiten a la síntesis leer una diferencia temporal como un cambio a lo largo del tiempo, no como una contradicción.',
    ],
    rule: 'Arrastra las fechas de publicación y de los datos para que las diferencias temporales no se lean como conflictos.',
  },
  'd2-loop-missing-tool-results': {
    scenario:
      'Tu agente prototipo usa un bucle escrito a mano sobre la API de Claude. Cuando stop_reason es "tool_use", ejecuta las tools solicitadas y escribe su salida en un log de depuración, y luego envía la siguiente petición añadiendo al historial solo el texto del assistant. Las trazas muestran que el agente lanza la misma llamada a Grep de 6 a 8 veces seguidas y nunca llega a responder.',
    ask: '¿Cuál es la causa raíz más probable?',
    options: [
      'El bucle no tiene límite de iteraciones, así que nada detiene al modelo cuando empieza a repetir una llamada que ya ha tenido éxito.',
      'Los resultados de las tools nunca se añaden a la conversación, así que en cada iteración el modelo no sabe que el Grep ya se ejecutó.',
      'La descripción de la tool Grep no dice que sus resultados son definitivos, así que el modelo repite la llamada para volver a comprobarlos.',
      'El system prompt nunca le dice al agente que responda en cuanto tenga información suficiente, así que sigue buscando en su lugar.',
    ],
    why: [
      'Un límite ocultaría el síntoma cortando el bucle, pero el modelo seguiría trabajando sin los resultados que pidió.',
      'Las llamadas a tools y sus bloques tool_result deben añadirse al historial de la conversación para que el modelo pueda razonar sobre los resultados en la siguiente iteración.',
      'El modelo no desconfía de los resultados; nunca los recibe, así que sigue pidiendo la misma información.',
      'Ninguna instrucción puede hacer que el modelo use resultados que nunca ve; el paso que falta está en el código del bucle, no en el prompt.',
    ],
    rule: 'Añade cada resultado de tool al historial antes de la siguiente petición.',
  },
  'd2-coordinator-dynamic-selection': {
    scenario:
      'El coordinador de tu asistente de codebase pasa cada pregunta por cuatro subagentes en orden: mapeador de dependencias, analizador de tests, escáner de seguridad y redactor de documentación. Una pregunta como "¿qué devuelve parse_sku()?" tarda 4 minutos y cuesta lo mismo que una auditoría completa de un módulo, así que los ingenieros han dejado de usarlo para preguntas rápidas.',
    ask: '¿Cuál es el cambio más eficaz?',
    options: [
      'Fusionar los cuatro subagentes en un único agente con todas sus tools, para que cada pregunta necesite una sola ejecución de agente.',
      'Ejecutar los cuatro subagentes en paralelo en lugar de en secuencia, para que las preguntas rápidas terminen en una cuarta parte del tiempo.',
      'Poner delante del coordinador un router por palabras clave que envíe directamente al redactor de documentación cualquier pregunta que contenga un nombre de función.',
      'Hacer que el coordinador analice cada pregunta e invoque solo los subagentes que necesita, usando el pipeline completo para peticiones amplias.',
    ],
    why: [
      'Un único agente con todas las tools empeora la selección de tools y pierde la especialización que aportan los subagentes.',
      'El paralelismo reduce la latencia, pero cada pregunta rápida sigue pagando el trabajo de cuatro subagentes, en su mayoría irrelevante.',
      'El enrutado por palabras clave es frágil y se salta la comprensión que el coordinador tiene de la pregunta, así que es probable que haya enrutados erróneos.',
      'Un coordinador debe analizar lo que requiere cada consulta y seleccionar los subagentes dinámicamente, en lugar de pasar siempre por el pipeline completo.',
    ],
    rule: 'El coordinador invoca solo los subagentes que cada consulta necesita de verdad.',
  },
  'd2-allowedtools-missing-task': {
    scenario:
      'Has definido tres AgentDefinitions (dependency-mapper, test-writer y doc-writer), cada una con una descripción clara de cuándo usarla, y se las has pasado al coordinador, configurado con allowedTools: ["Read", "Grep", "Glob", "Bash"]. Las trazas muestran que nunca delega: lo explora todo él mismo y se queda sin contexto en repos grandes.',
    ask: '¿Cuál es la causa raíz más probable?',
    options: [
      'Las descripciones no dicen cuándo delegar, así que el coordinador considera cada vez que es más sencillo hacer el trabajo él mismo.',
      'allowedTools no incluye "Task", así que el coordinador no tiene forma de lanzar los subagentes que se han definido para él.',
      'Las AgentDefinitions también deben listarse en .mcp.json, porque los subagentes se descubren como los MCP servers, al conectar.',
      'La ventana de contexto es demasiado pequeña para contener tres AgentDefinitions más los ficheros del repositorio, así que el coordinador las omite.',
    ],
    why: [
      'Las descripciones vagas provocan malas decisiones de delegación, pero estas descripciones son claras y la delegación no llega a producirse nunca.',
      'La tool Task es la forma en que un coordinador lanza subagentes, así que allowedTools debe incluir "Task"; sin ella, delegar es imposible.',
      'Los subagentes se configuran como AgentDefinitions y se lanzan con Task; .mcp.json configura MCP servers, no subagentes.',
      'Las AgentDefinitions son pequeñas, y una ventana mayor no le daría al coordinador una tool que no tiene.',
    ],
    rule: 'Un coordinador solo puede delegar si su allowedTools incluye "Task".',
  },
  'd2-subagent-missing-findings': {
    scenario:
      'El coordinador averiguó que todo el acceso a base de datos del módulo legacy de reembolsos pasa por LegacyRepo y que los tests deben usar el FakeLedger en memoria. Después lanzó un subagente test-writer con el prompt "Escribe tests para el módulo de reembolsos siguiendo las convenciones que encontramos." Los tests abren conexiones reales a la base de datos.',
    ask: '¿Cuál es la causa raíz más probable?',
    options: [
      'El prompt no incluía los hallazgos, y los subagentes no heredan la conversación del coordinador, así que nunca llegó a conocerlos.',
      'El test-writer no tiene la tool Grep, así que no pudo buscar LegacyRepo y FakeLedger en el módulo antes de escribir.',
      'Se lanzó en paralelo con otros subagentes, y las llamadas Task en paralelo solo reciben una copia truncada del historial del coordinador.',
      'Su AgentDefinition no tiene system prompt, así que recurrió a hábitos genéricos de testing en lugar de a las convenciones de la sesión.',
    ],
    why: [
      'Los subagentes se ejecutan con un contexto aislado, así que los hallazgos deben pasarse explícitamente en el prompt; "las convenciones que encontramos" no apunta a nada que puedan ver.',
      'Incluso con Grep, el subagente no sabría qué convenciones buscar; el coordinador ya tenía la respuesta y no se la pasó.',
      'Las llamadas Task, en paralelo o no, no pasan ningún historial de conversación; no existe ningún mecanismo de copia truncada.',
      'Un system prompt define el rol del subagente, pero no puede contener convenciones descubiertas en esta sesión; esas van en el prompt de la tarea.',
    ],
    rule: 'Los subagentes solo ven su prompt: pásales los hallazgos explícitamente en él.',
  },
  'd2-tests-before-pr-gate': {
    scenario:
      'Tu agente automatiza las actualizaciones de dependencias: actualiza el lockfile, ejecuta la suite de tests con run_tests y luego abre un PR con create_pull_request. El system prompt dice que los tests deben pasar primero, pero el 5% de sus PRs se abren sin ninguna ejecución de tests, y dos de ellos rompieron main tras un merge apresurado.',
    ask: '¿Cuál es la solución más eficaz?',
    options: [
      'Añadir un hook que se ejecute después de create_pull_request, busque un resultado de run_tests en verde y cierre el PR si no lo encuentra.',
      'Repetir la regla en mayúsculas al final del system prompt y añadir tres ejemplos few-shot que ejecuten los tests primero.',
      'Bloquear create_pull_request de forma programática hasta que run_tests haya devuelto un resultado en verde para el commit actual.',
      'Añadir un segundo agente que lea la descripción de cada PR nuevo y deje un comentario cuando no mencione una ejecución de tests.',
    ],
    why: [
      'Cerrar los PRs después de abrirlos genera ruido y deja una ventana en la que se pueden mergear; el prerrequisito debería bloquear la llamada antes de que ocurra.',
      'Las instrucciones del prompt por sí solas tienen una tasa de fallo distinta de cero; aun con una redacción más contundente y ejemplos, algunos PRs se seguirán abriendo sin tests.',
      'Un prerrequisito programático garantiza que el paso obligatorio se ha completado antes de permitir que se ejecute la llamada posterior.',
      'Un agente revisor es probabilístico y actúa cuando el PR ya existe; además, revisa la descripción, no si los tests se ejecutaron de verdad.',
    ],
    rule: '¿Orden de pasos obligatorio? Imponlo con una puerta de prerrequisito programática.',
  },
  'd2-bash-interception-hook': {
    scenario:
      'Los ingenieros dejan que el agente use Bash para tests y builds. Dos veces este trimestre ha ejecutado git push --force sobre una rama compartida mientras "limpiaba" el historial, pese a una regla del system prompt que lo prohíbe. El equipo sigue necesitando Bash para ejecutar tests, builds y comandos git normales.',
    ask: '¿Qué enfoque lo evita mejor sin que el agente deje de ser útil?',
    options: [
      'Eliminar Bash por completo y añadir tools MCP para ejecutar tests y builds, para que el agente nunca pueda llegar a git desde una shell.',
      'Añadir un hook que intercepte las llamadas a Bash antes de ejecutarse, bloquee los force push y pida al agente que abra un PR en su lugar.',
      'Añadir un hook PostToolUse que detecte un force push en la salida de Bash y avise al equipo para que pueda restaurar la rama rápidamente.',
      'Mover la regla al principio del system prompt y añadir ejemplos few-shot en los que el agente se niega a hacer force push aunque lo presionen.',
    ],
    why: [
      'Esto elimina una tool que el equipo necesita, y cada comando de git o de build requeriría ahora su propia tool a medida.',
      'Los hooks que interceptan las llamadas a tools aplican reglas de forma determinista antes de la ejecución y pueden redirigir al agente a un flujo permitido.',
      'Un hook PostToolUse se ejecuta después del comando, cuando la rama compartida ya se ha sobrescrito.',
      'La regla en el prompt ya existe y ha fallado; las instrucciones del prompt dan un cumplimiento probabilístico, no una garantía.',
    ],
    rule: 'Bloquea las acciones prohibidas con un hook antes de que se ejecuten, no con una regla en el prompt.',
  },
  'd-chain-vs-dynamic': {
    scenario:
      'Estás automatizando dos trabajos. El trabajo A se ejecuta cada semana: revisar en cada módulo las mismas tres cosas (docstrings, una sección en el README y una entrada en el changelog). El trabajo B: averiguar por qué un job nocturno legacy a veces cobra dos veces a los clientes, un bug que nadie ha conseguido reproducir.',
    ask: '¿Qué estrategia de descomposición encaja con cada trabajo?',
    options: [
      'Descomposición dinámica adaptativa para ambos, ya que generar subtareas a partir de los hallazgos es lo que mejor funciona con cualquier tipo de flujo.',
      'Una cadena de prompts fija para ambos, ya que los pasos predefinidos son más fáciles de testear y dan la misma estructura en cada ejecución.',
      'Descomposición dinámica para el trabajo A, ya que los módulos son distintos, y una cadena fija para el trabajo B para que la investigación no se disperse.',
      'Una cadena de prompts fija para el trabajo A, y para el trabajo B una descomposición dinámica que genere subtareas a partir de lo que descubra.',
    ],
    why: [
      'El trabajo A es predecible y repetitivo; la planificación dinámica añade coste y variabilidad donde los pasos fijos funcionan bien.',
      'El trabajo B es abierto; los pasos fijos no pueden seguir pistas que solo aparecen durante la investigación.',
      'Esto invierte el encaje: la revisión predecible recibe el patrón adaptativo y la investigación abierta recibe pasos fijos.',
      'El prompt chaining encaja con revisiones predecibles de varios aspectos; las investigaciones abiertas necesitan planes que se adapten a los hallazgos intermedios.',
    ],
    rule: 'Revisión predecible de varios aspectos: cadena de prompts. Investigación abierta: plan dinámico.',
  },
  'd-legacy-tests-decomposition': {
    scenario:
      'Un ingeniero le pide al agente que "añada tests exhaustivos al servicio legacy de facturación" (400 ficheros, casi sin tests). En el primer intento escribió tests fichero a fichero por orden alfabético y gastó casi todo su presupuesto en utilidades de strings, dejando sin testear el cálculo de pagos y los flujos de reembolso.',
    ask: '¿Cuál es la forma más eficaz de descomponer esta tarea?',
    options: [
      'Usar una cadena de prompts fija que genere tests para cada fichero por turnos y luego haga una pasada final que compruebe las cifras de cobertura.',
      'Dividir los 400 ficheros en lotes iguales por directorio y dar cada lote a un subagente en paralelo con las mismas instrucciones.',
      'Mapear primero la estructura y localizar las áreas de mayor impacto, y luego crear un plan priorizado que se adapte según aparezcan dependencias.',
      'Pedir al ingeniero que liste los ficheros exactos que hay que testear por orden de importancia, y que el agente siga esa lista al pie de la letra.',
    ],
    why: [
      'Una cadena fija por fichero sirve para revisiones predecibles, no para trabajo abierto; repite la misma ordenación de poco valor.',
      'Los lotes iguales reparten el esfuerzo de forma uniforme en lugar de centrarlo en el código de alto impacto, así que los ficheros triviales siguen recibiendo la misma atención.',
      'Las tareas abiertas necesitan descomposición dinámica: mapear el código, priorizar lo que importa y adaptar el plan a medida que aprendes.',
      'Esto traslada el análisis al ingeniero, y una lista fija no puede adaptarse cuando se descubren dependencias ocultas.',
    ],
    rule: 'Tarea abierta: mapea el código, prioriza y adapta el plan a medida que aprendes.',
  },
  'd-resume-changed-files': {
    scenario:
      'Ayer una ingeniera ejecutó una sesión con nombre, auth-audit, en la que el agente analizó 30 ficheros del módulo de autenticación. Durante la noche, un compañero mergeó un refactor que cambió 3 de esos ficheros. La mayor parte del análisis de ayer sigue siendo válido, y ella quiere continuar hoy.',
    ask: '¿Cuál es la forma más eficaz de continuar?',
    options: [
      'Reanudar con --resume auth-audit e indicarle al agente qué 3 ficheros cambiaron para que vuelva a analizar específicamente esos ficheros.',
      'Reanudar con --resume auth-audit y seguir como siempre, ya que el agente notará los cambios cuando los necesite.',
      'Empezar una sesión nueva y hacer que el agente vuelva a explorar los 30 ficheros, para que todas las conclusiones se basen en el código actual.',
      'Usar fork_session sobre auth-audit para crear una nueva rama, que refresca automáticamente los resultados de tools de los ficheros cambiados.',
    ],
    why: [
      'Cuando el contexto previo es mayormente válido, reanudar funciona; nombrar los ficheros cambiados permite volver a analizarlos de forma dirigida.',
      'La sesión reanudada contiene resultados de tools obsoletos para 3 ficheros y puede razonar a partir de ellos sin volver a leerlos.',
      'Volver a explorarlo todo tira a la basura el análisis aún válido de 27 ficheros; empezar de cero conviene cuando el contexto está mayormente obsoleto.',
      'fork_session crea una rama independiente a partir de la misma base; no refresca los resultados de tools obsoletos.',
    ],
    rule: 'Reanuda cuando el contexto sea mayormente válido, e indica qué ficheros han cambiado.',
  },
  'd2-fresh-session-after-rewrite': {
    scenario:
      'Hace tres semanas, una sesión con nombre, ledger-map, analizó el módulo ledger. Desde entonces el módulo se ha reescrito: el 70% de sus ficheros han cambiado y dos clases principales se han renombrado. Al reanudarla hoy, el agente describe rutas de llamada a través de clases que ya no existen. Varias decisiones de diseño de esa sesión siguen siendo válidas.',
    ask: '¿Cuál es la forma más eficaz de continuar el trabajo?',
    options: [
      'Empezar una sesión nueva con un resumen estructurado de los hallazgos y decisiones previos, y luego volver a explorar el código actual.',
      'Usar fork_session sobre ledger-map, para que la nueva rama obtenga resultados de tools frescos mientras la sesión original queda intacta.',
      'Reanudar ledger-map e indicarle al agente qué ficheros cambiaron, para que vuelva a leerlos y actualice sus conclusiones anteriores.',
      'Reanudar ledger-map con un modelo con una ventana de contexto mayor, para poder comparar lado a lado la versión antigua y la nueva de cada fichero.',
    ],
    why: [
      'Cuando la mayoría de los resultados de tools previos están obsoletos, una sesión nueva alimentada con un resumen estructurado es más fiable que reanudar.',
      'fork_session parte de la misma base obsoleta; no refresca ningún resultado de tools.',
      'Volver a analizar de forma dirigida funciona cuando el contexto previo es mayormente válido; con el 70% de los ficheros cambiados, los resultados de tools obsoletos dominarían la sesión.',
      'Una ventana mayor mantiene en juego los resultados obsoletos; el problema es un contexto desactualizado, no la falta de espacio.',
    ],
    rule: 'Contexto mayormente obsoleto: empieza de cero con un resumen estructurado en lugar de reanudar.',
  },
  'd2-resume-named-session': {
    scenario:
      'Una ingeniera lleva dos investigaciones largas en paralelo: billing-trace y auth-audit. Cada mañana reabre su sesión más reciente, y dos veces esta semana ha acabado en auth-audit cuando quería continuar billing-trace, y ha pasado una hora volviendo a explicar el contexto de facturación en la sesión equivocada.',
    ask: '¿Cuál es la forma más eficaz de continuar la investigación correcta?',
    options: [
      'Empezar una sesión nueva cada mañana y pegar sus notas del día anterior, ya que reanudar tiende a coger el historial equivocado.',
      'Mantener ambas investigaciones en una única sesión, para que solo haya un historial que reanudar y nada pueda mezclarse.',
      'Usar fork_session sobre la sesión que se abra, para tener una rama aparte para el trabajo de facturación sin perder auth-audit.',
      'Continuar la investigación concreta por su nombre con --resume billing-trace, para reabrir exactamente la sesión que quiere.',
    ],
    why: [
      'Empezar de cero conviene cuando hay resultados de tools obsoletos; aquí el contexto previo sigue siendo válido y el único problema es abrir la sesión equivocada.',
      'Fusionar dos investigaciones en un solo historial mezcla contexto que no tiene relación y hace que cada una sea más difícil de razonar.',
      'fork_session parte de la sesión que se abrió, así que el trabajo de facturación empezaría desde la base de auth-audit.',
      'Reanudar una sesión con nombre con --resume <session-name> continúa una conversación previa concreta en lugar de la más reciente.',
    ],
    rule: '¿Varias investigaciones? Ponles nombre y continúa con --resume <session-name>.',
  },
  'd2-owner-tool-input-format': {
    scenario:
      'Una tool MCP get_service_owner(service_id) tiene como descripción "Returns the owning team for a service." (devuelve el equipo propietario de un servicio). Solo acepta IDs de catálogo como svc-billing-v2, que aparecen en el service.yaml de cada repo. El agente le pasa rutas de repos o nombres como "billing", recibe "not found" y les dice a los ingenieros que el servicio legacy no tiene propietario.',
    ask: '¿Cuál es el primer paso más eficaz?',
    options: [
      'Ampliar la descripción con el formato del ID, un ID de ejemplo, dónde encontrarlo (service.yaml) y qué significa "not found".',
      'Añadir fuzzy matching al backend para que la tool acepte rutas de repos, nombres cortos e IDs de catálogo y elija el servicio más parecido.',
      'Hacer que el agente pida al ingeniero el ID de catálogo exacto cada vez, antes de que se le permita llamar a get_service_owner.',
      'Añadir un hook que reintente get_service_owner con diez variantes del nombre cada vez que la primera llamada devuelva "not found".',
    ],
    why: [
      'Las descripciones de las tools son la vía principal por la que el modelo aprende a llamarlas; documentar el formato de entrada, un ejemplo y los casos límite corrige la causa raíz.',
      'El fuzzy matching cuesta trabajo en el backend y puede devolver en silencio el equipo equivocado, cuando bastaría con decirle al agente el formato esperado.',
      'El ID ya está en service.yaml, que el agente puede leer; preguntar cada vez traslada el trabajo a los ingenieros en lugar de arreglar la descripción.',
      'Los reintentos a ciegas malgastan llamadas y siguen siendo conjeturas; nunca se le dijo al agente qué aspecto tiene un ID válido ni dónde encontrarlo.',
    ],
    rule: 'Pon los formatos de entrada, los ejemplos y los casos límite en la descripción de la tool.',
  },
  'd2-rename-overlapping-search': {
    scenario:
      'El agente se conecta a dos MCP servers internos que exponen cada uno una tool llamada search, ambas descritas como "Search for information." Uno busca en la wiki de Confluence; el otro indexa símbolos del código fuente. Cuando se le pregunta "¿cómo funciona el decorador de reintentos?", el agente suele responder a partir de una página de la wiki escrita hace tres años en lugar de a partir del código actual.',
    ask: '¿Cuál es la solución más eficaz?',
    options: [
      'Desconectar del agente el servidor de la wiki, ya que el código fuente siempre es una respuesta más fiable que la documentación.',
      'Añadir una línea al system prompt que le diga al agente que prefiera la tool de búsqueda que devuelva resultados con el timestamp más reciente.',
      'Fusionar ambos servidores tras una única tool search que consulte la wiki y el índice de código y devuelva todos los resultados juntos.',
      'Renombrarlas a search_wiki_pages y search_code_symbols, con descripciones que digan qué busca cada una y cuándo usarla.',
    ],
    why: [
      'La wiki sigue teniendo contenido que el código no puede dar, como runbooks y decisiones de diseño; eliminarla trata un problema de descripción como si fuera un problema de tool.',
      'El agente no puede saber qué tool devuelve resultados más recientes sin llamar a ambas, y las descripciones solapadas siguen dejando la selección al azar.',
      'Una tool fusionada mezcla texto obsoleto de la wiki con resultados de código y oculta de qué fuente sale cada respuesta, en lugar de aclarar cuándo usar cada una.',
      'Unos nombres idénticos y unas descripciones casi idénticas provocan enrutados erróneos; renombrar las tools y diferenciar sus descripciones elimina el solapamiento de raíz.',
    ],
    rule: 'Las tools solapadas se enrutan mal: renómbralas y diferencia sus descripciones.',
  },
  'd2-empty-logs-vs-timeout': {
    scenario:
      'La tool MCP get_ci_logs del agente devuelve un string vacío tanto cuando un build no produjo líneas de error como cuando la API de CI dio timeout. Un ingeniero preguntó por qué falló el build de anoche, y el agente respondió que "los logs del build no muestran errores", cuando la causa real era un timeout al obtener los logs.',
    ask: '¿Qué cambio permite mejor que el agente responda correctamente?',
    options: [
      'Devolver "Operation failed" con isError a true tanto en los timeouts como con los logs vacíos, para que el agente nunca se fíe de una respuesta en blanco.',
      'Reintentar la API de CI hasta cinco veces dentro de la tool, y devolver el string vacío solo después de que todos los intentos hayan dado timeout.',
      'Devolver isError con errorCategory "transient" e isRetryable a true en los timeouts, y un resultado vacío normal cuando no haya errores.',
      'Añadir una línea al system prompt que le diga al agente que un log vacío suele significar que la obtención falló y que debe volver a intentarlo.',
    ],
    why: [
      'Un error uniforme también oculta la diferencia: ahora el agente trata como fallos los builds que de verdad no tuvieron errores y reintenta para nada.',
      'Los reintentos locales están bien para errores transitorios, pero un string vacío final sigue pareciendo una consulta correcta que no encontró errores.',
      'Distinguir los fallos de acceso de los resultados vacíos válidos, con una categoría y un flag de reintentable, permite al agente reintentar o informar con precisión.',
      'El agente no puede distinguir los dos casos a partir de los datos; una suposición a nivel de prompt le hace reintentar resultados vacíos válidos y seguir informando mal.',
    ],
    rule: 'Un fallo de acceso no es un resultado vacío: devuelve un error estructurado y reintentable.',
  },
  'c-subagent-tools': {
    scenario:
      'Un subagente “code-researcher” solo necesita leer el codebase y buscar en él. La semana pasada ejecutó un comando Bash que borró ficheros generados.',
    ask: '¿Cuál es la mejor solución?',
    options: [
      'Indicar en su descripción y en su system prompt que nunca debe modificar, borrar ni crear ficheros.',
      'Ejecutarlo en modo bypassPermissions para que nunca se detenga y termine antes de que pueda desviarse.',
      'Limitar el campo tools de su frontmatter a tools de solo lectura como Read, Grep y Glob, para que no pueda ejecutar Bash.',
      'Pasarlo a un modelo más pequeño y barato, ya que solo necesita leer el codebase y buscar en él.',
    ],
    why: [
      'Una descripción es una indicación, no una restricción.',
      'Elimina la última red de seguridad.',
      'Mínimo privilegio: si no tiene la tool, no puede usarla mal. Si se omite tools, el subagente lo hereda todo.',
      'No tiene nada que ver con lo que puede hacer.',
    ],
    rule: 'Da a cada subagente solo las tools que su trabajo necesita.',
  },
  'd2-constrained-scaffold-tool': {
    scenario:
      'Un subagente de boilerplate necesita Bash solo para ejecutar ./scripts/scaffold.sh <template> <name>. Las auditorías muestran que en algunas ejecuciones también lanzó npm install con paquetes nuevos, y una vez hizo git commit en la rama del ingeniero. Su system prompt ya dice que use Bash solo para el script de scaffolding.',
    ask: '¿Cuál es la solución más eficaz?',
    options: [
      'Repetir la restricción de Bash al principio y al final de su system prompt, listando npm install y git commit como prohibidos.',
      'Sustituir Bash por una tool scaffold_component que valide la plantilla y el nombre y solo pueda ejecutar el script de scaffolding.',
      'Quitarle Bash al subagente y hacer que le pida al coordinador, que mantiene acceso completo a Bash, que ejecute cada comando de scaffolding.',
      'Darle también Write y Edit al subagente, para que pueda crear él mismo los ficheros de boilerplate en lugar de recurrir a comandos Bash.',
    ],
    why: [
      'El prompt ya establece la regla y a veces se ignora; repetirla sigue siendo probabilístico, y la tool Bash genérica sigue ahí.',
      'Sustituir una tool genérica por una restringida que valida sus entradas elimina el mal uso en origen: un límite firme en lugar de una petición.',
      'Ahora cada scaffolding requiere un viaje de ida y vuelta al coordinador, y el acceso abierto a Bash simplemente se ha trasladado a otro agente.',
      'Más tools añaden complejidad a la decisión, y Bash sigue disponible, así que nada impide las instalaciones y los commits indebidos.',
    ],
    rule: 'Sustituye una tool genérica por una restringida que haga solo ese trabajo.',
  },
  't-too-many-tools': {
    scenario:
      'Un agente está conectado a 8 MCP servers que exponen 60 tools en total. La precisión en la selección de tools ha bajado, y cada petición arrastra un contexto enorme.',
    ask: '¿Cuál es la mejor mejora?',
    options: [
      'Pasar a un modelo más grande con una ventana de contexto mayor que pueda manejar el conjunto completo de 60 tools.',
      'Dar a cada agente solo los servidores y tools que su tarea necesita, repartiendo el trabajo entre especialistas.',
      'Ordenar las tools alfabéticamente y prefijar cada nombre con su servidor para que sea más fácil recorrerlas.',
      'Hacer más largas y detalladas todas las descripciones de tools para que el modelo pueda distinguirlas.',
    ],
    why: [
      'Disimula el problema a un coste mayor.',
      'Menos tools, y relevantes, significan mejores elecciones y menos contexto.',
      'El orden no resuelve tener que elegir entre 60 opciones.',
      'Hace el contexto todavía más grande.',
    ],
    rule: 'Acota las tools a la tarea; más tools ≠ más capacidad.',
  },
  'd-community-jira-server': {
    scenario:
      'Los ingenieros quieren que el agente lea los tickets de Jira enlazados en los mensajes de commit y que consulte en un registro interno de propietarios qué equipo es dueño de cada módulo legacy. Un compañero propone dedicar tres semanas a construir un único MCP server a medida que cubra ambas cosas.',
    ask: '¿Cuál es el enfoque más eficaz?',
    options: [
      'Construir el servidor único a medida tal como se propone, para que ambas integraciones compartan un codebase, un flujo de autenticación y un conjunto de tools.',
      'Prescindir de MCP y dejar que el agente llame a la API de Jira y al registro con curl a través de Bash, pasando los tokens en el prompt.',
      'Usar un MCP server de Jira ya existente de la comunidad, y construir un servidor a medida solo para el registro de propietarios propio del equipo.',
      'Exportar cada semana los tickets de Jira y el registro de propietarios a CLAUDE.md para que el agente tenga los datos sin tools.',
    ],
    why: [
      'Reconstruir una integración estándar con Jira cuesta semanas que un servidor existente de la comunidad ya te ahorra.',
      'Las llamadas curl en bruto pierden las definiciones estructuradas de tools y meten credenciales en el prompt, una configuración frágil e insegura.',
      'Los servidores de la comunidad cubren integraciones estándar como Jira; los servidores a medida se reservan para flujos de trabajo específicos del equipo.',
      'Una exportación semanal se queda obsoleta e infla el contexto que siempre se carga, en lugar de dar al agente acceso en vivo.',
    ],
    rule: 'Integraciones estándar: MCP servers de la comunidad. Construye a medida solo para los flujos del equipo.',
  },
  'd-mcp-env-token': {
    scenario:
      'El agente de productividad y el Claude Code de cada ingeniero deben usar el MCP server de GitHub del equipo. Un ingeniero hizo commit de .mcp.json con un personal access token escrito dentro, y el escáner de seguridad marcó el commit. El equipo sigue queriendo que el servidor quede configurado automáticamente para cualquiera que clone el repo.',
    ask: '¿Cuál es la mejor configuración?',
    options: [
      'Mantener el servidor en el .mcp.json del proyecto y sustituir el token literal por ${GITHUB_TOKEN}, definido en el entorno de cada ingeniero.',
      'Mover la definición del servidor al ~/.claude.json de cada ingeniero para que el token nunca entre en el repo, y documentar la configuración en el README.',
      'Añadir .mcp.json a .gitignore y hacer que cada ingeniero copie una versión ya rellenada del fichero desde una unidad compartida del equipo.',
      'Mover el token a un fichero .claude/secrets.json, que Claude Code fusiona en .mcp.json al arrancar sin escribirlo en los logs.',
    ],
    why: [
      'Un .mcp.json con scope de proyecto comparte el servidor mediante el control de versiones, y la expansión de ${GITHUB_TOKEN} mantiene el secreto fuera del repo.',
      '~/.claude.json es para servidores personales o experimentales; el equipo pierde la configuración compartida y versionada.',
      'Una copia ya rellenada sigue difundiendo un token compartido y deja la configuración fuera del control de versiones.',
      'No existe ningún mecanismo de fusión de .claude/secrets.json; ese fichero no existe en Claude Code.',
    ],
    rule: 'MCP server compartido: .mcp.json del proyecto más ${ENV_VAR} para las credenciales.',
  },
  'd-mcp-resources-catalog': {
    scenario:
      'Tu MCP server interno de documentación expone las tools search_docs y get_doc sobre 600 documentos de arquitectura y schemas de base de datos. Los logs muestran que el agente dedica las primeras 10-15 llamadas a tools de cada sesión a hacer búsquedas amplias solo para saber qué documentos y schemas existen antes de poder responder.',
    ask: '¿Qué cambio reduciría más estas llamadas exploratorias?',
    options: [
      'Añadir una tool list_all_docs que devuelva el texto completo de los 600 documentos en una sola llamada al inicio de cada sesión.',
      'Limitar al agente a tres llamadas a search_docs por sesión para obligarlo a responder con lo que haya encontrado hasta entonces.',
      'Pegar los títulos de los 600 documentos en el system prompt y decirle al agente que lea esa lista antes de buscar.',
      'Exponer el catálogo de docs y schemas como resources de MCP para que el agente vea qué hay disponible sin llamadas a tools.',
    ],
    why: [
      'Devolver el texto completo de 600 documentos inunda el contexto de contenido mayormente irrelevante.',
      'Un límite arbitrario no le dice al agente qué existe; simplemente hace que responda con menos información.',
      'Una lista mantenida a mano en el prompt se queda obsoleta, y no es el mecanismo que MCP ofrece para los catálogos de contenido.',
      'Los resources de MCP exponen catálogos de contenido y dan al agente visibilidad de los datos disponibles sin llamadas a tools exploratorias.',
    ],
    rule: 'Los catálogos de contenido (docs, schemas, issues) van en resources de MCP.',
  },
  'd2-experimental-mcp-user-scope': {
    scenario:
      'Una ingeniera está probando un MCP server de profiling en beta que solo funciona en su máquina. Lo añadió al .mcp.json del repo e hizo push. Ahora la sesión de cada compañero muestra una conexión MCP fallida para ese servidor, y los recién llegados creen que tienen mal configurado su entorno. Los servidores compartidos de GitHub y Jira de .mcp.json deben quedarse como están.',
    ask: '¿Dónde debería configurarse el servidor de profiling?',
    options: [
      'En un fichero .mcp.local.json junto a .mcp.json, que Claude Code fusiona para el usuario local y que git ignora por defecto.',
      'En .mcp.json en una rama personal de git que ella rebasa sobre main, para que la copia compartida del fichero en main siga limpia.',
      'En su ~/.claude.json con scope de usuario, para que se cargue solo para ella y siga funcionando junto a los servidores de .mcp.json.',
      'En el CLAUDE.md del proyecto, con una instrucción que le diga a Claude que se conecte al profiler solo cuando sea ella quien ejecute la sesión.',
    ],
    why: [
      'No hay ningún fichero .mcp.local.json en Claude Code; no existe. Los servidores personales van en el ~/.claude.json con scope de usuario.',
      'Una rama de larga duración mantiene el servidor en el scope del proyecto y añade rebases constantes, cuando el scope de usuario existe precisamente para servidores personales.',
      'El ~/.claude.json con scope de usuario está pensado para servidores personales y experimentales; las tools de todos los servidores configurados se descubren al conectar y funcionan juntas.',
      'CLAUDE.md contiene instrucciones, no configuración de MCP servers, así que no puede añadir ni ocultar un servidor para un usuario concreto.',
    ],
    rule: 'MCP server personal o experimental: ~/.claude.json, no el .mcp.json compartido.',
  },
  'd2-mcp-desc-beats-grep': {
    scenario:
      'El MCP server de code intelligence de tu equipo tiene una tool find_references que resuelve imports con alias, re-exports y dynamic dispatch en las partes TypeScript y Python del repo. Su descripción dice "Finds references." Las trazas muestran que el agente responde a "¿quién llama a X?" con Grep en el 90% de las sesiones y se le escapan los llamadores que usan un alias.',
    ask: '¿Cuál es el primer paso más eficaz para solucionarlo?',
    options: [
      'Quitar Grep de las tools permitidas del agente para que no tenga más remedio que llamar a find_references en cada búsqueda.',
      'Reescribir la descripción de find_references para que diga qué resuelve, qué devuelve y cuándo usarla en lugar de Grep.',
      'Añadir una regla al system prompt que diga que use siempre las tools MCP antes que las integradas, trate de lo que trate la petición.',
      'Envolver find_references en un nuevo MCP server a medida que también ejecute Grep y fusione ambos conjuntos de resultados en una lista.',
    ],
    why: [
      'Grep sigue siendo la tool adecuada para mensajes de error y texto literal; quitarlo cambia un enrutado erróneo por otro en lugar de arreglar la descripción pobre.',
      'Las descripciones detalladas de las tools MCP, que explican sus capacidades y salidas, son lo que evita que el agente prefiera tools integradas como Grep frente a una tool MCP más capaz.',
      'Una regla general fuerza las tools MCP también en búsquedas de texto simple, y sigue sin decirle al agente lo que find_references puede hacer.',
      'Otro servidor añade trabajo de desarrollo y mantenimiento, y el agente sigue sin una descripción que le diga por qué la búsqueda semántica es mejor.',
    ],
    rule: '¿El agente prefiere Grep a una tool MCP mejor? Mejora la descripción de la tool MCP.',
  },
  't-mcp-project-scope': {
    scenario:
      'Cada desarrollador configura a mano el MCP server del gestor de incidencias de la empresa. Las configuraciones varían, y los recién llegados pierden un día hasta que consiguen que funcione.',
    ask: '¿Cuál es la mejor forma de compartirlo?',
    options: [
      'Que cada desarrollador lo añada con scope de usuario con claude mcp add, siguiendo una guía compartida paso a paso.',
      'Pegar la configuración completa del servidor en el CLAUDE.md del proyecto para que todas las sesiones la recojan.',
      'Añadirlo con scope local en la copia del proyecto de cada persona, usando el mismo comando para todos.',
      'Definirlo en un .mcp.json versionado con scope de proyecto, con los secretos en variables de entorno.',
    ],
    why: [
      'Sigue siendo manual e inconsistente.',
      'CLAUDE.md son instrucciones, no configuración de MCP.',
      'El scope local es privado de una sola persona.',
      'El scope de proyecto está versionado y compartido, y los secretos se quedan fuera de git.',
    ],
    rule: 'MCP servers del equipo → .mcp.json en el repo, secretos en variables de entorno.',
  },
  't-mcp-resources': {
    scenario:
      'Un MCP server expone 200 documentos de políticas estáticos a través de una tool get_policy. El equipo quiere que las aplicaciones cliente puedan listar esos documentos y adjuntarlos directamente como contexto, sin esperar a que el modelo llame a una tool.',
    ask: '¿Qué primitiva de MCP encaja mejor?',
    options: [
      'Los resources.',
      'Más tools: una tool especializada por cada documento de políticas.',
      'Prompts, con una plantilla de prompt por cada documento de políticas.',
      'Una única tool de búsqueda con una descripción mucho mejor.',
    ],
    why: [
      'Los resources son datos que la aplicación cliente puede listar y adjuntar. Las tools son acciones que el modelo decide llamar.',
      '200 tools perjudicarían mucho la selección de tools.',
      'Los prompts son plantillas reutilizables, no un almacén de documentos.',
      'Sigue requiriendo que el modelo decida llamarla.',
    ],
    rule: 'MCP: tools = acciones que invoca el modelo; resources = datos que adjunta la aplicación.',
  },
  'd-edit-nonunique-fallback': {
    scenario:
      'El agente tiene que cambiar el número de reintentos en un handler de legacy_jobs.py. Su llamada a Edit falla porque el texto ancla "retries=3," aparece en cinco handlers de ese fichero. El agente repite entonces la misma llamada a Edit cuatro veces y falla en todas.',
    ask: '¿Qué debería hacer el agente en su lugar?',
    options: [
      'Ejecutar con Bash un comando sed que sustituya "retries=3," en todo el fichero, ya que todos los handlers usan exactamente el mismo texto.',
      'Hacer Read del fichero completo y luego Write de vuelta con el cambio aplicado solo al número de reintentos del handler objetivo.',
      'Usar Glob para localizar la ocurrencia exacta dentro del fichero, y luego volver a llamar a Edit con la ruta que devuelva Glob.',
      'Llamar a Grep para obtener el número de línea de la ocurrencia objetivo, y luego pasar ese número al parámetro line_number de Edit.',
    ],
    why: [
      'Esto cambia los cinco handlers cuando solo debería cambiar uno.',
      'Cuando Edit no encuentra un texto ancla único, Read seguido de Write es la alternativa fiable para un cambio dirigido.',
      'Glob busca rutas de ficheros por patrón; no puede encontrar texto dentro de un fichero, y además la ruta ya se conoce.',
      'Edit busca coincidencias de texto único y no tiene ningún parámetro line_number, así que esa llamada no existe.',
    ],
    rule: '¿Edit falla por texto no único? Recurre a Read + Write.',
  },
  'd-grep-entry-points': {
    scenario:
      'Un ingeniero le pregunta al agente cómo viaja un pedido desde la API de checkout hasta la cola del almacén en un repo legacy de 3000 ficheros. Lo primero que hace el agente es hacer Read de todos los ficheros de src/, y se queda sin contexto antes de responder.',
    ask: '¿Cómo debería construir su comprensión el agente en su lugar?',
    options: [
      'Hacer Grep de la ruta de checkout y de la llamada que publica en la cola para encontrar los puntos de entrada, y luego Read de esos ficheros y seguir los imports.',
      'Usar Glob para listar primero todos los ficheros fuente, y luego hacer Read de ellos en lotes alfabéticos para no perderse ninguna parte del flujo.',
      'Usar Glob para encontrar los ficheros cuyo nombre contenga "order" o "warehouse" y hacer Read solo de esos, ya que los nombres revelan su propósito.',
      'Aplicar el mismo enfoque de leerlo todo con un modelo con una ventana de contexto mayor, para que todo src/ quepa en una sola sesión.',
    ],
    why: [
      'Grep encuentra contenido como definiciones de rutas y llamadas de publicación; leer hacia fuera desde esos puntos de entrada construye la comprensión de forma incremental.',
      'Hacerlo por lotes sigue siendo leerlo todo de antemano; el contexto se llena igual, solo que más despacio.',
      'Glob busca por nombres, no por contenido; la lógica clave suele estar en ficheros cuyo nombre nunca menciona pedidos ni almacenes.',
      'Una ventana mayor aplaza el problema y gasta tokens en miles de ficheros irrelevantes.',
    ],
    rule: 'Explora de forma incremental: Grep para los puntos de entrada, luego Read y sigue los imports.',
  },
  'd2-edit-over-full-rewrite': {
    scenario:
      'Para cambiar una constante de timeout en un settings.py legacy de 1800 líneas, el agente hace Read del fichero y lo vuelve a escribir entero con Write. La code review encuentra cambios no relacionados en el diff: comentarios reformulados, un dict reordenado y las últimas 40 líneas de feature flags desaparecidas.',
    ask: '¿Qué cambio en el enfoque del agente es más eficaz?',
    options: [
      'Mantener Read y Write, y añadir una regla al system prompt que le diga al agente que reproduzca exactamente todas las demás líneas del fichero.',
      'Mantener Read y Write, pero subir max_tokens para que las 1800 líneas quepan siempre en una sola llamada a Write sin cortarse.',
      'Usar Edit con un fragmento que rodee la constante de forma única, para que solo cambie ese texto y el resto quede intacto.',
      'Usar Bash para ejecutar sed sobre el nombre de la constante, ya que una sustitución en shell solo cambia las líneas que contienen ese nombre.',
    ],
    why: [
      'Pedir una copia exacta es probabilístico; el riesgo viene de regenerar un fichero entero para un cambio de una línea.',
      'Más tokens pueden evitar el truncado, pero regenerar 1800 líneas sigue dando pie a las reformulaciones y reordenaciones que vieron los revisores.',
      'Edit está pensado para cambios dirigidos mediante coincidencia de texto único; Read más Write es la alternativa para cuando no existe un ancla única, no la opción por defecto.',
      'sed cambia todas las líneas que coinciden, incluidas otras referencias al nombre, sin comprobar la unicidad ni informar de las coincidencias.',
    ],
    rule: 'Cambio dirigido: Edit con un ancla única. Read + Write solo como alternativa.',
  },
  'd2-glob-then-grep-stories': {
    scenario:
      'Antes de borrar el componente obsoleto LegacyButton, un ingeniero le pregunta al agente qué ficheros de stories de Storybook (*.stories.tsx) todavía lo importan. El monorepo tiene unos 400 ficheros de stories entre 12.000 ficheros fuente, y los ficheros de stories se nombran según el componente que documentan.',
    ask: '¿Qué enfoque con las tools integradas es más eficaz?',
    options: [
      'Hacer Grep de la palabra "stories" en todo el repo para encontrar los ficheros de stories, y luego Grep de LegacyButton en cada uno de esos ficheros.',
      'Hacer Glob de **/*LegacyButton*.stories.tsx para encontrar los ficheros de stories cuyo nombre hace referencia al componente obsoleto.',
      'Hacer Glob de **/*.stories.tsx, y luego Read de cada uno de los 400 ficheros de stories y revisar sus imports uno a uno buscando LegacyButton.',
      'Hacer Grep de un import de LegacyButton, limitando la búsqueda a los ficheros que coincidan con *.stories.tsx, y listar los que coincidan.',
    ],
    why: [
      'Grep busca en el contenido, así que "stories" coincide con texto en cualquier sitio; encontrar ficheros por patrón de nombre es trabajo de Glob, no de Grep.',
      'Glob compara rutas de ficheros, no contenido; una story de otro componente, como una toolbar, puede importar LegacyButton sin nombrarlo.',
      'Esto encuentra los ficheros correctos, pero lee 400 ficheros de antemano, cuando una búsqueda por contenido devuelve solo los que coinciden.',
      'Grep busca en el contenido de los ficheros, como las sentencias import, y un filtro por patrón de fichero lo limita a los ficheros de stories en una sola llamada eficiente.',
    ],
    rule: 'Grep busca en el contenido, Glob compara rutas; combínalos para acotar una búsqueda.',
  },
  'd2-trace-wrapper-exports': {
    scenario:
      'Antes de eliminar la función legacy request(), se le pidió al agente que encontrara todos sus llamadores. Hizo Grep de "request(" e informó de 14 puntos de llamada. Tras la eliminación, se rompieron 31 ficheros más. Importan desde lib/http/index.ts, que re-exporta request con los nombres getJson, postJson y legacyFetch.',
    ask: '¿Cómo debería haber rastreado el agente los usos?',
    options: [
      'Hacer primero Read de lib/http/index.ts para listar cada nombre con el que exporta request, y luego Grep de cada uno en el codebase.',
      'Hacer Grep de "request" sin el paréntesis, para captar también el código que va pasando la función como callback sin llegar a llamarla.',
      'Hacer Glob de los ficheros cuya ruta contenga "http" o "fetch", y luego Read de todos ellos para ver cuáles acaban usando request.',
      'Hacer Grep de los imports desde lib/http y tratar cada fichero que importa como un llamador, sin comprobar qué nombres usa cada uno.',
    ],
    why: [
      'Rastrear los usos a través de módulos wrapper implica identificar primero todos los nombres exportados y después buscar cada nombre en todo el codebase.',
      'Una búsqueda literal más amplia añade ruido de texto "request" no relacionado y sigue sin encontrar getJson, postJson ni legacyFetch.',
      'Glob compara nombres de ficheros, no usos; los llamadores viven en ficheros con el nombre de su propia funcionalidad, no de la capa HTTP.',
      'Las líneas de import muestran qué ficheros usan el módulo, no cuáles usan request; también se marcan ficheros que solo importan otros helpers.',
    ],
    rule: 'Rastrea los wrappers: lista cada alias exportado y luego haz Grep de cada uno.',
  },
  'd2-import-home-path': {
    scenario:
      'El CLAUDE.md del proyecto contiene la línea @~/standards/api-conventions.md. Las sesiones del tech lead siguen las convenciones de la API siempre. Dos ingenieros nuevos que clonaron el repo la semana pasada obtienen handlers que las ignoran, aunque usan el mismo CLAUDE.md en la misma rama.',
    ask: '¿Cuál es la causa raíz más probable?',
    options: [
      'Los ~/.claude/CLAUDE.md propios de los ingenieros nuevos tienen prioridad, así que los imports del fichero del proyecto nunca se leen para ellos.',
      '@import solo se procesa en los CLAUDE.md de nivel de usuario, así que en el fichero del proyecto la línea se trata como texto plano y se ignora sin avisar.',
      'Claude Code cachea los ficheros importados por máquina durante una semana, así que las sesiones de los ingenieros nuevos siguen usando una copia antigua y vacía.',
      'El import apunta al directorio home del usuario, así que en las máquinas de los ingenieros nuevos hace referencia a un fichero que no existe.',
    ],
    why: [
      'Los CLAUDE.md de nivel de usuario y de proyecto se combinan, no son excluyentes; un fichero de usuario no impide que se carguen los imports del proyecto.',
      '@import también funciona en los CLAUDE.md de proyecto; es la forma estándar de mantener modular la configuración del proyecto.',
      'No existe una caché de imports por máquina que caduque cada semana; ese mecanismo no existe.',
      'Una ruta ~/ se resuelve en el directorio home de cada usuario, y el fichero solo existe en la máquina del lead; haz commit de él en el repo e impórtalo con una ruta relativa.',
    ],
    rule: 'Las instrucciones compartidas deben vivir en el repo; un import con ~/ solo existe en una máquina.',
  },
  'd2-split-claude-md-rules': {
    scenario:
      'El CLAUDE.md raíz de un monorepo legacy ha crecido hasta las 1300 líneas. Cinco equipos lo editan, provoca conflictos de merge cada semana y nadie encuentra en él las convenciones de testing o de despliegue. Todas estas convenciones deben seguir aplicándose a todas las sesiones del repo.',
    ask: '¿Qué reorganización es la más mantenible?',
    options: [
      'Mover las secciones de cada equipo a los ~/.claude/CLAUDE.md de sus miembros, para que solo se carguen para quienes las necesitan.',
      'Dividirlo en ficheros por tema en .claude/rules/, como testing.md, api-conventions.md y deployment.md, cada uno a cargo de un equipo.',
      'Convertir cada sección en una skill en .claude/skills/, para que sus convenciones solo se carguen cuando un desarrollador la invoque por su nombre.',
      'Mantener un único fichero pero añadir un índice al principio, y exigir que cada equipo edite solo su propia sección en PRs separados.',
    ],
    why: [
      'Los ficheros de nivel de usuario no se comparten mediante el control de versiones, así que las convenciones desaparecerían para todos los demás que trabajan en el repo.',
      '.claude/rules/ contiene ficheros de reglas por tema como alternativa a un CLAUDE.md monolítico; los ficheros de reglas sin acotar por rutas se siguen cargando en todas las sesiones.',
      'Las skills se cargan bajo demanda para flujos de trabajo de tareas concretas; las convenciones que siempre aplican van en configuración que siempre se carga.',
      'Un índice ayuda a navegar pero mantiene un único fichero compartido enorme, así que los conflictos de merge y la propiedad enmarañada siguen ahí.',
    ],
    rule: '¿CLAUDE.md monolítico? Divídelo en ficheros por tema en .claude/rules/.',
  },
  'd2-personal-skill-variant': {
    scenario:
      'La skill /scaffold-service del equipo vive en .claude/skills/scaffold-service/SKILL.md. Marta quería una versión que además añadiera su logging de depuración detallado, así que editó el SKILL.md compartido y le hizo commit por error. Los servicios nuevos de sus compañeros salen ahora con su logging de depuración.',
    ask: '¿Qué enfoque le da mejor a Marta su variante sin afectar a sus compañeros?',
    options: [
      'Revertir el fichero compartido y añadir una copia personal en ~/.claude/skills/ con un nombre nuevo, como scaffold-service-debug.',
      'Mantener su cambio en la skill compartida pero añadir una nota en SKILL.md pidiendo a los compañeros que quiten a mano el logging de depuración.',
      'Poner sus pasos de depuración en el CLAUDE.md del proyecto bajo un encabezado "Solo Marta", para que se apliquen solo en sus propias sesiones.',
      'Añadir un campo user: marta al frontmatter del SKILL.md compartido, para que los pasos de depuración solo se ejecuten cuando ella invoque la skill.',
    ],
    why: [
      'Las variantes personales van en ~/.claude/skills/ con otro nombre, así que los compañeros conservan la skill compartida y ella puede seguir ejecutando ambas.',
      'La skill compartida sigue cambiando para todos, y pedir a la gente que lo deshaga a mano garantiza servicios inconsistentes.',
      'El CLAUDE.md del proyecto es compartido y siempre se carga, así que un encabezado no puede mantener los pasos de depuración fuera de las sesiones de los compañeros.',
      'SKILL.md no tiene ningún campo de frontmatter por usuario como este; no existe, así que los pasos se seguirían ejecutando para todos.',
    ],
    rule: 'Ajuste personal a una skill del equipo: cópiala a ~/.claude/skills/ con un nombre nuevo.',
  },
  'd2-skill-fork-readonly': {
    scenario:
      'Estás escribiendo una skill de proyecto, /trace-flow, que sigue una petición a través del codebase legacy y termina con un resumen de una página. Produce unos 30.000 tokens de salida intermedia de Grep y Read, y nunca debe modificar ficheros, porque los ingenieros la ejecutan en mitad del desarrollo de funcionalidades.',
    ask: '¿Qué frontmatter de SKILL.md cumple mejor ambas necesidades?',
    options: [
      'Solo context: fork, más una línea en el cuerpo de la skill que le diga que nunca edite, escriba ni borre ningún fichero durante la traza.',
      'allowed-tools limitado a Read, Grep y Glob, confiando en que el resumen de una página de la skill mantenga pequeña la sesión principal.',
      'context: fork con allowed-tools limitado a Read, Grep y Glob, para que la traza se ejecute aislada y no pueda cambiar ningún fichero.',
      'isolation: readonly, que ejecuta la skill en una copia de solo lectura del repo y devuelve a la sesión principal solo su resumen final.',
    ],
    why: [
      'El aislamiento resuelve el problema de contexto, pero una instrucción en prosa no es una restricción; allowed-tools es lo que de verdad limita las tools.',
      'Sin context: fork, los 30.000 tokens de salida intermedia acaban en la sesión principal antes de que llegue el resumen.',
      'context: fork mantiene la salida verbosa fuera de la conversación principal, y allowed-tools restringe qué tools puede usar la skill mientras se ejecuta.',
      'No hay ninguna opción de frontmatter isolation: readonly; no existe. Los controles reales son context: fork y allowed-tools.',
    ],
    rule: '¿Skill verbosa que no debe escribir? Usa context: fork más allowed-tools.',
  },
  'd2-rule-glob-mismatch': {
    scenario:
      'El equipo añadió .claude/rules/protobuf.md con el frontmatter paths: ["proto/**/*"]. En realidad, los ficheros .proto están en services/<name>/api/ repartidos en 20 servicios. Cuando Claude los edita, ignora las convenciones de numeración de campos y de nombres de esa regla, mientras que los demás ficheros de reglas del equipo funcionan como se espera.',
    ask: '¿Cuál es la causa raíz más probable?',
    options: [
      'Las reglas acotadas por rutas solo se aplican a los ficheros nuevos que crea Claude, así que las ediciones de ficheros .proto existentes nunca cargan la regla.',
      'El glob solo coincide con ficheros bajo una carpeta proto/ de primer nivel, así que nunca coincide con los ficheros .proto que hay bajo services/.',
      'Los ficheros de reglas se omiten en las carpetas que tienen su propio CLAUDE.md, y varias carpetas de services/ tienen uno para notas.',
      'Las reglas acotadas por rutas necesitan una entrada correspondiente en .claude/settings.json, y protobuf.md nunca se registró ahí.',
    ],
    why: [
      'Las reglas acotadas por rutas se cargan siempre que Claude trabaja con ficheros que coinciden, incluidas las ediciones de ficheros que ya existen.',
      'Las reglas acotadas por rutas solo se cargan cuando el fichero editado coincide con el glob; un patrón por tipo de fichero como **/*.proto funciona sea cual sea el directorio.',
      'Los CLAUDE.md de directorio y las reglas se cargan ambos; un CLAUDE.md no desactiva las reglas de su carpeta.',
      'Los ficheros de reglas de .claude/rules/ se descubren automáticamente; no existe ni hace falta ningún registro en settings.json.',
    ],
    rule: '¿Una regla por rutas no se carga? Comprueba que su glob coincide con dónde están realmente los ficheros.',
  },
  'd2-direct-exec-stack-trace': {
    scenario:
      'Un ingeniero pega un stack trace que muestra un TypeError en format_invoice_date() en un fichero legacy: la función falla cuando due_date es None. La solución es una sola guard clause. Un compañero insiste en que todo cambio en código legacy debe empezar en plan mode, porque el código legacy es arriesgado.',
    ask: '¿Qué enfoque es el más adecuado para este cambio?',
    options: [
      'Usar plan mode para la investigación y ejecución directa para la corrección, igual que harías con una migración de librería.',
      'Usar plan mode para explorar primero el módulo de facturación, ya que algunos llamadores legacy podrían depender discretamente del fallo.',
      'Lanzar un subagente Explore para mapear todos los llamadores de format_invoice_date() en el repo antes de decidir cómo cambiarla.',
      'Usar ejecución directa: el cambio está bien acotado, el stack trace señala la ubicación y no hay decisiones de diseño que sopesar.',
    ],
    why: [
      'Combinar plan mode con ejecución encaja en migraciones complejas; para una sola guard clause, la fase de planificación es puro overhead.',
      'Plan mode es para cambios grandes, decisiones de arquitectura o varios enfoques válidos; una guard clause conocida de una línea no tiene nada de eso.',
      'El subagente Explore aísla el descubrimiento verboso en tareas de varias fases; aquí no hay nada grande que descubrir.',
      'La ejecución directa encaja en cambios simples y bien acotados, como un arreglo en un solo fichero con un stack trace claro; planificar añade coste sin aportar valor.',
    ],
    rule: 'Arreglo claro en un solo fichero con causa conocida: usa ejecución directa.',
  },
  'd2-plan-feature-flags': {
    scenario:
      'Un ingeniero le pide al agente que añada feature flags a un monolito legacy. Los flags podrían venir del servicio de configuración existente, del SDK de un proveedor que requiere una nueva dependencia de red o de variables de entorno, y hoy unos 30 ficheros leen configuración. El ingeniero quiere evitar rehacer trabajo.',
    ask: '¿Qué enfoque debería seguir el ingeniero?',
    options: [
      'Usar plan mode para explorar cómo se lee la configuración y comparar las tres opciones, y luego ejecución directa para el plan elegido.',
      'Usar ejecución directa con la opción más simple, variables de entorno, y cambiar de enfoque más adelante si se queda corta.',
      'Usar ejecución directa en una rama desechable, para que una mala elección se pueda revertir con git mientras se explora y se programa a la vez.',
      'Quedarse en plan mode durante toda la tarea, incluidas las ediciones, para que cada cambio en los 30 ficheros se revise antes de escribirse.',
    ],
    why: [
      'Varios enfoques válidos con necesidades de infraestructura distintas piden plan mode primero; una vez acordado el diseño, la ejecución directa lo implementa.',
      'Elegir una opción antes de explorar es justo como se acaba rehaciendo trabajo caro cuando resulta que los 30 puntos de llamada necesitan otra cosa.',
      'Git hace posible rehacer el trabajo, no que salga barato; la decisión de diseño se sigue tomando sin explorar antes el código.',
      'Plan mode sirve para explorar y diseñar antes de comprometerse con los cambios; no hace las ediciones, así que la implementación viene después.',
    ],
    rule: 'Varios enfoques válidos: primero planifica y luego ejecuta el plan elegido.',
  },
  'd-interview-cache': {
    scenario:
      'Un ingeniero sin experiencia en caché le pidió al agente que añadiera una caché Redis delante de un servicio legacy de precios, y el agente la implementó en el acto. En staging, los clientes vieron precios antiguos durante horas tras las actualizaciones, y el servicio fallaba cada vez que Redis se caía. El ingeniero está a punto de volver a intentarlo.',
    ask: '¿Qué enfoque debería seguir el ingeniero en el siguiente intento?',
    options: [
      'Escribir primero una especificación detallada, con los TTL y las claves de caché, y hacer que el agente la implemente exactamente como está escrita.',
      'Darle al agente ejemplos de pares de petición y respuesta cacheados para que aprenda qué llamadas de precios deben cachearse.',
      'Dejar que el agente vuelva a implementarlo directamente, y luego arreglar en iteraciones posteriores los nuevos problemas que aparezcan en staging.',
      'Pedir al agente que entreviste al ingeniero sobre invalidación, modos de fallo y necesidades de frescura antes de implementar.',
    ],
    why: [
      'El ingeniero es nuevo en este dominio y ya pasó por alto estos problemas, así que una especificación que escriba él solo probablemente vuelva a pasarlos por alto.',
      'Los ejemplos de entrada/salida aclaran una transformación conocida; no sacan a la luz cuestiones de diseño como la invalidación o las caídas de Redis.',
      'Iterar sobre los fallos en staging descubre los huecos de diseño tarde y cuesta más trabajo rehecho que sacarlos a la luz primero.',
      'El patrón de entrevista hace que Claude haga preguntas que sacan a la luz consideraciones que el desarrollador no había previsto, antes de escribir ningún código.',
    ],
    rule: '¿Dominio desconocido? Haz que Claude te entreviste antes de implementar.',
  },
  'd-io-examples-dto': {
    scenario:
      'Los ingenieros usan el agente para generar clases DTO a partir de definiciones de tablas SQL legacy. El prompt dice en prosa: "convierte las columnas snake_case en campos camelCase y haz opcionales las columnas nullable." Los resultados son inconsistentes: algunos campos se quedan en snake_case y algunas columnas NOT NULL salen como opcionales.',
    ask: '¿Cuál es la forma más eficaz de conseguir una salida consistente?',
    options: [
      'Reescribir la prosa con reglas más detalladas que cubran cada tipo de columna, cada caso de nulabilidad y cada excepción de nomenclatura.',
      'Añadir 2-3 ejemplos concretos, cada uno con una definición de tabla real y la clase DTO exacta que se espera a partir de ella.',
      'Usar el patrón de entrevista para que el agente pregunte al ingeniero sobre nombres y nulabilidad antes de cada generación.',
      'Hacer que el agente reformule las reglas de mapeo con sus propias palabras antes de generar, para que los ingenieros puedan corregir su interpretación.',
    ],
    why: [
      'La prosa ya se está interpretando de forma inconsistente; añadir más prosa rara vez lo arregla.',
      'Los ejemplos concretos de entrada/salida son la forma más eficaz de comunicar una transformación cuando la prosa se interpreta de forma inconsistente.',
      'El patrón de entrevista saca a la luz consideraciones de diseño que nadie había previsto; aquí las reglas son conocidas, y preguntar cada vez supone una carga para los ingenieros.',
      'Reformular añade un paso, pero el modelo puede reformular las reglas correctamente y aun así aplicarlas de forma inconsistente.',
    ],
    rule: '¿Instrucciones en prosa aplicadas de forma inconsistente? Muestra 2-3 ejemplos de entrada/salida.',
  },
  'd2-tdd-date-parser': {
    scenario:
      'El agente está reescribiendo un parse_date() legacy que acepta 11 formatos de entrada encontrados en ficheros de datos antiguos. Cada intento arregla algunos formatos y rompe otros sin avisar, y el ingeniero solo descubre las regresiones revisando ficheros a mano tras cada ronda.',
    ask: '¿Cuál es la forma más eficaz de guiar la reescritura?',
    options: [
      'Pedir al agente que entreviste al ingeniero sobre el manejo de fechas antes de cada intento, para que entienda los formatos más a fondo.',
      'Describir los 11 formatos en un párrafo detallado y pedir al agente que los resuelva todos bien en el siguiente intento.',
      'Escribir primero una suite de tests que cubra los 11 formatos, los casos límite y la entrada inválida, y luego iterar compartiendo los tests que fallan.',
      'Hacer que el agente arregle un formato por sesión, empezando una sesión nueva para cada uno, para que los arreglos anteriores nunca se toquen.',
    ],
    why: [
      'El patrón de entrevista saca a la luz consideraciones que nadie había previsto; aquí los formatos son conocidos y el problema es detectar las regresiones.',
      'Más prosa no muestra qué formatos se rompieron; el ingeniero seguiría revisando a mano tras cada intento.',
      'La iteración guiada por tests da una comprobación objetiva para cada formato, así que las regresiones aparecen al instante como fallos sobre los que el agente puede actuar.',
      'Los formatos comparten un mismo parser, así que los arreglos interactúan; usar sesiones separadas no impide que un cambio posterior rompa un formato anterior.',
    ],
    rule: '¿Los arreglos rompen otros casos? Escribe primero los tests y luego comparte los fallos.',
  },
  't-paginate-output': {
    scenario:
      'Una tool get_logs devuelve hasta 50.000 líneas de log. Tras una sola llamada, el contexto del agente se inunda y las respuestas posteriores empeoran.',
    ask: '¿Cuál es el mejor rediseño?',
    options: [
      'Pasar el agente a un modelo con una ventana de contexto mayor para que un volcado completo de logs quepa holgadamente.',
      'Pedir al modelo en el system prompt que eche un vistazo rápido a los logs e ignore las líneas que no sean relevantes.',
      'Filtrar y paginar dentro de la tool (rango de tiempo, nivel, límite) y devolver un resumen breve más un cursor de página.',
      'Ejecutar /compact automáticamente después de cada llamada a get_logs para reducir los logs a un resumen.',
    ],
    why: [
      'Gana espacio, no foco.',
      'Para entonces el ruido ya ha llenado el contexto.',
      'Las tools deberían devolver por defecto lo que es útil, más una forma de profundizar.',
      'Resume después del daño, y pierde detalle.',
    ],
    rule: 'Diseña las salidas de las tools pensando en el contexto: filtra, pagina, resume.',
  },
  'd-crash-manifest': {
    scenario:
      'El agente mapea dependencias en un monorepo grande con un coordinador y cuatro subagentes, uno por área de servicio. Una ejecución dura unas cinco horas. Cuando el proceso se cayó en la tercera hora, todo volvió a empezar desde cero y se perdieron los hallazgos ya completados de los subagentes.',
    ask: '¿Cuál es la forma más eficaz de hacer que el sistema sea recuperable?',
    options: [
      'Hacer que el coordinador guarde en su propio contexto la transcripción completa de cada subagente para poder reproducir su trabajo tras una caída.',
      'Subir los límites de timeout y de reintentos de cada subagente para que una ejecución larga tenga muchas menos probabilidades de caerse.',
      'Tras una caída, reanudar solo la sesión del coordinador con --resume, puesto que ya ha visto todos los resultados de los subagentes.',
      'Hacer que cada agente exporte su estado a una ubicación conocida, y que el coordinador cargue un manifiesto de ese estado al reanudar.',
    ],
    why: [
      'Las transcripciones completas inflan el contexto del coordinador, y se pierden junto con él cuando el proceso se cae.',
      'Tener menos caídas no es recuperarse; cuando aun así se produce una, se vuelve a perder todo el progreso.',
      'Los subagentes trabajan en contextos aislados, así que su trabajo en curso no está en la sesión del coordinador, que solo contiene los resultados ya devueltos.',
      'Las exportaciones de estado estructuradas más un manifiesto permiten al coordinador restaurar el progreso e inyectar el estado guardado en los prompts de los agentes.',
    ],
    rule: 'Recuperación tras caídas: los agentes exportan su estado; el coordinador carga un manifiesto al reanudar.',
  },
  'x-state-file': {
    scenario:
      'Un agente migra 200 ficheros a lo largo de varias horas. Tras una compactación del contexto o una sesión nueva, pierde la cuenta de lo que ya está hecho y repite u omite ficheros.',
    ask: '¿Cuál es el enfoque más fiable?',
    options: [
      'Usar un modelo con una ventana de contexto mayor para que toda la migración quepa en una sola sesión.',
      'Desactivar la compactación automática para esta tarea para que el agente nunca pierda sus mensajes anteriores.',
      'Guardar el progreso en un fichero de checklist que el agente lee al empezar y actualiza después de cada fichero.',
      'Reiniciar la migración desde el primer fichero cada vez que se reinicie el contexto, para mantener la coherencia.',
    ],
    why: [
      'Las tareas muy largas acabarán superando cualquier ventana.',
      'La sesión llegará al límite de todos modos.',
      'Un estado duradero e inspeccionable fuera de la conversación sobrevive a la compactación y a las sesiones nuevas.',
      'Desperdicia trabajo y puede que nunca termine.',
    ],
    rule: 'Las tareas largas guardan el estado fuera de la ventana de contexto.',
  },
  'i2-gate-tests-before-pr': {
    scenario:
      'Tu agente de arreglos de CI, construido con el Agent SDK, repara builds que fallan usando las herramientas `run_tests` y `open_pull_request`. Su system prompt indica que solo abra una PR cuando `run_tests` pase en el commit final. Las auditorías muestran que el 6% de sus PRs se abrieron sin una ejecución en verde, normalmente tras una edición de última hora, y dos de ellas rompieron main al hacer merge.',
    ask: '¿Cuál es la solución más eficaz?',
    options: [
      'Añadir ejemplos few-shot en los que el agente vuelve a ejecutar run_tests tras cada edición tardía, justo antes de llamar a open_pull_request.',
      'Reescribir la instrucción del system prompt como una checklist numerada, con el paso de tests en negrita y marcado como obligatorio.',
      'Añadir la regla a la descripción de la herramienta open_pull_request, para que el agente lea el requisito justo en el momento de llamarla.',
      'Bloquear open_pull_request en código hasta que run_tests haya pasado para el SHA del commit actual, rechazando cualquier otra llamada.',
    ],
    why: [
      'Los ejemplos hacen más probable que cumpla, pero siguen siendo probabilísticos; un 6% de fallos con builds rotos exige una garantía determinista.',
      'Cambiar el formato del prompt sigue siendo una guía basada en el prompt, con una tasa de fallo distinta de cero.',
      'La descripción de una herramienta sigue siendo una guía que el modelo puede ignorar; no impide la llamada.',
      'Un prerrequisito programático impone el orden de forma determinista, y vincularlo al SHA del commit impide que se cuelen las ediciones de última hora.',
    ],
    rule: 'Un orden de pasos obligatorio con consecuencias reales va en el código, no en el prompt.',
  },
  'i2-oncall-handoff-summary': {
    scenario:
      'Cuando tu agente de arreglos de CI no consigue reparar un build roto de main dentro de su presupuesto, avisa a la guardia con "El build sigue fallando tras los intentos automáticos; por favor, investigad." Los ingenieros de guardia no pueden ver el transcript del agente y pasan unos 25 minutos redescubriendo lo que este ya había averiguado, a veces reintentando arreglos que ya había descartado.',
    ask: '¿Cuál es la mejora más eficaz?',
    options: [
      'Adjuntar al aviso el transcript completo y en bruto del agente, con cada llamada a herramienta y su salida, para que la guardia lea toda la investigación.',
      'Enviar un handoff estructurado: tests que fallan y commit, causa raíz probable con evidencias, arreglos probados y resultados, y un siguiente paso.',
      'Dejar que el agente siga intentándolo el doble de tiempo antes de avisar, para que lleguen muchos menos fallos al ingeniero de guardia.',
      'Avisar a la guardia en cuanto falle el build, antes de que el agente empiece a investigar, para que los ingenieros sigan el fallo desde el principio.',
    ],
    why: [
      'Un transcript en bruto es largo y ruidoso; la guardia tiene que rebuscar las conclusiones en lugar de recibirlas de entrada.',
      'Un handoff estructurado con los hechos, la causa raíz, lo que se ha probado y una acción recomendada permite que alguien sin el transcript actúe de inmediato.',
      'Un presupuesto mayor puede reducir los avisos, pero los casos que siguen necesitando a una persona llegan con el mismo contexto que antes.',
      'Esto tira a la basura la investigación del agente y añade avisos por builds que podría haber arreglado él solo.',
    ],
    rule: 'Escala con un handoff estructurado: hechos, causa, intentos y acción recomendada.',
  },
  'i2-hook-block-test-edits': {
    scenario:
      'Tu agente de arreglos de CI puede modificar código fuente, pero nunca debe tocar ficheros de test. Su prompt lo prohíbe y, aun así, en el 3% de las ejecuciones puso en verde un build rojo relajando una aserción en un fichero `*_test.py`. Seguridad quiere una garantía, y un intento bloqueado debe pasar a revisión humana en lugar de limitarse a hacer fallar el job.',
    ask: '¿Cuál es la forma más eficaz de hacer cumplir esta política?',
    options: [
      'Añadir un hook que intercepte las llamadas de escritura y edición sobre ficheros de test, las bloquee y abra una petición de revisión humana.',
      'Reforzar el prompt con ejemplos de ediciones prohibidas de aserciones y repetir la regla en la descripción de cada herramienta de escritura.',
      'Tras cada ejecución, hacer que una segunda instancia de Claude lea el diff y diga si ha cambiado algún fichero de test antes de abrir la PR.',
      'Pedir al agente una puntuación de confianza de que su cambio respeta la intención de los tests, y pasar a una persona toda ejecución por debajo de 0.8.',
    ],
    why: [
      'Un hook que intercepta las llamadas a herramientas da una garantía determinista: la edición prohibida nunca llega a ocurrir y la redirección envía el caso a una persona.',
      'Mejores prompts reducen la tasa, pero siguen siendo probabilísticos, y el requisito es una garantía.',
      'Una comprobación posterior con un modelo sigue siendo probabilística y solo detecta la edición una vez hecha; una regla determinista necesita una aplicación determinista.',
      'La confianza autodeclarada está mal calibrada; el agente que relajó la aserción creía que era un arreglo válido.',
    ],
    rule: '¿Política garantizada? Intercepta la llamada a la herramienta con un hook y redirige a una persona.',
  },
  'a-parallel-fanout': {
    scenario:
      'Un único agente revisa uno tras otro los 30 ficheros modificados en una PR grande. Cada fichero se puede revisar por separado. Las reviews tardan 20 minutos y los últimos ficheros reciben un feedback más superficial.',
    ask: '¿Qué cambio resuelve a la vez la velocidad y la calidad?',
    options: [
      'Ejecutar pasadas centradas en cada fichero en subagentes en paralelo, más una pasada de integración aparte entre ficheros.',
      'Cargar los 30 ficheros en un único prompt para que el modelo vea todas las interacciones entre ficheros en una sola pasada, sin traspasos.',
      'Pedir al agente que limite la review de cada fichero a tres viñetas para que mantenga el mismo ritmo de principio a fin.',
      'Pasar toda la review a un modelo más pequeño y rápido y subir su límite de salida para que cubra todos los ficheros.',
    ],
    why: [
      'Las pasadas por fichero dan a todos la misma profundidad, y la pasada de integración detecta los problemas entre ficheros: sin dilución de la atención.',
      'Provoca de golpe el problema del contexto sobrecargado.',
      'Más rápido, pero a costa de bajar la calidad a propósito.',
      'Puede ayudar con la velocidad, pero la calidad baja y el contexto sigue acumulándose.',
    ],
    rule: 'Tareas independientes: subagentes en paralelo con contextos limpios.',
  },
  'i-legacy-test-plan': {
    scenario:
      'Un job nocturno de CI pide a Claude Code que "añada tests exhaustivos" a un servicio de facturación de 9 años casi sin cobertura. Con un único prompt grande, escribió 140 tests superficiales de getters y ninguno para la lógica de reintentos de pagos. Un segundo intento usó una cadena fija (un paso por directorio, en orden alfabético) y se atascó en módulos cuyas dependencias no entendía.',
    ask: '¿Cómo deberías reestructurar esta tarea?',
    options: [
      'Mantener la cadena por directorios pero ordenar los pasos por tamaño de fichero, para que los módulos más grandes y complejos se prueben siempre primero.',
      'Dar al prompt único un objetivo estricto del 80% de cobertura de líneas, para que Claude siga escribiendo tests hasta que el informe de cobertura lo alcance.',
      'Primero mapear el código y localizar las áreas de mayor impacto, y luego seguir un plan de tests priorizado que se revisa a medida que se descubren dependencias.',
      'Generar tests para todos los ficheros en paralelo, un subagente por fichero, y después juntar los resultados y quitar los casos de test duplicados al final.',
    ],
    why: [
      'Sigue siendo un pipeline fijo. El tamaño del fichero no es impacto de negocio, y la cadena no puede adaptarse cuando encuentra dependencias que no esperaba.',
      'Una cifra de cobertura premia las líneas fáciles, como los getters. No dirige el esfuerzo a la lógica de reintentos, que es la arriesgada.',
      'Las tareas abiertas necesitan descomposición dinámica: mapear la estructura, localizar las áreas de mayor impacto y seguir un plan priorizado que se adapta a medida que aparecen dependencias.',
      'Repartir por fichero ignora la prioridad y las dependencias entre módulos, así que repite el problema de los getters superficiales a un coste mayor.',
    ],
    rule: 'Trabajo abierto: mapéalo, prioriza y adapta el plan a medida que descubres cosas.',
  },
  'i-review-fixed-chain': {
    scenario:
      'Tu paso de review de PRs ejecuta un agente autónomo que decide en cada PR qué comprobaciones hacer. Todas las PRs necesitan las mismas cuatro: corrección, seguridad, cobertura de tests y compatibilidad de la API. Los logs muestran que el agente se saltó la comprobación de seguridad en el 23% de las PRs y ejecutó las comprobaciones en un orden distinto cada vez, así que las reviews son difíciles de comparar.',
    ask: '¿Qué estrategia de descomposición encaja mejor con este flujo de trabajo?',
    options: [
      'Una cadena de prompts fija: un paso centrado en cada comprobación, en el mismo orden en todas las PRs, y luego un paso que combina los hallazgos.',
      'Mantener el agente adaptativo, pero indicar en su system prompt que la comprobación de seguridad es obligatoria y debe ejecutarse siempre primero.',
      'Hacer que el agente redacte un plan de investigación nuevo para cada PR, y que un segundo agente apruebe ese plan antes de que empiece la review.',
      'Ejecutar las cuatro comprobaciones en un único prompt combinado para que el modelo vea todos los aspectos a la vez y decida qué importa más en cada PR.',
    ],
    why: [
      'Los pasos son predecibles e idénticos en cada PR. Ese es el caso del prompt chaining: una secuencia fija de pasadas centradas que siempre se ejecuta.',
      'Una instrucción en el prompt sigue dejando la secuencia en manos del modelo, así que los saltos son menos frecuentes, pero no hay garantía de que desaparezcan.',
      'La descomposición dinámica es para investigaciones abiertas. Aquí el plan se conoce de antemano, así que planificar solo añade coste y variabilidad.',
      'Un único prompt combinado diluye la atención y sigue dejando que el modelo decida qué saltarse.',
    ],
    rule: 'Mismos pasos siempre → prompt chaining. Investigación abierta → plan dinámico.',
  },
  'i2-chain-plus-adaptive-investigation': {
    scenario:
      'Tu review de PRs es una cadena fija: corrección, seguridad, tests y compatibilidad de la API. Funciona bien, pero en el 4% de las PRs el paso de seguridad reporta una pista que no puede resolver, como "este endpoint nuevo podría saltarse la comprobación de tenant", que exige rastrear llamadores y middleware entre servicios. Nadie puede predecir qué ficheros necesitará ese rastreo.',
    ask: '¿Cómo deberías gestionar estos casos?',
    options: [
      'Añadir a la cadena un paso fijo de "rastrear todos los llamadores entre servicios", para que todas las PRs reciban la misma investigación profunda entre servicios.',
      'Sustituir la cadena por un agente adaptativo que decida en cada PR qué comprobaciones ejecutar y con qué profundidad investigar cada una.',
      'Mantener la cadena y pasar las pistas sin resolver a una investigación adaptativa que planifica sus siguientes pasos según lo que encuentra.',
      'Cargar el repositorio entero en el contexto del paso de seguridad, para que pueda resolver cualquier pista entre servicios dentro de ese único paso.',
    ],
    why: [
      'Un rastreo profundo y abierto en cada PR desperdicia esfuerzo en el 96% que no lo necesita, y un paso fijo no puede seguir pistas que nadie puede predecir.',
      'Las comprobaciones rutinarias son predecibles; renunciar a la cadena vuelve a traer comprobaciones saltadas y reviews que no se pueden comparar.',
      'El prompt chaining encaja con la review predecible de varios aspectos; la descomposición dinámica encaja con la investigación abierta que se adapta a los hallazgos intermedios. Usa cada una donde encaja.',
      'Un contexto enorme diluye la atención y sigue sin darle al paso ninguna forma de planificar y seguir la pista.',
    ],
    rule: 'Cadena fija para las comprobaciones rutinarias; investigación adaptativa para las pistas abiertas.',
  },
  'i2-integration-pass-interfaces': {
    scenario:
      'Tu review ejecuta una pasada centrada en cada fichero. Se le escapó un bug en el que `getRate()` en `fx.ts` empezó a devolver null mientras dos llamadores en otros ficheros seguían haciendo cálculos con el resultado. Un compañero propone dar a cada pasada por fichero el contenido completo de los 26 ficheros modificados "para que cada pasada vea el panorama completo".',
    ask: '¿Cómo deberías valorar esta propuesta?',
    options: [
      'Aceptarla: con los 26 ficheros en cada pasada, cada una puede rastrear el flujo de datos entre ficheros sin dejar de centrarse en su propio fichero.',
      'Rechazarla; mantener las pasadas por fichero centradas y añadir una pasada de integración aparte que compruebe las interfaces cambiadas frente a sus llamadores.',
      'Rechazarla y eliminar las pasadas por fichero, con una única review combinada de los 26 ficheros para que los problemas entre ficheros estén siempre a la vista.',
      'Aceptarla solo para PRs de menos de 10 ficheros, y pedir a los autores de PRs más grandes que las dividan para que las pasadas con contexto completo sigan siendo manejables.',
    ],
    why: [
      'Meter todos los ficheros en cada pasada vuelve a traer la dilución de la atención, el problema que las pasadas por fichero debían evitar, y multiplica el coste.',
      'Las pasadas por fichero encuentran problemas locales; una pasada de integración aparte, centrada en el flujo de datos entre ficheros (firmas y valores de retorno cambiados frente a sus llamadores), detecta este tipo de bug.',
      'Una única pasada combinada es justo lo que provoca una profundidad desigual y bugs que se escapan en PRs grandes.',
      'Esto traslada la carga a los autores y sigue fallando en las PRs grandes, que son las que más necesitan comprobaciones entre ficheros.',
    ],
    rule: 'Pasadas por fichero para los problemas locales, más una pasada de integración para el flujo entre ficheros.',
  },
  'i2-ci-ignores-user-level-rules': {
    scenario:
      'Las reglas de review del equipo dicen que se ignore el código generado en `gen/` y que se marquen las queries sin filtro por `tenant_id`. Cuando la tech lead lanza una review en local, Claude sigue ambas reglas. El job de CI (`claude -p` en un runner limpio) y las reviews en local de todos sus compañeros las ignoran. Todas las ejecuciones usan la misma rama y el mismo modelo.',
    ask: '¿Cuál es la causa más probable?',
    options: [
      'Las reglas están en el ~/.claude/CLAUDE.md de nivel de usuario de la tech lead, que solo cargan sus sesiones y que no está en el repo.',
      'Claude Code ignora los ficheros CLAUDE.md cuando se ejecuta con -p, así que las reviews lanzadas desde CI nunca ven las reglas escritas del proyecto.',
      'Las reglas están en el CLAUDE.md raíz, pero una regla sobre gen/ solo tiene efecto si está en un CLAUDE.md dentro del directorio gen/.',
      'El runner limpio de CI no tiene historial de sesiones, así que Claude aún no ha aprendido las reglas que la tech lead le enseñó en sesiones anteriores.',
    ],
    why: [
      'Las instrucciones de nivel de usuario solo se aplican a ese usuario y no se comparten por control de versiones, lo que encaja exactamente con quién recibe las reglas y quién no.',
      'El modo print sigue cargando CLAUDE.md; es la forma en que Claude Code invocado desde CI obtiene el contexto del proyecto. Las ejecuciones interactivas de los compañeros también fallan, así que -p no es la causa.',
      'Un CLAUDE.md raíz se aplica a todo el proyecto, gen/ incluido, y esto no explicaría por qué funcionan las ejecuciones de la tech lead.',
      'Las sesiones no aprenden reglas con el tiempo; las instrucciones persistentes vienen de los ficheros CLAUDE.md, no de conversaciones anteriores.',
    ],
    rule: '¿Las reglas solo funcionan para una persona? Comprueba si están en el CLAUDE.md de nivel de usuario.',
  },
  'i2-rules-dir-split-ownership': {
    scenario:
      'Tu CLAUDE.md raíz de 1600 líneas contiene los criterios de review de CI (responsabilidad de seguridad), los estándares de testing (de QA) y las convenciones de despliegue (de plataforma). Las ediciones chocan una y otra vez, un merge reciente borró sin avisar dos criterios de review y nadie sabe qué equipo es dueño de cada párrafo.',
    ask: '¿Cuál es la forma más mantenible de organizar estas instrucciones?',
    options: [
      'Mantener el fichero único, añadir un índice y un comentario con el responsable encima de cada sección, y exigir que los tres equipos aprueben las ediciones.',
      'Mover la sección de cada equipo a los ~/.claude/CLAUDE.md de sus miembros, para que cada equipo mantenga su parte de forma independiente.',
      'Mover cada sección a un CLAUDE.md dentro de la carpeta de ese equipo (security/, qa/, platform/), para que cada equipo edite solo su fichero.',
      'Dividir el fichero en ficheros temáticos en .claude/rules/, como review-criteria.md, testing.md y deployment.md, cada uno con un responsable.',
    ],
    why: [
      'Los comentarios y las aprobaciones no eliminan los conflictos de un único fichero monolítico que tres equipos editan constantemente.',
      'Los ficheros de nivel de usuario no se comparten por control de versiones, así que CI y el resto del equipo perderían estas instrucciones.',
      'Los CLAUDE.md de directorio solo se aplican al trabajar en ese directorio, así que los criterios de review de security/ no se aplicarían al código de otras carpetas.',
      '.claude/rules/ es la alternativa documentada a un CLAUDE.md monolítico: ficheros acotados por tema, más fáciles de asignar a un responsable y de revisar por separado.',
    ],
    rule: 'Divide un CLAUDE.md grande en ficheros temáticos en .claude/rules/.',
  },
  'i2-personal-skill-variant': {
    scenario:
      'CI y los desarrolladores usan la misma skill de proyecto `.claude/skills/pr-review/SKILL.md`. Un desarrollador la editó para que también reporte nits de nombres y formato, que a él le gusta ver en local, y el cambio se mergeó. Al día siguiente, la tasa de descartes de la review de CI subió del 18% al 47%. Él sigue queriendo esos nits en sus propias reviews.',
    ask: '¿Cuál es la mejor forma de resolverlo?',
    options: [
      'Mantener su edición y añadir una línea a SKILL.md que indique a Claude que se salte los nits de nombres y formato siempre que se ejecute dentro de CI.',
      'Mantener su edición y que el script de CI oculte los comentarios de nits en una sección plegada, que los desarrolladores despliegan solo si quieren.',
      'Revertir la edición y mover sus reglas de nits al CLAUDE.md del proyecto, que es un sitio más adecuado para las expectativas de estilo del equipo.',
      'Revertir el cambio en la skill de proyecto y que él cree una variante personal con otro nombre, como pr-review-nits, en ~/.claude/skills/.',
    ],
    why: [
      'Esto hace que la skill compartida dependa de que el modelo detecte su entorno, y la review en local de cada compañero sigue recibiendo los nits.',
      'Los nits se siguen ejecutando y siguen consumiendo atención; ocultar una salida con muchos falsos positivos no la saca de la skill compartida.',
      'El CLAUDE.md del proyecto se comparte con todo el mundo, así que los nits llegarían ahora a CI y a todas las sesiones, lo que empeora el problema.',
      'Una variante personal en ~/.claude/skills/ con un nombre distinto personaliza el flujo de un desarrollador sin afectar a sus compañeros ni a CI.',
    ],
    rule: 'Los ajustes personales van en una skill renombrada en ~/.claude/skills/, no en la compartida.',
  },
  'i2-testgen-procedure-to-skill': {
    scenario:
      'Para guiar el job nocturno de generación de tests, el equipo añadió al CLAUDE.md raíz un procedimiento de 250 líneas (elegir módulos, mapear fixtures, escribir tests, ejecutarlos). Desde entonces, la review de PRs de CI, que también ejecuta Claude Code en este repo, añade secciones de "tests sugeridos" a sus comentarios y tarda un 40% más, y las sesiones interactivas se ponen a escribir tests sin que nadie se lo pida.',
    ask: '¿Cuál es la mejor reestructuración?',
    options: [
      'Mantener el procedimiento en CLAUDE.md y añadir una línea que diga que solo se aplica a la generación nocturna de tests y nunca a las reviews.',
      'Mover el procedimiento a una skill de proyecto en .claude/skills/ que invoque el job nocturno, y dejar los estándares universales en CLAUDE.md.',
      'Mover el procedimiento al ~/.claude/CLAUDE.md del runner nocturno, para que solo el job de generación de tests cargue esas instrucciones.',
      'Mover el procedimiento a .claude/rules/test-generation.md sin frontmatter de rutas, para que viva en su propio fichero pero siga funcionando.',
    ],
    why: [
      'El procedimiento se sigue cargando en todas las sesiones, y si se aplica o no queda a la interpretación del modelo, que ya está fallando.',
      'Las skills son para flujos de trabajo específicos de una tarea y bajo demanda; CLAUDE.md es para estándares universales que se cargan siempre. Las reviews y las sesiones interactivas dejan de ver el procedimiento.',
      'La configuración de nivel de usuario en un runner no está versionada ni compartida, así que el procedimiento se vuelve invisible para el equipo y se pierde cuando se reconstruye el runner.',
      'Un fichero de rules sin frontmatter de rutas se sigue cargando en todas las sesiones, así que la review sigue recibiendo el procedimiento.',
    ],
    rule: 'Los flujos específicos de una tarea van en skills; CLAUDE.md contiene los estándares que se aplican siempre.',
  },
  'c-ci-json-schema': {
    scenario:
      'Un job de CI ejecuta claude -p para revisar PRs y luego analiza la respuesta en texto libre con regex para encontrar problemas bloqueantes. El parser se rompe cada pocos días.',
    ask: '¿Qué debería cambiar el arquitecto?',
    options: [
      'Indicar en el prompt que responda solo con JSON e incluir un ejemplo completo del objeto esperado.',
      'Cambiar a --output-format stream-json y parsear cada evento según llega del stream.',
      'Pasar la review en texto libre a una segunda llamada al modelo cuyo único trabajo sea convertirla a JSON.',
      'Ejecutar claude -p con --output-format json y --json-schema, y leer la review del campo structured_output.',
    ],
    why: [
      'Mejor, pero sigue sin estar garantizado.',
      'Emite eventos en streaming; no le da un schema a la review.',
      'Añade coste, latencia y otro punto de fallo.',
      'La CLI devuelve una salida que cumple el schema y que el pipeline puede leer directamente.',
    ],
    rule: 'Las máquinas consumen schemas, no prosa.',
  },
  'i-rerun-duplicates': {
    scenario:
      'Tu job de CI ejecuta claude -p en cada push a una PR abierta y publica cada hallazgo como comentario inline. Cuando un desarrollador sube un arreglo, la siguiente ejecución vuelve a publicar los mismos 12 comentarios, incluidos problemas ya corregidos, junto a 2 nuevos. Los desarrolladores han empezado a silenciar al bot.',
    ask: '¿Cuál es la solución más eficaz?',
    options: [
      'Añadir el flag --skip-seen-findings al comando claude -p para que recuerde qué comentarios ya ha publicado en esta PR.',
      'Ejecutar la review solo una vez, al abrir la PR, y saltarse los pushes posteriores para que ningún comentario pueda publicarse dos veces.',
      'Pedir a la review que reporte solo los problemas de los que esté muy segura, para que se publiquen menos comentarios en cada push a la PR.',
      'Incluir en el prompt los hallazgos de la ejecución anterior y pedir a Claude que reporte solo los problemas nuevos o aún sin resolver.',
    ],
    why: [
      'Claude Code no tiene ese flag. Evitar duplicados pasa por dar los hallazgos anteriores como contexto.',
      'Saltarse los pushes posteriores significa que los bugs introducidos por commits posteriores nunca se revisan.',
      'Filtrar por confianza no evita las repeticiones. Los mismos hallazgos seguros se volverían a publicar en cada push.',
      'Cada ejecución empieza sin memoria de las reviews anteriores. Pasarle los hallazgos previos le permite saltarse los problemas corregidos y evitar comentarios duplicados.',
    ],
    rule: 'En las re-ejecuciones, pasa los hallazgos previos y pide solo problemas nuevos o sin resolver.',
  },
  'i2-claude-md-test-standards': {
    scenario:
      'Tu job nocturno ejecuta `claude -p "Write tests for the modules changed today"`. Los revisores rechazan el 55% de los tests generados: prueban getters triviales, solo comprueban que se llamó a los mocks y construyen pedidos a mano en lugar de usar las fixtures existentes `order_factory` y `db_session`.',
    ask: '¿Cuál es la forma más eficaz de mejorar la calidad de los tests generados?',
    options: [
      'Pasar a claude -p --test-standards con la ruta a la guía de testing del equipo, para que el job la aplique a cada test que escriba.',
      'Documentar en el CLAUDE.md del proyecto qué hace valioso a un test, qué hay que evitar y qué fixtures existen y cómo usarlas.',
      'Pedir el triple de tests por módulo y luego hacer que un script conserve solo los tests de más de 15 líneas, que suelen ser más completos.',
      'Ejecutar el job en modo interactivo cada noche para que un ingeniero oriente a Claude hacia tests valiosos y las fixtures correctas mientras trabaja.',
    ],
    why: [
      'claude -p no tiene ningún flag --test-standards. El contexto del proyecto para Claude Code invocado desde CI viene de CLAUDE.md.',
      'CLAUDE.md es la forma en que Claude Code invocado desde CI obtiene el contexto del proyecto. Documentar qué hace valioso a un test y qué fixtures existen reduce la salida de poco valor.',
      'La longitud no es valor; esto paga por más salida y sigue ignorando las fixtures.',
      'Un job nocturno de CI tiene que ejecutarse desatendido; dirigirlo a mano no escala y anula la automatización.',
    ],
    rule: 'Pon los estándares de testing y las fixtures en CLAUDE.md para que la generación de tests en CI los use.',
  },
  'i2-existing-tests-in-context': {
    scenario:
      'Tu paso de CI ejecuta `claude -p` con solo el fichero fuente modificado en contexto y pide los casos de test que faltan. Los revisores ven que el 40% de los tests sugeridos repiten escenarios que la suite ya cubre con otros nombres, como un segundo test para redondear un descuento de medio céntimo.',
    ask: '¿Cuál es la solución más eficaz?',
    options: [
      'Incluir en contexto los ficheros de test existentes del módulo y pedir a Claude que proponga solo escenarios que no estén ya cubiertos.',
      'Añadir al prompt "Nunca sugieras un test que ya exista en el repositorio", manteniendo solo el fichero modificado en contexto.',
      'Deduplicar tras la generación descartando cualquier test sugerido cuyo nombre de función coincida con un test existente de la suite.',
      'Añadir el flag --dedupe-tests al comando claude -p, para que Claude Code compare automáticamente sus sugerencias con la suite.',
    ],
    why: [
      'Claude solo puede evitar los duplicados que ve. Con los ficheros de test existentes en contexto, puede sugerir escenarios realmente nuevos.',
      'La instrucción no se puede cumplir: Claude no tiene forma de saber qué tests existen sin verlos.',
      'Los duplicados usan nombres distintos, así que comparar nombres de función no los detecta.',
      'Claude Code no tiene ningún flag --dedupe-tests. Evitar duplicados pasa por proporcionar los tests existentes como contexto.',
    ],
    rule: 'Dale a la generación de tests los tests existentes para que solo sugiera escenarios nuevos.',
  },
  'i2-reviewer-without-transcript': {
    scenario:
      'Tu pipeline ejecuta una llamada `claude -p` para implementar un ticket y otra distinta para revisar el diff. Para darle al revisor "contexto completo", el script pega en el prompt de review el transcript entero del implementador, razonamiento incluido. Desde ese cambio, el revisor aprueba el 95% de los diffs y las personas vuelven a encontrar bugs sutiles en 1 de cada 5 PRs.',
    ask: '¿Qué deberías cambiar?',
    options: [
      'Mantener el transcript pero añadir "Asume que el implementador cometió errores y cuestiona cada decisión" al principio del prompt.',
      'Reanudar la propia sesión del implementador para el paso de review, de modo que el revisor recuerde todas las decisiones tomadas.',
      'Dar al revisor el diff, el ticket y los criterios de review, pero nada del transcript ni del razonamiento del implementador.',
      'Mantener el transcript y activar extended thinking para el revisor, para que razone más a fondo antes de aprobar cada cambio.',
    ],
    why: [
      'Una instrucción de rol escéptico no saca del contexto el razonamiento del implementador; el revisor sigue tendiendo a adoptarlo.',
      'Reanudar la sesión que generó el código es simple autorrevisión: el modelo conserva el razonamiento que justificó los bugs.',
      'El aislamiento del contexto de sesión es lo que hace eficaz a una segunda instancia. Sin el razonamiento del generador, juzga el diff por sus propios méritos.',
      'Pensar más encima del razonamiento del implementador sigue anclándose en él; la independencia importa más que la profundidad.',
    ],
    rule: 'Un revisor independiente recibe el diff y los requisitos, no el razonamiento del autor.',
  },
  'i2-shared-review-criteria-claude-md': {
    scenario:
      'Tres jobs de CI invocan Claude Code: review de PRs, generación de tests y una comprobación de documentación. El YAML de cada job incluye su propia copia de las reglas de arquitectura ("la entrada solo se valida en los handlers de la API"). Las copias se han desincronizado: la del job de review está desactualizada y marca validaciones ausentes en helpers internos, y el 45% de esos comentarios se descartan.',
    ask: '¿Cuál es la solución más mantenible?',
    options: [
      'Actualizar la copia de las reglas del job de review y añadir un check de CI que falle cuando las tres copias embebidas no coincidan.',
      'Poner las reglas en el ~/.claude/CLAUDE.md de cada desarrollador, para que todo el mundo trabaje con la misma versión de las reglas de arquitectura.',
      'Fusionar los tres jobs en un único prompt largo de claude -p, para que las reglas de arquitectura solo haya que escribirlas una vez.',
      'Mover las reglas al CLAUDE.md del proyecto en el repositorio, para que cada job de CI y cada sesión local carguen una única copia versionada.',
    ],
    why: [
      'Esto mantiene tres copias y añade maquinaria para vigilarlas, en lugar de tener una única fuente.',
      'El CLAUDE.md de nivel de usuario no se comparte por control de versiones y no existe en los runners de CI, así que los jobs de CI nunca lo verían.',
      'Combinar jobs no relacionados en un único prompt diluye la atención y acopla sus calendarios, sin resolver dónde debe vivir el contexto compartido.',
      'El CLAUDE.md del proyecto es el mecanismo para dar a Claude Code invocado desde CI el contexto del proyecto, como los criterios de review, versionado junto con el código.',
    ],
    rule: 'Los criterios de review compartidos viven en un único sitio: el CLAUDE.md del proyecto.',
  },
  'i-disable-noisy-category': {
    scenario:
      'Tu bot de review reporta hallazgos en cinco categorías. Los hallazgos de seguridad y de bugs se aceptan el 90% de las veces, pero los de "rendimiento" se descartan el 75% de las veces. Una encuesta muestra que los desarrolladores ya pasan por encima de todos los comentarios del bot; el mes pasado se ignoraron dos avisos reales de inyección SQL.',
    ask: '¿Cuál es el paso inmediato más eficaz?',
    options: [
      'Mantener las cinco categorías pero añadir una etiqueta de severidad a cada comentario, para que se vea qué hallazgos merecen atención primero.',
      'Exigir a los desarrolladores que respondan a cada comentario del bot explicando por qué lo descartan antes de permitir el merge de la PR.',
      'Pasar la review a un modelo más grande que entienda mejor los trade-offs de rendimiento, y mantener activas las cinco categorías.',
      'Desactivar por ahora la categoría de rendimiento para recuperar la confianza, mientras reescribes sus criterios y los pruebas con PRs anteriores.',
    ],
    why: [
      'Las etiquetas no eliminan el ruido. La categoría con muchos falsos positivos sigue enseñando a los desarrolladores a ignorar el bot.',
      'Esto traslada la carga a los desarrolladores y ralentiza los merges sin arreglar el origen de los falsos positivos.',
      'Un modelo más grande no arregla unos criterios poco claros, y mientras tanto la categoría ruidosa sigue minando la confianza.',
      'Una categoría con muchos falsos positivos mina la confianza en las precisas. Desactivarla temporalmente protege los hallazgos de seguridad y de bugs mientras la mejoras.',
    ],
    rule: 'Pausa las categorías con muchos falsos positivos para que no arruinen la confianza en las buenas.',
  },
  'i-explicit-criteria': {
    scenario:
      'Los desarrolladores descartan el 62% de los comentarios de tu bot de review de PRs. La mayoría de los descartados tratan de nombres, estilo menor y patrones que el código usa a propósito. El prompt de review dice actualmente: "Sé conservador y reporta solo los problemas de los que estés muy seguro". También se están escapando algunos bugs reales.',
    ask: '¿Cuál es el cambio más eficaz en el prompt?',
    options: [
      'Endurecer la advertencia: decirle a Claude que cada falso positivo hace perder tiempo a los desarrolladores y que debe ser extremadamente conservador.',
      'Enumerar qué problemas reportar (bugs de lógica, fallos de seguridad, manejo de errores roto) y cuáles ignorar (estilo, nombres, patrones locales).',
      'Pedir a Claude que puntúe su confianza del 1 al 10 en cada hallazgo y publicar solo los que puntúe con 8 o más.',
      'Ejecutar la review tres veces y publicar solo los hallazgos que aparezcan en al menos dos de las tres ejecuciones, para filtrar el ruido.',
    ],
    why: [
      'Instrucciones vagas como "sé conservador" no le dicen al modelo qué hallazgos son ruido, así que la precisión apenas mejora.',
      'Las categorías explícitas de qué reportar y qué ignorar mejoran la precisión mucho más que la cautela genérica, y mantienen los bugs reales dentro del alcance.',
      'La confianza autodeclarada está mal calibrada. Los comentarios de estilo pueden puntuar alto y los bugs sutiles, bajo.',
      'La votación por consenso oculta bugs reales que solo se detectan en algunas ejecuciones, mientras que el ruido de estilo repetido sigue colándose.',
    ],
    rule: 'Sustituye "sé conservador" por categorías explícitas de qué reportar y qué ignorar.',
  },
  'i2-comment-contradiction-criterion': {
    scenario:
      'La categoría de documentación de tu bot de review le pide a Claude que "compruebe que los comentarios del código son precisos". Los desarrolladores descartan el 71% de estos hallazgos, que sobre todo dicen que un docstring "podría ser más detallado" u omite un parámetro. El 29% que aceptan son discrepancias reales, como un docstring que promete `None` en un fallo de caché mientras el código lanza `KeyError`.',
    ask: '¿Cuál es el cambio más eficaz en las instrucciones de esta categoría?',
    options: [
      'Decirle a Claude que sea conservador en esta categoría y que reporte solo los problemas de comentarios de los que esté muy seguro.',
      'Desactivar la categoría de documentación para siempre, ya que la mayoría de sus hallazgos se descartan y minan la confianza en el bot.',
      'Marcar un comentario solo cuando el comportamiento que afirma contradiga lo que el código hace realmente; ignorar completitud o estilo.',
      'Pedir a Claude que añada una puntuación de confianza del 1 al 10 a cada hallazgo sobre comentarios, y publicar solo los de 9 o más.',
    ],
    why: [
      '"Sé conservador" no dice qué hallazgos sobre comentarios son ruido, así que apenas mejora la precisión en comparación con unos criterios explícitos.',
      'El 29% aceptado son discrepancias reales de comportamiento. Eliminar la categoría para siempre tira ese valor en lugar de arreglar los criterios.',
      'Un criterio explícito (el comportamiento afirmado contradice el comportamiento real) apunta exactamente a los hallazgos que los desarrolladores aceptan y excluye el ruido de completitud y redacción.',
      'La confianza autodeclarada está mal calibrada: el modelo puede estar muy seguro de que un docstring está incompleto. Filtra por certeza, no por tipo de problema.',
    ],
    rule: 'Define exactamente qué reportar: comentarios cuyas afirmaciones contradicen el código.',
  },
  'i2-reenable-category-proposal': {
    scenario:
      'Hace tres semanas desactivaste la categoría de manejo de errores después de que los desarrolladores descartaran el 70% de sus hallazgos. Tu análisis: los descartados señalaban bloques catch que registran en el log y relanzan, como exige la convención del equipo; los aceptados señalaban excepciones silenciadas dentro de transacciones de pago. Un compañero propone reactivarla con: "Reporta solo los problemas de manejo de errores de los que estés muy seguro de que son reales".',
    ask: '¿Cómo deberías valorar esta propuesta?',
    options: [
      'Aceptarla: el matiz de confianza permite a Claude filtrar sus propios hallazgos débiles, que es lo que causó los descartes.',
      'Mantener la categoría desactivada para siempre, ya que los desarrolladores han aprendido a desconfiar de ella y reactivarla pone en riesgo al bot.',
      'Aceptarla y añadir un botón para que los desarrolladores valoren cada comentario de manejo de errores y así ajustar el prompt con el tiempo.',
      'Rechazar la redacción; escribir criterios de qué reportar/ignorar a partir de tu análisis (silenciar vs. registrar y relanzar) y probarlos antes con PRs anteriores.',
    ],
    why: [
      'Los hallazgos descartados no eran de baja confianza; eran el tipo de problema equivocado. Un matiz de confianza no le dice a Claude que registrar y relanzar es aceptable.',
      'Desactivar es una medida temporal mientras se mejora el prompt. Los hallazgos aceptados detectaron bugs reales en el código de pagos, así que merece la pena recuperar la categoría.',
      'Las valoraciones recogen más feedback, pero vuelven a activar hoy los mismos criterios ruidosos, lo que sigue minando la confianza en las categorías precisas.',
      'Unos criterios categóricos concretos, sacados de lo que los desarrolladores aceptaron y descartaron, arreglan la precisión. Comprobarlos con PRs anteriores antes de reactivar protege la confianza.',
    ],
    rule: 'Reactiva una categoría ruidosa solo con criterios explícitos de qué reportar/ignorar, probados antes.',
  },
  'i2-severity-code-examples': {
    scenario:
      'Tu pipeline bloquea el merge siempre que un hallazgo se etiqueta como "critical". El prompt define la severidad solo con adjetivos ("critical: problemas graves"). El mes pasado, el mismo acceso a un índice de array sin comprobar se etiquetó como critical en una PR y como low en otra, y los tech leads anularon el 40% de los merges bloqueados por no ser realmente críticos.',
    ask: '¿Cómo deberías hacer coherente la clasificación de severidad?',
    options: [
      'Definir cada nivel de severidad con criterios explícitos y un ejemplo de código breve de un hallazgo que pertenezca a ese nivel.',
      'Añadir al system prompt la instrucción "Sé coherente y mantente bien calibrado siempre que asignes un nivel de severidad".',
      'Clasificar cada hallazgo tres veces y quedarse con la etiqueta que más se repita, para filtrar las etiquetas puntuales.',
      'Dejar que los desarrolladores cambien ellos mismos la severidad de cualquier hallazgo bloqueante, y dejar de bloquear merges por hallazgos critical.',
    ],
    why: [
      'Unos criterios concretos con un ejemplo de código para cada nivel dan al modelo un punto de referencia fijo, que es como se consigue una clasificación coherente.',
      'Una petición genérica de coherencia no le dice al modelo dónde están las fronteras entre niveles.',
      'La votación por mayoría solo estabiliza la salida de una regla poco clara. Una definición vaga puede seguir produciendo la etiqueta equivocada, solo que de forma más consistente.',
      'Esto traslada el trabajo a los desarrolladores y elimina el bloqueo en lugar de arreglar la clasificación.',
    ],
    rule: 'Fija cada nivel de severidad con criterios explícitos y un ejemplo de código.',
  },
  'i-fewshot-format': {
    scenario:
      'Tu bot de review publica comentarios de PR en texto libre. El prompt tiene un párrafo detallado sobre lo que debe contener cada hallazgo: ubicación exacta, problema, severidad y un arreglo sugerido. Aun así, el 30% de los comentarios dan ubicaciones vagas como "en el handler", muchos omiten el arreglo y la severidad aparece como High, P1 o critical.',
    ask: '¿Cuál es la forma más eficaz de conseguir hallazgos consistentes?',
    options: [
      'Añadir 2–4 hallazgos de ejemplo en el formato objetivo exacto, incluido un caso ambiguo, cada uno con ubicación, problema, severidad y arreglo.',
      'Reescribir el párrafo de formato en mayúsculas y repetirlo al final del prompt, para que el modelo no pueda pasarlo por alto de ninguna manera.',
      'Añadir 25 hallazgos de ejemplo que cubran todos los tipos de problema que el bot puede reportar, para que el modelo haya visto una plantilla de cada caso.',
      'Mantener el prompt y añadir un paso de postprocesado que descarte los comentarios incompletos y unifique las etiquetas de severidad en una sola escala.',
    ],
    why: [
      'Cuando unas instrucciones detalladas siguen dando una salida inconsistente, unos pocos ejemplos bien elegidos son la forma más eficaz de mostrar el formato exacto y el nivel de detalle.',
      'Unas instrucciones más llamativas repiten lo que el modelo ya está ignorando. Las descripciones en prosa se interpretan de forma inconsistente.',
      'Demasiados ejemplos añaden coste en tokens y empujan al modelo a copiar plantillas en lugar de generalizar.',
      'El postprocesado puede descartar o reetiquetar comentarios, pero no puede crear un arreglo que falta ni una ubicación precisa.',
    ],
    rule: 'Cuando las instrucciones dan una salida inconsistente, muestra 2–4 ejemplos del formato.',
  },
  'i2-fewshot-branch-coverage': {
    scenario:
      'Antes de generar tests, tu job de CI pide a Claude que liste el comportamiento sin testear de cada módulo modificado. A menudo marca funciones como "cubiertas" cuando los tests solo ejercitan una rama: `apply_discount` se marcó como cubierta aunque ningún test llega a su rama de cupón caducado. El prompt ya dice "ten en cuenta todas las ramas y casos límite".',
    ask: '¿Cuál es el cambio de prompt más eficaz?',
    options: [
      'Reescribir la instrucción en mayúsculas y repetirla al final del prompt, para que el requisito de las ramas no pueda pasarse por alto.',
      'Pedir a Claude una puntuación de confianza de que cada función está totalmente cubierta, y generar tests para todas las que puntúen por debajo de 7.',
      'Añadir unos pocos ejemplos de funciones cuyos tests solo llegan a algunas ramas, mostrando el hueco encontrado y por qué la cobertura de líneas no basta.',
      'Hacer que Claude marque una función como no cubierta salvo que un test del mismo fichero la llame por su nombre, para que nada se marque como cubierto por error.',
    ],
    why: [
      'Repetir con más énfasis una instrucción en prosa no le enseña al modelo cómo es un hueco a nivel de rama.',
      'La confianza autodeclarada está mal calibrada, y el modelo ya está seguro de las funciones que marca erróneamente como cubiertas.',
      'Los ejemplos few-shot son la forma más eficaz de demostrar un caso ambiguo como un hueco de cobertura a nivel de rama, junto con el razonamiento que hay que aplicar.',
      'Una regla basada en nombres es una heurística burda: reporta como huecos funciones bien testeadas y sigue sin decir qué rama falta.',
    ],
    rule: 'Usa ejemplos para mostrar casos ambiguos, como una rama a la que los tests nunca llegan.',
  },
  'i2-fewshot-generalize-injection': {
    scenario:
      'Tu prompt de review enumera 12 APIs de consulta inseguras (como `cursor.execute` con f-strings y `Model.objects.raw`). El bot las detecta de forma fiable, pero el último trimestre se le escaparon tres inyecciones SQL: una a través del `where_raw()` de un query builder nuevo y dos a través de un helper interno que concatena parámetros de la petición.',
    ask: '¿Cómo deberías mejorar la detección de inyecciones que pasan por APIs que no están en la lista?',
    options: [
      'Añadir 2–3 ejemplos seguros e inseguros que expliquen que el problema es una entrada no confiable que llega a un string de consulta sin parámetros.',
      'Ampliar la lista con todos los métodos de consulta raw de los ORM y query builders que el equipo usa hoy o pueda adoptar más adelante.',
      'Decirle a Claude que trate cualquier string que se pase a una función de base de datos como posible inyección y lo marque para revisión.',
      'Pasar la review a un modelo más grande con una ventana de contexto más larga, para que recuerde por sí mismo más APIs de base de datos inseguras.',
    ],
    why: [
      'Los ejemplos few-shot que muestran el razonamiento de fondo permiten al modelo generalizar el criterio a APIs nuevas, en lugar de detectar solo los casos de la lista.',
      'Una lista más larga sigue siendo una lista. Cualquier librería nueva o helper interno queda fuera de ella, que es justo como se colaron estas inyecciones.',
      'Marcar todos los strings de consulta enterraría los problemas reales entre falsos positivos, incluidas las llamadas parametrizadas seguras.',
      'El tamaño del modelo no cambia la instrucción. Un prompt construido sobre una lista fija sigue empujando al modelo a buscar coincidencias con esa lista.',
    ],
    rule: 'El razonamiento few-shot generaliza a patrones nuevos; una lista fija solo cubre lo que contiene.',
  },
  'i2-fewshot-placeholder-secrets': {
    scenario:
      'Tu categoría de seguridad marcaba cualquier string con pinta de clave, incluidos placeholders como `sk_test_XXXX` en fixtures, y el 64% de sus hallazgos se descartaba. Añadiste la regla "ignora los secretos en ficheros de test". Los descartes bajaron, pero la semana pasada el bot pasó por alto una API key real de producción que alguien había pegado en `tests/helpers/payments.py`.',
    ask: '¿Cuál es la forma más eficaz de reducir los falsos positivos sin pasar por alto secretos reales?',
    options: [
      'Sustituir la regla por una lista de todas las rutas de fichero donde se permiten claves placeholder, y decirle a Claude que se salte solo esas rutas.',
      'Añadir 2–4 ejemplos que contrasten claves placeholder con claves de aspecto real, explicando en cada uno por qué es o no un secreto real.',
      'Quitar la regla de ficheros de test y pedir a Claude que marque solo los secretos que esté muy seguro de que son credenciales reales de producción.',
      'Añadir 30 ejemplos de los strings placeholder que se usan en todo el código, para que Claude haya visto todos los formatos que debe ignorar.',
    ],
    why: [
      'Una allowlist de rutas es frágil: sigue saltándose cualquier clave real que acabe en un fichero de la lista, y se rompe cuando los ficheros se mueven.',
      'Los ejemplos few-shot que contrastan patrones aceptables con problemas reales, con su razonamiento, enseñan la distinción en sí, así que Claude puede generalizar a ficheros y formatos nuevos.',
      '"Muy seguro" es un filtro vago. No le dice a Claude qué separa un placeholder de una clave real.',
      'Decenas de ejemplos casi idénticos añaden tokens y empujan al modelo a buscar strings conocidos en lugar de juzgar casos nuevos; 2–4 contrastes bien elegidos funcionan mejor.',
    ],
    rule: 'Muestra casos aceptables frente a reales, con su razonamiento, para que el criterio generalice.',
  },
  'i2-enum-other-detail': {
    scenario:
      'Tu schema de hallazgos tiene `category` como enum: bug, security, performance, style. Los dashboards construidos sobre él deciden dónde ajustas los prompts a continuación. Una auditoría muestra que las infracciones de cabeceras de licencia, los problemas de accesibilidad y los riesgos de tests flaky se están registrando como "style" o "bug", así que ambas categorías parecen más ruidosas de lo que realmente son.',
    ask: '¿Cómo deberías cambiar el schema?',
    options: [
      'Convertir category en un string de texto libre para que Claude pueda describir cualquier hallazgo con sus palabras sin forzarlo a un cajón.',
      'Añadir un valor "other" al enum más un string category_detail, para que los hallazgos que no encajan dejen de caer en los cajones existentes.',
      'Ampliar el enum a unos 40 valores que cubran todos los tipos de hallazgo que el equipo pueda imaginar, para que cada uno tenga un cajón exacto.',
      'Decirle a Claude que omita cualquier hallazgo que no encaje en una de las cuatro categorías, para que los dashboards sigan limpios y precisos.',
    ],
    why: [
      'El texto libre rompe la agregación: los dashboards ya no pueden contar hallazgos por categoría.',
      'Un valor "other" con un string de detalle mantiene las categorías extensibles: los que no encajan dejan de contaminar los cajones existentes, y los detalles muestran qué categorías nuevas añadir.',
      'Un enum enorme es difícil de aplicar de forma consistente y aun así no puede anticipar cada nuevo tipo de hallazgo.',
      'Descartar hallazgos oculta problemas reales, como las infracciones de licencia, solo para que los gráficos queden ordenados.',
    ],
    rule: 'Para categorías que crecen, usa un enum con "other" más un campo de detalle.',
  },
  'i2-forced-tool-empty-findings': {
    scenario:
      'Tu paso de review llama a la Messages API con una sola herramienta, `report_findings`, cuyo schema exige un array `findings` con al menos un elemento; `tool_choice` es "auto". En el 7% de las PRs, casi todas limpias, Claude responde en texto ("No he encontrado problemas, ¡buen trabajo!") y el script de publicación falla porque no hay ningún bloque tool_use.',
    ask: '¿Cuál es la solución más eficaz?',
    options: [
      'Añadir "Siempre debes llamar a report_findings" en mayúsculas al system prompt, y mantener tool_choice en "auto".',
      'Poner tool_choice a "any" para que Claude tenga que llamar a una herramienta, y mantener la regla del schema de que findings tenga al menos un elemento.',
      'Capturar el fallo y tratar cada respuesta solo de texto como "sin hallazgos", ya que la mayoría de esas PRs resultaron estar limpias.',
      'Forzar la herramienta report_findings mediante tool_choice y permitir un array findings vacío, para que una PR limpia sea un resultado válido.',
    ],
    why: [
      'Una instrucción en el prompt es probabilística. Con "auto", el modelo puede seguir respondiendo en texto plano.',
      'Forzar una llamada exigiendo al menos un hallazgo empuja a Claude a inventarse un problema en las PRs limpias: cambias un fallo por falsos positivos.',
      '"Casi todas" no es todas. Tratar el texto como limpio descarta en silencio cualquier hallazgo escrito en prosa y oculta la causa real.',
      'Forzar la selección de herramienta garantiza un bloque tool_use, y permitir un array vacío le da al modelo una forma honesta de reportar una PR limpia.',
    ],
    rule: 'Fuerza la herramienta y deja que el schema exprese "no se ha encontrado nada" de forma honesta.',
  },
  'i2-nullable-suggested-fix': {
    scenario:
      'Cada hallazgo de tu schema de review debe incluir un string `suggested_fix`. En bugs locales, los desarrolladores aplican el 80% de los arreglos. En hallazgos de diseño ("este orden de locks puede provocar un deadlock con OrderService"), Claude sigue escribiendo un arreglo de código, y dos veces este mes una sugerencia aplicada rompió el build al cambiar comportamiento no relacionado.',
    ask: '¿Cuál es el cambio de schema más eficaz?',
    options: [
      'Eliminar suggested_fix del schema por completo, para que los desarrolladores escriban siempre ellos los arreglos y nunca se aplique código generado.',
      'Mantener suggested_fix como obligatorio y añadir la instrucción "Asegúrate de que cada arreglo sugerido compila y no cambia nada más".',
      'Hacer suggested_fix opcional y nullable, y que Claude lo rellene solo cuando un cambio de código concreto y local arregle el problema.',
      'Compilar en CI cada arreglo sugerido y descartar el hallazgo entero cuando su arreglo falle, para que solo se publiquen hallazgos con arreglos que funcionan.',
    ],
    why: [
      'Esto tira los arreglos que los desarrolladores aceptan el 80% de las veces en bugs locales.',
      'Un campo obligatorio sigue forzando a Claude a producir algo cuando no existe un arreglo local, y una instrucción no puede hacer que aparezca un arreglo válido.',
      'Un campo opcional permite a Claude omitir un arreglo que no puede conocer, en lugar de inventarse uno solo para rellenar un campo obligatorio.',
      'Esto descarta hallazgos de diseño válidos solo porque no hay un arreglo sencillo, y no evita los arreglos inventados que casualmente compilan.',
    ],
    rule: 'Haz un campo nullable cuando la respuesta puede no existir, para que el modelo no se la invente.',
  },
  'i-detected-pattern': {
    scenario:
      'Los desarrolladores descartan el 35% de los hallazgos de tu bot de review. Cada hallazgo tiene fichero, línea, mensaje y severidad, pero los mensajes se redactan de forma distinta cada vez, así que no puedes saber si los descartes vienen de unas pocas construcciones de código recurrentes o están repartidos de forma uniforme. Quieres mejorar el prompt de review de forma sistemática.',
    ask: '¿Qué deberías añadir a los hallazgos estructurados?',
    options: [
      'Una puntuación de confianza autodeclarada para cada hallazgo, para comprobar si los hallazgos descartados tenían puntuaciones más bajas.',
      'Una explicación más larga para cada hallazgo, para que los desarrolladores entiendan el razonamiento y descarten menos de los correctos.',
      'Un booleano is_false_positive que el modelo pone a true cuando sospecha que su propio hallazgo puede ser erróneo o poco útil.',
      'Un campo detected_pattern que nombre la construcción de código detrás de cada hallazgo, para poder agrupar y analizar los descartes.',
    ],
    why: [
      'La confianza autodeclarada está mal calibrada y no te dice qué construcciones de código provocan los descartes.',
      'Las explicaciones más largas pueden convencer a los desarrolladores, pero no revelan qué provoca los falsos positivos.',
      'Si el modelo supiera que un hallazgo es erróneo, no lo reportaría, así que el autoetiquetado no es una señal fiable.',
      'Registrar la construcción detrás de cada hallazgo convierte los descartes en datos: ves qué patrones provocan falsos positivos y puedes arreglar esos criterios.',
    ],
    rule: 'Añade detected_pattern a los hallazgos para que los descartes muestren qué patrones fallan.',
  },
  'i2-detected-pattern-targeted-fix': {
    scenario:
      'Tus hallazgos ya incluyen `detected_pattern`. Tras un mes, el 58% de todos los descartes llevan el patrón "missing-null-check", y casi todos ellos están en objetos de petición que el validador de schema ya ha parseado en el límite de la API. En todo lo demás, los hallazgos "missing-null-check" se aceptan el 81% de las veces.',
    ask: '¿Cuál es el mejor siguiente paso según estos datos?',
    options: [
      'Suprimir todos los hallazgos missing-null-check en el script de publicación, ya que ese patrón por sí solo provoca la mayoría de los descartes.',
      'Añadir un criterio con un ejemplo: no exigir null checks en valores que el validador del límite ya ha parseado; luego volver a medir los descartes.',
      'Pedir a Claude una puntuación de confianza para cada hallazgo missing-null-check y publicar solo los que superen un umbral elegido a mano.',
      'Exigir a los desarrolladores que escriban un motivo para cada hallazgo descartado, para que el equipo revise si esos descartes estaban justificados.',
    ],
    why: [
      'El mismo patrón se acepta el 81% de las veces fuera de los objetos validados, así que suprimirlo en bloque tira bugs reales.',
      'detected_pattern convirtió los descartes en un diagnóstico preciso: un patrón en un contexto. Un criterio específico lo arregla, y los mismos datos confirman si ha funcionado.',
      'La confianza no refleja si un valor se validó antes; lo que falta es un criterio, no certeza.',
      'Los datos ya explican los descartes. Pedir motivos a los desarrolladores añade trabajo sin cambiar el prompt.',
    ],
    rule: 'Usa los datos de detected_pattern para escribir criterios específicos y luego vuelve a medir.',
  },
  'i2-retry-diff-line-errors': {
    scenario:
      'Los hallazgos llegan mediante tool use y siempre cumplen el schema, pero GitHub rechaza el 6% de los comentarios inline porque la línea citada está fuera de los hunks modificados de la PR o la ruta no forma parte de la PR. Tu script de publicación descarta esos hallazgos sin avisar, y al revisar una muestra se vio que algunos eran bugs reales.',
    ask: '¿Cuál es la forma más eficaz de recuperar estos hallazgos?',
    options: [
      'Comprobar cada hallazgo contra el diff; si falla, enviar un mensaje de seguimiento con el diff, los hallazgos fallidos y el error concreto de cada ubicación.',
      'Añadir valores mínimo y máximo al campo line del JSON schema, para que el propio tool use rechace las líneas fuera del rango modificado.',
      'Reenviar la misma petición de review cada vez que se rechace un comentario, ya que una segunda ejecución suele elegir números de línea distintos.',
      'Publicar los hallazgos rechazados juntos en un único comentario general de la PR sin ubicaciones, para no perder nada y que los desarrolladores busquen las líneas.',
    ],
    why: [
      'Reintentar con feedback de error específico (qué ruta o línea falló, qué rangos cambiaron) guía al modelo a corregir errores estructurales que puede arreglar a partir del diff.',
      'Un schema garantiza la estructura, no esta comprobación semántica: un único par min/max no puede describir varios hunks separados que varían según el fichero, ni qué rutas están en la PR.',
      'Un reintento sin feedback repite el mismo razonamiento, porque nunca se le dice al modelo qué estaba mal.',
      'Algunas de esas ubicaciones eran erróneas, no solo estaban fuera del diff, así que los desarrolladores reciben comentarios vagos que tienen que investigar ellos mismos.',
    ],
    rule: 'Al reintentar, envía los errores de validación concretos, no la misma petición otra vez.',
  },
  'i2-retry-missing-fixtures': {
    scenario:
      'Tu job nocturno genera tests de pytest por módulo y los valida ejecutando pytest; si fallan, reintenta añadiendo el error. Para el módulo de facturación, los 3 reintentos fallaron con "fixture \'tenant_ctx\' not found": Claude sigue adivinando nombres de fixtures, porque las fixtures compartidas están en `conftest.py`, que nunca se envía.',
    ask: '¿Qué deberías cambiar?',
    options: [
      'Subir el límite de reintentos de 3 a 8 y añadir el traceback completo de pytest cada vez, para que Claude tenga más oportunidades de dar con el nombre.',
      'Pasar la generación de tests de facturación a un modelo más grande, que tiene más probabilidades de inferir los nombres de fixtures del equipo a partir del código del módulo.',
      'Decirle a Claude que no use ninguna fixture en los tests de facturación y que construya inline todos los datos de test necesarios en cada test.',
      'Dejar de reintentar este fallo y añadir `conftest.py` al contexto, porque ningún reintento puede recuperar nombres que el modelo nunca ha visto.',
    ],
    why: [
      'Los reintentos ayudan con errores de formato o de estructura, no con información que falta en la entrada. Más intentos solo significan más conjeturas.',
      'Un modelo más grande sigue sin poder conocer nombres que solo existen en un fichero que nunca recibió.',
      'Esto evita el error produciendo un setup duplicado y más difícil de mantener que ignora las fixtures del equipo.',
      'Reintentar no sirve cuando la información necesaria no está en el contexto. Proporcionar la fuente de verdad arregla la causa raíz.',
    ],
    rule: 'Los reintentos arreglan errores de formato; no pueden recuperar información que nunca proporcionaste.',
  },
  'i-batch-tool-loop': {
    scenario:
      'Tu job nocturno de generación de tests ejecuta un bucle agéntico: Claude escribe tests, llama a una herramienta run_tests, lee los fallos y corrige los tests, normalmente a lo largo de 4–6 turnos. Para recortar costes, tu manager propone pasar todo el bucle a la Message Batches API, ya que los resultados solo se necesitan para la mañana siguiente.',
    ask: '¿Cómo deberías valorar esta propuesta?',
    options: [
      'Aceptarla tal cual: cada petición del batch ejecuta el bucle durante la noche, llamando a run_tests entre turnos y devolviendo los tests que pasan.',
      'Rechazarla, porque los resultados del batch llegan sin un orden fijo y no se pueden asociar a los ficheros para los que se generaron.',
      'Aceptarla, pero poner tool_choice a "any" en cada petición del batch para que todas las ejecuciones de tests ocurran dentro de esa misma petición.',
      'Aceptarla en parte: pasar a batch los pasos de un turno, como el primer borrador de tests, y dejar el bucle de arreglos con run_tests en la API síncrona.',
    ],
    why: [
      'Una petición de batch no puede ejecutar herramientas a mitad de la petición y continuar con los resultados, así que el bucle de run_tests no puede ocurrir dentro de ella.',
      'Los resultados del batch se asocian a las peticiones con custom_id, así que el orden no importa.',
      'tool_choice controla si se llama a una herramienta, no quién la ejecuta. Nada ejecuta run_tests entre turnos dentro de un batch.',
      'La Batches API no admite llamadas a herramientas en varios turnos dentro de una petición. La generación de un solo turno sigue obteniendo el 50% de ahorro y el bucle se mantiene en tiempo real.',
    ],
    rule: 'Los batches no pueden ejecutar bucles de herramientas de varios turnos; manda en batch solo los pasos de un turno.',
  },
  'i2-batch-custom-id-correlation': {
    scenario:
      'Tu batch nocturno genera sugerencias de tests para 3000 módulos, y el script asocia cada resultado a un módulo por su posición en la lista de peticiones. Después de reenviar 90 peticiones fallidas en un segundo batch y juntar ambos ficheros de resultados, las sugerencias para `inventory/sync.py` aparecieron en una PR de `billing/invoice.py`.',
    ask: '¿Cuál es la solución correcta?',
    options: [
      'Ordenar los ficheros de resultados por hora de finalización antes de juntarlos, para que los resultados se alineen con el orden en que se enviaron.',
      'Enviar cada módulo como su propio batch de una sola petición, para que cada batch tenga exactamente un resultado y la asociación nunca sea ambigua.',
      'Pasar la generación de tests a la API síncrona, donde cada respuesta vuelve por la misma conexión que la petición que la originó.',
      'Dar a cada petición un custom_id formado por la ruta del módulo y el SHA del commit, y asociar cada resultado a su módulo por ese custom_id.',
    ],
    why: [
      'El orden de finalización no es el orden de envío, y no está garantizado que los resultados del batch vuelvan en el orden de las peticiones.',
      'Miles de batches de una sola petición añaden una sobrecarga innecesaria; custom_id ya resuelve la correlación dentro de un único batch.',
      'Esto renuncia al 50% de ahorro en un job nocturno que tolera la latencia, para sortear un problema que custom_id ya resuelve.',
      'custom_id existe para correlacionar las peticiones del batch con sus resultados. Un ID estable también facilita reenviar solo las peticiones fallidas.',
    ],
    rule: 'Correlaciona los resultados del batch por custom_id, nunca por posición.',
  },
  'i2-batch-sample-refine-first': {
    scenario:
      'La auditoría de salud del código del último trimestre, sobre 1200 repositorios, se ejecutó con la Message Batches API. El 35% de los resultados no servían (faltaban secciones obligatorias, había referencias a ficheros erróneas), así que corregiste el prompt y reenviaste dos veces, y la auditoría tardó cuatro días. La del próximo trimestre cubre 1500 repositorios.',
    ask: '¿Cuál es la forma más eficaz de ejecutar la auditoría del próximo trimestre?',
    options: [
      'Iterar el prompt con una muestra representativa de repositorios hasta que las salidas pasen tus comprobaciones, y luego enviar el batch completo.',
      'Enviar los 1500 repositorios como antes y luego reenviar solo los fallidos por custom_id hasta que todos los resultados pasen tus comprobaciones.',
      'Ejecutar toda la auditoría en la API síncrona, para que cada resultado inservible se detecte y se reintente en cuanto llegue.',
      'Dividir los 1500 repositorios en 15 batches enviados todos la misma noche, para que la auditoría completa vuelva antes que la vez anterior.',
    ],
    why: [
      'Refinar el prompt con una muestra antes del procesamiento en batch sube la tasa de éxito a la primera y evita pagar por reenvíos repetidos.',
      'Reenviar por custom_id es lo correcto para unos pocos fallos residuales, pero con una tasa de fallo del 35% el problema es el propio prompt y hay que arreglarlo primero.',
      'Esto renuncia al 50% de ahorro en un job que tolera la latencia sin arreglar el prompt que produjo los resultados inservibles.',
      'Los batches en paralelo pueden terminar antes, pero el mismo prompt seguirá produciendo alrededor de un tercio de resultados inservibles.',
    ],
    rule: 'Ajusta el prompt con una muestra antes de mandar en batch todo el volumen.',
  },
  'i2-batch-sla-cadence': {
    scenario:
      'La política exige que cada commit mergeado en main tenga un informe de auditoría de riesgo de dependencias en un plazo de 32 horas desde el merge. Para recortar costes, pasas las auditorías a la Message Batches API, donde un batch puede tardar hasta 24 horas en procesarse. Los merges ocurren a todas horas en cuatro zonas horarias.',
    ask: '¿Cómo deberías programar el envío de batches?',
    options: [
      'Enviar un batch cada noche a las 02:00 UTC con todos los commits mergeados desde la última ejecución, ya que la mayoría de los batches terminan en menos de una hora.',
      'Enviar un batch cada noche y fijarle un plazo de procesamiento de 6 horas, para que todos los resultados vuelvan a tiempo con garantía.',
      'Enviar un batch cada 6 horas con los commits mergeados desde el anterior, para que la espera más las 24 horas se mantenga por debajo de 32 horas.',
      'Mantener las auditorías en la API síncrona, porque la Batches API no tiene garantía de latencia y por tanto nunca se puede usar bajo un SLA.',
    ],
    why: [
      'Un commit mergeado justo después de las 02:00 espera casi 24 horas a enviarse, y luego hasta 24 más a procesarse: unas 48 horas. La velocidad típica no es un SLA.',
      'Los batches no tienen un plazo de procesamiento configurable; la ventana de hasta 24 horas y la falta de un SLA de latencia son fijas.',
      'Con ventanas de 6 horas, el peor caso son 6 horas de espera más 24 horas de procesamiento, 30 horas, lo que cumple el SLA de 32 horas y mantiene el 50% de ahorro.',
      'No tener SLA de latencia no descarta el batching. Cumples el plazo eligiendo la frecuencia de envío a partir del peor caso de 24 horas.',
    ],
    rule: 'Intervalo de envío + peor caso de 24h tiene que caber en el SLA; programa a partir de eso.',
  },
  'x-batches': {
    scenario:
      'Cada noche hay que clasificar 200.000 descripciones de producto. Los resultados se necesitan por la mañana. El coste es la principal preocupación.',
    ask: '¿Cuál es el mejor enfoque?',
    options: [
      'La Message Batches API: procesamiento asíncrono con descuento, terminado en 24 horas.',
      'Llamadas en tiempo real en paralelo al máximo del rate limit, para que todo el job termine lo antes posible.',
      'Respuestas en streaming, para que cada clasificación empiece a devolver tokens lo antes posible.',
      'Un modelo más grande, que reduce los errores y los reintentos y así abarata la factura total.',
    ],
    why: [
      'Pensada para trabajos grandes que no son urgentes: la mitad de coste, y la mayoría de los batches terminan muy por debajo de la ventana.',
      'Precio completo y presión sobre el rate limit sin ningún beneficio.',
      'El streaming mejora la latencia percibida para un usuario que está mirando, no los trabajos masivos.',
      'Sube el coste, justo lo contrario del objetivo.',
    ],
    rule: 'Volumen grande + nada urgente → Message Batches API.',
  },
  'i-independent-reviewer': {
    scenario:
      'En tu pipeline de CI, una sesión de Claude Code implementa un ticket y luego, en la misma sesión, revisa su propio diff antes de abrir la PR. La autorrevisión aprueba el 96% de los diffs, pero los revisores humanos encuentran después bugs sutiles en 1 de cada 6 PRs, como un off-by-one en la paginación que la sesión había razonado que era correcto.',
    ask: '¿Cuál es la forma más eficaz de mejorar la review automática?',
    options: [
      'Activar extended thinking en el paso de autorrevisión, para que la misma sesión razone más a fondo sobre cada cambio de su diff.',
      'Ejecutar la review en una instancia de Claude aparte que reciba el diff y los requisitos, pero no el razonamiento del generador.',
      'Añadir una instrucción a la autorrevisión: "Actúa como un revisor senior estricto y asume que el código que acabas de escribir tiene bugs".',
      'Hacer que la misma sesión revise el diff tres veces y reporte solo los problemas que encuentre en al menos dos de las tres pasadas.',
    ],
    why: [
      'Pensar más en la misma sesión sigue partiendo del razonamiento que justificó el bug.',
      'Una instancia independiente, sin el contexto de razonamiento del generador, tiene más probabilidades de cuestionar decisiones y detectar bugs sutiles.',
      'Una instrucción de rol no elimina el contexto retenido. El modelo sigue tendiendo a confirmar sus propias decisiones.',
      'La autorrevisión repetida comparte el mismo sesgo, y la votación por consenso suprime los problemas que solo se detectan algunas veces.',
    ],
    rule: 'Revisa el código generado con una instancia independiente, no con la sesión que lo escribió.',
  },
  'i2-confidence-routing-not-filter': {
    scenario:
      'Tu review tiene ahora una pasada de verificación independiente que da una puntuación de confianza con cada hallazgo que confirma. En un mes, el 9% de los hallazgos verificados puntuó por debajo de 0.6; cuando los ingenieros los revisaron a mano, un tercio eran bugs reales. El equipo tiene que decidir qué debe hacer el pipeline con los hallazgos de baja confianza.',
    ask: '¿Cuál es el diseño más eficaz?',
    options: [
      'Descartar todos los hallazgos con puntuación por debajo de 0.6, para que solo lleguen a los desarrolladores los hallazgos verificados de los que el modelo está seguro.',
      'Devolver los hallazgos de baja confianza a la sesión del revisor original para que los vuelva a comprobar, y publicar los que decida conservar.',
      'Enrutar según la puntuación: publicar inline los de alta confianza, mandar el resto a una cola de triaje y ajustar el umbral con resultados anteriores.',
      'Repetir tres veces la pasada de verificación sobre cada hallazgo de baja confianza y publicarlo solo si dos de las tres ejecuciones lo confirman.',
    ],
    why: [
      'Usar la confianza como filtro estricto tira bugs reales: un tercio de estos hallazgos eran auténticos.',
      'La sesión original conserva su propio razonamiento y tiende a confirmar sus hallazgos, que es el problema de la autorrevisión.',
      'La confianza de una pasada de verificación sirve para enrutar de forma calibrada la atención de la review, no para borrar en silencio. Ajustar el umbral con resultados etiquetados lo mantiene calibrado.',
      'La votación por mayoría suprime los problemas que solo se detectan algunas veces, que es justo lo que suelen ser los hallazgos de baja confianza.',
    ],
    rule: 'Usa la confianza del verificador para enrutar la atención de la review, calibrada con resultados reales.',
  },
  'i2-independent-finding-verification': {
    scenario:
      'En PRs de más de 1000 líneas cambiadas, el 22% de los hallazgos de tu bot citan código que no hace lo que dice el hallazgo (por ejemplo, "`retry()` nunca libera el lock" cuando sí lo hace). La review y su paso final de "revisa dos veces tus hallazgos" se ejecutan en la misma sesión. Los desarrolladores ya no se fían de las reviews de PRs grandes.',
    ask: '¿Cuál es la forma más eficaz de reducir estos hallazgos sin fundamento?',
    options: [
      'Activar extended thinking en el paso de doble comprobación, para que la misma sesión razone más tiempo sobre cada hallazgo antes de publicarlo.',
      'Hacer que una instancia aparte compruebe cada hallazgo contra el código citado, recibiendo solo el hallazgo y el código, no el razonamiento del revisor.',
      'Ejecutar la review completa tres veces y publicar solo los hallazgos que aparezcan en al menos dos de las tres ejecuciones sobre la misma PR.',
      'Hacer que el revisor autodeclare su confianza en cada hallazgo durante la doble comprobación, y descartar todos los que puntúe por debajo de 8.',
    ],
    why: [
      'Pensar más en la misma sesión sigue partiendo del razonamiento que produjo la afirmación, así que tiende a confirmarla.',
      'Una instancia independiente, sin el contexto de razonamiento original, comprueba cada afirmación desde cero contra el código, y eso supera a la autorrevisión a la hora de detectar hallazgos sin fundamento.',
      'La votación por consenso también oculta bugs reales que solo detectan algunas ejecuciones, y las ejecuciones repetidas pueden compartir la misma afirmación errónea.',
      'La confianza autodeclarada por la misma sesión está mal calibrada; el revisor ya está seguro de sus afirmaciones erróneas.',
    ],
    rule: 'Verifica los hallazgos con una instancia independiente, no con la sesión que los generó.',
  },
  'e2-hook-normalize-formats': {
    scenario:
      'Tu agente de extracción contrasta facturas con tres herramientas MCP: el ERP devuelve las fechas como timestamps Unix y los importes en céntimos, la herramienta de compras usa ISO 8601 y decimales, y un sistema legacy usa "DD.MM.YY". El 5% de las comprobaciones de condiciones de pago salen mal porque el agente interpreta mal estos formatos.',
    ask: '¿Cuál es la solución más fiable?',
    options: [
      'Describe en el system prompt los formatos de fecha e importe de cada sistema e indica al agente que los convierta antes de comparar.',
      'Añade un hook PostToolUse que convierta cada resultado de herramienta a fechas ISO 8601 e importes decimales antes de que el agente lo procese.',
      'Añade ejemplos few-shot en los que el agente convierte timestamps Unix, céntimos y fechas DD.MM.YY durante una comprobación de condiciones de pago.',
      'Pide a los responsables de los tres sistemas que cambien sus APIs para devolver un formato común antes de que el agente pase a producción.',
    ],
    why: [
      'Las instrucciones del prompt dejan la conversión en manos de un cumplimiento probabilístico, así que el modelo seguirá interpretando mal algunos valores.',
      'Un hook PostToolUse normaliza de forma determinista la salida heterogénea de las herramientas, así que el agente solo ve un único formato.',
      'Los ejemplos mejoran las probabilidades, pero siguen dejando al modelo una conversión mecánica, que es justo donde se producen los errores.',
      'Cambiar tres sistemas externos es lento y no depende de ti; un hook consigue el mismo resultado ya.',
    ],
    rule: 'Normaliza los formatos mixtos de las herramientas en un hook PostToolUse, no en el prompt.',
  },
  'a-workflow-not-agent': {
    scenario:
      'Cada factura pasa por los mismos tres pasos: extraer los campos, validarlos contra el pedido de compra y escribirlos en el ERP. El equipo construyó un agente autónomo con una herramienta para cada paso, y a veces se salta la validación.',
    ask: '¿Cuál es el mejor diseño?',
    options: [
      'Añade «SIEMPRE valida contra el pedido de compra antes de escribir» al system prompt y a la descripción de la herramienta de escritura.',
      'Añade un agente supervisor que revise cada ejecución y devuelva la factura si se ha saltado la validación.',
      'Sube el máximo de turnos y el presupuesto de tokens del agente para que siempre tenga margen para completar la validación.',
      'Conviértelo en un pipeline fijo de tres pasos en código y llama a Claude solo para el paso de extracción de campos.',
    ],
    why: [
      'Sigue dejando el orden de los pasos en manos del modelo.',
      'Duplica el coste y añade una segunda capa probabilística para algo que es fijo.',
      'El presupuesto de turnos no es la causa: el modelo decidió saltarse un paso.',
      'Cuando los pasos son siempre los mismos, un workflow es más simple, más barato y predecible. Usa el modelo donde haga falta criterio.',
    ],
    rule: 'Pasos fijos → workflow. Pasos abiertos → agente.',
  },
  'e-chain-sections': {
    scenario:
      'Cada expediente de solicitud de hipoteca tiene las mismas tres partes: identidad del solicitante, justificantes de ingresos y tasación del inmueble. Un único prompt extrae los 62 campos y luego los contrasta entre sí (por ejemplo, los ingresos frente al préstamo solicitado). A menudo faltan campos de la sección de ingresos, y las comprobaciones cruzadas se omiten en 1 de cada 5 expedientes.',
    ask: '¿Cuál es la forma más eficaz de reestructurar la extracción?',
    options: [
      'Cambia a un modelo con una ventana de contexto mayor para que el expediente completo y las 62 definiciones de campos quepan con mucho margen.',
      'Dale el expediente completo a un agente autónomo y deja que decida qué secciones extraer y qué comprobaciones cruzadas necesita cada expediente.',
      'Vuelve a listar los 62 nombres de campo al final del prompt, para que el modelo marque cada campo antes de devolver el resultado.',
      'Encadena pasos acotados: extrae identidad, ingresos e inmueble en pasadas separadas y ejecuta las comprobaciones cruzadas como paso final.',
    ],
    why: [
      'El problema es la atención repartida entre demasiadas tareas, no la falta de espacio. Una ventana mayor no arregla la dilución.',
      'La estructura del expediente es fija y conocida, así que dejar que un agente elija los pasos añade variabilidad donde no hace falta.',
      'Repetir la lista puede ayudar un poco, pero un solo prompt sigue haciendo 62 extracciones más la validación a la vez.',
      'Una tarea predecible de varias partes encaja con el prompt chaining: cada pasada acotada recibe toda la atención y las comprobaciones cruzadas siempre se ejecutan como paso propio.',
    ],
    rule: 'Divide la extracción predecible de varias partes en una cadena fija de pasos acotados.',
  },
  'e-reconcile-dynamic': {
    scenario:
      'Tu sistema ha extraído 300 facturas de un proveedor. El extracto de fin de año del proveedor reclama 41.200 $ más que tus totales extraídos, y finanzas pide al sistema que averigüe por qué. La causa podría ser facturas que faltan, notas de abono, conversión de divisa o un pago duplicado, y cada hallazgo apunta a documentos distintos que examinar a continuación.',
    ask: '¿Cómo debería descomponerse esta tarea?',
    options: [
      'Ejecuta una cadena fija: vuelve a extraer las 300 facturas, súmalas de nuevo, compáralas con el extracto e informa de la diferencia final.',
      'Usa un plan adaptativo: enumera las causas probables, comprueba primero la más probable y crea subtareas nuevas según lo que revele cada paso.',
      'Envía las 300 facturas y el extracto en un solo prompt y pide al modelo que explique toda la diferencia en una única respuesta detallada.',
      'Extrae cada factura tres veces más y quédate con el valor mayoritario de cada campo, para que los errores aleatorios de extracción se compensen.',
    ],
    why: [
      'Un pipeline fijo no puede seguir pistas. Si la causa es una nota de abono o un pago duplicado, volver a sumar las mismas facturas nunca la encuentra.',
      'Es una investigación abierta: qué examinar a continuación depende de lo que encuentre cada paso. Ahí es cuando la descomposición dinámica supera a una cadena fija.',
      'Un prompt enorme diluye la atención y no da forma de obtener los documentos adicionales a los que apuntan los nuevos hallazgos.',
      'La votación por mayoría solo corrige el ruido aleatorio de extracción. No puede encontrar causas que están fuera del conjunto de facturas.',
    ],
    rule: 'Cuando los hallazgos deciden el siguiente paso, usa descomposición dinámica, no una cadena fija.',
  },
  'e2-map-archive-first': {
    scenario:
      'Te piden extraer «todos los datos útiles» de 60.000 documentos escaneados de un archivo legacy. Nadie sabe qué tipos de documento contiene. Un compañero propone un schema genérico con 120 campos opcionales, ejecutado sobre todos los documentos en una sola pasada nocturna.',
    ask: '¿Cómo deberías descomponer esta tarea?',
    options: [
      'Clasifica una muestra para mapear los tipos de documento, prioriza los tipos de mayor volumen o valor y adapta el plan a medida que aparezcan tipos nuevos.',
      'Ejecuta el schema genérico de 120 campos sobre todo el archivo y deja que los revisores eliminen los campos que resulten no ser útiles.',
      'Construye un pipeline fijo con un schema especializado para cada tipo de documento que suele encontrarse en un archivo corporativo.',
      'Haz que un agente lea los documentos en orden y decida en cada uno qué campos parece que merece la pena extraer en ese momento.',
    ],
    why: [
      'El trabajo abierto se descompone mejor mapeando primero la estructura y abordando después las áreas de mayor impacto con un plan que se adapta a lo que encuentras.',
      'Un schema genérico sobre documentos desconocidos produce una salida dispersa y ruidosa, y traslada el verdadero trabajo de diseño a los revisores.',
      'Un pipeline fijo da por hecho que ya conoces los tipos, así que se le escapan los tipos que realmente hay en este archivo.',
      'Improvisar documento a documento no tiene plan y produce campos incoherentes entre documentos del mismo tipo.',
    ],
    rule: 'En extracciones abiertas, mapea primero lo que existe y luego prioriza y adapta.',
  },
  'e2-structured-tool-errors': {
    scenario:
      'Una herramienta MCP, get_document_text, devuelve "Operation failed" tanto para timeouts de OCR como para PDFs protegidos con contraseña y archivos corruptos. El agente reintenta cada fallo cinco veces, perdiendo minutos en archivos bloqueados y corruptos que nunca pueden salir bien, y los logs nunca dicen qué problema ocurrió.',
    ask: '¿Cómo debería informar la herramienta de sus fallos?',
    options: [
      'Reintenta cada fallo cinco veces dentro de la herramienta y devuelve "Operation failed" solo cuando se hayan agotado todos esos intentos.',
      'Devuelve un resultado de texto vacío ante cualquier fallo, para que el agente siga adelante y el pipeline nunca se atasque con un documento malo.',
      'Añade una regla al system prompt que indique al agente reintentar una vez tras "Operation failed" y después saltarse ese documento por completo.',
      'Devuelve isError con un errorCategory (transient, validation, permission), un flag isRetryable y una descripción clara.',
    ],
    why: [
      'Reintentar errores no reintentables hace perder tiempo, y el mensaje genérico final sigue ocultando la causa.',
      'Presentar un fallo como un éxito vacío lo oculta; el agente no extrae nada y no informa de ningún error.',
      'Una única política uniforme no distingue un timeout de un archivo bloqueado, así que sigue gestionando mal ambos casos.',
      'Los metadatos de error estructurados le dicen al agente qué fallos merece la pena reintentar y cuáles necesitan otro camino, como pedir una contraseña.',
    ],
    rule: 'Los errores de las herramientas necesitan una categoría y un flag de reintentable para que el agente pueda recuperarse.',
  },
  'e-force-metadata-first': {
    scenario:
      'Tu pipeline le da a Claude tres herramientas: extract_metadata, lookup_vendor y enrich_from_ledger. El enriquecimiento necesita el ID de proveedor que devuelve extract_metadata. Con tool_choice en "auto", el 15% de las ejecuciones llama primero a lookup_vendor con un nombre de proveedor adivinado, y el enriquecimiento falla o asocia el proveedor equivocado.',
    ask: '¿Cuál es la forma más fiable de corregir el orden?',
    options: [
      'Pon tool_choice en "any" en la primera petición, para que el modelo tenga que llamar a una de las tres herramientas en vez de responder con texto.',
      'Añade una línea al system prompt que diga que extract_metadata debe ser siempre la primera herramienta llamada, antes de cualquier enriquecimiento.',
      'Fuerza la primera llamada con tool_choice {"type": "tool", "name": "extract_metadata"} y ejecuta el enriquecimiento en turnos posteriores.',
      'Fusiona las tres herramientas en una sola process_document que extraiga, busque y enriquezca el documento en una única llamada.',
    ],
    why: [
      '"any" garantiza alguna llamada a herramienta, pero no cuál, así que lookup_vendor aún puede ir primero.',
      'Una instrucción en el prompt es probabilística. Reduce la tasa, pero no garantiza el orden.',
      'Forzar la selección de herramienta hace que extract_metadata se ejecute primero siempre. Las herramientas de enriquecimiento se ejecutan después en los turnos siguientes con el ID de proveedor real.',
      'Una herramienta fusionada oculta los pasos y pierde el contrato claro de entrada/salida de cada herramienta. Es un cambio mayor de lo que el problema requiere.',
    ],
    rule: 'Fuerza una herramienta concreta con tool_choice cuando deba ejecutarse antes que las demás.',
  },
  'e2-load-document-not-fetch-url': {
    scenario:
      'Tu agente de extracción carga cada documento con una herramienta genérica fetch_url, usando URLs de tu almacén de documentos. Algunos PDFs tienen enlaces en el pie de página, como «condiciones completas en vendor.example/terms», y en el 4% de las ejecuciones el agente los descarga y mezcla el texto de esa página en los campos extraídos.',
    ask: '¿Cuál es la solución más eficaz?',
    options: [
      'Añade a la descripción de fetch_url que es solo para URLs del almacén de documentos y que nunca debe usarse con enlaces encontrados en documentos.',
      'Elimina todas las URLs del texto del documento antes de la extracción, para que el agente nunca vea un enlace que pueda decidir descargar.',
      'Sustituye fetch_url por una herramienta load_document que recibe un ID de documento y solo puede cargar archivos de tu almacén de documentos.',
      'Mantén fetch_url, pero registra cada URL descargada y haz que un revisor compruebe cualquier ejecución en la que el agente accedió a un dominio externo.',
    ],
    why: [
      'Las indicaciones de la descripción se siguen la mayoría de las veces, no siempre, y la herramienta todavía puede descargar cualquier URL.',
      'Eliminar las URLs pierde datos que pueden ser campos reales, como la web de un proveedor, y es frágil entre formatos.',
      'Sustituir una herramienta genérica por una restringida hace que la acción no deseada sea imposible en lugar de simplemente desaconsejada.',
      'El registro detecta el problema después de que se hayan extraído datos erróneos; no lo evita.',
    ],
    rule: 'Sustituye las herramientas genéricas por otras restringidas que solo puedan hacer el trabajo previsto.',
  },
  'e2-scope-out-web-search': {
    scenario:
      'Tu agente de extracción tiene 15 herramientas, entre ellas web_search, send_email y tres herramientas de CRM, además de su herramienta de extracción. Las auditorías muestran que el 7% de las direcciones de proveedores salieron de la web en lugar del documento, y los errores de selección crecieron con cada herramienta añadida. Alrededor del 30% de los documentos necesitan comprobar la dirección contra el maestro de proveedores.',
    ask: '¿Cómo deberías configurar las herramientas del agente de extracción?',
    options: [
      'Mantén las 15 herramientas, pero añade una regla en el prompt: las direcciones deben salir del documento y web_search es solo para verificar.',
      'Limítalo a la herramienta de extracción más una herramienta acotada check_vendor_master, y deriva cualquier otra necesidad a pasos separados.',
      'Mantén las 15 herramientas y pon tool_choice en "any", para que el agente siempre llame a una herramienta y nunca responda en texto libre.',
      'Quita todas las herramientas salvo una herramienta de extracción forzada, y haz que los revisores comprueben todas las direcciones contra el maestro de proveedores.',
    ],
    why: [
      'Una regla en el prompt es probabilística, y 15 herramientas siguen degradando la selección. Las herramientas ajenas al rol invitan a usarlas mal.',
      'Un acceso a herramientas acotado al rol, más una herramienta transversal limitada para una necesidad frecuente, reduce tanto el mal uso como los errores de selección.',
      '"any" garantiza una llamada a herramienta, pero no impide que el agente elija la herramienta equivocada.',
      'Quitar la comprobación frecuente de proveedores traslada un 30% de carga de trabajo a personas cuando una herramienta acotada lo resolvería.',
    ],
    rule: 'Dale a un extractor solo las herramientas de su rol, más las auxiliares acotadas que necesite a menudo.',
  },
  'e2-anomaly-explicit-criteria': {
    scenario:
      'Tu extracción de facturas también devuelve una lista de anomalías para el equipo de cuentas a pagar. Incluso después de añadir «marca solo anomalías significativas y de alta confianza» al prompt, los revisores descartan el 70% de las marcas (formatos de fecha, abreviaturas de nombres de proveedor, redondeos de un céntimo). Han empezado a ignorar la lista y se les pasaron dos facturas duplicadas reales.',
    ask: '¿Cuál es la forma más eficaz de que las marcas de anomalía vuelvan a ser útiles?',
    options: [
      'Haz que el modelo puntúe cada anomalía de 1 a 10 según su confianza, y muestra a los revisores solo las anomalías que puntúe con 8 o más.',
      'Refuerza la instrucción a «sé muy conservador y marca solo las anomalías que estés seguro de que importarán a cuentas a pagar».',
      'Define qué marcar (número de factura duplicado, total desviado más de 1 $, sin PO por encima de 5.000 $) y enumera qué ignorar.',
      'Pasa el paso de anomalías a un modelo más grande, que juzga mejor qué irregularidades le importan al equipo de cuentas a pagar.',
    ],
    why: [
      'La confianza autodeclarada no está calibrada, y filtrar por ella no arregla el verdadero hueco: el modelo no tiene una definición de lo que importa.',
      'Instrucciones vagas como «sé conservador» ya fallaron. No le dicen al modelo qué categorías son ruido.',
      'Unos criterios explícitos por categoría le dicen al modelo exactamente qué reportar y qué ignorar. Eso sube la precisión y recupera la confianza del equipo en la lista.',
      'Un modelo más grande sigue sin poder adivinar la definición no escrita que tiene el equipo de una anomalía significativa. Los criterios hay que explicitarlos.',
    ],
    rule: 'La precisión sale de criterios explícitos de qué marcar y qué ignorar, no de «sé conservador».',
  },
  'e-fewshot-varied-formats': {
    scenario:
      'Extraes datos de estudios a partir de artículos clínicos. Cuando el tamaño muestral está en una tabla de métodos, la extracción funciona. Cuando aparece solo en el texto («incluimos a algo menos de doscientos pacientes») o en una nota al pie de una tabla, el modelo devuelve null el 40% de las veces y a veces se inventa un número redondo.',
    ask: '¿Cuál es la mejora más eficaz?',
    options: [
      'Marca sample_size como campo obligatorio en el schema, para que el modelo ya no pueda devolver null cuando el número sea difícil de encontrar.',
      'Añade una instrucción que diga al modelo que lea todo el artículo con atención, ya que el tamaño muestral puede aparecer en muchos sitios.',
      'Añade unos pocos ejemplos que muestren la extracción correcta desde texto, tablas y notas al pie, incluido cómo registrar valores aproximados.',
      'Cuando sample_size vuelva como null, reintenta la misma petición hasta tres veces y quédate con el primer valor no nulo que devuelva.',
    ],
    why: [
      'Los campos obligatorios empujan al modelo a fabricar un valor cuando no lo encuentra, lo que empeora la alucinación.',
      'Una instrucción genérica de «lee con atención» no muestra cómo tratar valores informales o dispersos.',
      'Los ejemplos few-shot con estructuras de documento variadas muestran dónde y cómo aparecen los valores, reduciendo tanto los campos vacíos como los números inventados.',
      'Reintentar el mismo prompt no aporta ninguna orientación nueva, y quedarse con cualquier valor no nulo premia los números inventados.',
    ],
    rule: 'Muestra formatos de documento variados en unos pocos ejemplos para reducir los null y los valores inventados.',
  },
  'e2-fewshot-date-reasoning': {
    scenario:
      'Tu schema de contratos de arrendamiento tiene un único campo lease_start, pero los contratos contienen una fecha de firma, una «fecha de entrada en vigor», una «fecha de comienzo» y un inicio del pago de la renta tras un periodo de carencia. Los revisores ven que el modelo elige una u otra según la redacción, y una definición escrita más larga de lease_start no ha hecho que su elección sea coherente.',
    ask: '¿Cuál es el siguiente paso más eficaz?',
    options: [
      'Añade 2–4 ejemplos de contratos difíciles que muestren qué fecha se convirtió en lease_start y expliquen por qué se descartaron las demás fechas.',
      'Añade una regla según la cual lease_start es la fecha más temprana que aparezca en el contrato, ya que el arrendamiento empieza antes de que venza la renta.',
      'Sustituye lease_start por una lista de todas las fechas del contrato y deja que el equipo downstream decida cuál usar en cada caso.',
      'Repite la definición de lease_start al principio y al final del prompt en mayúsculas para que el modelo le dé más peso.',
    ],
    why: [
      'Los ejemplos dirigidos que muestran el razonamiento detrás de una elección entre alternativas plausibles son la mejor herramienta para los casos ambiguos, y generalizan a redacciones nuevas.',
      'Esta heurística es directamente errónea: la fecha de firma suele ser la más temprana, pero no es cuando empieza el arrendamiento.',
      'Una lista de fechas sin etiquetar traslada el criterio downstream, donde las personas se enfrentan a la misma ambigüedad con menos contexto.',
      'El énfasis y la repetición no pueden resolver una ambigüedad que la propia definición ya no ha conseguido resolver.',
    ],
    rule: 'Para campos ambiguos, usa ejemplos que expliquen por qué un valor ganó a los demás.',
  },
  'e2-fewshot-diverse-templates': {
    scenario:
      'Tu prompt de extracción de currículums tiene seis ejemplos few-shot, todos de la misma plantilla limpia a una columna. En currículums a dos columnas, y en los que describen los empleos en párrafos de texto, employer y start_date vuelven como null el 31% de las veces, aunque ambos están en el texto.',
    ask: '¿Cuál es el cambio más eficaz en los ejemplos few-shot?',
    options: [
      'Añade seis ejemplos más de la misma plantilla a una columna, para que el modelo vea más a menudo el formato de salida y los campos esperados.',
      'Sustitúyelos por 3–4 ejemplos que cubran diseños a una columna, a dos columnas y en prosa, mostrando dónde se encontró cada campo.',
      'Elimina los ejemplos y escribe una instrucción detallada que describa cada diseño de currículum que ha recibido el sistema hasta ahora.',
      'Mantén los seis ejemplos y marca employer y start_date como obligatorios, para que el modelo ya no pueda devolver null en ellos.',
    ],
    why: [
      'Más ejemplos de la misma plantilla no aportan variedad estructural, así que los diseños que fallan siguen sin estar representados.',
      'Los ejemplos que abarcan las estructuras de documento reales enseñan al modelo dónde están los campos en cada diseño, lo que corrige las extracciones vacías de campos que sí están presentes.',
      'Las descripciones en prosa por sí solas son las que producen resultados incoherentes; los ejemplos concretos funcionan mejor que las instrucciones.',
      'Los campos obligatorios no enseñan al modelo dónde mirar, y en currículums que de verdad no tienen fecha lo empujan a inventarse una.',
    ],
    rule: 'Los ejemplos few-shot deben cubrir las estructuras de documento que recibes realmente.',
  },
  'e2-fewshot-generalize-not-rules': {
    scenario:
      'Para encontrar el importe a pagar en facturas de proveedores, tu prompt ha crecido hasta 38 reglas («si aparecen tanto \'Saldo pendiente\' como \'Total\', usa…»). Cada nuevo diseño de proveedor lo vuelve a romper y un ingeniero añade otra regla. La precisión es del 98% en proveedores de siempre, pero del 71% en los proveedores dados de alta este mes.',
    ask: '¿Cuál es la forma más eficaz de mejorar la precisión en los diseños nuevos?',
    options: [
      'Sigue añadiendo reglas, pero agrúpalas por proveedor en el prompt para que el modelo encuentre rápido la regla que corresponde a cada diseño.',
      'Escribe un prompt distinto para cada proveedor y dirige cada factura a su prompt usando el nombre del proveedor leído en la cabecera de la factura.',
      'Sustituye la mayoría de las reglas por unos pocos ejemplos variados que muestren el razonamiento para elegir el importe a pagar, para que el modelo generalice.',
      'Haz que el modelo devuelva cada importe con su etiqueta impresa, y deja que un script downstream elija el importe a pagar por palabra clave.',
    ],
    why: [
      'Las reglas solo cubren los casos que alguien ya ha enumerado. Cada diseño nuevo sigue fallando hasta que se escribe otra regla.',
      'Los prompts por proveedor no escalan, y siguen fallando para cada proveedor que aún no tiene prompt, que es exactamente el segmento débil.',
      'Los ejemplos few-shot que demuestran el criterio permiten al modelo generalizar a diseños que nunca ha visto, algo que una lista de reglas no puede hacer.',
      'Esto traslada al código la misma coincidencia frágil por palabras clave, donde se rompe con etiquetas nuevas igual que las reglas.',
    ],
    rule: 'Los ejemplos enseñan un criterio que generaliza; las listas de reglas solo cubren los casos enumerados.',
  },
  'e2-fewshot-informal-measurements': {
    scenario:
      'Extraes las dimensiones de los artículos a partir de anuncios de proveedores en texto libre para un sistema de costes de envío. Los anuncios que dicen "45 x 30 cm" se extraen bien. Para «más o menos el ancho de una mano», «unos 2 ft» o «cabe en una caja de zapatos», el modelo devuelve valores precisos como 10,16 cm que no aparecen en ninguna parte del texto, y los presupuestos de envío salen mal.',
    ask: '¿Cuál es la mejora más eficaz?',
    options: [
      'Indica al modelo que convierta todas las dimensiones a centímetros con dos decimales, para que el sistema de envíos reciba siempre un formato uniforme.',
      'Haz que los campos de dimensiones sean números obligatorios con un mínimo de 1 cm, para que los valores vacíos o cero ya no lleguen a envíos.',
      'Procesa cada anuncio tres veces y conserva una dimensión solo cuando las tres ejecuciones devuelvan exactamente el mismo valor en centímetros.',
      'Añade unos pocos ejemplos de medidas informales: conserva el texto original, da un número solo si se indica, márcalo como aproximado; si no, null.',
    ],
    why: [
      'Una regla de precisión empuja al modelo a convertir «el ancho de una mano» en un número exacto, que es justo la fabricación que quieres evitar.',
      'Los campos numéricos obligatorios exigen un valor incluso cuando el anuncio no lo da, así que el modelo se inventa uno.',
      'La coincidencia entre ejecuciones mide consistencia, no que el valor esté respaldado por el texto. Una conversión inventada puede repetirse cada vez.',
      'Los ejemplos few-shot que muestran cómo tratar medidas informales son la forma más eficaz de reducir este tipo de alucinación en extracción.',
    ],
    rule: 'Muestra con ejemplos cómo tratar medidas informales; nunca inventes precisión.',
  },
  'e-enum-other-unclear': {
    scenario:
      'Tu schema de extracción de emails de soporte tiene un enum category con seis valores: billing, shipping, returns, account, technical, feedback. Una revisión muestra que el 11% de los emails no encajan en ninguna categoría y se fuerzan a "feedback", y los emails que podrían ser billing o account se etiquetan al azar. Los analistas no pueden detectar tipos de solicitud nuevos.',
    ask: '¿Cómo deberías cambiar el schema?',
    options: [
      'Añade un valor "other" con un campo de detalle en texto libre, y un valor "unclear" para los emails que encajan en más de una categoría.',
      'Sustituye el enum por un string de categoría en texto libre, para que el modelo describa cada nuevo tipo de solicitud con sus propias palabras.',
      'Añade doce valores más específicos al enum, para que casi todos los tipos de solicitud vistos en emails anteriores tengan su propia categoría.',
      'Mantén los seis valores y añade una regla en el prompt que indique al modelo elegir la categoría más cercana siempre que no esté del todo seguro.',
    ],
    why: [
      '"other" + detalle mantiene las categorías extensibles y revela tipos de solicitud nuevos; "unclear" registra la ambigüedad en lugar de una suposición al azar.',
      'El texto libre pierde los valores consistentes de los que dependen el enrutamiento y los informes downstream.',
      'Más valores siguen sin cubrir tipos de solicitud nuevos, y los emails ambiguos siguen forzados a una sola categoría.',
      '«La categoría más cercana» es exactamente la elección forzada que oculta los tipos nuevos y la ambigüedad.',
    ],
    rule: 'Dale a los enums una salida "other" + detalle y un valor "unclear" para la ambigüedad.',
  },
  'e-nullable-fields': {
    scenario:
      'Tu schema de extracción de contratos marca todos los campos como obligatorios, incluidos renewal_date y termination_fee. Alrededor del 30% de los contratos no tienen cláusula de renovación. Las comprobaciones puntuales muestran que en esos contratos el modelo rellena renewal_date con la fecha de firma más un año, y termination_fee con 0.',
    ask: '¿Cuál es la solución más eficaz?',
    options: [
      'Mantén los campos obligatorios y añade una regla en el prompt: nunca adivines, y usa solo valores que estén escritos claramente en el texto del contrato.',
      'Mantén los campos obligatorios y añade una comprobación posterior que marque cualquier renewal_date exactamente un año después de la fecha de firma.',
      'Añade una puntuación de confianza a cada campo y descarta cualquier valor por debajo de 0,7 antes de guardar la extracción en la base de datos.',
      'Haz que renewal_date y termination_fee sean nullable, e indica al modelo que devuelva null cuando el contrato no los indique.',
    ],
    why: [
      'El campo obligatorio sigue exigiendo un valor. La presión del schema choca con la instrucción, así que la fabricación continúa.',
      'Esto detecta un patrón concreto de fabricación, no la causa. Las penalizaciones inventadas de 0 siguen pasando.',
      'La confianza autodeclarada no es fiable para valores inventados, y además el schema sigue obligando a dar un valor.',
      'Cuando la información puede faltar, los campos nullable permiten al modelo decirlo en lugar de inventarse un valor para satisfacer el schema.',
    ],
    rule: 'Haz nullable los campos que pueden faltar en la fuente, o el modelo se inventará valores.',
  },
  'e-tool-choice-any': {
    scenario:
      'Tu servicio de entrada recibe facturas, recibos y notas de abono sin etiquetar. Definiste tres herramientas de extracción, un schema por tipo de documento, y envías las peticiones con tool_choice en "auto". En el 7% de los casos Claude responde con texto plano, como «Esto parece un recibo de…», y el parser downstream se cae.',
    ask: '¿Cuál es el mejor cambio de configuración?',
    options: [
      'Fuerza tool_choice a extract_invoice, ya que las facturas son el tipo más común, y convierte los demás tipos de documento después.',
      'Pon tool_choice en "any" para que Claude tenga que llamar a una de las herramientas de extracción pero pueda elegir el schema que encaja con el documento.',
      'Mantén "auto" y añade una línea al system prompt que diga que Claude debe responder siempre llamando exactamente a una de las herramientas de extracción.',
      'Mantén "auto" y añade un fallback que analice las respuestas de texto plano con expresiones regulares para recuperar los campos que faltan.',
    ],
    why: [
      'Forzar un solo schema mete los recibos y las notas de abono en la estructura equivocada.',
      '"any" garantiza una llamada a herramienta, así que siempre obtienes salida estructurada, y el modelo sigue eligiendo el schema adecuado para un tipo de documento desconocido.',
      'Con "auto" el modelo aún puede devolver texto. Una línea en el prompt solo reduce la tasa.',
      'Parsear texto libre es frágil y renuncia a la garantía de schema que da el tool use.',
    ],
    rule: 'Tipo de documento desconocido y varios schemas → tool_choice "any".',
  },
  'e2-boolean-to-tristate-enum': {
    scenario:
      'Un schema de suscripción de seguros tiene smoker: boolean, extraído de notas médicas. Las notas que nunca mencionan el tabaco devuelven false, que el equipo de suscripción interpreta como «no fumador confirmado», y notas como «¿lo dejó? pac. impreciso sobre cigarrillos» devuelven true o false al azar entre ejecuciones.',
    ask: '¿Cómo deberías cambiar el schema?',
    options: [
      'Mantén el booleano y añade una regla en el prompt para responder true solo cuando las notas indiquen clara y explícitamente que el solicitante fuma actualmente.',
      'Haz que smoker sea un booleano nullable, que devuelva null cuando no se menciona el tabaco y true o false para las notas imprecisas.',
      'Sustitúyelo por un enum con "yes", "no", "not_stated" y "unclear", y envía los casos "unclear" a un suscriptor para que decida.',
      'Sustitúyelo por un campo de texto libre smoking_notes que copie la frase relevante, y deja que los suscriptores lo interpreten.',
    ],
    why: [
      'Con solo true o false, toda nota que nunca menciona el tabaco sigue convirtiéndose en un «no» confirmado, que es un negativo fabricado.',
      'Null resuelve el caso de ausencia, pero las notas imprecisas siguen forzadas a true o false, así que las respuestas aleatorias continúan.',
      'Los valores separados "not_stated" y "unclear" evitan que la ausencia se haga pasar por un negativo, y dan a las notas ambiguas un valor que las deriva a una persona.',
      'El texto libre pierde el valor estructurado que necesitan las reglas de suscripción, y ahora cada registro necesita que una persona lo lea.',
    ],
    rule: 'Dale a los campos categóricos ambiguos valores explícitos "not_stated" y "unclear".',
  },
  'e2-forced-tool-needs-nullable': {
    scenario:
      'Tu extracción de formularios de siniestros usa tool_choice "auto". En el 6% de las llamadas Claude responde con texto, como «Este formulario no tiene número de póliza». El equipo planea forzar {"type": "tool", "name": "extract_claim"}. El schema marca policy_number, incident_date y adjuster_name como strings obligatorios.',
    ask: '¿Qué más debe cambiar para que forzar la herramienta sea seguro?',
    options: [
      'Nada más: forzar la herramienta garantiza una llamada válida según el schema, así que esas respuestas de texto pasan a ser simplemente registros de extracción completos.',
      'Añade una comprobación de formato sobre policy_number y reintenta cada llamada cuyo número no cumpla el patrón de la aseguradora hasta que pase.',
      'Usa tool_choice "any" en lugar de forzar, ya que "any" permite al modelo saltarse la llamada a la herramienta cuando faltan los datos obligatorios.',
      'Haz nullable los campos que pueden faltar en los formularios e indica al modelo que devuelva null en ellos, para que una llamada forzada no tenga que inventar valores.',
    ],
    why: [
      'Válido según el schema no es lo mismo que verdadero. Con campos obligatorios, la llamada forzada tiene que rellenar policy_number, así que el modelo se inventa uno.',
      'Los reintentos no pueden encontrar un número que no está en el formulario, y un número inventado verosímil pasaría igualmente la comprobación de formato.',
      '"any" también exige una llamada a herramienta; solo deja que el modelo elija cuál. Nunca permite saltarse la llamada.',
      'Forzar una llamada con strings obligatorios convierte un honesto «no está en el formulario» en un valor inventado. Los campos nullable permiten que la llamada forzada registre la ausencia.',
    ],
    rule: 'Antes de forzar una herramienta, haz nullable los campos que pueden faltar, o se los inventará.',
  },
  'e2-normalization-rules-with-schema': {
    scenario:
      'Tu schema de extracción tipa invoice_date y amount como strings. Todas las salidas son válidas según el schema, pero el ERP rechaza el 8% de los registros: las fechas llegan como "03/04/25", "4 Mar 2025" o "2025-03-04", y los importes como "1.234,50" o "1,234.50". Hay proveedores tanto en EE. UU. como en la UE.',
    ask: '¿Cuál es la solución más eficaz?',
    options: [
      'Añade al prompt, junto al schema, reglas de normalización: fechas ISO 8601, punto decimal y orden día/mes según el país del proveedor.',
      'Añade un script que interprete todas las fechas como mes/día/año y quite las comas de los importes antes de enviar los registros al ERP.',
      'Pide al modelo que copie las fechas y los importes tal como aparecen impresos, para que el equipo del ERP decida cómo leer el formato de cada proveedor.',
      'Reintenta cada registro rechazado con el mensaje de error del ERP hasta que el parser del ERP acepte sus strings de fecha e importe.',
    ],
    why: [
      'Un schema estricto fija la estructura, pero no el formato. Unas reglas de normalización explícitas permiten al modelo usar el contexto del documento para producir un formato coherente.',
      'Parsear a ciegas interpreta mal las fechas europeas (03/04 como 4 de marzo) y convierte "1.234,50" en 1.2345, creando errores silenciosos.',
      'Copiar los strings en bruto traslada la ambigüedad downstream, donde ya no está el contexto del documento necesario para resolverla.',
      'Un reintento puede devolver una fecha parseable pero errónea, como 03/04 leído al revés. La causa raíz son las reglas que faltan.',
    ],
    rule: 'Acompaña el schema estricto con reglas explícitas de normalización de formato en el prompt.',
  },
  'e2-read-tool-use-input': {
    scenario:
      'Pasaste la extracción de facturas a una herramienta extract_invoice con un JSON schema. La integración sigue ejecutando JSON.parse sobre response.content[0].text, y falla en el 9% de las respuestas, que empiezan con un bloque de texto corto («Voy a extraer ahora los campos de la factura.») antes de la llamada a la herramienta.',
    ask: '¿Cómo debería leer la integración los datos extraídos?',
    options: [
      'Añade al system prompt una regla para que Claude nunca escriba texto antes de llamar a la herramienta, y así content[0] siempre tenga la salida JSON.',
      'Busca el bloque de contenido de tipo "tool_use" llamado extract_invoice y lee su objeto input, que ya sigue el schema.',
      'Elimina todo lo anterior a la primera "{" en content[0].text, parsea el resto y recurre al último bloque si el parseo falla.',
      'Pide a Claude que repita también el JSON en su respuesta de texto, para que el parser pueda leerlo del bloque de texto o de la tool call.',
    ],
    why: [
      'Una regla en el prompt es probabilística, y el código que depende del orden de los bloques se rompe en cuanto la respuesta tiene otra forma.',
      'Con tool use, los datos estructurados son el input del bloque tool_use. Localizar ese bloque por tipo funciona sea cual sea el texto que lo rodee.',
      'El bloque de texto no contiene ningún JSON. Los apaños con strings sobre él fallan e ignoran dónde están realmente los datos.',
      'El JSON escrito como texto pierde la garantía del schema y duplica la salida; el input de tool_use ya es la respuesta.',
    ],
    rule: 'Lee la salida estructurada del input del bloque tool_use, no de los bloques de texto.',
  },
  'e2-required-nullable-not-optional': {
    scenario:
      'Para frenar los valores fabricados, tu equipo hizo opcionales todos los campos del schema de facturas. La fabricación bajó, pero ahora el 12% de las salidas omiten invoice_date o currency aunque estén impresos en la factura, y el cargador del ERP no puede distinguir «no está en el documento» de «el modelo se lo saltó».',
    ask: '¿Cómo deberías rediseñar el schema?',
    options: [
      'Vuelve a hacer todos los campos obligatorios con un tipo no nulo, y añade una regla en el prompt para no inventar nunca un valor que no esté en el texto.',
      'Mantén los campos opcionales y reintenta cada vez que falte una clave, pidiendo al modelo que vuelva a buscar ese campo concreto.',
      'Mantén los campos opcionales y haz que el cargador trate cada clave ausente como «no está en el documento», ya que es el caso habitual.',
      'Marca todos los campos como obligatorios pero que admitan null, para que cada clave deba aparecer y null se use solo si el valor falta de verdad.',
    ],
    why: [
      'Los campos obligatorios no nulos traen de vuelta la fabricación. Una regla en el prompt no puede pesar más que un schema que exige un valor.',
      'Muchas claves ausentes faltan de verdad, así que estos reintentos desperdician llamadas y presionan al modelo para inventar valores.',
      'Los datos muestran que los valores omitidos suelen estar impresos en la factura, así que tratar la omisión como ausencia pierde datos reales.',
      'Obligatorio pero nullable hace que el modelo trate cada campo de forma explícita, así que null pasa a ser un «no está en la fuente» deliberado y desaparecen las omisiones silenciosas.',
    ],
    rule: 'Obligatorio + nullable: cada clave aparece y null significa explícitamente «no está en la fuente».',
  },
  'p-closed-labels': {
    scenario:
      'Un clasificador de tickets devuelve etiquetas inconsistentes: «Billing», «billing issue», «Payments», «Invoice problem». Los dashboards downstream no pueden agruparlas.',
    ask: '¿Qué debería cambiar?',
    options: [
      'Normaliza las etiquetas a posteriori con fuzzy matching de strings contra los nombres que esperan los dashboards.',
      'Usa un modelo más grande, que tiende a elegir una redacción más consistente entre tickets parecidos.',
      'Pide al modelo que «use siempre nombres de categoría consistentes y cortos» y que reutilice las etiquetas anteriores.',
      'Define las etiquetas como un enum en el schema, con "other" más un campo de detalle, y añade unos pocos ejemplos de cada una.',
    ],
    why: [
      'Parchea el síntoma y no detecta variantes nuevas.',
      'La redacción varía con cualquier modelo si el conjunto de etiquetas no está definido.',
      'El modelo no sabe qué etiquetas están permitidas.',
      'Un enum explícito hace que la salida sea consistente; "other" + detalle la mantiene extensible, y los ejemplos muestran dónde están los límites.',
    ],
    rule: 'Clasificación: conjunto cerrado de etiquetas, impuesto por el schema.',
  },
  'p-structured-outputs': {
    scenario:
      'Un pipeline de extracción pide a Claude que «devuelva JSON con estos campos». Alrededor del 3% de las respuestas son JSON inválido u omiten campos obligatorios, lo que rompe el sistema downstream.',
    ask: '¿Cuál es la solución más fiable?',
    options: [
      'Añade «IMPORTANTE: responde solo con JSON válido, sin texto adicional» tanto al system prompt como al turno del usuario.',
      'Repara el JSON roto con un parser tolerante y regexes, y luego rellena los campos que falten con valores por defecto.',
      'Extrae mediante una herramienta con un JSON schema (tool_use), y sigue validando las reglas de negocio en código.',
      'Pon la temperature a 0 y añade al prompt un ejemplo completo del objeto JSON esperado.',
    ],
    why: [
      'Reduce los fallos, pero no garantiza nada.',
      'Frágil, y puede producir datos erróneos en silencio.',
      'El tool use con un JSON schema elimina los errores de sintaxis. No detecta errores semánticos, así que la validación sigue comprobando el significado.',
      'Menos variación, no una garantía.',
    ],
    rule: 'Garantiza la forma con un schema; comprueba el significado en código.',
  },
  'e-calculated-total': {
    scenario:
      'Tu extracción de facturas usa tool use con un JSON schema estricto, y todas las salidas son válidas según el schema. Aun así, contabilidad rechaza el 4% de los registros porque las líneas de factura no suman el total. Algunos son errores de extracción; otros son errores aritméticos reales en la factura del proveedor.',
    ask: '¿Cuál es la forma más eficaz de gestionarlo?',
    options: [
      'Endurece el schema con valores mínimos y formatos numéricos en cada importe, para que los totales erróneos se rechacen antes de llegar a contabilidad.',
      'Reintenta cada factura cuyas líneas no cuadren con el total, e indica al modelo que corrija los valores hasta que ambas sumas coincidan.',
      'Extrae un calculated_total junto al stated_total más un flag conflict_detected, y envía a revisión las facturas con conflictos.',
      'Conserva solo el stated_total de cada factura y descarta las líneas, ya que el total indicado es el importe que se paga.',
    ],
    why: [
      'Las reglas del schema comprueban tipos y formatos, no si los importes cuadran. Las salidas ya son válidas según el schema.',
      'Forzar que la suma cuadre hace que el modelo cambie valores, ocultando errores reales del proveedor tras números inventados.',
      'Una sintaxis válida no implica corrección semántica. Comparar los totales calculado e indicado señala la discrepancia, y el flag de conflicto la envía a revisión.',
      'Descartar las líneas tira datos que necesitan los sistemas downstream y oculta la discrepancia en lugar de detectarla.',
    ],
    rule: 'Válido según el schema no es correcto: compara el total calculado con el indicado y marca los conflictos.',
  },
  'e-retry-vs-absent': {
    scenario:
      'Tu extracción de pedidos de compra (PO) falla la validación en el 9% de los documentos. Dominan dos causas: fechas escritas como «3 de marzo» que no pasan la comprobación de formato ISO, y un contract_number vacío cuando el PO solo dice «según el acuerdo marco», un documento que nunca envías. Tu bucle reenvía el mismo prompt hasta 3 veces por cada fallo.',
    ask: '¿Cómo deberías rediseñar el bucle de reintentos?',
    options: [
      'Sube el límite de reintentos a 6 para cada fallo, ya que cada intento adicional da al modelo otra oportunidad de encontrar el valor correcto.',
      'Elimina el bucle de reintentos y envía cada documento fallido directamente a revisión humana, ya que los reintentos rara vez cambian la salida del modelo.',
      'Reintenta los fallos de fecha con el documento, la salida fallida y el error de validación exacto; pon contract_number a null y márcalo.',
      'Reintenta cada fallo añadiendo el error de validación y, para contract_number, dile al modelo que el valor tiene que estar en el PO.',
    ],
    why: [
      'Repetir el mismo prompt no aporta ninguna orientación nueva y no puede crear un número de contrato que no está en el documento.',
      'Los reintentos con feedback del error corrigen a bajo coste la mayoría de los fallos de formato. Enviarlos todos a personas desperdicia el tiempo de los revisores.',
      'Los reintentos con feedback específico del error corrigen problemas de formato. No pueden arreglar información ausente de la fuente, así que ese campo debe ir a null y marcado.',
      'El feedback del error ayuda con las fechas, pero insistir en que el número está en el PO empuja al modelo a inventarse uno.',
    ],
    rule: 'Reintenta con el error exacto en los problemas de formato; no reintentes cuando falta información.',
  },
  'e2-provide-referenced-schedule': {
    scenario:
      'Las facturas de transporte a menudo cobran cargos «según las tarifas del Anexo B» y nunca imprimen las tarifas unitarias, así que rate_per_kg falla la validación en el 14% de ellas. Tu bucle reintenta tres veces con el documento, la salida fallida y el error, y después envía la factura a un administrativo; estos reintentos nunca salen bien. El Anexo B de cada transportista está en tu repositorio de contratos.',
    ask: '¿Cuál es el cambio más eficaz?',
    options: [
      'Sube el límite de reintentos a cinco, ya que un mensaje de feedback más rico da al modelo más oportunidades de localizar la tarifa en la factura.',
      'Obtén el Anexo B del transportista y envíalo con la factura en la petición de extracción, para que rate_per_kg pueda leerse de él.',
      'Haz nullable rate_per_kg y acepta null en estas facturas, ya que el valor no está impreso en la factura que recibe el modelo.',
      'Añade ejemplos few-shot de facturas de transporte que imprimen las tarifas unitarias, para que el modelo aprenda dónde suelen poner la tarifa los transportistas.',
    ],
    why: [
      'Ningún número de reintentos puede extraer un valor que no está en la entrada, y el feedback ya era bueno.',
      'Los reintentos fallan cuando la información vive en un documento externo. Aportar ese documento hace que el valor esté presente y se pueda extraer.',
      'Null es correcto cuando un valor no está disponible de verdad. Aquí la fuente existe, así que null tira datos que el pipeline puede obtener.',
      'Los ejemplos ayudan al modelo a encontrar información que está ahí; no pueden hacer aparecer una tarifa ausente en estas facturas.',
    ],
    rule: 'Si el valor vive en otro documento, apórtalo; reintentar no lo encontrará.',
  },
  'e2-retry-include-doc-and-output': {
    scenario:
      'Para ahorrar tokens, tu bucle de reintentos de validación envía una petición nueva con solo el schema y el error, como "line_items[2].quantity must be an integer", sin el documento. El 88% de los reintentos pasan la validación, pero las auditorías encuentran que los registros reintentados tienen cinco veces más valores erróneos que los de primera pasada.',
    ask: '¿Cuál es el cambio más eficaz en la petición de reintento?',
    options: [
      'Envía el documento original, la extracción fallida y el error de validación exacto, para que el valor se corrija contra la fuente.',
      'Envía la extracción fallida con el error de validación, e indica al modelo que cambie solo el campo que no pasó la validación.',
      'Mantén la petición corta pero permite hasta cinco reintentos, y quédate con la primera salida de cada documento que pase la validación del schema.',
      'Vuelve a ejecutar el prompt original desde cero con una temperature más alta, para que el siguiente intento explore otra lectura del documento.',
    ],
    why: [
      'El reintento con feedback funciona cuando el modelo recibe la fuente, su respuesta anterior y el error exacto, así que corrige contra el documento en lugar de adivinar.',
      'Sin el documento, el modelo solo puede adivinar la cantidad corregida. Proteger los demás campos no hace que ese valor sea correcto.',
      'Más reintentos a ciegas solo producen más suposiciones válidas según el schema. Pasar la validación no es lo mismo que ser correcto.',
      'Una ejecución nueva sin el mensaje de error no le da al modelo ninguna idea de qué estaba mal, así que el mismo fallo puede volver.',
    ],
    rule: 'Un reintento necesita el documento fuente, la salida fallida y el error exacto.',
  },
  'e2-swapped-parties-semantic-check': {
    scenario:
      'Todas las facturas de compra que procesas van dirigidas a tu propia empresa, ACME GmbH. La validación del schema pasa en el 100% de las salidas, pero el 3% de los registros ponen a ACME como vendedor y al proveedor como comprador, sobre todo en facturas donde el bloque del comprador aparece impreso encima del bloque del vendedor.',
    ask: '¿Cuál es la forma más eficaz de detectar y corregir estos registros?',
    options: [
      'Activa el strict mode en el schema de la herramienta de extracción, que rechaza cualquier salida que coloque valores en los campos equivocados.',
      'Envía todos los registros a revisión humana, ya que ningún campo de una salida válida según el schema es fiable hasta que lo revise una persona.',
      'Comprueba en código que buyer_tax_id es el de ACME; si no, reintenta con el documento, la salida y ese error concreto.',
      'Añade una instrucción que pida al modelo revisar dos veces comprador y vendedor antes de responder y tener especial cuidado.',
    ],
    why: [
      'Los schemas estrictos eliminan los errores de sintaxis, no los semánticos. Un comprador y un vendedor intercambiados son perfectamente válidos según el schema.',
      'Revisarlo todo desperdicia un tiempo de revisión escaso cuando una comprobación determinista aísla el 3% erróneo.',
      'Una comprobación semántica barata detecta valores colocados en el campo equivocado, algo que los schemas no pueden detectar, y un reintento dirigido lo corrige porque la información está en el documento.',
      'Las instrucciones de «ten cuidado» no dan al modelo ninguna señal nueva; el diseño que lo confunde sigue ahí.',
    ],
    rule: 'Los schemas frenan los errores de sintaxis; detecta los valores en el campo equivocado con comprobaciones semánticas.',
  },
  'e2-words-vs-figures-conflict': {
    scenario:
      'Extraes importes de préstamos de pagarés. En el 2% de los pagarés, el importe en letras («cuarenta y cinco mil dólares») no coincide con el importe en cifras («54.000 $»). El modelo devuelve uno de los dos sin avisar, y tu validador, que solo comprueba que amount sea un número positivo, da por buenos todos los registros.',
    ask: '¿Cuál es la forma más eficaz de gestionar estos pagarés?',
    options: [
      'Añade una regla para usar siempre las cifras, ya que los importes numéricos son más fáciles de parsear y validar para los sistemas downstream.',
      'Reintenta cada pagaré en el que los dos importes difieran, pidiendo al modelo que vuelva a leer el pagaré con atención hasta que ambas lecturas coincidan.',
      'Añade al schema un máximo para amount basado en los tamaños de préstamo habituales, para que las cifras mal leídas fallen la validación y se reintenten.',
      'Extrae amount_in_words y amount_in_figures con un flag conflict_detected, y envía a revisión los pagarés en los que no coincidan.',
    ],
    why: [
      'Una preferencia arbitraria elige un valor sin que nadie sepa que el pagaré era incoherente, y puede ser el equivocado.',
      'El propio documento es incoherente, así que los reintentos no pueden hacer que cuadre. Solo empujan al modelo a descartar uno de los valores.',
      'Ambos importes pueden estar dentro de un rango normal, así que un límite de rango no detecta el conflicto en absoluto.',
      'Cuando la fuente se contradice, extraer ambos valores con un flag conflict_detected saca a la luz el problema en lugar de ocultarlo tras una elección silenciosa.',
    ],
    rule: 'Cuando la fuente se contradice, extrae ambos valores y marca el conflicto.',
  },
  'p-validate-retry': {
    scenario:
      'La extracción de facturas usa structured outputs, así que el JSON siempre cumple el schema. Pero a veces el total extraído no es igual a la suma de las líneas de la factura.',
    ask: '¿Qué debería hacer el pipeline?',
    options: [
      'Nada más: los structured outputs garantizan el schema, así que se puede confiar en los valores extraídos tal cual.',
      'Añade al prompt «asegúrate de que el total sea igual a la suma de las líneas» y deja el pipeline como está.',
      'Cambia los campos numéricos del schema a strings para evitar problemas de redondeo en los totales.',
      'Comprueba la suma en código; si falla, reintenta con el error concreto o envíalo a revisión humana.',
    ],
    why: [
      'Un schema garantiza la forma, no la verdad.',
      'Ayuda, pero sin garantía y sin detección.',
      'No toca el problema real.',
      'Comprobación determinista más un reintento dirigido. Escala cuando siga fallando.',
    ],
    rule: 'Válido según el schema ≠ correcto: valida la semántica y reintenta con feedback.',
  },
  'e-batch-resubmit': {
    scenario:
      'Tu job nocturno de Message Batches extrajo datos de 80.000 reclamaciones archivadas. Fallaron 2.400 peticiones: la mayoría eran documentos que superaban el límite de contexto, y algunas no pasaron la comprobación del schema de salida. Para el mes que viene está previsto un backfill de 300.000 documentos con el mismo prompt.',
    ask: '¿Cuál es el mejor plan?',
    options: [
      'Reenvía solo las peticiones fallidas por custom_id, troceando las demasiado grandes, y afina el prompt con una muestra antes de la ejecución grande.',
      'Reenvía las 80.000 peticiones con un prompt mejorado, para que todos los resultados de la base de datos salgan de la misma versión del prompt.',
      'Pasa ambos jobs a la API síncrona, para que cada documento fallido se pueda reintentar al momento en vez de esperar a que termine un batch.',
      'Reenvía las 2.400 peticiones fallidas sin cambios en un batch nuevo, ya que la mayoría de los errores de batch son temporales y pasan en un segundo intento.',
    ],
    why: [
      'custom_id indica exactamente qué documentos fallaron, así que solo se reenvían esos, con correcciones. Afinar antes el prompt con una muestra sube la tasa de éxito a la primera en la ejecución grande.',
      'Reprocesar 77.600 documentos que salieron bien desperdicia tiempo y dinero sin ninguna ganancia.',
      'Son jobs nocturnos que toleran latencia. Renunciar al 50% de ahorro del batch no arregla los documentos demasiado grandes.',
      'Los documentos que superan el límite de contexto volverán a fallar si no se trocean. Reenviarlos sin cambios repite el error.',
    ],
    rule: 'Reenvía solo los custom_id fallidos con correcciones; afina antes el prompt con una muestra.',
  },
  'e2-batch-custom-id-mapping': {
    scenario:
      'Tu batch nocturno extrae 12.000 formularios de seguros. El cargador asocia cada resultado a su formulario por su posición en el archivo de resultados. Tras una ejecución, 3.100 pólizas se actualizaron con datos de otro cliente, porque los resultados no habían vuelto en el orden de envío.',
    ask: '¿Cuál es la solución más fiable?',
    options: [
      'Ordena los resultados por su hora de finalización antes de cargarlos, para que vuelvan a coincidir con el orden en que se enviaron los formularios.',
      'Pon como custom_id de cada petición el ID del formulario, y asocia cada resultado a su formulario por custom_id al cargar la salida.',
      'Haz que el modelo copie el nombre de archivo del formulario en su salida, y asocia cada resultado a su formulario por ese nombre extraído.',
      'Divide el job en batches de 100 formularios, para que cualquier desajuste afecte a menos registros y sea más fácil de detectar para el equipo.',
    ],
    why: [
      'El orden de finalización no es el orden de envío, así que ordenar por tiempo sigue emparejando mal los resultados.',
      'custom_id existe para correlacionar las peticiones de un batch con sus respuestas, sea cual sea el orden en que vuelvan los resultados.',
      'Un identificador copiado por el modelo puede estar mal o faltar, lo que añade una nueva fuente de errores al cruce.',
      'Los batches más pequeños solo reducen el daño; cruzar los resultados por posición sigue estando mal.',
    ],
    rule: 'Correlaciona los resultados del batch por custom_id, nunca por posición.',
  },
  'e2-batch-no-midrequest-tools': {
    scenario:
      'Tu extracción síncrona permite a Claude llamar a lookup_vendor a mitad de la petición para obtener un ID de proveedor, y luego llamar a save_extraction. Para recortar costes, el equipo pasó sin cambios la ejecución nocturna de 40.000 facturas a la Message Batches API. Los resultados vuelven con bloques tool_use de lookup_vendor y sin extracciones.',
    ask: '¿Cómo deberías rediseñar el job de batch?',
    options: [
      'Añade una URL de callback a cada petición del batch para que la Batches API pueda ejecutar lookup_vendor por sí misma y luego continuar la misma extracción.',
      'Mantén ambas herramientas en cada petición y pon tool_choice en "any", para que cada petición llame directamente a save_extraction al final.',
      'Devuelve la ejecución nocturna a la API síncrona, porque ninguna petición de un batch puede usar herramientas ni JSON schemas en absoluto.',
      'Haz que cada petición del batch sea una única llamada de extracción que devuelva el nombre del proveedor, y busca los IDs de proveedor en código después del batch.',
    ],
    why: [
      'Las peticiones de batch no tienen ningún mecanismo de callback para ejecutar herramientas; esta funcionalidad no existe.',
      '"any" solo fuerza alguna llamada a herramienta. El modelo aún puede llamar a lookup_vendor, y nada puede devolver su resultado dentro de un batch.',
      'Una extracción con tool_use de un solo turno funciona bien en un batch, así que renunciar al 50% de ahorro es innecesario.',
      'La Batches API no puede ejecutar herramientas a mitad de la petición y devolver sus resultados, así que mantén cada petición en un solo turno y haz la búsqueda después en código.',
    ],
    rule: 'Las peticiones de batch no pueden ejecutar herramientas a mitad de petición; mantenlas de un solo turno y enriquece después.',
  },
  'e2-batch-sla-cadence': {
    scenario:
      'Las declaraciones de aduanas llegan a todas horas, y la normativa exige extraer sus datos en las 32 horas siguientes a su recepción. Usas la Message Batches API por su ahorro del 50%, y un batch puede tardar hasta 24 horas en terminar. Hoy envías un batch cada noche a las 02:00.',
    ask: '¿Cómo deberías programar los envíos de batches?',
    options: [
      'Envía un batch cada 6 horas, para que ninguna declaración espere más de 6 horas más un máximo de 24 horas de procesamiento del batch.',
      'Mantén el batch nocturno, ya que la mayoría de los batches terminan muy por debajo de 24 horas y en la práctica el límite de 32 horas rara vez corre peligro.',
      'Envía un batch cada 12 horas, lo que reduce a la mitad la espera del calendario nocturno sin dejar de mantener cada batch grande.',
      'Envía un batch cada vez que se acumulen 5.000 declaraciones, lo que con el volumen actual ocurre más o menos cada 14 horas.',
    ],
    why: [
      'El peor caso es el intervalo de envío más la ventana de 24 horas: 6 + 24 = 30 horas, que cabe dentro del límite de 32 horas con un pequeño margen.',
      'Los batches no tienen garantía de latencia, así que planifica para 24 horas. Una declaración que llegue a las 02:01 podría esperar unas 48 horas.',
      '12 horas de espera más hasta 24 horas de procesamiento son 36 horas, lo que incumple el requisito de 32 horas.',
      'Un disparador por cantidad no acota el tiempo de espera: 14 + 24 = 38 horas ya, y empeora cada vez que baja el volumen.',
    ],
    rule: 'El intervalo de envío más la ventana de 24 horas del batch debe caber dentro del SLA.',
  },
  'e-calibrate-confidence': {
    scenario:
      'Tu herramienta de extracción devuelve una puntuación de confianza (0–1) para cada campo. Cualquier campo por debajo de 0,8, un número elegido a ojo, va a los revisores. Los revisores están desbordados con fechas que resultan ser correctas, mientras que IBANs erróneos con puntuación 0,93 pasan directamente a pago.',
    ask: '¿Cuál es la forma más eficaz de mejorar el enrutamiento a revisión?',
    options: [
      'Sustituye las puntuaciones por campo por una única puntuación de confianza por documento, para que los revisores comprueben documentos enteros en lugar de campos sueltos.',
      'Calibra umbrales por campo en un conjunto de validación etiquetado, midiendo con qué puntuaciones las extracciones de cada campo son realmente erróneas.',
      'Dile al modelo en el prompt que sea más estricto y honesto con su incertidumbre, para que sus puntuaciones reflejen lo preciso que es en realidad.',
      'Sube el umbral global de 0,8 a 0,95, para que los arriesgados errores de IBAN queden por debajo y también se envíen a los revisores.',
    ],
    why: [
      'Una sola puntuación por documento pierde el detalle por campo que muestra dónde se producen los errores, y los revisores acaban volviendo a comprobar todos los campos.',
      'La confianza bruta del modelo no está calibrada. Un conjunto etiquetado muestra, campo a campo, qué puntuaciones predicen de verdad errores, así que los umbrales envían la revisión donde importa.',
      'Pedir honestidad no calibra nada. Sigues sin evidencia que relacione las puntuaciones con las tasas de error reales.',
      'Un umbral global más alto inunda a los revisores con aún más campos correctos, y sigue siendo una suposición, no una calibración por campo.',
    ],
    rule: 'Las puntuaciones de confianza solo pueden enrutar la revisión tras calibrarlas por campo con datos etiquetados.',
  },
  'e-segment-accuracy': {
    scenario:
      'Tu pipeline de extracción consigue un 97% de precisión por campo en un conjunto de validación de 2.000 documentos. La dirección quiere dejar de revisar manualmente toda extracción con confianza superior a 0,9. El conjunto es en un 85% facturas mecanografiadas; también tiene albaranes manuscritos y formularios de aduanas escaneados, pero nadie ha mirado sus resultados por separado.',
    ask: '¿Qué deberías hacer antes de reducir la revisión humana?',
    options: [
      'Desglosa la precisión por tipo de documento y por campo, y confirma que cada segmento alcanza el listón antes de automatizar cualquier parte.',
      'Aprueba el cambio: un 97% sobre 2.000 documentos es una muestra grande y un resultado sólido para el pipeline en su conjunto.',
      'Sube el umbral a 0,97 para todos los tipos de documento, para que solo las mejores extracciones puedan saltarse la revisión humana.',
      'Añade 2.000 facturas mecanografiadas más al conjunto de validación para que la cifra del 97% sea más precisa antes de que el cambio entre en producción.',
    ],
    why: [
      'La precisión agregada puede ocultar segmentos débiles. Los albaranes manuscritos o los formularios de aduanas pueden estar muy por debajo del 97%, así que valida primero por tipo y campo.',
      'Una muestra global grande dice poco de los segmentos pequeños. Las facturas mecanografiadas son el 85% del conjunto y dominan la cifra.',
      'Un único umbral global sigue suponiendo que la confianza significa lo mismo en todos los segmentos, algo que nadie ha comprobado.',
      'Más documentos del tipo dominante hacen que el total parezca más preciso mientras los segmentos débiles siguen sin medirse.',
    ],
    rule: 'Comprueba la precisión por tipo de documento y campo antes de automatizar. Los totales esconden huecos.',
  },
  'e-stratified-sampling': {
    scenario:
      'Tu pipeline aprueba automáticamente las extracciones de alta confianza; solo las de baja confianza van a los revisores. A los tres meses, un proveedor cambió el diseño de sus facturas y se aprobaron automáticamente 600 identificadores fiscales erróneos antes de que un auditor se diera cuenta. No tenías ninguna medida continua de la tasa de error entre las extracciones aprobadas automáticamente.',
    ask: '¿Qué deberías añadir para detectar antes este tipo de problema?',
    options: [
      'Baja el umbral de confianza para que más extracciones vayan a los revisores, y mantenlo así hasta que la próxima auditoría no encuentre errores.',
      'Pide al modelo que añada una breve autoevaluación a cada extracción, y envía a revisión las que expresen dudas sobre algún campo.',
      'Envía a revisión una muestra aleatoria estratificada de extracciones de alta confianza, para seguir las tasas de error y detectar patrones de error nuevos.',
      'Revisa las primeras 200 extracciones aprobadas automáticamente cada lunes, lo que da una comprobación semanal constante con una carga de trabajo predecible.',
    ],
    why: [
      'Añade trabajo a los revisores, pero sigue sin medir los errores de lo que se aprueba automáticamente, y un cambio de diseño puede producir errores con alta confianza.',
      'Es el mismo modelo juzgándose a sí mismo. Los errores con alta confianza de un diseño nuevo no se marcarán.',
      'El muestreo aleatorio estratificado mide la tasa de error real de la salida aprobada automáticamente en cada segmento y revela patrones nuevos, como los cambios de diseño.',
      'Las 200 primeras de la semana no son ni aleatorias ni estratificadas, así que pueden quedar fuera proveedores o tipos de documento enteros.',
    ],
    rule: 'Sigue muestreando la salida de alta confianza, de forma estratificada y aleatoria, para detectar errores nuevos.',
  },
  'e2-review-capacity-routing': {
    scenario:
      'Los revisores pueden comprobar 400 contratos extraídos al día; llegan 1.500. La confianza por campo está calibrada en un conjunto etiquetado, y el 9% de los contratos llevan conflict_detected (por ejemplo, dos cláusulas distintas de ley aplicable). Los revisores trabajan por orden de llegada, y la mayor parte de lo que comprueban ya es correcto.',
    ask: '¿Cómo deberías repartir la capacidad de revisión?',
    options: [
      'Revisa cada día una muestra aleatoria uniforme de 400 contratos, para que el esfuerzo de revisión refleje la mezcla global de tipos de documento que llegan.',
      'Pide al modelo una única puntuación de confianza global por contrato, y revisa los 400 contratos con las puntuaciones más bajas.',
      'Prioriza los contratos con conflict_detected o con baja confianza calibrada en campos clave; muestrea aleatoriamente unos pocos del resto.',
      'Revisa los 400 contratos más largos cada día, ya que los contratos más largos tienen más cláusulas y, por tanto, más ocasiones de error.',
    ],
    why: [
      'El muestreo uniforme gasta la mayor parte de la capacidad en extracciones que ya son correctas, igual que la cola actual.',
      'Una autoevaluación no calibrada a nivel de documento sustituye a la señal calibrada por campo que ya tienes.',
      'La capacidad limitada de revisión debe ir primero a las fuentes contradictorias y a la baja confianza calibrada, con una pequeña porción aleatoria para seguir midiendo el resto.',
      'La longitud es un indicador débil del riesgo. Ignora los flags de conflicto y las puntuaciones de confianza que apuntan a errores reales.',
    ],
    rule: 'Dedica la escasa capacidad de revisión primero a los documentos de baja confianza y contradictorios.',
  },
  'e2-stratify-rare-doc-types': {
    scenario:
      'Para monitorizar las extracciones aprobadas automáticamente, revisas cada semana un 1% aleatorio uniforme. El volumen es un 92% de facturas; los conocimientos de embarque y los certificados de origen son alrededor de un 1% cada uno, así que una muestra semanal contiene dos o tres de cada. Un cambio de diseño hizo que origin_country fuera erróneo en los certificados durante nueve semanas antes de que nadie se diera cuenta.',
    ask: '¿Cómo deberías cambiar el muestreo?',
    options: [
      'Sube la muestra uniforme al 3% semanal, para que todos los tipos de documento tengan más cobertura sin cambiar el método de muestreo.',
      'Muestrea solo las extracciones con confianza entre 0,90 y 0,95, ya que los errores tienden a concentrarse justo por encima del corte de aprobación.',
      'Deja de muestrear facturas, ya que son el 92% del volumen y su tasa de error se ha mantenido estable durante los dos últimos trimestres.',
      'Estratifica la muestra por tipo de documento, con un número mínimo de documentos por tipo cada semana, y sigue las tasas de error por tipo.',
    ],
    why: [
      'Triplicar la muestra añade sobre todo facturas. Los tipos poco frecuentes siguen teniendo un puñado de documentos, demasiado pocos para ver un problema a tiempo.',
      'Los certificados se extrajeron mal con alta confianza. Pueden aparecer patrones de error nuevos con cualquier nivel de confianza, así que una banda estrecha no los ve.',
      'Las facturas también pueden cambiar de diseño, y quitar el segmento más grande elimina la monitorización justo donde caería la mayoría de los errores.',
      'El muestreo aleatorio estratificado da a cada segmento suficientes documentos revisados para medir su tasa de error y detectar pronto patrones de error nuevos.',
    ],
    rule: 'Estratifica las muestras de revisión para que también se midan los tipos de documento poco frecuentes.',
  },
  'e2-as-of-dates-provenance': {
    scenario:
      'Tu sistema extrae datos de empresas (plantilla, ingresos) de informes anuales, notas de prensa y documentos regulatorios a un único perfil. Los analistas ven un flag de «conflicto» en el 22% de los perfiles, pero la mayoría comparan un informe de 2022 que dice 1.200 empleados con una nota de 2024 que dice 1.850, y no pueden distinguir los conflictos reales de los datos antiguos.',
    ask: '¿Cuál es el cambio más eficaz en la salida de la extracción?',
    options: [
      'Guarda cada valor con su documento fuente, página y fecha de referencia, y marca conflictos solo entre fuentes del mismo periodo.',
      'Conserva solo el valor del documento procesado más recientemente para cada campo, y descarta del perfil los valores más antiguos.',
      'Promedia los valores de cada campo entre todas las fuentes, ponderando cada fuente según lo fiable que suele ser su tipo de documento.',
      'Pide al modelo que elija el valor más creíble de cada campo y añada en el perfil una breve nota que explique su elección.',
    ],
    why: [
      'Las fechas de referencia y la atribución de la fuente permiten leer las diferencias temporales como cambios a lo largo del tiempo, mientras los conflictos reales quedan anotados con sus fuentes.',
      'El orden de procesamiento no es la antigüedad de los datos, y descartar valores tira tanto la procedencia como el historial.',
      'Promediar mezcla años distintos en un número que ninguna fuente ha publicado nunca.',
      'Elegir un valor en silencio pierde el conflicto y la atribución. Los conflictos deben anotarse, no resolverse de forma arbitraria.',
    ],
    rule: 'Guarda la fuente y la fecha de referencia con cada valor para que los saltos temporales no se lean como conflictos.',
  },
  'p-chaining': {
    scenario:
      'Un único prompt investiga un tema, escribe un esquema, redacta un artículo y lo traduce al español. Todas las fases salen mediocres, y cuando algo va mal nadie sabe qué fase ha fallado.',
    ask: '¿Cuál es el mejor enfoque?',
    options: [
      'Haz el prompt más largo, con una sección detallada de instrucciones y criterios de éxito para cada fase.',
      'Añade al prompt tres artículos de ejemplo completos, cada uno con la investigación, el esquema, el borrador y la traducción.',
      'Sube max_tokens para que la única respuesta tenga espacio suficiente para hacer bien las cuatro fases.',
      'Divídelo en prompts encadenados, uno por fase, pasando cada salida con comprobaciones entre medias.',
    ],
    why: [
      'Un prompt sobrecargado al que se le añade aún más carga.',
      'Caro, y no separa las fases.',
      'El espacio no es el problema.',
      'Cada paso recibe toda la atención del modelo, y puedes inspeccionar y probar cada eslabón.',
    ],
    rule: 'Tareas complejas de varias fases → prompt chaining.',
  },
};
