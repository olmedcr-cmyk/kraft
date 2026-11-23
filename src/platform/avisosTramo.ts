/**
 * Con la pantalla bloqueada (o la app detrás) el reloj de la app se duerme y no suena el cambio de tramo.
 * Al irse a segundo plano se programan avisos locales con sonido para los próximos cambios; al volver,
 * se quitan (la app vuelve a sonar sola). Sin permiso de avisos, no hace nada. En web, nada.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { SegmentKind } from '@/timer/engine';

const PREFIX = 'kraft-tramo-';
let scheduled: string[] = [];

const TEXT: Record<SegmentKind | 'done', string> = {
  countdown: 'Prepárate: 3, 2, 1',
  work: 'Trabajo',
  rest: 'Descanso',
  wait: 'Espera: tú decides cuándo sigues',
  reps: 'Repeticiones: marca la serie al acabar',
  done: 'Hecho',
};

export async function programarAvisos(changes: { at: number; kind: SegmentKind | 'done' }[]) {
  if (Platform.OS === 'web' || changes.length === 0) return;
  try {
    await quitarAvisos();
    if (!(await Notifications.getPermissionsAsync()).granted) return;
    const now = Date.now();
    const ids: string[] = [];
    for (const [i, c] of changes.entries()) {
      if (c.at <= now) continue;
      const id = `${PREFIX}${i}`;
      await Notifications.scheduleNotificationAsync({
        identifier: id,
        content: { title: 'KRAFT', body: TEXT[c.kind], sound: true },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(c.at) },
      });
      ids.push(id);
    }
    scheduled = ids;
  } catch {
    // Sin avisos el temporizador sigue igual; al volver a la app se pone al día.
  }
}

/** De vuelta en la app: fuera los que faltan y también los ya mostrados (no se quedan en la pantalla de bloqueo). */
export async function quitarAvisos() {
  if (Platform.OS === 'web' || scheduled.length === 0) return;
  const ids = scheduled;
  scheduled = [];
  await Promise.all(
    ids.flatMap((id) => [Notifications.cancelScheduledNotificationAsync(id).catch(() => {}), Notifications.dismissNotificationAsync(id).catch(() => {})]),
  );
}
