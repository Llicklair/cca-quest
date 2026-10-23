import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { EXTRAS } from '../extras.ts';
import { DOMAINS, mastery, type Lesson, type Progress, type Term } from '../game.ts';
import { TERMS } from '../glossary.ts';
import { STR } from '../i18n.ts';
import { LESSONS } from '../lessons.ts';
import { QUESTIONS } from '../questions.ts';
import { Bar, Btn, Cmd, Panel, Rich, TermContext, Txt, Typer } from '../term.tsx';
import { c, domainColor } from '../theme.ts';
import { SeeIt, TryIt } from './extras.tsx';
import { AskConcept } from './misses.tsx';

// --- Índice de lecciones ---

export function LessonList({
  p,
  onOpen,
}: {
  p: Progress;
  onOpen: (ts: string) => void;
}) {
  const read = Object.keys(p.lessons).length;
  const T = STR[p.lang];
  return (
    <ScrollView contentContainerStyle={s.page}>
      <View style={s.head}>
        <Typer text="$ ls ~/lessons" bold color={c.green} />
      </View>
      <Txt color={c.muted} size={12}>
        {'> '}
        {T.lessonsLine(read, LESSONS.length)}
      </Txt>
      <View style={{ marginTop: 6 }}>
        <Bar value={LESSONS.length ? read / LESSONS.length : 0} width={24} />
      </View>

      {DOMAINS.map((d) => {
        const lessons = LESSONS.filter((l) => l.ts.startsWith(`${d.n}.`));
        if (lessons.length === 0) return null;
        return (
          <View key={d.id} style={{ marginTop: 14 }}>
            <Txt bold color={domainColor[d.id]}>
              d{d.n}/ {d.name.toLowerCase()} <Txt color={c.muted}>w{d.weight}</Txt>
            </Txt>
            {lessons.map((l) => {
              const done = Boolean(p.lessons[l.ts]);
              const hasQs = QUESTIONS.some((q) => q.ts === l.ts);
              return (
                <Pressable key={l.ts} onPress={() => onOpen(l.ts)} style={({ pressed }) => [s.row, pressed && { backgroundColor: c.greenBg }]}>
                  <Txt color={done ? c.green : c.muted} bold>
                    {done ? '✓' : '·'}
                  </Txt>
                  <Txt bold color={c.text}>
                    {l.ts}
                  </Txt>
                  <Rich text={l.title[p.lang]} style={{ flex: 1 }} color={done ? c.muted : c.text} />
                  {hasQs && <Bar value={mastery(QUESTIONS, p, undefined, l.ts)} width={4} color={domainColor[d.id]} />}
                </Pressable>
              );
            })}
          </View>
        );
      })}
    </ScrollView>
  );
}

// --- Una lección, como una página de man ---

// Los términos del glosario se pueden tocar dentro de la lección para ver qué significan.
const GLOSSARY = new Map(TERMS.map((t) => [t.term.toLowerCase(), t]));
const termOf = (code: string) => GLOSSARY.get(code.replace(/^"|"$/g, '').toLowerCase());

export function LessonView({
  lesson,
  p,
  onBack,
  onRead,
  onPractice,
}: {
  lesson: Lesson;
  p: Progress;
  onBack: () => void;
  onRead: () => void;
  onPractice: () => void;
}) {
  const L = p.lang;
  const domain = DOMAINS.find((d) => lesson.ts.startsWith(`${d.n}.`))!;
  const nQs = QUESTIONS.filter((q) => q.ts === lesson.ts).length;
  const read = p.lessons[lesson.ts];
  const extra = EXTRAS.find((e) => e.ts === lesson.ts);
  const T = STR[L];
  const [term, setTerm] = useState<Term | null>(null);
  const terms = { isTerm: (code: string) => Boolean(termOf(code)), open: (code: string) => setTerm(termOf(code) ?? null) };

  return (
    <View style={{ flex: 1 }}>
      <TermContext.Provider value={terms}>
        <ScrollView contentContainerStyle={s.page}>
          <View style={s.head}>
            <Pressable onPress={onBack} hitSlop={12}>
              <Txt bold color={c.muted}>
                [‹ ls]
              </Txt>
            </Pressable>
          </View>
          <Cmd>man {lesson.ts}</Cmd>

          <Section name="NAME">
            <Rich text={`${lesson.ts} — ${lesson.title[L]}`} bold color={domainColor[domain.id]} />
            <Txt size={12} color={c.muted}>
              d{domain.n} {domain.name.toLowerCase()}
            </Txt>
          </Section>

          {extra && (
            <Section name={T.sections.plain}>
              <View style={s.plain}>
                <Rich text={extra.plain[L]} size={15} />
              </View>
              <Txt size={11} color={c.muted}>
                {T.termHint}
              </Txt>
            </Section>
          )}

          <Section name={T.sections.tldr}>
            <Rich text={lesson.tldr[L]} size={15} />
          </Section>

          {extra && (
            <Section name={T.sections.see}>
              <SeeIt key={lesson.ts} v={extra.see} lang={L} T={T} />
            </Section>
          )}

          <Section name={T.sections.ideas}>
            {lesson.ideas.map((idea, i) => (
              <View key={i} style={s.item}>
                <Txt bold color={c.green}>
                  ›
                </Txt>
                <Rich text={idea[L]} style={{ flex: 1 }} />
              </View>
            ))}
          </Section>

          <Section name={T.sections.traps}>
            {lesson.traps.map((trap, i) => (
              <View key={i} style={s.item}>
                <Txt bold color={c.red}>
                  ✗
                </Txt>
                <Rich text={trap[L]} style={{ flex: 1 }} />
              </View>
            ))}
          </Section>

          <Section name={T.sections.example}>
            <View style={s.example}>
              <Rich text={lesson.example[L]} color={c.text} />
            </View>
          </Section>

          {extra && (
            <Section name={T.sections.drill}>
              <TryIt key={lesson.ts} d={extra.drill} lang={L} T={T} />
            </Section>
          )}

          <View style={{ gap: 10, marginTop: 10 }}>
            {read ? (
              <Txt size={12} color={c.green}>
                {T.readOn(read)}
              </Txt>
            ) : (
              <Btn kind="amber" label={T.markRead} onPress={onRead} />
            )}
            {nQs > 0 && <Btn kind="primary" label={T.practice(lesson.ts, Math.min(nQs, 5))} onPress={onPractice} />}
            <AskConcept
              lang={L}
              title={`${lesson.ts} ${lesson.title[L]}`}
              lines={[lesson.tldr[L], ...lesson.ideas.map((x) => `- ${x[L]}`), ...lesson.traps.map((x) => `✗ ${x[L]}`), lesson.example[L]]}
            />
          </View>
        </ScrollView>
      </TermContext.Provider>
      {term && (
        <Pressable style={s.sheetBack} onPress={() => setTerm(null)}>
          <Panel title={term.term} color={domainColor[term.domain]} titleColor={domainColor[term.domain]}>
            <Rich text={term.def[L]} />
            <View style={{ marginTop: 10 }}>
              <AskConcept inline lang={L} title={term.term} lines={[term.def[L]]} />
            </View>
            <Txt size={12} bold color={c.muted} style={{ marginTop: 10, textAlign: 'right' }}>
              {T.close}
            </Txt>
          </Panel>
        </Pressable>
      )}
    </View>
  );
}

function Section({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 8, gap: 6 }}>
      <Txt bold color={c.text}>
        {name}
      </Txt>
      <View style={{ paddingLeft: 14, gap: 8 }}>{children}</View>
    </View>
  );
}

const s = StyleSheet.create({
  page: { padding: 16, gap: 6 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: c.line },
  item: { flexDirection: 'row', gap: 10 },
  example: { borderLeftWidth: 2, borderLeftColor: c.lineHi, paddingLeft: 10 },
  plain: { borderLeftWidth: 2, borderLeftColor: c.amber, paddingLeft: 10 },
  sheetBack: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', padding: 16 },
});
