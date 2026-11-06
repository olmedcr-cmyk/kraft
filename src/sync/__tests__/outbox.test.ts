import { EMPTY, MAX_DELAY, apply, delayFor, due, enqueue, flush, restoreOutbox, type Job, type SendResult } from '../outbox';

const T = 1_000_000;
const w = (id: string) => ({ id, kind: 'workout' as const, payload: { minutes: 10 } });

describe('cola de envíos', () => {
  it('apunta en orden y no repite el mismo id', () => {
    let o = enqueue(EMPTY, w('a'), T);
    o = enqueue(o, w('b'), T);
    o = enqueue(o, w('a'), T);
    expect(o.jobs.map((j) => j.id)).toEqual(['a', 'b']);
  });

  it('el perfil se fusiona con el pendiente', () => {
    let o = enqueue(EMPTY, { id: 'p1', kind: 'profile', payload: { analytics: true } }, T);
    o = enqueue(o, w('a'), T);
    o = enqueue(o, { id: 'p2', kind: 'profile', payload: { analytics: false, emails: true } }, T);
    expect(o.jobs).toHaveLength(2);
    expect(o.jobs[0].payload).toEqual({ analytics: false, emails: true });
  });

  it('espera creciente con tope', () => {
    expect(delayFor(1)).toBe(2_000);
    expect(delayFor(2)).toBe(4_000);
    expect(delayFor(30)).toBe(MAX_DELAY);
  });

  it('reintento: el primero espera y bloquea a los de detrás', () => {
    let o = enqueue(enqueue(EMPTY, w('a'), T), w('b'), T);
    o = apply(o, 'a', 'retry', T);
    expect(due(o, T + 1_000)).toBeUndefined();
    expect(due(o, T + 2_000)?.id).toBe('a');
  });

  it('rechazado: sale de la cola y queda para avisar', () => {
    let o = enqueue(enqueue(EMPTY, w('a'), T), w('b'), T);
    o = apply(o, 'a', { reject: 'la clase está llena' }, T);
    expect(o.jobs.map((j) => j.id)).toEqual(['b']);
    expect(o.failed[0]).toMatchObject({ id: 'a', error: 'la clase está llena' });
  });

  it('flush manda en orden y para al primer fallo de red', async () => {
    let o = EMPTY;
    for (const id of ['a', 'b', 'c']) o = enqueue(o, w(id), T);
    const sent: string[] = [];
    const answers: Record<string, SendResult> = { a: 'ok', b: 'retry', c: 'ok' };
    o = await flush(o, async (j: Job) => (sent.push(j.id), answers[j.id]), () => T);
    expect(sent).toEqual(['a', 'b']);
    expect(o.jobs.map((j) => j.id)).toEqual(['b', 'c']);
    expect(o.jobs[0].tries).toBe(1);
  });

  it('una excepción al enviar cuenta como fallo de red', async () => {
    const o = await flush(enqueue(EMPTY, w('a'), T), async () => {
      throw new Error('offline');
    }, () => T);
    expect(o.jobs[0].tries).toBe(1);
  });

  it('restaura lo guardado descartando basura', () => {
    expect(restoreOutbox(null)).toEqual(EMPTY);
    const r = restoreOutbox({ jobs: [{ id: 'a', kind: 'workout', payload: {}, tries: 0, nextAt: 1 }, { nope: 1 }], failed: 'x' });
    expect(r.jobs).toHaveLength(1);
    expect(r.failed).toEqual([]);
  });
});
