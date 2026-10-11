import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { DOMAINS, type Domain, type Progress } from '../game.ts';
import { TERMS } from '../glossary.ts';
import { STR } from '../i18n.ts';
import { Rich, Tag, Txt } from '../term.tsx';
import { c, domainColor, font } from '../theme.ts';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function Glossary({ p }: { p: Progress }) {
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState<Domain | null>(null);
  const L = p.lang;
  const T = STR[L];
  const q = norm(query.trim());
  const list = TERMS.filter(
    (t) => (!domain || t.domain === domain) && (!q || norm(t.term).includes(q) || norm(t.def[L]).includes(q)),
  ).sort((a, b) => a.term.replace(/[^a-z0-9]/gi, '').localeCompare(b.term.replace(/[^a-z0-9]/gi, ''), 'en', { sensitivity: 'base' }));

  return (
    <View style={s.fill}>
      <View style={s.page}>
        <View style={s.head}>
          <Txt bold color={c.green}>
            $ grep -i
          </Txt>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={T.search}
            placeholderTextColor={c.muted}
            autoCapitalize="none"
            autoCorrect={false}
            style={s.input}
            cursorColor={c.green}
            selectionColor={c.greenDim}
          />
        </View>
        <View style={s.chips}>
          <Chip label={T.all} on={!domain} color={c.text} onPress={() => setDomain(null)} />
          {DOMAINS.map((d) => (
            <Chip key={d.id} label={`d${d.n}`} on={domain === d.id} color={domainColor[d.id]} onPress={() => setDomain(domain === d.id ? null : d.id)} />
          ))}
        </View>
        <Txt size={12} color={c.muted}>
          {'> '}
          {T.termsN(list.length)}
        </Txt>
      </View>
      <FlatList
        data={list}
        keyExtractor={(t) => `${t.domain}:${t.term}`}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const d = DOMAINS.find((x) => x.id === item.domain)!;
          return (
            <View style={s.row}>
              <View style={s.termRow}>
                <Txt bold color={c.cyan} style={{ flex: 1 }}>
                  {item.term}
                </Txt>
                <Tag label={`d${d.n}`} color={domainColor[item.domain]} />
              </View>
              <Rich text={item.def[L]} size={13} />
            </View>
          );
        }}
      />
    </View>
  );
}

function Chip({ label, on, color, onPress }: { label: string; on: boolean; color: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={4} style={[s.chip, { borderColor: color }, on && { backgroundColor: color }]}>
      <Txt size={12} bold color={on ? c.bg : color}>
        {label}
      </Txt>
    </Pressable>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: c.bg },
  page: { padding: 16, gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    color: c.text,
    fontFamily: font.regular,
    fontSize: 14,
    borderBottomWidth: 1,
    borderBottomColor: c.green,
    paddingVertical: 4,
  },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { borderWidth: 1, borderRadius: 3, paddingHorizontal: 8, paddingVertical: 2 },
  row: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.line, gap: 4 },
  termRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
