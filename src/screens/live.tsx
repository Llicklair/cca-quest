// Partida en grupo, como Kahoot!: el presentador enseña las preguntas en la pantalla que se
// comparte en la llamada y cada jugador contesta desde su móvil, en la app o en la web (el QR
// abre la web con ?quiz=CÓDIGO). La lógica está en src/live.ts y el canal en src/room.ts.
// Al acabar, cada jugador gana XP en su progreso y la partida se suma a la clasificación de todos.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';

import * as feel from '../feel.ts';
import { DOMAINS, SETTINGS, dayKey, type Lang, type Profile, type Question, type QuestionText } from '../game.ts';
import { STR, type Strings } from '../i18n.ts';
import {
  LIVE,
  addGame,
  advance,
  cleanName,
  everyoneIn,
  join,
  liveXp,
  newGame,
  newRoom,
  parseRoom,
  pick,
  rankOf,
  readRanking,
  reveal,
  showRoom,
  start,
  stateOf,
  type Game,
  type LiveState,
  type Standing,
} from '../live.ts';
import { QUESTIONS } from '../questions.ts';
import { EXAM_LEVEL } from '../questions-exam.ts';
import { QUIZ_KEY } from '../rank.ts';
import { openRoom, type Peer, type Room, type RoomStatus } from '../room.ts';
import { kvGet, kvPut, newPlayerId } from '../sync.ts';
import { Bar, Btn, Panel, Rich, Tag, Txt, Typer, confirmAction } from '../term.tsx';
import { c, domainColor, font } from '../theme.ts';
import { Qr } from './link.tsx';
import { AskClaude, inLang } from './misses.tsx';

const BY_ID = new Map([...QUESTIONS, ...EXAM_LEVEL].map((q) => [q.id, q]));
const XP_KEY = 'cca-quest:live-xp'; // partidas que ya dieron XP aquí, por si se recarga en la pantalla final
const WEB = 'https://llicklair.github.io/cca-quest/';
const TICK_MS = 250;
const HEARTBEAT_MS = 3_000; // el presentador repite el estado: así nadie se queda atrás si se pierde un mensaje

type Me = { id: string; name: string };
type Setup = { source: 'level' | 'bank'; count: number; secs: number };

/** Dónde se entra desde el móvil: la web de esta misma página o, desde la app, la de GitHub Pages. */
const joinBase = () => (Platform.OS === 'web' && typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : WEB);
const shortUrl = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');

export function Live({
  lang,
  code,
  onExit,
  onRunning,
  onXp,
  profile,
  onProfile,
}: {
  lang: Lang;
  code: string | null;
  onExit: () => void;
  onRunning: (on: boolean) => void;
  onXp: (n: number) => void;
  profile: Profile | null;
  onProfile: (p: Profile) => void;
}) {
  const T = STR[lang];
  const [mode, setMode] = useState<{ kind: 'menu' } | { kind: 'host'; setup: Setup } | { kind: 'play'; code: string; me: Me }>({ kind: 'menu' });
  const [typed, setTyped] = useState(code ? showRoom(code) : '');
  const [name, setName] = useState(profile?.name ?? '');
  const [setup, setSetup] = useState<Setup>({ source: 'level', count: LIVE.count, secs: LIVE.limit });

  const running = mode.kind !== 'menu';
  useEffect(() => onRunning(running), [running, onRunning]);
  useEffect(() => () => onRunning(false), [onRunning]);

  const room = parseRoom(typed);
  const clean = cleanName(name);
  const enter = () => {
    if (!room || !clean) return;
    // Eres el mismo jugador en todas las partidas y dispositivos vinculados: el perfil va en el progreso.
    // Si recargas la página, vuelves a la partida con tus puntos.
    const me = { id: profile?.id ?? newPlayerId(), name: clean };
    if (profile?.id !== me.id || profile.name !== clean) onProfile({ id: me.id, name: clean, public: profile?.public ?? false });
    feel.tap();
    setMode({ kind: 'play', code: room, me });
  };

  if (mode.kind === 'host') return <Host setup={mode.setup} lang={lang} onExit={() => setMode({ kind: 'menu' })} />;
  if (mode.kind === 'play') return <Play code={mode.code} me={mode.me} lang={lang} onXp={onXp} onExit={() => setMode({ kind: 'menu' })} />;

  return (
    <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
      <Typer text="$ cca-quest live" bold color={c.cyan} />
      <Txt size={12} color={c.muted}>
        {T.liveIntro}
      </Txt>

      <Panel title={T.liveJoinTitle} color={c.cyan} titleColor={c.cyan}>
        <View style={{ gap: 8 }}>
          <TextInput
            value={typed}
            onChangeText={setTyped}
            placeholder={T.liveCodePh}
            placeholderTextColor={c.muted}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={12}
            style={[s.input, s.codeInput]}
          />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={T.liveNamePh}
            placeholderTextColor={c.muted}
            autoCorrect={false}
            maxLength={LIVE.maxName + 4}
            onSubmitEditing={enter}
            style={s.input}
          />
          <Btn kind="primary" label={T.liveJoin} onPress={enter} disabled={!room || !clean} />
        </View>
      </Panel>

      <Panel title={T.liveHostTitle}>
        <Txt size={12} color={c.muted}>
          {T.liveHostNote}
        </Txt>
        <Choice
          label={T.liveSource}
          options={[
            { value: 'level', label: T.liveLevel },
            { value: 'bank', label: T.liveBank },
          ]}
          value={setup.source}
          onChange={(source) => setSetup({ ...setup, source })}
        />
        <Choice
          label={T.liveCount}
          options={LIVE.counts.map((n) => ({ value: n, label: String(n) }))}
          value={setup.count}
          onChange={(count) => setSetup({ ...setup, count })}
        />
        <Choice
          label={T.liveTime}
          options={LIVE.secs.map((n) => ({ value: n, label: `${n}s` }))}
          value={setup.secs}
          onChange={(secs) => setSetup({ ...setup, secs })}
        />
        <Btn
          label={T.liveHost}
          onPress={() => {
            feel.tap();
            setMode({ kind: 'host', setup });
          }}
          style={{ marginTop: 12 }}
        />
      </Panel>

      <Btn label="$ cd ~" onPress={onExit} />
    </ScrollView>
  );
}

/** Fila de opciones entre corchetes, como el selector de idioma. */
function Choice<V extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: V; label: string }[];
  value: V;
  onChange: (v: V) => void;
}) {
  return (
    <View style={s.choiceRow}>
      <Txt size={12} color={c.muted} style={{ width: 92 }}>
        {label}
      </Txt>
      <View style={s.choice}>
        {options.map((o) => (
          <Pressable key={String(o.value)} onPress={() => onChange(o.value)} hitSlop={6} style={[s.choiceItem, o.value === value && { backgroundColor: c.green }]}>
            <Txt size={12} bold color={o.value === value ? c.bg : c.muted}>
              {o.label}
            </Txt>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// --- Presentador ---

/**
 * Suma la partida a la clasificación de todos. Se vuelve a leer para comprobar que quedó: si la red
 * falla o alguien escribe a la vez, se intenta otra vez tras una pausa.
 */
async function recordGame(g: Game) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = readRanking(await kvGet(QUIZ_KEY));
      if (r.games.includes(g.gid)) return;
      await kvPut(QUIZ_KEY, addGame(r, g, dayKey(new Date())));
    } catch {
      // se reintenta
    }
    await new Promise((ok) => setTimeout(ok, 500 + Math.random() * 1000));
  }
}

function Host({ setup, lang, onExit }: { setup: Setup; lang: Lang; onExit: () => void }) {
  const T = STR[lang];
  const { width } = useWindowDimensions();
  const k = width >= 900 ? 1.3 : 1; // en la pantalla compartida, letra más grande
  const pool = setup.source === 'level' ? EXAM_LEVEL : QUESTIONS;
  const [code] = useState(() => newRoom());
  const [game, setGame] = useState(() => newGame(pool, setup.count, setup.secs));
  const [peers, setPeers] = useState<Peer[]>([]);
  const [status, setStatus] = useState<RoomStatus>('connecting');
  const room = useRef<Room | null>(null);
  // El canal y los temporizadores viven fuera del render: leen lo último de estas refs.
  const latest = useRef(game);
  const online = useRef<string[]>([]);
  useEffect(() => {
    latest.current = game;
    online.current = peers.filter((x) => !x.host).map((x) => x.id);
  });

  useEffect(() => {
    const r = openRoom(
      code,
      { id: `host-${code}`, name: 'host', host: true },
      {
        message: (event, msg) => {
          if (event === 'answer') setGame((g) => pick(g, String(msg.id), String(msg.name ?? ''), String(msg.qid), Number(msg.pos), Date.now()));
          else if (event === 'hello') r.send('state', stateOf(latest.current, Date.now()));
        },
        // Quien aparece conectado entra en la partida; quien se va conserva sus puntos.
        peers: (list) => {
          setPeers(list);
          setGame((g) => list.filter((x) => !x.host).reduce((acc, x) => join(acc, x.id, x.name), g));
        },
        status: setStatus,
      },
    );
    room.current = r;
    return () => r.leave();
  }, [code]);

  // Cada cambio se anuncia al momento, y además cada pocos segundos por si alguien se perdió uno.
  useEffect(() => {
    room.current?.send('state', stateOf(game, Date.now()));
  }, [game]);
  useEffect(() => {
    const id = setInterval(() => room.current?.send('state', stateOf(latest.current, Date.now())), HEARTBEAT_MS);
    return () => clearInterval(id);
  }, []);

  // Se corrige al acabarse el tiempo o en cuanto contestan todos los conectados.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      setGame((g) => (g.phase === 'question' && (g.startedAt + g.limit <= t || everyoneIn(g, online.current)) ? reveal(g) : g));
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  // Al acabar, la partida se suma a la clasificación de todos (una vez: addGame mira el gid).
  const recorded = useRef<string | null>(null);
  useEffect(() => {
    if (game.phase !== 'end' || recorded.current === game.gid) return;
    recorded.current = game.gid;
    recordGame(game);
  }, [game]);

  const quit = () =>
    game.phase === 'lobby' || game.phase === 'end' ? onExit() : confirmAction(T.liveEndTitle, T.liveEndBody, T.liveEndAction, T.cancel, onExit);

  const players = peers.filter((x) => !x.host);
  const onlineIds = new Set(players.map((x) => x.id));
  const url = joinBase();
  const q = game.phase === 'question' || game.phase === 'reveal' ? BY_ID.get(game.qids[game.i]) : undefined;
  const state = stateOf(game, now);

  return (
    <View style={s.fill}>
      <View style={s.top}>
        <Pressable onPress={quit} hitSlop={12}>
          <Txt bold color={c.muted}>
            [x]
          </Txt>
        </Pressable>
        <Txt bold size={14 * k} color={c.cyan}>
          {showRoom(code)}
        </Txt>
        {(game.phase === 'question' || game.phase === 'reveal') && (
          <Txt bold size={14 * k}>
            q {game.i + 1}/{game.qids.length}
          </Txt>
        )}
        <View style={{ flex: 1 }} />
        {status !== 'live' && (
          <Txt size={12} color={status === 'error' ? c.red : c.muted}>
            {status === 'error' ? T.liveOffline : T.liveConnecting}
          </Txt>
        )}
        {game.phase === 'question' && (
          <>
            <Txt size={13 * k} color={c.muted}>
              {T.liveAnswered(state.answered.length, players.length)}
            </Txt>
            <Clock deadline={game.startedAt + game.limit} k={k} />
          </>
        )}
      </View>

      <ScrollView contentContainerStyle={[s.page, s.wide, { paddingBottom: 40 }]} key={`${game.phase}-${game.i}`}>
        {game.phase === 'lobby' && (
          <>
            <Typer text="$ cca-quest live --host" bold color={c.cyan} />
            <Panel title={T.liveJoinTitle} color={c.cyan} titleColor={c.cyan}>
              <View style={[s.lobby, width >= 700 && { flexDirection: 'row' }]}>
                <View style={{ flex: 1, gap: 6 }}>
                  <Txt size={14 * k} color={c.muted}>
                    {T.liveJoinAt(shortUrl(url))}
                  </Txt>
                  <Txt bold size={52 * k} color={c.green} style={{ letterSpacing: 8, fontFamily: font.bold }}>
                    {showRoom(code)}
                  </Txt>
                </View>
                <Qr value={`${url}?quiz=${code}`} size={Math.round(220 * k)} />
              </View>
            </Panel>
            <Panel title={T.livePlayers(players.length)}>
              {Object.keys(game.players).length === 0 ? (
                <Txt color={c.muted}>{T.liveWaitingPlayers}</Txt>
              ) : (
                <View style={s.names}>
                  {Object.entries(game.players).map(([pid, x]) => (
                    <Txt key={pid} bold size={15 * k} color={onlineIds.has(pid) ? c.text : c.muted}>
                      [{x.name}]
                    </Txt>
                  ))}
                </View>
              )}
            </Panel>
            <Txt size={12} color={c.muted}>
              {T.liveSetup(setup.source === 'level' ? T.liveLevel : T.liveBank, game.qids.length, setup.secs)}
            </Txt>
            <Txt size={12} color={c.amber}>
              {T.liveHostHint}
            </Txt>
            <Btn
              kind="primary"
              label={T.liveStart(players.length)}
              onPress={() => {
                feel.tap();
                setGame((g) => start(g, Date.now()));
              }}
            />
          </>
        )}

        {q && (
          <>
            <Head q={q} tx={inLang(q, lang)} k={k} />
            <Options
              tx={inLang(q, lang)}
              order={state.order}
              right={state.right}
              tally={state.phase === 'reveal' ? state.tally : undefined}
              k={k}
            />
            {game.phase === 'question' && (
              <Txt size={12 * k} color={c.amber}>
                {T.liveHostHint}
              </Txt>
            )}
            {game.phase === 'reveal' && (
              <>
                <Panel title={T.remember} color={c.amber} titleColor={c.amber}>
                  <Rich text={inLang(q, lang).rule} bold size={14 * k} color={c.amber} />
                </Panel>
                <Board board={state.board} T={T} max={5} gained k={k} />
              </>
            )}
          </>
        )}

        {game.phase === 'end' && (
          <>
            <Over T={T} k={k} />
            <Board board={state.board} T={T} k={k} />
            <Btn
              kind="primary"
              label={T.liveAgain}
              onPress={() =>
                setGame((g) => Object.entries(g.players).reduce((acc, [pid, x]) => join(acc, pid, x.name), newGame(pool, setup.count, setup.secs)))
              }
            />
            <Btn label="$ exit" onPress={onExit} />
          </>
        )}
      </ScrollView>

      {/* Abajo y siempre a mano, para no tener que bajar hasta el final mientras se comenta. */}
      {(game.phase === 'question' || game.phase === 'reveal') && (
        <View style={s.bottom}>
          <View style={[s.wide, s.bottomRow]}>
            {game.phase === 'question' ? (
              <Btn label={T.liveRevealNow} onPress={() => setGame(reveal)} style={{ flex: 1 }} />
            ) : (
              <>
                {q && (
                  <View style={{ flex: 1 }}>
                    <AskClaude q={q} lang={lang} order={state.order} />
                  </View>
                )}
                <Btn
                  kind="primary"
                  label={game.i + 1 < game.qids.length ? T.liveNext : T.liveFinal}
                  onPress={() => {
                    feel.tap();
                    setGame((g) => advance(g, Date.now()));
                  }}
                  style={{ flex: 1 }}
                />
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

// --- Jugador ---

function Play({ code, me, lang, onXp, onExit }: { code: string; me: Me; lang: Lang; onXp: (n: number) => void; onExit: () => void }) {
  const T = STR[lang];
  const [state, setState] = useState<LiveState | null>(null);
  const [deadline, setDeadline] = useState(0);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [status, setStatus] = useState<RoomStatus>('connecting');
  const [mine, setMine] = useState<Record<string, number>>({}); // qid → posición elegida
  const [earned, setEarned] = useState<number | null>(null); // XP de la partida, al acabar
  const room = useRef<Room | null>(null);
  const picks = useRef(mine);
  const giveXp = useRef(onXp);
  useEffect(() => {
    picks.current = mine;
    giveXp.current = onXp;
  });

  // Partidas que ya dieron XP en este dispositivo: el presentador repite el estado final cada pocos
  // segundos, y se puede recargar la página en la pantalla final.
  const credited = useRef<string[]>([]);
  useEffect(() => {
    AsyncStorage.getItem(XP_KEY)
      .then((v) => (credited.current = [...new Set([...(v ? (JSON.parse(v) as string[]) : []), ...credited.current])]))
      .catch(() => {});
  }, []);
  const credit = (s: LiveState) => {
    if (credited.current.includes(s.gid)) return;
    credited.current = [...credited.current, s.gid].slice(-20);
    AsyncStorage.setItem(XP_KEY, JSON.stringify(credited.current)).catch(() => {});
    const played = s.board.filter((x) => x.answered > 0);
    const mineNow = played.find((x) => x.id === me.id);
    if (!mineNow) return;
    const xp = liveXp(mineNow, rankOf(played, me.id), played.length);
    giveXp.current(xp);
    setEarned(xp);
  };
  const creditRef = useRef(credit);
  useEffect(() => {
    creditRef.current = credit;
  });

  useEffect(() => {
    const r = openRoom(
      code,
      { id: me.id, name: me.name, host: false },
      {
        message: (event, msg) => {
          if (event !== 'state') return;
          const next = msg as LiveState;
          setState(next);
          setDeadline(Date.now() + next.left);
          if (next.phase === 'end') creditRef.current(next);
          // Si nuestra respuesta no llegó, se manda otra vez: el presentador se queda con la primera.
          const pos = next.qid ? picks.current[next.qid] : undefined;
          if (next.phase === 'question' && pos !== undefined && !next.answered.includes(me.id))
            r.send('answer', { id: me.id, name: me.name, qid: next.qid, pos });
        },
        peers: setPeers,
        status: (st) => {
          setStatus(st);
          if (st === 'live') room.current?.send('hello', { id: me.id });
        },
      },
    );
    room.current = r;
    return () => r.leave();
  }, [code, me]);

  // Al corregir manda lo que recibió el presentador: una respuesta que llegó después de corregir no cuenta.
  const counted = !!state && state.answered.includes(me.id);
  const ok = !!state?.qid && counted && mine[state.qid] === state.right;

  // Al corregir, vibra según hayas acertado o no (una vez por pregunta).
  const felt = useRef<string | null>(null);
  useEffect(() => {
    if (state?.phase !== 'reveal' || !state.qid || felt.current === state.qid) return;
    felt.current = state.qid;
    if (ok) feel.good();
    else feel.bad();
  }, [state, ok]);

  const answer = (pos: number) => {
    if (!state?.qid || mine[state.qid] !== undefined) return;
    feel.tap();
    setMine({ ...mine, [state.qid]: pos });
    room.current?.send('answer', { id: me.id, name: me.name, qid: state.qid, pos });
  };

  const host = peers.some((x) => x.host);
  const q = state?.qid ? BY_ID.get(state.qid) : undefined;
  const picked = state?.qid ? mine[state.qid] : undefined;
  const rank = state ? rankOf(state.board, me.id) : 0;
  const myStanding = state?.board.find((x) => x.id === me.id);

  let notice: string | null = null;
  if (status === 'connecting') notice = T.liveConnecting;
  else if (status === 'error') notice = T.liveOffline;
  else if (!host) notice = state ? T.liveHostLeft : T.liveNoHost(showRoom(code));

  return (
    <View style={s.fill}>
      <View style={s.top}>
        <Pressable onPress={onExit} hitSlop={12}>
          <Txt bold color={c.muted}>
            [x]
          </Txt>
        </Pressable>
        <Txt bold color={c.cyan}>
          {showRoom(code)}
        </Txt>
        <Txt bold>{me.name}</Txt>
        <View style={{ flex: 1 }} />
        {myStanding && (
          <Txt bold color={c.amber}>
            {myStanding.score}
          </Txt>
        )}
        {state?.phase === 'question' && <Clock deadline={deadline} />}
      </View>

      <ScrollView contentContainerStyle={[s.page, { paddingBottom: 40 }]} key={state ? `${state.phase}-${state.i}` : 'wait'}>
        {notice && <Txt color={status === 'error' ? c.red : c.muted}>{`> ${notice}`}</Txt>}

        {(!state || state.phase === 'lobby') && host && (
          <>
            <Typer text={`$ cca-quest live --join ${showRoom(code)}`} bold color={c.cyan} />
            <Txt bold color={c.green}>
              {'> '}
              {T.liveIn(me.name)}
            </Txt>
            {state && (
              <Panel title={T.livePlayers(state.board.length)}>
                <View style={s.names}>
                  {state.board.map((x) => (
                    <Txt key={x.id} bold color={x.id === me.id ? c.cyan : c.text}>
                      [{x.name}]
                    </Txt>
                  ))}
                </View>
              </Panel>
            )}
            <Txt color={c.muted}>{T.liveWaitStart}</Txt>
          </>
        )}

        {state && q && (state.phase === 'question' || state.phase === 'reveal') && (
          <>
            {state.phase === 'reveal' && (
              <Panel color={ok ? c.green : c.red}>
                <Txt bold size={18} color={ok ? c.green : c.red}>
                  {'> '}
                  {ok ? T.liveRight(myStanding?.gained ?? 0) : counted ? T.liveWrong : picked === undefined ? T.liveNoPick : T.liveLate}
                </Txt>
                {rank > 0 && myStanding && <Txt color={c.text}>{T.liveRank(rank, state.board.length, myStanding.score)}</Txt>}
              </Panel>
            )}
            {state.phase === 'reveal' && (
              <AskClaude q={q} lang={lang} order={state.order} picked={picked === undefined ? null : state.order[picked]} />
            )}
            <Head q={q} tx={inLang(q, lang)} />
            <Options
              tx={inLang(q, lang)}
              order={state.order}
              right={state.right}
              mine={picked}
              tally={state.phase === 'reveal' ? state.tally : undefined}
              onPick={state.phase === 'question' ? answer : undefined}
            />
            {state.phase === 'question' && picked !== undefined && <Txt color={c.cyan}>{`> ${T.liveLocked}`}</Txt>}
            {state.phase === 'question' && picked === undefined && <TimeUp deadline={deadline} T={T} />}
            {state.phase === 'reveal' && (
              <Panel title={T.remember} color={c.amber} titleColor={c.amber}>
                <Rich text={inLang(q, lang).rule} bold color={c.amber} />
              </Panel>
            )}
          </>
        )}

        {state?.phase === 'end' && (
          <>
            <Over T={T} />
            {myStanding && (
              <Txt bold size={16} color={c.green}>
                {T.liveRank(rank, state.board.length, myStanding.score)} · {T.liveRightN(myStanding.right, state.n)}
              </Txt>
            )}
            {earned !== null && (
              <Txt bold size={16} color={c.amber}>
                {T.liveXp(earned)}
              </Txt>
            )}
            <Board board={state.board} T={T} me={me.id} />
            <Btn label="$ exit" onPress={onExit} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

// --- Piezas ---

/** Escenario y pregunta, con su escenario oficial, dominio y tarea. */
function Head({ q, tx, k = 1 }: { q: Question; tx: QuestionText; k?: number }) {
  const dom = DOMAINS.find((d) => d.id === q.domain)!;
  return (
    <>
      <Panel title={q.setting ? SETTINGS[q.setting].name.toLowerCase() : 'scenario'} color={domainColor[q.domain]} titleColor={domainColor[q.domain]}>
        <View style={s.tags}>
          <Tag label={`d${dom.n} ${dom.short.toLowerCase()}`} color={domainColor[q.domain]} />
          {q.ts && <Tag label={`task ${q.ts}`} />}
        </View>
        <Rich text={tx.scenario} size={15 * k} />
      </Panel>
      <Rich text={`? ${tx.ask}`} bold size={15 * k} color={c.green} />
    </>
  );
}

/**
 * Las opciones en el orden de la partida, con la misma letra en todas las pantallas. Al corregir:
 * la buena en verde, la tuya en rojo si fallaste, cuántos eligieron cada una y el porqué.
 */
function Options({
  tx,
  order,
  right,
  mine,
  tally,
  onPick,
  k = 1,
}: {
  tx: QuestionText;
  order: number[];
  right: number | null;
  mine?: number;
  tally?: number[];
  onPick?: (pos: number) => void;
  k?: number;
}) {
  const shown = right !== null;
  const votes = tally ? tally.reduce((a, b) => a + b, 0) : 0;
  return (
    <View style={{ gap: 8 }}>
      {order.map((orig, pos) => {
        const good = shown && pos === right;
        const bad = shown && pos === mine && !good;
        const chosen = !shown && pos === mine;
        const tone = good ? c.green : bad ? c.red : chosen ? c.cyan : shown ? c.line : c.lineHi;
        return (
          <Pressable
            key={pos}
            disabled={!onPick || mine !== undefined}
            onPress={() => onPick?.(pos)}
            style={({ pressed }) => [
              s.opt,
              { borderColor: tone },
              (good || chosen) && { backgroundColor: c.greenBg },
              bad && { backgroundColor: c.redBg },
              shown && !good && !bad && { opacity: 0.6 },
              pressed && { backgroundColor: c.greenBg },
            ]}
          >
            <View style={s.optRow}>
              <Txt bold size={14 * k} color={good ? c.green : bad ? c.red : chosen ? c.cyan : c.muted}>
                [{good ? '✓' : bad ? '✗' : 'ABCDE'[pos]}]
              </Txt>
              <Rich text={tx.options[orig]} size={14 * k} style={{ flex: 1 }} />
            </View>
            {tally && shown && (
              <View style={[s.votes, { marginLeft: 36 * k }]}>
                <Bar value={votes ? tally[pos] / votes : 0} width={12} color={good ? c.green : c.muted} />
                <Txt bold size={13 * k} color={good ? c.green : c.muted}>
                  {` ${tally[pos]}`}
                </Txt>
              </View>
            )}
            {shown && <Rich text={`└ ${tx.why[orig]}`} size={12 * k} color={good ? c.text : c.muted} style={{ marginLeft: 36 * k }} />}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Cuenta atrás con el reloj de este dispositivo. */
function Clock({ deadline, k = 1 }: { deadline: number; k?: number }) {
  const secs = useSecsLeft(deadline);
  return (
    <Txt bold size={16 * k} color={secs <= 10 ? c.red : secs <= 30 ? c.amber : c.green}>
      ⏱ {secs}s
    </Txt>
  );
}

function TimeUp({ deadline, T }: { deadline: number; T: Strings }) {
  const secs = useSecsLeft(deadline);
  return secs === 0 ? <Txt color={c.amber}>{`> ${T.liveTimeUp}`}</Txt> : null;
}

function useSecsLeft(deadline: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, []);
  return Math.ceil(Math.max(0, deadline - now) / 1000);
}

const MEDALS = ['🥇', '🥈', '🥉'];

function Board({ board, T, me, max, gained, k = 1 }: { board: Standing[]; T: Strings; me?: string; max?: number; gained?: boolean; k?: number }) {
  return (
    <Panel title={T.liveBoard}>
      {board.slice(0, max).map((x, i) => (
        <View key={x.id} style={s.boardRow}>
          <Txt bold size={14 * k} color={i === 0 ? c.amber : c.muted} style={{ width: 44 * k }}>
            {MEDALS[i] ?? `#${i + 1}`}
          </Txt>
          <Txt bold={x.id === me} size={14 * k} color={x.id === me ? c.cyan : c.text} style={{ flex: 1 }}>
            {x.name}
          </Txt>
          {gained && x.gained > 0 && (
            <Txt size={12 * k} color={c.amber}>
              {`+${x.gained}  `}
            </Txt>
          )}
          <Txt bold size={14 * k} color={c.green}>
            {x.score}
          </Txt>
        </View>
      ))}
    </Panel>
  );
}

function Over({ T, k = 1 }: { T: Strings; k?: number }) {
  const line = '═'.repeat(T.liveOver.length + 2);
  return (
    <Txt bold size={18 * k} color={c.amber} style={{ textAlign: 'center', marginVertical: 10 }}>
      {`╔${line}╗\n║ ${T.liveOver} ║\n╚${line}╝`}
    </Txt>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: c.bg },
  page: { padding: 16, gap: 12 },
  wide: { width: '100%', maxWidth: 1100, alignSelf: 'center' },
  bottom: { borderTopWidth: 1, borderTopColor: c.lineHi, backgroundColor: c.panel, paddingHorizontal: 16, paddingVertical: 10 },
  bottomRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.line },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  opt: { borderWidth: 1, borderRadius: 3, padding: 12, gap: 6, backgroundColor: c.panel },
  optRow: { flexDirection: 'row', gap: 10 },
  votes: { flexDirection: 'row', alignItems: 'center' },
  lobby: { gap: 16, alignItems: 'center' },
  names: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  boardRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3 },
  choiceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  choice: { flexDirection: 'row', borderWidth: 1, borderColor: c.lineHi, borderRadius: 3, overflow: 'hidden', flexWrap: 'wrap' },
  choiceItem: { paddingHorizontal: 10, paddingVertical: 5 },
  input: {
    borderWidth: 1,
    borderColor: c.lineHi,
    borderRadius: 3,
    color: c.text,
    fontFamily: font.regular,
    fontSize: 15,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  codeInput: { fontFamily: font.bold, fontSize: 20, letterSpacing: 6 },
});
