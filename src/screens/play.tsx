import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  DOMAINS,
  GOAL,
  SETTINGS,
  dayKey,
  dueCount,
  goalDone,
  handle,
  heatmap,
  isMulti,
  isRight,
  levelOf,
  liveStreak,
  maskOf,
  mastery,
  misses,
  pickedOf,
  readiness,
  rightOf,
  roundPool,
  shuffle,
  todo,
  type Lang,
  type Level,
  type Profile,
  type Progress,
  type Question,
} from '../game.ts';
import { FLASHCARDS } from '../flashcards.ts';
import { LESSONS } from '../lessons.ts';
import { BANK, LEVEL_BANK } from '../bank.ts';
import { QUESTIONS } from '../questions.ts';
import { AskClaude, MissCard, inLang } from './misses.tsx';
import { RankPanels } from './rank.tsx';
import { TERMS } from '../glossary.ts';
import { STR } from '../i18n.ts';
import { useGuard } from '../shield.tsx';
import { Banner, Bar, BounceIn, Btn, Cmd, Heatmap, Panel, Pop, Pulse, Rich, Tag, Txt, Typer } from '../term.tsx';
import { c, domainColor } from '../theme.ts';

export type Item = { q: Question; order: number[] }; // order[pos] = índice original de la opción
export type Round = {
  items: Item[];
  i: number;
  picked: number | null; // lo elegido: índice original, o máscara en las de respuesta múltiple
  combo: number;
  best: number;
  right: number;
  xp: number;
  gain: number;
  levelUp: Level | null;
  goalMet: boolean;
  label: string; // “daily” o la tarea que se practica
  picks: number[]; // lo elegido en cada pregunta, en orden (índice original, o máscara en las de respuesta múltiple)
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
    picks: [],
  };
}

const LABEL = { agentic: 'agents', tools: 'tools', 'claude-code': 'claude', prompting: 'prompt', context: 'context' } as const;
const pad2 = (n: number) => String(n).padStart(2, '0');

// --- Estado del jugador ---

export function Status({
  p,
  update,
  onUpdate,
  onPlay,
  onExam,
  onLesson,
  onCards,
  onMisses,
  onLive,
  onProfile,
}: {
  p: Progress;
  update: number | null; // build nueva disponible, si la hay
  onUpdate: () => void;
  onPlay: () => void;
  onExam: () => void;
  onLesson: (ts: string) => void;
  onCards: () => void;
  onMisses: () => void;
  onLive: () => void;
  onProfile: (profile: Profile) => void;
}) {
  const t = dayKey(new Date());
  const lvl = levelOf(p.xp);
  const streak = liveStreak(p, t);
  const doneToday = goalDone(p, t);
  const todayCount = Math.min(GOAL, p.day === t ? p.answered : 0);
  const pool = roundPool(BANK, LEVEL_BANK, p);
  const due = dueCount(pool, p, t);
  const unseen = BANK.filter((q) => !p.cards[q.id]).length;
  const atRisk = streak > 0 && !doneToday;
  const tasks = todo(p, t, LESSONS, FLASHCARDS, misses(pool, p).length);
  const lastExam = p.exams[0];
  const T = STR[p.lang];

  return (
    <ScrollView contentContainerStyle={s.page}>
      <View style={{ alignItems: 'center', marginTop: 4 }}>
        <Banner text="CCA QUEST" />
        <Txt size={11} color={c.muted}>
          {T.tagline}
        </Txt>
      </View>
      {update !== null && (
        <Pressable onPress={onUpdate} style={({ pressed }) => [s.update, pressed && { backgroundColor: '#2A2110' }]}>
          <Txt bold size={13} color={c.amber}>
            {T.updateBanner(update)}
          </Txt>
        </Pressable>
      )}
      <Typer text="$ cca-quest status" bold color={c.green} />

      <Panel title={T.player}>
        <Txt bold size={16}>
          lvl {pad2(lvl.n)} <Txt color={c.muted}>::</Txt> <Txt color={c.green}>{handle(lvl.title)}</Txt>
        </Txt>
        <Row k={T.xp}>
          <Bar value={lvl.to ? (p.xp - lvl.from) / (lvl.to - lvl.from) : 1} color={c.amber} width={14} />
          <Txt color={c.muted}> {lvl.to ? `${p.xp}/${lvl.to}` : `${p.xp} ${T.max}`}</Txt>
        </Row>
        <Row k={T.streak}>
          <Pulse on={atRisk}>
            <Txt bold color={streak > 0 ? c.amber : c.muted}>
              {pad2(streak)}d{streak > 0 ? ' ▲' : ''}
            </Txt>
          </Pulse>
          <Txt color={c.muted}>  {T.best} {pad2(p.best)}d</Txt>
        </Row>
        <Row k={T.today}>
          <Bar value={todayCount / GOAL} width={GOAL} color={doneToday ? c.green : c.amber} />
          <Txt color={doneToday ? c.green : c.muted}> {todayCount}/{GOAL}{doneToday ? T.goalTick : ''}</Txt>
        </Row>
        {atRisk && (
          <Txt color={c.amber} size={12} style={{ marginTop: 6 }}>
            {T.atRisk}
          </Txt>
        )}
      </Panel>

      <View style={{ gap: 6, marginTop: 6 }}>
        <Cmd>cca-quest next</Cmd>
        <Txt color={c.muted}>
          {'> '}
          <Txt color={due > 0 ? c.amber : c.muted}>{T.dueWord(due)}</Txt>
          {T.restLine(unseen, BANK.length)}
        </Txt>
        <Btn kind="primary" label={doneToday ? T.bonusRound : T.startRound} onPress={onPlay} />
      </View>

      <Panel title={T.todo}>
        {tasks.map((task) => {
          const done = task.kind === 'round' && task.done;
          const lesson = task.kind === 'lesson' ? LESSONS.find((l) => l.ts === task.ts) : undefined;
          const text =
            task.kind === 'round'
              ? task.done
                ? T.roundSafe
                : T.roundLeft(task.left)
              : task.kind === 'lesson'
                ? `man ${task.ts} · ${lesson?.title[p.lang] ?? ''}`
                : task.kind === 'cards'
                  ? T.reviewCards(task.due)
                  : T.missesTodo(task.count);
          const go =
            task.kind === 'round' ? onPlay : task.kind === 'lesson' ? () => onLesson(task.ts) : task.kind === 'cards' ? onCards : onMisses;
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
              ? T.examDraftSub(T.examLabel(p.examDraft.label), p.examDraft.picked.filter((x) => x !== null).length, p.examDraft.ids.length)
              : T.examSub(lastExam ? Math.round((100 * lastExam.right) / lastExam.total) : null)}
          </Txt>
        </View>
        <Txt bold color={c.amber}>
          ›
        </Txt>
      </Pressable>

      <Pressable onPress={onLive} style={({ pressed }) => [s.exam, { borderColor: c.cyan, marginTop: 0 }, pressed && { backgroundColor: c.greenBg }]}>
        <View style={{ flex: 1 }}>
          <Txt bold color={c.cyan}>
            $ cca-quest live
          </Txt>
          <Txt size={12} color={c.muted}>
            {T.liveSub}
          </Txt>
        </View>
        <Txt bold color={c.cyan}>
          ›
        </Txt>
      </Pressable>

      <Panel title={T.activity}>
        <Heatmap weeks={heatmap(p, t, 16)} labels={T.days} less={T.less} more={T.more} />
      </Panel>

      <Panel title={T.mastery}>
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
            {T.ready}
          </Txt>
          <Bar value={readiness(QUESTIONS, p)} width={10} />
          <Txt bold> {String(Math.round(readiness(QUESTIONS, p) * 100)).padStart(3)}%</Txt>
        </View>
        <Txt size={11} color={c.muted} style={{ marginTop: 6 }}>
          {T.masteryNote}
        </Txt>
      </Panel>

      <RankPanels p={p} onProfile={onProfile} />

      <Txt size={11} color={c.muted} style={{ textAlign: 'center', marginTop: 4 }}>
        {T.footer(BANK.length, LESSONS.length, FLASHCARDS.length, TERMS.length)}
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

export function RoundView({
  round,
  lang,
  onAnswer,
  onNext,
  onQuit,
  onLesson,
}: {
  round: Round;
  lang: Lang;
  onAnswer: (picked: number) => void; // índice original, o máscara en las de respuesta múltiple
  onNext: () => void;
  onQuit: () => void;
  onLesson: (ts: string) => void;
}) {
  const { q, order } = round.items[round.i];
  const answered = round.picked !== null;
  const multi = isMulti(q);
  const rights = rightOf(q);
  useGuard(!answered);
  // En las de respuesta múltiple se marcan las opciones y luego se comprueba (App le pone key por pregunta).
  const [marked, setMarked] = useState<number[]>([]);
  const chosen = answered ? pickedOf(q, round.picked!) : marked;
  const ok = answered && isRight(q, round.picked);
  const tap = (orig: number) => {
    if (!multi) onAnswer(orig);
    else setMarked((cur) => (cur.includes(orig) ? cur.filter((x) => x !== orig) : [...cur, orig]));
  };
  const dom = DOMAINS.find((d) => d.id === q.domain)!;
  const last = round.i + 1 === round.items.length;
  const hasLesson = q.ts && LESSONS.some((l) => l.ts === q.ts);
  const T = STR[lang];
  const tx = inLang(q, lang);

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
          <Rich text={tx.scenario} size={15} />
        </Panel>
        <Txt bold size={15} color={c.green}>
          ? {tx.ask}
        </Txt>
        {multi && <Tag label={T.selectN(rights.length)} color={c.cyan} />}

        <View style={{ gap: 8 }}>
          {order.map((orig, pos) => {
            const right = rights.includes(orig);
            const mine = chosen.includes(orig);
            const mark = !answered ? (mine ? '■' : 'ABCDE'[pos]) : right ? '✓' : mine ? '✗' : 'ABCDE'[pos];
            const tone = !answered ? (mine ? c.cyan : c.lineHi) : right ? c.green : mine ? c.red : c.line;
            return (
              <Pressable
                key={pos}
                disabled={answered}
                onPress={() => tap(orig)}
                style={({ pressed }) => [
                  s.opt,
                  { borderColor: tone },
                  !answered && mine && { backgroundColor: c.greenBg },
                  answered && right && { backgroundColor: c.greenBg },
                  answered && mine && !right && { backgroundColor: c.redBg },
                  answered && !right && !mine && { opacity: 0.6 },
                  pressed && { backgroundColor: c.greenBg },
                ]}
              >
                <View style={s.optRow}>
                  <Txt bold color={answered && right ? c.green : answered && mine ? c.red : mine ? c.cyan : c.muted}>
                    [{mark}]
                  </Txt>
                  <Rich text={tx.options[orig]} style={{ flex: 1 }} />
                </View>
                {answered && (
                  <Rich text={`└ ${tx.why[orig]}`} size={12} color={right ? c.text : c.muted} style={{ marginLeft: 36 }} />
                )}
              </Pressable>
            );
          })}
        </View>
        {multi && !answered && (
          <Btn kind="primary" label={T.checkPicks(marked.length, rights.length)} disabled={marked.length !== rights.length} onPress={() => onAnswer(maskOf(marked))} />
        )}

        {answered && (
          <Panel title={T.remember} color={c.amber} titleColor={c.amber}>
            <Rich text={tx.rule} bold color={c.amber} />
          </Panel>
        )}
        {/* Antes de contestar, para entender la pregunta (sin la respuesta); después, para entender la corrección. */}
        <AskClaude q={q} lang={lang} order={order} picked={answered ? round.picked : undefined} reveal={answered} />
        {answered && hasLesson && <Btn small label={T.readLesson(q.ts!)} onPress={() => onLesson(q.ts!)} />}
      </ScrollView>

      {answered && (
        <View style={[s.bottom, { borderTopColor: ok ? c.green : c.red }]}>
          <Txt bold size={16} color={ok ? c.green : c.red}>
            {'> '}
            {ok ? T.praise[Math.min(round.combo, T.praise.length) - 1] : T.wrong}
            {ok && round.combo >= 2 ? `  combo x${round.combo}` : ''}
          </Txt>
          <Btn kind={ok ? 'good' : 'amber'} label={last ? T.results : T.continue} onPress={onNext} />
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
  const T = STR[p.lang];
  const banner = perfect ? T.perfect : T.complete;
  const line = '═'.repeat(banner.length + 2);

  return (
    <ScrollView contentContainerStyle={[s.page, { flexGrow: 1, justifyContent: 'center' }]}>
      <Typer text="$ cca-quest round --summary" bold color={c.green} />
      <BounceIn>
        <Txt bold size={18} color={perfect ? c.amber : c.green} style={{ textAlign: 'center', marginVertical: 10 }}>
          {`╔${line}╗\n║ ${banner} ║\n╚${line}╝`}
        </Txt>
      </BounceIn>
      <Panel title={T.result}>
        <Row k={T.correct}>
          <Txt bold color={perfect ? c.green : c.text}>
            {round.right}/{total}
          </Txt>
          <Txt color={c.muted}>  </Txt>
          <Bar value={round.right / total} width={total} />
        </Row>
        <Row k={T.xp}>
          <Txt bold color={c.amber}>
            +{round.xp}
          </Txt>
        </Row>
        <Row k={T.combo}>
          <Txt bold>x{round.best}</Txt>
        </Row>
        <Row k={T.streak}>
          <Txt bold color={c.amber}>
            {pad2(streak)}d{round.goalMet ? T.goalDone : ''}
          </Txt>
        </Row>
      </Panel>
      {round.levelUp && (
        <BounceIn delay={400}>
          <Panel title={T.levelUp} color={c.amber} titleColor={c.amber}>
            <Txt bold size={16} color={c.amber}>
              lvl {pad2(round.levelUp.n)} :: {handle(round.levelUp.title)}
            </Txt>
          </Panel>
        </BounceIn>
      )}
      {(() => {
        const missed = round.items.flatMap((it, k) => (round.picks[k] !== undefined && !isRight(it.q, round.picks[k]) ? [{ q: it.q, picked: round.picks[k] }] : []));
        return missed.length === 0 ? (
          <Txt size={12} color={c.green} style={{ marginTop: 8 }}>
            {T.noRoundMisses}
          </Txt>
        ) : (
          <View style={{ gap: 10, marginTop: 8 }}>
            <Cmd>{T.roundMisses(missed.length)}</Cmd>
            {missed.map((m) => (
              <MissCard key={m.q.id} q={m.q} picked={m.picked} lang={p.lang} T={T} />
            ))}
            <Txt size={12} color={c.muted}>
              {T.missedBack}
            </Txt>
          </View>
        );
      })()}
      <View style={{ gap: 10, marginTop: 16 }}>
        <Btn kind="primary" label={T.anotherRound} onPress={onAgain} />
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
  update: { borderWidth: 1, borderColor: c.amber, borderRadius: 4, padding: 12 },
  todo: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  exam: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: c.amber, borderRadius: 4, padding: 14, marginTop: 4 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.line },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  opt: { borderWidth: 1, borderRadius: 3, padding: 12, gap: 6, backgroundColor: c.panel },
  optRow: { flexDirection: 'row', gap: 10 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: c.panel, borderTopWidth: 2, padding: 16, gap: 10 },
});
