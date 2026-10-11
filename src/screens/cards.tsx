import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import * as feel from '../feel.ts';
import { DOMAINS, dayKey, deckDue, deckSession, MASTERED, type Flashcard, type Level, type Progress } from '../game.ts';
import { FLASHCARDS } from '../flashcards.ts';
import { STR } from '../i18n.ts';
import { Bar, Btn, Cmd, Panel, Pop, Rich, Tag, Txt, Typer } from '../term.tsx';
import { c, domainColor } from '../theme.ts';

type Run = { cards: Flashcard[]; i: number; flipped: boolean; knew: number; again: number; xp: number; gain: number };

export function Cards({
  p,
  onReview,
  onRunning,
}: {
  p: Progress;
  onReview: (id: string, knew: boolean) => { gained: number; levelUp: Level | null };
  onRunning: (running: boolean) => void;
}) {
  const [run, setRun] = useState<Run | null>(null);
  const today = dayKey(new Date());
  const L = p.lang;
  const T = STR[L];

  const start = () => {
    feel.tap();
    setRun({ cards: deckSession(FLASHCARDS, p, today), i: 0, flipped: false, knew: 0, again: 0, xp: 0, gain: 0 });
    onRunning(true);
  };
  const stop = () => {
    setRun(null);
    onRunning(false);
  };

  if (run && run.i < run.cards.length) {
    const card = run.cards[run.i];
    const domain = DOMAINS.find((d) => card.ts.startsWith(`${d.n}.`))!;
    const grade = (knew: boolean) => {
      const { gained } = onReview(card.id, knew);
      if (knew) feel.good();
      else feel.tap();
      setRun({ ...run, i: run.i + 1, flipped: false, knew: run.knew + (knew ? 1 : 0), again: run.again + (knew ? 0 : 1), xp: run.xp + gained, gain: gained });
    };
    return (
      <View style={s.fill}>
        <View style={s.top}>
          <Pressable onPress={stop} hitSlop={12}>
            <Txt bold color={c.muted}>
              [x]
            </Txt>
          </Pressable>
          <Txt bold>
            {T.card} {run.i + 1}/{run.cards.length}
          </Txt>
          <Bar value={run.i / run.cards.length} width={10} />
          <View style={{ flex: 1 }} />
        </View>
        <ScrollView contentContainerStyle={[s.page, { flexGrow: 1 }]}>
          <Pressable onPress={() => !run.flipped && setRun({ ...run, flipped: true })} style={{ flexGrow: 1 }}>
            <Panel title={`d${domain.n} · task ${card.ts}`} color={domainColor[domain.id]} titleColor={domainColor[domain.id]} style={{ minHeight: 160 }}>
              <Rich text={card.front[L]} size={18} bold />
              {run.flipped ? (
                <View style={{ marginTop: 14, gap: 10 }}>
                  <Txt color={c.lineHi}>{'─'.repeat(28)}</Txt>
                  <Rich text={card.back[L]} size={15} />
                </View>
              ) : (
                <Txt color={c.muted} size={12} style={{ marginTop: 18 }}>
                  {T.flipHint}
                </Txt>
              )}
            </Panel>
          </Pressable>
        </ScrollView>
        <View style={s.bottom}>
          {run.flipped ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Btn kind="danger" label={T.again} onPress={() => grade(false)} style={{ flex: 1 }} />
              <Btn kind="good" label={T.knew} onPress={() => grade(true)} style={{ flex: 1 }} />
            </View>
          ) : (
            <Btn kind="primary" label={T.flip} onPress={() => setRun({ ...run, flipped: true })} />
          )}
        </View>
        {run.i > 0 && <Pop key={`pop-${run.i}`} text={`+${run.gain} XP`} color={c.amber} />}
      </View>
    );
  }

  if (run) {
    return (
      <ScrollView contentContainerStyle={[s.page, { flexGrow: 1, justifyContent: 'center' }]}>
        <Typer text="$ cards --summary" bold color={c.green} />
        <Panel title={T.deckDone}>
          <Txt bold color={c.green}>
            {T.knewN(run.knew)}
            <Txt color={c.muted}> · </Txt>
            <Txt color={c.amber}>{T.againN(run.again)}</Txt>
          </Txt>
          <Txt bold color={c.amber}>
            +{run.xp} xp
          </Txt>
          <Txt size={12} color={c.muted} style={{ marginTop: 6 }}>
            {T.missedTomorrow}
          </Txt>
        </Panel>
        <View style={{ gap: 10, marginTop: 14 }}>
          <Btn kind="primary" label={T.anotherDeck} onPress={start} />
          <Btn label="$ cd ~/cards" onPress={stop} />
        </View>
      </ScrollView>
    );
  }

  const due = deckDue(FLASHCARDS, p, today);
  const seen = FLASHCARDS.filter((f) => p.cards[f.id]).length;
  const mastered = FLASHCARDS.filter((f) => (p.cards[f.id]?.box ?? 0) >= MASTERED).length;

  return (
    <ScrollView contentContainerStyle={s.page}>
      <View style={s.head}>
        <Typer text="$ cards --status" bold color={c.green} />
      </View>
      <Panel title={T.deck}>
        <Txt>
          <Txt color={due > 0 ? c.amber : c.muted} bold>
            {T.dueWord(due)}
          </Txt>
          <Txt color={c.muted}>{T.deckLine(FLASHCARDS.length - seen, mastered, FLASHCARDS.length)}</Txt>
        </Txt>
        <View style={{ marginTop: 8 }}>
          <Bar value={FLASHCARDS.length ? mastered / FLASHCARDS.length : 0} width={24} />
        </View>
      </Panel>
      <Btn kind="primary" label={T.startDeck(Math.min(10, FLASHCARDS.length))} onPress={start} disabled={FLASHCARDS.length === 0} />

      <Panel title={T.byDomain}>
        {DOMAINS.map((d) => {
          const deck = FLASHCARDS.filter((f) => f.ts.startsWith(`${d.n}.`));
          const m = deck.length ? deck.reduce((n, f) => n + (p.cards[f.id]?.box ?? 0), 0) / (deck.length * MASTERED) : 0;
          return (
            <View key={d.id} style={s.domRow}>
              <View style={{ width: 92 }}>
                <Tag label={`d${d.n} ${deck.length}`} color={domainColor[d.id]} />
              </View>
              <Bar value={m} width={12} color={domainColor[d.id]} />
            </View>
          );
        })}
      </Panel>
      <Cmd size={12}>
        <Txt size={12} color={c.muted}>
          {T.gradeHint}
        </Txt>
      </Cmd>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: c.bg },
  page: { padding: 16, gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.line },
  bottom: { padding: 16, borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.panel },
  domRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
});
