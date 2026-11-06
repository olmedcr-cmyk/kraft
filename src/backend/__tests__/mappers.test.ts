import { isoDay } from '@/agenda/model';
import { bill, monthStatus } from '@/diario/model';
import { toAgenda, toDiary, toSlot, type BookingRow, type SlotRow } from '../mappers';

const slot: SlotRow = {
  id: 's1', mode: 'grupo', starts_at: '2026-11-10T17:00:00Z', minutes: 50, name: 'Funcional',
  room: 2, floor: 1, directions: 'Entrada', capacity: 12, bring: [{ label: 'Agua' }],
};
const bk = (o: Partial<BookingRow>): BookingRow => ({
  id: 'b', slot_id: 's1', status: 'confirmed', position: null, auto_join: false, arrived_at: null, booked_at: '2026-11-01T10:00:00Z', ...o,
});

describe('del servidor a la app', () => {
  it('clase: mi plaza no cuenta en las de los demás', () => {
    const s = toSlot(slot, { slot_id: 's1', taken: 8, queue: 0 }, bk({}));
    expect(s).toMatchObject({ id: 's1', cap: 12, taken: 7, queue: 0, room: 2, start: Date.parse('2026-11-10T17:00:00Z') });
    expect(toSlot(slot, { slot_id: 's1', taken: 12, queue: 3 }, bk({ status: 'waitlist', position: 2 })).queue).toBe(2);
    expect(toSlot({ ...slot, room: null, bring: null }, undefined, undefined)).toMatchObject({ taken: 0, room: undefined, bring: [] });
  });

  it('reservas: solo las activas, por clase', () => {
    const a = toAgenda([bk({}), bk({ slot_id: 's2', status: 'waitlist', position: 1, auto_join: true }), bk({ slot_id: 's3', status: 'cancelled' })]);
    expect(Object.keys(a.bookings)).toEqual(['s1', 's2']);
    expect(a.bookings.s2).toMatchObject({ status: 'waitlist', position: 1, autoJoin: true });
  });

  it('diario: clases a las que fui, tardías cobradas, entrenos sumados y pagos', () => {
    const d = toDiary(
      [
        bk({ arrived_at: '2026-10-07T17:55:00Z', slots: { mode: 'grupo', starts_at: '2026-10-07T17:00:00Z', minutes: 50 } }),
        bk({ status: 'late_cancel', slots: { mode: 'solo', starts_at: '2026-10-09T10:00:00Z', minutes: 50 } }),
        bk({ slots: { mode: 'grupo', starts_at: '2026-10-11T10:00:00Z', minutes: 50 } }),
      ],
      [{ day: '2026-10-07', minutes: 20, tabatas: 1 }, { day: '2026-10-07', minutes: 10, tabatas: 0 }],
      [{ month: '2026-09', amount_cents: 1600, method: 'bizum', paid_at: '2026-10-02T10:00:00Z', receipt_sent_at: null }],
    );
    const oct7 = isoDay(Date.parse('2026-10-07T17:00:00Z'));
    expect(d.days[oct7]).toMatchObject({ class: { mode: 'grupo', minutes: 50 }, own: { minutes: 30, tabatas: 1 } });
    expect(d.days[isoDay(Date.parse('2026-10-09T10:00:00Z'))].class).toEqual({ mode: 'solo', minutes: 0, late: true });
    expect(d.days[isoDay(Date.parse('2026-10-11T10:00:00Z'))]).toBeUndefined();
    expect(d.payments['2026-09']).toMatchObject({ amount: 16, method: 'bizum' });
    // La factura que calcula la app coincide con la del servidor (8 € + 30 € tardía).
    expect(bill(d, '2026-10').amount).toBe(38);
    expect(monthStatus(d, '2026-09', Date.parse('2026-11-06T10:00:00Z'))).toBe('pagado');
  });
});
