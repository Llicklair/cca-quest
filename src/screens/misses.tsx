import { useState } from 'react';
import { Platform, ScrollView, Share, StyleSheet, View } from 'react-native';

import { claudePrompt, claudeUrl, conceptPrompt } from '../ask.ts';
import { BANK, BANK_ES, LEVEL_BANK } from '../bank.ts';
import { misses, pickedOf, rightOf, roundPool, type Lang, type Progress, type Question } from '../game.ts';
import { STR, type Strings } from '../i18n.ts';
import { Btn, Cmd, Panel, Rich, Txt, Typer } from '../term.tsx';
import { c, domainColor } from '../theme.ts';

/** La pregunta en el idioma elegido (las opciones y explicaciones van en el mismo orden). */
export const inLang = (q: Question, lang: Lang) => (lang === 'es' && BANK_ES[q.id]) || q;

/**
 * El botón "pregúntale a Claude", el mismo en toda la app. En la web abre claude.ai con el prompt
 * escrito y además lo copia; en el móvil abre el menú de compartir (la app de Claude, Codex, copiar…).
 * `inline`: como enlace de texto, para listas largas como el glosario.
 */
export function AskButton({ prompt, lang, inline }: { prompt: () => string; lang: Lang; inline?: boolean }) {
  const [copied, setCopied] = useState(false);
  const T = STR[lang];
  const go = () => {
    const text = prompt();
    if (Platform.OS !== 'web') {
      Share.share({ message: text }).catch(() => {});
      return;
    }
    navigator.clipboard
      ?.writeText(text)
      .then(() => setCopied(true))
      .catch(() => {});
    window.open(claudeUrl(text), '_blank', 'noopener');
  };
  return (
    <View style={{ gap: 4 }}>
      {inline ? (
        <Txt size={12} bold color={c.cyan} onPress={go}>
          {T.askClaude}
        </Txt>
      ) : (
        <Btn label={T.askClaude} onPress={go} style={{ borderColor: c.cyan }} />
      )}
      {copied && (
        <Txt size={11} color={c.muted}>
          {T.askCopied}
        </Txt>
      )}
    </View>
  );
}

/**
 * Una pregunta, en cualquier sitio de la app. Sin `reveal` (antes de contestar) Claude explica el
 * escenario y los conceptos sin decir cuál es la buena. `order` como en claudePrompt; `picked` es lo
 * elegido tal como se guarda (índice, o máscara en las de respuesta múltiple).
 */
export function AskClaude({
  q,
  lang,
  order,
  picked,
  reveal = true,
}: {
  q: Question;
  lang: Lang;
  order?: number[];
  picked?: number | null;
  reveal?: boolean;
}) {
  const chosen = picked === undefined || picked === null ? picked : pickedOf(q, picked);
  return <AskButton lang={lang} prompt={() => claudePrompt(inLang(q, lang), rightOf(q), lang, { order, picked: chosen, reveal })} />;
}

/** Un concepto (lección, ficha o término): su nombre y lo que dice la app de él. */
export function AskConcept({ title, lines, lang, inline }: { title: string; lines: string[]; lang: Lang; inline?: boolean }) {
  return <AskButton lang={lang} inline={inline} prompt={() => conceptPrompt(lang, title, lines)} />;
}

/**
 * Una pregunta fallada: escenario, pregunta, lo que contestaste mal (rojo), las buenas (verde) y por
 * qué. `picked` tal como se guarda: índice, máscara en las de respuesta múltiple, o null sin contestar.
 */
export function MissCard({ q, picked, lang, T }: { q: Question; picked: number | null | undefined; lang: Lang; T: Strings }) {
  const tx = inLang(q, lang);
  const rights = rightOf(q);
  const wrongPicks = picked === undefined || picked === null ? [] : pickedOf(q, picked).filter((i) => !rights.includes(i));
  const scenario = tx.scenario.length > 160 ? `${tx.scenario.slice(0, 160).trimEnd()}…` : tx.scenario;
  return (
    <Panel color={c.line}>
      <Txt size={11} bold color={domainColor[q.domain]}>
        {q.ts ? `task ${q.ts}` : q.domain}
      </Txt>
      <Rich text={scenario} size={12} color={c.muted} style={{ marginTop: 2 }} />
      <Rich text={tx.ask} bold color={c.green} style={{ marginTop: 4 }} />
      {picked === null && <Rich text={`- ${T.noAnswer}`} size={13} color={c.red} style={{ marginTop: 6 }} />}
      {wrongPicks.map((i) => (
        <Rich key={`w${i}`} text={`- ${tx.options[i]}`} size={13} color={c.red} style={{ marginTop: 6 }} />
      ))}
      {rights.map((i) => (
        <View key={`r${i}`}>
          <Rich text={`+ ${tx.options[i]}`} size={13} color={c.green} style={{ marginTop: 4 }} />
          <Rich text={`└ ${tx.why[i]}`} size={12} color={c.muted} style={{ marginTop: 4 }} />
        </View>
      ))}
      <Rich text={`// ${tx.rule}`} size={12} color={c.amber} style={{ marginTop: 4 }} />
      <View style={{ marginTop: 8 }}>
        <AskClaude q={q} lang={lang} picked={picked} />
      </View>
    </Panel>
  );
}

/** Todas las preguntas falladas la última vez que salieron, para repasarlas cuando quieras. */
export function Misses({ p, onPractice, onBack }: { p: Progress; onPractice: (qs: Question[]) => void; onBack: () => void }) {
  const T = STR[p.lang];
  const list = misses(roundPool(BANK, LEVEL_BANK, p), p);
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
