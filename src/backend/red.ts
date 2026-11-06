/**
 * ¿Hay conexión? Sin módulo nativo: se deduce de si las llamadas al servidor fallan por red,
 * y en web también del aviso del navegador (online / offline).
 */
import { Platform } from 'react-native';
import { useSyncExternalStore } from 'react';

let online = true;
const subs = new Set<() => void>();

const back = new Set<() => void>();
/** Al volver la conexión (para reenviar y releer). */
export const onOnline = (f: () => void) => {
  back.add(f);
  return () => back.delete(f);
};

export function setOnline(v: boolean) {
  if (v === online) return;
  online = v;
  subs.forEach((f) => f());
  if (v) back.forEach((f) => f());
}

/** Un error que es de red (no del servidor diciendo que no). */
export const isNetworkError = (e: unknown) => {
  const m = `${(e as { message?: string })?.message ?? e}`.toLowerCase();
  return m.includes('fetch') || m.includes('network') || m.includes('timeout') || m.includes('offline');
};

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  online = typeof navigator === 'undefined' ? true : navigator.onLine !== false;
  window.addEventListener('online', () => setOnline(true));
  window.addEventListener('offline', () => setOnline(false));
}

export const isOnline = () => online;
export const useOnline = () =>
  useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => {
        subs.delete(f);
      };
    },
    () => online,
    () => online,
  );
