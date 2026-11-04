import { SAMPLE_SESSION } from '@/data/sampleSession';
import { createTimer, primary, snapshot, start, tick } from '@/timer/engine';
import { compileSession, upcoming } from '../compile';

describe('compilar la sesión', () => {
  const c = compileSession(SAMPLE_SESSION);

  it('un inicio por bloque', () => {
    expect(c.blockStart).toHaveLength(SAMPLE_SESSION.blocks.length);
    expect(c.blockStart[0]).toBe(0);
  });

  it('calentar: 3·2·1 + trabajo por tramo, espera entre tramos y al acabar el bloque', () => {
    const calentar = c.plan.slice(0, c.blockStart[1]).map((p) => p.kind);
    expect(calentar).toEqual([
      'countdown', 'work', 'wait',
      'countdown', 'work', 'wait',
      'countdown', 'work', 'wait',
      'countdown', 'work',
      'wait',
    ]);
  });

  it('tabata: 6 × 8 rondas alternando A/B, un 3·2·1 por tabata', () => {
    const tab = c.plan.slice(c.blockStart[1], c.blockStart[2]);
    expect(tab.filter((p) => p.kind === 'work')).toHaveLength(48);
    expect(tab.filter((p) => p.kind === 'countdown')).toHaveLength(6);
    const sides = tab.filter((p) => p.kind === 'work').slice(0, 4).map((p) => c.steps[p.ref!].side);
    expect(sides).toEqual(['A', 'B', 'A', 'B']);
  });

  it('escalera: una serie por peldaño y por accesorio, todas con ✓', () => {
    const lad = c.plan.slice(c.blockStart[2], c.blockStart[3]);
    expect(lad.filter((p) => p.kind === 'reps')).toHaveLength(8);
    expect(c.steps[lad[1].ref!].weight).toBe(30);
  });

  it('el último bloque acaba en hecho, sin espera', () => {
    expect(c.plan.at(-1)!.kind).toBe('work');
  });

  it('a continuación: el siguiente paso distinto', () => {
    // estamos en la espera tras «Plancha»
    expect(upcoming(c, 5)?.label).toBe('Izquierda');
  });

  it('el motor recorre la sesión de punta a punta', () => {
    let s = start(createTimer(c.plan), 0);
    let t = 0;
    for (let guard = 0; guard < 10000 && s.status === 'running'; guard++) {
      t += 1000;
      s = tick(s, t);
      const v = snapshot(s, t);
      if (v.phase === 'wait' || v.phase === 'reps') s = primary(s, t);
    }
    expect(s.status).toBe('done');
    expect(snapshot(s, t).roundsDone).toBe(4 + 48 + 8 + 4 + 1);
  });
});

describe('ajustes de entreno', () => {
  it('cuenta atrás de 5 s, o ninguna', () => {
    const c5 = compileSession(SAMPLE_SESSION, { countdown: 5 });
    expect(c5.plan.filter((p) => p.kind === 'countdown').every((p) => p.duration === 5)).toBe(true);
    const c0 = compileSession(SAMPLE_SESSION, { countdown: 0 });
    expect(c0.plan.some((p) => p.kind === 'countdown')).toBe(false);
    expect(c0.steps).toEqual(compileSession(SAMPLE_SESSION).steps);
  });
  it('descanso automático: sin esperas manuales', () => {
    const c = compileSession(SAMPLE_SESSION, { descanso: 'auto' });
    expect(c.plan.some((p) => p.kind === 'wait')).toBe(false);
    expect(c.blockStart).toHaveLength(SAMPLE_SESSION.blocks.length);
    expect(compileSession(SAMPLE_SESSION).plan.some((p) => p.kind === 'wait')).toBe(true);
  });
});
