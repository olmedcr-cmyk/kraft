import { EMPTY, apply, dismissFailed, enqueue } from '../outbox';
import { rejectText } from '../rechazo';

const T = 1000;
const job = (kind: Parameters<typeof enqueue>[1]['kind'], payload: Record<string, unknown>, error = 'la clase está llena') => {
  const o = apply(enqueue(EMPTY, { id: 'x', kind, payload }, T), 'x', { reject: error }, T);
  return o.failed[0];
};

describe('aviso de rechazo', () => {
  const names = (id: string) => (id === 's1' ? 'Funcional del viernes 19:00' : undefined);

  it('dice qué no salió y por qué', () => {
    expect(rejectText(job('book', { slot: 's1' }), names)).toBe('No se pudo reservar Funcional del viernes 19:00. La clase está llena.');
    expect(rejectText(job('cancel', { slot: 'zz' }, 'la clase ya empezó'), names)).toBe('No se pudo cancelar la clase. La clase ya empezó.');
    expect(rejectText(job('pay', { month: '2026-10' }, 'ya está pagado'), names)).toBe('No se apuntó el pago de octubre. Ya está pagado.');
  });

  it('el aviso visto desaparece', () => {
    const o = apply(enqueue(EMPTY, { id: 'x', kind: 'book', payload: {} }, T), 'x', { reject: 'no' }, T);
    expect(dismissFailed(o, 'x').failed).toEqual([]);
  });
});

describe('mensajes técnicos', () => {
  it('lo que llega en inglés de Postgres no se enseña tal cual', () => {
    const t = rejectText(job('workout', {}, 'duplicate key value violates unique constraint "workouts_pkey"'), () => undefined);
    expect(t).toBe('No se guardó un entreno en el servidor. El servidor no lo aceptó.');
  });
});
