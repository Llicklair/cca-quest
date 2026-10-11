# CCA Quest

App Android para preparar el examen **Claude Certified Architect – Foundations** (CCAR-F) de Anthropic
jugando un rato cada día. En inglés, como el examen.

- **Rondas de 5 preguntas de escenario**, al estilo de las de muestra de la guía oficial: cada una se
  enmarca en uno de los 6 escenarios del examen y practica un *task statement* concreto (1.1 – 5.6).
  Al responder, cada opción dice por qué es buena o mala, y queda una regla para recordar.
- **Repetición espaciada**: las falladas vuelven al día siguiente; las acertadas a los 3, 7 y 16 días.
- **Juego**: XP, combos por aciertos seguidos, niveles (de *Prompt Rookie* a *Certified Legend*),
  racha diaria con meta de 5 preguntas, vibración y confeti.
- **Avisos**: recordatorio diario a la hora elegida y un último aviso a las 22:00 si la racha está en
  peligro. Son notificaciones locales; desaparecen en cuanto se cumple la meta del día.
- **Dominio por área**, ponderado con los pesos del examen (27/18/20/20/15).

El banco ([src/questions.ts](src/questions.ts)) tiene 92 preguntas que cubren los 30 *task statements*
de la guía (v1.0, julio 2026). Las preguntas oficiales no son públicas: estas imitan su formato
(evidencia de producción → "most effective…", 4 opciones con trampas plausibles) sin copiarlas.

## Desarrollo

```bash
npm test            # lógica del juego + calidad del banco (reparto por dominio, que la longitud no delate la buena…)
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
