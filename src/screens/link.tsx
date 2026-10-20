// Panel de sincronización en config: el PC enseña un QR y el móvil lo escanea, como
// WhatsApp Web. Ver src/sync.ts para cómo viaja el progreso.
import { CameraView, useCameraPermissions } from 'expo-camera';
import createQr from 'qrcode-generator';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

import type { Lang } from '../game.ts';
import { STR } from '../i18n.ts';
import { newPairCode, pairedChannel, parseCode, QR_PREFIX, showCode, type useSync } from '../sync.ts';
import { Btn, Panel, Txt } from '../term.tsx';
import { c, font } from '../theme.ts';

type Sync = ReturnType<typeof useSync>;

const PAIR_POLL_MS = 2_000;
const PAIR_TTL_MS = 10 * 60_000;

/** QR en negro sobre blanco con su margen: los lectores no leen bien los QR invertidos. */
function Qr({ value, size = 220 }: { value: string; size?: number }) {
  const rows = useMemo(() => {
    const qr = createQr(0, 'M');
    qr.addData(value);
    qr.make();
    const n = qr.getModuleCount();
    return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, col) => qr.isDark(r, col)));
  }, [value]);
  const cell = Math.floor(size / (rows.length + 8));
  return (
    <View style={[s.qr, { padding: cell * 4 }]}>
      {rows.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {row.map((dark, col) => (
            <View key={col} style={{ width: cell, height: cell, backgroundColor: dark ? '#000' : '#fff' }} />
          ))}
        </View>
      ))}
    </View>
  );
}

export function SyncPanel({ lang, sync }: { lang: Lang; sync: Sync }) {
  const T = STR[lang];
  const native = Platform.OS !== 'web';
  const [code, setCode] = useState<{ value: string; at: number } | null>(null); // código que enseña este dispositivo
  const [typed, setTyped] = useState('');
  const [scanning, setScanning] = useState(false);
  const [joining, setJoining] = useState(false);
  // Se guarda qué mensaje es y no su texto, para que cambie de idioma con la app.
  const [msg, setMsg] = useState<{ key: 'linkExpired' | 'linkDone' | 'linkBadCode' | 'linkFailed' | 'cameraDenied'; bad?: boolean } | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const busy = useRef(false); // la cámara avisa varias veces seguidas del mismo QR
  const { adopt } = sync;

  // Mientras se enseña el código, se mira cada 2 s si el móvil ya lo usó.
  useEffect(() => {
    if (!code) return;
    const id = setInterval(async () => {
      if (Date.now() - code.at > PAIR_TTL_MS) {
        setCode(null);
        setMsg({ key: 'linkExpired', bad: true });
        return;
      }
      const ch = await pairedChannel(code.value).catch(() => null);
      if (ch) {
        setCode(null);
        await adopt(ch);
        setMsg({ key: 'linkDone' });
      }
    }, PAIR_POLL_MS);
    return () => clearInterval(id);
  }, [code, adopt]);

  const join = async (input: string) => {
    if (busy.current) return;
    const parsed = parseCode(input);
    if (!parsed) {
      setMsg({ key: 'linkBadCode', bad: true });
      return;
    }
    busy.current = true;
    setScanning(false);
    setJoining(true);
    setMsg(null);
    try {
      await sync.join(parsed);
      setTyped('');
      setMsg({ key: 'linkDone' });
    } catch {
      setMsg({ key: 'linkFailed', bad: true });
    } finally {
      busy.current = false;
      setJoining(false);
    }
  };

  const scan = async () => {
    setMsg(null);
    const ok = permission?.granted || (await requestPermission()).granted;
    if (ok) setScanning(true);
    else setMsg({ key: 'cameraDenied', bad: true });
  };

  const { status } = sync;
  const time = status.state === 'ok' ? status.at.toTimeString().slice(0, 8) : '';

  return (
    <Panel title={T.syncTitle} color={sync.channel ? c.greenDim : c.lineHi} titleColor={sync.channel ? c.green : c.muted}>
      {sync.channel ? (
        <>
          <Txt bold color={c.green}>
            {T.linked} · {sync.channel.slice(0, 6)}…
          </Txt>
          <Txt size={12} color={status.state === 'error' ? c.red : c.muted}>
            {status.state === 'syncing' ? T.syncing : status.state === 'error' ? T.syncError : status.state === 'ok' ? T.syncedAt(time) : ''}
          </Txt>
          <View style={[s.row, { marginTop: 10 }]}>
            <Btn small label="$ sync --now" onPress={sync.run} style={{ flex: 1 }} />
            <Btn small kind="danger" label="$ unlink" onPress={sync.unlink} style={{ flex: 1 }} />
          </View>
        </>
      ) : (
        <Txt size={12} color={c.muted}>
          {native ? T.linkHintPhone : T.linkHintPc}
        </Txt>
      )}

      {code ? (
        <View style={{ alignItems: 'center', marginTop: 12, gap: 8 }}>
          <Qr value={QR_PREFIX + code.value} />
          <Txt bold size={18} color={c.green}>
            {showCode(code.value)}
          </Txt>
          <Txt size={12} color={c.muted}>
            {T.linkWaiting}
          </Txt>
          <Btn small label="$ cancel" onPress={() => setCode(null)} />
        </View>
      ) : scanning ? (
        <View style={{ marginTop: 12, gap: 8 }}>
          <CameraView
            style={s.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={joining ? undefined : ({ data }) => join(data)}
          />
          <Btn small label="$ cancel" onPress={() => setScanning(false)} />
        </View>
      ) : (
        <View style={{ marginTop: 10, gap: 8 }}>
          {native ? (
            <Btn kind="primary" label={T.linkScan} onPress={scan} disabled={joining} />
          ) : (
            <Btn
              kind={sync.channel ? 'ghost' : 'primary'}
              label={T.linkShow}
              onPress={() => {
                setMsg(null);
                setCode({ value: newPairCode(), at: Date.now() });
              }}
            />
          )}
          <View style={s.row}>
            <TextInput
              value={typed}
              onChangeText={setTyped}
              placeholder={T.linkPlaceholder}
              placeholderTextColor={c.muted}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={() => join(typed)}
              style={s.input}
            />
            <Btn small label="$ link" onPress={() => join(typed)} disabled={joining || typed.trim() === ''} />
          </View>
        </View>
      )}

      {joining && (
        <Txt size={12} color={c.muted} style={{ marginTop: 6 }}>
          {T.syncing}
        </Txt>
      )}
      {msg && (
        <Txt size={12} color={msg.bad ? c.red : c.green} style={{ marginTop: 6 }}>
          {T[msg.key]}
        </Txt>
      )}
      <Txt size={11} color={c.muted} style={{ marginTop: 8 }}>
        {T.syncNote}
      </Txt>
    </Panel>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qr: { backgroundColor: '#fff', borderRadius: 4 },
  camera: { width: '100%', aspectRatio: 1, borderRadius: 4, overflow: 'hidden' },
  input: {
    flex: 1,
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
