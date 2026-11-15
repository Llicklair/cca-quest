// Tu chat de Claude: para que todos los "pregúntale a Claude" vayan al mismo chat en vez de abrir
// uno nuevo cada vez. claude.ai no deja escribir en un chat que ya existe desde un enlace (?q= solo
// vale para chats nuevos) ni reutilizar su pestaña desde otra web (Cross-Origin-Opener-Policy), así
// que con un chat vinculado la app copia el prompt y lo pegas tú allí. En el móvil, además, abre el
// chat (en la app de Claude si la tienes). Sin chat vinculado, como siempre: un chat nuevo con el
// prompt ya escrito en la web y el menú de compartir en el móvil.
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
 * Qué pasó al mandarlo, para decírselo a quien lo mandó: abierto con el prompt escrito (y copiado
 * por si acaso), copiado para pegarlo en un chat nuevo (muy largo para el enlace), en tu chat
 * de la web o en el que se abrió en el móvil, compartido, o no se pudo copiar.
 */
export type Sent = 'copied' | 'opened' | 'pasteNew' | 'pasteChat' | 'pasteApp' | 'shared' | 'failed';

/**
 * Manda un prompt a Claude. En la web, la pestaña nueva se abre antes de esperar a nada: si se
 * abriera después de copiar, el navegador ya no lo vería como respuesta al toque y la bloquearía.
 */
export function sendToClaude(text: string, chat: string | null): Promise<Sent> {
  const copy = () => Clipboard.setStringAsync(text).catch(() => false);
  if (Platform.OS !== 'web') {
    if (!chat) return Share.share({ message: text }).then(() => 'shared' as const, () => 'shared' as const);
    return copy().then(async (ok) => {
      if (!ok) return 'failed' as const;
      await Linking.openURL(chat).catch(() => {});
      return 'pasteApp' as const;
    });
  }
  const copied = copy();
  if (chat) return copied.then((ok) => (ok ? 'pasteChat' : 'failed'));
  const fits = fitsUrl(text);
  window.open(fits ? claudeUrl(text) : CLAUDE_NEW, '_blank', 'noopener');
  return copied.then((ok) => (fits ? (ok ? 'copied' : 'opened') : ok ? 'pasteNew' : 'failed'));
}

/** Abre tu chat en otra pestaña (en el móvil, en la app de Claude si la tienes). */
export function openChat(chat: string) {
  if (Platform.OS === 'web') window.open(chat, '_blank', 'noopener');
  else Linking.openURL(chat).catch(() => {});
}

/** El mensaje bajo el botón después de mandarlo; nada si no hace falta decir nada. */
export function sentLine(sent: Sent | null, lang: Lang): string | null {
  const T = STR[lang];
  if (!sent) return null;
  return { copied: T.askCopied, opened: null, pasteNew: T.askPasteNew, pasteChat: T.askPasteChat, pasteApp: T.askPasteApp, shared: null, failed: T.askFailed }[sent];
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
