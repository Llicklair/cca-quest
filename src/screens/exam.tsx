import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import * as feel from '../feel.ts';
import {
  DOMAINS,
  EXAM,
  FIXED_EXAMS,
  SETTINGS,
  bestScore,
  buildExam,
  fixedExams,
  shuffle,
  type ExamDraft,
  type ExamResult,
  type Progress,
  type Question,
} from '../game.ts';
import { QUESTIONS } from '../questions.ts';
import { Bar, BounceIn, Btn, Cmd, Panel, Rich, Tag, Txt, Typer } from '../term.tsx';
import { c, domainColor } from '../theme.ts';

export type Slot = { q: Question; order: number[]; picked: number | null }; // picked = índice original
type Run = { label: string; slots: Slot[]; i: number; per: number; limit: number };
type Phase = { kind: 'menu' } | { kind: 'run' } | { kind: 'report'; result: ExamResult; slots: Slot[]; gained: number };

const FIXED = fixedExams(QUESTIONS);
const clock = (secs: number) => {
  const h = Math.floor(secs / 3600);
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return h ? `${h}:${m}:${s}` : `${m}:${s}`;
};
const pct = (r: number, t: number) => (t ? Math.round((100 * r) / t) : 0);
const toSlots = (qs: Question[]): Slot[] => qs.map((q) => ({ q, order: shuffle(q.options.map((_, k) => k)), picked: null }));

export function Exam({
  p,
  onFinish,
  onSaveDraft,
  onExit,
  onRunning,
}: {
  p: Progress;
  onFinish: (slots: Slot[], secs: number, label: string) => { result: ExamResult; gained: number };
  onSaveDraft: (draft: ExamDraft | null) => void;
  onExit: () => void;
  onRunning: (running: boolean) => void;
}) {
  const [phase, setPhase] = useState<Phase>({ kind: 'menu' });
  const [run, setRun] = useState<Run | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const runRef = useRef<Run | null>(null);
  const elapsedRef = useRef(0);

  const draftOf = (r: Run, secs: number): ExamDraft => ({
    label: r.label,
    ids: r.slots.map((s) => s.q.id),
    orders: r.slots.map((s) => s.order),
    picked: r.slots.map((s) => s.picked),
    i: r.i,
    elapsed: secs,
    limit: r.limit,
  });

  const update = (r: Run) => {
    runRef.current = r;
    setRun(r);
  };

  const finish = () => {
    const r = runRef.current;
    if (!r) return;
    const secs = Math.min(r.limit, elapsedRef.current);
    const { result, gained } = onFinish(r.slots, secs, r.label);
    runRef.current = null;
    setPhase({ kind: 'report', result, slots: r.slots, gained });
    onRunning(false);
  };

  // Cronómetro: cuenta mientras la pantalla está abierta, guarda cada 15 s y entrega al acabar el tiempo.
  const running = phase.kind === 'run';
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
      const r = runRef.current;
      if (!r) return;
      if (elapsedRef.current >= r.limit) {
        clearInterval(id);
        finish();
      } else if (elapsedRef.current % 15 === 0) onSaveDraft(draftOf(r, elapsedRef.current));
    }, 1000);
    return () => clearInterval(id);
    // finish y draftOf solo usan refs y callbacks estables del padre
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const begin = (label: string, qs: Question[], per: number) => {
    const r: Run = { label, slots: toSlots(qs), i: 0, per, limit: qs.length * EXAM.secsPerQuestion };
    update(r);
    elapsedRef.current = 0;
    setElapsed(0);
    onSaveDraft(draftOf(r, 0));
    setPhase({ kind: 'run' });
    onRunning(true);
    feel.tap();
  };

  const resume = (d: ExamDraft) => {
    const byId = new Map(QUESTIONS.map((q) => [q.id, q]));
    const slots = d.ids.flatMap((id, k) => {
      const q = byId.get(id);
      return q ? [{ q, order: d.orders[k], picked: d.picked[k] }] : [];
    });
    const per = d.label === 'quick' ? EXAM.quickPerScenario : EXAM.perScenario;
    update({ label: d.label, slots, i: Math.min(d.i, slots.length - 1), per, limit: d.limit });
    elapsedRef.current = d.elapsed;
    setElapsed(d.elapsed);
    setPhase({ kind: 'run' });
    onRunning(true);
    feel.tap();
  };

  const pause = () => {
    const r = runRef.current;
    if (r) onSaveDraft(draftOf(r, elapsedRef.current));
    setPhase({ kind: 'menu' });
    onRunning(false);
  };

  const choose = (orig: number) => {
    if (!run) return;
    const next = { ...run, slots: run.slots.map((s, k) => (k === run.i ? { ...s, picked: orig } : s)) };
    update(next);
    onSaveDraft(draftOf(next, elapsedRef.current));
    feel.tap();
  };

  const go = (i: number) => run && update({ ...run, i });

  // --- Menú de simulacros ---
  if (phase.kind === 'menu') {
    const d = p.examDraft;
    return (
      <ScrollView contentContainerStyle={s.page}>
        <Typer text="$ cca-quest exam --list" bold color={c.green} />

        {d && (
          <Panel title="in progress" color={c.amber} titleColor={c.amber}>
            <Txt bold color={c.amber}>
              {d.label} · q {d.i + 1}/{d.ids.length} · {d.picked.filter((x) => x !== null).length} answered
            </Txt>
            <Txt color={c.muted}>⏱ {clock(Math.max(0, d.limit - d.elapsed))} left · clock paused</Txt>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <Btn kind="amber" label="▶ RESUME" onPress={() => resume(d)} style={{ flex: 2 }} />
              <Btn kind="danger" label="DISCARD" onPress={() => onSaveDraft(null)} style={{ flex: 1 }} />
            </View>
          </Panel>
        )}

        <Panel title={`full mock · 60 q · ${clock(60 * EXAM.secsPerQuestion)}`}>
          <Txt size={12} color={c.muted} style={{ marginBottom: 6 }}>
            {'// like the real one: 4 of 6 scenarios, 15 questions each, no feedback until you submit. you can pause.'}
          </Txt>
          {FIXED.map((qs, n) => {
            const label = `exam ${n + 1}`;
            return (
              <ExamRow
                key={label}
                title={label}
                sub={FIXED_EXAMS[n].join(' · ')}
                best={bestScore(p, label)}
                disabled={Boolean(d) || qs.length === 0}
                onPress={() => begin(label, qs, EXAM.perScenario)}
              />
            );
          })}
          <ExamRow
            title="random"
            sub="4 random scenarios · new every time"
            best={bestScore(p, 'random')}
            disabled={Boolean(d)}
            onPress={() => begin('random', buildExam(QUESTIONS, Math.random, EXAM.scenarios, EXAM.perScenario), EXAM.perScenario)}
          />
        </Panel>

        <Panel title={`quick · 20 q · ${clock(20 * EXAM.secsPerQuestion)}`}>
          <ExamRow
            title="quick"
            sub="4 random scenarios · 5 questions each"
            best={bestScore(p, 'quick')}
            disabled={Boolean(d)}
            onPress={() => begin('quick', buildExam(QUESTIONS, Math.random, EXAM.scenarios, EXAM.quickPerScenario), EXAM.quickPerScenario)}
          />
        </Panel>
        {d && (
          <Txt size={12} color={c.muted}>
            {'// finish or discard the exam in progress to start another'}
          </Txt>
        )}

        <Panel title="history">
          {p.exams.length === 0 ? (
            <Txt color={c.muted}>no attempts yet</Txt>
          ) : (
            p.exams.slice(0, 8).map((e, k) => {
              const score = pct(e.right, e.total);
              const ok = score >= EXAM.target * 100;
              return (
                <View key={k} style={s.histRow}>
                  <Txt color={c.muted} style={{ width: 52 }}>
                    {e.day.slice(5)}
                  </Txt>
                  <Txt style={{ width: 64 }}>{e.label}</Txt>
                  <Bar value={e.right / e.total} width={8} color={ok ? c.green : c.amber} />
                  <Txt bold color={ok ? c.green : c.amber}>
                    {String(score).padStart(3)}%
                  </Txt>
                </View>
              );
            })
          )}
          <Txt size={11} color={c.muted} style={{ marginTop: 6 }}>
            {`// target ≈ ${EXAM.target * 100}% right. rough guide: the real pass mark is a scaled 720/1000`}
          </Txt>
        </Panel>
        <Btn label="$ cd ~" onPress={onExit} />
      </ScrollView>
    );
  }

  // --- Examen en marcha ---
  if (phase.kind === 'run' && run) {
    const slot = run.slots[run.i];
    const left = Math.max(0, run.limit - elapsed);
    const scenarioIdx = Math.floor(run.i / run.per);
    const firstOfScenario = run.i % run.per === 0;
    const answered = run.slots.filter((x) => x.picked !== null).length;
    const dom = DOMAINS.find((d) => d.id === slot.q.domain)!;
    const last = run.i + 1 === run.slots.length;
    return (
      <View style={s.fill}>
        <View style={s.top}>
          <Txt bold color={left < 300 ? c.red : c.amber}>
            ⏱ {clock(left)}
          </Txt>
          <Txt bold>
            {run.i + 1}/{run.slots.length}
          </Txt>
          <View style={{ flex: 1 }} />
          <Pressable onPress={pause} hitSlop={10}>
            <Txt bold color={c.muted}>
              [⏸ pause]
            </Txt>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={[s.page, { paddingBottom: 170 }]} key={run.i}>
          {slot.q.setting && (
            <Txt bold size={12} color={firstOfScenario ? c.amber : c.muted}>
              ── {run.label} · scenario {scenarioIdx + 1}/{Math.ceil(run.slots.length / run.per)}: {SETTINGS[slot.q.setting].name.toLowerCase()} ──
            </Txt>
          )}
          <Panel color={c.lineHi}>
            <View style={s.tags}>
              <Tag label={`d${dom.n} ${dom.short.toLowerCase()}`} color={domainColor[slot.q.domain]} />
            </View>
            <Rich text={slot.q.scenario} size={15} />
          </Panel>
          <Txt bold size={15} color={c.green}>
            ? {slot.q.ask}
          </Txt>
          {slot.order.map((orig, pos) => {
            const on = slot.picked === orig;
            return (
              <Pressable
                key={pos}
                onPress={() => choose(orig)}
                style={({ pressed }) => [s.opt, on && { borderColor: c.amber, backgroundColor: '#2A2110' }, pressed && { backgroundColor: c.greenBg }]}
              >
                <View style={s.optRow}>
                  <Txt bold color={on ? c.amber : c.muted}>
                    [{on ? '●' : 'ABCD'[pos]}]
                  </Txt>
                  <Rich text={slot.q.options[orig]} style={{ flex: 1 }} />
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={s.bottom}>
          <View style={s.dots}>
            {run.slots.map((x, k) => (
              <Pressable key={k} onPress={() => go(k)} hitSlop={3}>
                <Txt size={12} bold color={k === run.i ? c.green : x.picked !== null ? c.amber : c.lineHi}>
                  {k === run.i ? '◆' : x.picked !== null ? '■' : '□'}
                </Txt>
              </Pressable>
            ))}
          </View>
          <Txt size={11} color={c.muted} style={{ textAlign: 'center' }}>
            {answered}/{run.slots.length} answered
          </Txt>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Btn label="◀ PREV" onPress={() => go(Math.max(0, run.i - 1))} disabled={run.i === 0} style={{ flex: 1 }} />
            {last ? (
              <Btn kind="amber" label="SUBMIT ✓" onPress={finish} style={{ flex: 1 }} />
            ) : (
              <Btn kind="primary" label="NEXT ▶" onPress={() => go(run.i + 1)} style={{ flex: 1 }} />
            )}
          </View>
        </View>
      </View>
    );
  }

  // --- Informe ---
  if (phase.kind !== 'report') return null;
  const { result, gained } = phase;
  const score = pct(result.right, result.total);
  const passed = score >= EXAM.target * 100;
  const wrong = phase.slots.filter((x) => x.picked !== x.q.answer);
  return (
    <ScrollView contentContainerStyle={s.page}>
      <Typer text={`$ cca-quest exam --report "${result.label}"`} bold color={c.green} />
      <BounceIn>
        <Panel title="score" color={passed ? c.green : c.amber} titleColor={passed ? c.green : c.amber}>
          <Txt bold size={34} color={passed ? c.green : c.amber}>
            {score}%
          </Txt>
          <Txt>
            {result.right}/{result.total} right · {clock(result.secs)} · +{gained} xp
          </Txt>
          <Txt size={12} color={passed ? c.green : c.amber} style={{ marginTop: 4 }}>
            {passed ? '// on track. keep the streak going.' : `// below the ~${EXAM.target * 100}% target. review the misses below.`}
          </Txt>
        </Panel>
      </BounceIn>
      <Panel title="by domain">
        {DOMAINS.map((d) => {
          const [r, t] = result.byDomain[d.id] ?? [0, 0];
          if (!t) return null;
          return (
            <View key={d.id} style={s.histRow}>
              <Txt bold color={domainColor[d.id]} style={{ width: 40 }}>
                d{d.n}
              </Txt>
              <Bar value={r / t} width={10} color={domainColor[d.id]} />
              <Txt color={c.muted}>
                {String(pct(r, t)).padStart(3)}% {r}/{t}
              </Txt>
            </View>
          );
        })}
      </Panel>
      {wrong.length > 0 && (
        <Cmd>
          git diff --misses <Txt color={c.muted}>({wrong.length})</Txt>
        </Cmd>
      )}
      {wrong.map((x) => (
        <Panel key={x.q.id} color={c.line}>
          <Rich text={x.q.scenario.length > 150 ? `${x.q.scenario.slice(0, 150).trimEnd()}…` : x.q.scenario} size={12} color={c.muted} />
          <Rich text={x.q.ask} bold color={c.green} style={{ marginTop: 4 }} />
          <Rich text={`- ${x.picked === null ? '(no answer)' : x.q.options[x.picked]}`} size={13} color={c.red} style={{ marginTop: 6 }} />
          <Rich text={`+ ${x.q.options[x.q.answer]}`} size={13} color={c.green} style={{ marginTop: 4 }} />
          <Rich text={`└ ${x.q.why[x.q.answer]}`} size={12} color={c.muted} style={{ marginTop: 4 }} />
        </Panel>
      ))}
      <View style={{ gap: 10, marginTop: 6 }}>
        <Btn kind="amber" label="▶ EXAM LIST" onPress={() => setPhase({ kind: 'menu' })} />
        <Btn label="$ cd ~" onPress={onExit} />
      </View>
    </ScrollView>
  );
}

function ExamRow({
  title,
  sub,
  best,
  disabled,
  onPress,
}: {
  title: string;
  sub: string;
  best: number | null;
  disabled?: boolean;
  onPress: () => void;
}) {
  const ok = best !== null && best >= EXAM.target;
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [s.row, disabled && { opacity: 0.4 }, pressed && { backgroundColor: c.greenBg }]}>
      <View style={{ flex: 1 }}>
        <Txt bold color={c.green}>
          ▶ {title}
        </Txt>
        <Txt size={11} color={c.muted}>
          {sub}
        </Txt>
      </View>
      <Txt bold color={best === null ? c.muted : ok ? c.green : c.amber}>
        {best === null ? '—' : `best ${Math.round(best * 100)}%`}
      </Txt>
    </Pressable>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: c.bg },
  page: { padding: 16, gap: 12 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.line },
  tags: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  opt: { borderWidth: 1, borderColor: c.lineHi, borderRadius: 3, padding: 12, backgroundColor: c.panel },
  optRow: { flexDirection: 'row', gap: 10 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: c.panel, borderTopWidth: 1, borderTopColor: c.lineHi, padding: 12, gap: 8 },
  dots: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center' },
  histRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.line },
});
