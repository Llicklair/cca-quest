import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { claudePrompt, conceptPrompt, missesPrompt } from '../ask.ts';
import { ChatLinker, SentBox, sendToClaude, useClaudeChat, type Sent } from '../chat.tsx';
import { BANK, BANK_ES, LEVEL_BANK } from '../bank.ts';
import { misses, pickedOf, rightOf, roundPool, type Lang, type Progress, type Question } from '../game.ts';
import { STR, type Strings } from '../i18n.ts';
import { Btn, Cmd, Panel, Rich, Txt, Typer } from '../term.tsx';
import { recordItem } from '../study.ts';
import { TRAPS, trapOf } from '../calibration.ts';
import { c, domainColor } from '../theme.ts';

/** La pregunta en el idioma elegido (las opciones y explicaciones van en el mismo orden). */
export const inLang = (q: Question, lang: Lang) => (lang === 'es' && BANK_ES[q.id]) || q;

/**
 * El botón "pregúntale a Claude", el mismo en toda la app (ver sendToClaude). Con tu chat de Claude
 * vinculado, o si el prompt no cabe en un enlace, lo copia y debajo sale el aviso con el botón para
 * abrir Claude y pegarlo. Si no, en la web abre un chat nuevo con el prompt escrito y en el móvil el
 * menú de compartir (la app de Claude, Codex, copiar…); y después ofrece vincular ese chat.
 * `inline`: como enlace de texto, para listas largas como el glosario. `label`: otro texto.
 */
export function AskButton({ prompt, lang, inline, label }: { prompt: () => string; lang: Lang; inline?: boolean; label?: string }) {
  const { chat } = useClaudeChat();
  const [sent, setSent] = useState<Sent | null>(null);
  const T = STR[lang];
  const go = () => {
    sendToClaude(prompt(), chat).then(setSent);
  };
  return (
    <View style={{ gap: 4 }}>
      {inline ? (
        <Txt size={12} bold color={c.cyan} onPress={go}>
          {label ?? T.askClaude}
        </Txt>
      ) : (
        <Btn label={label ?? T.askClaude} onPress={go} style={{ borderColor: c.cyan }} />
      )}
      <SentBox sent={sent} lang={lang} />
      {sent && !chat && <ChatLinker lang={lang} compact />}
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
 * `full`: el escenario entero, para los informes al acabar una ronda o un simulacro; si no, recortado.
 */
export function MissCard({
  q,
  picked,
  lang,
  T,
  full,
  note,
  head,
  calib,
}: {
  q: Question;
  picked: number | null | undefined;
  lang: Lang;
  T: Strings;
  full?: boolean;
  note?: string; // el comentario que dejaste en el simulacro
  head?: string; // delante del dominio, p. ej. "P12 · ⚑" en el informe del simulacro
  // En la calibración: la frase que decide y la palabra del giro resaltadas, la trampa de lo que
  // elegiste, si estabas seguro y, en las gemelas, el número de la otra.
  calib?: { sure?: boolean | null; twin?: number };
}) {
  const tx = inLang(q, lang);
  const rights = rightOf(q);
  const wrongPicks = picked === undefined || picked === null ? [] : pickedOf(q, picked).filter((i) => !rights.includes(i));
  const scenario = !full && tx.scenario.length > 160 ? `${tx.scenario.slice(0, 160).trimEnd()}…` : tx.scenario;
  const trap = calib ? trapOf(q, picked) : null;
  const tags = calib
    ? [calib.sure === true ? T.wasSure : calib.sure === false ? T.wasUnsure : '', calib.twin ? T.twinOf(calib.twin) : ''].filter(Boolean)
    : [];
  return (
    <Panel color={c.line}>
      <Txt size={11} bold color={domainColor[q.domain]}>
        {head ? `${head} · ` : ''}
        {q.ts ? `task ${q.ts}` : q.domain}
        {tags.length ? ` · ${tags.join(' · ')}` : ''}
      </Txt>
      <Rich text={scenario} size={12} color={c.muted} style={{ marginTop: 2 }} mark={calib ? [tx.clue] : undefined} />
      <Rich text={tx.ask} bold color={c.green} style={{ marginTop: 4 }} mark={calib ? [tx.twist] : undefined} />
      {picked === null && <Rich text={`- ${T.noAnswer}`} size={13} color={c.red} style={{ marginTop: 6 }} />}
      {wrongPicks.map((i) => (
        <Rich key={`w${i}`} text={`- ${tx.options[i]}`} size={13} color={c.red} style={{ marginTop: 6 }} />
      ))}
      {trap && (
        <View style={{ marginTop: 4 }}>
          <Txt size={12} bold color={c.red}>
            [{T.trapTag(TRAPS[trap].name[lang])}]
          </Txt>
          <Rich text={TRAPS[trap].tip[lang]} size={12} color={c.muted} />
        </View>
      )}
      {rights.map((i) => (
        <View key={`r${i}`}>
          <Rich text={`+ ${tx.options[i]}`} size={13} color={c.green} style={{ marginTop: 4 }} />
          <Rich text={`└ ${tx.why[i]}`} size={12} color={c.muted} style={{ marginTop: 4 }} />
        </View>
      ))}
      <Rich text={`// ${tx.rule}`} size={12} color={c.amber} style={{ marginTop: 4 }} />
      {note ? <Rich text={`${T.yourNote}: ${note}`} size={12} color={c.cyan} style={{ marginTop: 4 }} /> : null}
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
      {list.length > 0 && (
        <View style={{ gap: 4 }}>
          <AskButton lang={p.lang} label={T.askMisses(list.length)} prompt={() => missesPrompt(p.lang, list.flatMap((q) => recordItem(q, p, p.lang) ?? []))} />
          <Txt size={11} color={c.muted}>
            {T.askMissesHint}
          </Txt>
        </View>
      )}
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
