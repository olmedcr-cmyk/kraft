/** Vincular con el entrenador en el servidor (función `link_coach`: máximo 10 intentos por hora). */
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

export async function linkCoach(code: string): Promise<LinkResult> {
  if (!backend) return { ok: false, reason: 'offline' };
  try {
    const { data, error } = await backend.rpc('link_coach', { p_code: code });
    if (error) return { ok: false, reason: /intentos/.test(error.message) ? 'limit' : 'offline' };
    const coach = toCoach(code, Array.isArray(data) ? data[0] : undefined);
    return coach ? { ok: true, coach } : { ok: false, reason: 'wrong' };
  } catch {
    return { ok: false, reason: 'offline' };
  }
}
