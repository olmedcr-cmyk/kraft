import { useSyncExternalStore } from 'react';

/** «Mis tiempos». De momento en memoria; el almacenamiento local llega con el diario. */
export type SavedTimer = { id: string; kind: 'series' | 'tabata'; work: number; rest: number; rounds: number };

let items: SavedTimer[] = [
  { id: 't-30-15', kind: 'tabata', work: 30, rest: 15, rounds: 8 },
  { id: 's-45-4', kind: 'series', work: 45, rest: 0, rounds: 4 },
  { id: 't-20-10', kind: 'tabata', work: 20, rest: 10, rounds: 8 },
  { id: 's-60-10', kind: 'series', work: 60, rest: 0, rounds: 10 },
];
let current: SavedTimer = { id: 'actual', kind: 'series', work: 60, rest: 0, rounds: 4 };
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
const subscribe = (f: () => void) => {
  subs.add(f);
  return () => {
    subs.delete(f);
  };
};

export function useSaved() {
  return useSyncExternalStore(subscribe, () => items, () => items);
}

/** La última configuración tocada en Series o Tabata («Guardar el actual»). */
export function setCurrent(t: Omit<SavedTimer, 'id'>) {
  current = { ...t, id: 'actual' };
}

export function saveCurrent() {
  const id = `${current.kind[0]}-${current.work}-${current.rest}-${current.rounds}`;
  if (items.some((i) => i.id === id)) return;
  items = [...items, { ...current, id }];
  emit();
}

export function describe(t: SavedTimer) {
  if (t.kind === 'tabata') return `${t.work}/${t.rest} × ${t.rounds}`;
  const w = t.work % 60 === 0 ? `${t.work / 60}'` : `${t.work}"`;
  return `${w} × ${t.rounds}`;
}
