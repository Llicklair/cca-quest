import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { c } from './theme.ts';

/** Barra de progreso de 0 a 1. */
export function Bar({ value, color = c.flame, height = 8 }: { value: number; color?: string; height?: number }) {
  const w = `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` as const;
  return (
    <View style={[s.track, { height, borderRadius: height / 2 }]}>
      <View style={{ width: w, height, borderRadius: height / 2, backgroundColor: color }} />
    </View>
  );
}

const COLORS = [c.flame, c.gold, c.good, '#6C8CFF', '#C77DFF', c.bad];

type Piece = { x: number; drift: number; spin: number; size: number; color: string; t: Animated.Value; delay: number };

/** Una lluvia de confeti. Para otra, se monta de nuevo con otra key. */
export function Confetti() {
  const { width, height } = useWindowDimensions();
  const [pieces] = useState<Piece[]>(() =>
    Array.from({ length: 48 }, () => ({
      x: Math.random() * width,
      drift: (Math.random() - 0.5) * 160,
      spin: (Math.random() - 0.5) * 900,
      size: 6 + Math.random() * 8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      t: new Animated.Value(0),
      delay: Math.random() * 350,
    })),
  );
  const [done, setDone] = useState(false);

  useEffect(() => {
    const anim = Animated.parallel(
      pieces.map((p) =>
        Animated.timing(p.t, {
          toValue: 1,
          duration: 1500 + Math.random() * 1000,
          delay: p.delay,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ),
    );
    anim.start(() => setDone(true));
    return () => anim.stop();
  }, [pieces]);

  if (done) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: -20,
            width: p.size,
            height: p.size * 0.5,
            borderRadius: 2,
            backgroundColor: p.color,
            opacity: p.t.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateY: p.t.interpolate({ inputRange: [0, 1], outputRange: [0, height * 0.95] }) },
              { translateX: p.t.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] }) },
              { rotate: p.t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin}deg`] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

/** Texto que sube y se desvanece (“+15 XP”). Se reinicia al cambiar de key. */
export function Pop({ text, color }: { text: string; color: string }) {
  const [t] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [t]);
  return (
    <Animated.Text
      pointerEvents="none"
      style={[
        s.pop,
        {
          color,
          opacity: t.interpolate({ inputRange: [0, 0.15, 0.75, 1], outputRange: [0, 1, 1, 0] }),
          transform: [
            { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [10, -50] }) },
            { scale: t.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.6, 1.25, 1] }) },
          ],
        },
      ]}
    >
      {text}
    </Animated.Text>
  );
}

/** Algo que late mientras `on` (la llama cuando la racha está en peligro). */
export function Pulse({ on, children }: { on: boolean; children: React.ReactNode }) {
  const [t] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (!on) {
      t.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1.12, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(t, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [on, t]);
  return <Animated.View style={{ transform: [{ scale: t }] }}>{children}</Animated.View>;
}

/** Entrada con rebote (para “LEVEL UP” y el resultado de la ronda). */
export function BounceIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [t] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.spring(t, { toValue: 1, delay, friction: 5, tension: 80, useNativeDriver: true }).start();
  }, [t, delay]);
  return (
    <Animated.View style={{ opacity: t, transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }] }}>
      {children}
    </Animated.View>
  );
}

export function Chip({ label, color = c.muted }: { label: string; color?: string }) {
  return (
    <View style={[s.chip, { borderColor: color }]}>
      <Text style={[s.chipText, { color }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  track: { backgroundColor: c.line, overflow: 'hidden', width: '100%' },
  pop: { position: 'absolute', alignSelf: 'center', top: '40%', fontSize: 30, fontWeight: '900' },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  chipText: { fontSize: 12, fontWeight: '700' },
});
