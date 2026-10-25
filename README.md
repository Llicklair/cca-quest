# CCA Quest

App Android para preparar el examen **Claude Certified Architect – Foundations** (CCAR-F) de Anthropic
jugando un rato cada día. Preguntas en inglés, como el examen; la teoría, también en español.

Con pinta de terminal (JetBrains Mono, verde fósforo sobre negro) y cinco pestañas como comandos:

- **`play`**: rondas de 5 preguntas de escenario al estilo de las de muestra de la guía oficial. Cada una
  se enmarca en uno de los 6 escenarios del examen y practica un *task statement* concreto (1.1 – 5.6).
  Al responder, cada opción dice por qué es buena o mala, y queda una regla para recordar. Al acabar
  la ronda se ven las falladas (tu respuesta, la buena y el porqué), y en el inicio queda una lista de
  todas las que fallaste la última vez para repasarlas cuando quieras. Al final del inicio está la
  [clasificación](#clasificación): el nivel y el progreso de todos los que se unen.
  En el inicio, una lista `todo` dice qué toca hoy (ronda, siguiente lección, fichas pendientes) y un
  mapa de actividad de 16 semanas, estilo GitHub, enseña la constancia.
- **Simulacros** (`$ cca-quest exam --mock`), como el examen real: 60 preguntas en 2 horas, 4 de los 6
  escenarios con 15 preguntas cada uno y sin correcciones hasta entregar. Hay 4 fijos (Exam 1–4, para
  repetirlos y ver si mejoras; cada uno respeta los pesos por dominio y entre ellos casi no se repiten
  preguntas), uno aleatorio de 60 y uno rápido de 20 (estos dos sacan primero las que aún no has
  acertado). Se pueden pausar y retomar con el reloj parado. Al
  final, nota por dominio, repaso de los fallos e historial de intentos.
- **Simulacro nivel real**: 66 preguntas largas como las del examen (los 6 escenarios, 11 de cada uno,
  una de ellas de "elige 2").
  Quien ya aprobó cuenta que el examen real no es más difícil en conceptos, sino más largo de leer: un
  simulacro de 60 preguntas cortas se hace en una hora y el real deja 15 minutos de margen. Estas tienen
  el doble de lectura, datos que no importan y dos opciones defendibles que solo desempata un detalle del
  enunciado. No salen en las rondas diarias hasta que haces el simulacro; las que falles, sí vuelven.
- **Quiz en grupo** (`$ cca-quest live`), estilo Kahoot!: una pantalla presenta las preguntas y cada uno
  contesta desde su móvil. Ver [Quiz en grupo](#quiz-en-grupo).
- **✦ ask claude**: el mismo botón en toda la app lleva a Claude lo que estás estudiando para que te
  lo explique con palabras sencillas. En una pregunta sin contestar (rondas y simulacros) explica el
  escenario y los conceptos sin decir cuál es la buena; ya contestada (rondas, fallos y repaso del
  simulacro), por qué la buena es la buena y las otras no. En el quiz en grupo no sale. En lecciones, fichas y
  glosario explica el concepto con un ejemplo y cómo sale en el examen. En la web abre claude.ai con
  el prompt escrito (y lo copia, por si se abre vacío); en el móvil abre el menú de compartir.
- **`learn`**: una lección por *task statement* (30), como una página de `man`: resumen, ideas clave,
  trampas típicas del examen y un ejemplo. Desde cada una se practican sus preguntas. Para que se entienda
  a cualquier nivel, cada lección trae además una analogía cotidiana ("dicho sencillo"), un diagrama que
  se recorre paso a paso o una comparación de dos enfoques con pestañas ("míralo"), y un ejercicio de
  clasificar casos, de fácil a difícil, con corrección al momento ("pruébalo"). Los términos del glosario
  se pueden tocar dentro de la lección para ver su definición.
- **`cards`**: 140 fichas para girar y puntuarse uno mismo, con repetición espaciada.
- **`grep`**: glosario de 68 términos del examen con buscador y filtro por dominio.
- **`config`**: hora del recordatorio, idioma de la teoría y reinicio del progreso.

La teoría (lecciones, fichas y glosario) está en inglés y en español de España, con un botón `[EN|ES]`.
Las preguntas van siempre en inglés, como el examen.

- **Repetición espaciada**: lo fallado vuelve al día siguiente; lo acertado a los 3, 7 y 16 días, pero
  solo cuando ya has visto todo el banco: mientras queden preguntas nuevas, las rondas no repiten aciertos.
- **Juego**: XP, combos, niveles (de `prompt_rookie` a `certified_legend`), racha diaria con meta de 5
  preguntas, vibración y una lluvia de caracteres al subir de nivel o hacer una ronda perfecta.
- **Avisos**: recordatorio diario a la hora elegida y un último aviso a las 22:00 si la racha está en
  peligro. Son notificaciones locales; desaparecen en cuanto se cumple la meta del día.

El banco ([src/questions.ts](src/questions.ts)) tiene 253 preguntas (42 por escenario) que cubren los 30 *task statements*
de la guía (v1.0, julio 2026). Las preguntas oficiales no son públicas: estas imitan su formato
(evidencia de producción → "most effective…", 4 opciones con trampas plausibles) sin copiarlas.
Las 60 de nivel real están aparte, en [src/questions-exam.ts](src/questions-exam.ts), para que los simulacros
1–4 no cambien.

La guía v1.0 dice que el examen tiene preguntas de una respuesta y de **respuesta múltiple** ("each item
states how many responses to select"). Por eso hay 18 de "elige 2", con 5 opciones y 2 buenas: 12 cortas
(2 por escenario, [src/questions-multi.ts](src/questions-multi.ts)) que entran en las rondas, el repaso y los
simulacros aleatorio y rápido, y 6 largas (una por escenario, [src/questions-exam-multi.ts](src/questions-exam-multi.ts))
dentro del simulacro nivel real, que pasa a 66 preguntas. Solo cuenta acertar las dos, sin puntos parciales.
Los simulacros fijos 1–4 siguen siendo solo de una respuesta para que las notas se puedan comparar
([src/bank.ts](src/bank.ts) junta todo).

Lecciones, fichas y glosario están en [src/lessons.ts](src/lessons.ts), [src/flashcards.ts](src/flashcards.ts)
y [src/glossary.ts](src/glossary.ts), y los extras de cada lección en [src/extras.ts](src/extras.ts).

## Desarrollo

```bash
npm test            # lógica del juego, calidad del banco y contenido completo en los dos idiomas
npx tsc --noEmit
npx expo lint
npm run web         # probar en el navegador (sin avisos ni vibración)
```

## Sincronizar móvil y PC

Como WhatsApp Web: en el PC se abre la versión web, **https://llicklair.github.io/cca-quest/**, y en
ajustes → sincronizar → vincular un móvil enseña un QR; el móvil lo escanea (o se teclea el código) y
desde entonces los dos comparten el progreso. Sincroniza al abrir la app, al volver a ella, cada 15 s
y a los 3 s de cada cambio. Se junta pregunta a pregunta, así que no se pierde nada aunque se estudie
en los dos sin conexión (la XP se queda con la mayor de las dos); los avisos son de cada dispositivo.
Borrar el progreso también desvincula ese dispositivo, para que no vuelva al sincronizar.

Cada persona tiene su propio canal con una clave aleatoria de 128 bits que solo conocen sus
dispositivos: sin cuentas, y no se pueden listar canales. La lógica está en [src/sync.ts](src/sync.ts)
y [src/merge.ts](src/merge.ts).

El servidor es un proyecto gratuito de Supabase con [supabase/sync.sql](supabase/sync.sql) pegado en
el SQL Editor: una tabla con RLS y sin políticas, a la que solo se llega con tres funciones RPC que
piden la clave exacta. La URL y la clave publicable están en [src/sync.ts](src/sync.ts): están
hechas para ir dentro de apps públicas. Un proyecto gratuito se pausa tras 7 días sin uso; se
reactiva desde el panel de Supabase sin perder datos.

Para probar con otro servidor, `.env.local` (no se sube) cambia los dos valores. `npm run sync-server`
imita las funciones de Supabase en local, en el puerto 8787:

```bash
EXPO_PUBLIC_SYNC_URL=http://localhost:8787
```

Una APK de prueba con otro servidor se lanza a mano con los parámetros `sync_url` y `sync_key` del
workflow de la APK; así no se publica release.

## Quiz en grupo

Para las sesiones de estudio en llamada. Quien presenta abre `$ cca-quest live` → presentar en la
pantalla que comparte (mejor la web en el PC), elige preguntas (nivel examen o banco base), cuántas
(5, 10 o 15) y el tiempo de cada una (60–180 s). Sale un código de sala de 5 letras y un QR que abre
la web con `?quiz=CÓDIGO`; cada jugador entra desde el móvil con su nombre, en la app o en la web.

- Todos ven la misma pregunta con las opciones en el mismo orden, así que "la B" es la B para todos.
  Cada uno la lee en su idioma.
- Puntos como en Kahoot!: 1000 por acertar al instante, 500 en el último segundo y 0 al fallar.
- Se corrige al acabarse el tiempo, en cuanto contestan todos o con "corregir ya". Al corregir se ve
  cuántos eligieron cada opción, el porqué de cada una y la clasificación; el presentador pasa a la
  siguiente cuando acaba la discusión.
- Quien recarga la página o se cae vuelve a entrar con sus puntos.
- Sin "pregúntale a Claude", ni siquiera al corregir: el porqué se discute en la llamada.
- Al acabar, cada jugador gana XP en su progreso: la de una ronda por cada respuesta, más 30, 20 o
  10 por el podio. No toca las preguntas ni la racha. El presentador no juega desde su pantalla (todos
  verían su respuesta); si quiere jugar, entra también desde el móvil.
- Cada partida se suma a la clasificación del quiz (puntos, partidas y victorias), al final del
  inicio. La escribe el presentador al acabar, y la vuelve a leer para comprobar que quedó.

Va por Supabase Realtime en el mismo proyecto que la sincronización (broadcast para los mensajes y
presence para saber quién está), sin tablas: la partida vive en la pantalla del presentador. La
lógica está en [src/live.ts](src/live.ts), el canal en [src/room.ts](src/room.ts) y las pantallas en
[src/screens/live.tsx](src/screens/live.tsx).

## Clasificación

Al final de la pantalla de inicio (`play`) se ve, de quien se une, nombre, nivel, XP, racha, preparación y preguntas vistas
(nada de preguntas concretas ni respuestas), y debajo la clasificación del quiz en grupo. Unirse es
opcional y se puede ocultar en cualquier momento. Se refresca cada 15 s mientras estás en el
inicio, y tu fila se publica unos segundos después de cada cambio de tu progreso.

El perfil (id, nombre y si sales) va dentro del progreso, así que viaja con la sincronización y el
móvil y el PC vinculados cuentan como una sola persona. Es el mismo con el que juegas al quiz.

Las dos clasificaciones son documentos en claves fijas del almacén de sync.sql (que solo acepta claves
`c-<32 hex>`), sin tocar el SQL. Cada uno escribe solo su fila; si dos escriben a la vez y una se
pierde, quien la perdió la vuelve a poner al comprobarla. Como las claves son públicas igual que la
app, todo lo que se lee pasa por un lector que descarta lo que no tenga la forma esperada. La lógica
está en [src/rank.ts](src/rank.ts) y los paneles en [src/screens/rank.tsx](src/screens/rank.tsx).

## Web

La compila y publica GitHub Actions en GitHub Pages en cada push a `main`
([.github/workflows/web.yml](.github/workflows/web.yml)). `experiments.baseUrl` en `app.json` hace
que los recursos se pidan bajo `/cca-quest/`.

### Contra las trampas

Para que no se pueda pasar una pregunta a una IA, en la web:

- **No se copia el texto**: no se puede seleccionar, copiar ni cortar, no sale el menú del botón
  derecho y al imprimir (o guardar como PDF) sale en blanco. Los campos de texto sí, para poder
  escribir y pegar el código de sala.
- **Capturas**: una web no puede impedirlas, pero sí tapar la pregunta antes. Mientras hay una pregunta
  sin contestar (una ronda, un simulacro sin entregar o el quiz en grupo en el móvil del jugador) la
  pantalla se pone en negro si la ventana pierde el foco (la herramienta de recortes, otra ventana),
  mientras se pulsa Win/Cmd (por donde empiezan Win+Shift+S y Cmd+Shift+3/4/5) y, tras un atajo de
  captura (Impr Pant, Win/Cmd+Shift, Ctrl+Shift+S de Edge y Firefox), hasta que se toca. Con Impr Pant
  además se vacía el portapapeles. La pantalla del presentador no se tapa: es la que se comparte.

No para una foto con otro móvil ni las capturas del propio móvil, y las respuestas están en el código,
que es público: es un freno, no un candado. La lógica está en [src/guard.ts](src/guard.ts) y la
pantalla negra en [src/shield.tsx](src/shield.tsx).

## Generar el APK

Lo compila GitHub Actions en cada push a `main` ([.github/workflows/apk.yml](.github/workflows/apk.yml)),
sin cuenta de Expo ni Android Studio. Para bajarlo:

```bash
npm run apk          # descarga el APK de la última compilación a dist/
```

Se instala abriendo el `.apk` en el móvil (permitir "instalar apps de origen desconocido") y aceptando
las notificaciones la primera vez. Las versiones nuevas se instalan encima y conservan el progreso.

## iPhone (TestFlight)

En iPhone no se puede instalar desde un archivo: va por TestFlight, con la cuenta de Apple Developer
de la empresa (bundle ID `com.theagilemonkeys.ccaquest`). Lo compila GitHub Actions en un runner de
macOS en cada push a `main` ([.github/workflows/ios.yml](.github/workflows/ios.yml)), sin Mac ni cuenta
de Expo: `expo prebuild`, firma manual del target de la app y subida a TestFlight con la clave de la
API de App Store Connect. El número de build es el de la ejecución del workflow.

Usa estos secretos del repo, creados con la clave de API: `ASC_KEY_P8`, `ASC_KEY_ID` y `ASC_ISSUER_ID`
(la clave), y `IOS_DIST_P12`, `IOS_DIST_P12_PASSWORD` e `IOS_PROFILE` (el certificado "Apple
Distribution" y el perfil "CCA Quest App Store", que caducan en octubre de 2027). Se reparte con un
grupo externo de TestFlight con enlace público; Apple revisa la primera build de cada versión, y las
builds caducan a los 90 días.

En iPhone no aparece el aviso de versión nueva: eso es del APK de Android, y allí actualiza TestFlight.
El icono de iOS es `assets/icon-ios.png`, el mismo sin canal alfa, porque Apple no acepta transparencia.
