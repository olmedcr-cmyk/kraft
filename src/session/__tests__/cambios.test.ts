import { SAMPLE_SESSION } from '@/data/sampleSession';
import { changeText, diffSessions } from '../cambios';
import type { Session } from '../types';

const clone = (s: Session): Session => JSON.parse(JSON.stringify(s));

describe('sesión cambiada', () => {
  it('igual: sin cambios', () => {
    expect(diffSessions(SAMPLE_SESSION, clone(SAMPLE_SESSION))).toBeNull();
  });

  it('Tabata más corto: minutos y marcas de antes, y el texto', () => {
    const now = clone(SAMPLE_SESSION);
    const tab = now.blocks.find((b) => b.kind === 'tabata')!;
    if (tab.kind !== 'tabata') throw new Error();
    tab.sets = 4;
    tab.minutes = 16;
    now.minutes = 42;
    const c = diffSessions(SAMPLE_SESSION, now)!;
    expect(c.oldMinutes).toBe(50);
    expect(c.blocks[tab.id]).toEqual({ oldMinutes: 24, oldCount: 6, newCount: 4 });
    expect(Object.keys(c.blocks)).toEqual([tab.id]);
    expect(changeText(c, now, 'Elena')).toBe('Elena cambió Tabata');
  });

  it('quitar y añadir bloques', () => {
    const now = clone(SAMPLE_SESSION);
    const gone = now.blocks.pop()!;
    expect(changeText(diffSessions(SAMPLE_SESSION, now)!, now, 'Elena')).toBe(`Elena quitó ${gone.name}`);
    now.blocks.push({ ...gone, id: 'nuevo', name: 'Core' });
    const c = diffSessions(SAMPLE_SESSION, now)!;
    expect(c.blocks.nuevo.added).toBe(true);
    expect(changeText(c, now, 'Elena')).toBe('Elena cambió 2 bloques');
  });
});
