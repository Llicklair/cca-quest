import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Lang, Progress, Question } from './game.ts';
import { plan } from './remind.ts';

// Solo notificaciones locales: nada de servidor ni de cuenta de Expo.
const CHANNEL = 'reminders';
const off = Platform.OS === 'web';

if (!off) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** En Android 13+ el permiso no se puede pedir hasta que existe un canal. */
export async function ensurePermission(): Promise<boolean> {
  if (off) return false;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL, {
        name: 'Daily reminders',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return true;
    return (await Notifications.requestPermissionsAsync()).status === 'granted';
  } catch {
    return false;
  }
}

/** Borra lo programado y vuelve a programar según el progreso de ahora. */
export async function reschedule(qs: Question[], p: Progress): Promise<void> {
  if (off) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const r of plan(qs, p, new Date())) {
      await Notifications.scheduleNotificationAsync({
        content: { title: r.title, body: r.body },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.at, channelId: CHANNEL },
      });
    }
  } catch {
    // sin permiso o sin servicio: la app sigue funcionando sin avisos
  }
}

const TEST = {
  en: { title: '🔥 This is how reminders look', body: 'Five questions a day keeps the exam at bay.' },
  es: { title: '🔥 Así se ven los recordatorios', body: 'Cinco preguntas al día y el examen, controlado.' },
};

export async function testNotification(lang: Lang = 'en'): Promise<boolean> {
  if (!(await ensurePermission())) return false;
  await Notifications.scheduleNotificationAsync({
    content: TEST[lang],
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(Date.now() + 5000), channelId: CHANNEL },
  });
  return true;
}
