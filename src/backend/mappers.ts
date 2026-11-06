/**
 * De filas del servidor a los objetos que ya usan las pantallas (agenda y diario). Lógica pura.
 * Así las pantallas no saben si los datos vienen de Supabase o del modo demo.
 */
import { isoDay, type AgendaState, type Booking, type Mode, type Slot } from '@/agenda/model';
import type { DayLog, DiaryState, Method, Payment } from '@/diario/model';

export interface SlotRow {
  id: string;
  mode: Mode;
  starts_at: string;
  minutes: number;
  name: string;
  room: number | null;
  floor: number | null;
  directions: string | null;
  capacity: number;
  bring: { label: string; provided?: boolean }[] | null;
}

export interface AvailabilityRow {
  slot_id: string;
  taken: number;
  queue: number;
}

export interface BookingRow {
  id: string;
  slot_id: string;
  status: 'confirmed' | 'waitlist' | 'cancelled' | 'late_cancel';
  position: number | null;
  auto_join: boolean;
  arrived_at: string | null;
  booked_at: string;
  /** Embebida con `select('*, slots(mode, starts_at, minutes)')`. */
  slots?: { mode: Mode; starts_at: string; minutes: number } | null;
}

export interface WorkoutRow {
  day: string;
  minutes: number;
  tabatas: number;
}

export interface PaymentRow {
  month: string;
  amount_cents: number;
  method: Method;
  paid_at: string;
  receipt_sent_at: string | null;
}

const active = (b: BookingRow) => b.status === 'confirmed' || b.status === 'waitlist';

/** Clase del servidor → Slot. `taken` y `queue` son de los demás: la mía se cuenta aparte (takenWithMe). */
export function toSlot(row: SlotRow, avail: AvailabilityRow | undefined, mine: BookingRow | undefined): Slot {
  const meIn = mine && active(mine) && mine.status === 'confirmed' ? 1 : 0;
  const meWaiting = mine && mine.status === 'waitlist' ? 1 : 0;
  return {
    id: row.id,
    mode: row.mode,
    start: Date.parse(row.starts_at),
    name: row.name,
    minutes: row.minutes,
    room: row.room ?? undefined,
    floor: row.floor ?? undefined,
    directions: row.directions ?? undefined,
    cap: row.capacity,
    taken: Math.max(0, (avail?.taken ?? 0) - meIn),
    queue: Math.max(0, (avail?.queue ?? 0) - meWaiting),
    bring: row.bring ?? [],
  };
}

export function toBooking(row: BookingRow): Booking | undefined {
  if (!active(row)) return undefined;
  return {
    slotId: row.slot_id,
    status: row.status as Booking['status'],
    position: row.position ?? undefined,
    autoJoin: row.auto_join,
    arrived: !!row.arrived_at,
    bookedAt: Date.parse(row.booked_at),
  };
}

export function toAgenda(rows: BookingRow[]): AgendaState {
  const bookings: AgendaState['bookings'] = {};
  for (const r of rows) {
    const b = toBooking(r);
    if (b) bookings[b.slotId] = b;
  }
  return { bookings };
}

/**
 * El diario sale de tres sitios: clases a las que llegaste (o cancelaste tarde, que se cobran),
 * entrenos hechos en la app (sumados por día) y pagos.
 */
export function toDiary(bookings: BookingRow[], workouts: WorkoutRow[], payments: PaymentRow[]): DiaryState {
  const days: Record<string, DayLog> = {};
  const at = (day: string) => (days[day] ??= { day });

  for (const b of bookings) {
    if (!b.slots) continue;
    const late = b.status === 'late_cancel';
    if (!late && !b.arrived_at) continue;
    const day = isoDay(Date.parse(b.slots.starts_at));
    at(day).class = late ? { mode: b.slots.mode, minutes: 0, late: true } : { mode: b.slots.mode, minutes: b.slots.minutes };
  }
  for (const w of workouts) {
    const d = at(w.day);
    d.own = { minutes: (d.own?.minutes ?? 0) + w.minutes, tabatas: (d.own?.tabatas ?? 0) + w.tabatas };
  }

  const pays: Record<string, Payment> = {};
  for (const p of payments) {
    pays[p.month] = { month: p.month, amount: p.amount_cents / 100, method: p.method, at: Date.parse(p.paid_at), receiptSent: !!p.receipt_sent_at || undefined };
  }
  return { days, payments: pays };
}
