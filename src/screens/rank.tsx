// Clasificación, al final de la pantalla principal (play): el nivel y el progreso de todos los que
// quieren salir, uno al lado del otro, y la del quiz en grupo. Se refresca sola cada 15 s mientras
// se ve. Ver src/rank.ts.
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { dayKey, handle, levelOf, type Profile, type Progress } from '../game.ts';
import { STR } from '../i18n.ts';
import { LIVE, cleanName, rankingList, readRanking, type RankRow } from '../live.ts';
import { BOARD_KEY, QUIZ_KEY, boardList, daysAgo, publish, readBoard, summary, type Board, type BoardRow } from '../rank.ts';
import { kvGet, kvPut, newPlayerId } from '../sync.ts';
import { Btn, Cmd, Panel, Txt } from '../term.tsx';
import { c, font } from '../theme.ts';

const REFRESH_MS = 15_000;
const MEDALS = ['🥇', '🥈', '🥉'];

const TRIES = 3;

/**
 * Sube tu fila si cambió, o la quita si te ocultaste, y devuelve la clasificación tal como queda.
 * Si otro escribe a la vez, uno de los dos pierde su fila: por eso, tras escribir, se vuelve a leer
 * y, si no está como debe, se escribe otra vez tras una pausa al azar.
 */
export async function publishMe(p: Progress): Promise<Board> {
  let board = readBoard(await kvGet(BOARD_KEY));
  if (!p.profile) return board;
  const want = p.profile.public ? summary(p, p.profile.name, dayKey(new Date())) : null;
  for (let i = 0; i < TRIES; i++) {
    const next = publish(board, p.profile.id, want);
    if (next === board) return board;
    await kvPut(BOARD_KEY, next);
    await new Promise((ok) => setTimeout(ok, 200 + Math.random() * 600));
    board = readBoard(await kvGet(BOARD_KEY));
  }
  return board;
}

type Status = { state: 'idle' } | { state: 'syncing' } | { state: 'ok'; at: Date } | { state: 'error' };

/** Los paneles de la clasificación, para meterlos al final de otra pantalla con scroll. */
export function RankPanels({ p, onProfile }: { p: Progress; onProfile: (profile: Profile) => void }) {
  const T = STR[p.lang];
  const me = p.profile;
  const [rows, setRows] = useState<BoardRow[] | null>(null);
  const [quiz, setQuiz] = useState<RankRow[]>([]);
  const [status, setStatus] = useState<Status>({ state: 'idle' });
  const [name, setName] = useState(me?.name ?? '');
  const latest = useRef(p);
  useEffect(() => {
    latest.current = p;
  });

  /** Pone tu fila al día (vuelve si alguien la pisó) y baja las dos clasificaciones. */
  const refresh = useCallback(async (progress: Progress) => {
    try {
      const [board, games] = await Promise.all([publishMe(progress), kvGet(QUIZ_KEY)]);
      setRows(boardList(board));
      setQuiz(rankingList(readRanking(games)));
      setStatus({ state: 'ok', at: new Date() });
    } catch {
      setStatus({ state: 'error' });
    }
  }, []);

  useEffect(() => {
    refresh(latest.current);
    const id = setInterval(() => refresh(latest.current), REFRESH_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const now = (profile?: Profile) => {
    setStatus({ state: 'syncing' });
    refresh(profile ? { ...p, profile } : p);
  };
  const join = () => {
    const clean = cleanName(name);
    if (!clean) return;
    const profile = { id: me?.id ?? newPlayerId(), name: clean, public: true };
    onProfile(profile);
    now(profile);
  };
  const hide = () => {
    if (!me) return;
    const profile = { ...me, public: false };
    onProfile(profile);
    now(profile);
  };

  const time = status.state === 'ok' ? status.at.toTimeString().slice(0, 8) : '';
  const quizAt = me ? quiz.findIndex((r) => r.id === me.id) : -1;
  const myQuiz = quizAt >= 0 ? quiz[quizAt] : null;

  return (
    <View style={s.block}>
      <Cmd>cca-quest rank</Cmd>

      <Panel title={T.rankYou} color={me?.public ? c.greenDim : c.cyan} titleColor={me?.public ? c.green : c.cyan}>
        {me?.public ? (
          <>
            <Txt bold color={c.green}>
              {T.rankIn(me.name)}
            </Txt>
            <Txt size={12} color={c.muted}>
              {T.rankShares}
            </Txt>
            <View style={[s.row, { marginTop: 10 }]}>
              <Btn small label="$ rank --sync" onPress={() => now()} style={{ flex: 1 }} />
              <Btn small kind="danger" label={T.rankHide} onPress={hide} style={{ flex: 1 }} />
            </View>
          </>
        ) : (
          <>
            <Txt size={12} color={c.muted}>
              {T.rankJoinNote}
            </Txt>
            <View style={[s.row, { marginTop: 10 }]}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={T.liveNamePh}
                placeholderTextColor={c.muted}
                autoCorrect={false}
                maxLength={LIVE.maxName + 4}
                onSubmitEditing={join}
                style={s.input}
              />
              <Btn small kind="primary" label={T.rankJoin} onPress={join} disabled={!cleanName(name)} />
            </View>
          </>
        )}
        <Txt size={11} color={status.state === 'error' ? c.red : c.muted} style={{ marginTop: 6 }}>
          {status.state === 'syncing' ? T.syncing : status.state === 'error' ? T.rankOffline : status.state === 'ok' ? T.syncedAt(time) : ''}
        </Txt>
      </Panel>

      <Panel title={T.rankPlayers}>
        {rows === null ? (
          <Txt size={12} color={c.muted}>
            {T.syncing}
          </Txt>
        ) : rows.length === 0 ? (
          <Txt size={12} color={c.muted}>
            {T.rankEmpty}
          </Txt>
        ) : (
          rows.map((r, i) => {
            const lvl = levelOf(r.xp);
            const ago = daysAgo(r.day);
            const mine = r.id === me?.id;
            return (
              <View key={r.id} style={s.player}>
                <View style={s.row}>
                  <Txt bold color={i === 0 ? c.amber : c.muted} style={{ width: 40 }}>
                    {MEDALS[i] ?? `#${i + 1}`}
                  </Txt>
                  <Txt bold color={mine ? c.cyan : c.text} style={{ flex: 1 }}>
                    {r.name}
                  </Txt>
                  <Txt bold color={c.amber}>
                    {r.xp} xp
                  </Txt>
                </View>
                <Txt size={12} color={c.muted} style={{ marginLeft: 46 }}>
                  lvl {lvl.n} <Txt size={12} color={c.green}>{handle(lvl.title)}</Txt>
                  {` · ${T.rankStreak(r.streak)} · ${T.rankReady(r.ready)} · ${T.rankSeen(r.seen)}`}
                  {ago === null ? '' : ` · ${ago === 0 ? T.rankToday : T.rankAgo(ago)}`}
                </Txt>
              </View>
            );
          })
        )}
      </Panel>

      <Panel title={T.rankingTitle} color={c.cyan} titleColor={c.cyan}>
        {quiz.length === 0 ? (
          <Txt size={12} color={c.muted}>
            {T.rankingEmpty}
          </Txt>
        ) : (
          <>
            {quiz.slice(0, 10).map((r, i) => (
              <View key={r.id} style={[s.row, { paddingVertical: 3 }]}>
                <Txt bold color={i === 0 ? c.amber : c.muted} style={{ width: 40 }}>
                  {MEDALS[i] ?? `#${i + 1}`}
                </Txt>
                <Txt bold={r.id === me?.id} color={r.id === me?.id ? c.cyan : c.text} style={{ flex: 1 }}>
                  {r.name}
                </Txt>
                <Txt size={12} color={c.muted}>
                  {`${T.rankingGames(r.games, r.wins)}  `}
                </Txt>
                <Txt bold color={c.green}>
                  {r.points}
                </Txt>
              </View>
            ))}
            {myQuiz && (
              <Txt size={12} color={c.cyan} style={{ marginTop: 6 }}>
                {T.rankingYou(quizAt + 1, quiz.length, myQuiz.points, Math.round((100 * myQuiz.right) / Math.max(1, myQuiz.answered)))}
              </Txt>
            )}
          </>
        )}
      </Panel>
    </View>
  );
}

const s = StyleSheet.create({
  block: { gap: 12, marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  player: { paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: c.line },
  input: {
    flex: 1,
    minWidth: 0, // en la web el campo trae un ancho propio y empujaba el botón fuera de la pantalla
    borderWidth: 1,
    borderColor: c.lineHi,
    borderRadius: 3,
    color: c.text,
    fontFamily: font.regular,
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});
