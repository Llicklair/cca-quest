import { Linking, Platform, ScrollView, StyleSheet, View } from 'react-native';

import type { Progress } from '../game.ts';
import { BUILD } from '../build.ts';
import { STR } from '../i18n.ts';
import { APK_URL, type UpdateInfo } from '../update.ts';
import { Btn, Cmd, Panel, Txt, Typer } from '../term.tsx';
import { c } from '../theme.ts';

export const GUIDE_URL = 'https://anthropic-partners.skilljar.com/claude-certified-architect-foundations-certification';

export function Config({
  p,
  onReminder,
  update,
  checking,
  onCheck,
  onTest,
  onReset,
}: {
  p: Progress;
  onReminder: (change: Partial<Progress['reminder']>) => void;
  update: UpdateInfo | null | undefined; // undefined = sin comprobar, null = sin conexión
  checking: boolean;
  onCheck: () => void;
  onTest: () => void;
  onReset: () => void;
}) {
  const { on, hour, minute } = p.reminder;
  const shift = (mins: number) => {
    const total = (hour * 60 + minute + mins + 24 * 60) % (24 * 60);
    onReminder({ hour: Math.floor(total / 60), minute: total % 60 });
  };
  const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const T = STR[p.lang];

  return (
    <ScrollView contentContainerStyle={s.page}>
      <Typer text="$ cca-quest config" bold color={c.green} />

      <Panel title={T.reminders}>
        <View style={s.row}>
          <Txt color={c.muted} style={s.key}>
            {T.daily}
          </Txt>
          <Btn small kind={on ? 'good' : 'ghost'} label={on ? '[ON]' : '[OFF]'} onPress={() => onReminder({ on: !on })} />
        </View>
        {on && (
          <View style={s.row}>
            <Txt color={c.muted} style={s.key}>
              {T.at}
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
          {T.lastCall}
        </Txt>
        <Btn small label="$ notify --test  (5s)" onPress={onTest} style={{ marginTop: 10 }} />
      </Panel>

      {Platform.OS === 'android' && (
        <Panel title={T.update} color={update?.available ? c.amber : c.lineHi} titleColor={update?.available ? c.amber : c.muted}>
          <Txt bold color={update?.available ? c.amber : c.text}>
            {checking
              ? T.checking
              : update === undefined
                ? `build ${BUILD}`
                : update === null
                  ? T.offline
                  : update.available
                    ? T.newBuild(update.current, update.latest)
                    : T.upToDate(update.current)}
          </Txt>
          {update?.available ? (
            <Btn kind="amber" label={T.download} onPress={() => Linking.openURL(APK_URL)} style={{ marginTop: 10 }} />
          ) : (
            <Btn small label={T.checkNow} onPress={onCheck} disabled={checking} style={{ marginTop: 10 }} />
          )}
          <Txt size={11} color={c.muted} style={{ marginTop: 6 }}>
            {T.updateHint}
          </Txt>
        </Panel>
      )}

      <Panel title={T.exam}>
        <Txt>{T.examFacts1}</Txt>
        <Txt>{T.examFacts2}</Txt>
        <Txt size={12} color={c.muted} style={{ marginTop: 6 }}>
          {T.examNote}
        </Txt>
        <Btn small label="$ open official-page ↗" onPress={() => Linking.openURL(GUIDE_URL)} style={{ marginTop: 10 }} />
      </Panel>

      <View style={{ marginTop: 10 }}>
        <Cmd size={12}>
          <Txt size={12} color={c.red}>
            rm -rf ~/.progress
          </Txt>
        </Cmd>
        <Btn kind="danger" label={T.reset} onPress={onReset} style={{ marginTop: 6 }} />
      </View>
      <Txt size={11} color={c.muted} style={{ textAlign: 'center', marginTop: 10 }}>
        cca-quest v1.6{Platform.OS === 'android' ? ` · build ${BUILD}` : ''}
      </Txt>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  key: { width: 64 },
});
