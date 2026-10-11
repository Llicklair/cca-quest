// Piezas de la interfaz de terminal: texto monoespaciado, paneles, barras ASCII,
// botones, cursor, tecleo y la lluvia de caracteres para celebrar.
import { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import type { Lang } from './game.ts';
import { c, font } from './theme.ts';

type TxtProps = {
  children: React.ReactNode;
  color?: string;
  size?: number;
  bold?: boolean;
  style?: StyleProp<TextStyle>;
  onPress?: () => void;
};

export function Txt({ children, color = c.text, size = 14, bold, style, onPress }: TxtProps) {
  return (
    <Text
      onPress={onPress}
      style={[{ color, fontSize: size, lineHeight: Math.round(size * 1.5), fontFamily: bold ? font.bold : font.regular }, style]}
    >
      {children}
    </Text>
  );
}

/** Texto con `código` entre comillas invertidas resaltado. */
export function Rich({ text, color = c.text, size = 14, bold, style }: { text: string } & Omit<TxtProps, 'children'>) {
  const parts = text.split('`');
  return (
    <Txt color={color} size={size} bold={bold} style={style}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <Text key={i} style={{ color: c.cyan, fontFamily: font.bold }}>
            {part}
          </Text>
        ) : (
          part
        ),
      )}
    </Txt>
  );
}

/** Una línea de comando: “$ cca-quest status”. */
export function Cmd({ children, size = 14 }: { children: React.ReactNode; size?: number }) {
  return (
    <Txt size={size} bold>
      <Text style={{ color: c.green }}>$ </Text>
      {children}
    </Txt>
  );
}

/** Caja con el título incrustado en el borde superior. */
export function Panel({
  title,
  children,
  color = c.lineHi,
  titleColor = c.muted,
  style,
}: {
  title?: string;
  children: React.ReactNode;
  color?: string;
  titleColor?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[s.panel, { borderColor: color }, style]}>
      {title ? (
        <View style={s.panelTitle}>
          <Txt size={12} color={titleColor} bold>
            {` ${title} `}
          </Txt>
        </View>
      ) : null}
      {children}
    </View>
  );
}

/** Barra de progreso ASCII: [██████░░░░]. */
export function Bar({ value, width = 16, color = c.green }: { value: number; width?: number; color?: string }) {
  const n = Math.round(Math.max(0, Math.min(1, value)) * width);
  return (
    <Txt color={c.muted}>
      [<Text style={{ color }}>{'█'.repeat(n)}</Text>
      <Text style={{ color: c.lineHi }}>{'░'.repeat(width - n)}</Text>]
    </Txt>
  );
}

type BtnKind = 'primary' | 'ghost' | 'danger' | 'good' | 'amber';

export function Btn({
  label,
  onPress,
  kind = 'ghost',
  disabled,
  style,
  small,
}: {
  label: string;
  onPress: () => void;
  kind?: BtnKind;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const tone = { primary: c.green, ghost: c.lineHi, danger: c.red, good: c.green, amber: c.amber }[kind];
  const filled = kind === 'primary' || kind === 'good' || kind === 'amber';
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.btn,
        small && s.btnSmall,
        { borderColor: tone, backgroundColor: filled ? tone : 'transparent', opacity: disabled ? 0.4 : 1 },
        pressed && { backgroundColor: filled ? c.text : c.greenBg },
        style,
      ]}
    >
      <Txt size={small ? 13 : 15} bold color={filled ? c.bg : kind === 'danger' ? c.red : c.text}>
        {label}
      </Txt>
    </Pressable>
  );
}

/** Cursor de bloque que parpadea. */
export function Cursor({ color = c.green, size = 14 }: { color?: string; size?: number }) {
  const [t] = useState(() => new Animated.Value(1));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 0, duration: 1, delay: 530, useNativeDriver: true }),
        Animated.timing(t, { toValue: 1, duration: 1, delay: 530, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);
  return (
    <Animated.Text style={{ opacity: t, color, fontSize: size, fontFamily: font.regular, lineHeight: Math.round(size * 1.5) }}>
      ▋
    </Animated.Text>
  );
}

/** Texto que se escribe solo, letra a letra. Para reiniciarlo, cambia su key. */
export function Typer({ text, size = 14, color = c.text, bold, speed = 14 }: { text: string; size?: number; color?: string; bold?: boolean; speed?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let k = 0;
    const id = setInterval(() => {
      k = Math.min(text.length, k + 2);
      setN(k);
      if (k >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return (
    <Txt size={size} color={color} bold={bold}>
      {text.slice(0, n)}
      {n < text.length ? <Text style={{ color: c.green }}>▋</Text> : null}
    </Txt>
  );
}

/** Algo que late mientras `on` (la racha en peligro). */
export function Pulse({ on, children }: { on: boolean; children: React.ReactNode }) {
  const [t] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (!on) {
      t.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 0.35, duration: 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(t, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [on, t]);
  return <Animated.View style={{ opacity: t }}>{children}</Animated.View>;
}

/** Entrada con rebote (subida de nivel, resultado). */
export function BounceIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [t] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.spring(t, { toValue: 1, delay, friction: 5, tension: 80, useNativeDriver: true }).start();
  }, [t, delay]);
  return (
    <Animated.View style={{ opacity: t, transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }}>
      {children}
    </Animated.View>
  );
}

/** “+15 XP” que sube y se desvanece. Se reinicia al cambiar de key. */
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

const GLYPHS = 'アイウエオカキクケコサシスセソ01{}[]<>/$#*+=ﾊﾋﾌﾍﾎ';
const glyphs = (n: number) => Array.from({ length: n }, () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]).join('\n');

type Drop = { x: number; chars: string; t: Animated.Value; delay: number; bright: boolean };

/** Lluvia de caracteres estilo Matrix. Para otra, se monta de nuevo con otra key. */
export function Rain() {
  const { width, height } = useWindowDimensions();
  const [drops] = useState<Drop[]>(() =>
    Array.from({ length: Math.ceil(width / 22) }, (_, i) => ({
      x: i * 22 + Math.random() * 6,
      chars: glyphs(10 + Math.floor(Math.random() * 10)),
      t: new Animated.Value(0),
      delay: Math.random() * 600,
      bright: Math.random() < 0.3,
    })),
  );
  const [done, setDone] = useState(false);

  useEffect(() => {
    const anim = Animated.parallel(
      drops.map((d) =>
        Animated.timing(d.t, { toValue: 1, duration: 1400 + Math.random() * 900, delay: d.delay, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ),
    );
    anim.start(() => setDone(true));
    return () => anim.stop();
  }, [drops]);

  if (done) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {drops.map((d, i) => (
        <Animated.Text
          key={i}
          style={{
            position: 'absolute',
            left: d.x,
            top: -400,
            color: d.bright ? c.text : c.green,
            fontFamily: font.bold,
            fontSize: 16,
            lineHeight: 20,
            textShadowColor: c.green,
            textShadowRadius: 8,
            opacity: d.t.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 0.95, 0.8, 0] }),
            transform: [{ translateY: d.t.interpolate({ inputRange: [0, 1], outputRange: [0, height + 400] }) }],
          }}
        >
          {d.chars}
        </Animated.Text>
      ))}
    </View>
  );
}

/** Selector [EN|ES]. */
export function LangToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <View style={s.toggle}>
      {(['en', 'es'] as const).map((l) => (
        <Pressable key={l} onPress={() => onChange(l)} hitSlop={10} style={[s.toggleItem, lang === l && { backgroundColor: c.green }]}>
          <Txt size={14} bold color={lang === l ? c.bg : c.muted}>
            {l.toUpperCase()}
          </Txt>
        </Pressable>
      ))}
    </View>
  );
}

/** Etiqueta pequeña entre corchetes: [d1 agents]. */
export function Tag({ label, color = c.muted }: { label: string; color?: string }) {
  return (
    <Txt size={12} color={color} bold>
      [{label}]
    </Txt>
  );
}

const s = StyleSheet.create({
  panel: { borderWidth: 1, borderRadius: 4, padding: 14, paddingTop: 16, backgroundColor: c.panel, marginTop: 8 },
  panelTitle: { position: 'absolute', top: -10, left: 10, backgroundColor: c.bg },
  btn: { borderWidth: 1, borderRadius: 3, paddingVertical: 13, paddingHorizontal: 14, alignItems: 'center' },
  btnSmall: { paddingVertical: 7, paddingHorizontal: 10 },
  pop: { position: 'absolute', alignSelf: 'center', top: '40%', fontSize: 30, fontFamily: font.bold },
  toggle: { flexDirection: 'row', borderWidth: 1, borderColor: c.lineHi, borderRadius: 3, overflow: 'hidden' },
  toggleItem: { paddingHorizontal: 14, paddingVertical: 6, minWidth: 48, alignItems: 'center' },
});

// Rótulo en letras de caja (estilo “Calvin S”), compuesto glifo a glifo para que no se descuadre.
const GLYPH: Record<string, [string, string, string]> = {
  C: ['╔═╗', '║  ', '╚═╝'],
  A: ['╔═╗', '╠═╣', '╩ ╩'],
  Q: ['╔═╗ ', '║ ║ ', '╚═╩═'],
  U: ['╦ ╦', '║ ║', '╚═╝'],
  E: ['╔═╗', '║╣ ', '╚═╝'],
  S: ['╔═╗', '╚═╗', '╚═╝'],
  T: ['╔╦╗', ' ║ ', ' ╩ '],
  ' ': [' ', ' ', ' '],
};

export function Banner({ text, color = c.green, size = 15 }: { text: string; color?: string; size?: number }) {
  const rows = [0, 1, 2].map((r) => [...text].map((ch) => GLYPH[ch]?.[r] ?? '').join(''));
  return (
    <Text style={{ color, fontFamily: font.bold, fontSize: size, lineHeight: Math.round(size * 1.15), textShadowColor: color, textShadowRadius: 6 }}>
      {rows.join('\n')}
    </Text>
  );
}

const HEAT = [c.line, '#1E5A37', c.greenDim, '#3CC873', c.green];
const heatLevel = (n: number) => (n === 0 ? 0 : n < 5 ? 1 : n < 10 ? 2 : n < 20 ? 3 : 4);

/** Mapa de actividad estilo GitHub: filas lunes→domingo, columnas semanas. */
export function Heatmap({
  weeks,
  labels = ['mon', '', 'wed', '', 'fri', '', 'sun'],
  less = 'less',
  more = 'more',
}: {
  weeks: (number | null)[][];
  labels?: string[];
  less?: string;
  more?: string;
}) {
  return (
    <View>
      {labels.map((label, day) => (
        <View key={day} style={{ flexDirection: 'row' }}>
          <Text style={{ width: 36, fontFamily: font.regular, fontSize: 11, lineHeight: 16, color: c.muted }}>{label}</Text>
          <Text style={{ fontFamily: font.regular, fontSize: 13, lineHeight: 16 }}>
            {weeks.map((w, i) => {
              const n = w[day];
              return (
                <Text key={i} style={{ color: n === null ? 'transparent' : HEAT[heatLevel(n)] }}>
                  ■{' '}
                </Text>
              );
            })}
          </Text>
        </View>
      ))}
      <Text style={{ fontFamily: font.regular, fontSize: 11, color: c.muted, marginTop: 4 }}>
        {less}{' '}
        {HEAT.map((col, i) => (
          <Text key={i} style={{ color: col }}>
            ■{' '}
          </Text>
        ))}
        {more}
      </Text>
    </View>
  );
}

/** Arranque de un segundo con líneas tipo “[ ok ] …”. Un toque lo salta. */
export function Boot({ lines, onDone }: { lines: string[]; onDone: () => void }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let k = 0;
    const id = setInterval(() => {
      k += 1;
      setN(k);
      if (k > lines.length + 2) {
        clearInterval(id);
        onDone();
      }
    }, 170);
    return () => clearInterval(id);
  }, [lines, onDone]);
  return (
    <Pressable onPress={onDone} style={{ flex: 1, backgroundColor: c.bg, padding: 20, paddingTop: 60, gap: 4 }}>
      <Banner text="CCA QUEST" />
      <View style={{ height: 16 }} />
      {lines.slice(0, n).map((line, i) => (
        <Txt key={i} size={13} color={line.startsWith('[ ok ]') ? c.text : c.green}>
          {line.startsWith('[ ok ]') ? (
            <>
              <Text style={{ color: c.green }}>[ ok ]</Text>
              {line.slice(6)}
            </>
          ) : (
            line
          )}
        </Txt>
      ))}
      {n <= lines.length && <Cursor />}
    </Pressable>
  );
}
