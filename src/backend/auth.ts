/** Cuenta: entrar con código por email, saber quién eres y salir. Sin servidor, no hace nada. */
import type { Session } from '@supabase/supabase-js';
import { useSyncExternalStore } from 'react';

import { backend } from './client';
import { authErrorText, normalizeEmail } from './email';

let session: Session | null = null;
let ready = !backend;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

if (backend) {
  backend.auth.getSession().then(({ data }) => {
    session = data.session;
    ready = true;
    emit();
  });
  backend.auth.onAuthStateChange((_event, s) => {
    session = s;
    ready = true;
    emit();
  });
}

const subscribe = (f: () => void) => {
  subs.add(f);
  return () => {
    subs.delete(f);
  };
};

export const getAuthSession = () => session;
export const userId = () => session?.user.id ?? null;
export const useAuthSession = () => useSyncExternalStore(subscribe, () => session, () => session);
/** Ya se sabe si hay sesión guardada (para no enseñar el alta un instante a quien ya entró). */
export const useAuthReady = () => useSyncExternalStore(subscribe, () => ready, () => ready);

type Outcome = { ok: true } | { ok: false; error: string };

/** Manda un código de 6 cifras al email. Crea la cuenta si no existe. */
export async function sendEmailCode(email: string): Promise<Outcome> {
  if (!backend) return { ok: false, error: 'Sin servidor' };
  const { error } = await backend.auth.signInWithOtp({ email: normalizeEmail(email), options: { shouldCreateUser: true } });
  return error ? { ok: false, error: authErrorText(error) } : { ok: true };
}

export async function verifyEmailCode(email: string, code: string): Promise<Outcome> {
  if (!backend) return { ok: false, error: 'Sin servidor' };
  const { error } = await backend.auth.verifyOtp({ email: normalizeEmail(email), token: code, type: 'email' });
  return error ? { ok: false, error: authErrorText(error) } : { ok: true };
}

export async function signOut() {
  await backend?.auth.signOut().catch(() => {});
}
