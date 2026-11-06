/**
 * Sesión cambiada (KC2): qué cambió el entrenador desde la última versión que viste. Lógica pura.
 * Se compara bloque a bloque (por id): minutos y número de marcas (series, tramos, rondas).
 */
import type { Block, Session } from './types';

export interface BlockChange {
  oldMinutes: number;
  oldCount: number;
  newCount: number;
  added?: boolean;
}

export interface SessionChanges {
  oldMinutes: number;
  /** Por id de bloque (los que siguen o son nuevos). */
  blocks: Record<string, BlockChange>;
  /** Nombres de los que quitó. */
  removed: string[];
}

/** Marcas de un bloque: Tabata = tabatas; escalera y tramos = series. */
export const marksOf = (b: Block) => (b.kind === 'tabata' ? b.sets : b.steps.length);

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function diffSessions(seen: Session, now: Session): SessionChanges | null {
  if (same(seen.blocks, now.blocks) && seen.minutes === now.minutes) return null;
  const before = new Map(seen.blocks.map((b) => [b.id, b]));
  const blocks: Record<string, BlockChange> = {};
  for (const b of now.blocks) {
    const old = before.get(b.id);
    if (!old) blocks[b.id] = { oldMinutes: 0, oldCount: 0, newCount: marksOf(b), added: true };
    else if (!same(old, b)) blocks[b.id] = { oldMinutes: old.minutes, oldCount: marksOf(old), newCount: marksOf(b) };
  }
  const ids = new Set(now.blocks.map((b) => b.id));
  const removed = seen.blocks.filter((b) => !ids.has(b.id)).map((b) => b.name);
  if (!Object.keys(blocks).length && !removed.length && seen.minutes === now.minutes) return null;
  return { oldMinutes: seen.minutes, blocks, removed };
}

/** «Elena cambió Tabata», «Elena cambió 2 bloques», «Elena quitó Bici». */
export function changeText(c: SessionChanges, now: Session, coach: string): string {
  const changed = now.blocks.filter((b) => c.blocks[b.id]);
  const n = changed.length + c.removed.length;
  if (n === 0) return `${coach} cambió la duración`;
  if (n > 1) return `${coach} cambió ${n} bloques`;
  if (c.removed.length) return `${coach} quitó ${c.removed[0]}`;
  const b = changed[0];
  return c.blocks[b.id].added ? `${coach} añadió ${b.name}` : `${coach} cambió ${b.name}`;
}
