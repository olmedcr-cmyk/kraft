/** «Añadir a mi calendario»: hoja del sistema en móvil; archivo .ics en web. */
import { getDefaultCalendarSync, requestCalendarPermissions } from 'expo-calendar';
import { Platform } from 'react-native';

export interface CalendarEvent {
  title: string;
  start: number;
  minutes: number;
  location?: string;
  notes?: string;
}

const icsDate = (t: number) => new Date(t).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const esc = (s: string) => s.replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, '\\n');

export function toIcs(e: CalendarEvent) {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//KRAFT//ES',
    'BEGIN:VEVENT',
    `UID:${e.start}-${esc(e.title)}@kraft`,
    `DTSTAMP:${icsDate(Date.now())}`,
    `DTSTART:${icsDate(e.start)}`,
    `DTEND:${icsDate(e.start + e.minutes * 60_000)}`,
    `SUMMARY:${esc(e.title)}`,
    e.location ? `LOCATION:${esc(e.location)}` : '',
    e.notes ? `DESCRIPTION:${esc(e.notes)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}

/** true si se añadió (o se descargó el archivo). */
export async function addToCalendar(e: CalendarEvent): Promise<boolean> {
  if (Platform.OS === 'web') {
    const blob = new Blob([toIcs(e)], { type: 'text/calendar' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${e.title}.ics`;
    a.click();
    URL.revokeObjectURL(a.href);
    return true;
  }
  try {
    const perm = await requestCalendarPermissions(true);
    if (!perm.granted) return false;
    const res = await getDefaultCalendarSync().addEventWithForm({
      title: e.title,
      startDate: new Date(e.start),
      endDate: new Date(e.start + e.minutes * 60_000),
      location: e.location,
      notes: e.notes,
    });
    return res.action !== 'canceled';
  } catch {
    return false;
  }
}
