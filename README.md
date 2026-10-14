# CCA Quest

App Android para preparar el examen **Claude Certified Architect – Foundations** (CCAR-F) de Anthropic
jugando un rato cada día. Preguntas en inglés, como el examen; la teoría, también en español.

Con pinta de terminal (JetBrains Mono, verde fósforo sobre negro) y cinco pestañas como comandos:

- **`play`**: rondas de 5 preguntas de escenario al estilo de las de muestra de la guía oficial. Cada una
  se enmarca en uno de los 6 escenarios del examen y practica un *task statement* concreto (1.1 – 5.6).
  Al responder, cada opción dice por qué es buena o mala, y queda una regla para recordar. Al acabar
  la ronda se ven las falladas (tu respuesta, la buena y el porqué), y en el inicio queda una lista de
  todas las que fallaste la última vez para repasarlas cuando quieras.
  En el inicio, una lista `todo` dice qué toca hoy (ronda, siguiente lección, fichas pendientes) y un
  mapa de actividad de 16 semanas, estilo GitHub, enseña la constancia.
- **Simulacros** (`$ cca-quest exam --mock`), como el examen real: 60 preguntas en 2 horas, 4 de los 6
  escenarios con 15 preguntas cada uno y sin correcciones hasta entregar. Hay 4 fijos (Exam 1–4, para
  repetirlos y ver si mejoras; cada uno respeta los pesos por dominio y entre ellos casi no se repiten
  preguntas), uno aleatorio de 60 y uno rápido de 20. Se pueden pausar y retomar con el reloj parado. Al
  final, nota por dominio, repaso de los fallos e historial de intentos.
- **Simulacro nivel real**: 60 preguntas largas como las del examen (los 6 escenarios, 10 de cada uno).
  Quien ya aprobó cuenta que el examen real no es más difícil en conceptos, sino más largo de leer: un
  simulacro de 60 preguntas cortas se hace en una hora y el real deja 15 minutos de margen. Estas tienen
  el doble de lectura, datos que no importan y dos opciones defendibles que solo desempata un detalle del
  enunciado. No salen en las rondas diarias hasta que haces el simulacro; las que falles, sí vuelven.
- **`learn`**: una lección por *task statement* (30), como una página de `man`: resumen, ideas clave,
  trampas típicas del examen y un ejemplo. Desde cada una se practican sus preguntas.
- **`cards`**: 140 fichas para girar y puntuarse uno mismo, con repetición espaciada.
- **`grep`**: glosario de 68 términos del examen con buscador y filtro por dominio.
- **`config`**: hora del recordatorio, idioma de la teoría y reinicio del progreso.

La teoría (lecciones, fichas y glosario) está en inglés y en español de España, con un botón `[EN|ES]`.
Las preguntas van siempre en inglés, como el examen.

- **Repetición espaciada**: lo fallado vuelve al día siguiente; lo acertado a los 3, 7 y 16 días.
- **Juego**: XP, combos, niveles (de `prompt_rookie` a `certified_legend`), racha diaria con meta de 5
  preguntas, vibración y una lluvia de caracteres al subir de nivel o hacer una ronda perfecta.
- **Avisos**: recordatorio diario a la hora elegida y un último aviso a las 22:00 si la racha está en
  peligro. Son notificaciones locales; desaparecen en cuanto se cumple la meta del día.

El banco ([src/questions.ts](src/questions.ts)) tiene 253 preguntas (42 por escenario) que cubren los 30 *task statements*
de la guía (v1.0, julio 2026). Las preguntas oficiales no son públicas: estas imitan su formato
(evidencia de producción → "most effective…", 4 opciones con trampas plausibles) sin copiarlas.
Las 60 de nivel real están aparte, en [src/questions-exam.ts](src/questions-exam.ts), para que los simulacros
1–4 no cambien. Lecciones, fichas y glosario están en [src/lessons.ts](src/lessons.ts), [src/flashcards.ts](src/flashcards.ts)
y [src/glossary.ts](src/glossary.ts).

## Desarrollo

```bash
npm test            # lógica del juego, calidad del banco y contenido completo en los dos idiomas
npx tsc --noEmit
npx expo lint
npm run web         # probar en el navegador (sin avisos ni vibración)
```

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
de la empresa. Expo compila en la nube, así que no hace falta Mac. La primera vez, desde la raíz del repo:

```bash
npx eas-cli@latest login   # cuenta de Expo (gratis)
npx testflight             # pide el Apple ID y el 2FA, crea los certificados, compila y sube a TestFlight
```

Las siguientes versiones son solo `npx testflight`: el número de build lo lleva EAS (`eas.json`). En
App Store Connect, un grupo externo de TestFlight con enlace público permite repartirla con un enlace;
Apple revisa la primera build de cada versión. Las builds de TestFlight caducan a los 90 días.

En iPhone no aparece el aviso de versión nueva: eso es del APK de Android, y allí actualiza TestFlight.
El icono de iOS es `assets/icon-ios.png`, el mismo sin canal alfa, porque Apple no acepta transparencia.
