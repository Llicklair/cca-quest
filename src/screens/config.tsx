import { Linking, ScrollView, StyleSheet, View } from 'react-native';

import type { Lang, Progress } from '../game.ts';
import { Btn, Cmd, LangToggle, Panel, Txt, Typer } from '../term.tsx';
import { c } from '../theme.ts';

export const GUIDE_URL = 'https://anthropic-partners.skilljar.com/claude-certified-architect-foundations-certification';

export function Config({
  p,
  onReminder,
  onLang,
  onTest,
  onReset,
}: {
  p: Progress;
  onReminder: (change: Partial<Progress['reminder']>) => void;
  onLang: (l: Lang) => void;
  onTest: () => void;
  onReset: () => void;
}) {
  const { on, hour, minute } = p.reminder;
  const shift = (mins: number) => {
    const total = (hour * 60 + minute + mins + 24 * 60) % (24 * 60);
    onReminder({ hour: Math.floor(total / 60), minute: total % 60 });
  };
  const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  return (
    <ScrollView contentContainerStyle={s.page}>
      <Typer text="$ cca-quest config" bold color={c.green} />

      <Panel title="reminders">
        <View style={s.row}>
          <Txt color={c.muted} style={s.key}>
            daily
          </Txt>
          <Btn small kind={on ? 'good' : 'ghost'} label={on ? '[ON]' : '[OFF]'} onPress={() => onReminder({ on: !on })} />
        </View>
        {on && (
          <View style={s.row}>
            <Txt color={c.muted} style={s.key}>
              at
            </Txt>
            <Txt bold size={18} color={c.green}>
              {time}
            </Txt>
          </View>
        )}
        {on && (
          <View style={[s.row, { gap: 6 }]}>
            {[-60, -15, 15, 60].map((m) => (
              <Btn key={m} small label={m > 0 ? `+${m === 60 ? '1h' : m}` : m === -60 ? '-1h' : `${m}`} onPress={() => shift(m)} style={{ flex: 1 }} />
            ))}
          </View>
        )}
        <Txt size={12} color={c.muted} style={{ marginTop: 8 }}>
          {'// plus a last call at 22:00 if the streak is at risk'}
        </Txt>
        <Btn small label="$ notify --test  (5s)" onPress={onTest} style={{ marginTop: 10 }} />
      </Panel>

      <Panel title="theory language">
        <View style={s.row}>
          <Txt color={c.muted} style={s.key}>
            lang
          </Txt>
          <LangToggle lang={p.lang} onChange={onLang} />
        </View>
        <Txt size={12} color={c.muted} style={{ marginTop: 8 }}>
          {'// lessons, cards and glossary. questions stay in english, like the exam'}
        </Txt>
      </Panel>

      <Panel title="exam">
        <Txt>60 questions · 120 min</Txt>
        <Txt>4 of 6 scenarios · pass 720/1000</Txt>
        <Txt size={12} color={c.muted} style={{ marginTop: 6 }}>
          {'// every item here is tagged with its domain and the task statement it practices'}
        </Txt>
        <Btn small label="$ open official-page ↗" onPress={() => Linking.openURL(GUIDE_URL)} style={{ marginTop: 10 }} />
      </Panel>

      <View style={{ marginTop: 10 }}>
        <Cmd size={12}>
          <Txt size={12} color={c.red}>
            rm -rf ~/.progress
          </Txt>
        </Cmd>
        <Btn kind="danger" label="RESET PROGRESS" onPress={onReset} style={{ marginTop: 6 }} />
      </View>
      <Txt size={11} color={c.muted} style={{ textAlign: 'center', marginTop: 10 }}>
        cca-quest v1.1
      </Txt>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  key: { width: 64 },
});
