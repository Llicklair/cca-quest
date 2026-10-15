// Los extras de una lección: el diagrama que se recorre paso a paso, la comparación de dos
// enfoques con pestañas y el ejercicio de clasificar casos con corrección al momento.
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import * as feel from '../feel.ts';
import { shuffle, type Drill, type Lang, type Side, type Visual } from '../game.ts';
import type { Strings } from '../i18n.ts';
import { BounceIn, Btn, Panel, Rich, Txt } from '../term.tsx';
import { c } from '../theme.ts';

const toneColor = (t: Side['tone']) => (t === 'bad' ? c.red : t === 'good' ? c.green : c.cyan);
const toneMark = (t: Side['tone']) => (t === 'bad' ? '✗ ' : t === 'good' ? '✓ ' : '');
const plain = (s: string) => s.replace(/`/g, ''); // pestañas, casillas y títulos de panel van sin resaltado

export function SeeIt({ v, lang, T }: { v: Visual; lang: Lang; T: Strings }) {
  return v.kind === 'flow' ? <Flow v={v} lang={lang} T={T} /> : <Compare v={v} lang={lang} />;
}

/** Los pasos de un mecanismo: el actual se resalta y su explicación aparece debajo. */
function Flow({ v, lang, T }: { v: Extract<Visual, { kind: 'flow' }>; lang: Lang; T: Strings }) {
  const [at, setAt] = useState(0);
  const last = v.steps.length - 1;
  const go = (i: number) => {
    setAt(i);
    feel.tap();
  };
  return (
    <Panel title={`${plain(v.title[lang])} · ${at + 1}/${v.steps.length}`}>
      {v.steps.map((step, i) => {
        const state = i < at ? 'done' : i === at ? 'on' : 'todo';
        return (
          <View key={i}>
            {i > 0 && (
              <Txt size={12} color={i <= at ? c.greenDim : c.line} style={{ marginLeft: 13 }}>
                │
              </Txt>
            )}
            <Pressable onPress={() => go(i)} style={[s.step, state === 'on' && s.stepOn]}>
              <Txt bold color={state === 'on' ? c.green : state === 'done' ? c.greenDim : c.lineHi}>
                {state === 'done' ? '✓' : state === 'on' ? '▶' : '░'}
              </Txt>
              <View style={{ flex: 1 }}>
                <Rich text={step.label[lang]} bold={state === 'on'} color={state === 'todo' ? c.muted : c.text} />
                {step.loop !== undefined && (
                  <Txt size={12} bold color={state === 'todo' ? c.lineHi : c.amber}>
                    {T.loopTo(step.loop + 1)}
                  </Txt>
                )}
              </View>
            </Pressable>
          </View>
        );
      })}
      <BounceIn key={at}>
        <View style={s.note}>
          <Rich text={v.steps[at].note[lang]} size={13} />
        </View>
      </BounceIn>
      <View style={s.row}>
        <Btn small label={T.stepBack} onPress={() => go(Math.max(0, at - 1))} disabled={at === 0} style={{ flex: 1 }} />
        <Btn small kind="primary" label={at === last ? T.stepAgain : T.stepNext} onPress={() => go(at === last ? 0 : at + 1)} style={{ flex: 1 }} />
      </View>
    </Panel>
  );
}

/** Dos enfoques, uno por pestaña, y por qué gana uno o cuándo usar cada cual. */
function Compare({ v, lang }: { v: Extract<Visual, { kind: 'compare' }>; lang: Lang }) {
  const [at, setAt] = useState(0);
  const side = v.sides[at];
  return (
    <Panel title={plain(v.title[lang])}>
      <View style={s.row}>
        {v.sides.map((x, i) => (
          <Pressable
            key={i}
            onPress={() => {
              setAt(i);
              feel.tap();
            }}
            style={[s.tab, { borderColor: i === at ? toneColor(x.tone) : c.line, backgroundColor: i === at ? c.bg : 'transparent' }]}
          >
            <Txt bold size={13} color={i === at ? toneColor(x.tone) : c.muted}>
              {toneMark(x.tone) + plain(x.label[lang])}
            </Txt>
          </Pressable>
        ))}
      </View>
      <View style={[s.code, { borderLeftColor: toneColor(side.tone) }]}>
        <Rich text={side.body[lang]} size={13} />
      </View>
      <Rich text={`// ${v.why[lang]}`} size={13} color={c.muted} style={{ marginTop: 10 }} />
    </Panel>
  );
}

/** Clasificar casos: se elige una casilla por caso y al comprobar se ve cuál era y por qué. */
export function TryIt({ d, lang, T }: { d: Drill; lang: Lang; T: Strings }) {
  // La primera vez, en el orden del contenido (de fácil a difícil); al repetir, barajados.
  const [order, setOrder] = useState(() => d.items.map((_, i) => i));
  const [picks, setPicks] = useState<(number | null)[]>(() => d.items.map(() => null));
  const [checked, setChecked] = useState(false);
  const right = d.items.filter((item, i) => picks[i] === item.bucket).length;

  const check = () => {
    setChecked(true);
    if (right === d.items.length) feel.good();
    else feel.bad();
  };
  const retry = () => {
    setOrder(shuffle(d.items.map((_, i) => i)));
    setPicks(d.items.map(() => null));
    setChecked(false);
    feel.tap();
  };

  return (
    <Panel title={plain(d.title[lang])}>
      {order.map((i) => {
        const item = d.items[i];
        const ok = picks[i] === item.bucket;
        return (
          <View key={i} style={s.case}>
            <Rich text={item.text[lang]} />
            <View style={s.chips}>
              {d.buckets.map((b, k) => {
                const on = picks[i] === k;
                const isAnswer = checked && k === item.bucket;
                const color = isAnswer ? c.green : checked && on ? c.red : on ? c.amber : c.muted;
                return (
                  <Pressable
                    key={k}
                    disabled={checked}
                    onPress={() => {
                      setPicks(picks.map((x, j) => (j === i ? k : x)));
                      feel.tap();
                    }}
                    style={[s.chip, { borderColor: on || isAnswer ? color : c.line, backgroundColor: on ? c.bg : 'transparent' }]}
                  >
                    <Txt size={12} bold color={color}>
                      {plain(b[lang])}
                    </Txt>
                  </Pressable>
                );
              })}
            </View>
            {checked && (
              <Rich text={`${ok ? '✓' : '✗'} ${item.why[lang]}`} size={12} color={ok ? c.green : c.red} />
            )}
          </View>
        );
      })}
      {checked ? (
        <View style={[s.row, { alignItems: 'center' }]}>
          <Txt bold color={right === d.items.length ? c.green : c.amber} style={{ flex: 1 }}>
            {T.drillScore(right, d.items.length)}
          </Txt>
          <Btn small label={T.retry} onPress={retry} style={{ flex: 1 }} />
        </View>
      ) : (
        <View style={{ gap: 8, marginTop: 10 }}>
          <Txt size={12} color={c.muted}>
            {T.drillHint}
          </Txt>
          <Btn kind="amber" small label={T.check} onPress={check} disabled={picks.some((x) => x === null)} />
        </View>
      )}
    </Panel>
  );
}

const s = StyleSheet.create({
  step: { flexDirection: 'row', gap: 10, padding: 8, borderWidth: 1, borderColor: 'transparent', borderRadius: 3 },
  stepOn: { borderColor: c.green, backgroundColor: c.greenBg },
  note: { marginTop: 10, borderLeftWidth: 2, borderLeftColor: c.green, paddingLeft: 10 },
  row: { flexDirection: 'row', gap: 10, marginTop: 10 },
  tab: { flex: 1, borderWidth: 1, borderRadius: 3, paddingVertical: 6, paddingHorizontal: 8, alignItems: 'center' },
  code: { marginTop: 10, borderLeftWidth: 2, paddingLeft: 10, paddingVertical: 4 },
  case: { gap: 6, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.line },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 3, paddingVertical: 5, paddingHorizontal: 10 },
});
