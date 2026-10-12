import { ScrollView, StyleSheet, View } from 'react-native';

import { misses, type Lang, type Progress, type Question } from '../game.ts';
import { STR, type Strings } from '../i18n.ts';
import { QUESTIONS } from '../questions.ts';
import { QUESTIONS_ES } from '../questions-es.ts';
import { Btn, Cmd, Panel, Rich, Txt, Typer } from '../term.tsx';
import { c, domainColor } from '../theme.ts';

/** La pregunta en el idioma elegido (las opciones y explicaciones van en el mismo orden). */
export const inLang = (q: Question, lang: Lang) => (lang === 'es' && QUESTIONS_ES[q.id]) || q;

/** Una pregunta fallada: escenario, pregunta, lo que contestaste (rojo), la buena (verde) y por qué. */
export function MissCard({ q, picked, lang, T }: { q: Question; picked: number | null | undefined; lang: Lang; T: Strings }) {
  const tx = inLang(q, lang);
  const scenario = tx.scenario.length > 160 ? `${tx.scenario.slice(0, 160).trimEnd()}…` : tx.scenario;
  return (
    <Panel color={c.line}>
      <Txt size={11} bold color={domainColor[q.domain]}>
        {q.ts ? `task ${q.ts}` : q.domain}
      </Txt>
      <Rich text={scenario} size={12} color={c.muted} style={{ marginTop: 2 }} />
      <Rich text={tx.ask} bold color={c.green} style={{ marginTop: 4 }} />
      {picked !== undefined && (
        <Rich text={`- ${picked === null ? T.noAnswer : tx.options[picked]}`} size={13} color={c.red} style={{ marginTop: 6 }} />
      )}
      <Rich text={`+ ${tx.options[q.answer]}`} size={13} color={c.green} style={{ marginTop: 4 }} />
      <Rich text={`└ ${tx.why[q.answer]}`} size={12} color={c.muted} style={{ marginTop: 4 }} />
      <Rich text={`// ${tx.rule}`} size={12} color={c.amber} style={{ marginTop: 4 }} />
    </Panel>
  );
}

/** Todas las preguntas falladas la última vez que salieron, para repasarlas cuando quieras. */
export function Misses({ p, onPractice, onBack }: { p: Progress; onPractice: (qs: Question[]) => void; onBack: () => void }) {
  const T = STR[p.lang];
  const list = misses(QUESTIONS, p);
  return (
    <ScrollView contentContainerStyle={s.page}>
      <Typer text="$ git log --failed" bold color={c.green} />
      <Txt color={c.muted}>
        {'> '}
        {list.length === 0 ? T.noMissesLeft : T.missesCount(list.length)}
      </Txt>
      {list.length > 0 && <Btn kind="amber" label={T.practiceMisses(Math.min(5, list.length))} onPress={() => onPractice(list)} />}
      {list.map((q) => (
        <MissCard key={q.id} q={q} picked={p.cards[q.id]?.last} lang={p.lang} T={T} />
      ))}
      <View style={{ marginTop: 6 }}>
        <Btn label="$ cd ~" onPress={onBack} />
      </View>
      {list.length > 0 && (
        <Cmd size={12}>
          <Txt size={12} color={c.muted}>
            {T.missesHint}
          </Txt>
        </Cmd>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { padding: 16, gap: 12 },
});
