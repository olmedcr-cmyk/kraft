import { SAMPLE_SESSION } from '@/data/sampleSession';
import { validateSession } from '../validate';

const row = (body: unknown = { blocks: SAMPLE_SESSION.blocks }, extra: Record<string, unknown> = {}) => ({
  id: 'abc',
  day: '2026-11-06',
  minutes: 50,
  schema_version: 1,
  body,
  ...extra,
});
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

describe('validateSession', () => {
  it('acepta la sesión de ejemplo y pone el entrenador', () => {
    const r = validateSession(row(), { name: 'elena' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.session.blocks).toHaveLength(SAMPLE_SESSION.blocks.length);
      expect(r.session.coach).toEqual({ name: 'elena', initial: 'E' });
      expect(r.session.date).toBe('2026-11-06');
    }
  });

  it('rechaza un formato futuro', () => {
    expect(validateSession(row(undefined, { schema_version: 2 }), { name: 'E' })).toEqual({ ok: false, error: 'formato 2 no soportado' });
  });

  it('rechaza bloques rotos con un mensaje que dice dónde', () => {
    const blocks = clone(SAMPLE_SESSION.blocks) as any[];
    blocks[1].rounds = 0;
    const r = validateSession(row({ blocks }), { name: 'E' });
    expect(r).toEqual({ ok: false, error: 'bloque 2: rondas o series no válidas' });
  });

  it('rechaza tipo desconocido, color raro, ids repetidos y sin bloques', () => {
    const b = clone(SAMPLE_SESSION.blocks) as any[];
    expect(validateSession(row({ blocks: [{ ...b[0], kind: 'yoga' }] }), { name: 'E' }).ok).toBe(false);
    expect(validateSession(row({ blocks: [{ ...b[0], tint: 'rosa' }] }), { name: 'E' }).ok).toBe(false);
    expect(validateSession(row({ blocks: [b[0], b[0]] }), { name: 'E' })).toEqual({ ok: false, error: 'bloques con el mismo id' });
    expect(validateSession(row({ blocks: [] }), { name: 'E' }).ok).toBe(false);
    expect(validateSession(null, { name: 'E' }).ok).toBe(false);
  });

  it('peso de escalera: número o nulo (barra)', () => {
    const b = clone(SAMPLE_SESSION.blocks) as any[];
    b[2].steps[0].weight = 'mucho';
    expect(validateSession(row({ blocks: b }), { name: 'E' })).toEqual({ ok: false, error: 'bloque 3, serie 1: peso no válido' });
  });
});
