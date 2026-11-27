import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';

import * as feel from '../feel.ts';
import {
  CALIBRATION_LABELS,
  DOMAINS,
  EXAM,
  EXAM_LEVEL_60_LABEL,
  EXAM_LEVEL_LABEL,
  FIXED_EXAMS,
  SETTINGS,
  bestScore,
  buildExam,
  fixedExams,
  isCalibration,
  isMulti,
  isRight,
  isWeighted,
  levelExam,
  pickedOf,
  previousAttempt,
  replayExam,
  rightOf,
  scoreOf,
  shuffle,
  type ExamDraft,
  type ExamResult,
  type Progress,
  type Question,
} from '../game.ts';
import { examPrompt, studyPrompt } from '../ask.ts';
import { STR } from '../i18n.ts';
import { AskButton, AskClaude, MissCard, inLang } from './misses.tsx';
import { BANK, CALIBRATION, LEVEL_BANK, LEVEL_BANK_60 } from '../bank.ts';
import { TRAPS, calibReport, canCheck, trapOf } from '../calibration.ts';
import { QUESTIONS } from '../questions.ts';
import { useGuard } from '../shield.tsx';
import { studyRecord } from '../study.ts';
import { trapPrompt } from '../trap.ts';
import { Bar, BounceIn, Btn, Cmd, Panel, Rich, Tag, Txt, Typer, confirmAction } from '../term.tsx';
import { c, domainColor, font, themed } from '../theme.ts';

// picked = índice original, o máscara en las de respuesta múltiple; flag y note, lo marcado y comentado para revisar;
// sure, en la calibración: seguro (true), dudo (false) o sin marcar; shown, ya corregida (la respuesta queda fija).
export type Slot = { q: Question; order: number[]; picked: number | null; flag?: boolean; note?: string; sure?: boolean | null; shown?: boolean };
type Run = { label: string; slots: Slot[]; i: number; per: number; limit: number };
// En el informe de un simulacro antiguo sin respuestas guardadas, `picked` es undefined.
type Shown = Omit<Slot, 'picked'> & { picked?: number | null };
// `gained`: null al abrir uno ya hecho desde el historial. `known`: si se guardaron tus respuestas.
type Phase =
  | { kind: 'menu' }
  | { kind: 'run' }
  | { kind: 'report'; result: ExamResult; slots: Shown[]; gained: number | null; known: boolean };

// Los fijos salen solo de las de una respuesta, para que no cambien al crecer el banco (ver bank.ts).
const FIXED = fixedExams(QUESTIONS);
// Los dos de nivel real, con los 6 escenarios: el de 60 en 2 h, como el examen, y el completo con las 66.
const LEVEL_60 = levelExam(LEVEL_BANK_60);
const LEVEL = levelExam(LEVEL_BANK);
// Para volver a abrir un simulacro ya hecho: todas las preguntas por id y, para los antiguos que no
// guardaban sus preguntas, las de los fijos por etiqueta (ver replayExam).
const BY_ID = new Map([...BANK, ...LEVEL_BANK, ...Object.values(CALIBRATION).flat()].map((q) => [q.id, q]));
const FIXED_BY_LABEL: Record<string, Question[]> = {
  ...Object.fromEntries(FIXED.map((qs, n) => [`exam ${n + 1}`, qs])),
  [EXAM_LEVEL_60_LABEL]: LEVEL_60,
  [EXAM_LEVEL_LABEL]: LEVEL,
  ...CALIBRATION,
};
const LEVEL_60_PER = LEVEL_60.length / Object.keys(SETTINGS).length;
const LEVEL_PER = LEVEL.length / Object.keys(SETTINGS).length;
// La calibración va como el rápido: 4 escenarios de 5 preguntas.
const perOf = (label: string) =>
  label === 'quick' || isCalibration(label)
    ? EXAM.quickPerScenario
    : label === EXAM_LEVEL_60_LABEL
      ? LEVEL_60_PER
      : label === EXAM_LEVEL_LABEL
        ? LEVEL_PER
        : EXAM.perScenario;
const clock = (secs: number) => {
  const h = Math.floor(secs / 3600);
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return h ? `${h}:${m}:${s}` : `${m}:${s}`;
};
const pct = (x: number) => Math.round(100 * x);
const toSlots = (qs: Question[]): Slot[] => qs.map((q) => ({ q, order: shuffle(q.options.map((_, k) => k)), picked: null }));

export function Exam({
  p,
  onFinish,
  onSaveDraft,
  onExit,
  onRunning,
  wrapped = false,
}: {
  p: Progress;
  wrapped?: boolean;
  onFinish: (slots: Slot[], secs: number, label: string) => { result: ExamResult; gained: number };
  onSaveDraft: (draft: ExamDraft | null) => void;
  onExit: () => void;
  onRunning: (running: boolean) => void;
}) {
  const [phase, setPhase] = useState<Phase>({ kind: 'menu' });
  const [run, setRun] = useState<Run | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const runRef = useRef<Run | null>(null);
  const elapsedRef = useRef(0);
  const [noteOpen, setNoteOpen] = useState(false);
  const [showRight, setShowRight] = useState(false); // en el informe, las acertadas también
  const [allExams, setAllExams] = useState(false); // el historial entero y no solo los últimos
  const { width } = useWindowDimensions();
  const wide = width >= 900 && !wrapped;
  const T = STR[p.lang];
  const text = (q: Question) => inLang(q, p.lang);

  const draftOf = (r: Run, secs: number): ExamDraft => ({
    label: r.label,
    ids: r.slots.map((s) => s.q.id),
    orders: r.slots.map((s) => s.order),
    picked: r.slots.map((s) => s.picked),
    i: r.i,
    elapsed: secs,
    limit: r.limit,
    flags: r.slots.map((s) => Boolean(s.flag)),
    notes: r.slots.map((s) => s.note ?? ''),
    ...(isCalibration(r.label) ? { sure: r.slots.map((s) => s.sure ?? null), shown: r.slots.map((s) => Boolean(s.shown)) } : {}),
  });

  const update = (r: Run) => {
    runRef.current = r;
    setRun(r);
  };

  const finish = () => {
    const r = runRef.current;
    if (!r) return;
    const secs = Math.min(r.limit, elapsedRef.current);
    const { result, gained } = onFinish(r.slots, secs, r.label);
    runRef.current = null;
    setShowRight(false);
    setPhase({ kind: 'report', result, slots: r.slots, gained, known: true });
    onRunning(false);
  };

  // Un intento del historial: su informe otra vez, para repasarlo o mandárselo a Claude.
  const openPast = (e: ExamResult) => {
    const r = replayExam(e, BY_ID, FIXED_BY_LABEL);
    if (!r) return;
    setShowRight(false);
    setPhase({ kind: 'report', result: e, slots: r.slots, gained: null, known: r.known });
    feel.tap();
  };

  // Cronómetro: cuenta mientras la pantalla está abierta, guarda cada 15 s y entrega al acabar el tiempo.
  // En la calibración se para mientras está abierta una pregunta ya corregida: leer la corrección no gasta tiempo.
  const running = phase.kind === 'run';
  // Mientras dura se tapan las capturas: hasta entregar todo cuenta como sin contestar (en la calibración,
  // cada pregunta se corrige al contestarla, pero las preguntas tienen que seguir sin verse fuera).
  useGuard(running);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const r = runRef.current;
      if (!r || r.slots[r.i]?.shown) return;
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
      if (elapsedRef.current >= r.limit) {
        clearInterval(id);
        finish();
      } else if (elapsedRef.current % 15 === 0) onSaveDraft(draftOf(r, elapsedRef.current));
    }, 1000);
    return () => clearInterval(id);
    // finish y draftOf solo usan refs y callbacks estables del padre
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const begin = (label: string, qs: Question[], per: number) => {
    const r: Run = { label, slots: toSlots(qs), i: 0, per, limit: qs.length * EXAM.secsPerQuestion };
    update(r);
    elapsedRef.current = 0;
    setElapsed(0);
    onSaveDraft(draftOf(r, 0));
    setPhase({ kind: 'run' });
    onRunning(true);
    feel.tap();
  };

  const resume = (d: ExamDraft) => {
    const slots = d.ids.flatMap((id, k) => {
      const q = BY_ID.get(id);
      return q
        ? [{ q, order: d.orders[k], picked: d.picked[k], flag: d.flags?.[k], note: d.notes?.[k] || undefined, sure: d.sure?.[k] ?? null, shown: d.shown?.[k] || undefined }]
        : [];
    });
    update({ label: d.label, slots, i: Math.min(d.i, slots.length - 1), per: perOf(d.label), limit: d.limit });
    elapsedRef.current = d.elapsed;
    setElapsed(d.elapsed);
    setPhase({ kind: 'run' });
    onRunning(true);
    feel.tap();
  };

  const pause = () => {
    const r = runRef.current;
    if (r) onSaveDraft(draftOf(r, elapsedRef.current));
    setPhase({ kind: 'menu' });
    onRunning(false);
  };

  // En las de respuesta múltiple cada toque marca o desmarca una opción (hasta las que pide la pregunta).
  const choose = (orig: number) => {
    if (!run) return;
    const slot = run.slots[run.i];
    if (slot.shown) return;
    let picked: number | null = orig;
    if (isMulti(slot.q)) {
      const mask = slot.picked ?? 0;
      const bit = 1 << orig;
      const count = (m: number) => m.toString(2).replace(/0/g, '').length;
      if (!(mask & bit) && count(mask) >= rightOf(slot.q).length) return;
      picked = mask ^ bit || null;
    }
    const next = { ...run, slots: run.slots.map((s, k) => (k === run.i ? { ...s, picked } : s)) };
    update(next);
    onSaveDraft(draftOf(next, elapsedRef.current));
    feel.tap();
  };

  const go = (i: number) => {
    if (!run) return;
    setNoteOpen(false);
    const next = { ...run, i };
    update(next);
    onSaveDraft(draftOf(next, elapsedRef.current));
  };

  const patchSlot = (change: Partial<Slot>) => {
    if (!run) return null;
    const next = { ...run, slots: run.slots.map((s, k) => (k === run.i ? { ...s, ...change } : s)) };
    update(next);
    return next;
  };

  const toggleFlag = () => {
    const next = patchSlot({ flag: !run?.slots[run.i].flag });
    if (next) onSaveDraft(draftOf(next, elapsedRef.current));
    feel.tap();
  };

  // Seguro o dudo: otro toque en el mismo lo desmarca. Una vez corregida ya no se cambia.
  const markSure = (sure: boolean) => {
    if (!run || run.slots[run.i].shown) return;
    const next = patchSlot({ sure: run.slots[run.i].sure === sure ? null : sure });
    if (next) onSaveDraft(draftOf(next, elapsedRef.current));
    feel.tap();
  };

  // En la calibración, la corrección de la pregunta al momento; a partir de ahí la respuesta queda fija.
  const check = () => {
    if (!run) return;
    const slot = run.slots[run.i];
    if (slot.shown || !canCheck(slot.q, slot.picked, slot.sure)) return;
    const next = patchSlot({ shown: true });
    if (next) onSaveDraft(draftOf(next, elapsedRef.current));
    if (isRight(slot.q, slot.picked)) feel.good();
    else feel.bad();
  };

  // Como en el examen, "Flag" es para volver antes de entregar: si quedan marcadas, se avisa.
  // Solo con el botón; al acabarse el tiempo se entrega sin preguntar.
  const submit = () => {
    const flagged = run ? run.slots.filter((x) => x.flag).length : 0;
    if (flagged === 0) return finish();
    confirmAction(T.submitFlaggedTitle, T.submitFlagged(flagged), T.submitAnyway, T.review, finish);
  };

  // El comentario no se guarda a cada letra ni al salir del cuadro (eso se comía el toque siguiente):
  // va con el guardado de cada 15 s y al pasar de pregunta, pausar o entregar.
  const writeNote = (note: string) => patchSlot({ note });

  // --- Menú de simulacros ---
  if (phase.kind === 'menu') {
    const d = p.examDraft;
    const shown = allExams ? p.exams : p.exams.slice(0, 8);
    const canOpen = (e: ExamResult) => replayExam(e, BY_ID, FIXED_BY_LABEL) !== null;
    // Preguntas que has contestado alguna vez, en simulacros o en rondas: lo que lee "dónde fallo".
    const answered = [...BANK, ...LEVEL_BANK].filter((q) => p.cards[q.id]?.seen).length;
    return (
      <ScrollView key="menu" contentContainerStyle={s.page}>
        <Typer text="$ cca-quest exam --list" bold color={c.green} />

        {d && (
          <Panel title={T.inProgress} color={c.amber} titleColor={c.amber}>
            <Txt bold color={c.amber}>
              {T.draftLine(T.examLabel(d.label), d.i + 1, d.ids.length, d.picked.filter((x) => x !== null).length)}
            </Txt>
            <Txt color={c.muted}>{T.leftPaused(clock(Math.max(0, d.limit - d.elapsed)))}</Txt>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <Btn kind="amber" label={T.resume} onPress={() => resume(d)} style={{ flex: 2 }} />
              <Btn kind="danger" label={T.discard} onPress={() => onSaveDraft(null)} style={{ flex: 1 }} />
            </View>
          </Panel>
        )}

        <Panel title={T.fullMock(clock(60 * EXAM.secsPerQuestion))}>
          <Txt size={12} color={c.muted} style={{ marginBottom: 6 }}>
            {T.fullNote}
          </Txt>
          {FIXED.map((qs, n) => {
            const label = `exam ${n + 1}`;
            return (
              <ExamRow
                key={label}
                title={T.examLabel(label)}
                sub={FIXED_EXAMS[n].join(' · ')}
                best={bestScore(p, label)}
                bestLabel={T.bestPct}
                disabled={Boolean(d) || qs.length === 0}
                onPress={() => begin(label, qs, EXAM.perScenario)}
              />
            );
          })}
          <ExamRow
            title={T.examLabel('random')}
            sub={T.randomSub}
            best={bestScore(p, 'random')}
            bestLabel={T.bestPct}
            disabled={Boolean(d)}
            onPress={() => begin('random', buildExam(BANK, Math.random, EXAM.scenarios, EXAM.perScenario, p), EXAM.perScenario)}
          />
        </Panel>

        <Panel title={T.levelTitle} color={c.amber} titleColor={c.amber}>
          <Txt size={12} color={c.muted} style={{ marginBottom: 6 }}>
            {T.levelNote}
          </Txt>
          <ExamRow
            title={T.examLabel(EXAM_LEVEL_60_LABEL)}
            sub={T.level60Sub(clock(LEVEL_60.length * EXAM.secsPerQuestion), LEVEL_60_PER)}
            best={bestScore(p, EXAM_LEVEL_60_LABEL)}
            bestLabel={T.bestPct}
            disabled={Boolean(d) || LEVEL_60.length === 0}
            onPress={() => begin(EXAM_LEVEL_60_LABEL, LEVEL_60, LEVEL_60_PER)}
          />
          <ExamRow
            title={T.examLabel(EXAM_LEVEL_LABEL)}
            sub={T.levelAllSub(LEVEL.length, clock(LEVEL.length * EXAM.secsPerQuestion), LEVEL_PER)}
            best={bestScore(p, EXAM_LEVEL_LABEL)}
            bestLabel={T.bestPct}
            disabled={Boolean(d) || LEVEL.length === 0}
            onPress={() => begin(EXAM_LEVEL_LABEL, LEVEL, LEVEL_PER)}
          />
        </Panel>

        <Panel title={T.calibTitle} color={c.cyan} titleColor={c.cyan}>
          <Txt size={12} color={c.muted} style={{ marginBottom: 6 }}>
            {T.calibNote}
          </Txt>
          {CALIBRATION_LABELS.map((label) => {
            const qs = CALIBRATION[label];
            return (
              <ExamRow
                key={label}
                title={T.examLabel(label)}
                sub={T.calibSub(clock(qs.length * EXAM.secsPerQuestion))}
                best={bestScore(p, label)}
                bestLabel={T.bestPct}
                disabled={Boolean(d) || qs.length === 0}
                onPress={() => begin(label, qs, EXAM.quickPerScenario)}
              />
            );
          })}
        </Panel>

        <Panel title={T.quickTitle(clock(20 * EXAM.secsPerQuestion))}>
          <ExamRow
            title={T.examLabel('quick')}
            sub={T.quickSub}
            best={bestScore(p, 'quick')}
            bestLabel={T.bestPct}
            disabled={Boolean(d)}
            onPress={() => begin('quick', buildExam(BANK, Math.random, EXAM.scenarios, EXAM.quickPerScenario, p), EXAM.quickPerScenario)}
          />
        </Panel>
        {d && (
          <Txt size={12} color={c.muted}>
            {T.finishFirst}
          </Txt>
        )}

        <Panel title={T.history}>
          {p.exams.length === 0 ? (
            <Txt color={c.muted}>{T.noAttempts}</Txt>
          ) : (
            shown.map((e, k) => {
              const frac = scoreOf(e);
              const score = pct(frac);
              const ok = score >= EXAM.target * 100;
              const open = canOpen(e);
              return (
                <Pressable
                  key={k}
                  onPress={() => openPast(e)}
                  disabled={!open}
                  accessibilityRole="button"
                  accessibilityHint={open ? T.openPast : T.noReplay}
                  style={({ pressed }) => [s.histRow, s.histPress, pressed && { backgroundColor: c.greenBg }]}
                >
                  <Txt color={c.muted} style={{ width: 52 }}>
                    {e.day.slice(5)}
                  </Txt>
                  <Txt style={{ width: 92 }}>{T.examLabel(e.label)}</Txt>
                  <Bar value={frac} width={8} color={ok ? c.green : c.amber} />
                  <Txt bold color={ok ? c.green : c.amber}>
                    {String(score).padStart(3)}%
                  </Txt>
                  <Txt bold color={open ? c.cyan : c.line} style={{ marginLeft: 'auto' }}>
                    ▶
                  </Txt>
                </Pressable>
              );
            })
          )}
          {!allExams && p.exams.length > shown.length && (
            <Txt size={12} bold color={c.cyan} onPress={() => setAllExams(true)} style={{ marginTop: 6 }}>
              {T.showAllExams(p.exams.length)}
            </Txt>
          )}
          {p.exams.some(canOpen) && (
            <Txt size={11} color={c.muted} style={{ marginTop: 6 }}>
              {T.openPast}
            </Txt>
          )}
          <Txt size={11} color={c.muted} style={{ marginTop: 6 }}>
            {T.targetNote(EXAM.target * 100)}
          </Txt>
        </Panel>
        <Panel title={T.trapTitle} color={c.amber} titleColor={c.amber}>
          <Txt size={12} color={c.muted} style={{ marginBottom: 8 }}>
            {T.trapBody}
          </Txt>
          <AskButton lang={p.lang} label={T.trapBtn} prompt={() => trapPrompt(p.lang, answered > 0 ? studyRecord(p, p.lang) : undefined)} />
        </Panel>
        {(answered > 0 || p.exams.length > 0) && (
          <Panel title={T.weakTitle} color={c.cyan} titleColor={c.cyan}>
            <Txt size={12} color={c.muted} style={{ marginBottom: 8 }}>
              {T.weakBody(p.exams.length, answered)}
            </Txt>
            <AskButton lang={p.lang} label={T.weakBtn} prompt={() => studyPrompt(p.lang, studyRecord(p, p.lang))} />
          </Panel>
        )}
        <Btn label="$ cd ~" onPress={onExit} />
      </ScrollView>
    );
  }

  // --- Examen en marcha ---
  // En pantallas anchas, como en el examen de verdad: el caso a la izquierda y la pregunta a la derecha.
  if (phase.kind === 'run' && run) {
    const slot = run.slots[run.i];
    const left = Math.max(0, run.limit - elapsed);
    const scenarioIdx = Math.floor(run.i / run.per);
    const firstOfScenario = run.i % run.per === 0;
    const answered = run.slots.filter((x) => x.picked !== null).length;
    const flaggedCount = run.slots.filter((x) => x.flag).length;
    const dom = DOMAINS.find((d) => d.id === slot.q.domain)!;
    const last = run.i + 1 === run.slots.length;
    const showNote = noteOpen || Boolean(slot.note);
    const calib = isCalibration(run.label);
    // En la calibración, ya corregida: la buena, lo tuyo y la trampa en la que caíste.
    const shown = calib && Boolean(slot.shown);
    const ok = isRight(slot.q, slot.picked);
    const trap = shown ? trapOf(slot.q, slot.picked) : null;
    // La gemela solo se nombra en la segunda que sale: avisar en la primera estropearía la trampa.
    const twinAt = slot.q.pair ? run.slots.findIndex((x) => x.q.id === slot.q.pair) : -1;
    // Contestada y sin corregir: el botón de abajo corrige en vez de pasar a la siguiente.
    const pending = calib && !shown && slot.picked !== null;

    const scenario = (
      <>
        {slot.q.setting && (
          <Txt bold size={12} color={firstOfScenario ? c.amber : c.muted}>
            {T.scenarioOf(T.examLabel(run.label), scenarioIdx + 1, Math.ceil(run.slots.length / run.per), SETTINGS[slot.q.setting].name.toLowerCase())}
          </Txt>
        )}
        <Panel color={c.lineHi}>
          <Txt bold size={13} color={domainColor[slot.q.domain]} style={{ marginBottom: 8 }}>
            {T.domainOf(dom.n, dom.name)}
          </Txt>
          {/* En la calibración, la frase del caso que decide sale resaltada desde el principio: es un
              entrenamiento para aprender a fijarse en ella y reconocerla cuando salga una parecida. */}
          <Rich text={text(slot.q).scenario} size={15} mark={calib ? [text(slot.q).clue] : undefined} />
        </Panel>
      </>
    );

    const question = (
      <>
        {/* Si no cabe todo en una fila, el número de pregunta no se parte: comentario y marca bajan a la derecha. */}
        <View style={s.qHead}>
          <Txt bold style={{ flexShrink: 0 }}>
            {T.questionOf(run.i + 1, run.slots.length)}
          </Txt>
          <View style={s.qTools}>
            <Pressable onPress={() => setNoteOpen((o) => !o)} hitSlop={8} accessibilityRole="button">
              <Txt bold size={12} color={showNote ? c.cyan : c.muted}>
                {T.comment}
              </Txt>
            </Pressable>
            <Pressable onPress={toggleFlag} hitSlop={8} accessibilityRole="button" accessibilityState={{ selected: Boolean(slot.flag) }}>
              <Txt bold size={12} color={slot.flag ? c.amber : c.muted}>
                {slot.flag ? T.flagged : T.flag}
              </Txt>
            </Pressable>
          </View>
        </View>
        {showNote && (
          <TextInput
            value={slot.note ?? ''}
            onChangeText={writeNote}
            placeholder={T.commentPh}
            placeholderTextColor={c.muted}
            multiline
            style={s.note}
          />
        )}
        {/* En la calibración, la palabra que le da la vuelta a la pregunta (NOT, LEAST, FIRST…) sale resaltada. */}
        <Rich text={`? ${text(slot.q).ask}`} bold size={15} color={c.green} mark={[text(slot.q).twist]} />
        {isMulti(slot.q) && <Tag label={T.selectN(rightOf(slot.q).length)} color={c.cyan} />}
        {slot.order.map((orig, pos) => {
          const on = isMulti(slot.q) ? ((slot.picked ?? 0) & (1 << orig)) !== 0 : slot.picked === orig;
          // Ya corregida: la buena en verde, lo tuyo en rojo si falló y, debajo de cada una, su porqué.
          const right = shown && rightOf(slot.q).includes(orig);
          const miss = shown && on && !right;
          return (
            <Pressable
              key={pos}
              disabled={shown}
              onPress={() => choose(orig)}
              style={({ pressed }) => [
                s.opt,
                on && { borderColor: c.amber, backgroundColor: c.amberBg },
                right && { borderColor: c.green, backgroundColor: c.greenBg },
                miss && { borderColor: c.red, backgroundColor: c.redBg },
                shown && !right && !on && { opacity: 0.6 },
                pressed && { backgroundColor: c.greenBg },
              ]}
            >
              <View style={s.optRow}>
                <Txt bold color={right ? c.green : miss ? c.red : on ? c.amber : c.muted}>
                  [{right ? '✓' : miss ? '✗' : on ? (isMulti(slot.q) ? '■' : '●') : 'ABCDE'[pos]}]
                </Txt>
                <Rich text={text(slot.q).options[orig]} style={{ flex: 1 }} />
              </View>
              {shown && <Rich text={`└ ${text(slot.q).why[orig]}`} size={12} color={right ? c.text : c.muted} style={{ marginLeft: 36 }} />}
            </Pressable>
          );
        })}
        {calib ? (
          // En la calibración Claude no ayuda a contestar: la nota tiene que ser solo tuya, como en el examen.
          // Primero seguro o dudo, después la corrección; una vez corregida, nada de eso se cambia.
          <>
            <View style={s.sureRow}>
              <Txt size={12} color={c.muted}>
                {T.sureAsk}
              </Txt>
              {[true, false].map((v) => {
                const on = slot.sure === v;
                const tone = v ? c.green : c.amber;
                return (
                  <Pressable
                    key={String(v)}
                    onPress={() => markSure(v)}
                    disabled={shown}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on, disabled: shown }}
                    style={[s.sure, { borderColor: on ? tone : c.lineHi }, on && { backgroundColor: v ? c.greenBg : c.amberBg }, shown && !on && { opacity: 0.5 }]}
                  >
                    <Txt bold size={12} color={on ? tone : c.muted}>
                      {v ? T.sure : T.unsure}
                    </Txt>
                  </Pressable>
                );
              })}
            </View>
            {pending && typeof slot.sure !== 'boolean' && (
              <Txt size={12} color={c.muted}>
                {T.checkNeedsSure}
              </Txt>
            )}
            {shown && (
              // El acierto o fallo va en la barra de abajo, siempre a la vista; aquí, lo que lo explica.
              <View style={{ gap: 6, marginTop: 4 }}>
                {trap && (
                  <View>
                    <Txt size={12} bold color={c.red}>
                      [{T.trapTag(TRAPS[trap].name[p.lang])}]
                    </Txt>
                    <Rich text={TRAPS[trap].tip[p.lang]} size={12} color={c.muted} />
                  </View>
                )}
                <Txt size={12} color={c.muted}>
                  {T.clueNow}
                </Txt>
                {twinAt >= 0 && twinAt < run.i && (
                  <Txt size={12} color={c.cyan}>
                    {T.twinNow(twinAt + 1)}
                  </Txt>
                )}
                <Panel title={T.remember} color={c.amber} titleColor={c.amber}>
                  <Rich text={text(slot.q).rule} bold color={c.amber} />
                </Panel>
                <AskClaude q={slot.q} lang={p.lang} order={slot.order} picked={slot.picked} />
              </View>
            )}
          </>
        ) : (
          // Como en el examen no hay corrección hasta entregar, Claude ayuda a entenderla sin decir la buena.
          <AskClaude q={slot.q} lang={p.lang} order={slot.order} reveal={false} />
        )}
      </>
    );

    return (
      <View style={s.fill}>
        <View style={s.top}>
          {/* Parado mientras lees una corregida: ⏸ y, si cabe, el aviso. */}
          <Txt bold color={shown ? c.muted : left < 300 ? c.red : c.amber}>
            {shown ? '⏸' : '⏱'} {clock(left)}
          </Txt>
          {shown && wide && (
            <Txt size={11} color={c.muted}>
              {T.clockStopped}
            </Txt>
          )}
          <Txt bold>
            {run.i + 1}/{run.slots.length}
          </Txt>
          <View style={{ flex: 1 }} />
          <Pressable onPress={pause} hitSlop={10}>
            <Txt bold color={c.muted}>
              {T.pause}
            </Txt>
          </Pressable>
        </View>
        {wide ? (
          <View style={[s.split, { paddingBottom: 130 }]}>
            <ScrollView style={s.pane} contentContainerStyle={s.page} key={`case${run.i}`}>
              {scenario}
            </ScrollView>
            <ScrollView style={[s.pane, { flex: 1.3 }]} contentContainerStyle={s.page} key={`q${run.i}`}>
              {question}
            </ScrollView>
          </View>
        ) : (
          <ScrollView contentContainerStyle={[s.page, { paddingBottom: 170 }]} key={run.i}>
            {scenario}
            {question}
          </ScrollView>
        )}
        <View style={[s.bottom, shown && { borderTopColor: ok ? c.green : c.red }]}>
          <View style={s.dots}>
            {run.slots.map((x, k) => (
              <Pressable key={k} onPress={() => go(k)} hitSlop={3}>
                <Txt
                  size={12}
                  bold
                  color={k === run.i ? c.green : x.shown ? (isRight(x.q, x.picked) ? c.green : c.red) : x.picked !== null ? c.amber : x.flag ? c.cyan : c.lineHi}
                >
                  {k === run.i ? '◆' : x.flag ? '⚑' : x.picked !== null ? '■' : '□'}
                </Txt>
              </Pressable>
            ))}
          </View>
          {shown ? (
            // Ya corregida, en vez de la cuenta de contestadas: si acertaste y si estabas seguro.
            <Txt bold size={13} color={ok ? c.green : c.red} style={{ textAlign: 'center' }}>
              {ok ? T.calibOk : T.calibWrong}
              {slot.sure === true ? ` · ${T.wasSure}` : slot.sure === false ? ` · ${T.wasUnsure}` : ''}
            </Txt>
          ) : (
            <Txt size={11} color={c.muted} style={{ textAlign: 'center' }}>
              {T.answeredN(answered, run.slots.length)}
              {flaggedCount > 0 ? ` · ${T.flaggedN(flaggedCount)}` : ''}
            </Txt>
          )}
          <View style={[{ flexDirection: 'row', gap: 10 }, wide && { alignSelf: 'flex-end', width: 420 }]}>
            <Btn label={T.prev} onPress={() => go(Math.max(0, run.i - 1))} disabled={run.i === 0} style={{ flex: 1 }} />
            {pending ? (
              <Btn kind="amber" label={T.checkAnswer} onPress={check} disabled={!canCheck(slot.q, slot.picked, slot.sure)} style={{ flex: 1 }} />
            ) : last ? (
              <Btn kind="amber" label={T.submit} onPress={submit} style={{ flex: 1 }} />
            ) : (
              <Btn kind="primary" label={T.next} onPress={() => go(run.i + 1)} style={{ flex: 1 }} />
            )}
          </View>
        </View>
      </View>
    );
  }

  // --- Informe (al entregar, o de uno ya hecho abierto desde el historial) ---
  if (phase.kind !== 'report') return null;
  const { result, gained, known } = phase;
  const weighted = isWeighted(result.label);
  const calib = isCalibration(result.label);
  const score = pct(scoreOf(result));
  const passed = score >= EXAM.target * 100;
  // Cada pregunta con su número en el examen, para que el índice de marcadas y las fichas casen.
  const numbered = phase.slots.map((x, k) => ({ ...x, n: k + 1, ok: known && isRight(x.q, x.picked ?? null) }));
  const wrong = known ? numbered.filter((x) => !x.ok) : [];
  const marked = numbered.filter((x) => x.flag || x.note);
  // En la calibración: seguridad frente a acierto, trampas y gemelas; y las falladas estando seguro, primero.
  const cal = calib && known ? calibReport(numbered) : null;
  const twinOf = (x: (typeof numbered)[number]) => (x.q.pair ? numbered.find((y) => y.q.id === x.q.pair)?.n : undefined);
  const calibOf = (x: (typeof numbered)[number]) => (calib ? { sure: x.sure, twin: twinOf(x) } : undefined);
  // Repetir la calibración es entrenar: cada informe te compara con tu intento anterior.
  const prev = cal ? previousAttempt(p, result) : null;
  const prevReplay = prev ? replayExam(prev, BY_ID, FIXED_BY_LABEL) : null;
  const prevCal = prevReplay?.known ? calibReport(prevReplay.slots.map((x, k) => ({ ...x, n: k + 1 }))) : null;
  if (cal) wrong.sort((a, b) => Number(b.sure === true) - Number(a.sure === true) || a.n - b.n);
  const qList = (ns: number[]) => ns.map(T.qN).join(' · ');
  // Las acertadas que no salen ya entre las marcadas.
  const rightRest = numbered.filter((x) => x.ok && !(x.flag || x.note));
  const headOf = (x: (typeof numbered)[number]) => `${T.qN(x.n)}${x.flag ? ' · ⚑' : ''}`;
  // Todo el simulacro en un solo mensaje para Claude, con las letras como se vieron.
  const askAll = () =>
    examPrompt(
      p.lang,
      `${T.examLabel(result.label)} · ${result.day} · ${score}%`,
      numbered.map((x) => ({
        n: x.n,
        tx: inLang(x.q, p.lang),
        rights: rightOf(x.q),
        ok: x.ok,
        order: x.order,
        picked: !known ? undefined : x.picked === null || x.picked === undefined ? null : pickedOf(x.q, x.picked),
        ts: x.q.ts,
        flag: x.flag,
        note: x.note,
        sure: x.sure,
      })),
    );
  return (
    <ScrollView key="report" contentContainerStyle={s.page}>
      <Typer text={`$ cca-quest exam --report "${result.label}"${gained === null ? ` --day ${result.day}` : ''}`} bold color={c.green} />
      <BounceIn>
        <Panel title={T.score} color={passed ? c.green : c.amber} titleColor={passed ? c.green : c.amber}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
            <Txt bold size={34} color={passed ? c.green : c.amber}>
              {score}%
            </Txt>
            {weighted && (
              <Txt bold color={c.muted}>
                {T.rawHits(result.right, result.total)}
              </Txt>
            )}
          </View>
          {weighted && (
            <Txt size={11} color={c.muted}>
              {T.levelWeighted}
            </Txt>
          )}
          <Txt>{weighted ? T.timeLine(clock(result.secs), gained) : T.scoreLine(result.right, result.total, clock(result.secs), gained)}</Txt>
          <Txt size={12} color={passed ? c.green : c.amber} style={{ marginTop: 4 }}>
            {passed ? T.onTrack : T.below(EXAM.target * 100)}
          </Txt>
        </Panel>
      </BounceIn>
      {cal && (
        <Panel title={T.calibReport} color={c.cyan} titleColor={c.cyan}>
          {prev && (
            <View style={{ marginBottom: 6 }}>
              <Txt bold color={score >= pct(scoreOf(prev)) ? c.green : c.amber}>
                {T.calibTrend(pct(scoreOf(prev)), score)}
              </Txt>
              {prevCal && (
                <Txt size={12} color={cal.sureWrong.length <= prevCal.sureWrong.length ? c.green : c.amber}>
                  {T.calibTrendSure(prevCal.sureWrong.length, cal.sureWrong.length)}
                </Txt>
              )}
            </View>
          )}
          {cal.sureWrong.length ? (
            <>
              <Txt bold color={c.red}>
                {T.sureWrong(qList(cal.sureWrong))}
              </Txt>
              <Txt size={11} color={c.muted}>
                {T.sureWrongHint}
              </Txt>
            </>
          ) : (
            <Txt bold color={c.green}>
              {T.noSureWrong}
            </Txt>
          )}
          {cal.unsureRight.length > 0 && (
            <>
              <Txt bold color={c.amber} style={{ marginTop: 6 }}>
                {T.unsureRight(qList(cal.unsureRight))}
              </Txt>
              <Txt size={11} color={c.muted}>
                {T.unsureRightHint}
              </Txt>
            </>
          )}
          {cal.unmarked > 0 && (
            <Txt size={11} color={c.muted} style={{ marginTop: 6 }}>
              {T.unmarked(cal.unmarked)}
            </Txt>
          )}
          <Txt bold style={{ marginTop: 10 }}>
            {T.trapsFell}
          </Txt>
          {cal.traps.length === 0 ? (
            <Txt size={12} color={c.muted}>
              {T.noTraps}
            </Txt>
          ) : (
            cal.traps.map(({ trap, n }) => (
              <View key={trap} style={{ marginTop: 4 }}>
                <Txt size={13} bold color={c.red}>
                  {TRAPS[trap].name[p.lang]} ×{n.length}{' '}
                  <Txt size={12} color={c.muted}>
                    · {qList(n)}
                  </Txt>
                </Txt>
                <Rich text={TRAPS[trap].tip[p.lang]} size={12} color={c.muted} />
              </View>
            ))
          )}
          {cal.pairs.length > 0 && (
            <>
              <Txt bold style={{ marginTop: 10 }}>
                {T.pairsTitle}
              </Txt>
              {cal.pairs.map((x) => (
                <Txt key={x.a} size={13} color={x.okA && x.okB ? c.green : c.red}>
                  {T.pairLine(x.a, x.b)} · {x.okA && x.okB ? T.pairBoth : x.okA || x.okB ? T.pairOne : T.pairNone}
                </Txt>
              ))}
            </>
          )}
          <Txt size={11} color={c.muted} style={{ marginTop: 10 }}>
            {T.clueHint}
          </Txt>
        </Panel>
      )}
      <Panel title={T.byDomain}>
        {DOMAINS.map((d) => {
          const [r, t] = result.byDomain[d.id] ?? [0, 0];
          if (!t) return null;
          return (
            <View key={d.id} style={s.histRow}>
              <Txt bold color={domainColor[d.id]} style={{ width: 40 }}>
                d{d.n}
              </Txt>
              <Bar value={r / t} width={10} color={domainColor[d.id]} />
              <Txt color={c.muted}>
                {String(pct(r / t)).padStart(3)}% {r}/{t}{weighted ? ` ×${d.weight}%` : ''}
              </Txt>
            </View>
          );
        })}
      </Panel>
      <Panel title={T.examAskTitle} color={c.cyan} titleColor={c.cyan}>
        <Txt size={12} color={c.muted} style={{ marginBottom: 8 }}>
          {known ? T.examAskBody(wrong.length, numbered.length - wrong.length) : T.examAskBodyUnknown(numbered.length)}
        </Txt>
        <AskButton lang={p.lang} label={T.examAskBtn} prompt={askAll} />
      </Panel>
      {!known && (
        <>
          <Txt size={12} color={c.muted}>
            {T.pastUnknown}
          </Txt>
          <Cmd>{T.allQuestions(numbered.length)}</Cmd>
          {numbered.map((x) => (
            <MissCard key={x.q.id} q={x.q} picked={undefined} lang={p.lang} T={T} full head={T.qN(x.n)} />
          ))}
        </>
      )}
      {known && marked.length > 0 && (
        <>
          <Cmd>{T.marked(marked.length)}</Cmd>
          <Panel color={c.cyan}>
            <Txt size={11} color={c.muted}>
              {T.markedHint}
            </Txt>
            {marked.map((x) => (
              <View key={x.q.id} style={{ marginTop: 8 }}>
                <Txt bold size={12} color={x.ok ? c.green : c.red}>
                  {x.ok ? '✓' : '✗'} {headOf(x)}
                </Txt>
                <Rich text={inLang(x.q, p.lang).ask} size={12} />
                {x.note ? <Rich text={`${T.yourNote}: ${x.note}`} size={12} color={c.cyan} /> : null}
              </View>
            ))}
          </Panel>
          {marked
            .filter((x) => x.ok)
            .map((x) => (
              <MissCard key={`ok${x.q.id}`} q={x.q} picked={x.picked} lang={p.lang} T={T} full note={x.note} head={`✓ ${headOf(x)}`} calib={calibOf(x)} />
            ))}
        </>
      )}
      {wrong.length > 0 && (
        <Cmd>
          git diff --misses <Txt color={c.muted}>({wrong.length})</Txt>
        </Cmd>
      )}
      {wrong.map((x) => (
        <MissCard key={x.q.id} q={x.q} picked={x.picked} lang={p.lang} T={T} full note={x.note} head={headOf(x)} calib={calibOf(x)} />
      ))}
      {rightRest.length > 0 && (
        <Txt bold color={c.cyan} onPress={() => setShowRight(!showRight)} style={{ marginTop: 4 }}>
          {showRight ? T.hideRight(rightRest.length) : T.showRight(rightRest.length)}
        </Txt>
      )}
      {showRight && rightRest.length > 0 && <Cmd>{T.rightOnes(rightRest.length)}</Cmd>}
      {showRight &&
        rightRest.map((x) => (
          <MissCard key={`r${x.q.id}`} q={x.q} picked={x.picked} lang={p.lang} T={T} full head={`✓ ${headOf(x)}`} calib={calibOf(x)} />
        ))}
      <View style={{ gap: 10, marginTop: 6 }}>
        <Btn kind="amber" label={T.examList} onPress={() => setPhase({ kind: 'menu' })} />
        <Btn label="$ cd ~" onPress={onExit} />
      </View>
    </ScrollView>
  );
}

function ExamRow({
  title,
  sub,
  best,
  bestLabel,
  disabled,
  onPress,
}: {
  title: string;
  sub: string;
  best: number | null;
  bestLabel: (pct: number) => string;
  disabled?: boolean;
  onPress: () => void;
}) {
  const ok = best !== null && best >= EXAM.target;
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [s.row, disabled && { opacity: 0.4 }, pressed && { backgroundColor: c.greenBg }]}>
      <View style={{ flex: 1 }}>
        <Txt bold color={c.green}>
          ▶ {title}
        </Txt>
        <Txt size={11} color={c.muted}>
          {sub}
        </Txt>
      </View>
      <Txt bold color={best === null ? c.muted : ok ? c.green : c.amber}>
        {best === null ? '—' : bestLabel(Math.round(best * 100))}
      </Txt>
    </Pressable>
  );
}

const s = themed(() =>
  StyleSheet.create({
    fill: { flex: 1, backgroundColor: c.bg },
    page: { padding: 16, gap: 12 },
    top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.line },
    split: { flex: 1, flexDirection: 'row' },
    pane: { flex: 1, borderRightWidth: 1, borderRightColor: c.line },
    qHead: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 12, rowGap: 4 },
    qTools: { flexDirection: 'row', gap: 12, marginLeft: 'auto' },
    note: { borderWidth: 1, borderColor: c.cyan, borderRadius: 3, padding: 10, minHeight: 64, color: c.text, backgroundColor: c.panel, fontFamily: font.regular, fontSize: 13 },
    opt: { borderWidth: 1, borderColor: c.lineHi, borderRadius: 3, padding: 12, backgroundColor: c.panel },
    optRow: { flexDirection: 'row', gap: 10 },
    bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: c.panel, borderTopWidth: 1, borderTopColor: c.lineHi, padding: 12, gap: 8 },
    dots: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center' },
    histRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
    histPress: { paddingVertical: 4, borderRadius: 3 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.line },
    sureRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 4 },
    sure: { borderWidth: 1, borderRadius: 3, paddingHorizontal: 12, paddingVertical: 6 },
  }),
);
