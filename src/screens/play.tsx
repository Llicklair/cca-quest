import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  DOMAINS,
  GOAL,
  SETTINGS,
  dayKey,
  dueCount,
  goalDone,
  heatmap,
  levelOf,
  liveStreak,
  mastery,
  readiness,
  shuffle,
  todo,
  type Level,
  type Progress,
  type Question,
} from '../game.ts';
import { FLASHCARDS } from '../flashcards.ts';
import { LESSONS } from '../lessons.ts';
import { QUESTIONS } from '../questions.ts';
import { TERMS } from '../glossary.ts';
import { Banner, Bar, BounceIn, Btn, Cmd, Heatmap, Panel, Pop, Pulse, Rich, Tag, Txt, Typer } from '../term.tsx';
import { c, domainColor } from '../theme.ts';

export type Item = { q: Question; order: number[] }; // order[pos] = índice original de la opción
export type Round = {
  items: Item[];
  i: number;
  picked: number | null; // posición pulsada
  combo: number;
  best: number;
  right: number;
  xp: number;
  gain: number;
  levelUp: Level | null;
  goalMet: boolean;
  label: string; // “daily” o la tarea que se practica
};

export function newRound(qs: Question[], label: string): Round {
  return {
    items: qs.map((q) => ({ q, order: shuffle(q.options.map((_, i) => i)) })),
    i: 0,
    picked: null,
    combo: 0,
    best: 0,
    right: 0,
    xp: 0,
    gain: 0,
    levelUp: null,
    goalMet: false,
    label,
  };
}

export const handle = (title: string) => title.toLowerCase().replace(/ /g, '_');
const LABEL = { agentic: 'agents', tools: 'tools', 'claude-code': 'claude', prompting: 'prompt', context: 'context' } as const;
const pad2 = (n: number) => String(n).padStart(2, '0');

// --- Estado del jugador ---

export function Status({
  p,
  onPlay,
  onExam,
  onLesson,
  onCards,
}: {
  p: Progress;
  onPlay: () => void;
  onExam: () => void;
  onLesson: (ts: string) => void;
  onCards: () => void;
}) {
  const t = dayKey(new Date());
  const lvl = levelOf(p.xp);
  const streak = liveStreak(p, t);
  const doneToday = goalDone(p, t);
  const todayCount = Math.min(GOAL, p.day === t ? p.answered : 0);
  const due = dueCount(QUESTIONS, p, t);
  const unseen = QUESTIONS.filter((q) => !p.cards[q.id]).length;
  const atRisk = streak > 0 && !doneToday;
  const tasks = todo(p, t, LESSONS, FLASHCARDS);
  const lastExam = p.exams[0];

  return (
    <ScrollView contentContainerStyle={s.page}>
      <View style={{ alignItems: 'center', marginTop: 4 }}>
        <Banner text="CCA QUEST" />
        <Txt size={11} color={c.muted}>
          claude certified architect · foundations
        </Txt>
      </View>
      <Typer text="$ cca-quest status" bold color={c.green} />

      <Panel title="player">
        <Txt bold size={16}>
          lvl {pad2(lvl.n)} <Txt color={c.muted}>::</Txt> <Txt color={c.green}>{handle(lvl.title)}</Txt>
        </Txt>
        <Row k="xp">
          <Bar value={lvl.to ? (p.xp - lvl.from) / (lvl.to - lvl.from) : 1} color={c.amber} width={14} />
          <Txt color={c.muted}> {lvl.to ? `${p.xp}/${lvl.to}` : `${p.xp} max`}</Txt>
        </Row>
        <Row k="streak">
          <Pulse on={atRisk}>
            <Txt bold color={streak > 0 ? c.amber : c.muted}>
              {pad2(streak)}d{streak > 0 ? ' ▲' : ''}
            </Txt>
          </Pulse>
          <Txt color={c.muted}>  best {pad2(p.best)}d</Txt>
        </Row>
        <Row k="today">
          <Bar value={todayCount / GOAL} width={GOAL} color={doneToday ? c.green : c.amber} />
          <Txt color={doneToday ? c.green : c.muted}> {todayCount}/{GOAL}{doneToday ? ' goal ✓' : ''}</Txt>
        </Row>
        {atRisk && (
          <Txt color={c.amber} size={12} style={{ marginTop: 6 }}>
            !! play today or the streak resets at midnight
          </Txt>
        )}
      </Panel>

      <View style={{ gap: 6, marginTop: 6 }}>
        <Cmd>cca-quest next</Cmd>
        <Txt color={c.muted}>
          {'> '}
          <Txt color={due > 0 ? c.amber : c.muted}>{due} due</Txt> · {unseen} new · {QUESTIONS.length} total
        </Txt>
        <Btn kind="primary" label={doneToday ? '▶ BONUS ROUND' : '▶ START ROUND'} onPress={onPlay} />
      </View>

      <Panel title="todo">
        {tasks.map((task) => {
          const done = task.kind === 'round' && task.done;
          const lesson = task.kind === 'lesson' ? LESSONS.find((l) => l.ts === task.ts) : undefined;
          const text =
            task.kind === 'round'
              ? task.done
                ? 'daily round · streak safe'
                : `daily round · ${task.left} question${task.left === 1 ? '' : 's'} left`
              : task.kind === 'lesson'
                ? `man ${task.ts} · ${lesson?.title[p.lang] ?? ''}`
                : `review ${task.due} card${task.due === 1 ? '' : 's'}`;
          const go = task.kind === 'round' ? onPlay : task.kind === 'lesson' ? () => onLesson(task.ts) : onCards;
          return (
            <Pressable key={task.kind} onPress={go} disabled={done} style={({ pressed }) => [s.todo, pressed && { backgroundColor: c.greenBg }]}>
              <Txt bold color={done ? c.green : c.amber}>
                [{done ? 'x' : ' '}]
              </Txt>
              <Rich text={text} style={{ flex: 1 }} color={done ? c.muted : c.text} />
              {!done && <Txt color={c.muted}>›</Txt>}
            </Pressable>
          );
        })}
      </Panel>

      <Pressable onPress={onExam} style={({ pressed }) => [s.exam, pressed && { backgroundColor: '#2A2110' }]}>
        <View style={{ flex: 1 }}>
          <Txt bold color={c.amber}>
            $ cca-quest exam --mock
          </Txt>
          <Txt size={12} color={c.muted}>
            {p.examDraft
              ? `${p.examDraft.label} in progress · ${p.examDraft.picked.filter((x) => x !== null).length}/${p.examDraft.ids.length} answered`
              : `4 full mocks · 60 q · 2h${lastExam ? ` · last ${Math.round((100 * lastExam.right) / lastExam.total)}%` : ''}`}
          </Txt>
        </View>
        <Txt bold color={c.amber}>
          ›
        </Txt>
      </Pressable>

      <Panel title="activity · 16 weeks">
        <Heatmap weeks={heatmap(p, t, 16)} />
      </Panel>

      <Panel title="mastery · exam weights">
        {DOMAINS.map((d) => {
          const m = mastery(QUESTIONS, p, d.id);
          return (
            <View key={d.id} style={s.domRow}>
              <Txt color={domainColor[d.id]} bold style={{ width: 100 }}>
                d{d.n} {LABEL[d.id]}
              </Txt>
              <Bar value={m} width={10} color={domainColor[d.id]} />
              <Txt color={c.muted}> {String(Math.round(m * 100)).padStart(3)}% w{d.weight}</Txt>
            </View>
          );
        })}
        <View style={[s.domRow, { marginTop: 8 }]}>
          <Txt bold style={{ width: 100 }}>
            ready
          </Txt>
          <Bar value={readiness(QUESTIONS, p)} width={10} />
          <Txt bold> {String(Math.round(readiness(QUESTIONS, p) * 100)).padStart(3)}%</Txt>
        </View>
        <Txt size={11} color={c.muted} style={{ marginTop: 6 }}>
          a question is mastered after 4 right answers spread over days
        </Txt>
      </Panel>

      <Txt size={11} color={c.muted} style={{ textAlign: 'center', marginTop: 4 }}>
        {QUESTIONS.length} questions · {LESSONS.length} lessons · {FLASHCARDS.length} cards · {TERMS.length} terms
      </Txt>
    </ScrollView>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <View style={s.row}>
      <Txt color={c.muted} style={{ width: 64 }}>
        {k}
      </Txt>
      {children}
    </View>
  );
}

// --- Ronda ---

const PRAISE = ['correct.', 'nice.', 'on fire.', 'unstoppable.', 'ARCHITECT MODE.'];

export function RoundView({
  round,
  onPick,
  onNext,
  onQuit,
  onLesson,
}: {
  round: Round;
  onPick: (pos: number) => void;
  onNext: () => void;
  onQuit: () => void;
  onLesson: (ts: string) => void;
}) {
  const { q, order } = round.items[round.i];
  const answered = round.picked !== null;
  const correctPos = order.indexOf(q.answer);
  const ok = round.picked === correctPos;
  const dom = DOMAINS.find((d) => d.id === q.domain)!;
  const last = round.i + 1 === round.items.length;
  const hasLesson = q.ts && LESSONS.some((l) => l.ts === q.ts);

  return (
    <View style={s.fill}>
      <View style={s.top}>
        <Pressable onPress={onQuit} hitSlop={12}>
          <Txt bold color={c.muted}>
            [x]
          </Txt>
        </Pressable>
        <Txt bold>
          q {round.i + 1}/{round.items.length}
        </Txt>
        <Bar value={round.i / round.items.length} width={round.items.length} />
        <View style={{ flex: 1 }} />
        {round.combo >= 2 && (
          <Txt bold color={c.amber}>
            x{round.combo}
          </Txt>
        )}
        <Txt bold color={c.amber}>
          +{round.xp}xp
        </Txt>
      </View>

      <ScrollView contentContainerStyle={[s.page, { paddingBottom: 150 }]} key={round.i}>
        <Txt size={12} color={c.muted}>
          $ cat scenario{q.ts ? ` --task ${q.ts}` : ''}
        </Txt>
        <Panel title={q.setting ? SETTINGS[q.setting].name.toLowerCase() : 'scenario'} color={domainColor[q.domain]} titleColor={domainColor[q.domain]}>
          <View style={s.tags}>
            <Tag label={`d${dom.n} ${dom.short.toLowerCase()}`} color={domainColor[q.domain]} />
            {q.ts && <Tag label={`task ${q.ts}`} />}
            {round.label !== 'daily' && <Tag label={round.label} color={c.amber} />}
          </View>
          <Rich text={q.scenario} size={15} />
        </Panel>
        <Txt bold size={15} color={c.green}>
          ? {q.ask}
        </Txt>

        <View style={{ gap: 8 }}>
          {order.map((orig, pos) => {
            const right = pos === correctPos;
            const mine = pos === round.picked;
            const mark = !answered ? 'ABCD'[pos] : right ? '✓' : mine ? '✗' : 'ABCD'[pos];
            const tone = !answered ? c.lineHi : right ? c.green : mine ? c.red : c.line;
            return (
              <Pressable
                key={pos}
                disabled={answered}
                onPress={() => onPick(pos)}
                style={({ pressed }) => [
                  s.opt,
                  { borderColor: tone },
                  answered && right && { backgroundColor: c.greenBg },
                  answered && mine && !right && { backgroundColor: c.redBg },
                  answered && !right && !mine && { opacity: 0.6 },
                  pressed && { backgroundColor: c.greenBg },
                ]}
              >
                <View style={s.optRow}>
                  <Txt bold color={answered && right ? c.green : answered && mine ? c.red : c.muted}>
                    [{mark}]
                  </Txt>
                  <Rich text={q.options[orig]} style={{ flex: 1 }} />
                </View>
                {answered && (
                  <Rich text={`└ ${q.why[orig]}`} size={12} color={right ? c.text : c.muted} style={{ marginLeft: 36 }} />
                )}
              </Pressable>
            );
          })}
        </View>

        {answered && (
          <Panel title="remember" color={c.amber} titleColor={c.amber}>
            <Rich text={q.rule} bold color={c.amber} />
          </Panel>
        )}
        {answered && hasLesson && <Btn small label={`$ man ${q.ts}  → read the lesson`} onPress={() => onLesson(q.ts!)} />}
      </ScrollView>

      {answered && (
        <View style={[s.bottom, { borderTopColor: ok ? c.green : c.red }]}>
          <Txt bold size={16} color={ok ? c.green : c.red}>
            {'> '}
            {ok ? PRAISE[Math.min(round.combo, PRAISE.length) - 1] : 'wrong. read why ↑'}
            {ok && round.combo >= 2 ? `  combo x${round.combo}` : ''}
          </Txt>
          <Btn kind={ok ? 'good' : 'amber'} label={last ? '▶ RESULTS' : '▶ CONTINUE'} onPress={onNext} />
        </View>
      )}
      {answered && <Pop key={`pop-${round.i}`} text={`+${round.gain} XP`} color={ok ? c.amber : c.muted} />}
    </View>
  );
}

// --- Resultado ---

export function Done({ round, p, onAgain, onHome }: { round: Round; p: Progress; onAgain: () => void; onHome: () => void }) {
  const total = round.items.length;
  const perfect = round.right === total;
  const streak = liveStreak(p, dayKey(new Date()));
  const banner = perfect ? 'PERFECT ROUND' : 'ROUND COMPLETE';
  const line = '═'.repeat(banner.length + 2);

  return (
    <ScrollView contentContainerStyle={[s.page, { flexGrow: 1, justifyContent: 'center' }]}>
      <Typer text="$ cca-quest round --summary" bold color={c.green} />
      <BounceIn>
        <Txt bold size={18} color={perfect ? c.amber : c.green} style={{ textAlign: 'center', marginVertical: 10 }}>
          {`╔${line}╗\n║ ${banner} ║\n╚${line}╝`}
        </Txt>
      </BounceIn>
      <Panel title="result">
        <Row k="correct">
          <Txt bold color={perfect ? c.green : c.text}>
            {round.right}/{total}
          </Txt>
          <Txt color={c.muted}>  </Txt>
          <Bar value={round.right / total} width={total} />
        </Row>
        <Row k="xp">
          <Txt bold color={c.amber}>
            +{round.xp}
          </Txt>
        </Row>
        <Row k="combo">
          <Txt bold>x{round.best}</Txt>
        </Row>
        <Row k="streak">
          <Txt bold color={c.amber}>
            {pad2(streak)}d{round.goalMet ? ' ▲ goal done' : ''}
          </Txt>
        </Row>
      </Panel>
      {round.levelUp && (
        <BounceIn delay={400}>
          <Panel title="level up" color={c.amber} titleColor={c.amber}>
            <Txt bold size={16} color={c.amber}>
              lvl {pad2(round.levelUp.n)} :: {handle(round.levelUp.title)}
            </Txt>
          </Panel>
        </BounceIn>
      )}
      {!perfect && (
        <Txt size={12} color={c.muted} style={{ marginTop: 8 }}>
          {'// missed questions come back tomorrow. that is how they stick.'}
        </Txt>
      )}
      <View style={{ gap: 10, marginTop: 16 }}>
        <Btn kind="primary" label="▶ ANOTHER ROUND" onPress={onAgain} />
        <Btn label="$ cd ~" onPress={onHome} />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: c.bg },
  page: { padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  domRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  todo: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  exam: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: c.amber, borderRadius: 4, padding: 14, marginTop: 4 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.line },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  opt: { borderWidth: 1, borderRadius: 3, padding: 12, gap: 6, backgroundColor: c.panel },
  optRow: { flexDirection: 'row', gap: 10 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: c.panel, borderTopWidth: 2, padding: 16, gap: 10 },
});
