// Traducción al español de las preguntas nivel examen, por id, con el mismo criterio que questions-es.ts.
import type { QuestionText } from './game.ts';

export const EXAM_LEVEL_ES: Record<string, QuestionText> = {
  // --- Customer Support Resolution Agent ---
  'x-support-closing-phrase-loop': {
    scenario:
      'Tu agente de soporte funciona con un bucle escrito a mano, anterior a la migración del equipo al Agent SDK. Da un turno por terminado cuando el texto del asistente coincide con una regex de frases de cierre («algo más en lo que pueda ayudarte», «que tengas un buen día»); si no, añade «Continúa, por favor» y vuelve a llamar al modelo, con un tope fijo de 10 iteraciones. Desde que marketing reescribió la personalidad para que suene más cercana, han aparecido dos fallos. En el 5% de los chats de reembolso el agente escribe «Tu reembolso está en camino, ¿algo más en lo que pueda ayudarte?» en la misma respuesta que contiene un bloque tool_use de `process_refund`; el bucle sale y el reembolso nunca se ejecuta. En el 7% de los chats el agente pregunta «¿A cuál de tus dos pedidos te refieres?», no coincide nada y, tras «Continúa, por favor», elige uno de los pedidos por su cuenta. La latencia mediana del modelo es de 2,6 s por llamada, dentro del SLA del chat.',
    ask: '¿Qué cambio en el bucle corrige ambos fallos de forma más fiable?',
    options: [
      'Exigir en el system prompt un token literal `[RESOLVED]` al final del mensaje final del agente y salir solo cuando aparezca, para que la terminación deje de depender del tono de la personalidad y el bucle actual pueda quedarse como está.',
      'Mantener la regex pero salir solo cuando la respuesta tampoco tenga bloques tool_use, y bajar el tope a 4 iteraciones para que las respuestas sin coincidencia se corten antes en lugar de empujarlas a adivinar con avisos repetidos.',
      'Guiar el bucle por `stop_reason`: mientras sea `"tool_use"`, ejecutar todas las tools pedidas y añadir sus resultados; con `"end_turn"`, enviar la respuesta al cliente y esperar la suya, con un tope solo como red de seguridad.',
      'Tras cada respuesta, llamar a un pequeño prompt clasificador que juzgue si la conversación ha terminado y devolver el control al cliente solo si dice que sí, para que el bucle se adapte a futuros cambios de personalidad sin lista de frases.',
    ],
    why: [
      'Un marcador sigue siendo una señal en lenguaje natural que el modelo emite de forma probabilística: escrito junto a un bloque tool_use, el bucle sale igual antes del reembolso, y sin marcador tras una pregunta aclaratoria sigue empujando al modelo a adivinar.',
      'Comprobar los bloques tool_use arregla el reembolso perdido, pero la pregunta aclaratoria sigue sin coincidir con ninguna frase y recibe el aviso; bajar el tope solo convierte un límite arbitrario en la regla principal de parada.',
      '`stop_reason` es la señal fiable: `"tool_use"` significa ejecutar las tools y seguir, y `"end_turn"` significa que el modelo espera al cliente, lo que cubre tanto el reembolso pendiente como la pregunta aclaratoria.',
      'Añade otro juicio probabilístico y una llamada extra por turno, y sigue ignorando el bloque tool_use: un veredicto de «terminado» sobre la respuesta del reembolso se saltaría el reembolso igual que la regex.',
    ],
    rule: 'El bucle lo controla `stop_reason`: sigue con `tool_use`, para con `end_turn`; nunca analices el texto del modelo.',
  },
  'x-support-multi-concern-shared-context': {
    scenario:
      'Alrededor del 26% de los chats plantean varios asuntos a la vez, por ejemplo: «El pedido #5120 llegó con una lámpara rota, me lo cobrasteis dos veces y mi dirección sigue siendo la antigua». El agente original trataba los asuntos estrictamente de uno en uno, respondiendo a cada uno antes de leer el siguiente; estos chats duraban 11 minutos de media, frente a un objetivo de 6. Después el equipo lanzó un subagent por asunto, cada uno con un contexto nuevo. El tiempo bajó a 5 minutos, pero cada subagent volvía a llamar a `get_customer` y `lookup_order`, y el cliente recibía tres respuestas separadas: en el 19% de los casos dos de ellas ofrecían devolver el dinero del mismo cargo, una como reembolso de la lámpara y otra como anulación del cobro duplicado. Los reembolsos de estos chats suponen el 3% de los ingresos, y la base de datos de pedidos absorbe las llamadas extra sin problemas.',
    ask: '¿Qué diseño cumple mejor el objetivo de tiempo y a la vez da una resolución correcta en estos chats?',
    options: [
      'Listar los asuntos distintos, verificar al cliente y cargar el pedido una sola vez, investigar los asuntos en paralelo sobre ese contexto compartido y luego enviar una única respuesta que concilie soluciones solapadas, como un reembolso y una anulación.',
      'Volver a tratar los asuntos de uno en uno en un solo hilo y añadir una regla al system prompt para que el agente revise sus respuestas anteriores en busca de reembolsos solapados antes de ofrecer dinero en cualquier asunto posterior.',
      'Mantener un subagent por asunto por velocidad y añadir un paso final que compare sus respuestas y elimine cualquier oferta de reembolso que duplique un importe ya ofrecido, antes de que salgan al cliente los tres mensajes por separado.',
      'Detectar en la entrada los mensajes con varios asuntos y pedir al cliente que elija primero el más urgente, abriendo tickets de seguimiento para el resto, para que cada conversación se centre en un único asunto bien acotado.',
    ],
    why: [
      'Descomponer primero, investigar en paralelo con el contexto compartido de cliente y pedido y luego sintetizar una única resolución mantiene la velocidad del trabajo en paralelo y permite ver que una sola anulación cubre ambos asuntos.',
      'El tratamiento secuencial es lo que hacía que estos chats duraran 11 minutos frente a un objetivo de 6, y una regla en el prompt para autorrevisar respuestas anteriores es probabilística, así que pueden seguir colándose ofertas contradictorias.',
      'Trata el síntoma: los subagents siguen investigando aislados y el cliente sigue recibiendo tres respuestas; comparar importes no es conciliar, p. ej. un reembolso parcial y la anulación completa del mismo cargo sobrevivirían ambos.',
      'Partir un contacto en varios tickets baja la resolución en el primer contacto, que es justo la métrica que el agente debe subir, y el cliente tiene que volver por asuntos que el agente podía resolver ya.',
    ],
    rule: 'Divide las peticiones con varios asuntos, investígalos en paralelo con contexto compartido y da una resolución única.',
  },
  'x-support-midprocess-handoff': {
    scenario:
      'En las devoluciones mixtas, el agente suele reembolsar con `process_refund` los artículos que cumplen la política y escalar el resto, por ejemplo una batidora abierta que se declara defectuosa el día 41 de un plazo de 30. Estos chats tienen 34 turnos de media. Hoy `escalate_to_human` solo envía un motivo en texto libre como «El cliente quiere reembolso de un artículo abierto, necesita excepción». Los agentes humanos trabajan en una herramienta de colas de un proveedor que solo muestra ese contenido; no pueden ver la transcripción del chat. El trimestre pasado, el 14% de estos escalados acabó con el humano reembolsando un artículo que el agente ya había reembolsado, con un coste de $9.800, y el tiempo medio de gestión es de 8 minutos, casi todo dedicado a volver a pedir a los clientes números de pedido y qué se había hecho ya. Los escalados son el 17% de los chats y la resolución en el primer contacto está ahora en el 81%.',
    ask: '¿Qué cambio reduce mejor tanto los reembolsos duplicados como el tiempo de gestión de estos escalados?',
    options: [
      'Añadir al backend de reembolsos una comprobación de idempotencia que rechace un segundo reembolso de la misma línea de pedido, para que los reembolsos duplicados sean imposibles tanto si los emite el agente como si los emite un humano.',
      'Cuando algún artículo de una devolución necesite una excepción, escalar el caso entero antes de reembolsar nada, para que el humano parta de un estado limpio y no existan reembolsos parciales que se puedan repetir por error.',
      'Añadir la transcripción completa del chat y las salidas en bruto de las tools al campo de motivo de `escalate_to_human`, para que el humano vea cada mensaje y cada resultado tal y como los vio el agente antes de hacerse cargo.',
      'Cambiar `escalate_to_human` para que reciba un resumen estructurado: ID de cliente, pedido, acciones ya completadas con IDs e importes de reembolso, causa raíz del artículo pendiente, importe en cuestión y acción recomendada.',
    ],
    why: [
      'Bloquea el pago duplicado pero no hace nada con los 8 minutos de volver a preguntar: el humano sigue sin datos del pedido, sin causa raíz y sin acción recomendada, así que el tiempo de gestión no cambia.',
      'Retener reembolsos que cumplen la política convierte casos que el agente puede resolver en escalados completos, lo que lleva la resolución en el primer contacto por debajo del objetivo del 80%, y el humano sigue recibiendo el mismo motivo vago de una línea.',
      'Volcar una transcripción de 34 turnos en un campo de texto libre obliga al humano a buscar qué se hizo y qué queda pendiente; un protocolo de traspaso expone esos hechos directamente en lugar de hacer que el lector los reconstruya.',
      'Un traspaso estructurado da al humano lo que no puede ver: quién es el cliente, qué reembolsos ya se hicieron, por qué el artículo pendiente necesita una decisión y qué hacer después. Eso evita reembolsos repetidos y volver a preguntar.',
    ],
    rule: 'Escala con un traspaso estructurado: cliente, acciones hechas, causa raíz, importe y siguiente paso recomendado.',
  },
  'x-support-cumulative-refund-hook': {
    scenario:
      'La política de finanzas dice que cualquier pedido cuyos reembolsos sumen más de $500 necesita aprobación humana. Un hook ya intercepta las llamadas a `process_refund` antes de que se ejecuten, bloquea cualquier llamada individual de más de $500 e indica al agente que llame a `escalate_to_human`. Aun así, la auditoría mensual encontró 37 pedidos cuyos reembolsos sumaban más de $500 sin aprobación. En todos ellos, el agente reembolsó los artículos de uno en uno en el mismo pedido, por ejemplo $380 por un juego de cojines de sofá y $290 por un sillón a juego, cada llamada por debajo del límite. El system prompt explica la regla por pedido y el agente la cumple en torno al 96% de los reembolsos de varios artículos. Las llamadas de reembolso tardan 1,4 s de media, y finanzas ha dejado claro que aprobar después de que el dinero haya salido no cuenta como aprobación.',
    ask: '¿Cuál es la forma más eficaz de garantizar la política?',
    options: [
      'Añadir ejemplos few-shot al system prompt que muestren al agente sumando los reembolsos de un pedido con varios artículos y llamando a `escalate_to_human` cuando el total vaya a pasar de $500, ya que casi siempre cumple ya la regla.',
      'Ampliar el hook de intercepción para que sume el importe pedido a los reembolsos ya emitidos en ese pedido y, si el total va a superar $500, bloquee la llamada e indique al agente que llame a `escalate_to_human`.',
      'Añadir un hook `PostToolUse` en `process_refund` que sume los reembolsos de cada pedido después de cada llamada y, en cuanto el total pase de $500, lance `escalate_to_human` para que una persona revise el pedido.',
      'Bajar el límite por llamada del hook de $500 a $250, lo que habría detectado casi todos los reembolsos fraccionados de la auditoría, manteniendo el mismo comportamiento de bloquear y escalar que el equipo ya ha probado.',
    ],
    why: [
      'Los ejemplos few-shot suben el cumplimiento pero siguen siendo probabilísticos; con un 96%, el 4% restante son justo los pedidos sin aprobar que encontró la auditoría, y finanzas necesita una garantía.',
      'El hook ya bloquea antes de la ejecución; comprobar el total acumulado del pedido en lugar de la llamada suelta impone de forma determinista la regla real por pedido y mantiene la redirección al escalado.',
      '`PostToolUse` se ejecuta después de `process_refund`, así que el dinero ya ha salido; finanzas dijo que la aprobación a posteriori no cuenta.',
      'Trata el síntoma: tres reembolsos de $240 seguirían pasando, y los reembolsos legítimos individuales de entre $250 y $500 se escalarían sin necesidad, lo que perjudica la resolución en el primer contacto.',
    ],
    rule: 'Impón la regla de negocio tal como está escrita (por pedido, no por llamada) en un hook que bloquee antes de ejecutar.',
  },
  'x-support-guest-order-boundaries': {
    scenario:
      'La compra como invitado se lanzó el mes pasado y los invitados ya hacen el 22% de los pedidos. `lookup_order` ya acepta un número de pedido o el email usado al comprar, incluidos los pedidos de invitado, pero su descripción sigue diciendo «Gets an order by ID». `get_customer`, descrita como «Finds a customer by email, phone or name», solo busca en cuentas registradas. Cuando un invitado escribe «Compré con jo.reyes@mail.com y no ha llegado nada», el agente llama a `get_customer`, recibe «not found», dice que no encuentra la cuenta y escala; el 31% de los chats de invitados acaba así. El equipo añadió tres ejemplos few-shot al system prompt; las frases exactas ya se enrutan bien, pero las variaciones siguen fallando. Los clientes registrados también dan su email para verificar su identidad en la mayoría de los chats de reembolso. El servidor MCP corre en la misma máquina que la API de pedidos.',
    ask: '¿Cuál es el siguiente paso más eficaz para corregir la selección de tools en los pedidos de invitado?',
    options: [
      'Añadir una regla al system prompt: «Cuando el cliente dé un email, llama a `lookup_order` en lugar de `get_customer`», para que todo invitado que mencione su email de compra llegue a la tool que puede encontrar su pedido.',
      'Sustituir ambas tools por una única tool `lookup_entity` que acepte cualquier identificador y consulte internamente los backends de cuentas y pedidos, para que el agente ya no tenga que elegir entre las dos tools.',
      'Añadir más ejemplos few-shot que cubran las variaciones que aún fallan, como emails dados a mitad de frase o con una errata, hasta que los ejemplos abarquen todas las formas en que los invitados describen sus pedidos.',
      'Reescribir ambas descripciones: `lookup_order` recibe un número de pedido o el email de compra y cubre pedidos de invitado; `get_customer` solo cubre cuentas registradas, y un email no encontrado debe probarse en `lookup_order`.',
    ],
    why: [
      'Una regla por palabra clave ata todo email a `lookup_order`, así que los clientes registrados que dan su email para verificar su identidad se saltarían `get_customer`; la instrucción pasa por encima de las descripciones en lugar de arreglarlas.',
      'Consolidar puede ser un diseño válido, pero es un cambio mayor de lo que pide un siguiente paso cuando la causa raíz son dos descripciones que no dicen qué cubre cada tool.',
      'El equipo ya vio que los ejemplos arreglan frases exactas pero no variaciones; añadir más persigue frases mientras las descripciones, la principal señal del modelo para elegir tool, siguen sin decir nada de los pedidos de invitado.',
      'Las descripciones son la principal entrada para elegir tool; indicar entradas, cobertura y el límite entre ambas tools (con el caso de no encontrado) corrige la causa raíz para cualquier formulación con poco coste.',
    ],
    rule: 'Corrige el mal enrutado en las descripciones de las tools: entradas, cobertura y cuándo usar la otra tool.',
  },
  'x-support-business-error-retriable': {
    scenario:
      '`process_refund` ya devuelve errores estructurados con `isError`, `errorCategory`, `isRetryable` y un mensaje. Sin embargo, el servicio de pagos asigna a todo rechazo `errorCategory` "validation" con `isRetryable: true`, incluidos los rechazos por política como artículos de venta final, un plazo de devolución vencido o un reembolso ya emitido, cuyo mensaje es solo «Request rejected: RULE_FS_02». Los logs muestran al agente cambiando el código de motivo o el importe y reintentando tres o cuatro veces por caso, para después decir a los clientes «un problema técnico impide tu reembolso, inténtalo más tarde»; el 12% vuelve a contactar con soporte en menos de 48 horas. Los timeouts de la pasarela de pago, que funcionan al reintentar alrededor del 85% de las veces, se etiquetan igual. El equipo de pagos añade códigos de regla nuevos casi todos los meses, y la latencia p95 de la tool es de 900 ms.',
    ask: '¿Qué cambio permite de forma más directa que el agente gestione bien estos fallos?',
    options: [
      'Devolver los rechazos por política como errores de negocio con `isRetryable: false` y una explicación para el cliente como «los artículos de venta final no se reembolsan; puedes cambiarlo», manteniendo los timeouts como transitorios y reintentables.',
      'Añadir al system prompt una tabla que traduzca cada código RULE a una explicación sencilla y diga al agente que nunca reintente esos códigos, para que pueda explicar el rechazo sin tocar nada del servicio de pagos.',
      'Limitar al agente a un único reintento ante cualquier error de `process_refund` y que después se disculpe y ofrezca escalar, para que los rechazos por política dejen de provocar tres o cuatro intentos inútiles en cada caso.',
      'Enviar todo rechazo de `process_refund` a `escalate_to_human` con el código RULE adjunto, para que una persona que conozca las reglas de pago explique el resultado al cliente y decida cualquier alternativa.',
    ],
    why: [
      'Las categorías y flags de reintento correctos cortan los intentos inútiles, mantienen los reintentos para los timeouts que suelen funcionar y dan al agente un motivo que puede contar al cliente en lugar de culpar a un problema técnico.',
      'Es plausible, pero llegan códigos nuevos casi cada mes, así que la tabla se queda obsoleta, y los timeouts siguen etiquetados como los rechazos por política; es la tool, no el prompt, la que debe decir qué tipo de error ha ocurrido.',
      'Recorta algunos reintentos inútiles pero bloquea el segundo intento que salva el 85% de los timeouts, y el agente sigue sin un motivo que dar al cliente, así que los contactos repetidos continúan.',
      'Son resultados de política conocidos que el agente puede explicar por sí mismo; escalarlos todos baja la resolución en el primer contacto y hace esperar al cliente una respuesta que la tool podía haber dado.',
    ],
    rule: 'Marca los rechazos por política como errores de negocio no reintentables, con un motivo que el agente pueda dar al cliente.',
  },
  'x-support-triage-tool-choice-any': {
    scenario:
      'Además del chat en directo, el agente clasifica unos 6.000 emails de soporte cada noche. Cada petición de clasificación ofrece tres tools, `route_to_refund_flow`, `route_to_account_flow` y `escalate_to_human`, y cada email debe acabar exactamente en una de ellas. Con `tool_choice` en "auto", el 7% de las ejecuciones devuelve texto como «Esto parece un tema de facturación para el equipo de cuentas» sin ninguna tool call, y esos emails se quedan sin enrutar hasta que un supervisor los encuentra por la mañana. Una línea en el system prompt que dice «Llama siempre a una tool de enrutado» lo bajó al 2,5%. Producto exige cero emails sin enrutar, el modelo debe seguir decidiendo qué ruta encaja y la cola humana nocturna solo tiene tres agentes. Los emails tienen 160 palabras de media, y la precisión de enrutado en los emails que sí reciben una tool call es del 96%.',
    ask: '¿Qué cambio de configuración cumple mejor estos requisitos?',
    options: [
      'Mantener "auto" y, cuando una respuesta contenga solo texto, reenviar la petición con un recordatorio añadido para que llame a una tool de enrutado, repitiendo hasta tres veces antes de marcar el email para un supervisor.',
      'Cuando la primera respuesta llegue como texto, reenviar la petición con `tool_choice` forzando `escalate_to_human`, para que todo email que de otro modo quedaría sin enrutar llegue a una persona por la mañana.',
      'Poner `tool_choice` en "any" en la petición de clasificación, para que el modelo tenga que responder con una llamada a una de las tres tools de enrutado mientras sigue eligiendo la ruta que encaja con cada email.',
      'Analizar las respuestas de texto en busca del flujo que recomiendan, como «equipo de reembolsos» o «equipo de cuentas», y llamar desde código a la tool de enrutado correspondiente, conservando el criterio del modelo sin exigir una tool call.',
    ],
    why: [
      'Reintentar suele funcionar, pero sigue siendo probabilístico y añade peticiones; puede agotar los tres intentos y dejar emails marcados, lo que incumple el requisito de cero sin enrutar que "any" cumple en la primera llamada.',
      'Garantiza el enrutado, pero manda emails enrutables a una cola nocturna de tres personas, y forzar una tool quita al modelo la decisión de enrutado, que según los requisitos debe tomar él.',
      '"any" garantiza una tool call en lugar de texto conversacional y deja al modelo elegir entre las tres tools, que es justo la combinación que se pide.',
      'Analizar texto en lenguaje natural es frágil: las formulaciones varían, algunas respuestas no nombran ningún flujo y una frase mal interpretada enruta mal el email, así que siguen quedando emails sin enrutar o mal enrutados.',
    ],
    rule: '¿Necesitas una tool call garantizada pero que el modelo elija cuál? Usa `tool_choice` "any", no una tool forzada.',
  },
  'x-support-per-issue-facts-layer': {
    scenario:
      'Los chats con varios asuntos suelen pasar de 100 turnos, así que la app resume todo lo anterior a los últimos 20 turnos cada vez que el uso de contexto supera el 70%. QA revisó 300 de estos chats: en el 11% el agente aplicó un dato al asunto equivocado, como ofrecer en el pedido 5512 el reembolso de $129 acordado para el pedido 5530, o decir al cliente que se había enviado un reemplazo cuando ese estado era del otro pedido. El equipo ya había pedido al resumidor que «conserve todos los importes, fechas y números de pedido». Ahora los números sobreviven, pero los resúmenes dicen cosas como «se hablaron reembolsos de $34 y $129 para los pedidos 5512 y 5530», sin relación entre ellos. El presupuesto de contexto por chat no puede crecer, y los resultados de `lookup_order` ya se recortan a seis campos.',
    ask: '¿Cuál es el cambio más eficaz para que los datos dejen de aplicarse al asunto equivocado?',
    options: [
      'Reescribir el prompt del resumidor para que produzca un párrafo por pedido, cada uno empezando por el número de pedido y con sus importes, estados y promesas, para que los resúmenes posteriores mantengan cada dato junto a su pedido.',
      'Extraer cada asunto a un registro estructurado (ID de pedido, artículo, importe acordado, estado, expectativa del cliente) en una capa de contexto aparte que se envía con cada prompt y se actualiza al cambiar el asunto, fuera del resumen.',
      'Dejar de resumir los chats con varios asuntos y enviar el historial completo en cada petición, ya que la conversación completa es la única fuente que mantiene cada dato unido al pedido con el que se habló.',
      'Una vez identificados los asuntos, abrir un ticket por pedido y seguir cada uno en su propia conversación, para que cada contexto solo contenga los datos de un pedido y los resúmenes no puedan mezclarlos.',
    ],
    why: [
      'Es la segunda mejor, pero sigue siendo resumen progresivo: cada nueva ronda vuelve a condensar los párrafos, y la instrucción anterior ya demostró que pedírselo al resumidor conserva los valores pero no siempre su relación.',
      'Una capa estructurada por asunto mantiene los valores exactos unidos a su pedido fuera del historial resumido, así que las sucesivas rondas de resumen no pueden separar un reembolso de $129 del pedido 5530.',
      'Estos chats pasan de 100 turnos y el presupuesto de contexto no puede crecer, que es justo por lo que existe el resumen; el historial completo es correcto en principio pero incumple esa restricción.',
      'Perjudica la resolución en el primer contacto y obliga al cliente a repetirse en varias conversaciones; la confusión viene de cómo se guardan los datos, y una capa por asunto lo arregla dentro de un solo chat.',
    ],
    rule: 'En chats con varios asuntos, guarda los datos de cada asunto en una capa estructurada fuera del historial resumido.',
  },
  'x-support-no-progress-escalation': {
    scenario:
      'Las cuentas bloqueadas por fraude solo las puede liberar el equipo humano de riesgos; ninguna tool del agente puede levantar el bloqueo y seguridad no permitirá que exista una. `get_customer` devuelve `account_status: "fraud_hold"` para estos clientes. Los logs muestran al agente guiándolos por restablecimientos de contraseña, borrado de caché y reinstalaciones de la app durante 14 turnos de media; el 41% abandona el chat, y la mayoría se mantiene educada todo el tiempo. Los clientes que piden explícitamente una persona se escalan correctamente. La propuesta actual del equipo es escalar automáticamente tras 10 turnos, pero los chats con varios asuntos suelen durar entre 20 y 35 turnos y aun así se resuelven el 88% de las veces. La resolución en el primer contacto global del agente es del 78%, y los bloqueos por fraude son el 4% de los chats.',
    ask: '¿Qué cambio arregla mejor estos chats sin perjudicar los casos que el agente ya resuelve?',
    options: [
      'Adoptar la regla propuesta con un límite más alto de 25 turnos, para que los chats largos con varios asuntos suelan terminar antes de que salte, mientras los chats de bloqueo por fraude que se alargan siguen llegando a una persona sin que el cliente lo pida.',
      'Medir el sentimiento del cliente en cada turno y llamar a `escalate_to_human` cuando la frustración supere un umbral, para que los clientes atascados en un problema que el agente no puede resolver pasen a una persona antes de abandonar.',
      'Hacer que el agente puntúe tras cada turno su confianza en poder resolver el problema y escalar cuando baje de 0,6, para que los casos que no puede gestionar lleguen a una persona antes de que la resolución de problemas se alargue.',
      'Añadir al system prompt criterios de escalado para cuando no sea posible avanzar de verdad, como una acción necesaria que ninguna tool puede hacer, con ejemplos few-shot como una cuenta en `fraud_hold` escalada de inmediato.',
    ],
    why: [
      'Un número de turnos es un sustituto, no una comprobación de avance: los clientes bloqueados por fraude seguirían 25 turnos con pruebas antes de escalar, y algunos chats largos pero productivos con varios asuntos se cortarían.',
      'El sentimiento no refleja la complejidad del caso: la mayoría de estos clientes se mantiene educada, así que seguirían con las pruebas, mientras que clientes frustrados con problemas fáciles se escalarían sin necesidad.',
      'La confianza autoevaluada está mal calibrada; el agente ya se comporta como si pudiera arreglar estas cuentas, así que su confianza seguiría alta mientras sigue proponiendo restablecimientos.',
      'No poder avanzar de verdad es un desencadenante de escalado válido; unos criterios explícitos con ejemplos permiten al agente reconocer el bloqueo en `get_customer` y escalar en el primer turno, sin tocar los chats largos y productivos.',
    ],
    rule: 'Escala cuando no sea posible avanzar de verdad; no lo sustituyas por número de turnos, sentimiento ni confianza.',
  },
  'x-support-shared-phone-matches': {
    scenario:
      'La mayoría de los clientes se identifican ya por número de teléfono, y `get_customer` devuelve dos o más cuentas para el 6% de los números, normalmente hogares que comparten un fijo. Ahora el agente elige la cuenta con el pedido más reciente y pregunta «¿Es por tu pedido #44812 de un molinillo de café?». Una auditoría vio que 1 de cada 8 de estas suposiciones era la cuenta equivocada, así que se mostraron al cliente los detalles de pedido de otro miembro del hogar. Una product manager propone listar las coincidencias con nombres y ciudades enmascarados para que el cliente toque la suya y se ahorre un turno. Legal exige que el agente nunca revele ninguna información de una cuenta hasta que la persona haya quedado vinculada a ella. Las preguntas aclaratorias añaden unos 40 segundos al chat.',
    ask: '¿Cómo debería gestionar el agente un resultado de `get_customer` con varias coincidencias?',
    options: [
      'Pedir al cliente un identificador adicional, como el email de la cuenta o un número de pedido reciente, y volver a llamar a `get_customer` con él, sin revelar nada hasta que coincida una única cuenta.',
      'Mostrar las cuentas coincidentes con nombres y ciudades enmascarados, como «M. L***, Austin», para que el cliente elija la suya con un toque, ahorrando un turno y revelando solo detalles parciales de cada cuenta.',
      'Mantener la elección por pedido más reciente, pero confirmar con una pregunta que no nombre el pedido, como «¿Es por tu última compra?», para que una suposición errónea no muestre detalles de pedidos al cliente.',
      'Enviar todos los casos con varias coincidencias a `escalate_to_human`, donde el personal puede verificar la identidad por teléfono, ya que el agente no puede saber con certeza con qué miembro del hogar habla solo con los resultados de la tool.',
    ],
    why: [
      'Varias coincidencias exigen aclarar con identificadores adicionales, no elegir por heurística; añade unos 40 segundos pero vincula a la persona con una cuenta antes de revelar nada.',
      'Los nombres y ciudades enmascarados siguen siendo información de cuentas a las que la persona no está vinculada, algo que legal prohíbe, y el cliente puede seguir tocando la entrada equivocada.',
      'Sigue siendo una selección heurística: un «sí» a una pregunta vaga puede confirmar la cuenta equivocada, y el agente actúa entonces sobre los pedidos de otra persona, justo el fallo que encontró la auditoría.',
      'Es excesivo para un problema que se resuelve con un identificador más; escalar el 6% de los contactos baja la resolución en el primer contacto sin hacer nada que el agente no pueda hacer por sí mismo.',
    ],
    rule: 'Ante varias coincidencias, pide otro identificador; nunca elijas por heurística ni reveles los candidatos.',
  },
  // --- Code Generation with Claude Code ---
  'x-codegen-hooks-normalize-and-block': {
    scenario:
      'Tu equipo genera código de acceso a datos con Claude Code y dos servidores MCP internos. `schema_registry` devuelve los tipos de columna como códigos numéricos (23, 1043, 1184), mientras que `api_catalog` devuelve nombres como `integer` y `timestamptz`. En el 9% de los repositorios generados algún campo sale con el tipo equivocado, siempre en una columna leída de `schema_registry`, que es de otro equipo y no cambiará este año. Por otro lado, una tool `db_exec` permite a Claude ejecutar SQL en la base de datos compartida de staging para comprobar sus consultas. El CLAUDE.md dice en negrita que nunca ejecute sentencias destructivas allí, pero dos veces este mes Claude ha lanzado `TRUNCATE` sobre tablas que usan otros equipos. El responsable de plataforma quiere que las sentencias destructivas sean imposibles y que cada intento se convierta en una petición al DBA, sin perder las comprobaciones de solo lectura contra staging. Todas las sesiones usan ya el modelo más reciente.',
    ask: '¿Qué combinación de cambios resuelve mejor los dos problemas?',
    options: [
      'Subir la regla de staging al principio del CLAUDE.md con tres ejemplos de Claude negándose a ejecutar SQL destructivo, y añadir una tabla que traduzca cada código de tipo de `schema_registry` a su nombre, con la instrucción de consultarla antes de elegir el tipo de un campo.',
      'Añadir un hook PostToolUse que traduzca los códigos de tipo de `schema_registry` a nombres, y un hook PostToolUse en `db_exec` que revise cada sentencia ejecutada y, siempre que fuera destructiva, abra de inmediato una petición al DBA con la sentencia, la tabla y los datos de la sesión.',
      'Añadir un hook PostToolUse que reescriba los códigos de tipo de los resultados de `schema_registry` como nombres antes de que Claude los procese, y un hook que intercepte las llamadas salientes a `db_exec`, bloquee las sentencias destructivas e indique a Claude que abra una petición al DBA.',
      'Poner un servidor MCP proxy delante de `schema_registry` que traduzca los códigos de tipo a nombres, y sustituir el acceso de `db_exec` al staging compartido por una base de datos desechable por desarrollador que se clona de staging cada noche.',
    ],
    why: [
      'Las dos mitades siguen dependiendo de que Claude decida cumplir. Una regla en negrita en el CLAUDE.md ya ha fallado dos veces, y una tabla de traducción deja a Claude interpretando los códigos en bruto. Ninguna da la garantía que pide el responsable de plataforma.',
      'La mitad de normalización es correcta, pero PostToolUse se ejecuta después de que la tool haya actuado. Cuando ve el `TRUNCATE`, las tablas de los otros equipos ya están vacías: puede informar del daño, pero nunca evitarlo.',
      'Cada problema recibe el hook que le corresponde: PostToolUse transforma los resultados antes de que el modelo razone con ellos, así que los códigos en bruto nunca llegan a Claude, y la intercepción previa detiene la sentencia destructiva antes de ejecutarse y la redirige al flujo del DBA.',
      'Es más infraestructura de la necesaria y no cumple los requisitos: las comprobaciones dejan de hacerse contra el staging compartido y los intentos nunca se convierten en peticiones al DBA. Dos hooks cumplen todo con mucho menos trabajo.',
    ],
    rule: 'Normaliza resultados con PostToolUse; bloquea las llamadas prohibidas antes de que se ejecuten. El prompt solo hace probable el cumplimiento.',
  },
  'x-codegen-refresh-then-fork': {
    scenario:
      'Ayer pasaste 90 minutos en una sesión de Claude Code con nombre, `cache-layer`, analizando el módulo de caché de 40 ficheros de la API de pedidos. Hoy quieres prototipar dos diseños, write-through y cache-aside, y compararlos de forma justa: los dos deben partir exactamente del mismo análisis y ni las ediciones ni el razonamiento de un prototipo pueden filtrarse al otro. Esta noche un compañero ha fusionado un PR que cambia 2 de los 40 ficheros, `CacheKeyBuilder.ts` y su test. Los otros 38 no se han tocado y las conclusiones de ayer sobre ellos siguen valiendo. Repetir el análisis completo costaría otros 90 minutos. El script de benchmark que usarán ambos prototipos está fuera del módulo y no ha cambiado.',
    ask: '¿Cuál es la forma más eficaz de preparar los dos prototipos?',
    options: [
      'Usar fork_session sobre `cache-layer` directamente para crear una rama por diseño, y en cada rama decirle a Claude qué 2 ficheros cambiaron para que los vuelva a analizar antes de empezar el prototipo de esa rama.',
      'Reanudar `cache-layer` con --resume, decirle a Claude que `CacheKeyBuilder.ts` y su test cambiaron para que vuelva a analizar solo esos, y después usar fork_session para crear las ramas de ambos prototipos desde esa base actualizada.',
      'Abrir dos sesiones nuevas, una por diseño, cada una con un resumen estructurado de los hallazgos de ayer y los 2 ficheros cambiados, porque un resumen es más fiable que reanudar con resultados de herramientas de hace un día.',
      'Reanudar `cache-layer` con --resume, señalarle los 2 ficheros cambiados, construir el prototipo write-through, revertir sus ediciones con git y construir cache-aside en la misma sesión sobre el mismo análisis.',
    ],
    why: [
      'Bifurcar antes de actualizar obliga a cada rama a reanalizar por su cuenta los ficheros cambiados, así que las dos bases pueden divergir justo en el código del que dependen ambos diseños, y el trabajo se hace dos veces. La comparación ya no parte de un análisis común.',
      'El contexto previo sigue siendo válido casi entero (38 de 40 ficheros), así que reanudar y nombrar los 2 ficheros cambiados da una actualización dirigida. Bifurcar después da a ambos prototipos la misma base actualizada en ramas independientes.',
      'Empezar de cero con un resumen encaja cuando la mayoría de los resultados están obsoletos. Aquí 38 de 40 ficheros no han cambiado, así que se tira un análisis detallado y válido a cambio de un resumen con pérdidas, y cada sesión relee los ficheros cambiados por separado.',
      'Revertir ficheros no elimina de la conversación el razonamiento del primer prototipo, que condiciona el intento cache-aside. Una única sesión lineal no puede mantener independientes los dos diseños.',
    ],
    rule: 'Actualiza una sesión casi vigente nombrando los ficheros cambiados y bifurca desde ella para que todas las ramas compartan base.',
  },
  'x-codegen-contractors-user-level-snippet': {
    scenario:
      'La semana pasada se incorporaron seis contratistas a tu equipo. En sus sesiones de Claude Code, los nuevos handlers de la API se saltan el formato de sobre de errores del equipo y nunca propagan `X-Request-Id`, mientras que los cuatro desarrolladores originales obtienen ambas cosas siempre. Todos trabajan en la misma rama con la misma versión de Claude Code y el mismo modelo. El CLAUDE.md raíz versionado (220 líneas) cubre los tests y la estructura de carpetas, pero no dice nada de errores. Hace dos años cada desarrollador original pegó un fragmento de "configuración del equipo" en su propio `~/.claude/CLAUDE.md`; contiene las reglas de errores y además preferencias personales como "responde en inglés británico" y "muestra atajos de vim en los ejemplos". Un contratista ejecutó /memory y solo vio el fichero del proyecto. El lead propone enviar hoy el fragmento por correo a los contratistas. El mes que viene entran dos personas más.',
    ask: '¿Qué cambio arregla mejor las sesiones de los contratistas y evita que el problema se repita?',
    options: [
      'Enviar el fragmento por correo para que cada contratista lo pegue en su propio `~/.claude/CLAUDE.md`, igual que la configuración que ya funciona a los cuatro desarrolladores originales, y añadir ese paso a la checklist de incorporación de futuras contrataciones.',
      'Mover el fragmento completo al CLAUDE.md raíz versionado para que todas las sesiones carguen una configuración idéntica, y borrarlo de los ficheros de usuario de los desarrolladores originales para que solo quede una copia que mantener.',
      'Convertir las reglas de errores en un skill del proyecto en `.claude/skills/api-handler/` que los desarrolladores invoquen al escribir handlers, de modo que las reglas queden versionadas sin engordar el CLAUDE.md que se carga siempre.',
      'Mover las reglas del sobre de errores y de `X-Request-Id` al CLAUDE.md raíz versionado y dejar las preferencias personales en el `~/.claude/CLAUDE.md` de cada desarrollador, donde solo se aplican a esa persona.',
    ],
    why: [
      'Hoy funciona, pero deja los estándares del equipo fuera del control de versiones: cada cambio hay que reenviarlo a mano, las copias divergen y cada nueva incorporación depende de un paso de una checklist. Además reparte las preferencias personales de otros.',
      'Compartir las reglas de errores es correcto, pero el fragmento también trae hábitos personales. Versionarlos impone el inglés británico y los ejemplos de vim a los diez desarrolladores, justo lo que el nivel de usuario de la jerarquía existe para evitar.',
      'Estas reglas se aplican a todos los handlers, así que deben estar siempre cargadas. Un skill solo se ejecuta cuando alguien lo invoca, y los handlers escritos en sesiones donde nadie lo ejecutó volverían a saltarse el sobre de errores.',
      'Los estándares del equipo van a nivel de proyecto, compartidos por control de versiones con todo el que clona el repo, incluidas las incorporaciones del mes que viene. Las preferencias personales se quedan a nivel de usuario, que solo se aplica a esa persona.',
    ],
    rule: 'Las reglas del equipo van en el CLAUDE.md del proyecto versionado; ~/.claude/CLAUDE.md es personal y nunca llega al equipo.',
  },
  'x-codegen-stale-directory-claude-md': {
    scenario:
      'El trimestre pasado tu monorepo se estandarizó en `pino` para los logs, y el CLAUDE.md raíz dice que todo el código nuevo debe usarlo. Claude lo cumple en todos los paquetes salvo en `packages/billing`, donde el 70% de los ficheros que genera importan el antiguo `LegacyLogger`. Billing todavía tiene 40 ficheros antiguos que usan `LegacyLogger`, pero `packages/invoicing` también, y allí Claude usa pino sin problemas. El equipo ya añadió "IMPORTANTE: usa siempre pino" al fichero raíz y lo ha repetido en los prompts, sin ningún cambio. Billing fue el primer equipo en adoptar Claude Code, allá por 2025. Al ejecutar /memory en una sesión que trabaja en billing aparecen tres ficheros: el CLAUDE.md raíz, el `~/.claude/CLAUDE.md` del desarrollador y `packages/billing/CLAUDE.md`, cuya sección de logs dice "Usa LegacyLogger; migración a pino pendiente".',
    ask: '¿Cuál es la solución más eficaz?',
    options: [
      'Actualizar la sección de logs de `packages/billing/CLAUDE.md` para que exija pino y borrar la línea obsoleta de `LegacyLogger`, ya que ese fichero se carga al trabajar en billing, y comprobar con /memory que nada de lo cargado la contradice.',
      'Añadir `.claude/rules/billing-logging.md` con `paths: ["packages/billing/**/*"]` exigiendo pino, para que una regla limitada a los ficheros de billing se cargue cada vez que Claude los edite y refuerce la instrucción raíz justo donde se está ignorando.',
      'Migrar primero a pino los 40 ficheros de billing que aún usan `LegacyLogger`, porque Claude imita el estilo de logs del código cercano, y cuando ningún fichero de billing lo importe los ejemplos dejarán de pesar más que la regla raíz.',
      'Subir la regla de pino al principio del CLAUDE.md raíz y añadir dos ejemplos cortos de imports correctos de pino, ya que una regla enterrada entre las demás secciones del fichero es fácil de pasar por alto para Claude.',
    ],
    why: [
      '/memory muestra la causa directamente: un fichero de nivel de directorio que se carga al trabajar en billing sigue diciendo a Claude que use `LegacyLogger`. Corregir esa instrucción en su origen elimina el conflicto en vez de intentar gritar más que ella.',
      'Añade una tercera instrucción mientras la contradictoria de `packages/billing/CLAUDE.md` sigue cargada, así que Claude sigue recibiendo indicaciones en conflicto. Hay que quitar la línea obsoleta.',
      'Invoicing tiene el mismo tipo de imports antiguos y allí Claude usa pino, lo que descarta la imitación como causa. Migrar 40 ficheros es mucho esfuerzo y deja la instrucción obsoleta en su sitio.',
      'El equipo ya hizo más visible la regla raíz sin efecto, porque no es que se pase por alto: otro fichero cargado la contradice. Cambiar la posición o añadir ejemplos no resuelve un conflicto.',
    ],
    rule: 'Si una zona ignora una regla, usa /memory para encontrar el fichero cargado que la contradice y corrígelo.',
  },
  'x-codegen-brainstorm-skill-fork-hint': {
    scenario:
      'Lena escribió un skill `/design-options` en `~/.claude/skills/` que genera cuatro o cinco diseños alternativos para un componente, con pros y contras, antes de que nadie escriba código. Tres compañeros lo copiaron a mano y sus copias ya han divergido. Hay dos problemas recurrentes. Después de ejecutar el skill, Claude mete ideas descartadas en la implementación, por ejemplo hooks de event sourcing en un diseño que el desarrollador eligió precisamente por ser un CRUD simple. Y cuando alguien escribe `/design-options` sin argumentos, genera alternativas para el fichero que esté abierto en ese momento. Cada ejecución tarda unos 90 segundos y el SKILL.md tiene 60 líneas. Ahora el equipo quiere una única versión compartida.',
    ask: '¿Qué cambio resuelve mejor el problema de compartirlo y los dos problemas de comportamiento?',
    options: [
      'Convertirlo en un slash command del proyecto en `.claude/commands/design-options.md` cuyo cuerpo indique a Claude que pida el componente si no se le da y que descarte las opciones rechazadas una vez que el desarrollador elija una.',
      'Mover el skill a `.claude/skills/design-options/` en el repo, añadir `context: fork` para que la lluvia de ideas se ejecute en un contexto de sub-agente aislado y añadir un `argument-hint` que pida el componente si no se indica.',
      'Dejar el skill en `~/.claude/skills/` de Lena, añadir allí `context: fork` y un `argument-hint`, y pedir a los tres compañeros que vuelvan a copiar el fichero actualizado para que todos usen la misma versión mejorada.',
      'Mover el skill a `.claude/skills/design-options/`, limitar `allowed-tools` a herramientas de solo lectura para que no pueda editar ficheros mientras genera ideas, añadir un `argument-hint` e indicar en el CLAUDE.md que se ignoren las opciones rechazadas.',
    ],
    why: [
      'Un command del proyecto se comparte, pero una instrucción de "descartar" las opciones rechazadas no las saca de la conversación: la lluvia de ideas sigue en el contexto principal y se sigue colando en la implementación.',
      'La ubicación en el repo comparte una sola versión por control de versiones; `context: fork` deja la lluvia de ideas exploratoria fuera de la conversación principal, así que las ideas descartadas dejan de colarse; `argument-hint` pide el componente que falta.',
      'El frontmatter es correcto, pero un skill personal no se comparte por control de versiones. Volver a copiarlo a mano es justo como divergieron las copias, y volverá a pasar en la próxima edición.',
      '`allowed-tools` limita lo que el skill puede hacer, no lo que deja en el contexto, así que la lluvia de ideas sigue contaminando la sesión. Una nota en el CLAUDE.md pidiendo ignorarla es solo un parche probabilístico.',
    ],
    rule: 'Salida exploratoria que no debe guiar la sesión: `context: fork`. Parámetros que faltan: `argument-hint`.',
  },
  'x-codegen-graphql-rules-drifted-copies': {
    scenario:
      'Las convenciones de los resolvers GraphQL (un DataLoader para cada campo de lista, un `Context` tipado, nada de lógica de negocio en los resolvers) viven en nueve ficheros CLAUDE.md de nivel de directorio, uno en cada carpeta `services/<name>/src/graphql/`. Las copias han divergido: tres siguen recomendando un estilo de paginación que el equipo abandonó. También hay resolvers fuera de esas carpetas, como ficheros `*.resolver.ts` en unas 40 carpetas de funcionalidades de los servicios antiguos, y allí Claude ignora las convenciones. Se añade un servicio nuevo más o menos cada mes. Los desarrolladores de front-end dicen que sus sesiones ya van cargadas, así que el responsable de plataforma rechaza cualquier cosa que se cargue en todas las sesiones. El mes pasado alguien probó un skill `/graphql-conventions`, pero los desarrolladores se olvidaban de ejecutarlo.',
    ask: '¿Cuál es la forma más mantenible de que Claude aplique una única versión vigente de estas convenciones a todos los resolvers?',
    options: [
      'Sustituir las nueve copias por un único `.claude/rules/graphql-resolvers.md` cuyo frontmatter YAML `paths` incluya `services/*/src/graphql/**/*` y `**/*.resolver.ts`, para que solo se cargue cuando Claude edite un resolver, esté donde esté.',
      'Llevar las convenciones a un único `docs/graphql-conventions.md`, sustituir cada una de las nueve copias por un `@import` de ese fichero y añadir el mismo CLAUDE.md con el import a cada servicio nuevo y a cada una de las carpetas de funcionalidades con resolvers.',
      'Borrar las nueve copias y poner una versión corregida en el CLAUDE.md raíz bajo un encabezado claro "Resolvers GraphQL", para que una única fuente se aplique a todos los resolvers sin importar en qué servicio o carpeta estén.',
      'Mantener las convenciones en el skill `/graphql-conventions` pero reescribir su descripción para que Claude lo active automáticamente cuando una tarea mencione resolvers o GraphQL, y borrar las nueve copias divergentes.',
    ],
    why: [
      'Un único fichero acaba con la divergencia, y los patrones glob encuentran los resolvers por ruta sin importar el directorio, incluidos los servicios futuros, cargándose solo con ficheros que coinciden, lo que respeta la negativa del responsable a cargar nada siempre.',
      'Resuelve la divergencia, pero los ficheros atados a un directorio obligan a tener un CLAUDE.md en unas 40 carpetas más cada servicio nuevo, mantenidos a mano. Cualquier carpeta olvidada pierde las convenciones sin que nadie lo note.',
      'El fichero raíz se carga en todas las sesiones, justo lo que el responsable de plataforma ha rechazado, y Claude tendría que deducir cuándo aplica la sección en vez de cargarla según la ruta del fichero.',
      'Los skills se cargan bajo demanda, cuando se invocan o cuando Claude decide usarlos, así que la aplicación sigue sin estar garantizada por ruta de fichero. El equipo ya ha visto cómo se saltaban así las convenciones.',
    ],
    rule: 'Convenciones para ficheros repartidos por muchas carpetas: un fichero de `.claude/rules/` con globs en `paths`.',
  },
  'x-codegen-triage-plan-vs-direct': {
    scenario:
      'Tu sprint tiene tres tickets para Claude Code. (1) Un stack trace muestra que `parseAmount()` en `src/payments/money.ts` falla con entradas que llevan separador de miles; el comportamiento esperado está documentado y un test que falla lo reproduce. (2) Los emails de confirmación de pedido deben salir del camino de la petición. Hay dos diseños sobre la mesa: una tabla outbox transaccional que consulta un worker, o publicar en la cola gestionada de la empresa, lo que exige un nuevo rol IAM y configurar una dead-letter queue. Cualquiera de los dos toca el servicio de pedidos, el mailer y la configuración de despliegue. (3) El formulario de registro debe rechazar fechas de nacimiento futuras, dentro de una función de validación existente. El sprint pasado un compañero lo hizo todo en plan mode, y dos tickets pequeños le llevaron casi un día de rondas de revisión.',
    ask: '¿Qué flujo de trabajo deberías usar para estos tickets?',
    options: [
      'Usar plan mode en los tres tickets, ya que cada cambio llega a rutas de código de producción y planificar antes evita retrabajo, pero aprobar rápido los planes de los tickets 1 y 3 para que la sobrecarga sea pequeña.',
      'Usar ejecución directa en los tres, dando al ticket 2 un prompt detallado por adelantado que especifique el diseño outbox, ya que reutiliza la base de datos existente y evita infraestructura de colas nueva.',
      'Usar ejecución directa en los tickets 1 y 3, empezar también el ticket 2 en ejecución directa y pasarlo a plan mode solo si Claude encuentra complejidad inesperada al editar el servicio de pedidos.',
      'Usar ejecución directa en los tickets 1 y 3, cambios acotados en una sola función, y plan mode en el ticket 2 para explorar y comparar los diseños outbox y cola, y después implementar directamente el plan aprobado.',
    ],
    why: [
      'Plan mode añade sobrecarga de revisión sin aportar nada en arreglos bien entendidos de una sola función, que es justo lo que frenó al compañero el sprint pasado. Solo el ticket 2 tiene decisiones de diseño abiertas.',
      'Elegir el outbox en el prompt toma una decisión de arquitectura antes de que nadie haya explorado el código. El ticket 2 tiene dos diseños válidos con distintas necesidades de infraestructura, que es para lo que sirve plan mode.',
      'La complejidad del ticket 2 ya se conoce: dos diseños, tres componentes y diferencias de infraestructura. Esperar a que surjan problemas implica descubrir dependencias tarde y arriesgarse a un retrabajo caro.',
      'Ajusta cada ticket a su complejidad: un stack trace claro y un único validador son cambios acotados, mientras que el ticket 2 tiene varios enfoques válidos entre componentes. Planificar primero y luego ejecutar el plan evita retrabajo.',
    ],
    rule: 'Plan mode si hay decisiones de diseño entre componentes; ejecución directa si el cambio es acotado; planifica y luego ejecuta.',
  },
  'x-codegen-explore-in-plan-migration': {
    scenario:
      'Tienes que sustituir el cliente propio `http-lite` por `undici` en 52 ficheros de cuatro servicios. Algunas llamadas dependen de los reintentos automáticos de `http-lite` y otras de su cookie jar, y hay dos enfoques posibles: un wrapper compartido que reproduzca ambos comportamientos, o migrar cada llamada con políticas de reintento explícitas, lo que exige una entrada de configuración nueva en cada servicio. El sprint pasado un compañero lo intentó en una única sesión de ejecución directa. Claude leía ficheros sobre la marcha, hacia el fichero 30 el contexto estaba lleno de resultados de búsqueda y volcados de ficheros, y tras la compactación automática olvidó qué llamadas necesitaban cookies y rompió dos. Tu revisor quiere un plan escrito y aprobado antes de que cambie ningún fichero. Los cuatro servicios se despliegan de forma independiente.',
    ask: '¿Qué flujo de trabajo encaja mejor con esta migración?',
    options: [
      'Usar plan mode en la sesión principal y que Claude lea él mismo los 52 ficheros para que el plan se base en detalle de primera mano, y cuando el revisor lo apruebe, implementarlo con ejecución directa en esa misma sesión.',
      'Usar plan mode y delegar el descubrimiento de llamadas en el subagente Explore para que solo vuelva un resumen del uso de reintentos y cookies; elegir enfoque, aprobar el plan y después pasar a ejecución directa para los cambios.',
      'Usar ejecución directa en lotes de unos diez ficheros, ejecutando /compact tras cada lote y llevando una checklist de llamadas migradas, para que el contexto nunca se llene como en el intento de tu compañero.',
      'Hacer que el subagente Explore liste todas las llamadas y empezar ya la ejecución directa con el wrapper compartido, porque cambia menos ficheros, y arreglar los casos de cookies a medida que los detecten los tests de integración en CI.',
    ],
    why: [
      'Plan mode es correcto, pero leer 52 ficheros en la sesión principal repite el fallo del compañero: la salida extensa del descubrimiento llena el contexto antes de empezar a implementar y se pierden detalles como las llamadas con cookies.',
      'Plan mode resuelve la decisión entre dos enfoques y la aprobación del revisor; el subagente Explore mantiene el descubrimiento extenso fuera del contexto principal y devuelve un resumen; la ejecución directa implementa después el plan acordado.',
      'Gestiona el contexto, pero se salta la decisión real entre el wrapper y la migración por llamada y no da al revisor ningún plan que aprobar. Además, la compactación es justo lo que perdió los detalles de cookies la última vez.',
      'Explore ayuda en el descubrimiento, pero lanzarse directamente al wrapper toma la decisión de arquitectura sin plan ni aprobación del revisor, y confía en que los tests detecten a posteriori las cookies rotas.',
    ],
    rule: 'Migración grande con decisiones de diseño: plan mode, subagente Explore para descubrir y ejecución directa del plan.',
  },
  'x-codegen-csv-importer-refinement': {
    scenario:
      'Claude ha construido un importador de CSV de tarifas de proveedores y tu revisión encuentra tres problemas. Primero, las fechas `valid_from`: explicaste en prosa que las fechas van con el día primero salvo si el proveedor es de EE. UU., y en tres intentos Claude dio tres interpretaciones distintas para valores como `03/04/2025` de un proveedor canadiense. Segundo, la detección de duplicados usa como clave `sku` mientras que el upsert usa `(sku, supplier_id)`, así que las reimportaciones se saltan filas válidas y sobrescriben otras; cambiar cualquiera de las claves cambia lo que tiene que hacer la otra. Tercero, el log de progreso imprime cada fila, lo que es ruidoso pero no afecta a nada más. Sabes exactamente qué salida esperas en cada caso. El importador se ejecuta cada noche sobre unas 30.000 filas.',
    ask: '¿Cuál es la forma más eficaz de pedirle a Claude la siguiente ronda de arreglos?',
    options: [
      'Plantear cada problema en su propio mensaje y verificarlo antes de pasar al siguiente, empezando por la clave de duplicados, luego la del upsert y luego las fechas, para que cada cambio sea pequeño y fácil de revisar por separado.',
      'Reescribir la regla de fechas como una descripción en prosa más larga y precisa que enumere cada país de proveedor y su orden de fecha, y enviarla junto con los problemas de claves y el ruido del log en un único mensaje detallado.',
      'Dar 2-3 filas de entrada concretas con el `valid_from` exacto que esperas, describir juntos los problemas de duplicados y upsert en un mensaje que explique cómo interactúan las claves, y plantear el ruido del log aparte.',
      'Pedir a Claude que te entreviste sobre formatos de fecha, deduplicación y semántica del upsert antes de cambiar nada, para que saque a la luz consideraciones sobre los datos desordenados de proveedores que quizá aún no hayas previsto.',
    ],
    why: [
      'Los dos problemas de claves interactúan: arreglar solo la clave de duplicados cambia lo que debe hacer el upsert, así que las rondas secuenciales se deshacen entre sí. Los problemas que interactúan van en un único mensaje detallado.',
      'Agrupar los problemas de claves es correcto, pero la prosa es justo lo que Claude ya ha interpretado de tres formas distintas. Una descripción más larga invita a una cuarta lectura; los ejemplos concretos eliminan la ambigüedad.',
      'Los ejemplos concretos de entrada/salida son la solución más eficaz cuando la prosa se interpreta de forma inconsistente; los problemas que interactúan van juntos para que los arreglos sean coherentes; el del log, independiente, puede ir por separado.',
      'El patrón entrevista ayuda en dominios desconocidos donde no has previsto las consideraciones. Aquí ya sabes la salida esperada en cada caso, así que las preguntas solo añaden rondas.',
    ],
    rule: 'Prosa interpretada de forma inconsistente: ejemplos de E/S. Problemas que interactúan: un mensaje. Independientes: aparte.',
  },
  'x-codegen-raw-transcript-to-subagents': {
    scenario:
      'Tu equipo usa Claude Code para planificar la retirada de un ORM propio de un monolito Java de 2.300 ficheros. La fase 1, hecha en la sesión principal, mapeó su uso: unas 400 llamadas a Grep y Read identificaron 6 patrones de uso, 3 clases de transacciones de riesgo y 11 módulos con SQL en bruto como alternativa. Para la fase 2 lanzaste cuatro subagentes, uno por grupo de módulos, y para que "lo supieran todo" pegaste en cada prompt la exportación completa del transcript de la fase 1, unos 70k tokens de resultados de búsqueda y volcados de ficheros. Dos subagentes pasaron por alto la clase de riesgo `TxBoundary`, que el transcript menciona en plena mitad; uno describió una "capa de repositorio típica" que el código no tiene; cada ejecución costó unas 4 veces lo previsto. La sesión principal está al 40% de su contexto.',
    ask: '¿Cuál es el cambio más eficaz en cómo se prepara la fase 2?',
    options: [
      'Lanzar los subagentes sin ningún material de la fase 1 y dejar que cada uno vuelva a explorar su grupo de módulos con Grep y Read, para que todo lo que use sea de primera mano y actual, y nada venga de la exportación de un transcript antiguo.',
      'Mantener el transcript en cada prompt pero mover la lista de clases de riesgo al principio y repetirla al final, para que los datos más importantes dejen de perderse en mitad de los 70k tokens.',
      'Hacer la fase 2 en la sesión principal en vez de en subagentes, ya que esa sesión ya tiene de primera mano todo el contexto de la fase 1 y aún le queda libre cerca del 60% de su ventana de contexto para el trabajo.',
      'Escribir un resumen estructurado de los hallazgos clave de la fase 1 (los 6 patrones, las 3 clases de riesgo con sus rutas y los 11 módulos con SQL en bruto) e inyectarlo en el prompt inicial de cada subagente en lugar del transcript.',
    ],
    why: [
      'Volver a explorar repite unas 400 llamadas de trabajo, cuesta más y deja que cada subagente llegue a sus propias suposiciones; el riesgo de `TxBoundary` hallado en la fase 1 puede no redescubrirse nunca.',
      'Reordenar puede ayudar con `TxBoundary`, pero siguen ahí 70k tokens de ruido: las ejecuciones siguen costando unas 4 veces más y el ruido sigue empujando a los subagentes hacia respuestas "típicas" genéricas en vez de las clases concretas encontradas.',
      'El descubrimiento de la fase 2 volcaría la salida extensa de cuatro grupos de módulos en la sesión principal, lo que degrada sus respuestas y socava su papel de coordinación de alto nivel. Los subagentes existen para aislar esa salida.',
      'Un resumen compacto de los hallazgos clave da a cada subagente exactamente lo que aprendió la fase 1 sin el ruido, lo que resuelve a la vez la clase pasada por alto, las respuestas genéricas y el coste.',
    ],
    rule: 'Entre fases, inyecta en los nuevos subagentes un resumen de los hallazgos clave, no el transcript bruto de la exploración.',
  },
  // --- Multi-Agent Research System ---
  'x-research-narrow-decomposition-loop': {
    scenario:
      'Los clientes se quejaron de los seis últimos informes sobre temas laborales amplios. El de "impacto de la automatización de almacenes en el empleo" solo cubría la pérdida de empleos en Norteamérica, sin nada sobre salarios, seguridad laboral, recualificación u otras regiones. El equipo ya subió los resultados por consulta del subagente de búsqueda web de 10 a 25 (coste +38%, sin cambios). El coordinador también ejecuta un bucle de refinamiento que revisa cada síntesis en busca de huecos; registró "cobertura suficiente" tras la primera pasada en las seis ejecuciones. Los logs del coordinador muestran el tema dividido en tres subtareas: "pérdida de empleos en centros logísticos de EE. UU.", "pérdida de empleos en centros de distribución de Canadá" y "despidos por automatización en la logística minorista de EE. UU.". Las trazas de los subagentes muestran cada subtarea respondida con 12-15 fuentes relevantes y bien citadas. El mes pasado los informes pasaron al estilo de cita APA.',
    ask: '¿Qué cambio deberías hacer primero para corregir la cobertura que falta?',
    options: [
      'Hacer que el subagente de síntesis compare sus hallazgos con una checklist de dimensiones laborales estándar (salarios, seguridad, recualificación, regiones) y añada una sección de huecos bien visible con cada dimensión que los hallazgos no cubren, para que los clientes vean qué falta.',
      'Cambiar la descomposición del coordinador para que primero mapee las dimensiones principales del tema (tipos de impacto, regiones, colectivos afectados) y asigne subtareas que entre todas las cubran, y que el bucle de refinamiento revise contra ese mapa.',
      'Exigir que el bucle de refinamiento haga al menos tres iteraciones antes de que el coordinador pueda declarar suficiente la cobertura, para que las rondas extra de revisión saquen a la luz los subtemas que faltan y los re-deleguen.',
      'Ampliar la generación de consultas del subagente de búsqueda web para que cada subtarea asignada se expanda a consultas cercanas sobre salarios, seguridad y otras regiones, subiendo el recall de cada subtarea sin tocar el plan del coordinador.',
    ],
    why: [
      'La síntesis solo puede trabajar con los hallazgos que recibe. Una sección de huecos diría qué falta, pero nadie lo rellenaría, y los logs muestran que el hueco viene de las asignaciones, no de la síntesis.',
      'Los logs muestran tres subtareas que solo cubren pérdida de empleo en Norteamérica, y cada subagente cumplió su encargo, así que la causa raíz es una descomposición demasiado estrecha. El bucle juzgó la cobertura con ese mismo enfoque estrecho, por eso hay que corregir primero el plan.',
      'El bucle ya se ejecutó y dijo "cobertura suficiente" porque juzga la síntesis con el enfoque estrecho del propio coordinador. Más rondas contra las mismas tres subtareas lo seguirían confirmando.',
      'Culpa al subagente de búsqueda, que completó sus subtareas con fuentes relevantes. Ampliar consultas más allá de lo asignado rompe el reparto entre subagentes, y la subida anterior de resultados no cambió nada.',
    ],
    rule: 'Si los subagentes cumplen su encargo pero falta cobertura, corrige la descomposición del coordinador.',
  },
  'x-research-targeted-refinement': {
    scenario:
      'Para cerrar huecos de cobertura, el equipo envolvió el pipeline en un bucle: tras la síntesis, un prompt evaluador puntúa la cobertura de 1 a 10 y, por debajo de 8, el coordinador vuelve a ejecutarlo todo (las cuatro subtareas de búsqueda, el análisis de todos los documentos y una síntesis nueva) con la consulta original. Los informes promedian ahora 2,6 iteraciones, el coste por informe pasó de 4,10 $ a 10,70 $ y el evaluador sigue rechazando el 35% de los informes finales. Sus comentarios nombran huecos concretos, como "sin datos sobre los cambios arancelarios de 2024" o "sin fuentes de productores del sudeste asiático", pero las iteraciones posteriores recuperan cerca del 80% de las mismas URLs porque la búsqueda recibe siempre los mismos subtemas. Producto exige que el coste medio por informe se mantenga por debajo de 7 $. El evaluador usa un modelo más pequeño que los subagentes.',
    ask: '¿Qué cambio mejora más la cobertura cumpliendo el requisito de coste?',
    options: [
      'Limitar el bucle a una sola repetición y bajar la puntuación de aceptación de 8 a 6, para que la mayoría de los informes pasen en su segunda iteración y el coste medio por informe vuelva a quedar por debajo de 7 $.',
      'Añadir un subagente dedicado a investigar huecos que reciba los comentarios del evaluador, haga sus propias búsquedas y análisis de documentos sobre cada hueco nombrado, y añada secciones complementarias al informe cuando la síntesis haya terminado.',
      'Dar al subagente de síntesis las tools de búsqueda web para que rellene él mismo cada hueco mientras escribe, eliminando la ida y vuelta por el coordinador y, con ella, la necesidad de repetir el pipeline completo.',
      'Hacer que el coordinador convierta cada hueco que nombra el evaluador en consultas específicas, re-delegue solo esas a búsqueda y análisis, y repita la síntesis con los hallazgos nuevos y los existentes hasta que la cobertura sea suficiente.',
    ],
    why: [
      'Cumple el límite de coste aceptando peores informes. Los huecos nombrados seguirían llegando a los clientes y la causa (la búsqueda recibe siempre los mismos subtemas) queda intacta.',
      'Sobredimensionado: duplica los roles de búsqueda y análisis en un agente nuevo, y las secciones añadidas nunca pasan por la síntesis, así que no se integran ni se contrastan con el resto del informe.',
      'Los agentes con tools fuera de su rol tienden a usarlas mal. Estos huecos requieren investigación real, no comprobaciones rápidas, y dejar que la síntesis busque directamente se salta el control del coordinador sobre el flujo de información.',
      'Es el patrón de refinamiento iterativo: el coordinador evalúa la síntesis en busca de huecos y re-delega consultas específicas. Solo se reinvestigan los huecos, así que cada ronda cuesta una fracción de una repetición completa, y las consultas nuevas llegan a fuentes nuevas.',
    ],
    rule: 'Refina re-delegando consultas específicas para los huecos detectados, no repitiendo todo el pipeline.',
  },
  'x-research-partition-source-types': {
    scenario:
      'Para cada subtema, el coordinador lanza tres subagentes de búsqueda web con el mismo prompt, con la idea de que la redundancia capture fuentes que un solo agente pasaría por alto. Una auditoría de 30 informes encontró que el 64% de las URLs devueltas para un subtema estaban duplicadas entre los tres agentes, que el prompt de síntesis promedia 91k tokens de material casi todo repetido y que casi nunca se citan documentos regulatorios ni preprints académicos, porque los tres agentes prefieren las mismas páginas de noticias y de proveedores mejor posicionadas. Los clientes compran estos informes por sus fuentes primarias. En un piloto, un agente al que se pidió cubrir todos los tipos de fuente de un subtema tardó 17 minutos, frente a 6 de un agente enfocado, y la fase de búsqueda debe terminar en 10 minutos. El subagente de informes estrenó hace poco un formateador de citas nuevo.',
    ask: '¿Qué cambio resuelve mejor a la vez la duplicación y la falta de fuentes primarias?',
    options: [
      'Mantener los prompts idénticos y añadir un paso de deduplicación en el coordinador que elimine las URLs repetidas antes de que los hallazgos lleguen a la síntesis, reduciendo su prompt a fuentes únicas.',
      'Sustituir los tres agentes por un solo subagente de búsqueda por subtema al que se le pida cubrir él mismo noticias, documentos regulatorios y preprints académicos, eliminando el trabajo duplicado y recortando dos tercios del coste de búsqueda.',
      'Mantener tres agentes en paralelo por subtema pero dar a cada uno una parte distinta por tipo de fuente (noticias e industria, documentos regulatorios, literatura académica), e indicar en el prompt de cada agente qué cubren los otros dos.',
      'Dejar que los tres agentes compartan un registro de URLs donde cada uno anote las fuentes que ya ha reclamado, para que los demás las salten y bajen más en los rankings, donde pueden aparecer documentos regulatorios y preprints.',
    ],
    why: [
      'Trata el síntoma: desaparecen los duplicados, pero los agentes siguen buscando igual y devolviendo las mismas páginas de noticias y proveedores, así que siguen faltando los documentos regulatorios y los preprints.',
      'Un agente que cubre todos los tipos de fuente tardó 17 minutos en el piloto, lo que rompe el límite de 10 minutos de la fase de búsqueda. Bajaría la duplicación, pero no se cumpliría el plazo.',
      'Repartir el alcance por tipo de fuente da a cada agente trabajo distinto, así que baja el solapamiento, y manda a un agente directamente a documentos regulatorios y a otro a fuentes académicas. Los tres siguen en paralelo, así que se cumple el límite de 10 minutos.',
      'Que los agentes se coordinen a través de un registro compartido se salta al coordinador, y bajar por los mismos rankings llenos de noticias no apunta a documentos regulatorios ni preprints: solo da resultados más flojos del mismo tipo.',
    ],
    rule: 'Reparte el alcance por subtemas o tipos de fuente distintos; la redundancia es duplicación, no cobertura.',
  },
  'x-research-parallel-then-synthesis': {
    scenario:
      'Para reducir la latencia, el coordinador emite ahora sus seis llamadas a Task en una sola respuesta: cuatro subagentes de búsqueda web, un subagente de análisis de documentos (que trabaja con archivos subidos por el cliente) y el subagente de síntesis. La fase de búsqueda bajó de 4,5 minutos a 70 segundos, pero la síntesis se hundió: en el 52% de las ejecuciones dice que no se le dieron hallazgos y escribe a partir de conocimiento general, con menos de tres citas. Su prompt de Task dice "Sintetiza los hallazgos de los agentes de búsqueda y análisis." La AgentDefinition del subagente de síntesis contiene las reglas de citación y la estructura de informe que aprobaron los clientes. El contexto del coordinador ya está cerca de su límite en temas grandes. Producto quiere mantener la nueva latencia de la fase de búsqueda.',
    ask: '¿Cuál es la forma más eficaz de arreglar la síntesis sin perder la mejora de latencia?',
    options: [
      'Mantener las cinco llamadas a Task de búsqueda y análisis en una sola respuesta para que corran en paralelo, y lanzar la síntesis en un turno posterior con sus resultados completos, metadatos de fuente incluidos, escritos en su prompt de Task.',
      'Volver a lanzar cada subagente en su propio turno, uno tras otro, para que cada subagente empiece solo cuando termine el anterior y la síntesis se ejecute siempre cuando ya existan todos los hallazgos.',
      'Mantener las seis llamadas a Task en una respuesta e indicar a la síntesis en su prompt que espere a que los hallazgos de los otros agentes aparezcan en la memoria compartida de la sesión, y que los lea de ahí antes de empezar a escribir la síntesis.',
      'Eliminar el subagente de síntesis y hacer que el coordinador escriba él mismo la síntesis cuando vuelvan los cinco resultados en paralelo, ya que tiene todos los hallazgos en su propio contexto y así no necesita un turno ni un traspaso extra.',
    ],
    why: [
      'Las llamadas a Task en paralelo encajan con trabajo independiente, y búsqueda y análisis no dependen entre sí. La síntesis depende de sus resultados y los subagentes no heredan nada, así que hay que lanzarla después con los hallazgos completos en su prompt.',
      'Arregla el orden, pero vuelve a ejecutar en secuencia los subagentes independientes de búsqueda y análisis, y se pierde la fase de búsqueda de 70 segundos que producto quiere mantener.',
      'Los subagentes no comparten memoria entre invocaciones ni heredan el contexto del coordinador. No hay ningún almacén compartido que esperar: la síntesis solo ve lo que contiene su prompt de Task.',
      'Tira las reglas de citación y la estructura aprobadas que están en la AgentDefinition de síntesis, y mete todos los hallazgos en bruto en un contexto del coordinador que ya está cerca de su límite.',
    ],
    rule: 'Lanza juntos los subagentes independientes; los dependientes, después y con los resultados previos en el prompt.',
  },
  'x-research-fork-deliverables': {
    scenario:
      'Un cliente quiere dos entregables sobre "economía del almacenamiento a escala de red": un informe de políticas sobre el diseño de subvenciones y un memorando para inversores sobre rentabilidad. Ambos deben citar cifras de las fuentes con su página. El coordinador acaba de dedicar 50 minutos y 18 $ a analizar 64 fuentes, y ese análisis está al día. Lo habitual sería ejecutar el pipeline completo una vez por entregable (100 minutos, 36 $). Un compañero, en cambio, siguió en la misma sesión: tras el informe de políticas, pidió el memorando en la misma conversación, y el memorando reutilizó el enfoque del informe, que defendía las subvenciones, en 4 de sus 7 secciones. Ambos documentos se entregan hoy y no deben influirse entre sí. La plantilla del memorando tiene tres secciones más que la del informe.',
    ask: '¿Qué enfoque produce mejor ambos entregables a partir del análisis existente?',
    options: [
      'Seguir en una sola sesión pero escribir primero el memorando para inversores, y luego indicar explícitamente al agente que ignore el enfoque y los argumentos del memorando cuando escriba el informe de políticas después en la misma conversación.',
      'Abrir dos sesiones nuevas e inyectar en cada una un resumen estructurado de las conclusiones principales del análisis, para que los entregables sean independientes y sus contextos mucho más ligeros que el análisis completo de 64 fuentes.',
      'Tras el análisis, lanzar en paralelo dos subagentes de informe con llamadas a Task cuyos prompts indiquen solo el tipo de entregable, y dejar que cada uno tome del análisis del coordinador las cifras que necesite.',
      'Hacer fork de la sesión al final del análisis compartido y escribir cada entregable en su propia rama, para que ambos partan de la misma base de 64 fuentes y ninguno vea nunca el enfoque del otro.',
    ],
    why: [
      'El orden da igual: el segundo documento se sigue escribiendo en un contexto que contiene el primero, y pedir que lo ignore es probabilístico. Es la misma contaminación que ya vio el compañero.',
      'Las sesiones nuevas con resumen son lo indicado cuando los tool results previos están desactualizados. Este análisis está al día, y un resumen de conclusiones perdería las cifras con página que ambos documentos deben citar.',
      'Los subagentes no heredan el contexto del coordinador. Con solo el tipo de entregable en el prompt, no tendrían nada del análisis ni de sus cifras.',
      'El fork crea ramas independientes a partir de una base de análisis compartida: cada entregable conserva el análisis completo y actual, no se paga dos veces y ninguna rama ve el enfoque de la otra.',
    ],
    rule: 'Haz fork desde una base de análisis compartida para explorar salidas divergentes sin que se contaminen.',
  },
  'x-research-report-section-chain': {
    scenario:
      'El subagente de informes escribe cada informe final en una sola llamada: recibe todos los hallazgos sintetizados (unos 120, aproximadamente 45k tokens, muy por debajo de su ventana de contexto) más la plantilla obligatoria de 8 secciones del cliente, y devuelve el informe entero de 30 páginas. Los revisores señalan tres problemas: las secciones 6 a 8 tienen de media un tercio de la extensión y de la densidad de citas de las secciones 1 a 3; en 1 de cada 5 informes el resumen ejecutivo contradice una sección posterior (por ejemplo, "los costes bajan" encima de una tabla que muestra una subida); y cerca del 9% de los hallazgos no aparece en ninguna sección. La plantilla nunca cambia y los informes se generan de noche, así que la latencia no importa. Un compañero propone pasar el subagente de informes a un modelo con una ventana de contexto de 1M de tokens.',
    ask: '¿Cómo deberías reestructurar la generación del informe?',
    options: [
      'Pasar el subagente de informes al modelo con más contexto, como se propone, para que tenga más espacio para atender a cada hallazgo y dé a las últimas secciones la misma profundidad y coherencia que a las primeras.',
      'Dejar que el subagente de informes cree un plan dinámico para cada informe, eligiendo qué secciones escribir, en qué orden y con qué profundidad según lo que destaquen los hallazgos, para que su esfuerzo vaya donde más hallazgos hay.',
      'Encadenar el trabajo: escribir cada sección de la plantilla en su propia pasada a partir de los hallazgos asignados, y luego hacer una pasada de integración aparte que revise la coherencia entre secciones y escriba el resumen ejecutivo.',
      'Generar cada informe tres veces y quedarse solo con las afirmaciones que aparezcan en al menos dos de las tres versiones, filtrando el contenido incoherente que produce las contradicciones.',
    ],
    why: [
      'Los hallazgos ya caben de sobra en la ventana actual. La profundidad desigual y las contradicciones son dilución de la atención, y una ventana mayor no la arregla.',
      'La plantilla de 8 secciones es obligatoria y nunca cambia, así que es trabajo predecible con varios aspectos. La descomposición dinámica sirve para investigaciones abiertas y permitiría saltarse o fusionar secciones.',
      'El prompt chaining encaja con trabajo predecible con varios aspectos: las pasadas por sección dan a todas la misma profundidad, y la pasada de integración detecta contradicciones entre secciones y hallazgos sin usar, como una revisión por archivo más una pasada entre archivos.',
      'El filtro por consenso elimina hallazgos reales que solo salen en algunas ejecuciones, triplica el coste y no hace nada por las secciones finales flojas ni por los hallazgos sin usar.',
    ],
    rule: 'Salida predecible con varias partes: encadena pasadas por parte y luego una pasada de integración aparte.',
  },
  'x-research-license-cap-business-error': {
    scenario:
      'El subagente de análisis de documentos carga informes sectoriales de pago mediante la tool MCP `fetch_licensed_report`. Finanzas limita cada proyecto a 25 descargas con licencia; la tool aplica ese límite y, cuando se alcanza, devuelve `isError: true` con el texto "Request could not be completed." Devuelve el mismo texto durante las caídas breves de la API del editor, que afectan a cerca del 2% de las llamadas y funcionan al segundo intento. Una vez alcanzado el límite, el subagente reintenta cada petición cuatro veces y luego el coordinador re-delega el documento a un subagente de análisis nuevo que reintenta otras cuatro. En el 14% de las ejecuciones esto desperdicia más de 10 minutos, y los informes finales atribuyen los documentos que faltan a "problemas técnicos". Finanzas no va a subir el límite. El servidor MCP está escrito en TypeScript.',
    ask: '¿Cuál es la solución más eficaz?',
    options: [
      'Devolver todos los fallos de `fetch_licensed_report` como transitorios con `isRetryable: true` y una espera de reintento más larga, para que el subagente espere entre intentos en vez de saturar la API del editor.',
      'Devolver el límite como error de regla de negocio con `isRetryable: false` y un motivo legible (límite del proyecto alcanzado, hace falta aprobación o fuentes abiertas), y devolver las caídas breves del editor como transitorias y reintentables.',
      'Dejar la tool como está y añadir una regla al prompt del subagente para que pare tras dos intentos fallidos con el mismo documento y lo reporte al coordinador como no disponible, para perder mucho menos tiempo en cada ejecución.',
      'Hacer que la tool devuelva un resultado vacío marcado como éxito cuando se alcance el límite, para que el subagente siga de inmediato sin reintentos y las ejecuciones no se retrasen por descargas bloqueadas.',
    ],
    why: [
      'El límite no se reinicia durante una ejecución, así que reintentarlo con cualquier espera nunca funcionará. Marcar un error de negocio como transitorio mantiene los reintentos inútiles.',
      'El límite y las caídas piden respuestas opuestas. Una categoría de negocio con `isRetryable: false` corta los reintentos y la re-delegación, y el motivo legible permite al coordinador usar fuentes abiertas o explicar al cliente la causa real; las caídas siguen siendo reintentables.',
      'El mensaje idéntico sigue ocultando la causa: el coordinador re-delegaría los documentos "no disponibles" y los informes seguirían hablando de "problemas técnicos" en vez de nombrar el límite. Una regla de prompt no puede distinguir los dos fallos.',
      'Suprime el error: el subagente y el coordinador tratarían una descarga bloqueada como un documento sin contenido, y el informe lo omitiría en silencio sin decir a nadie por qué.',
    ],
    rule: 'Marca las violaciones de reglas de negocio como no reintentables y con un motivo legible; los transitorios, reintentables.',
  },
  'x-research-tool-choice-any-submit': {
    scenario:
      'Las únicas tools del subagente de informes son `submit_report` (informe completo, secciones y citas) y `submit_partial_report` (para cuando las anotaciones de cobertura del coordinador muestran huecos; enumera los subtemas sin cubrir). Un servicio de publicación consume solo los payloads de estas tools. Con `tool_choice` en "auto", el 6% de las ejecuciones termina en cambio con una respuesta en texto plano, como "Aquí tienes el informe que pediste..." o una pregunta aclaratoria, que el servicio descarta, así que los clientes no reciben nada. Los informes parciales hacen falta de verdad en cerca de 1 de cada 10 ejecuciones. El system prompt ya dice "Termina siempre llamando a una tool de envío", y dos ejemplos few-shot añadidos en el último sprint no cambiaron nada. El subagente recibe de media 38k tokens de hallazgos sintetizados.',
    ask: '¿Qué configuración garantiza mejor un payload utilizable en cada ejecución?',
    options: [
      'Poner `tool_choice` a "any" en las peticiones del subagente de informes, para que cada respuesta tenga que ser una tool call mientras el modelo sigue eligiendo entre `submit_report` y `submit_partial_report` según la cobertura.',
      'Forzar `tool_choice` a `{"type": "tool", "name": "submit_report"}` en todas las peticiones para garantizar un payload estructurado en cada ejecución, y dejar que el servicio de publicación deduzca la cobertura parcial a partir del contenido del informe.',
      'Mantener `tool_choice` en "auto" y reforzar el system prompt con una regla en mayúsculas y más ejemplos few-shot de ejecuciones que terminan en una llamada de envío, para que el modelo conserve su flexibilidad para responder.',
      'Añadir al servicio de publicación un parser de respaldo que detecte las respuestas en texto plano, extraiga encabezados y citas con expresiones regulares y los convierta en un payload de `submit_report`.',
    ],
    why: [
      '"any" garantiza una tool call en lugar de texto pero deja al modelo elegir la tool, que es lo que este caso necesita: el modelo puede seguir eligiendo el informe parcial cuando la cobertura tiene huecos.',
      'Forzar `submit_report` garantiza un payload pero elimina la elección, así que la ejecución de cada 10 que necesita `submit_partial_report` acabaría en un informe completo que oculta sus huecos.',
      'Con "auto" el modelo puede seguir respondiendo con texto. La regla y los ejemplos few-shot ya existen y no sirvieron; los cambios de prompt siguen siendo probabilísticos cuando hace falta una garantía.',
      'Trata el síntoma a posteriori: las preguntas aclaratorias no contienen ningún informe que convertir, y parsear texto libre con regex es frágil frente a exigir la tool call en origen.',
    ],
    rule: 'Usa tool_choice "any" para exigir una tool call dejando al modelo elegir cuál.',
  },
  'x-research-partial-analysis-failures': {
    scenario:
      'El coordinador envía al subagente de análisis de documentos 20 documentos para un informe sobre la seguridad de los gasoductos de hidrógeno. En una ejecución fallida típica, dos son PDFs protegidos con contraseña y una URL devuelve HTTP 404, así que esos análisis nunca podrán completarse, mientras que los otros 17 terminan en 6 minutos. Hoy el subagente lanza una excepción en el primer documento irrecuperable, el manejador del coordinador marca toda la ejecución como fallida y se descartan los análisis completados; pasó en el 11% de las ejecuciones el mes pasado. Un compañero propone capturar los fallos dentro del subagente y devolver los 17 análisis como un resultado normal y completo, escribiendo los fallos en un log del servidor para los ingenieros. Dos de los tres documentos fallidos suelen tener versiones públicas en otro sitio, como la página HTML de un regulador. Los análisis se guardan en JSON.',
    ask: '¿Qué diseño de manejo de errores facilita mejor la recuperación sin restar fiabilidad a los informes?',
    options: [
      'Adoptar la propuesta del compañero: devolver los 17 análisis como resultado completo y registrar los tres fallos para los ingenieros, para que las ejecuciones dejen de fallar y el informe salga con todas las fuentes que sí cargaron.',
      'Añadir reintentos locales con backoff exponencial, cinco intentos por documento fallido, dentro del subagente antes de lanzar la excepción, para que los problemas temporales se resuelvan solos sin que intervenga el coordinador.',
      'Seguir haciendo fallar la ejecución, pero que el coordinador relance el análisis completo de los 20 documentos en un subagente nuevo, hasta tres veces, antes de comunicar al usuario que la ejecución ha fallado.',
      'Devolver los 17 análisis como resultados parciales más un error estructurado por cada documento fallido (tipo de fallo, qué se intentó, alternativas posibles), para que el coordinador busque otras versiones o marque el hueco.',
    ],
    why: [
      'Suprimir errores en silencio es un antipatrón: el coordinador trataría el resultado como completo, nunca buscaría las versiones públicas y el informe ocultaría el hueco. Un log del servidor es invisible para los agentes.',
      'Una contraseña y un 404 no son transitorios, así que los reintentos no los arreglan, y la ejecución sigue terminando en una excepción que descarta los 17 análisis completados.',
      'Los mismos tres documentos fallan en cada reinicio, así que esto repite hasta tres veces el análisis de 6 minutos y sigue terminando el flujo por fallos que los resultados parciales podrían absorber.',
      'El contexto de error estructurado permite al coordinador elegir cómo recuperarse: buscar las versiones públicas, seguir con resultados parciales y hacer que la síntesis anote el hueco que quede. Evita tanto terminar la ejecución como suprimir el error.',
    ],
    rule: 'Propaga resultados parciales con contexto de error estructurado; no termines la ejecución ni ocultes el fallo.',
  },
  'x-research-compression-keeps-mappings': {
    scenario:
      'Los subagentes de búsqueda y análisis devuelven los hallazgos como registros estructurados: afirmación, URL de la fuente, nombre del documento, página, extracto y fecha. Los temas grandes llegaban a 260 registros y desbordaban el presupuesto de contexto del subagente de síntesis, así que el equipo añadió un paso de compresión: un resumidor convierte todos los registros en un informe narrativo de 3 páginas, que es lo que recibe la síntesis. Se acabaron los desbordamientos, pero una auditoría de citas sobre 150 afirmaciones de informes encontró un 31% sin fuente o con una fuente que no respalda la afirmación, frente al 4% antes del cambio. El prompt de síntesis ya dice "cita una fuente para cada afirmación". Muchos registros repiten la misma afirmación desde fuentes distintas. El límite de coste por informe descarta un modelo de síntesis más grande. El resumidor usa un modelo más pequeño que la síntesis.',
    ask: '¿Cuál es el cambio más eficaz?',
    options: [
      'Hacer que el paso de compresión fusione los registros que expresan la misma afirmación en uno solo que conserve todas las fuentes, extractos y fechas, recorte el texto verboso en vez de los vínculos afirmación-fuente, y pase esos registros a la síntesis.',
      'Eliminar el paso de compresión y pasar la síntesis a un modelo con una ventana de contexto mayor, para que los 260 registros originales quepan en su prompt y no haga falta ningún paso de resumen en el pipeline.',
      'Añadir tras la síntesis un paso de recuperación de citas que busque en los registros originales texto parecido a cada afirmación del informe y adjunte como cita la fuente del registro que más se parezca.',
      'Ejecutar el resumidor con el mismo modelo que la síntesis e indicarle que nombre las fuentes relevantes en la narrativa del resumen siempre que una afirmación dependa de un documento concreto, para que las citas sobrevivan al paso de compresión.',
    ],
    why: [
      'La atribución se pierde cuando los hallazgos se comprimen sin claim-source mappings. Fusionar afirmaciones duplicadas y recortar el texto verboso reduce la entrada sin que ninguna afirmación pierda sus fuentes, así la síntesis puede conservar y fusionar esos mappings.',
      'El límite de coste por informe descarta un modelo de síntesis mayor, y 260 registros en un solo prompt expondrían además la síntesis al efecto lost in the middle.',
      'Perdido el vínculo afirmación-fuente, los pasos posteriores no pueden recuperarlo con fiabilidad; emparejar por texto parecido puede adjuntar una fuente que no respalda la afirmación, justo el error que encontró la auditoría.',
      'Las fuentes nombradas en prosa siguen mezcladas con las afirmaciones y se pierden o se difuminan; el problema es el formato no estructurado del resumen, no el tamaño del modelo del resumidor.',
    ],
    rule: 'Todo paso de compresión debe conservar los claim-source mappings: recorta texto, nunca los vínculos.',
  },
  // --- Developer Productivity with Claude ---
  'x-devprod-loop-completion-marker': {
    scenario:
      'El agente de migración de tu equipo, construido sobre la Claude API con un bucle escrito a mano, convierte módulos heredados de Python 2 a Python 3 con las tools `Read`, `Edit` y `Bash`. El bucle da una respuesta por final cuando su texto contiene la marca MIGRATION COMPLETE; si no, añade un mensaje de usuario que dice "Continue." y vuelve a llamar a la API, hasta 40 iteraciones. En 600 ejecuciones de la semana pasada, el 7% se detuvo con ediciones a medias: la respuesta decía "MIGRATION COMPLETE for utils/, moving on to billing/" junto a un bloque `tool_use` pendiente. Otro 12% llegó al límite de 40 iteraciones después de que el modelo hubiera terminado y escrito "All modules migrated.", revisando ficheros otra vez tras cada "Continue.". Exigir la marca exacta en el system prompt bajó el segundo grupo al 5%, pero no cambió el primero. El repo tiene 2.100 ficheros y cada ejecución dura de media 14 minutos.',
    ask: '¿Qué cambio en el flujo de control del bucle resuelve de forma más eficaz los dos fallos?',
    options: [
      'Mantener la comprobación de la marca pero aceptar una lista de frases de cierre habituales, e ignorar cualquier coincidencia en una respuesta que también contenga un bloque `tool_use`, para que una sola comprobación de texto detecte las paradas prematuras y los finales no reconocidos.',
      'Bajar el límite de 40 a 15 iteraciones y convertirlo en la regla principal de parada, y después enviar una última petición que pida un resumen, lo que acota el coste de las ejecuciones que siguen revisando ficheros ya migrados.',
      'Añadir ejemplos few-shot al system prompt que muestren la marca escrita sola en un mensaje final sin tool call, para que el modelo aprenda a separar sus actualizaciones de progreso de su señal de finalización.',
      'Guiar el bucle por `stop_reason`: mientras sea `tool_use`, ejecutar todas las tools pedidas y añadir sus resultados; parar cuando sea `end_turn`, y mantener el límite de 40 iteraciones solo como red de seguridad.',
    ],
    why: [
      'Sigue analizando lenguaje natural para decidir cuándo termina el bucle. La redacción varía, así que finales como "All modules migrated." o "Done." se seguirán colando, y el bucle conserva una comprobación frágil cuando la API ya indica por qué se detuvo el modelo.',
      'Un límite arbitrario como parada principal corta migraciones largas y legítimas a mitad de edición y no hace nada por el 7% que se detiene antes de tiempo con un bloque `tool_use` pendiente; cambia un fallo por otro.',
      'Las indicaciones en el prompt son probabilísticas: una instrucción más estricta sobre la marca ya dejó un 5% de fallos. Los few-shot quizá bajen la tasa, pero la terminación sigue atada al texto en vez de a la señal fiable, `stop_reason`.',
      '`stop_reason` dice exactamente lo que quiere el modelo: `tool_use` significa ejecutar las tools y seguir; `end_turn`, que ha terminado. Arregla los dos fallos a la vez, y el límite queda solo como protección contra bucles desbocados.',
    ],
    rule: 'Termina el bucle con `stop_reason` `end_turn`, nunca con una marca en el texto; el límite de iteraciones es solo una red de seguridad.',
  },
  'x-devprod-pii-trace-adaptive': {
    scenario:
      'Seguridad pide a tu agente que encuentre todos los puntos por los que los datos personales pueden acabar en los logs de un monolito Java heredado de 900 ficheros, antes de una auditoría dentro de tres semanas. El equipo montó un pipeline fijo: un subagente por paquete de primer nivel aplica la misma checklist (llamadas al logger con campos llamados email, ssn o phone) y un paso final fusiona los informes. Señaló 41 puntos. Después, una muestra manual encontró 9 fugas que se le escaparon, todas de varios saltos: un DTO de petición pasaba por un mapper de `common/`, luego por un helper `AuditTrail` que envuelve un jar externo, y este registra la salida de `toString()`. Cada salto solo se veía tras seguir el anterior, y los paquetes implicados pertenecían a subagentes distintos. Cada ejecución cuesta unos 18 $, y el equipo quiere reutilizar el enfoque en otros tres repos heredados cuya estructura nadie ha mapeado aún.',
    ask: '¿Qué estrategia de descomposición encaja mejor con esta tarea?',
    options: [
      'Mantener el pipeline por paquete y añadir al final una pasada de integración entre paquetes que reciba todos los informes y revise el flujo de datos entre paquetes, el patrón recomendado para dividir revisiones grandes de muchos ficheros.',
      'Mapear primero la estructura (puntos de entrada, destinos de log, helpers compartidos), priorizar por dónde entran los datos personales y generar subtareas a partir de cada hallazgo, como trazar todos los llamadores de un helper en cuanto se ve que registra datos.',
      'Cargar los 900 ficheros en una única petición de contexto largo para que el modelo vea todos los saltos a la vez, eliminando las fronteras entre paquetes que reparten cada fuga de varios saltos entre subagentes distintos.',
      'Añadir los 9 patrones que se escaparon (mappers, `AuditTrail`, `toString()`) a la checklist de cada subagente y repetir el mismo pipeline fijo en cada repo nuevo, para que las cuatro auditorías sean coherentes y comparables.',
    ],
    why: [
      'Las pasadas por fichero más una de integración encajan en revisiones predecibles. Aquí los saltos no se conocen de antemano: una pasada final solo ve resúmenes por paquete, no el rastro que se obtiene siguiendo cada hallazgo, y los próximos repos no tienen estructura conocida.',
      'Es una investigación abierta: qué revisar después depende de lo que revela cada paso. La descomposición adaptativa sigue el rastro entre paquetes y se adapta a repos sin mapear, algo que ningún pipeline fijo puede hacer.',
      'Un contexto mayor no arregla la calidad de la atención. Meter 900 ficheros en una sola pasada la diluye y hace más probables los hallazgos superficiales o perdidos, no menos.',
      'Parchear la checklist con las fugas ya encontradas trata el síntoma. La próxima fuga pasará por otro helper, y los repos sin mapear tendrán saltos que ninguna checklist fija prevé.',
    ],
    rule: 'Investigación abierta: descompón de forma adaptativa según los hallazgos. Las cadenas fijas, para revisiones predecibles.',
  },
  'x-devprod-resume-policy': {
    scenario:
      'Tu herramienta de exploración de código, construida con el Agent SDK, permite a los ingenieros poner nombre a sus sesiones de investigación y volver a ellas más tarde; hoy cada vuelta simplemente reanuda la sesión tal como quedó. Telemetría de 1.200 sesiones reanudadas el mes pasado: el 78% volvió en menos de tres días y había cambiado menos del 5% de los ficheros que la sesión había leído; el 9% volvió tras refactorizaciones grandes en las que cambió más de la mitad de esos ficheros. En ambos grupos, los ingenieros cuentan que el agente cita funciones que se renombraron o se movieron. La herramienta ya registra qué ficheros leyó cada sesión, y el historial de git del repo está disponible. Volver a explorar un módulo típico desde cero lleva unos 25 minutos, las sesiones se guardan 30 días y la mayoría de los ingenieros usa el modelo por defecto.',
    ask: '¿Qué política de reanudación mantiene mejor la precisión de las respuestas sin perder el trabajo previo que sigue siendo válido?',
    options: [
      'Comparar con el commit actual los ficheros que leyó cada sesión: si cambiaron pocos, reanudar e indicar los ficheros cambiados para un nuevo análisis específico; si cambiaron la mayoría, empezar una sesión nueva con un resumen estructurado.',
      'Empezar siempre una sesión nueva con un resumen estructurado de los hallazgos y decisiones anteriores, porque una sesión nueva con resumen es más fiable que reanudar con resultados de tools que ahora pueden estar obsoletos.',
      'Reanudar siempre, pero antes repetir contra el código actual todas las llamadas a `Read` y `Grep` de la sesión original, para refrescar cada resultado guardado antes de que el ingeniero haga la siguiente pregunta.',
      'Reanudar siempre y añadir al system prompt una instrucción para que el agente vuelva a comprobar cualquier fichero contra el código actual antes de citarlo, para detectar las funciones renombradas o movidas cuando aparezcan.',
    ],
    why: [
      'Sigue el criterio de la guía: reanudar cuando el contexto previo sigue siendo válido casi todo y señalar al agente los ficheros concretos que cambiaron; empezar de cero con un resumen cuando la mayoría de los resultados están obsoletos. Ambos grupos obtienen respuestas precisas sin reexplorar sin necesidad.',
      'Acierta con el 9% que vuelve tras refactorizaciones grandes, pero para el 78% tira un análisis detallado que sigue siendo válido y obliga a reexplorar lo que una nota breve sobre unos pocos ficheros cambiados habría evitado.',
      'Repetir todas las llamadas es reexplorar todo el alcance de la sesión, cerca de los 25 minutos en cada vuelta, aunque haya cambiado menos del 5% de los ficheros.',
      'La instrucción no le dice al agente qué cambió, así que sigue razonando con su análisis desactualizado y comprueba de forma irregular; tras refactorizaciones grandes, los resultados obsoletos siguen siendo casi todo lo que ve.',
    ],
    rule: 'Contexto casi todo válido: reanuda e indica los ficheros cambiados. Casi todo obsoleto: empieza de cero con un resumen.',
  },
  'x-devprod-search-tool-boundaries': {
    scenario:
      'Tu agente de onboarding se conecta a dos tools MCP internas: `code_search`, descrita como "Searches code.", y `workspace_find`, descrita como "Finds code in the workspace." `code_search` consulta un índice entre repos de la rama principal de 140 repositorios que se reconstruye cada noche; `workspace_find` recorre el repo que el ingeniero tiene en local, incluidos los cambios sin commit, y no ve otros repos. En 300 sesiones registradas, el 26% de las preguntas sobre código que el ingeniero había cambiado ese día se respondió con `code_search` y la versión del día anterior, y el 11% de las preguntas entre repos ("¿quién más llama al cliente de facturación?") usó `workspace_find` e informó de un solo llamador. Ambas tools responden en menos de un segundo. Un compañero propone fusionarlas en una sola tool `find_code` que consulte los dos backends y elimine duplicados, con una estimación de dos semanas de trabajo.',
    ask: '¿Cuál es el primer paso más eficaz para que la selección de tools sea fiable?',
    options: [
      'Fusionar las dos tools en la `find_code` propuesta, para que el agente no tenga que elegir nunca entre ellas y cada consulta reciba en una sola respuesta los resultados de la rama principal y del repo local combinados y sin duplicados.',
      'Añadir una regla al system prompt: cuando el ingeniero diga "mi", "he cambiado" o "local", llamar a `workspace_find`; si no, a `code_search`, para que las preguntas sobre cambios recientes vayan al repo local.',
      'Reescribir las dos descripciones para que digan qué busca cada una (índice nocturno de la rama principal de 140 repos frente al repo local con cambios sin commit), con consultas de ejemplo y cuándo usar la otra tool.',
      'Añadir ocho ejemplos few-shot al system prompt con preguntas sobre cambios locales enrutadas a `workspace_find` y preguntas entre repos enrutadas a `code_search`, cubriendo los patrones vistos en los logs.',
    ],
    why: [
      'Consolidar es un diseño válido, pero cuesta dos semanas, más de lo que pide un primer paso, y mezcla resultados obsoletos del índice con resultados locales recientes, así que el agente sigue sin saber qué versión está leyendo.',
      'Las instrucciones basadas en palabras clave crean asociaciones no deseadas: "el cliente de facturación de mi equipo" es una pregunta entre repos que esta regla enviaría a `workspace_find`. Además, pasa por encima de las descripciones en vez de arreglarlas.',
      'La descripción es la señal principal para elegir tool. Estas dos son mínimas y ocultan la frontera que importa, frescura y alcance; explicarla con ejemplos ataca la causa raíz con el menor coste.',
      'Los few-shot añaden tokens a cada petición y solo cubren patrones ya vistos, mientras las descripciones mínimas que provocan el mal enrutado siguen igual.',
    ],
    rule: 'Mal enrutado entre tools parecidas: primero reescribe las descripciones con alcance, entradas, ejemplos y fronteras.',
  },
  'x-devprod-mcp-one-session': {
    scenario:
      'Tu agente de análisis de releases, que usan 25 ingenieros y un job nocturno, responde preguntas como "¿por qué empezó a fallar el job heredado de facturación tras la release de marzo?". Necesita GitHub (PRs y diffs), Jira (tickets) y vuestro MCP server interno de historial de despliegues. Como el equipo cree que el agente solo puede usar un MCP server por sesión, ejecuta tres sesiones seguidas, una por servidor, y un script copia la salida de cada sesión en el prompt de la siguiente. Cada investigación tarda unos 14 minutos, y en el 30% la respuesta no consigue enlazar un PR con su ticket porque la sesión de Jira nunca vio el diff. Un compañero propone un MCP server pasarela a medida que envuelva las tres APIs para que una sola sesión pueda usarlas, con una estimación de seis semanas. Los servidores de la comunidad para GitHub y Jira ya funcionan bien, y dos ingenieros mantienen el de historial de despliegues.',
    ask: '¿Cuál es la forma más eficaz de que una sola investigación relacione PRs, tickets y despliegues?',
    options: [
      'Construir el servidor pasarela para que el agente vea una única lista de tools, añadiendo tools que crucen fuentes, como `get_ticket_for_pr`, que unan los datos de GitHub y Jira antes de que el agente tenga que relacionarlos.',
      'Configurar los tres servidores en el `.mcp.json` del proyecto, con los tokens mediante expansión de variables de entorno, y usar una sola sesión: las tools de todos los servidores configurados se descubren al conectar y están disponibles a la vez.',
      'Mantener las tres sesiones, pero hacer que cada una escriba un fichero estructurado de hallazgos con números de PR, claves de ticket e IDs de despliegue que la siguiente sesión lea primero, para que los enlaces entre fuentes sobrevivan a cada traspaso.',
      'Mover los tres servidores al `~/.claude.json` de cada ingeniero, de ámbito de usuario, para que se carguen juntos en todas las sesiones, evitando un fichero de configuración compartido que todo el equipo tendría que mantener sincronizado.',
    ],
    why: [
      'Sobredimensionado: seis semanas para reconstruir un acceso que ya funciona. Las tools de todos los servidores configurados ya están disponibles a la vez, y para integraciones estándar como GitHub y Jira lo indicado son los servidores de la comunidad.',
      'La premisa es falsa: el agente descubre las tools de todos los MCP servers configurados al conectar y puede usarlas todas en una sesión, así que sigue directamente los enlaces entre PR, ticket y despliegue. El ámbito de proyecto comparte la configuración con el equipo y con el job nocturno.',
      'Mejores traspasos reducen el síntoma pero mantienen una división que la plataforma no exige; el paso de Jira sigue razonando sin el diff, y tres sesiones seguidas mantienen los 14 minutos.',
      'Los servidores de `~/.claude.json` son personales: el job nocturno y los ingenieros nuevos no los tendrían. Las herramientas compartidas del equipo van en el `.mcp.json` del proyecto, y el acceso simultáneo no depende del ámbito.',
    ],
    rule: 'Las tools de todos los MCP servers configurados están disponibles a la vez; no hace falta pasarela ni una sesión por servidor.',
  },
  'x-devprod-mcp-config-split': {
    scenario:
      'El `.mcp.json` de tu repo define tres servidores. `github` usa un token de acceso personal que el tech lead pegó como texto literal, y el escáner de secretos bloquea ahora cada push que toca el fichero. `sentry`, un servidor de la comunidad, lee su clave con `${SENTRY_TOKEN}`. `perf-lab`, un profiler experimental que Dana está evaluando, lanza un binario en `/Users/dana/tools/perf-lab` que solo existe en su portátil, así que 9 de 11 ingenieros ven una conexión MCP fallida al arrancar y dos recién llegados perdieron una mañana depurando su configuración. Requisitos: todos, incluido el job de CI, deben tener `github` y `sentry` automáticamente al clonar; la política de seguridad prohíbe cualquier credencial en el repositorio; Dana quiere `perf-lab` junto a los servidores compartidos en sus propias sesiones. El repo tiene unos 1,2 millones de líneas de código.',
    ask: '¿Qué cambio de configuración cumple todos estos requisitos?',
    options: [
      'Mover los tres servidores al `~/.claude.json` de cada ingeniero con un script de onboarding y borrar `.mcp.json`, para que ningún token ni ruta propia de una máquina pueda volver a subirse al repositorio.',
      'Mantener los tres en `.mcp.json`, sustituir el token de `github` por `${GITHUB_TOKEN}` y convertir la ruta del comando de `perf-lab` en `${PERF_LAB_PATH}`, para que cada ingeniero la apunte a su instalación local o la deje sin definir si no la usa.',
      'Mover `perf-lab` al `~/.claude.json` de Dana y mantener `github` y `sentry` en `.mcp.json`, dejando el token literal pero añadiendo `.mcp.json` a la lista de excepciones del escáner para que los push dejen de bloquearse.',
      'Mantener `github` y `sentry` en `.mcp.json`, sustituyendo el token literal por `${GITHUB_TOKEN}` definido en cada entorno, y mover `perf-lab` al `~/.claude.json` de Dana, donde se carga junto a los servidores compartidos.',
    ],
    why: [
      'El ámbito de usuario es personal: el job de CI y los clones nuevos no tendrían `github` ni `sentry` automáticamente, y cada configuración puede divergir. Elimina el secreto renunciando a la configuración compartida del proyecto.',
      'La expansión de variables de entorno es correcta para el token, pero un servidor experimental va en el ámbito de usuario. Los ingenieros sin `perf-lab` instalado seguirían viendo una conexión fallida al arrancar.',
      'Mover `perf-lab` es correcto, pero añadir el fichero a las excepciones deja una credencial real en el repositorio, algo que la política prohíbe. El token debe referenciarse como `${GITHUB_TOKEN}`, no subirse.',
      'Los servidores compartidos siguen en el ámbito de proyecto con credenciales expandidas desde el entorno, el experimental pasa al ámbito de usuario y las tools de ambos ámbitos están disponibles a la vez en las sesiones de Dana.',
    ],
    rule: 'Servidores compartidos: `.mcp.json` con secretos vía `${VAR}`. Personales o experimentales: `~/.claude.json`.',
  },
  'x-devprod-error-message-grep': {
    scenario:
      'Un ingeniero de guardia pega en tu agente un error de un servicio de pedidos heredado, "LockTimeoutError: could not acquire ledger lock for order 88213 after 3 attempts", y pregunta de dónde sale y qué caminos del código pueden provocarlo. El repo tiene 6.400 ficheros. El agente primero ejecutó `Grep` con el mensaje completo y no obtuvo coincidencias; después ejecutó `Glob` con `**/*ledger*` y empezó a leer en orden los 38 ficheros resultantes, y se quedó sin contexto en el fichero 27 sin dar respuesta. Más tarde el equipo vio que el mensaje se construye en `lib/locking/mutex.py` a partir de una cadena de formato con huecos para el ID del pedido y el número de intentos, y que ninguno de los ficheros de ledger lo lanza. El servicio corre en Python 2.7 y está previsto retirarlo el año que viene.',
    ask: '¿Qué estrategia de tools debería haber usado el agente?',
    options: [
      'Hacer `Grep` de un fragmento fijo del mensaje, como "could not acquire ledger lock", leer con `Read` el fichero que lo lanza, luego hacer `Grep` de los llamadores de esa función y leer solo esos ficheros para trazar los caminos.',
      'Hacer `Glob` de `**/*lock*` y `**/*mutex*` en vez de `**/*ledger*`, ya que el módulo que lo lanza lleva el nombre del mecanismo de bloqueo, y leer con `Read` cada coincidencia en orden hasta dar con el fichero que realmente lanza el error.',
      'Volver a hacer `Grep` del mensaje exacto con los dos puntos y los dígitos escapados, para que la búsqueda coincida con el texto literal, y leer con `Read` todos los ficheros del resultado para trazar todos los caminos del código que llevan a él.',
      'Leer primero completos con `Read` los puntos de entrada del servicio (módulo principal, rutas, planificador de jobs) y seguir cada import en profundidad, para que el agente tenga un mapa completo del código antes de buscar el error.',
    ],
    why: [
      'El texto del mensaje está en el código, así que es una búsqueda de contenido: `Grep` de la parte que no varía y, a partir de ahí, entender el código poco a poco leyendo la coincidencia y buscando sus llamadores, en vez de cargar ficheros de entrada.',
      '`Glob` compara nombres de fichero, no contenido. Adivinar mejor los nombres podría encontrar el módulo esta vez, pero sigue leyendo ficheros en bloque y no ofrece forma de encontrar los llamadores que pueden provocar el error.',
      'El mensaje literal nunca aparece en el código: el ID del pedido y el número de intentos se rellenan en tiempo de ejecución, así que la cadena exacta sigue sin coincidir. Escapar arregla la sintaxis de la regex, no la interpolación.',
      'Mapear todo el servicio antes de buscar es el patrón de leerlo todo de entrada que ya agotó el contexto; un `Grep` del mensaje encuentra directamente el punto de partida.',
    ],
    rule: 'Haz `Grep` de la parte estable del mensaje y luego `Read` siguiendo a los llamadores; nunca leas ficheros de entrada.',
  },
  'x-devprod-tests-for-decorator': {
    scenario:
      'Antes de eliminar el decorador heredado `@require_legacy_session` de un monolito Django de 4.000 ficheros, un ingeniero pide al agente todas las vistas que todavía lo usan y los ficheros de test que cubren cada una. Por convención, los tests replican el árbol de apps como `tests/<app>/test_<module>.py`. Sin embargo, una limpieza de 2019 agrupó cerca del 15% de los tests antiguos en `tests/legacy_suite_01.py` a `legacy_suite_12.py`, y cada uno cubre vistas de varias apps. Los tests se refieren a las vistas importándolas o mediante su nombre de URL. El decorador siempre se aplica directamente con la sintaxis @. Ejecutar la suite completa lleva unos 50 minutos y necesita una base de datos de staging a la que el agente no llega, y el último informe de cobertura tiene dos meses. El tech lead quiere la lista antes de la reunión de planificación de mañana.',
    ask: '¿Qué plan de tools encuentra de forma más fiable las vistas y sus tests sin leer el código de entrada?',
    options: [
      'Hacer `Glob` de `**/views*.py`, leer con `Read` cada fichero resultante para ver si aplica el decorador, y luego hacer `Glob` de `tests/**/test_*.py` y emparejar cada vista afectada con el test cuyo nombre coincida con su módulo.',
      'Hacer `Grep` de `@require_legacy_session` para listar los ficheros de vistas afectados y luego `Glob` de `tests/<app>/test_<module>.py` para cada uno de esos módulos, que da los ficheros de test directamente a partir de la convención de nombres.',
      'Hacer `Grep` de `@require_legacy_session` para listar las vistas afectadas, luego `Grep` en el árbol `tests/` de la ruta de import o el nombre de URL de cada vista, que también encuentra las suites heredadas agrupadas, y leer con `Read` solo esas coincidencias.',
      'Hacer `Grep` de `@require_legacy_session` para listar las vistas afectadas y luego usar `Bash` para ejecutar la suite de tests con cobertura limitada a esos módulos e informar de qué ficheros de test ejecutan cada vista afectada.',
    ],
    why: [
      '`Glob` encuentra ficheros por nombre, no por su contenido, así que comprobar el decorador obliga a leer de entrada todos los ficheros de vistas. Emparejar tests por nombre de fichero también se deja las suites heredadas agrupadas.',
      'Buscar el decorador con `Grep` es correcto, pero aquí la convención de nombres no es fiable: el 15% de tests que se movió a ficheros `legacy_suite` nunca coincide con un patrón `test_<module>.py`, así que la lista quedaría incompleta.',
      'Las dos preguntas son sobre contenido: qué ficheros aplican el decorador y qué tests hacen referencia a cada vista por import o por nombre de URL. `Grep` responde a ambas sin depender de los nombres, y `Read` se gasta solo en coincidencias confirmadas.',
      'La suite necesita una base de datos de staging a la que el agente no llega, así que el plan no puede ejecutarse; y aunque pudiera, cambia una búsqueda rápida de contenido por 50 minutos de ejecución.',
    ],
    rule: 'Usa `Grep` cuando la respuesta está en el contenido o los nombres no son fiables; `Glob` cuando el patrón de nombre es la respuesta.',
  },
  'x-devprod-scaffold-skill-frontmatter': {
    scenario:
      'El skill de proyecto de tu equipo `/scaffold-handler`, en `.claude/skills/scaffold-handler/SKILL.md`, estudia entre 10 y 15 handlers existentes para aprender las convenciones y después escribe un handler nuevo y su test en `src/handlers/` y `tests/`. Lo usan cuarenta ingenieros, y este mes han llegado tres quejas. Cerca del 30% de las invocaciones no incluye el nombre del handler, así que el skill se lo inventa a partir del fichero abierto. Tras cada ejecución, unos 20.000 tokens de salida de `Grep` y `Read` se quedan en la sesión del ingeniero, y Claude pierde el hilo de la funcionalidad que estaba construyendo. La semana pasada el skill ejecutó `git clean -fd` con `Bash` para "ordenar" una carpeta generada a medias y borró trabajo sin seguimiento de un ingeniero. El skill necesita `Read`, `Grep` y `Glob` para estudiar las convenciones y debe seguir escribiendo los ficheros generados. Una ejecución media dura cuatro minutos.',
    ask: '¿Qué cambio en el skill resuelve mejor las tres quejas sin que deje de ser útil?',
    options: [
      'Añadir instrucciones en el cuerpo del skill: pedir el nombre del handler si no se indica, no ejecutar nunca comandos de git ni de borrado y dar una respuesta final breve, para cambiar el comportamiento sin tocar el frontmatter.',
      'Añadir `argument-hint` para el nombre del handler y `context: fork`, y limitar `allowed-tools` a `Read`, `Grep` y `Glob`, para que el skill se ejecute aislado y no pueda cambiar nada en el árbol de trabajo del ingeniero.',
      'Añadir `argument-hint` para el nombre del handler y limitar `allowed-tools` a `Read`, `Grep`, `Glob` y `Write`, y pedir a los ingenieros que ejecuten `/compact` tras cada invocación para condensar la salida de exploración que deja.',
      'Añadir `argument-hint` para el nombre del handler, limitar `allowed-tools` a `Read`, `Grep`, `Glob` y `Write` para que `Bash` no esté disponible, y añadir `context: fork` para que la exploración se ejecute en un contexto de sub-agente aislado.',
    ],
    why: [
      'Las instrucciones en el cuerpo son probabilísticas: nada impide otro `git clean`, y la exploración verbosa sigue cayendo en la sesión principal. Las opciones del frontmatter existen para que estos comportamientos sean fiables.',
      'El aislamiento y el hint son correctos, pero sin `Write` el skill ya no puede crear el handler ni su test, y el escenario dice que debe seguir haciéndolo. La restricción se pasa de largo.',
      'El hint y el límite de tools son correctos, pero `/compact` limpia cuando la contaminación ya se ha producido y depende de que cada ingeniero se acuerde; `context: fork` evita desde el principio que la salida entre en la sesión principal.',
      '`argument-hint` pide el nombre que falta, `allowed-tools` quita `Bash` y conserva las tools que el skill necesita para estudiar y escribir, y `context: fork` deja los 20.000 tokens de exploración fuera de la conversación principal.',
    ],
    rule: 'Frontmatter del skill: `argument-hint` para las entradas, `allowed-tools` para quitar tools peligrosas, `context: fork` para trabajo verboso.',
  },
  'x-devprod-subagent-transcripts': {
    scenario:
      'Tu agente de mapeo de código heredado usa un coordinador y cuatro subagentes, uno por subsistema de un monolito Java 8, para elaborar un informe de arquitectura para los ingenieros que se incorporan al equipo. Para que el coordinador pueda "comprobar" los hallazgos, cada subagente devuelve su transcripción completa, cada coincidencia de `Grep` y cada fichero que leyó, unos 40.000 tokens cada uno. Con la cuarta respuesta, el contexto del coordinador está al 85%; empieza a describir "el patrón repository habitual" en lugar de la clase `LedgerGateway` que informó un subagente, y contradice su propio resumen anterior del flujo de facturación. Ejecutar `/compact` a mitad de la ejecución ayudó un rato, pero perdió rutas de fichero exactas que el informe debe citar. Los subagentes se ejecutan en paralelo y tardan entre 6 y 9 minutos cada uno. El informe debe nombrar clases y rutas de fichero concretas para cada flujo.',
    ask: '¿Qué cambio devuelve de forma más eficaz la precisión al coordinador?',
    options: [
      'Pasar el coordinador a un modelo con una ventana de contexto mayor, para que las cuatro transcripciones quepan con margen de sobra y no haya que resumir ni descartar nada antes de escribir el informe.',
      'Hacer que cada subagente devuelva un resumen estructurado de los hallazgos clave (clases, rutas de fichero, cadenas de llamadas, preguntas abiertas) y guarde sus notas detalladas en un scratchpad file que el coordinador pueda consultar cuando lo necesite.',
      'Ejecutar `/compact` en el coordinador cada vez que vuelve un subagente, pidiendo que conserve todos los nombres de clase y rutas de fichero, para que su contexto se mantenga pequeño durante toda la ejecución.',
      'Fusionar los cuatro subagentes en un solo agente que explore los subsistemas uno tras otro y apunte los hallazgos en un scratchpad file, para que un único contexto tenga la imagen completa y no se pierda nada en los traspasos entre agentes.',
    ],
    why: [
      'Una ventana mayor no evita la degradación: el coordinador seguiría con 160.000 tokens de exploración en bruto, y las respuestas derivan hacia patrones típicos a medida que se acumula la salida verbosa.',
      'Los subagentes existen para aislar la exploración verbosa, y devolver transcripciones completas lo anula. Los hallazgos condensados mantienen al coordinador en la coordinación de alto nivel, y el scratchpad guarda las rutas exactas que necesita el informe.',
      'Compactar trata el síntoma cuando el contexto ya se ha llenado; el equipo ya vio que pierde rutas exactas, y con cada respuesta llega otra transcripción de 40.000 tokens.',
      'El scratchpad ayuda, pero un solo agente que hace toda la exploración mete la salida verbosa de cuatro subsistemas en un único contexto, justo el patrón que causa la degradación, y renuncia a la ejecución en paralelo.',
    ],
    rule: 'Los subagentes devuelven hallazgos condensados, no transcripciones; los detalles van en scratchpad files.',
  },
  // --- Claude Code for Continuous Integration ---
  'x-ci-bench-regression-adaptive': {
    scenario:
      'Tu job nocturno de benchmarks en CI detectó una subida del 35% en la latencia p95 del servicio de checkout entre dos tags de release separados por 140 commits. Para investigarlo, el equipo montó una cadena fija de cuatro pasos con `claude -p`: resumir cada commit, puntuar su riesgo de rendimiento, elegir los tres más arriesgados y redactar un informe. Tres ejecuciones culparon a los tres diffs más grandes, y los ingenieros descartaron los tres. Después, una persona encontró la causa siguiendo el profiler: la contención de locks apuntaba al pool de conexiones, el pool apuntaba a un valor por defecto cambiado en un pequeño commit de configuración, y ese valor solo perjudicaba porque una subida de dependencia en otra parte duplicaba los checkouts del pool por petición. La suite de benchmarks corre en hardware dedicado y tarda 25 minutos. Regresiones parecidas aparecen unas dos veces al mes, y cada una ha implicado módulos distintos.',
    ask: '¿Qué descomposición debería usar la investigación automática en futuras regresiones?',
    options: [
      'Mantener la cadena fija pero dividirla en pasadas de análisis local por commit seguidas de una pasada de integración aparte entre commits, para que interacciones como el cambio de configuración y la subida de dependencia se revisen juntas.',
      'Sustituir la cadena por una investigación adaptativa: reunir primero evidencia del profiler y generar cada subtarea siguiente a partir de lo que muestre, como pasar de la contención de locks a la configuración del pool y a los commits que la tocan.',
      'Enviar los 140 diffs y la salida completa del benchmark en una sola petición de contexto largo, para que el modelo vea interacciones entre commits lejanos que una cadena de pasos separados procesa aislados y pierde.',
      'Ejecutar la cadena fija tres veces con los commits en distinto orden y reportar solo los commits que queden entre los tres primeros en al menos dos ejecuciones, para anular el sesgo de la cadena hacia los diffs más grandes.',
    ],
    why: [
      'Una cadena por unidad más una pasada de integración es la forma correcta de revisar un conjunto conocido de ficheros, pero aquí lo siguiente que hay que mirar depende de evidencia en ejecución. Una cadena fija sobre diffs sigue sin poder seguir el profiler de la contención al pool y a la configuración.',
      'Es una investigación abierta: cada hallazgo decide qué examinar después y cada regresión implica módulos distintos. La descomposición dinámica genera subtareas a partir de hallazgos intermedios, algo que una cadena predefinida no puede hacer.',
      'Meter 140 diffs en una sola pasada diluye la atención, y sigue leyendo código en vez de seguir la evidencia. Un contexto mayor no planifica el siguiente paso.',
      'El consenso entre ejecuciones repetidas de la misma cadena defectuosa solo hace más estable una clasificación equivocada, y la votación puede ocultar el commit pequeño que de verdad importa.',
    ],
    rule: 'Revisión predecible de varios aspectos: cadena fija. Investigación abierta donde los hallazgos marcan el siguiente paso: adaptativa.',
  },
  'x-ci-test-rules-not-skill': {
    scenario:
      'Tu monorepo tiene 12 paquetes y los ficheros de test están junto a su código (`cart.ts` al lado de `cart.test.ts`) en unas 140 carpetas. Tres jobs automáticos editan tests: el job nocturno de generación de tests, un bot de actualización de dependencias que repara tests rotos y un bot de refactorización. Las convenciones de tests (usar las factorías `buildUser()`, fake timers, nada de llamadas de red) se empaquetaron como un skill de proyecto en `.claude/skills/test-conventions/`. Una auditoría muestra que solo el 38% de los ficheros de test escritos por los bots las siguen, mientras que los desarrolladores que invocan el skill a mano las aplican bien. El `CLAUDE.md` raíz ya tiene 900 líneas y el equipo lo está recortando porque se carga en el job de review de PRs en cada push. Un compañero señala que la descripción del skill ocupa solo una línea.',
    ask: '¿Cuál es la forma más fiable de que todos los jobs sigan las convenciones de tests sin añadir contexto a ejecuciones que no lo necesitan?',
    options: [
      'Mover las convenciones a `.claude/rules/testing.md` con el frontmatter `paths: ["**/*.test.ts"]`, para que se carguen solas cada vez que cualquier job o desarrollador edite un fichero de test, esté donde esté, y en ningún otro caso.',
      'Añadir un `CLAUDE.md` con las convenciones de tests en cada una de las 12 carpetas de paquete, para que cada job que trabaje dentro de un paquete recoja las convenciones de los tests de ese paquete sin cargarlas en todo el repositorio.',
      'Mover las convenciones al `CLAUDE.md` raíz bajo un encabezado "Testing", para que todas las sesiones y todos los jobs de CI las carguen al arrancar y ningún job dependa de que se elija o se invoque un skill.',
      'Reescribir la descripción del skill con frases disparadoras como "escribir tests" y "arreglar test que falla", para que los jobs headless elijan el skill con más fiabilidad siempre que su trabajo implique ficheros de test.',
    ],
    why: [
      'Las reglas con alcance por ruta se cargan solas al editar un fichero que coincide, sea cual sea el job o el prompt, y un solo glob cubre tests repartidos por 140 carpetas. A diferencia del fichero raíz, no se cargan en todas las sesiones.',
      'Los ficheros por paquete duplican las convenciones 12 veces y se cargan con cualquier fichero del paquete, no solo con los tests. Los ficheros atados a un directorio no sirven para convenciones que siguen a un tipo de fichero.',
      'Se aplicaría en todas partes, pero engorda el fichero de 900 líneas que el equipo está recortando y mete las convenciones de tests en el job de review en cada push, justo lo que el escenario descarta.',
      'Una descripción mejor sigue dependiendo de que Claude decida cargar el skill. Los skills son para flujos bajo demanda; las convenciones que deben aplicarse siempre necesitan una carga determinista por ruta.',
    ],
    rule: 'Convenciones para un tipo de fichero en todo el repo: reglas por ruta, no skills ni `CLAUDE.md` de directorio.',
  },
  'x-ci-log-digest-io-examples': {
    scenario:
      'Tu CI pasa los logs de tests fallidos al job de review, pero los logs en bruto llegan a 40.000 líneas, así que una ingeniera está usando Claude Code para escribir `digest.py`, que condensa un log en una entrada por fallo. Su especificación, en prosa: conservar el nombre del test, el mensaje de la aserción y el primer frame de la pila que esté en código de la aplicación, y descartar los frames del framework. Tres intentos la interpretaron de forma distinta: uno conservó el frame superior aunque estuviera dentro de pytest, otro descartó el diff entre esperado y obtenido por considerarlo "ruido" y otro conservó todos los frames en los tests parametrizados. Cada vez que reformuló el párrafo apareció una interpretación errónea nueva. Ella sabe exactamente cómo debe quedar cada resumen: el sprint pasado el equipo escribió a mano resúmenes de 25 fallos reales. El script debe ejecutarse en menos de 2 segundos, y todos los intentos lo han cumplido.',
    ask: '¿Cuál es el siguiente paso más eficaz para que `digest.py` quede bien?',
    options: [
      'Reescribir la especificación en prosa como una lista numerada de reglas precisas, definiendo explícitamente "frame de aplicación", "frame del framework" y "mensaje de aserción", para que ninguna frase admita otra lectura.',
      'Pedir a Claude que la entreviste sobre los requisitos del resumen antes del siguiente intento, para que saque a la luz consideraciones sobre frames y formatos de aserción que quizá ella aún no haya previsto.',
      'Dar a Claude 2-3 de los casos escritos a mano como pares, cada uno con el fragmento de log en bruto y el resumen exacto esperado, incluido uno con pytest en el frame superior y uno de un test parametrizado.',
      'Reportar los tres defectos en tres mensajes separados, uno por intento, para que cada arreglo se confirme por separado antes de plantear el siguiente y Claude se centre en una sola regla cada vez.',
    ],
    why: [
      'Reformular la prosa es lo que ya ha hecho tres veces, y cada versión se malinterpretó de nuevo. Cuando las descripciones se interpretan de forma inconsistente, los ejemplos concretos funcionan mejor que una prosa más precisa.',
      'El patrón entrevista sirve en dominios desconocidos, cuando el desarrollador no ha pensado bien los requisitos. Aquí ella ya sabe la salida exacta esperada; el problema es comunicarla.',
      'Los ejemplos concretos de entrada/salida son la forma más eficaz de comunicar una transformación cuando la prosa se interpreta de forma inconsistente, y ella ya tiene casos reales con el resumen correcto.',
      'Son tres lecturas de una misma especificación ambigua, no bugs independientes. Parchearlos de uno en uno deja la prosa como única guía, así que seguirán apareciendo interpretaciones nuevas.',
    ],
    rule: 'Si la prosa se sigue malinterpretando, enseña 2-3 ejemplos concretos de entrada/salida en vez de reformular.',
  },
  'x-ci-inline-comments-json-schema': {
    scenario:
      'Tu job de review de PRs ejecuta `claude -p` con el repo descargado, toma los criterios de review del `CLAUDE.md` del proyecto y pide los hallazgos "como un array JSON con file, line, severity y message". Un script publica cada hallazgo como comentario inline y hace fallar el check si alguna severidad es "blocker". En 2.000 ejecuciones el mes pasado, el 6% de las salidas rompió el script: JSON envuelto en una frase o en un bloque de código, `line` como un rango tipo "40-52" o la severidad escrita como "Blocker" o "P0". El equipo añadió al prompt dos ejemplos few-shot del JSON exacto, y los fallos bajaron al 4%. El job tarda unos 3 minutos por PR, y el equipo quiere conservar el acceso al repo y los criterios de `CLAUDE.md` que le da Claude Code en vez de reconstruir el revisor.',
    ask: '¿Cuál es la forma más eficaz de que los hallazgos de cada ejecución sean seguros para el script que los publica?',
    options: [
      'Añadir un segundo paso `claude -p` que reciba la salida en bruto y la repare como JSON válido con todos los campos obligatorios, para corregir las ejecuciones mal formadas antes de que las lea el script de publicación.',
      'Reforzar el script de publicación: quitar la prosa y los bloques de código, partir los rangos de líneas quedándose con el primer número y mapear variantes de severidad como "Blocker" o "P0" a los valores canónicos.',
      'Pasar la review a una llamada directa a la API que fuerce una tool `report_findings` con un JSON schema, para que la salida quede garantizada por tool use en vez de depender de que Claude Code obedezca el prompt.',
      'Definir un JSON schema con `line` entero, un enum de severidad y campos obligatorios, y ejecutar `claude -p` con `--output-format json` y `--json-schema`, para que cada ejecución devuelva los hallazgos con esa estructura.',
    ],
    why: [
      'Una llamada de reparación es otro paso probabilístico que añade coste y latencia y puede fallar igual. La CLI puede imponer la estructura directamente.',
      'Normalizar a posteriori trata los síntomas: cada variante nueva necesita otra regla, y quedarse con el primer número de un rango puede colgar un comentario en la línea equivocada.',
      'Forzar una tool sí garantiza una salida conforme al schema, pero obliga a reconstruir el revisor fuera de Claude Code y a perder el acceso al repo y los criterios de `CLAUDE.md` que el equipo quiere conservar.',
      '`--output-format json` con `--json-schema` es el mecanismo de la CLI para imponer salida estructurada en CI: da hallazgos parseables que se pueden publicar como comentarios inline sin cambiar el revisor.',
    ],
    rule: 'En CI, impón la estructura de los hallazgos con `--output-format json` y `--json-schema`, no con prompts ni reparaciones.',
  },
  'x-ci-rerun-still-unaddressed': {
    scenario:
      'Tu job de review vuelve a ejecutar `claude -p` en cada push a una PR abierta. Para evitar comentarios duplicados, el equipo guarda los hallazgos de cada ejecución a partir de su salida JSON y los añade al siguiente prompt con la instrucción "No reportes ningún problema de la lista siguiente". Los duplicados desaparecieron, pero el merge gate solo lee la última ejecución y ahora deja pasar PRs cuyos hallazgos anteriores nunca se arreglaron: la semana pasada se mergeó una PR con una consulta SQL sin parametrizar marcada en su primer push, porque las ejecuciones siguientes reportaron "0 hallazgos". Los desarrolladores hacen a menudo force-push de ramas rebasadas, así que los números de línea cambian entre ejecuciones. Un compañero propone reanudar la primera sesión de review con `--resume` en cada push para que Claude recuerde lo que ya dijo. El job corre en unas 400 PRs a la semana.',
    ask: '¿Qué cambio evita mejor tanto los comentarios duplicados como los problemas que desaparecen sin avisar?',
    options: [
      'Reanudar la primera sesión de review con `--resume` en cada push, para que Claude recuerde qué problemas ya planteó y comente solo lo que cambian los commits nuevos, sin necesidad de la lista de hallazgos.',
      'Seguir pasando los hallazgos anteriores, pero pedir a Claude que reporte solo los problemas nuevos o aún sin resolver en el código actual, marcando qué hallazgos anteriores siguen abiertos, y bloquear según esa lista.',
      'Quitar los hallazgos anteriores del prompt y revisar cada push desde cero, y que el script de publicación omita cualquier hallazgo cuyo fichero y línea coincidan con un comentario ya existente en la PR.',
      'Mantener la instrucción actual y hacer que el merge gate bloquee con la unión de los hallazgos de todas las ejecuciones de la PR, para que un problema marcado en cualquier push anterior siga bloqueando hasta resolverse.',
    ],
    why: [
      'Una sesión reanudada arrastra resultados de herramientas sobre código que desde entonces se ha rebasado y cambiado. Con un contexto previo obsoleto, es más fiable una ejecución nueva con los hallazgos inyectados.',
      'Hallazgos anteriores más "reporta solo problemas nuevos o aún sin resolver" es el patrón para las re-ejecuciones: los arreglados desaparecen, los abiertos siguen visibles para el gate y nada se publica dos veces.',
      'Los force-push desplazan los números de línea, así que comparar fichero y línea vuelve a publicar problemas viejos y oculta otros nuevos en líneas reutilizadas. Claude además pierde el contexto para distinguir arreglados de abiertos.',
      'La unión nunca olvida los problemas arreglados, así que el gate bloquea merges por problemas ya resueltos; la última ejecución sigue sin distinguir los abiertos de los arreglados.',
    ],
    rule: 'En las re-ejecuciones, pasa los hallazgos anteriores y pide solo problemas nuevos o aún sin resolver.',
  },
  'x-ci-security-behavior-criterion': {
    scenario:
      'La categoría de seguridad de tu bot de review usa el prompt "Marca el código inseguro". Los desarrolladores descartan el 64% de sus hallazgos. Los descartados son sobre todo `md5()` usado para claves de caché y ETags, cadenas SQL montadas con constantes fijas en el código y llamadas a `subprocess` cuyos argumentos son literales fijos. El 36% aceptado incluye un endpoint de búsqueda que concatena un parámetro de la query string en SQL y un handler de webhook que pasa una cabecera de la petición a un comando de shell. Hace un mes el equipo añadió "Reporta solo los problemas de seguridad de los que estés muy seguro"; la tasa de descarte pasó del 66% al 64%, y una inyección real quedó sin reportar. Los hallazgos de bugs del mismo bot se aceptan el 88% de las veces. El bot corre en unas 300 PRs a la semana.',
    ask: '¿Cuál es la forma más eficaz de reducir los falsos positivos de la categoría de seguridad sin dejar de detectar inyecciones reales?',
    options: [
      'Sustituir la instrucción por una lista de APIs y patrones prohibidos, incluidos `md5()`, el SQL montado con cadenas y `subprocess`, para que la categoría reporte cada aparición de forma coherente en vez de depender del criterio de Claude.',
      'Reforzar la línea actual a "Reporta solo problemas de seguridad de los que estés seguro al menos al 90% y calla si dudas", y pedir una puntuación de confianza en cada hallazgo para poder ajustar el umbral.',
      'Marcar una inyección solo cuando datos de una petición, una cabecera u otra entrada no fiable llegan sin sanear a una consulta SQL o a un comando de shell, marcar hashes débiles solo en contraseñas o firmas, e ignorar literales fijos.',
      'Añadir una segunda pasada en la que Claude relea cada hallazgo de seguridad y borre los que ahora considere poco explotables, para publicar en la PR solo los hallazgos que sobrevivan a su propia reconsideración.',
    ],
    why: [
      'Una lista de APIs prohibidas es explícita pero apunta a lo que no es: marcaría justo los hashes de claves de caché y las consultas con literales que los desarrolladores descartan. Los criterios precisos describen el comportamiento de riesgo, no la sintaxis.',
      'El equipo ya probó la fórmula de la confianza y apenas movió la precisión, mientras ocultaba una inyección real. Filtrar por confianza no sustituye a los criterios por categorías.',
      'Fija condiciones comprobables sacadas de los hallazgos aceptados frente a los descartados: se reporta la entrada no fiable que llega a un punto peligroso y se ignoran los literales fijos y los hashes sin uso de seguridad. Los criterios concretos suben la precisión.',
      'Releer con la misma definición vaga de "inseguro" no le da a Claude ningún criterio nuevo, así que filtra con el mismo juicio que produjo el ruido; es filtrar por confianza con otra forma.',
    ],
    rule: 'La precisión sale de criterios que describen el comportamiento de riesgo a reportar y lo que se ignora.',
  },
  'x-ci-disable-by-rate-not-volume': {
    scenario:
      'Tu bot de review publica hallazgos en cuatro categorías. El mes pasado: bugs de lógica, 900 hallazgos, 85% aceptados (135 descartados); seguridad, 300 hallazgos, 92% aceptados (24 descartados); nombres, 150 hallazgos, 12% aceptados (132 descartados); rendimiento, 140 hallazgos, 25% aceptados (105 descartados). A lo largo del trimestre, la aceptación de los hallazgos de seguridad bajó del 97% al 92%, y una encuesta dice que los desarrolladores ya resuelven los hilos del bot sin leerlos. El trimestre pasado el equipo ya movió los comentarios de nombres a notas "FYI" plegadas, y los descartes siguieron subiendo en todas las categorías. Reescribir y validar los criterios de una categoría contra PRs pasadas lleva unas dos semanas. El VP de ingeniería quiere recuperar la confianza de los desarrolladores en este sprint sin perder lo que detectan bugs y seguridad.',
    ask: '¿Qué plan recupera mejor la confianza ya mismo sin perder el valor de la review?',
    options: [
      'Desactivar ya las categorías de nombres y rendimiento, mantener bugs de lógica y seguridad, y reactivar cada categoría desactivada solo cuando sus criterios se hayan reescrito con reglas explícitas de qué reportar e ignorar y se hayan probado con PRs pasadas.',
      'Desactivar por ahora la categoría de bugs de lógica, que produce más comentarios descartados (135), y mantener las otras tres mientras se reescriben sus criterios y se validan con PRs pasadas durante las dos próximas semanas.',
      'Mantener las cuatro categorías, pero publicar los hallazgos de nombres y rendimiento como notas plegadas y no bloqueantes con la etiqueta "baja prioridad", para que las categorías ruidosas sigan disponibles sin reclamar atención.',
      'Mantener las cuatro categorías activas y añadir "Reporta solo los problemas de los que estés muy seguro" al prompt común, para que todas las categorías sean más selectivas a la vez en lugar de reescribir criterios categoría por categoría.',
    ],
    why: [
      'Nombres y rendimiento tienen la peor precisión (12% y 25%) y están erosionando la confianza en las categorías que aciertan. Desactivarlas temporalmente recupera la confianza rápido mientras se arreglan sus criterios; bugs y seguridad siguen detectando problemas reales.',
      '135 descartados de 900 sigue siendo un 85% de aceptación. Juzgar por volumen bruto apagaría una de las categorías más valiosas mientras las de baja precisión siguen publicando ruido.',
      'El equipo ya probó las notas FYI plegadas para nombres y los descartes siguieron subiendo. El ruido sigue siendo ruido aunque se reetiquete, y los desarrolladores siguen perdiendo confianza en todas las categorías.',
      'Las instrucciones genéricas de confianza no mejoran la precisión como lo hacen los criterios concretos, y pueden silenciar bugs y hallazgos de seguridad reales junto con el ruido.',
    ],
    rule: 'Desactiva temporalmente las categorías con alta tasa de falsos positivos, juzgadas por tasa y no por volumen.',
  },
  'x-ci-batch-match-latency': {
    scenario:
      'Cuatro flujos de CI llaman a Claude con la API síncrona. (1) Una review pre-merge: la protección de rama bloquea el merge hasta que informa, y los desarrolladores esperan por ella. (2) Un resumen de la PR que se publica al abrirla y que los revisores suelen leer en menos de 20 minutos. (3) Generación nocturna de tests: una petición de un solo turno por módulo modificado, con su código y sus tests existentes, sin herramientas; los resultados solo tienen que estar listos en el plazo de un día. (4) Una auditoría semanal de dependencias, con plazo de 72 horas. Los flujos 3 y 4 suponen unos dos tercios del gasto mensual. Finanzas quiere recortar el gasto al menos un 25%. Tu manager propone pasar los cuatro a la Message Batches API, consultando el estado cada minuto y recurriendo a una llamada síncrona si un batch no ha vuelto en 10 minutos.',
    ask: '¿Cómo deberías valorar la propuesta de tu manager?',
    options: [
      'Adoptarla para los cuatro: consultar cada minuto recoge pronto los batches rápidos, y el fallback síncrono a los 10 minutos acota la espera de la review pre-merge y del resumen sin renunciar a la mayor parte del ahorro.',
      'Mantener los cuatro síncronos, porque los resultados de un batch no vuelven en el orden de envío y emparejarlos con la PR o el módulo correctos añadiría más riesgo del que compensa el ahorro.',
      'Pasar los cuatro a batches, pero enviar la review pre-merge y el resumen como batches diminutos de una a cinco peticiones, para que terminen lo bastante rápido para los desarrolladores y sigan costando la mitad.',
      'Pasar a batches solo la generación nocturna de tests y la auditoría semanal, y mantener síncronos la review pre-merge y el resumen de la PR; reducir a la mitad dos tercios del gasto ya cumple el objetivo del 25%.',
    ],
    why: [
      'Los batches no tienen SLA de latencia, así que el fallback saltaría de forma impredecible, añadiendo hasta 10 minutos y complejidad a un check bloqueante a cambio de ahorrar solo cuando el batch es rápido por casualidad. Asigna a cada flujo la API que le corresponde.',
      'El orden no es problema: el `custom_id` de cada petición la empareja con su respuesta. Mantenerlo todo síncrono además renuncia al ahorro que pueden aprovechar los trabajos que toleran espera.',
      'Un batch pequeño tampoco tiene latencia garantizada; cualquier batch puede tardar hasta 24 horas. Un check de merge por el que esperan los desarrolladores necesita la API síncrona.',
      'Los batches encajan con trabajo no bloqueante y tolerante a la espera, como la generación nocturna de tests y la auditoría semanal, que aquí son de un solo turno. Lo bloqueante o urgente sigue síncrono, y el ahorro (en torno a un tercio) supera el objetivo.',
    ],
    rule: 'Batches para lo que tolera espera; los checks bloqueantes o urgentes, en la API síncrona.',
  },
  'x-ci-multipass-not-independence': {
    scenario:
      'Las PRs de tu monorepo de pagos las escriben desarrolladores, y la review ya corre en una instancia nueva de `claude -p` que solo ve el diff y los criterios de review. En una PR reciente de 23 ficheros que abarcaba handlers de API, servicios y clases de repositorio, la review en una sola pasada dio comentarios detallados en los ocho primeros ficheros y frases sueltas en el resto, marcó un `await` que faltaba en `refunds.ts` mientras aprobaba el mismo patrón en `payouts.ts`, y no vio que renombrar `amountCents` a `amount` en un DTO rompía a un consumidor en otro fichero. Cambiar a una variante del modelo con una ventana de contexto mayor no cambió nada. Los desarrolladores rechazaron una política que limitaba las PRs a cinco ficheros. Alrededor del 15% de las PRs superan los 20 ficheros.',
    ask: '¿Cuál es la forma más eficaz de reestructurar la review?',
    options: [
      'Añadir una segunda instancia independiente que revise de nuevo la PR entera sin ver la salida de la primera review, y publicar la unión de ambas reviews, para que cada una detecte lo que se le escapó a la otra.',
      'Ejecutar la review sobre la PR completa tres veces y publicar solo los hallazgos que aparezcan en al menos dos ejecuciones, lo que elimina los veredictos contradictorios puntuales como el desacuerdo sobre el `await`.',
      'Revisar cada fichero en su propia pasada acotada buscando problemas locales, y luego ejecutar una pasada de integración aparte sobre el flujo de datos entre ficheros, como los campos de DTO cambiados y el código que los consume.',
      'Revisar cada fichero en su propia pasada acotada, lanzar todas las pasadas en paralelo para ganar velocidad y concatenar sus hallazgos en una sola review, para que todos los ficheros reciban la misma atención.',
    ],
    why: [
      'La review ya es independiente de los autores; el fallo es la dilución de la atención en 23 ficheros. Una segunda pasada sobre la PR entera sufre la misma dilución, y la unión además conserva ambos lados de cada contradicción.',
      'La votación por consenso suprime bugs reales que solo se detectan algunas veces, y la cobertura superficial de los últimos ficheros sigue igual.',
      'Las pasadas por fichero arreglan la profundidad desigual y los veredictos contradictorios; la pasada de integración aparte detecta problemas entre ficheros, como el campo de DTO renombrado, que ninguna pasada de un solo fichero puede ver.',
      'Las pasadas por fichero arreglan la profundidad, pero sin pasada de integración nadie revisa el flujo de datos entre ficheros, así que el consumidor roto del DTO seguiría escapándose.',
    ],
    rule: 'Reviews grandes: pasadas por fichero para lo local más una pasada de integración aparte entre ficheros.',
  },
  'x-ci-fork-not-independent': {
    scenario:
      'Un job autónomo de CI implementa tickets pequeños: una sesión de `claude -p` dedica unos 12 minutos a explorar el repo, escribe el cambio y luego revisa su propio diff antes de abrir la PR. La autorrevisión aprueba el 97% de los diffs, pero los revisores humanos encuentran defectos sutiles en 1 de cada 7 PRs, como una clave de caché que omite el ID de tenant y que la sesión había razonado que era segura. Subir el presupuesto de extended thinking del paso de review triplicó su coste y detectó solo 1 más de 40 bugs sembrados. Para no pagar dos veces la exploración, un compañero propone hacer fork de la sesión de implementación con `fork_session` y ejecutar la review en el fork. El job abre unas 60 PRs a la semana.',
    ask: '¿Qué configuración de review detectará más defectos sutiles con un coste razonable?',
    options: [
      'Hacer fork de la sesión de implementación con `fork_session` y revisar en el fork, para que el revisor reutilice los 12 minutos de exploración mientras corre como una rama aparte que no puede alterar la implementación.',
      'Ejecutar la review en una instancia nueva que reciba el diff, el ticket y los criterios de review, y que lea ella misma los ficheros afectados, sin nada de la transcripción ni del razonamiento de la sesión que implementó.',
      'Mantener la review en la sesión que implementó, pero indicarle que actúe como un revisor senior estricto que da por hecho que el diff tiene bugs, y exigir una justificación escrita para cada aprobación.',
      'Hacer que la sesión que implementó escriba un resumen de sus decisiones de diseño y supuestos, y pasar ese resumen con el diff a una instancia nueva, para que entienda la intención sin volver a explorar.',
    ],
    why: [
      'Un fork parte de la conversación compartida, así que hereda el razonamiento del implementador, incluida la conclusión de que la clave de caché era segura. Sigue siendo autorrevisión, no una instancia independiente.',
      'Una instancia independiente sin el contexto de razonamiento del generador tiene más probabilidades de cuestionar sus decisiones. Leer solo los ficheros afectados cuesta mucho menos que repetir toda la exploración.',
      'Una instrucción de rol no elimina el contexto de razonamiento retenido; la sesión sigue tendiendo a confirmar sus propias decisiones, como ya sugería la prueba del presupuesto de thinking.',
      'El resumen lleva al revisor los supuestos del implementador, como que la clave de caché era segura, y lo ancla en ellos. La independencia consiste en darle al revisor el trabajo, no la justificación.',
    ],
    rule: 'Revisa el código generado en una instancia sin acceso al razonamiento del generador; un fork no es independiente.',
  },
  // --- Structured Data Extraction ---
  'x-extraction-any-then-forced-first': {
    scenario:
      'Tu pipeline de correspondencia entrante da a Claude siete tools: `extract_metadata` (tipo de documento, remitente, fecha), cuatro tools de extracción específicas por tipo y dos de enriquecimiento, `lookup_vendor` y `match_purchase_order`. Todos los pasos posteriores dependen del tipo de documento que devuelve `extract_metadata`, y tu código termina cada ejecución cuando vuelven los resultados del enriquecimiento. El trimestre pasado `tool_choice` estaba en "auto" y el 4% de las respuestas eran prosa que rompía el parser, así que los desarrolladores pasaron todas las peticiones a "any". Las respuestas en prosa bajaron a cero, pero en el 18% de las ejecuciones la primera llamada es una tool específica elegida a partir de la portada, y una de cada cinco usa el schema equivocado, sobre todo facturas rectificativas extraídas como facturas. El system prompt ya dice, en mayúsculas, que se llame primero a `extract_metadata`, y las siete tools tienen descripciones detalladas. Los documentos tienen 7 páginas de media y la latencia p95 es de 9 s frente a un presupuesto de 20 s.',
    ask: '¿Qué configuración de `tool_choice` garantiza mejor el orden necesario manteniendo cada paso legible por máquina?',
    options: [
      'Mantener "any" en todas las peticiones y añadir tres ejemplos few-shot en los que se llama primero a `extract_metadata`, incluida una factura rectificativa cuya portada parece una factura, para que el modelo aprenda el orden esperado de las llamadas.',
      'Forzar `{"type": "tool", "name": "extract_metadata"}` solo en la primera petición y usar "any" en los turnos siguientes, para que cada paso siga siendo una tool call mientras el modelo elige las tools que encajan con el tipo.',
      'Forzar `{"type": "tool", "name": "extract_metadata"}` en todas las peticiones de la conversación, para que ningún turno pueda empezar con una tool específica o de enriquecimiento antes de que se hayan extraído y devuelto los metadatos del documento.',
      'Eliminar `extract_metadata` y añadir sus campos de tipo de documento, remitente y fecha a cada una de las cuatro tools específicas, para que la tool que "any" elija primero devuelva también los metadatos en la misma llamada.',
    ],
    why: [
      'Los ejemplos few-shot y las reglas en mayúsculas son probabilísticos, y el prompt ya indica el orden. Con "any" el modelo puede elegir cualquier tool, así que el 18% puede bajar, pero nada garantiza que desaparezca.',
      'Solo la selección forzada garantiza una tool concreta. Forzarla en la primera petición arregla el orden, y "any" en los turnos siguientes mantiene la tool call garantizada que acabó con la prosa, mientras el modelo elige los pasos siguientes según los metadatos.',
      'Una tool forzada debe llamarse en cada petición que la fuerza, así que el modelo llamaría a `extract_metadata` una y otra vez y nunca llegaría a la extracción específica ni al enriquecimiento.',
      'Esto elimina la regla de orden en vez de cumplirla. El modelo sigue eligiendo un schema antes de que nada haya clasificado el documento, así que las facturas rectificativas siguen cayendo en el schema de factura.',
    ],
    rule: '"any" garantiza una tool call, no cuál: fuerza la primera tool y sigue en los turnos posteriores.',
  },
  'x-extraction-fewshot-borderline-routing': {
    scenario:
      'Tu pipeline de cuentas a pagar envía cada documento de proveedor en una sola petición con tres tools de extracción, `extract_invoice`, `extract_credit_note` y `extract_po_confirmation`, y `tool_choice` en "any". La descripción de cada tool ya explica sus límites, y el system prompt define cada tipo de documento. En los documentos claros se elige la tool correcta el 99,4% de las veces. Los errores se concentran en tres formatos límite: facturas rectificativas impresas en la plantilla de factura con totales negativos, confirmaciones de pedido que muestran precios y un total general, y facturas proforma, que deben tratarse como confirmaciones de pedido. Ahí, el 22% va a la tool equivocada. Dos rondas de definiciones más precisas, la segunda con reglas como "proforma significa confirmación de pedido", no cambiaron nada medible. El pipeline debe seguir en una petición por documento para cumplir un objetivo de latencia p95 de 4 segundos, y el 70% del volumen viene de los 40 proveedores principales.',
    ask: '¿Cuál es la forma más eficaz de mejorar la elección de tool en los documentos límite?',
    options: [
      'Añadir 2–4 ejemplos few-shot de los formatos límite, cada uno mostrando los rasgos decisivos, la tool elegida y por qué se descartaron las otras tools plausibles, para que el modelo aplique ese criterio a formatos parecidos.',
      'Añadir una primera petición que fuerce una tool `classify_document` y, en una segunda petición, forzar la tool de extracción correspondiente, para que clasificación y extracción tengan cada una su propio paso separado y centrado.',
      'Reestructurar el system prompt en una sección más larga de reglas de decisión, con una regla por formato límite y un aviso en mayúsculas de que los documentos mal enrutados causan errores de pago, y repetirla en cada descripción de tool.',
      'Añadir 30 ejemplos few-shot con facturas, facturas rectificativas y confirmaciones de pedido típicas de los 40 proveedores principales, para que el modelo vea muchas veces el formato habitual de cada tipo antes de elegir tool.',
    ],
    why: [
      'Las instrucciones ya no ayudan y los errores están en unos pocos formatos ambiguos. Ejemplos dirigidos que muestran el razonamiento, no solo la respuesta, son la corrección más eficaz para la elección de tool ambigua, y caben en la única petición actual.',
      'Dos llamadas forzadas duplican las peticiones por documento y rompen la restricción de una sola petición por latencia. Además, el clasificador se enfrentaría a los mismos formatos límite con las mismas definiciones, así que la ambigüedad sigue sin resolverse.',
      'Dos rondas de definiciones y reglas más precisas ya fallaron. Añadir más texto de instrucciones es la trampa: cuando la redacción ya no mueve la salida, lo que funciona es mostrar casos resueltos.',
      'Los documentos típicos son el 99,4% que el modelo ya enruta bien. Treinta ejemplos limpios añaden tokens y latencia sin enseñar cómo decidir los casos límite, que es donde están todos los errores.',
    ],
    rule: 'Si las instrucciones se estancan en casos ambiguos, añade 2–4 ejemplos que muestren por qué una opción gana.',
  },
  'x-extraction-fewshot-contrast-renewal': {
    scenario:
      'Tu schema de extracción de contratos tiene `auto_renewal` (booleano) y `renewal_clause_text`, que un dashboard de compras usa para enviar recordatorios de cancelación. El prompt define el criterio de forma explícita: true solo cuando el contrato se renueva sin que ninguna de las partes haga nada. El equipo legal revisó 300 contratos: el 31% de los true eran falsos positivos, sobre todo cláusulas como "podrá renovarse por mutuo acuerdo escrito" o "las partes negociarán las condiciones de renovación". El equipo añadió entonces "marca la renovación automática solo si estás muy seguro". Los falsos positivos bajaron al 12%, pero la siguiente auditoría encontró ocho cláusulas de renovación tácita reales que se pasaron por alto, redactadas como "continuará de año en año salvo rescisión con 90 días de preaviso". Los contratos vienen de 600 contrapartes, así que cada semana aparecen redacciones nuevas, y el equipo del dashboard no puede cambiar el schema este trimestre.',
    ask: '¿Qué cambio reduce mejor los falsos positivos sin perder cláusulas de renovación tácita redactadas de formas nuevas?',
    options: [
      'Añadir un prefiltro en código que envíe al modelo para `auto_renewal` solo las cláusulas que contengan "automática", "renovación automática" o "tácita", y que ponga el campo a false en el resto de contratos antes de cargar el dashboard.',
      'Pedir al modelo una puntuación de confianza con cada valor de `auto_renewal` y aceptar true solo por encima de 0,85, para descartar lecturas débiles como las cláusulas de mutuo acuerdo antes de que lleguen al dashboard.',
      'Cambiar `auto_renewal` por un enum con "yes", "no" y "unclear", y enviar todo contrato "unclear" al equipo legal, para que un abogado decida las cláusulas de renovación límite antes de que el dashboard envíe recordatorios.',
      'Sustituir la instrucción de confianza por 3–4 ejemplos que contrasten renovaciones opcionales o negociadas con renovaciones automáticas reales en redacciones variadas, explicando el elemento decisivo: renovarse sin que nadie actúe.',
    ],
    why: [
      'Buscar palabras clave es justo lo que se pierde las redacciones nuevas: las cláusulas no detectadas dicen "de año en año" y no contienen ninguna de esas palabras, y 600 contrapartes siguen produciendo frases nuevas.',
      'Es el filtrado por confianza que el equipo ya probó en forma de prompt, y que eliminó cláusulas tácitas reales junto con los falsos positivos. Las puntuaciones autoinformadas no están calibradas, así que el umbral cambia recall por precisión a ciegas.',
      'El schema no puede cambiar este trimestre. Y las cláusulas de mutuo acuerdo no son ambiguas de verdad: el modelo las malinterpreta con seguridad, así que tampoco se etiquetarían como "unclear" de forma fiable.',
      'Los ejemplos contrastados con razonamiento enseñan al modelo el elemento decisivo, así que rechaza las renovaciones opcionales y sigue reconociendo la renovación automática en redacciones que nunca ha visto: mejora la precisión sin la pérdida de recall del filtrado por confianza.',
    ],
    rule: 'Reduce falsos positivos con ejemplos contrastados que expliquen la decisión, no con "sé prudente".',
  },
  'x-extraction-any-unsupported-doc-tool': {
    scenario:
      'Los proveedores envían adjuntos por email a un buzón de cuentas a pagar. Definiste `extract_invoice`, `extract_credit_note` y `extract_receipt`, cada una con su JSON schema en el que los campos que pueden faltar son nullable, y pusiste `tool_choice` en "any" después de que con "auto" Claude respondiera en prosa al 5% de los documentos soportados. Los fallos de parseo son ahora cero. Pero un 6% de los adjuntos no son ninguno de los tres: extractos de cuenta, avisos de pago, albaranes y algún folleto publicitario. Con esos, Claude sigue llamando a una de las tools, normalmente `extract_invoice`, y toma una referencia del extracto como `invoice_number` y el saldo de la cuenta como `total`. El mes pasado se contabilizaron 140 extractos como facturas a pagar. Cuentas a pagar quiere que esos adjuntos vayan a una cola manual, con personal para unos 600 elementos al día; el cargador del ERP solo acepta salida de tools y el buzón recibe 9.000 adjuntos al día.',
    ask: '¿Cuál es el cambio más eficaz?',
    options: [
      'Volver a poner `tool_choice` en "auto" e indicar a Claude que responda en texto plano cuando un adjunto no sea ninguno de los tres tipos, y enrutar cada respuesta de texto a la cola manual y cada tool call al cargador del ERP.',
      'Mantener "any" y añadir una regla al system prompt: si un adjunto no es ninguno de los tres tipos, llamar a `extract_invoice` con todos los campos a null, y hacer que el cargador del ERP ignore las facturas con todos los campos a null.',
      'Añadir una cuarta tool, `report_unsupported_document`, con un enum `document_type` (statement, remittance, delivery_note, other) más un string de detalle y un motivo, mantener "any" y enrutar sus llamadas a la cola manual.',
      'Añadir una comprobación en código que rechace toda extracción cuyo título de documento no sea "Factura", "Factura rectificativa" o "Recibo", y reenviar el adjunto con ese error de validación para que Claude elija una tool más adecuada.',
    ],
    why: [
      'Con "auto", en torno al 5% de los documentos soportados vuelven a llegar en prosa. Enrutados a la cola manual, suman unos 420 documentos válidos al día a los 540 no soportados, más de lo que la cola puede atender.',
      'Depende de una instrucción en el prompt para que la tool de factura signifique "no es una factura", y una factura toda a null es difícil de distinguir de una real con campos que faltan. El modelo sigue sin una forma válida de decir "ninguno de estos".',
      '"any" garantiza una tool call, pero obliga a Claude a elegir entre las tools que recibe. Una tool válida para "ninguno de estos", con un enum que incluye "other" y un string de detalle, elimina la presión para inventar y cada respuesta sigue siendo estructurada.',
      'Reintentar no puede funcionar, porque ninguna de las tres tools encaja con un extracto o un aviso de pago. La comprobación del título también es frágil: muchas facturas reales se titulan "Factura simplificada" o "Minuta", así que rechazaría documentos válidos.',
    ],
    rule: 'Con "any", da al modelo una tool válida para los documentos que no encajan en ningún schema de extracción.',
  },
  'x-extraction-erp-required-stays-nullable': {
    scenario:
      'Tu ERP rechaza cualquier factura de proveedor sin `cost_center`. El centro de coste viene impreso en un 60% de las facturas, las emitidas contra solicitudes internas; para el resto, los administrativos de cuentas a pagar lo buscan en el pedido de compra. Para cumplir el contrato del ERP, el equipo hizo `cost_center` un string obligatorio y no nullable en el schema de la tool de extracción. Los errores de carga en el ERP bajaron del 40% a cero, y las comprobaciones puntuales de los centros de coste impresos dan un 99% de precisión. Pero una auditoría de las facturas sin centro de coste impreso encontró un valor plausible en todos los registros: prefijos de números de pedido, nombres de departamento sacados de la dirección de entrega y, en el 9% de los casos, el código exacto de uno de los ejemplos few-shot del prompt. La interfaz del ERP es de otro equipo y no puede cambiar, y la extracción se ejecuta de forma síncrona sobre 3.000 facturas al día.',
    ask: '¿Qué cambio frena mejor los centros de coste inventados sin romper el contrato con el ERP?',
    options: [
      'Mantener `cost_center` obligatorio y añadir el formato de la empresa, `^CC-[0-9]{4}$`, como pattern en el schema, para que los valores construidos con prefijos de pedido o nombres de departamento fallen la validación y provoquen un reintento con ese error.',
      'Hacer `cost_center` nullable, indicar al modelo que devuelva null salvo que haya un centro de coste impreso y rellenar los null antes de cargar en el ERP con la búsqueda en el pedido o la cola de administrativos, para que el ERP siga recibiendo un valor.',
      'Mantener `cost_center` obligatorio y añadir una regla al prompt para copiarlo solo de una etiqueta impresa "Centro de coste" y no deducirlo nunca de otros campos, más un ejemplo few-shot de una factura con esa etiqueta en el pie.',
      'Quitar el campo del schema de extracción y hacer que los administrativos tecleen el centro de coste de todas las facturas antes de la carga, para que el modelo no pueda pasar nunca al ERP un centro de coste inventado.',
    ],
    why: [
      'Un pattern comprueba la forma, no la verdad: el código copiado del ejemplo few-shot ya cumple el formato. Y cuando no hay centro de coste impreso, los reintentos no pueden producirlo, porque el dato no está en el documento.',
      'Un campo obligatorio empuja al modelo a inventar un valor cuando el documento no lo tiene. Con nullable puede declarar la ausencia con honestidad, y la regla del ERP se sigue cumpliendo aguas abajo al rellenar esos null desde el pedido o la cola de administrativos.',
      'El schema sigue exigiendo un valor en cada factura, así que cuando no hay ninguno impreso el modelo tiene que poner algo. Una regla en el prompt no puede imponerse a un schema que no permite expresar la ausencia.',
      'Esto desperdicia el 60% de facturas en las que el centro de coste impreso se extrae con un 99% de precisión y pasa todo ese trabajo a los administrativos, cuando el problema son solo los documentos que no lo imprimen.',
    ],
    rule: 'Cumple los requisitos de los sistemas posteriores después de extraer; el schema debe admitir null si falta el dato.',
  },
  'x-extraction-conflict-flag-pattern': {
    scenario:
      'Tu extracción de facturas devuelve `stated_total`, `calculated_total` y un flag `conflict_detected`, y las facturas marcadas van a un revisor de cuentas a pagar. En los dos primeros meses los revisores descartaron como falsas alarmas el 64% de 5.200 flags, lo que empieza a minar la confianza en el flag, aunque el 36% restante detectó errores reales de proveedores por valor de 410.000 €. Cada flag lleva los dos totales y una `conflict_note` en texto libre del modelo, redactada distinta cada vez: "la línea de descuento podría explicar la diferencia", "¿los totales difieren por el IVA?", "redondeo". Quieres corregir el prompt o el validador para lo que cause la mayoría de los descartes, pero nadie sabe si vienen de unas pocas construcciones de factura recurrentes o están repartidos entre muchas. Los revisores solo registran aceptar o descartar, y su equipo ha dicho que no puede asumir más tareas de registro de datos.',
    ask: '¿Cuál es el cambio más eficaz para poder mejorar el flag de forma sistemática?',
    options: [
      'Indicar al modelo que active `conflict_detected` solo cuando esté muy seguro de que el proveedor se equivocó, y que deje el flag en false para cualquier diferencia que puedan explicar descuentos, impuestos o redondeos.',
      'Ampliar `conflict_note` a una explicación obligatoria más larga que cite las líneas exactas implicadas, para que los revisores juzguen cada flag más rápido y los analistas lean cada mes una muestra de notas descartadas.',
      'Pedir a los revisores que elijan un motivo de descarte de una lista cerrada cada vez que descartan un flag, y usar esos motivos para decidir qué construcciones de factura deben tratar primero el prompt y el validador.',
      'Añadir a cada flag un enum `detected_pattern` que nombre la construcción que causa la diferencia, como descuento por pronto pago, líneas con IVA incluido, redondeo u other con detalle, para agrupar los descartes por patrón.',
    ],
    why: [
      'Una instrucción vaga de confianza sacrifica detecciones reales junto con las falsas alarmas, y el 36% real vale 410.000 €. Además no dice nada sobre qué construcciones causan los descartes.',
      'El texto libre ayuda a un revisor con una factura, pero no se puede agregar de forma fiable porque la redacción cambia cada vez. Leer una muestra mensual es anecdótico, no un análisis sistemático de los patrones de descarte.',
      'Los motivos de descarte estructurados ayudarían, pero el equipo de revisión ha descartado más registro de datos. El modelo puede capturar la construcción en el momento de la extracción, sin coste para los revisores.',
      'Un campo de patrón estructurado, cruzado con el resultado de aceptar o descartar, muestra qué construcciones generan los descartes, así que puedes corregir las principales en el prompt o el validador y volver a medir, sin tocar el flujo de los revisores.',
    ],
    rule: 'Añade un campo estructurado detected_pattern para agrupar y corregir sistemáticamente los flags descartados.',
  },
  'x-extraction-keep-semantic-validators': {
    scenario:
      'Antes de pasar a tool use, tu pipeline pedía a Claude que "devolviera JSON" y lo pasaba por un módulo de validación de 900 líneas: un paso de reparación de JSON y reintentos de parseo para la salida mal formada, y después comprobaciones entre campos (que las líneas sumen el subtotal, que la fecha de vencimiento no sea anterior a la de emisión, que el NIF-IVA del comprador sea el tuyo). La salida mal formada afectaba al 1,8% de los documentos y los fallos entre campos al 2,6%. Dos semanas después de pasar a una tool `extract_invoice` con un JSON schema estricto, los fallos de parseo son cero, mientras que los fallos entre campos siguen en el 2,5%. Un tech lead propone borrar el módulo entero, argumentando que el cumplimiento del schema ya está garantizado y que el schema ya tipa todos los campos. El módulo añade 40 ms por documento, y el equipo además está migrando su sistema de logs este sprint.',
    ask: '¿Cómo deberías responder a la propuesta?',
    options: [
      'Borrar la reparación de JSON y los reintentos de parseo, código ya muerto con tool use, pero mantener las comprobaciones entre campos alimentando el bucle de reintentos, porque una salida válida según el schema puede tener totales que no suman.',
      'Aprobar el borrado, ya que el schema estricto garantiza ahora una salida tipada y completa, y confiar en los campos required y los tipos numéricos de la tool para detectar los errores que antes cazaban las comprobaciones entre campos.',
      'Mantener el módulo entero sin cambios, incluida la reparación de JSON y los reintentos de parseo, porque los schemas estrictos solo reducen la salida mal formada y las facturas largas aún pueden producir JSON roto que haya que reparar.',
      'Borrar el módulo después de codificar las reglas entre campos en el JSON schema con restricciones `minimum`, `pattern` y `enum`, para que la API rechace durante la generación los totales que no suman y los NIF-IVA erróneos.',
    ],
    why: [
      'Tool use con un schema estricto elimina los errores de sintaxis, así que la reparación es código muerto, pero no evita los errores semánticos. El 2,5% de fallos entre campos sigue ahí y necesita detección y un reintento con el error concreto.',
      'Los tipos y los campos obligatorios garantizan la estructura, no la corrección. La tasa de fallos entre campos apenas se movió, del 2,6% al 2,5%, lo que demuestra que esos errores sobreviven al cumplimiento del schema.',
      'La salida mal formada es justo lo que elimina tool use con un schema estricto, y los cero fallos de parseo lo confirman. Mantener el código de reparación es mantener una ruta para un fallo que ya no ocurre.',
      'Las palabras clave del schema validan cada campo por separado; no pueden expresar que las líneas sumen el subtotal. Un enum que fije el NIF-IVA del comprador solo forzaría tu propio NIF en la salida y ocultaría las partes intercambiadas en vez de detectarlas.',
    ],
    rule: 'Tool use elimina errores de sintaxis, no semánticos: mantén la validación entre campos tras el cambio.',
  },
  'x-extraction-batch-four-workloads': {
    scenario:
      'Tu plataforma de préstamos ejecuta cuatro cargas de extracción con Claude en la API síncrona, y finanzas quiere el 50% de descuento de la Message Batches API en todas. (1) Los solicitantes suben nóminas en la web y deben confirmar los campos extraídos antes de continuar, normalmente en 15 segundos. (2) Las solicitudes que envían los intermediarios necesitan los datos de ingresos extraídos en 4 horas según un acuerdo de servicio. (3) Tras un cambio de schema, hay que reextraer 220.000 expedientes archivados antes de una auditoría dentro de 10 días. (4) Un informe mensual de cartera reextrae las cláusulas de covenants de 8.000 contratos de préstamo durante el fin de semana. En un piloto, todos los batches terminaron en menos de 70 minutos, y los ingenieros proponen consultar el estado del batch cada minuto. Cada petición es una única llamada de extracción sin tools, y los resultados se emparejan por `custom_id`.',
    ask: '¿Qué plan consigue el ahorro sin poner en riesgo ningún compromiso de servicio?',
    options: [
      'Pasar las cuatro cargas a batches con polling cada minuto y un fallback que reenvíe la petición por la API síncrona si su batch no ha terminado antes del plazo de esa carga, para que todas obtengan el descuento.',
      'Pasar las cargas 2, 3 y 4 a batches, ya que el piloto muestra batches que terminan en una hora, muy dentro del acuerdo de 4 horas, y dejar solo la confirmación interactiva de nóminas en la API síncrona.',
      'Pasar la reextracción del archivo y el informe mensual a batches, y dejar síncronas la confirmación de nóminas y la carga de intermediarios con plazo de 4 horas, porque un batch puede tardar hasta 24 horas sin SLA de latencia.',
      'Mantener las cuatro cargas en la API síncrona, porque los resultados de un batch pueden volver en un orden distinto al de las peticiones, y reasignar 220.000 resultados a sus expedientes pondría en riesgo la auditoría.',
    ],
    why: [
      'Un fallback para trabajo bloqueante añade complejidad y aun así hace esperar primero al batch; una interacción de 15 segundos no puede absorber eso. Asignar a cada carga la API adecuada es más simple y cumple todos los compromisos.',
      'Los tiempos del piloto no son una garantía: la API de batches tiene una ventana de procesamiento de hasta 24 horas y ningún SLA de latencia, así que un compromiso contractual de 4 horas no puede depender de lo rápido que terminaron los batches.',
      'Solo las cargas que toleran espera van a batches: la reextracción a 10 días y el informe de fin de semana caben en una ventana de 24 horas. La confirmación interactiva y el acuerdo de 4 horas necesitan llamadas síncronas.',
      'El orden de los resultados no es motivo para evitar los batches: el escenario ya empareja los resultados por `custom_id`, que asocia cada respuesta con su petición sea cual sea el orden en que vuelvan.',
    ],
    rule: 'Usa batches solo para trabajo que tolera espera; un piloto rápido no es un SLA de latencia.',
  },
  'x-extraction-automate-by-type-and-field': {
    scenario:
      'La dirección quiere dejar de revisar a mano toda extracción con confianza superior a 0,9, citando un 98,6% de precisión por campo para esas extracciones en un conjunto etiquetado de 4.000 documentos, frente a un objetivo del 98%. Desglosaste esos resultados de alta confianza. Las declaraciones de aduanas llegan al 99,5% en todos los campos. Las facturas llegan al 99,3% en conjunto, pero `tax_amount` en facturas con más de un tipo de IVA, un 12% de las facturas, está en el 93%. Los albaranes llegan al 99% salvo `received_quantity` manuscrita, que está en el 88%. Los revisores dedican el 60% de su tiempo a facturas, el equipo tiene seis revisores y el director financiero ha dicho que el objetivo se aplica a cada campo que alimenta pagos, incluidos `tax_amount` y `received_quantity`.',
    ask: '¿Qué plan reduce mejor la carga de revisión manteniendo cada campo de pago en el objetivo?',
    options: [
      'Dejar de revisar las extracciones de alta confianza en todas partes, ya que el 98,6% global supera el objetivo del 98%, y añadir una muestra aleatoria semanal de documentos aprobados automáticamente para confirmar que la precisión se mantiene.',
      'Automatizar por completo las declaraciones de aduanas y las facturas, ya que ambos tipos de documento superan el objetivo en conjunto, y seguir revisando todos los albaranes hasta que las cantidades manuscritas lleguen al objetivo.',
      'Automatizar todo lo que supere 0,9 y confiar en un stratified random sampling de las extracciones aprobadas, por tipo de documento y campo, para confirmar dónde fallan el IVA con varios tipos y las cantidades manuscritas y reactivar ahí la revisión.',
      'Aprobar automáticamente los segmentos que cumplen el objetivo, mantener la revisión de `tax_amount` con varios tipos de IVA y de `received_quantity` manuscrita, y aplicar stratified random sampling a los segmentos aprobados automáticamente.',
    ],
    why: [
      'La media del 98,6% oculta dos campos de pago muy por debajo del objetivo: `tax_amount` con varios tipos al 93% y `received_quantity` manuscrita al 88%. Una muestra uniforme de documentos además rara vez los sacaría a la luz.',
      'Dividir solo por tipo de documento pasa por alto la debilidad por campo dentro de las facturas: `tax_amount` con varios tipos está al 93%, así que automatizar todas las facturas dejaría pasar esos errores de pago.',
      'El muestreo mide tasas de error; no sustituye a la revisión donde ya sabes que la precisión está por debajo del objetivo. Los dos segmentos débiles enviarían errores de pago mientras la muestra confirma lo que el desglose ya muestra.',
      'La precisión está verificada por tipo de documento y campo, así que la revisión se quita justo donde cada segmento cumple el listón. Mantenerla en los dos segmentos débiles protege los pagos, y el muestreo estratificado detecta patrones de error nuevos.',
    ],
    rule: 'Reduce la revisión segmento a segmento (tipo de documento y campo), nunca por la media agregada.',
  },
  'x-extraction-field-level-routing': {
    scenario:
      'Tu extracción de contratos de préstamo rellena 42 campos por documento y devuelve una única puntuación global `confidence` por documento. Los documentos por debajo de 0,85 van a revisión, donde hay que volver a comprobar los 42 campos; los revisores procesan 260 documentos al día y la cola no deja de crecer. Las auditorías muestran dos problemas: la mayoría de los campos de los documentos enviados a revisión ya eran correctos, y el 70% de los errores que llegaron a producción estaban en documentos con puntuación superior a 0,9, cada uno con un campo crítico erróneo, normalmente `interest_rate_margin` o `first_payment_date`, entre 41 correctos. Hay un conjunto de validación etiquetado de 1.500 contratos del despliegue inicial. Los documentos tienen entre 30 y 120 páginas, y el equipo acaba de pasar a un modelo con una ventana de contexto mayor.',
    ask: '¿Qué cambio mejoraría más hacia dónde se dirige la atención de los revisores?',
    options: [
      'Subir el umbral de enrutado a 0,92 para que lleguen a revisión más documentos que esconden un campo crítico erróneo, y pedir a los revisores que comprueben primero los campos críticos siempre que abran un documento enviado a revisión.',
      'Hacer que el modelo devuelva una puntuación de confianza por campo, calibrar un umbral de revisión para cada campo con el conjunto de validación etiquetado y enviar a revisión solo los campos por debajo del umbral, no documentos enteros.',
      'Calibrar la puntuación por documento con el conjunto de validación etiquetado por separado para cada plantilla de contrato, de modo que cada plantilla tenga un umbral de enrutado que refleje con qué frecuencia contiene errores de verdad.',
      'Añadir una segunda pasada en la misma conversación en la que el modelo revise su propia extracción y baje la puntuación del documento cuando encuentre un campo del que no esté seguro, antes de decidir el enrutado.',
    ],
    why: [
      'Un campo erróneo entre 41 correctos apenas mueve una puntuación por documento, así que un umbral más alto sobre todo añade a una cola ya saturada documentos enteros que ya son correctos.',
      'Las puntuaciones por campo calibradas señalan los valores concretos con probabilidad de error, como el margen o la fecha del primer pago, así que los revisores comprueban unos pocos campos en vez de 42 y se cazan los campos erróneos con alta confianza.',
      'La calibración por plantilla hace la puntuación más honesta de media, pero sigue siendo un número por documento: un documento con un campo crítico erróneo sigue pareciendo bueno, y los revisores siguen comprobando los 42 campos.',
      'Un modelo que revisa su propia salida en la misma sesión conserva su razonamiento previo y es poco probable que lo cuestione, y el resultado sigue reduciéndose a una puntuación por documento que oculta qué campo está mal.',
    ],
    rule: 'Enruta la revisión con confianza por campo calibrada, no con una sola puntuación por documento.',
  },
};
