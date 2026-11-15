// Tu chat de Claude: para que todos los "pregúntale a Claude" vayan al mismo chat en vez de abrir
// uno nuevo cada vez. claude.ai no deja escribir en un chat que ya existe desde un enlace (?q= solo
// vale para chats nuevos) ni reutilizar su pestaña desde otra web (Cross-Origin-Opener-Policy), así
// que con un chat vinculado la app copia el prompt y lo pegas tú allí. Sin chat vinculado, como
// siempre, sin pegar nada: en el móvil, el menú de compartir (la app de Claude recibe el prompt
// entero, sea del tamaño que sea); en la web, un chat nuevo con el prompt ya escrito en el enlace.
// Solo en la web y solo los que no caben en un enlace (un simulacro entero, todas las falladas,
// dónde fallo) hay que pegarlos: claude.ai no acepta direcciones tan largas.
import * as Clipboard from 'expo-clipboard';
import { createContext, useContext, useState } from 'react';
import { Linking, Platform, Share, StyleSheet, TextInput, View } from 'react-native';

import { CLAUDE_NEW, chatUrl, claudeUrl, fitsUrl } from './ask.ts';
import type { Lang } from './game.ts';
import { STR } from './i18n.ts';
import { Btn, Txt } from './term.tsx';
import { c, font, themed } from './theme.ts';

export type ClaudeChat = { chat: string | null; setChat: (url: string | null) => void };

/** Lo da App con el chat guardado en el progreso, que viaja con la sincronización. */
export const ChatContext = createContext<ClaudeChat>({ chat: null, setChat: () => {} });
export const useClaudeChat = () => useContext(ChatContext);

/**
 * Qué pasó al mandarlo: abierto en un chat nuevo con el prompt escrito (web), compartido (móvil),
 * copiado para pegarlo en `target` (tu chat o uno nuevo), o no se pudo copiar y hay que hacerlo a mano.
 */
export type Sent =
  | { kind: 'opened' }
  | { kind: 'shared' }
  | { kind: 'copied'; chars: number; target: string; chat: boolean }
  | { kind: 'failed'; text: string; target: string; chat: boolean };

/**
 * Copia en la web sin esperar a nada: un cuadro de texto oculto y execCommand('copy') dentro del
 * mismo toque. navigator.clipboard comprueba el foco un momento después y, si entretanto se ha
 * abierto una pestaña, falla sin avisar. El cuadro es un campo de texto, así que la protección
 * anticopia (guard.ts) lo deja pasar. Devuelve el foco a donde estaba.
 */
function copyNow(text: string): boolean {
  const before = document.activeElement as HTMLElement | null;
  const box = document.createElement('textarea');
  box.value = text;
  box.setAttribute('readonly', '');
  Object.assign(box.style, { position: 'fixed', top: '0', left: '0', width: '1px', height: '1px', opacity: '0' });
  document.body.appendChild(box);
  box.focus();
  box.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  box.remove();
  before?.focus?.();
  return ok;
}

/**
 * Copia y dice si de verdad se copió. En la web no se usa expo-clipboard: si navigator.clipboard
 * falla, su plan B (execCommand) devuelve true sin mirar si funcionó, y la app decía "copiado" con
 * el portapapeles vacío.
 */
async function copy(text: string): Promise<boolean> {
  if (Platform.OS !== 'web') return Clipboard.setStringAsync(text).catch(() => false);
  if (copyNow(text)) return true;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Manda un prompt a Claude. Sin chat vinculado, automático: en el móvil el menú de compartir, con
 * cualquier tamaño; en la web, si cabe en el enlace, un chat nuevo con él escrito (la pestaña se abre
 * en el mismo toque o el navegador la bloquea). Si no (tu chat, o en la web uno demasiado largo), lo
 * copia y no abre nada: quien lo manda ve el aviso de que está copiado y abre Claude con el botón del
 * aviso, que si no se quedaría en un chat vacío sin saber por qué.
 */
export async function sendToClaude(text: string, chat: string | null): Promise<Sent> {
  if (!chat && Platform.OS !== 'web') return Share.share({ message: text }).then(() => ({ kind: 'shared' as const }), () => ({ kind: 'shared' as const }));
  if (!chat && fitsUrl(text)) {
    copyNow(text); // por si claude.ai se abre vacío
    window.open(claudeUrl(text), '_blank', 'noopener');
    return { kind: 'opened' };
  }
  const target = chat ?? CLAUDE_NEW;
  return (await copy(text))
    ? { kind: 'copied', chars: text.length, target, chat: Boolean(chat) }
    : { kind: 'failed', text, target, chat: Boolean(chat) };
}

/** Abre tu chat, o uno nuevo, en otra pestaña (en el móvil, en la app de Claude si la tienes). */
export function openChat(url: string) {
  if (Platform.OS === 'web') window.open(url, '_blank', 'noopener');
  else Linking.openURL(url).catch(() => {});
}

/**
 * El aviso de debajo del botón tras mandarlo. Copiado: cuánto, dónde pegarlo y el botón para abrir
 * Claude. Sin poder copiar: el texto en un cuadro, para seleccionarlo y copiarlo a mano.
 */
export function SentBox({ sent, lang }: { sent: Sent | null; lang: Lang }) {
  const T = STR[lang];
  if (!sent || sent.kind === 'shared') return null;
  if (sent.kind === 'opened')
    return (
      <Txt size={11} color={c.muted}>
        {T.askCopied}
      </Txt>
    );
  const open = <Btn small kind="primary" label={sent.chat ? T.askOpenChat : T.askOpen} onPress={() => openChat(sent.target)} />;
  if (sent.kind === 'copied')
    return (
      <View style={s.box}>
        <Txt bold size={13} color={c.green}>
          {T.askCopiedN(sent.chars.toLocaleString(lang === 'es' ? 'es-ES' : 'en-US'))}
        </Txt>
        <Txt size={12} color={c.text}>
          {T.askPasteHow(sent.chat)}
        </Txt>
        {open}
      </View>
    );
  return (
    <View style={[s.box, { borderColor: c.red }]}>
      <Txt bold size={12} color={c.red}>
        {T.askCopyByHand}
      </Txt>
      <TextInput value={sent.text} onChangeText={() => {}} multiline numberOfLines={8} selectTextOnFocus style={[s.input, s.manual]} />
      {open}
    </View>
  );
}

/**
 * Pegar el enlace de tu chat para vincularlo. `compact`: la versión de debajo de un botón, solo con
 * la pregunta, el cuadro y el botón; la de ajustes también enseña el chat vinculado y cómo olvidarlo.
 */
export function ChatLinker({ lang, compact }: { lang: Lang; compact?: boolean }) {
  const { chat, setChat } = useClaudeChat();
  const [text, setText] = useState('');
  const [bad, setBad] = useState(false);
  const [saved, setSaved] = useState(false);
  const T = STR[lang];
  const save = () => {
    const url = chatUrl(text);
    setBad(!url);
    if (!url) return;
    setChat(url);
    setText('');
    setSaved(true);
  };
  if (chat && compact) return saved ? <Txt size={11} color={c.green}>{T.chatSaved}</Txt> : null;
  if (chat)
    return (
      <View style={{ gap: 8 }}>
        <Txt size={12} color={c.muted}>
          {T.chatOn}
        </Txt>
        <Txt size={12} bold color={c.cyan} onPress={() => openChat(chat)}>
          {chat.replace('https://', '')} ↗
        </Txt>
        <Btn small label={T.chatForget} onPress={() => setChat(null)} />
      </View>
    );
  return (
    <View style={{ gap: 6 }}>
      <Txt size={compact ? 11 : 12} color={c.muted}>
        {compact ? T.chatLinkHint : T.chatOff}
      </Txt>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <TextInput
          value={text}
          onChangeText={(v) => {
            setText(v);
            setBad(false);
          }}
          onSubmitEditing={save}
          placeholder={T.chatPh}
          placeholderTextColor={c.muted}
          autoCapitalize="none"
          autoCorrect={false}
          inputMode="url"
          style={s.input}
        />
        <Btn small kind="primary" label={T.chatSave} onPress={save} disabled={!text.trim()} />
      </View>
      {bad && (
        <Txt size={11} color={c.red}>
          {T.chatBad}
        </Txt>
      )}
    </View>
  );
}

const s = themed(() =>
  StyleSheet.create({
    box: { gap: 8, borderWidth: 1, borderColor: c.green, borderRadius: 3, padding: 10, backgroundColor: c.panel },
    manual: { flex: 0, flexGrow: 0, flexShrink: 0, flexBasis: 'auto', height: 160, minHeight: 160, textAlignVertical: 'top' },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.lineHi,
      borderRadius: 3,
      paddingHorizontal: 10,
      paddingVertical: 8,
      color: c.text,
      backgroundColor: c.panel,
      fontFamily: font.regular,
      fontSize: 13,
    },
  }),
);
