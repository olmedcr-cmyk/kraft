/**
 * Sesión a medias (KC3). Mientras entrenas, la marcha se guarda en el móvil (al cambiar de tramo,
 * al pausar y cada 5 s). Si la app se cierra, al volver se ofrece seguir, empezar de cero o terminar ahí.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { session, sessionRunner, useSessionForResume } from './store';

const KEY = 'kraft.marcha.v1';
const EVERY_MS = 5_000;

import { recordFinish, recoverFinish } from './cierre';
import { decode, encode, type Unfinished } from './marchaFormato';

export type { Unfinished };

let unfinished: Unfinished | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
export const useUnfinished = () =>
  useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => {
        subs.delete(f);
      };
    },
    () => unfinished,
    () => unfinished,
  );
export const getUnfinished = () => unfinished;

let lastKey = '';
let lastAt = 0;
let watching = false;

function watch() {
  if (watching) return;
  watching = true;
  sessionRunner.subscribe(() => {
    const st = sessionRunner.getState();
    // Acabada (o parada): el entreno se apunta ya, antes de que el atleta toque nada en Hecho.
    if (st.status === 'done') recordFinish();
    if (st.status !== 'running') {
      if (lastKey) {
        lastKey = '';
        AsyncStorage.removeItem(KEY).catch(() => {});
      }
      return;
    }
    const now = Date.now();
    const key = `${st.index}|${st.pausedAt !== null}|${st.plan.length}`;
    if (key === lastKey && now - lastAt < EVERY_MS) return;
    lastKey = key;
    lastAt = now;
    AsyncStorage.setItem(KEY, encode({ v: 1, savedAt: now, startedAt: sessionRunner.startedAt, session, state: st })).catch(() => {});
  });
}

/** Al arrancar: ¿quedó algo a medias de otra vez? Luego empieza a guardar la marcha. */
export async function loadUnfinished() {
  // Un entreno acabado que no llegó a enviarse (la app se cerró en Hecho).
  await recoverFinish();
  if (sessionRunner.getState().status === 'select') {
    unfinished = decode(await AsyncStorage.getItem(KEY).catch(() => null));
    emit();
  }
  watch();
}

function clear() {
  unfinished = null;
  lastKey = '';
  AsyncStorage.removeItem(KEY).catch(() => {});
  emit();
}

/** Seguir: la misma sesión, donde estaba; al tocar, 3·2·1. */
export function resumeUnfinished() {
  const u = unfinished;
  if (!u) return;
  useSessionForResume(u.session);
  sessionRunner.restore(u.state, u.savedAt, u.startedAt);
  unfinished = null;
  emit();
}

/** Terminar aquí: guarda lo hecho hasta entonces (va a Hecho). */
export function finishUnfinished() {
  resumeUnfinished();
  sessionRunner.end();
}

/** Desde cero: se olvida lo de antes. */
export const discardUnfinished = clear;
