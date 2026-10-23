import { JetBrainsMono_400Regular, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState, BackHandler, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import * as feel from './src/feel';
import {
  addXp,
  answer,
  buildSession,
  EXAM,
  dayKey,
  examResult,
  isRight,
  levelOf,
  liveStreak,
  readLesson,
  reviewCard,
  rollDay,
  roundPool,
  sessionBonus,
  type Lang,
  type Profile,
  type Progress,
  type Question,
} from './src/game';
import { FLASHCARDS } from './src/flashcards';
import { TERMS } from './src/glossary';
import { STR } from './src/i18n';
import { LESSONS } from './src/lessons';
import { ensurePermission, reschedule, testNotification } from './src/notify';
import { checkUpdate, type UpdateInfo } from './src/update';
import { BANK, LEVEL_BANK } from './src/bank';
import { Cards } from './src/screens/cards';
import { Config } from './src/screens/config';
import { Exam, type Slot } from './src/screens/exam';
import { Misses } from './src/screens/misses';
import { Glossary } from './src/screens/glossary';
import { LessonList, LessonView } from './src/screens/learn';
import { Live } from './src/screens/live';
import { publishMe } from './src/screens/rank';
import { Done, RoundView, Status, newRound, type Round } from './src/screens/play';
import { parseRoom } from './src/live';
import { load, save, wipe } from './src/storage';
import { useSync } from './src/sync';
import { Boot, LangToggle, Rain, Txt, confirmAction } from './src/term';
import { c } from './src/theme';

type Tab = 'play' | 'learn' | 'cards' | 'grep' | 'config';
type PlayView = 'status' | 'round' | 'done' | 'exam' | 'misses' | 'live';
const TABS: Tab[] = ['play', 'learn', 'cards', 'grep', 'config'];

const PUBLISH_MS = 5_000;

// El QR de una partida en grupo abre la web con ?quiz=CÓDIGO: se va directo a entrar, sin arranque.
const quizLink = Platform.OS === 'web' && typeof window !== 'undefined' ? parseRoom(window.location.search) : null;

const today = () => dayKey(new Date());
// Los avisos cuentan lo que toca repasar, también las preguntas nivel examen ya vistas.
const remind = (p: Progress) => reschedule(roundPool(BANK, LEVEL_BANK, p), p);

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
  const [fontsReady] = useFonts({ Mono: JetBrainsMono_400Regular, MonoBold: JetBrainsMono_700Bold });
  const [p, setP] = useState<Progress | null>(null);
  const [tab, setTab] = useState<Tab>('play');
  const [view, setView] = useState<PlayView>(quizLink ? 'live' : 'status');
  const [round, setRound] = useState<Round | null>(null);
  const [lesson, setLesson] = useState<string | null>(null);
  const [deckRunning, setDeckRunning] = useState(false);
  const [examRunning, setExamRunning] = useState(false);
  const [liveRunning, setLiveRunning] = useState(false);
  const [booted, setBooted] = useState(quizLink !== null);
  const [boom, setBoom] = useState(0);
  const [update, setUpdate] = useState<UpdateInfo | null | undefined>(undefined);
  const [checking, setChecking] = useState(false);
  const endBoot = useCallback(() => setBooted(true), []);
  // El progreso más reciente, también para la sincronización, que trabaja fuera del render.
  const latest = useRef<Progress | null>(null);
  const applyRemote = useCallback((next: Progress) => {
    latest.current = next;
    setP(next);
    save(next);
  }, []);
  const sync = useSync(() => latest.current, applyRemote, today);
  const bootLines = useMemo(() => {
    if (!p) return [];
    const lvl = levelOf(p.xp);
    return STR[p.lang].boot(BANK.length, LESSONS.length, FLASHCARDS.length, TERMS.length, lvl.n, p.xp, liveStreak(p, today()));
    // solo al arrancar: no hace falta rehacerlo cuando cambia el progreso
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p === null]);

  useEffect(() => {
    load(today()).then((loaded) => {
      latest.current = loaded;
      setP(loaded);
      if (loaded.reminder.on) ensurePermission().then(() => remind(loaded));
    });
  }, []);

  // Al arrancar se mira si hay una APK más nueva en las releases del repo. Solo en Android:
  // en iPhone actualiza TestFlight y en la web siempre está la última.
  useEffect(() => {
    if (Platform.OS === 'android') checkUpdate().then(setUpdate);
  }, []);

  // Al volver a la app puede ser otro día: se ponen a cero los contadores de hoy.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setP((cur) => (cur ? (latest.current = rollDay(cur, today())) : cur));
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (examRunning || liveRunning) return true;
      if (tab === 'learn' && lesson) setLesson(null);
      else if (tab === 'play' && (view === 'done' || view === 'exam' || view === 'misses' || view === 'live')) setView('status');
      else if (tab !== 'play') setTab('play');
      else return false;
      return true;
    });
    return () => sub.remove();
  }, [tab, view, lesson, examRunning, liveRunning]);

  // Cada cambio lleva la hora para saber, al sincronizar, qué copia es la más reciente.
  const { schedule } = sync;
  const commit = useCallback(
    (next: Progress) => {
      const stamped = { ...next, stamp: Date.now() };
      latest.current = stamped;
      setP(stamped);
      save(stamped);
      schedule();
    },
    [schedule],
  );

  // Quien sale en la clasificación la mantiene al día: unos segundos después de cada cambio
  // (también de los que llegan del otro dispositivo) se publica su fila, si ha cambiado.
  useEffect(() => {
    if (!p?.profile?.public) return;
    const id = setTimeout(() => publishMe(p).catch(() => {}), PUBLISH_MS);
    return () => clearTimeout(id);
  }, [p]);

  if (!p || !fontsReady) return <View style={s.fill} />;
  if (!booted) {
    return (
      <View style={[s.fill, { paddingTop: insets.top }]}>
        <Boot lines={bootLines} onDone={endBoot} />
      </View>
    );
  }

  const celebrate = () => {
    setBoom((b) => b + 1);
    feel.big();
  };

  const start = (qs: Question[] = roundPool(BANK, LEVEL_BANK, p), label = 'daily') => {
    const picked = buildSession(qs, rollDay(p, today()), today(), Math.min(5, qs.length));
    feel.tap();
    setRound(newRound(picked, label));
    setTab('play');
    setView('round');
  };

  const practice = (ts: string) => start(BANK.filter((q) => q.ts === ts), `task ${ts}`);

  // `chosen`: el índice original elegido, o la máscara de lo marcado en las de respuesta múltiple.
  const pick = (chosen: number) => {
    if (!round || round.picked !== null) return;
    const item = round.items[round.i];
    const ok = isRight(item.q, chosen);
    const o = answer(p, item.q.id, ok, round.combo, today(), chosen);
    commit(o.progress);
    if (ok) feel.good();
    else feel.bad();
    setRound({
      ...round,
      picked: chosen,
      combo: o.combo,
      best: Math.max(round.best, o.combo),
      right: round.right + (ok ? 1 : 0),
      xp: round.xp + o.gained,
      gain: o.gained,
      levelUp: o.levelUp ?? round.levelUp,
      goalMet: round.goalMet || o.goalJustMet,
      picks: [...round.picks, chosen],
    });
  };

  const next = () => {
    if (!round) return;
    if (round.i + 1 < round.items.length) {
      feel.tap();
      setRound({ ...round, i: round.i + 1, picked: null });
      return;
    }
    const { progress, levelUp } = addXp(p, sessionBonus(round.right, round.items.length));
    commit(progress);
    remind(progress);
    const done = { ...round, xp: round.xp + progress.xp - p.xp, levelUp: levelUp ?? round.levelUp };
    setRound(done);
    setView('done');
    if (done.right === done.items.length || done.levelUp || done.goalMet) celebrate();
  };

  const T = STR[p.lang];

  const quit = () =>
    confirmAction(T.leaveTitle, T.leaveBody, T.leave, T.cancel, () => {
      remind(p);
      setView('status');
    });

  const markRead = (ts: string) => {
    const r = readLesson(p, ts, today());
    commit(r.progress);
    feel.good();
    if (r.levelUp) celebrate();
  };

  const gradeCard = (id: string, knew: boolean) => {
    const r = reviewCard(p, id, knew, today());
    commit(r.progress);
    if (r.levelUp) celebrate();
    return r;
  };

  const setLang = (lang: Lang) => {
    const next = { ...p, lang };
    commit(next);
    remind(next); // los avisos ya programados pasan al idioma nuevo
  };

  // El perfil (nombre, id y si sales en la clasificación) va en el progreso: así viaja con la sincronización.
  const setProfile = (profile: Profile) => commit({ ...p, profile });

  // El simulacro cuenta como práctica: cada respuesta pasa por el mismo sistema de cajas y XP.
  const finishExam = (slots: Slot[], secs: number, label: string) => {
    let next = p;
    // Lo no contestado cuenta como fallo en la nota, pero no da XP ni suma a la meta del día.
    for (const { q, picked } of slots) if (picked !== null) next = answer(next, q.id, isRight(q, picked), 0, today(), picked).progress;
    const result = examResult(slots, today(), secs, label);
    next = { ...next, exams: [result, ...next.exams].slice(0, 30), examDraft: null };
    commit(next);
    remind(next);
    if (levelOf(next.xp).n > levelOf(p.xp).n || result.right / result.total >= EXAM.target) celebrate();
    return { result, gained: next.xp - p.xp };
  };

  const updateReminder = (change: Partial<Progress['reminder']>) => {
    const next = { ...p, reminder: { ...p.reminder, ...change } };
    commit(next);
    if (next.reminder.on) ensurePermission().then(() => remind(next));
    else remind(next);
  };

  const inRound = tab === 'play' && view === 'round';
  const open = lesson ? LESSONS.find((l) => l.ts === lesson) : undefined;

  return (
    <View style={[s.fill, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Un único botón de idioma, siempre arriba a la derecha: cambia toda la app. */}
      <View style={s.header}>
        <Txt size={12} color={c.muted}>
          ~/cca-quest
        </Txt>
        <LangToggle lang={p.lang} onChange={setLang} />
      </View>
      <View style={s.fill}>
        {tab === 'play' && view === 'status' && (
          <Status
            p={p}
            update={update?.available ? update.latest : null}
            onUpdate={() => setTab('config')}
            onPlay={() => start()}
            onExam={() => setView('exam')}
            onLesson={(ts) => {
              setLesson(ts);
              setTab('learn');
            }}
            onCards={() => setTab('cards')}
            onMisses={() => setView('misses')}
            onLive={() => setView('live')}
            onProfile={setProfile}
          />
        )}
        {tab === 'play' && view === 'live' && (
          <Live
            lang={p.lang}
            code={quizLink}
            profile={p.profile}
            onProfile={setProfile}
            onExit={() => setView('status')}
            onRunning={setLiveRunning}
            // La partida en grupo da XP como una ronda; no toca las preguntas ni la racha.
            onXp={(n) => {
              const r = addXp(p, n);
              commit(r.progress);
              if (r.levelUp) celebrate();
            }}
          />
        )}
        {tab === 'play' && view === 'misses' && (
          <Misses p={p} onPractice={(qs) => start(qs, 'misses')} onBack={() => setView('status')} />
        )}
        {tab === 'play' && view === 'exam' && (
          <Exam
            p={p}
            onFinish={finishExam}
            // Forma funcional: el cronómetro llama a esto desde un intervalo y no debe pisar progreso más reciente.
            onSaveDraft={(examDraft) =>
              setP((cur) => {
                if (!cur) return cur;
                const next = { ...cur, examDraft, stamp: Date.now() };
                latest.current = next;
                save(next);
                schedule();
                return next;
              })
            }
            onExit={() => setView('status')}
            onRunning={setExamRunning}
          />
        )}
        {tab === 'play' && view === 'round' && round && (
          <RoundView
            key={round.i}
            round={round}
            lang={p.lang}
            onAnswer={pick}
            onNext={next}
            onQuit={quit}
            onLesson={(ts) => {
              setLesson(ts);
              setTab('learn');
            }}
          />
        )}
        {tab === 'play' && view === 'done' && round && (
          <Done round={round} p={p} onAgain={() => start()} onHome={() => setView('status')} />
        )}
        {tab === 'learn' &&
          (open ? (
            <LessonView
              key={open.ts}
              lesson={open}
              p={p}
              onBack={() => setLesson(null)}
              onRead={() => markRead(open.ts)}
              onPractice={() => practice(open.ts)}
            />
          ) : (
            <LessonList p={p} onOpen={setLesson} />
          ))}
        {tab === 'cards' && <Cards p={p} onReview={gradeCard} onRunning={setDeckRunning} />}
        {tab === 'grep' && <Glossary p={p} />}
        {tab === 'config' && (
          <Config
            p={p}
            sync={sync}
            onReminder={updateReminder}
            update={update}
            checking={checking}
            onCheck={() => {
              setChecking(true);
              checkUpdate().then((u) => {
                setUpdate(u);
                setChecking(false);
              });
            }}
            onTest={async () => {
              if (!(await testNotification(p.lang))) Alert.alert(T.notifOffTitle, T.notifOffBody);
            }}
            onReset={() =>
              confirmAction(T.resetTitle, sync.channel ? `${T.resetBody} ${T.resetLinked}` : T.resetBody, T.resetAction, T.cancel, async () => {
                // Se desvincula antes de borrar: si no, la siguiente sincronización traería el progreso de vuelta.
                await sync.unlink();
                await wipe();
                const blank = await load(today());
                commit(blank);
                remind(blank);
                setRound(null);
                setView('status');
                setTab('play');
              })
            }
          />
        )}
      </View>

      {!inRound && !deckRunning && !examRunning && !liveRunning && (
        <View style={s.tabs}>
          {TABS.map((t) => {
            const on = tab === t;
            const label = t === 'play' && view === 'round' && round ? `▶ ${T.tabs.play}` : T.tabs[t];
            return (
              <Pressable
                key={t}
                onPress={() => {
                  feel.tap();
                  if (t === 'learn' && tab === 'learn') setLesson(null);
                  setTab(t);
                }}
                style={[s.tab, on && { backgroundColor: c.green }]}
              >
                <Txt bold size={12} color={on ? c.bg : c.muted}>
                  {label}
                </Txt>
              </Pressable>
            );
          })}
        </View>
      )}
      {boom > 0 && <Rain key={boom} />}
    </View>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: c.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: c.line,
  },
  tabs: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: c.lineHi, backgroundColor: c.panel, paddingHorizontal: 6, paddingVertical: 6, gap: 4 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 3 },
});
