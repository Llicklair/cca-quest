import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Vibraciones de acierto, fallo y premio. En Android la doc recomienda
// performAndroidHapticsAsync; si el móvil no vibra, no pasa nada.
const quiet = (p: Promise<void>) => void p.catch(() => {});
const web = Platform.OS === 'web';
const android = Platform.OS === 'android';

export function tap() {
  if (!web) quiet(Haptics.selectionAsync());
}

export function good() {
  if (web) return;
  quiet(
    android
      ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm)
      : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  );
}

export function bad() {
  if (web) return;
  quiet(
    android
      ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Reject)
      : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  );
}

/** Premio gordo (subida de nivel, ronda perfecta): tres golpes seguidos. */
export function big() {
  if (web) return;
  [0, 120, 240].forEach((ms) => setTimeout(() => quiet(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)), ms));
}
