/**
 * Agenda y reservas (R4). Lógica pura: los datos de clases son de ejemplo hasta tener backend.
 * Las fechas son locales; `now` siempre llega de fuera para poder probarlo.
 */

export type Mode = 'grupo' | 'solo' | 'online';

export interface Slot {
  id: string;
  mode: Mode;
  /** Inicio (ms). */
  start: number;
  name: string;
  minutes: number;
  room?: number;
  floor?: number;
  directions?: string;
  /** 0 = sin límite (online). */
  cap: number;
  /** Plazas ocupadas por otros. */
  taken: number;
  /** Gente ya en espera (si está llena). */
  queue: number;
  bring: { label: string; provided?: boolean }[];
}

export interface Booking {
  slotId: string;
  status: 'confirmed' | 'waitlist';
  /** Puesto en la lista de espera (1 = el siguiente). */
  position?: number;
  /** Entrar sin preguntar si se libera plaza. */
  autoJoin?: boolean;
  arrived?: boolean;
  bookedAt: number;
}

export interface AgendaState {
  bookings: Record<string, Booking>;
}

/** Cancelar gratis hasta 2 h antes; después cuenta como clase. */
export const FREE_CANCEL_H = 2;
const H = 3600_000;
const DAY = 24 * H;

export const MODES: Record<Mode, { label: string; sub: string }> = {
  grupo: { label: 'Grupo', sub: 'Sala · hasta 12' },
  solo: { label: 'Solo', sub: 'Con tu coach' },
  online: { label: 'Online', sub: 'En directo' },
};

const BRING = [{ label: 'Toalla' }, { label: 'Agua' }, { label: 'Zapatillas' }, { label: 'Esterilla', provided: true }];

const TEMPLATE: Record<Mode, { t: string; name: string; minutes: number; room?: number; cap: number; taken: number }[]> = {
  grupo: [
    { t: '07:00', name: 'Fuerza', minutes: 50, room: 1, cap: 12, taken: 7 },
    { t: '09:30', name: 'Funcional', minutes: 50, room: 2, cap: 12, taken: 10 },
    { t: '18:00', name: 'Movilidad', minutes: 50, room: 4, cap: 12, taken: 4 },
    { t: '19:00', name: 'Funcional', minutes: 50, room: 2, cap: 12, taken: 12 },
  ],
  solo: [
    { t: '08:00', name: 'Personal', minutes: 50, room: 3, cap: 1, taken: 0 },
    { t: '12:00', name: 'Personal', minutes: 50, room: 3, cap: 1, taken: 1 },
    { t: '19:00', name: 'Personal', minutes: 50, room: 1, cap: 1, taken: 0 },
  ],
  online: [
    { t: '07:30', name: 'Tabata en directo', minutes: 20, cap: 0, taken: 18 },
    { t: '13:00', name: 'Movilidad', minutes: 30, cap: 0, taken: 9 },
    { t: '20:00', name: 'Core', minutes: 20, cap: 0, taken: 24 },
  ],
};

// ─── Fechas ────────────────────────────────────────────────────────────────

export const dayStart = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
/** Lunes de la semana de `t`. */
export const weekStart = (t: number) => {
  const d = new Date(dayStart(t));
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
};
export const addDays = (t: number, n: number) => {
  const d = new Date(t);
  d.setDate(d.getDate() + n);
  return d.getTime();
};
export const isoDay = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const hhmm = (t: number) => {
  const d = new Date(t);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
const WEEKDAY = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const WEEKDAY_SHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MONTH = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const weekday = (t: number) => WEEKDAY[new Date(t).getDay()];
export const weekdayShort = (t: number) => WEEKDAY_SHORT[new Date(t).getDay()];
/** «Jueves 5 nov» */
export const longDay = (t: number) => {
  const d = new Date(t);
  const w = WEEKDAY[d.getDay()];
  return `${w[0].toUpperCase()}${w.slice(1)} ${d.getDate()} ${MONTH[d.getMonth()]}`;
};
/** «martes 4» */
export const shortDay = (t: number) => `${weekday(t)} ${new Date(t).getDate()}`;
/** El domingo cierra. */
export const isClosed = (t: number) => new Date(t).getDay() === 0;

// ─── Clases ────────────────────────────────────────────────────────────────

/** Variación estable por día para que la ocupación no sea idéntica todos los días. */
const wobble = (day: number, i: number) => ((Math.floor(day / DAY) * 7 + i * 3) % 3) - 1;

export function slotsFor(day: number, mode: Mode): Slot[] {
  const d0 = dayStart(day);
  if (isClosed(d0)) return [];
  return TEMPLATE[mode].map((s, i) => {
    const [hh, mm] = s.t.split(':').map(Number);
    const start = new Date(d0);
    start.setHours(hh, mm, 0, 0);
    const taken = s.cap === 0 ? s.taken + wobble(d0, i) * 3 : Math.max(0, Math.min(s.cap, s.taken + (s.cap > 1 && s.taken < s.cap ? wobble(d0, i) : 0)));
    return {
      id: `${mode}-${isoDay(d0)}-${i}`,
      mode,
      start: start.getTime(),
      name: s.name,
      minutes: s.minutes,
      room: s.room,
      floor: s.room ? 1 : undefined,
      directions: s.room ? 'Entrada, 2ª puerta a la derecha' : undefined,
      cap: s.cap,
      taken,
      queue: s.cap > 0 && taken >= s.cap ? 1 : 0,
      bring: s.room ? BRING : [{ label: 'Agua' }, { label: 'Esterilla' }],
    };
  });
}

export function getSlot(id: string): Slot | undefined {
  const m = id.match(/^(grupo|solo|online)-(\d{4})-(\d{2})-(\d{2})-(\d+)$/);
  if (!m) return undefined;
  const day = new Date(Number(m[2]), Number(m[3]) - 1, Number(m[4])).getTime();
  return slotsFor(day, m[1] as Mode)[Number(m[5])];
}

export const isFull = (s: Slot) => s.cap > 0 && s.taken >= s.cap;
export const cancelDeadline = (s: Slot) => s.start - FREE_CANCEL_H * H;
export const isLate = (s: Slot, now: number) => now > cancelDeadline(s);
export const isPast = (s: Slot, now: number) => s.start <= now;

// ─── Reservas ──────────────────────────────────────────────────────────────

export type Result = { ok: true; state: AgendaState } | { ok: false; reason: 'past' | 'full' | 'none' | 'already' };

export function book(state: AgendaState, slot: Slot, now: number): Result {
  if (isPast(slot, now)) return { ok: false, reason: 'past' };
  if (state.bookings[slot.id]?.status === 'confirmed') return { ok: false, reason: 'already' };
  if (isFull(slot)) return { ok: false, reason: 'full' };
  return { ok: true, state: { bookings: { ...state.bookings, [slot.id]: { slotId: slot.id, status: 'confirmed', bookedAt: now } } } };
}

export function joinWaitlist(state: AgendaState, slot: Slot, now: number, autoJoin = true): Result {
  if (isPast(slot, now)) return { ok: false, reason: 'past' };
  if (!isFull(slot)) return book(state, slot, now);
  if (state.bookings[slot.id]) return { ok: false, reason: 'already' };
  return {
    ok: true,
    state: { bookings: { ...state.bookings, [slot.id]: { slotId: slot.id, status: 'waitlist', position: slot.queue + 1, autoJoin, bookedAt: now } } },
  };
}

/** Cancela. `late`: fuera de plazo, cuenta como clase. */
export function cancel(state: AgendaState, slot: Slot, now: number): Result & { late?: boolean } {
  const b = state.bookings[slot.id];
  if (!b) return { ok: false, reason: 'none' };
  const { [slot.id]: _, ...rest } = state.bookings;
  return { ok: true, state: { bookings: rest }, late: b.status === 'confirmed' && isLate(slot, now) };
}

export function move(state: AgendaState, from: Slot, to: Slot, now: number): Result {
  if (!state.bookings[from.id]) return { ok: false, reason: 'none' };
  const booked = book({ bookings: state.bookings }, to, now);
  if (!booked.ok) return booked;
  const { [from.id]: _, ...rest } = booked.state.bookings;
  return { ok: true, state: { bookings: rest } };
}

export function arrive(state: AgendaState, slot: Slot): Result {
  const b = state.bookings[slot.id];
  if (!b || b.status !== 'confirmed') return { ok: false, reason: 'none' };
  return { ok: true, state: { bookings: { ...state.bookings, [slot.id]: { ...b, arrived: !b.arrived } } } };
}

/** Plazas ocupadas contando la mía. */
export const takenWithMe = (s: Slot, state: AgendaState) => s.taken + (state.bookings[s.id]?.status === 'confirmed' ? 1 : 0);

/** A dónde mover: las 3 siguientes de la misma modalidad con sitio. */
export function moveOptions(slot: Slot, now: number, n = 3): Slot[] {
  const out: Slot[] = [];
  for (let d = 0; d < 14 && out.length < n; d++) {
    for (const s of slotsFor(addDays(dayStart(Math.max(now, slot.start)), d), slot.mode)) {
      if (s.id !== slot.id && s.start > now && s.start > slot.start - 0 && !isFull(s) && out.length < n) out.push(s);
    }
  }
  return out;
}

/** Próximas reservas confirmadas o en espera, por fecha. */
export function upcomingBookings(state: AgendaState, now: number): { booking: Booking; slot: Slot }[] {
  return Object.values(state.bookings)
    .map((booking) => ({ booking, slot: getSlot(booking.slotId)! }))
    .filter((x) => x.slot && x.slot.start + x.slot.minutes * 60_000 > now)
    .sort((a, b) => a.slot.start - b.slot.start);
}

/** «en 2 días», «hoy», «mañana». */
export function relativeDay(t: number, now: number) {
  const d = Math.round((dayStart(t) - dayStart(now)) / DAY);
  if (d <= 0) return 'hoy';
  if (d === 1) return 'mañana';
  return `en ${d} días`;
}
