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

/** El simulacro nivel examen. */
export const LEVEL_BANK = [...EXAM_LEVEL, ...EXAM_LEVEL_MULTI];

export const BANK_ES: Record<string, QuestionText> = { ...QUESTIONS_ES, ...EXAM_LEVEL_ES, ...MULTI_ES, ...EXAM_LEVEL_MULTI_ES };
