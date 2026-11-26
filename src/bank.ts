// Todo el banco junto: las preguntas de una respuesta y las de respuesta múltiple ("select 2"),
// que el examen real también tiene (guía v1.0). Las de respuesta múltiple van en ficheros aparte
// para que los simulacros fijos 1–4, sacados de QUESTIONS, no cambien. Por lo mismo van aparte los
// temas que quien hizo el examen echó en falta (questions-reported.ts).
import type { Question, QuestionText } from './game.ts';
import { QUESTIONS } from './questions.ts';
import { QUESTIONS_ES } from './questions-es.ts';
import { EXAM_LEVEL } from './questions-exam.ts';
import { EXAM_LEVEL_ES } from './questions-exam-es.ts';
import { EXAM_LEVEL_MULTI, EXAM_LEVEL_MULTI_ES } from './questions-exam-multi.ts';
import { MULTI, MULTI_ES } from './questions-multi.ts';
import { REPORTED, REPORTED_ES } from './questions-reported.ts';
import { CALIBRATION_A, CALIBRATION_B, CALIBRATION_ES } from './questions-calibration.ts';

/** Rondas, repaso y simulacros aleatorio y rápido. */
export const BANK = [...QUESTIONS, ...MULTI, ...REPORTED];

/** El simulacro nivel real completo: las 66 (60 largas y 6 de "elige 2"). También el repaso y la búsqueda por id. */
export const LEVEL_BANK = [...EXAM_LEVEL, ...EXAM_LEVEL_MULTI];

/**
 * Las que no entran en el simulacro nivel real de 60 en 2 h: una larga por escenario, elegidas
 * para que el reparto por dominio quede como en la guía (16/11/12/12/9).
 */
const OUT_OF_60 = new Set([
  'x-support-midprocess-handoff',
  'x-codegen-explore-in-plan-migration',
  'x-research-targeted-refinement',
  'x-devprod-tests-for-decorator',
  'x-ci-disable-by-rate-not-volume',
  'x-extraction-field-level-routing',
]);

/** El simulacro nivel real de 60 preguntas en 2 h, como el examen: 54 largas y las 6 de "elige 2". */
export const LEVEL_BANK_60 = LEVEL_BANK.filter((q) => !OUT_OF_60.has(q.id));

/**
 * Las dos tandas de calibración (ver calibration.ts), por etiqueta. No entran en BANK ni en LEVEL_BANK:
 * ni rondas, ni repaso, ni otros simulacros, para que sigan siendo nuevas el día que se hacen.
 */
export const CALIBRATION: Record<string, Question[]> = { 'calibration A': CALIBRATION_A, 'calibration B': CALIBRATION_B };

export const BANK_ES: Record<string, QuestionText> = { ...QUESTIONS_ES, ...EXAM_LEVEL_ES, ...MULTI_ES, ...EXAM_LEVEL_MULTI_ES, ...REPORTED_ES, ...CALIBRATION_ES };
