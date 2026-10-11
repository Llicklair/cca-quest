import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { DOMAINS, mastery, type Lang, type Lesson, type Progress } from '../game.ts';
import { LESSONS } from '../lessons.ts';
import { QUESTIONS } from '../questions.ts';
import { Bar, Btn, Cmd, LangToggle, Rich, Txt, Typer } from '../term.tsx';
import { c, domainColor } from '../theme.ts';

// --- Índice de lecciones ---

export function LessonList({
  p,
  onOpen,
  onLang,
}: {
  p: Progress;
  onOpen: (ts: string) => void;
  onLang: (l: Lang) => void;
}) {
  const read = Object.keys(p.lessons).length;
  return (
    <ScrollView contentContainerStyle={s.page}>
      <View style={s.head}>
        <Typer text="$ ls ~/lessons" bold color={c.green} />
        <LangToggle lang={p.lang} onChange={onLang} />
      </View>
      <Txt color={c.muted} size={12}>
        {'> '}
        {read}/{LESSONS.length} read · one lesson per task statement of the official guide
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

export function LessonView({
  lesson,
  p,
  onBack,
  onRead,
  onPractice,
  onLang,
}: {
  lesson: Lesson;
  p: Progress;
  onBack: () => void;
  onRead: () => void;
  onPractice: () => void;
  onLang: (l: Lang) => void;
}) {
  const L = p.lang;
  const domain = DOMAINS.find((d) => lesson.ts.startsWith(`${d.n}.`))!;
  const nQs = QUESTIONS.filter((q) => q.ts === lesson.ts).length;
  const read = p.lessons[lesson.ts];

  return (
    <ScrollView contentContainerStyle={s.page}>
      <View style={s.head}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Txt bold color={c.muted}>
            [‹ ls]
          </Txt>
        </Pressable>
        <LangToggle lang={L} onChange={onLang} />
      </View>
      <Cmd>man {lesson.ts}</Cmd>

      <Section name="NAME">
        <Rich text={`${lesson.ts} — ${lesson.title[L]}`} bold color={domainColor[domain.id]} />
        <Txt size={12} color={c.muted}>
          d{domain.n} {domain.name.toLowerCase()}
        </Txt>
      </Section>

      <Section name="TL;DR">
        <Rich text={lesson.tldr[L]} size={15} />
      </Section>

      <Section name={L === 'es' ? 'IDEAS CLAVE' : 'KEY IDEAS'}>
        {lesson.ideas.map((idea, i) => (
          <View key={i} style={s.item}>
            <Txt bold color={c.green}>
              ›
            </Txt>
            <Rich text={idea[L]} style={{ flex: 1 }} />
          </View>
        ))}
      </Section>

      <Section name={L === 'es' ? 'TRAMPAS' : 'TRAPS'}>
        {lesson.traps.map((trap, i) => (
          <View key={i} style={s.item}>
            <Txt bold color={c.red}>
              ✗
            </Txt>
            <Rich text={trap[L]} style={{ flex: 1 }} />
          </View>
        ))}
      </Section>

      <Section name={L === 'es' ? 'EJEMPLO' : 'EXAMPLE'}>
        <View style={s.example}>
          <Rich text={lesson.example[L]} color={c.text} />
        </View>
      </Section>

      <View style={{ gap: 10, marginTop: 10 }}>
        {read ? (
          <Txt size={12} color={c.green}>
            {'// read on '}
            {read}
          </Txt>
        ) : (
          <Btn kind="amber" label={L === 'es' ? '✓ LEÍDA  +15 XP' : '✓ MARK AS READ  +15 XP'} onPress={onRead} />
        )}
        {nQs > 0 && <Btn kind="primary" label={`▶ PRACTICE ${lesson.ts} · ${Math.min(nQs, 5)} q`} onPress={onPractice} />}
      </View>
    </ScrollView>
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
});
