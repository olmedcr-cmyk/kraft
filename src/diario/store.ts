import { useSyncExternalStore } from 'react';

import { hasBackend } from '@/backend/client';
import { queue } from '@/backend/sync';

import type { Mode } from '@/agenda/model';
import { logClass as logClassM, logOwn as logOwnM, pay as payM, sampleDiary, unlogClass as unlogClassM, type DiaryState, type Method } from './model';

/**
 * Diario del atleta. En modo demo empieza con un historial de ejemplo; con servidor, vacío,
 * y se rellena con lo que llega (replaceDiary).
 */
let state: DiaryState = hasBackend ? { days: {}, payments: {} } : sampleDiary(Date.now());
const subs = new Set<() => void>();
const set = (s: DiaryState) => {
  state = s;
  subs.forEach((f) => f());
};

export function useDiary() {
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

export const getDiary = () => state;
export const replaceDiary = (s: DiaryState) => set(s);

export const logClass = (at: number, mode: Mode, minutes: number, late = false) => set(logClassM(state, at, mode, minutes, late));
export const unlogClass = (at: number) => set(unlogClassM(state, at));
export const logOwn = (at: number, minutes: number, tabatas: number) => set(logOwnM(state, at, minutes, tabatas));

/** Pago simulado: sin pasarela todavía. El recibo «se envía» al marcarlo pagado. */
export function pay(month: string, method: Method) {
  const r = payM(state, month, method, Date.now());
  if (r.ok) {
    set(r.state);
    // Con servidor: el importe lo calcula él (simulate_payment, hasta tener pasarela).
    queue('pay', { month, method });
  }
  return r;
}

export function resendReceipt(month: string) {
  const p = state.payments[month];
  if (p) set({ ...state, payments: { ...state.payments, [month]: { ...p, receiptSent: true } } });
}
