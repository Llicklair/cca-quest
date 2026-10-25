// La tapa contra capturas de la web (la lógica está en guard.ts). Cada pantalla con una pregunta sin
// contestar llama a useGuard; App pinta <Shield> encima de todo.
import { useEffect, useSyncExternalStore } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';

import type { Lang } from './game.ts';
import { IDLE, covered, installGuard, step, type GuardEvent } from './guard.ts';
import { STR } from './i18n.ts';
import { Txt } from './term.tsx';
import { c } from './theme.ts';

const web = Platform.OS === 'web' && typeof document !== 'undefined';

let state = IDLE;
const subs = new Set<() => void>();
const send = (e: GuardEvent) => {
  const next = step(state, e);
  if (next === state) return;
  state = next;
  subs.forEach((f) => f());
};
const subscribe = (f: () => void) => {
  subs.add(f);
  return () => subs.delete(f);
};

let installed = false;
const install = () => {
  if (installed || !web) return;
  installed = true;
  installGuard(send);
};

/** Mientras `on`, la pantalla se tapa si se intenta hacer una captura o se sale de la ventana. */
export function useGuard(on: boolean) {
  useEffect(() => {
    if (!on || !web) return;
    install();
    send('open');
    return () => send('close');
  }, [on]);
}

/** Pantalla negra encima de todo mientras haga falta. Al montarse pone también el bloqueo de copiar. */
export function Shield({ lang }: { lang: Lang }) {
  useEffect(install, []);
  const g = useSyncExternalStore(subscribe, () => state);
  if (!covered(g)) return null;
  const T = STR[lang];
  return (
    <Pressable style={s.shield} onPress={() => send('dismiss')}>
      <Txt bold size={16} color={c.amber}>
        {T.shieldTitle}
      </Txt>
      <Txt size={13} color={c.muted} style={{ textAlign: 'center' }}>
        {g.caught ? T.shieldShot : T.shieldAway}
      </Txt>
    </Pressable>
  );
}

const s = StyleSheet.create({
  shield: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: c.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
  },
});
