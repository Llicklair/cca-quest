// Comprueba si hay una APK más nueva en las releases del repo. Cada compilación
// publica la release build-N con la APK, así que basta comparar N con BUILD.
import { BUILD } from './build.ts';

export const REPO = 'Llicklair/cca-quest';
export const APK_URL = `https://github.com/${REPO}/releases/latest/download/CCAQuest.apk`;

export type UpdateInfo = { current: number; latest: number; available: boolean };

export function parseBuild(tag: string): number | null {
  const m = /^build-(\d+)$/.exec(tag.trim());
  return m ? Number(m[1]) : null;
}

export function compare(current: number, tag: string): UpdateInfo | null {
  const latest = parseBuild(tag);
  return latest === null ? null : { current, latest, available: latest > current };
}

/** null si no hay red, GitHub no responde o la última release no tiene el formato esperado. */
export async function checkUpdate(): Promise<UpdateInfo | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { tag_name?: string };
    return compare(BUILD, json.tag_name ?? '');
  } catch {
    return null;
  }
}
