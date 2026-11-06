// Todo el banco junto: las preguntas de una respuesta y las de respuesta múltiple ("select 2"),
// que el examen real también tiene (guía v1.0). Las de respuesta múltiple van en ficheros aparte
// para que los simulacros fijos 1–4, sacados de QUESTIONS, no cambien.
import type { QuestionText } from './game.ts';
import { QUESTIONS } from './questions.ts';
import { QUESTIONS_ES } from './questions-es.ts';
import { EXAM_LEVEL } from './questions-exam.ts';
import { EXAM_LEVEL_ES } from './questions-exam-es.ts';
import { EXAM_LEVEL_MULTI, EXAM_LEVEL_MULTI_ES } from './questions-exam-multi.ts';
import { MULTI, MULTI_ES } from './questions-multi.ts';

/** Rondas, repaso y simulacros aleatorio y rápido. */
export const BANK = [...QUESTIONS, ...MULTI];

/**
 * Una pregunta larga por escenario que se retiró del simulacro nivel real al pasar a 60 preguntas
 * en 2 h. Siguen en el banco para que quien ya las vio las repase.
 */
const RETIRED_LEVEL_IDS = new Set([
  'x-support-midprocess-handoff',
  'x-codegen-explore-in-plan-migration',
  'x-research-targeted-refinement',
  'x-devprod-tests-for-decorator',
  'x-ci-disable-by-rate-not-volume',
  'x-extraction-field-level-routing',
]);

/** Todas las de nivel examen (66): para buscar por id y para el repaso. */
export const LEVEL_POOL = [...EXAM_LEVEL, ...EXAM_LEVEL_MULTI];

/** El simulacro nivel examen: 60 preguntas (54 largas y las 6 de "elige 2"). */
export const LEVEL_BANK = [...EXAM_LEVEL.filter((q) => !RETIRED_LEVEL_IDS.has(q.id)), ...EXAM_LEVEL_MULTI];

export const BANK_ES: Record<string, QuestionText> = { ...QUESTIONS_ES, ...EXAM_LEVEL_ES, ...MULTI_ES, ...EXAM_LEVEL_MULTI_ES };
