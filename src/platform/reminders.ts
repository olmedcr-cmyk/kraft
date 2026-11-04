/**
 * Recordatorio de clase (KR4Reminder): aviso local 1 h antes con «Mover» y «Llego».
 * Solo se programa si el usuario ya dio permiso de avisos (se pide en K8Permissions, R1).
 * En web no hay avisos.
 */
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { hhmm, type Slot } from '@/agenda/model';

const CATEGORY = 'clase';
const BEFORE_MS = 3600_000;
const native = Platform.OS !== 'web';

let ready = false;
export async function setupReminders() {
  if (!native || ready) return;
  ready = true;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
    });
    await Notifications.setNotificationCategoryAsync(CATEGORY, [
      { identifier: 'mover', buttonTitle: 'Mover', options: { opensAppToForeground: true } },
      { identifier: 'llego', buttonTitle: 'Llego', options: { opensAppToForeground: true } },
    ]);
  } catch {
    // Sin soporte de avisos en este entorno.
  }
}

export function reminderBody(slot: Slot) {
  const bring = slot.bring.filter((b) => !b.provided).slice(0, 2).map((b) => b.label.toLowerCase());
  const where = slot.room ? `Sala ${slot.room}` : 'En directo';
  return `${where}${bring.length ? ` · ${bring.join(' y ')}` : ''}`;
}

export async function scheduleClassReminder(slot: Slot) {
  if (!native) return;
  const at = slot.start - BEFORE_MS;
  if (at <= Date.now()) return;
  try {
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) return;
    await Notifications.scheduleNotificationAsync({
      identifier: slot.id,
      content: { title: `${slot.name} · ${hhmm(slot.start)}`, body: reminderBody(slot), categoryIdentifier: CATEGORY, data: { slotId: slot.id } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at) },
    });
  } catch {
    // Si no se puede programar, la reserva sigue siendo válida.
  }
}

export async function cancelClassReminder(slotId: string) {
  if (!native) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(slotId);
  } catch {
    // nada que cancelar
  }
}

/** Abrir la pantalla que toca según el botón del aviso. */
export function listenReminderResponses() {
  if (!native) return () => {};
  const sub = Notifications.addNotificationResponseReceivedListener((r) => {
    const id = r.notification.request.content.data?.slotId as string | undefined;
    if (!id) return;
    if (r.actionIdentifier === 'mover') router.push({ pathname: '/reserva/[id]/cambiar', params: { id } });
    else if (r.actionIdentifier === 'llego') router.push({ pathname: '/reserva/[id]/llego', params: { id } });
    else router.push({ pathname: '/reserva/[id]', params: { id } });
  });
  return () => sub.remove();
}
