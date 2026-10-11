import AsyncStorage from '@react-native-async-storage/async-storage';

import { fresh, rollDay, type Progress } from './game.ts';

// Todo el progreso vive en el móvil. Se mezcla con los valores por defecto para
// que los campos nuevos de futuras versiones no rompan un progreso guardado.
const KEY = 'cca-quest:v1';

export async function load(today: string): Promise<Progress> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<Progress>;
      const base = fresh(today);
      return rollDay({ ...base, ...saved, reminder: { ...base.reminder, ...saved.reminder } }, today);
    }
  } catch {
    // datos ilegibles: se empieza de cero antes que bloquear la app
  }
  return fresh(today);
}

export function save(p: Progress): void {
  AsyncStorage.setItem(KEY, JSON.stringify(p)).catch(() => {});
}

export async function wipe(): Promise<void> {
  await AsyncStorage.removeItem(KEY).catch(() => {});
}
