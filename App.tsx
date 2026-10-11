import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  BackHandler,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import * as feel from './src/feel';
import {
  DOMAINS,
  GOAL,
  SETTINGS,
  addXp,
  answer,
  buildSession,
  dayKey,
  dueCount,
  goalDone,
  levelOf,
  liveStreak,
  mastery,
  readiness,
  rollDay,
  sessionBonus,
  shuffle,
  type Level,
  type Progress,
  type Question,
} from './src/game';
import { ensurePermission, reschedule, testNotification } from './src/notify';
import { QUESTIONS } from './src/questions';
import { load, save, wipe } from './src/storage';
import { c, domainColor, mono } from './src/theme';
import { Bar, BounceIn, Chip, Confetti, Pop, Pulse } from './src/ui';

const GUIDE_URL = 'https://anthropic-partners.skilljar.com/claude-certified-architect-foundations-certification';

type Item = { q: Question; order: number[] }; // order[pos] = índice original de la opción
type Round = {
  items: Item[];
  i: number;
  picked: number | null; // posición pulsada
  combo: number;
  best: number;
  right: number;
  xp: number;
  gain: number;
  levelUp: Level | null;
  goalMet: boolean;
};
type Screen = 'home' | 'round' | 'done' | 'settings';

const today = () => dayKey(new Date());

const PRAISE = ['Correct!', 'Nice!', 'On fire! 🔥', 'Unstoppable! ⚡', 'ARCHITECT MODE 🏗️'];
const praise = (combo: number) => PRAISE[Math.min(combo, PRAISE.length) - 1];

function confirmAction(title: string, message: string, action: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: action, style: 'destructive', onPress: onConfirm },
  ]);
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Main />
    </SafeAreaProvider>
  );
}

function Main() {
  const insets = useSafeAreaInsets();
  const [p, setP] = useState<Progress | null>(null);
  const [screen, setScreen] = useState<Screen>('home');
  const [round, setRound] = useState<Round | null>(null);
  const [boom, setBoom] = useState(0);

  useEffect(() => {
    load(today()).then((loaded) => {
      setP(loaded);
      if (loaded.reminder.on) ensurePermission().then(() => reschedule(QUESTIONS, loaded));
    });
  }, []);

  // Al volver a la app puede ser otro día: se ponen a cero los contadores de hoy.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setP((cur) => (cur ? rollDay(cur, today()) : cur));
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen === 'home') return false;
      setScreen('home');
      return true;
    });
    return () => sub.remove();
  }, [screen]);

  const commit = useCallback((next: Progress) => {
    setP(next);
    save(next);
  }, []);

  if (!p) {
    return (
      <View style={[s.fill, s.center]}>
        <ActivityIndicator color={c.flame} />
      </View>
    );
  }

  const start = () => {
    const fresh = rollDay(p, today());
    const qs = buildSession(QUESTIONS, fresh, today());
    feel.tap();
    setRound({
      items: qs.map((q) => ({ q, order: shuffle(q.options.map((_, i) => i)) })),
      i: 0,
      picked: null,
      combo: 0,
      best: 0,
      right: 0,
      xp: 0,
      gain: 0,
      levelUp: null,
      goalMet: false,
    });
    setScreen('round');
  };

  const pick = (pos: number) => {
    if (!round || round.picked !== null) return;
    const item = round.items[round.i];
    const ok = item.order[pos] === item.q.answer;
    const o = answer(p, item.q.id, ok, round.combo, today());
    commit(o.progress);
    if (ok) feel.good();
    else feel.bad();
    setRound({
      ...round,
      picked: pos,
      combo: o.combo,
      best: Math.max(round.best, o.combo),
      right: round.right + (ok ? 1 : 0),
      xp: round.xp + o.gained,
      gain: o.gained,
      levelUp: o.levelUp ?? round.levelUp,
      goalMet: round.goalMet || o.goalJustMet,
    });
  };

  const next = () => {
    if (!round) return;
    if (round.i + 1 < round.items.length) {
      feel.tap();
      setRound({ ...round, i: round.i + 1, picked: null });
      return;
    }
    const bonus = sessionBonus(round.right, round.items.length);
    const { progress, levelUp } = addXp(p, bonus);
    commit(progress);
    reschedule(QUESTIONS, progress);
    const done = { ...round, xp: round.xp + bonus, levelUp: levelUp ?? round.levelUp };
    setRound(done);
    setScreen('done');
    if (done.right === done.items.length || done.levelUp || done.goalMet) {
      setBoom((b) => b + 1);
      feel.big();
    }
  };

  const quit = () =>
    confirmAction('Leave this round?', 'Answers so far are already saved.', 'Leave', () => {
      reschedule(QUESTIONS, p);
      setScreen('home');
    });

  const updateReminder = (change: Partial<Progress['reminder']>) => {
    const next = { ...p, reminder: { ...p.reminder, ...change } };
    commit(next);
    if (next.reminder.on) ensurePermission().then(() => reschedule(QUESTIONS, next));
    else reschedule(QUESTIONS, next);
  };

  return (
    <View style={[s.fill, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {screen === 'home' && <Home p={p} onPlay={start} onSettings={() => setScreen('settings')} />}
      {screen === 'round' && round && <RoundView round={round} onPick={pick} onNext={next} onQuit={quit} />}
      {screen === 'done' && round && <Done round={round} p={p} onAgain={start} onHome={() => setScreen('home')} />}
      {screen === 'settings' && (
        <SettingsView
          p={p}
          onBack={() => setScreen('home')}
          onReminder={updateReminder}
          onReset={() =>
            confirmAction('Reset all progress?', 'XP, streak and every answer will be deleted.', 'Reset', async () => {
              await wipe();
              const blank = await load(today());
              commit(blank);
              reschedule(QUESTIONS, blank);
              setScreen('home');
            })
          }
        />
      )}
      {boom > 0 && <Confetti key={boom} />}
    </View>
  );
}

// --- Inicio ---

function Home({ p, onPlay, onSettings }: { p: Progress; onPlay: () => void; onSettings: () => void }) {
  const t = today();
  const lvl = levelOf(p.xp);
  const streak = liveStreak(p, t);
  const doneToday = goalDone(p, t);
  const todayCount = p.day === t ? p.answered : 0;
  const due = dueCount(QUESTIONS, p, t);
  const unseen = QUESTIONS.filter((q) => !p.cards[q.id]).length;
  const ready = readiness(QUESTIONS, p);
  const atRisk = streak > 0 && !doneToday;

  return (
    <ScrollView contentContainerStyle={s.page}>
      <View style={s.topRow}>
        <Text style={s.brand}>
          CCA <Text style={{ color: c.flame }}>Quest</Text>
        </Text>
        <Pressable onPress={onSettings} hitSlop={12}>
          <Text style={s.gear}>⚙️</Text>
        </Pressable>
      </View>

      <View style={s.card}>
        <View style={s.levelRow}>
          <View style={s.levelBadge}>
            <Text style={s.levelN}>{lvl.n}</Text>
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={s.levelTitle}>{lvl.title}</Text>
            <Bar value={lvl.to ? (p.xp - lvl.from) / (lvl.to - lvl.from) : 1} color={c.gold} />
            <Text style={s.small}>{lvl.to ? `${p.xp} / ${lvl.to} XP` : `${p.xp} XP · max level`}</Text>
          </View>
        </View>
      </View>

      <View style={s.row}>
        <View style={[s.card, s.half, atRisk && { borderColor: c.flame }]}>
          <Pulse on={atRisk}>
            <Text style={[s.streakN, { opacity: streak > 0 ? 1 : 0.35 }]}>🔥 {streak}</Text>
          </Pulse>
          <Text style={s.small}>day streak</Text>
          <Text style={[s.tiny, atRisk && { color: c.flame }]}>
            {atRisk ? 'Play today to keep it!' : `Best: ${p.best}`}
          </Text>
        </View>
        <View style={[s.card, s.half]}>
          <View style={s.segments}>
            {Array.from({ length: GOAL }, (_, i) => (
              <View key={i} style={[s.segment, i < todayCount && { backgroundColor: doneToday ? c.good : c.flame }]} />
            ))}
          </View>
          <Text style={s.goalN}>
            {Math.min(todayCount, GOAL)}/{GOAL}
          </Text>
          <Text style={[s.tiny, doneToday && { color: c.good }]}>{doneToday ? 'Daily goal done ✓' : 'Daily goal'}</Text>
        </View>
      </View>

      <Pressable onPress={onPlay} style={({ pressed }) => [s.play, pressed && s.pressed]}>
        <Text style={s.playText}>{doneToday ? '▶  Bonus round' : '▶  Start round'}</Text>
        <Text style={s.playSub}>
          {due > 0 ? `${due} to review` : 'Nothing to review'} · {unseen} new left
        </Text>
      </Pressable>

      <View style={s.card}>
        <View style={s.readyRow}>
          <Text style={s.cardTitle}>Mastery</Text>
          <Text style={s.readyN}>{Math.round(ready * 100)}%</Text>
        </View>
        <Text style={s.tiny}>Weighted like the exam. A question counts as mastered after 4 correct answers spread over days.</Text>
        <View style={{ gap: 12, marginTop: 12 }}>
          {DOMAINS.map((d) => {
            const m = mastery(QUESTIONS, p, d.id);
            return (
              <View key={d.id} style={{ gap: 5 }}>
                <View style={s.domRow}>
                  <Text style={[s.domName, { color: domainColor[d.id] }]}>
                    D{d.n} · {d.short}
                  </Text>
                  <Text style={s.tiny}>
                    {Math.round(m * 100)}% · weight {d.weight}%
                  </Text>
                </View>
                <Bar value={m} color={domainColor[d.id]} height={6} />
              </View>
            );
          })}
        </View>
      </View>

      <Text style={s.footer}>
        {QUESTIONS.length} questions · best combo {p.bestCombo} ·{' '}
        <Text style={s.link} onPress={() => Linking.openURL(GUIDE_URL)}>
          official exam page ↗
        </Text>
      </Text>
    </ScrollView>
  );
}

// --- Ronda ---

function RoundView({
  round,
  onPick,
  onNext,
  onQuit,
}: {
  round: Round;
  onPick: (pos: number) => void;
  onNext: () => void;
  onQuit: () => void;
}) {
  const { q, order } = round.items[round.i];
  const answered = round.picked !== null;
  const correctPos = order.indexOf(q.answer);
  const ok = round.picked === correctPos;
  const dom = DOMAINS.find((d) => d.id === q.domain)!;
  const last = round.i + 1 === round.items.length;

  return (
    <View style={s.fill}>
      <View style={s.roundTop}>
        <Pressable onPress={onQuit} hitSlop={12}>
          <Text style={s.quit}>✕</Text>
        </Pressable>
        <View style={s.dots}>
          {round.items.map((_, i) => (
            <View key={i} style={[s.dot, i < round.i && s.dotDone, i === round.i && s.dotNow]} />
          ))}
        </View>
        <Text style={s.xpPill}>⚡ {round.xp}</Text>
      </View>

      <ScrollView contentContainerStyle={[s.page, { paddingBottom: 140 }]} key={round.i}>
        {q.setting && (
          <Text style={s.setting}>
            {SETTINGS[q.setting].emoji} {SETTINGS[q.setting].name}
          </Text>
        )}
        <View style={s.chips}>
          <Chip label={`D${dom.n} · ${dom.short}`} color={domainColor[q.domain]} />
          {q.ts && <Chip label={`Task ${q.ts}`} />}
          {round.combo >= 2 && <Chip label={`🔥 x${round.combo} combo`} color={c.flame} />}
        </View>
        <Text style={s.scenario}>{q.scenario}</Text>
        <Text style={s.ask}>{q.ask}</Text>

        <View style={{ gap: 10 }}>
          {order.map((orig, pos) => {
            const right = pos === correctPos;
            const mine = pos === round.picked;
            const look = !answered ? null : right ? s.optRight : mine ? s.optWrong : s.optDim;
            const mark = !answered ? 'ABCD'[pos] : right ? '✓' : mine ? '✗' : 'ABCD'[pos];
            return (
              <Pressable
                key={pos}
                disabled={answered}
                onPress={() => onPick(pos)}
                style={({ pressed }) => [s.opt, look, pressed && s.pressed]}
              >
                <View style={s.optRow}>
                  <Text style={[s.letter, answered && right && { color: c.good }, answered && mine && !right && { color: c.bad }]}>
                    {mark}
                  </Text>
                  <Text style={s.optText}>{q.options[orig]}</Text>
                </View>
                {answered && <Text style={[s.why, right && { color: c.inkSoft }]}>{q.why[orig]}</Text>}
              </Pressable>
            );
          })}
        </View>

        {answered && (
          <View style={s.rule}>
            <Text style={s.ruleLabel}>💡 REMEMBER</Text>
            <Text style={s.ruleText}>{q.rule}</Text>
          </View>
        )}
      </ScrollView>

      {answered && (
        <View style={[s.bottom, { borderTopColor: ok ? c.good : c.bad }]}>
          <Text style={[s.verdict, { color: ok ? c.good : c.bad }]}>{ok ? praise(round.combo) : 'Not quite — read why ↑'}</Text>
          <Pressable onPress={onNext} style={({ pressed }) => [s.next, { backgroundColor: ok ? c.good : c.flame }, pressed && s.pressed]}>
            <Text style={s.nextText}>{last ? 'See results' : 'Continue'}</Text>
          </Pressable>
        </View>
      )}
      {answered && <Pop key={`pop-${round.i}`} text={`+${round.gain} XP`} color={ok ? c.gold : c.muted} />}
    </View>
  );
}

// --- Resultado de la ronda ---

function Done({ round, p, onAgain, onHome }: { round: Round; p: Progress; onAgain: () => void; onHome: () => void }) {
  const total = round.items.length;
  const perfect = round.right === total;
  const streak = liveStreak(p, today());

  return (
    <ScrollView contentContainerStyle={[s.page, s.center, { flexGrow: 1 }]}>
      <BounceIn>
        <Text style={s.doneEmoji}>{perfect ? '🎯' : round.right >= total - 1 ? '🚀' : '💪'}</Text>
      </BounceIn>
      <Text style={s.doneTitle}>{perfect ? 'Perfect round!' : 'Round complete'}</Text>
      <Text style={s.doneScore}>
        {round.right} / {total} correct
      </Text>

      <View style={[s.row, { marginTop: 8 }]}>
        <Stat label="XP earned" value={`+${round.xp}`} color={c.gold} />
        <Stat label="Best combo" value={`x${round.best}`} color={c.flame} />
      </View>

      {round.goalMet && (
        <BounceIn delay={250}>
          <View style={[s.banner, { borderColor: c.flame }]}>
            <Text style={s.bannerBig}>🔥 {streak}-day streak!</Text>
            <Text style={s.small}>Daily goal done. See you tomorrow.</Text>
          </View>
        </BounceIn>
      )}
      {round.levelUp && (
        <BounceIn delay={500}>
          <View style={[s.banner, { borderColor: c.gold }]}>
            <Text style={[s.bannerBig, { color: c.gold }]}>LEVEL UP · {round.levelUp.n}</Text>
            <Text style={s.small}>You are now a {round.levelUp.title}.</Text>
          </View>
        </BounceIn>
      )}
      {!perfect && (
        <Text style={[s.small, { textAlign: 'center', marginTop: 8 }]}>
          Missed questions come back tomorrow. That’s how they stick.
        </Text>
      )}

      <View style={{ width: '100%', gap: 10, marginTop: 20 }}>
        <Pressable onPress={onAgain} style={({ pressed }) => [s.play, pressed && s.pressed]}>
          <Text style={s.playText}>▶  Another round</Text>
        </Pressable>
        <Pressable onPress={onHome} style={({ pressed }) => [s.ghost, pressed && s.pressed]}>
          <Text style={s.ghostText}>Home</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[s.card, s.half, s.center]}>
      <Text style={[s.statN, { color }]}>{value}</Text>
      <Text style={s.tiny}>{label}</Text>
    </View>
  );
}

// --- Ajustes ---

function SettingsView({
  p,
  onBack,
  onReminder,
  onReset,
}: {
  p: Progress;
  onBack: () => void;
  onReminder: (change: Partial<Progress['reminder']>) => void;
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
      <View style={s.topRow}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={s.back}>‹ Back</Text>
        </Pressable>
      </View>
      <Text style={s.h1}>Settings</Text>

      <View style={s.card}>
        <View style={s.readyRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>Daily reminder</Text>
            <Text style={s.tiny}>Plus a last call at 22:00 if your streak is at risk.</Text>
          </View>
          <Switch
            value={on}
            onValueChange={(v) => onReminder({ on: v })}
            trackColor={{ true: c.flame, false: c.line }}
            thumbColor={c.ink}
          />
        </View>
        {on && (
          <View style={s.timeRow}>
            <TimeBtn label="−1h" onPress={() => shift(-60)} />
            <TimeBtn label="−15" onPress={() => shift(-15)} />
            <Text style={s.time}>{time}</Text>
            <TimeBtn label="+15" onPress={() => shift(15)} />
            <TimeBtn label="+1h" onPress={() => shift(60)} />
          </View>
        )}
        <Pressable
          onPress={async () => {
            const okay = await testNotification();
            if (!okay) Alert.alert('Notifications are off', 'Allow notifications for CCA Quest in Android settings.');
          }}
          style={({ pressed }) => [s.ghost, { marginTop: 12 }, pressed && s.pressed]}
        >
          <Text style={s.ghostText}>Send a test notification (5 s)</Text>
        </Pressable>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>About the exam</Text>
        <Text style={s.small}>
          60 questions in 120 minutes, 4 of 6 scenarios, pass mark 720/1000. Every question here is tagged with its domain and the
          task statement it practises from the official exam guide.
        </Text>
        <Pressable onPress={() => Linking.openURL(GUIDE_URL)} style={({ pressed }) => [s.ghost, { marginTop: 12 }, pressed && s.pressed]}>
          <Text style={s.ghostText}>Official certification page ↗</Text>
        </Pressable>
      </View>

      <Pressable onPress={onReset} style={({ pressed }) => [s.ghost, { borderColor: c.bad }, pressed && s.pressed]}>
        <Text style={[s.ghostText, { color: c.bad }]}>Reset progress</Text>
      </Pressable>
    </ScrollView>
  );
}

function TimeBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.timeBtn, pressed && s.pressed]}>
      <Text style={s.timeBtnText}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: c.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  page: { padding: 16, gap: 14 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  brand: { color: c.ink, fontSize: 26, fontWeight: '900', letterSpacing: 0.5 },
  gear: { fontSize: 24 },
  back: { color: c.flame, fontSize: 17, fontWeight: '700' },
  h1: { color: c.ink, fontSize: 28, fontWeight: '900' },
  card: { backgroundColor: c.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: c.line },
  cardTitle: { color: c.ink, fontSize: 17, fontWeight: '800' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1, alignItems: 'center', gap: 4 },
  small: { color: c.inkSoft, fontSize: 14, lineHeight: 20 },
  tiny: { color: c.muted, fontSize: 12, lineHeight: 17 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  levelBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: c.flameSoft,
    borderWidth: 3,
    borderColor: c.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelN: { color: c.gold, fontSize: 24, fontWeight: '900' },
  levelTitle: { color: c.ink, fontSize: 18, fontWeight: '800' },
  streakN: { color: c.ink, fontSize: 34, fontWeight: '900' },
  segments: { flexDirection: 'row', gap: 4, marginTop: 10, marginBottom: 6 },
  segment: { width: 20, height: 10, borderRadius: 5, backgroundColor: c.line },
  goalN: { color: c.ink, fontSize: 24, fontWeight: '900' },
  play: { backgroundColor: c.flame, borderRadius: 18, paddingVertical: 18, alignItems: 'center', gap: 4 },
  playText: { color: '#1B1208', fontSize: 20, fontWeight: '900' },
  playSub: { color: '#3B2412', fontSize: 13, fontWeight: '600' },
  readyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  readyN: { color: c.ink, fontSize: 26, fontWeight: '900' },
  domRow: { flexDirection: 'row', justifyContent: 'space-between' },
  domName: { fontSize: 14, fontWeight: '800' },
  footer: { color: c.muted, fontSize: 12, textAlign: 'center', marginTop: 4 },
  link: { color: c.flame, textDecorationLine: 'underline' },
  roundTop: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 10 },
  quit: { color: c.muted, fontSize: 22, fontWeight: '700' },
  dots: { flex: 1, flexDirection: 'row', gap: 6 },
  dot: { flex: 1, height: 8, borderRadius: 4, backgroundColor: c.line },
  dotDone: { backgroundColor: c.good },
  dotNow: { backgroundColor: c.flame },
  xpPill: { color: c.gold, fontWeight: '900', fontSize: 15, fontFamily: mono },
  setting: { color: c.muted, fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  scenario: { color: c.ink, fontSize: 16, lineHeight: 24 },
  ask: { color: c.ink, fontSize: 17, lineHeight: 24, fontWeight: '800' },
  opt: { backgroundColor: c.card, borderRadius: 14, padding: 14, borderWidth: 2, borderColor: c.line, gap: 8 },
  optRight: { borderColor: c.good, backgroundColor: c.goodSoft },
  optWrong: { borderColor: c.bad, backgroundColor: c.badSoft },
  optDim: { opacity: 0.7 },
  optRow: { flexDirection: 'row', gap: 12 },
  letter: { color: c.muted, fontWeight: '900', fontSize: 16, width: 18, fontFamily: mono },
  optText: { color: c.ink, fontSize: 15, lineHeight: 22, flex: 1 },
  why: { color: c.muted, fontSize: 13, lineHeight: 19, marginLeft: 30 },
  rule: { backgroundColor: c.cardHi, borderRadius: 14, padding: 14, borderLeftWidth: 4, borderLeftColor: c.gold, gap: 4 },
  ruleLabel: { color: c.gold, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  ruleText: { color: c.ink, fontSize: 15, lineHeight: 22, fontWeight: '700' },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: c.card,
    borderTopWidth: 3,
    padding: 16,
    gap: 10,
  },
  verdict: { fontSize: 20, fontWeight: '900' },
  next: { borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  nextText: { color: '#10131F', fontSize: 17, fontWeight: '900' },
  doneEmoji: { fontSize: 72 },
  doneTitle: { color: c.ink, fontSize: 30, fontWeight: '900' },
  doneScore: { color: c.inkSoft, fontSize: 18, fontWeight: '700' },
  statN: { fontSize: 28, fontWeight: '900' },
  banner: { borderWidth: 2, borderRadius: 16, padding: 14, alignItems: 'center', gap: 4, backgroundColor: c.card, marginTop: 6 },
  bannerBig: { color: c.flame, fontSize: 22, fontWeight: '900' },
  ghost: { borderWidth: 1, borderColor: c.line, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  ghostText: { color: c.inkSoft, fontSize: 15, fontWeight: '700' },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  time: { color: c.ink, fontSize: 26, fontWeight: '900', fontFamily: mono },
  timeBtn: { backgroundColor: c.cardHi, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10 },
  timeBtnText: { color: c.inkSoft, fontWeight: '800' },
});
