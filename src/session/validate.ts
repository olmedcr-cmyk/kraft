/**
 * Comprueba la sesión que llega del servidor (formato v1, `types.ts`) antes de enseñarla.
 * Si no pasa, Hoy enseña el estado vacío en vez de romperse a mitad de entreno.
 */
import type { Block, BlockTint, Session } from './types';

const TINTS: BlockTint[] = ['klein', 'naranja', 'tinteNaranja', 'verde'];
export const SCHEMA_VERSION = 1;

type Result = { ok: true; session: Session } | { ok: false; error: string };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown, max = 200): v is string => typeof v === 'string' && v.length > 0 && v.length <= max;
const isInt = (v: unknown, min: number, max: number): v is number => Number.isInteger(v) && (v as number) >= min && (v as number) <= max;
const optStr = (v: unknown) => v === undefined || isStr(v);
const optBool = (v: unknown) => v === undefined || typeof v === 'boolean';

class Bad extends Error {}
const need = (cond: boolean, msg: string) => {
  if (!cond) throw new Bad(msg);
};

function exercise(v: unknown, at: string) {
  need(isObj(v), `${at}: falta el ejercicio`);
  const e = v as Record<string, unknown>;
  need(isStr(e.label, 80), `${at}: falta el nombre`);
  need(optStr(e.exercise) && optBool(e.hold), `${at}: campos no válidos`);
  need(e.weight === undefined || (typeof e.weight === 'number' && e.weight >= 0 && e.weight <= 500), `${at}: peso no válido`);
}

function block(v: unknown, i: number): Block {
  const at = `bloque ${i + 1}`;
  need(isObj(v), `${at}: no es un bloque`);
  const b = v as Record<string, unknown>;
  need(isStr(b.id, 64) && isStr(b.name, 40), `${at}: falta id o nombre`);
  need(TINTS.includes(b.tint as BlockTint), `${at}: color no válido`);
  need(isInt(b.minutes, 1, 300), `${at}: minutos no válidos`);
  need(optBool(b.isNew), `${at}: isNew no válido`);

  switch (b.kind) {
    case 'interval': {
      need(Array.isArray(b.steps) && b.steps.length > 0 && b.steps.length <= 100, `${at}: sin tramos`);
      (b.steps as unknown[]).forEach((s, j) => {
        const where = `${at}, tramo ${j + 1}`;
        need(isObj(s), `${where}: no válido`);
        const t = s as Record<string, unknown>;
        need(isStr(t.label, 80), `${where}: falta el nombre`);
        need(isInt(t.seconds, 1, 7200), `${where}: segundos no válidos`);
        need(isInt(t.rest, 0, 3600), `${where}: descanso no válido`);
        need(optStr(t.exercise) && optBool(t.hold), `${where}: campos no válidos`);
      });
      break;
    }
    case 'tabata': {
      need(isInt(b.work, 5, 600) && isInt(b.rest, 0, 600), `${at}: trabajo o descanso no válidos`);
      need(isInt(b.rounds, 1, 50) && isInt(b.sets, 1, 20) && isInt(b.setRest, 0, 1800), `${at}: rondas o series no válidas`);
      exercise(b.a, `${at}, ejercicio A`);
      if (b.b !== undefined) exercise(b.b, `${at}, ejercicio B`);
      break;
    }
    case 'ladder': {
      need(isObj(b.exercise) && isStr((b.exercise as Record<string, unknown>).label, 80), `${at}: falta el ejercicio`);
      need(Array.isArray(b.steps) && b.steps.length > 0 && b.steps.length <= 30, `${at}: sin series`);
      (b.steps as unknown[]).forEach((s, j) => {
        const t = s as Record<string, unknown>;
        need(isObj(s) && isInt(t.reps, 1, 500), `${at}, serie ${j + 1}: repeticiones no válidas`);
        need(t.weight === null || (typeof t.weight === 'number' && t.weight >= 0 && t.weight <= 500), `${at}, serie ${j + 1}: peso no válido`);
      });
      need(Array.isArray(b.after) && (b.after as unknown[]).every((a) => isObj(a) && isStr(a.label, 80) && optStr(a.detail)), `${at}: accesorios no válidos`);
      break;
    }
    default:
      throw new Bad(`${at}: tipo desconocido`);
  }
  return v as unknown as Block;
}

/**
 * `row` es la fila de `sessions` (id, day, minutes, schema_version, body) y el nombre del entrenador.
 * El JSON se copia campo a campo: lo que sobra no entra en la app.
 */
export function validateSession(row: unknown, coach: { name: string }): Result {
  try {
    need(isObj(row), 'no hay sesión');
    const r = row as Record<string, unknown>;
    need(r.schema_version === undefined || r.schema_version === SCHEMA_VERSION, `formato ${String(r.schema_version)} no soportado`);
    need(isStr(r.id, 64), 'falta el id');
    need(typeof r.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.day), 'fecha no válida');
    need(isInt(r.minutes, 1, 600), 'minutos no válidos');
    need(isObj(r.body) && Array.isArray((r.body as Record<string, unknown>).blocks), 'sin bloques');
    const raw = (r.body as Record<string, unknown>).blocks as unknown[];
    need(raw.length > 0 && raw.length <= 20, 'sin bloques');
    const blocks = raw.map(block);
    need(new Set(blocks.map((b) => b.id)).size === blocks.length, 'bloques con el mismo id');
    const name = coach.name.trim() || 'Tu entrenador';
    return {
      ok: true,
      session: { id: r.id as string, date: r.day as string, minutes: r.minutes as number, coach: { name, initial: name[0].toUpperCase() }, blocks },
    };
  } catch (e) {
    if (e instanceof Bad) return { ok: false, error: e.message };
    throw e;
  }
}
