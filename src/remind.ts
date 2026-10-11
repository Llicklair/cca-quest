// Qué recordatorios dejar programados. Se recalcula al abrir la app y al terminar
// cada ronda: así el de hoy desaparece en cuanto se cumple la meta, y si la app no
// se abre en días, siguen llegando avisos hasta HORIZON días.
import { GOAL, addDays, at, dayKey, dueCount, goalDone, liveStreak, type Progress, type Question } from './game.ts';

export type Reminder = { at: Date; title: string; body: string };

export const HORIZON = 14;
const RISK = { hour: 22, minute: 0 }; // último aviso del día para no perder la racha

const NUDGES = [
  'Five questions, ten minutes. The architect doesn’t skip a day.',
  'Your subagents are waiting for orders. Quick round?',
  'Can you hit a 5-answer combo today?',
  'One round now beats three hours on Sunday.',
  'Distractors are getting cocky. Go put them in their place.',
  'Tiny round, big streak. Let’s go.',
];

export function plan(qs: Question[], p: Progress, now: Date, days = HORIZON): Reminder[] {
  if (!p.reminder.on) return [];
  const today = dayKey(now);
  const streak = liveStreak(p, today);
  const out: Reminder[] = [];

  for (let i = 0; i < days; i++) {
    const day = addDays(today, i);
    if (day === today && goalDone(p, today)) continue;
    const due = dueCount(qs, p, day);

    const nudge = at(day, p.reminder.hour, p.reminder.minute);
    if (nudge > now) {
      const title =
        day === today && streak > 0
          ? `🔥 Day ${streak + 1} is waiting`
          : due > 0
            ? `🧠 ${due} question${due === 1 ? '' : 's'} want a rematch`
            : '🏗️ Your daily round is ready';
      out.push({ at: nudge, title, body: NUDGES[i % NUDGES.length] });
    }

    const risk = at(day, RISK.hour, RISK.minute);
    if (risk > now && risk > nudge) {
      out.push(
        day === today && streak > 0
          ? {
              at: risk,
              title: `⚠️ Your ${streak}-day streak ends at midnight`,
              body: `${Math.max(0, GOAL - (p.day === today ? p.answered : 0))} questions keep the flame alive.`,
            }
          : { at: risk, title: '⚠️ Last call for today', body: 'One quick round before midnight keeps the flame burning.' },
      );
    }
  }
  return out;
}
