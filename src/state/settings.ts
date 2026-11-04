/** Ajustes del atleta, guardados en el dispositivo (funciona sin red). */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { DEFAULT_SETTINGS, restore, type Settings } from '@/alta/model';

const KEY = 'kraft.settings.v1';

let state: Settings = DEFAULT_SETTINGS;
let hydrated = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

/** Lee lo guardado una vez, al arrancar. Si falla, se sigue con los valores por defecto. */
export async function hydrateSettings() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    state = restore(raw ? JSON.parse(raw) : null);
  } catch {
    state = DEFAULT_SETTINGS;
  }
  hydrated = true;
  emit();
}

export function updateSettings(patch: Partial<Settings>) {
  state = { ...state, ...patch };
  emit();
  AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
}

export const getSettings = () => state;
export const isHydrated = () => hydrated;

const subscribe = (f: () => void) => {
  subs.add(f);
  return () => {
    subs.delete(f);
  };
};

/** Para módulos fuera de React (la sesión recompila su plan). */
export const subscribeSettings = subscribe;

export const useSettings = () => useSyncExternalStore(subscribe, () => state, () => state);
export const useHydrated = () => useSyncExternalStore(subscribe, () => hydrated, () => hydrated);
