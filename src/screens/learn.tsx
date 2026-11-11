import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { claudeUrl, selectionPrompt } from '../ask.ts';
import { EXTRAS } from '../extras.ts';
import { DOMAINS, mastery, type Lesson, type Progress, type Term } from '../game.ts';
import { TERMS } from '../glossary.ts';
import { STR } from '../i18n.ts';
import { LESSONS } from '../lessons.ts';
import { QUESTIONS } from '../questions.ts';
import { Bar, Btn, Cmd, Panel, Rich, TermContext, Txt, Typer } from '../term.tsx';
import { c, domainColor, font, themed } from '../theme.ts';
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
  // Lo que se le cuenta a Claude de la lección al preguntar por un trozo (con la explicación sencilla, si la hay).
  const title = `${lesson.ts} ${lesson.title[L]}`;
  const about = [lesson.tldr[L], ...lesson.ideas.map((x) => `- ${x[L]}`), ...lesson.traps.map((x) => `✗ ${x[L]}`), lesson.example[L]];

  return (
    <View style={{ flex: 1 }}>
      <TermContext.Provider value={terms}>
        <LessonSelection key={lesson.ts} lang={L} title={title} lines={extra ? [extra.plain[L], ...about] : about}>
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
        </LessonSelection>
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

const s = themed(() =>
  StyleSheet.create({
    page: { padding: 16, gap: 6 },
    head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: c.line },
    item: { flexDirection: 'row', gap: 10 },
    example: { borderLeftWidth: 2, borderLeftColor: c.lineHi, paddingLeft: 10 },
    plain: { borderLeftWidth: 2, borderLeftColor: c.amber, paddingLeft: 10 },
    sheetBack: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', padding: 16 },
  }),
);

/**
 * En la web, al seleccionar un trozo de la lección sale al lado un cuadro para preguntarle a Claude
 * por él, con la lección de contexto. La duda es opcional. En la app del móvil no cambia nada.
 */
function LessonSelection({ children, lang, title, lines }: { children: React.ReactNode; lang: Progress['lang']; title: string; lines: string[] }) {
  const root = useRef<HTMLDivElement>(null);
  const popup = useRef<HTMLFormElement>(null);
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  const [question, setQuestion] = useState('');
  const es = lang === 'es';

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let dragging = false;
    let timer: ReturnType<typeof setTimeout>;
    // Mientras se escribe la duda, el foco está en el cuadro: la selección no se toca.
    const typing = () => Boolean(popup.current?.contains(document.activeElement));
    const read = () => {
      if (dragging || typing()) return;
      const sel = window.getSelection();
      const inside = sel && !sel.isCollapsed && root.current?.contains(sel.anchorNode) && root.current.contains(sel.focusNode);
      const text = inside ? sel.toString().trim() : '';
      if (!sel || !text) return setSelection(null);
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      const width = Math.min(340, window.innerWidth - 24);
      setSelection({
        text,
        x: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
        y: Math.max(12, Math.min(rect.bottom + 10, window.innerHeight - 130)),
      });
      setQuestion('');
    };
    // Se espera a que acabe de seleccionar (al soltar, o un momento sin cambios con el teclado).
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(read, 300);
    };
    const down = (e: Event) => {
      if (e.target instanceof Node && popup.current?.contains(e.target)) return;
      dragging = true;
      setSelection(null);
    };
    const up = () => {
      dragging = false;
      schedule();
    };
    const hide = () => {
      if (!typing()) setSelection(null);
    };
    const escape = (e: Event) => {
      if ((e as KeyboardEvent).key === 'Escape') setSelection(null);
    };
    const listeners: [EventTarget, string, EventListener, boolean][] = [
      [document, 'pointerdown', down, false],
      [document, 'pointerup', up, false],
      [document, 'pointercancel', up, false],
      [document, 'selectionchange', schedule, false],
      [document, 'keydown', escape, false],
      [window, 'resize', hide, false],
      [document, 'scroll', hide, true],
    ];
    for (const [target, type, fn, capture] of listeners) target.addEventListener(type, fn, capture);
    return () => {
      clearTimeout(timer);
      for (const [target, type, fn, capture] of listeners) target.removeEventListener(type, fn, capture);
    };
  }, []);

  if (Platform.OS !== 'web') return <>{children}</>;
  const ask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selection) return;
    window.open(claudeUrl(selectionPrompt(lang, title, selection.text, question, lines)), '_blank', 'noopener');
    setSelection(null);
  };
  const text = { fontFamily: font.regular, fontSize: 13 };
  const button = { ...text, background: c.bg, color: c.cyan, border: `1px solid ${c.cyan}`, borderRadius: 3, padding: '8px 12px', cursor: 'pointer' };
  return (
    <div ref={root} data-lesson-copy="" style={{ display: 'flex', flex: 1, minHeight: 0, flexDirection: 'column' }}>
      {children}
      {selection && (
        <form
          ref={popup}
          aria-label={es ? 'Preguntar sobre el fragmento' : 'Ask about selected text'}
          onSubmit={ask}
          style={{
            position: 'fixed',
            left: selection.x,
            top: selection.y,
            width: 'min(340px, calc(100vw - 24px))',
            boxSizing: 'border-box',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: 12,
            background: c.panel,
            border: `1px solid ${c.cyan}`,
            borderRadius: 5,
            boxShadow: '0 4px 20px #0006',
          }}
        >
          <input
            aria-label={es ? 'Pregunta opcional' : 'Optional question'}
            placeholder={es ? 'Tu duda (opcional)…' : 'Your question (optional)…'}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            style={{ ...text, width: '100%', boxSizing: 'border-box', padding: 8, background: c.bg, color: c.text, border: `1px solid ${c.lineHi}` }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <button type="submit" style={button}>
              {STR[lang].askClaude} ↗
            </button>
            <button
              type="button"
              aria-label={es ? 'Cerrar' : 'Close'}
              onClick={() => setSelection(null)}
              style={{ ...button, color: c.muted, borderColor: c.lineHi }}
            >
              ×
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
