/** Entrenador en el servidor: buscar (`find_coach`) y vincular (`link_coach`). Entre las dos, 10 intentos por hora. */
import type { Coach } from '@/alta/model';
import { backend } from './client';

type Mode = Coach['modes'][number];
export type LinkResult = { ok: true; coach: Coach } | { ok: false; reason: 'wrong' | 'limit' | 'offline' };

/** Convierte lo que devuelve `link_coach` en la ficha que usa la app. */
export function toCoach(code: string, row: { name?: unknown; modes?: unknown } | undefined): Coach | undefined {
  if (!row || typeof row.name !== 'string' || !row.name.trim()) return undefined;
  const modes = (Array.isArray(row.modes) ? row.modes : []).filter((m): m is Mode => m === 'grupo' || m === 'solo' || m === 'online');
  return { code, name: row.name, initial: row.name.trim()[0].toUpperCase(), modes };
}

/** Buscar por código: quién es, sin vincular (`find_coach`). Cuenta como intento. */
export const findCoach = (code: string) => call('find_coach', code);

/** Vincular de verdad (solo al tocar «Vincular»): el entrenador anterior deja de ver tus datos. */
export const linkCoach = (code: string) => call('link_coach', code);

/** Tu entrenador según el servidor (al volver a entrar). `null`: ninguno; `undefined`: no se pudo saber. */
export async function myCoach(): Promise<Coach | null | undefined> {
  if (!backend) return undefined;
  try {
    const { data, error } = await backend.from('my_coach').select('code, name, modes').maybeSingle();
    if (error) return undefined;
    return data ? (toCoach(String(data.code), data) ?? null) : null;
  } catch {
    return undefined;
  }
}

async function call(fn: 'find_coach' | 'link_coach', code: string): Promise<LinkResult> {
  if (!backend) return { ok: false, reason: 'offline' };
  try {
    const { data, error } = await backend.rpc(fn, { p_code: code });
    if (error) return { ok: false, reason: /intentos/.test(error.message) ? 'limit' : 'offline' };
    const coach = toCoach(code, Array.isArray(data) ? data[0] : undefined);
    return coach ? { ok: true, coach } : { ok: false, reason: 'wrong' };
  } catch {
    return { ok: false, reason: 'offline' };
  }
}
