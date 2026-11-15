// Tu historial contado para Claude: las preguntas que has contestado (en simulacros y en rondas,
// porque las dos pasan por la misma ficha de cada pregunta), los simulacros con su nota y los
// aciertos por dominio y por task statement. Lógica pura, para probarla con node --test.
import type { RecordItem, StudyRecord } from './ask.ts';
import { BANK, BANK_ES, LEVEL_BANK } from './bank.ts';
import { DOMAINS, isWeighted, pickedOf, rightOf, scoreOf, type Lang, type Progress, type Question } from './game.ts';
import { STR } from './i18n.ts';
import { LESSONS } from './lessons.ts';

const ALL = [...BANK, ...LEVEL_BANK];
const byTs = (a: string, b: string) => a.localeCompare(b, 'en', { numeric: true });

/**
 * Una pregunta con lo que dice su ficha: veces contestada, veces bien, si la última vez la fallaste
 * (caja 1) y lo que elegiste. null si nunca la has contestado.
 */
export function recordItem(q: Question, p: Progress, lang: Lang): RecordItem | null {
  const card = p.cards[q.id];
  if (!card?.seen) return null;
  return {
    tx: (lang === 'es' && BANK_ES[q.id]) || q,
    rights: rightOf(q),
    ts: q.ts,
    seen: card.seen,
    right: card.right ?? 0,
    lastWrong: card.box === 1,
    last: card.last === undefined ? null : pickedOf(q, card.last),
  };
}

/** Todo tu historial: simulacros, dominios, task statements y cada pregunta contestada, por task statement. */
export function studyRecord(p: Progress, lang: Lang): StudyRecord {
  const T = STR[lang];
  const seen = ALL.filter((q) => p.cards[q.id]?.seen).sort((a, b) => byTs(a.ts ?? '9', b.ts ?? '9') || a.id.localeCompare(b.id));
  const sum = (qs: Question[]): [number, number] => [qs.reduce((n, q) => n + (p.cards[q.id].right ?? 0), 0), qs.reduce((n, q) => n + p.cards[q.id].seen, 0)];
  const tasks = [...new Set(seen.flatMap((q) => (q.ts ? [q.ts] : [])))].sort(byTs).map((ts) => {
    const [right, total] = sum(seen.filter((q) => q.ts === ts));
    const lesson = LESSONS.find((l) => l.ts === ts);
    return { ts, title: lesson ? lesson.title[lang] : '', right, seen: total };
  });
  return {
    exams: p.exams.map((e) => ({
      day: e.day,
      label: T.examLabel(e.label),
      score: Math.round(100 * scoreOf(e)),
      right: e.right,
      total: e.total,
      weighted: isWeighted(e.label),
      byDomain: DOMAINS.flatMap((d): [number, number, number][] => {
        const got = e.byDomain[d.id];
        return got ? [[d.n, got[0], got[1]]] : [];
      }),
    })),
    domains: DOMAINS.map((d) => ({
      n: d.n,
      name: d.name,
      weight: d.weight,
      exam: p.exams.reduce<[number, number]>((acc, e) => {
        const [r, t] = e.byDomain[d.id] ?? [0, 0];
        return [acc[0] + r, acc[1] + t];
      }, [0, 0]),
      all: sum(seen.filter((q) => q.domain === d.id)),
    })),
    tasks,
    items: seen.map((q) => recordItem(q, p, lang)!),
  };
}
