/**
 * La última versión de la sesión de hoy que viste (KC2). Si el entrenador la cambia, Hoy lo avisa
 * hasta que tocas «Vale».
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { diffSessions, type SessionChanges } from './cambios';
import type { Session } from './types';

const KEY = 'kraft.vista.v1';
let seen: Session | null | undefined;
let current: Session | null = null;
let changes: SessionChanges | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

async function loadSeen() {
  if (seen !== undefined) return seen;
  try {
    seen = JSON.parse((await AsyncStorage.getItem(KEY)) ?? 'null') as Session | null;
  } catch {
    seen = null;
  }
  return seen;
}

const save = (s: Session) => {
  seen = s;
  AsyncStorage.setItem(KEY, JSON.stringify(s)).catch(() => {});
};

/** Llega la sesión de hoy: la primera vez de ese día se apunta; después, se compara. */
export async function noteSession(s: Session) {
  current = s;
  const prev = await loadSeen();
  if (!prev || prev.date !== s.date) {
    save(s);
    changes = null;
  } else {
    changes = diffSessions(prev, s);
  }
  emit();
}

/** «Vale»: lo nuevo pasa a ser lo visto. */
export function acknowledgeChanges() {
  if (current) save(current);
  changes = null;
  emit();
}

export const useChanges = () =>
  useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => {
        subs.delete(f);
      };
    },
    () => changes,
    () => changes,
  );
