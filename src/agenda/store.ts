import { useSyncExternalStore } from 'react';

import { cancelClassReminder, scheduleClassReminder } from '@/platform/reminders';
import {
  addDays,
  arrive as arriveM,
  book as bookM,
  cancel as cancelM,
  dayStart,
  joinWaitlist as joinM,
  move as moveM,
  slotsFor,
  type AgendaState,
  type Slot,
} from './model';

/** Reservas del atleta. En memoria hasta tener backend; empieza con una de ejemplo (mañana, 09:30). */
function seed(): AgendaState {
  const tomorrow = addDays(dayStart(Date.now()), 1);
  const s = slotsFor(tomorrow, 'grupo')[1] ?? slotsFor(addDays(tomorrow, 1), 'grupo')[1];
  return s ? { bookings: { [s.id]: { slotId: s.id, status: 'confirmed', bookedAt: Date.now() - 2 * 86_400_000 } } } : { bookings: {} };
}

let state: AgendaState = seed();
const subs = new Set<() => void>();
const set = (s: AgendaState) => {
  state = s;
  subs.forEach((f) => f());
};

export function useAgenda() {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => {
        subs.delete(f);
      };
    },
    () => state,
    () => state,
  );
}

export const getAgenda = () => state;

export function book(slot: Slot) {
  const r = bookM(state, slot, Date.now());
  if (r.ok) {
    set(r.state);
    scheduleClassReminder(slot);
  }
  return r;
}

export function joinWaitlist(slot: Slot, autoJoin: boolean) {
  const r = joinM(state, slot, Date.now(), autoJoin);
  if (r.ok) set(r.state);
  return r;
}

export function setAutoJoin(slot: Slot, autoJoin: boolean) {
  const b = state.bookings[slot.id];
  if (b) set({ bookings: { ...state.bookings, [slot.id]: { ...b, autoJoin } } });
}

export function cancel(slot: Slot) {
  const r = cancelM(state, slot, Date.now());
  if (r.ok) {
    set(r.state);
    cancelClassReminder(slot.id);
  }
  return r;
}

export function move(from: Slot, to: Slot) {
  const r = moveM(state, from, to, Date.now());
  if (r.ok) {
    set(r.state);
    cancelClassReminder(from.id);
    scheduleClassReminder(to);
  }
  return r;
}

export function arrive(slot: Slot) {
  const r = arriveM(state, slot);
  if (r.ok) set(r.state);
  return r;
}
