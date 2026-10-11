// Qué recordatorios dejar programados. Se recalcula al abrir la app y al terminar
// cada ronda: así el de hoy desaparece en cuanto se cumple la meta, y si la app no
// se abre en días, siguen llegando avisos hasta HORIZON días.
import { GOAL, addDays, at, dayKey, dueCount, goalDone, liveStreak, type Progress, type Question } from './game.ts';

export type Reminder = { at: Date; title: string; body: string };

export const HORIZON = 14;
const RISK = { hour: 22, minute: 0 }; // último aviso del día para no perder la racha

const NUDGES = {
  en: [
    'Five questions, ten minutes. The architect doesn’t skip a day.',
    'Your subagents are waiting for orders. Quick round?',
    'Can you hit a 5-answer combo today?',
    'One round now beats three hours on Sunday.',
    'Distractors are getting cocky. Go put them in their place.',
    'Tiny round, big streak. Let’s go.',
  ],
  es: [
    'Cinco preguntas, diez minutos. Un arquitecto no se salta un día.',
    'Tus subagentes esperan órdenes. ¿Una ronda rápida?',
    '¿Te ves capaz de un combo de 5 aciertos hoy?',
    'Una ronda ahora vale más que tres horas el domingo.',
    'Las opciones trampa se están creciendo. Ponlas en su sitio.',
    'Ronda pequeña, racha grande. Vamos.',
  ],
};

const TEXT = {
  en: {
    day: (n: number) => `🔥 Day ${n} is waiting`,
    rematch: (n: number) => `🧠 ${n} question${n === 1 ? '' : 's'} want a rematch`,
    ready: '🏗️ Your daily round is ready',
    risk: (n: number) => `⚠️ Your ${n}-day streak ends at midnight`,
    riskBody: (n: number) => `${n} questions keep the flame alive.`,
    last: '⚠️ Last call for today',
    lastBody: 'One quick round before midnight keeps the flame burning.',
  },
  es: {
    day: (n: number) => `🔥 Te espera el día ${n}`,
    rematch: (n: number) => `🧠 ${n} pregunta${n === 1 ? '' : 's'} quiere${n === 1 ? '' : 'n'} la revancha`,
    ready: '🏗️ Tu ronda diaria está lista',
    risk: (n: number) => `⚠️ Tu racha de ${n} días acaba a medianoche`,
    riskBody: (n: number) => `${n} preguntas mantienen viva la llama.`,
    last: '⚠️ Último aviso de hoy',
    lastBody: 'Una ronda rápida antes de medianoche mantiene la llama.',
  },
};

export function plan(qs: Question[], p: Progress, now: Date, days = HORIZON): Reminder[] {
  if (!p.reminder.on) return [];
  const today = dayKey(now);
  const streak = liveStreak(p, today);
  const t = TEXT[p.lang ?? 'en'];
  const nudges = NUDGES[p.lang ?? 'en'];
  const out: Reminder[] = [];

  for (let i = 0; i < days; i++) {
    const day = addDays(today, i);
    if (day === today && goalDone(p, today)) continue;
    const due = dueCount(qs, p, day);

    const nudge = at(day, p.reminder.hour, p.reminder.minute);
    if (nudge > now) {
      const title = day === today && streak > 0 ? t.day(streak + 1) : due > 0 ? t.rematch(due) : t.ready;
      out.push({ at: nudge, title, body: nudges[i % nudges.length] });
    }

    const risk = at(day, RISK.hour, RISK.minute);
    if (risk > now && risk > nudge) {
      out.push(
        day === today && streak > 0
          ? { at: risk, title: t.risk(streak), body: t.riskBody(Math.max(0, GOAL - (p.day === today ? p.answered : 0))) }
          : { at: risk, title: t.last, body: t.lastBody },
      );
    }
  }
  return out;
}
