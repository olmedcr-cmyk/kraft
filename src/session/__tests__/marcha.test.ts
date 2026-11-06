import { SAMPLE_SESSION } from '@/data/sampleSession';
import { createTimer, start } from '@/timer/engine';
import { decode, encode, type Unfinished } from '../marchaFormato';

describe('sesión a medias', () => {
  it('guarda y recupera, con las repeticiones (Infinity) intactas', () => {
    const plan = [
      { kind: 'work' as const, duration: 30, round: 1, ref: 0 },
      { kind: 'reps' as const, duration: Infinity, round: 1, ref: 1 },
    ];
    const u: Unfinished = { v: 1, savedAt: 5, startedAt: 1, session: SAMPLE_SESSION, state: start(createTimer(plan), 0) };
    const back = decode(encode(u));
    expect(back?.state.plan[1].duration).toBe(Infinity);
    expect(back?.session.id).toBe(SAMPLE_SESSION.id);
  });

  it('ignora lo que no es una marcha en curso', () => {
    expect(decode(null)).toBeNull();
    expect(decode('{roto')).toBeNull();
    const done = { v: 1, savedAt: 5, startedAt: 1, session: SAMPLE_SESSION, state: { ...createTimer([]), status: 'done' } };
    expect(decode(JSON.stringify(done))).toBeNull();
  });
});
