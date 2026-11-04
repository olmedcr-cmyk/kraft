import {
  addDays,
  arrive,
  book,
  cancel,
  cancelDeadline,
  getSlot,
  hhmm,
  isFull,
  joinWaitlist,
  longDay,
  move,
  moveOptions,
  relativeDay,
  slotsFor,
  takenWithMe,
  upcomingBookings,
  weekStart,
  type AgendaState,
} from '../model';

// Martes 3 nov 2026, 08:00
const NOW = new Date(2026, 10, 3, 8, 0).getTime();
const THU = new Date(2026, 10, 5).getTime();
const SUN = new Date(2026, 10, 8).getTime();
const empty: AgendaState = { bookings: {} };

describe('clases', () => {
  it('cada día abierto tiene sus clases y el domingo cierra', () => {
    expect(slotsFor(THU, 'grupo')).toHaveLength(4);
    expect(slotsFor(SUN, 'grupo')).toHaveLength(0);
  });

  it('el id de una clase vuelve a dar la misma clase', () => {
    const s = slotsFor(THU, 'grupo')[1];
    expect(getSlot(s.id)).toEqual(s);
    expect(hhmm(s.start)).toBe('09:30');
  });

  it('la semana empieza en lunes', () => {
    expect(new Date(weekStart(NOW)).getDay()).toBe(1);
  });

  it('fechas en español', () => {
    expect(longDay(THU)).toBe('Jueves 5 nov');
    expect(relativeDay(THU, NOW)).toBe('en 2 días');
    expect(relativeDay(addDays(NOW, 1), NOW)).toBe('mañana');
  });
});

describe('reservar', () => {
  const s = slotsFor(THU, 'grupo')[0];

  it('reserva y suma su plaza', () => {
    const r = book(empty, s, NOW);
    expect(r.ok).toBe(true);
    if (r.ok) expect(takenWithMe(s, r.state)).toBe(s.taken + 1);
  });

  it('no deja reservar lo pasado ni lo lleno', () => {
    const past = slotsFor(addDays(NOW, -1), 'grupo')[0];
    expect(book(empty, past, NOW)).toEqual({ ok: false, reason: 'past' });
    const full = slotsFor(THU, 'grupo').find(isFull)!;
    expect(book(empty, full, NOW)).toEqual({ ok: false, reason: 'full' });
  });

  it('si está llena, a la lista de espera detrás de los que ya hay', () => {
    const full = slotsFor(THU, 'grupo').find(isFull)!;
    const r = joinWaitlist(empty, full, NOW, true);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.bookings[full.id].status).toBe('waitlist');
      expect(r.state.bookings[full.id].position).toBe(2);
    }
  });
});

describe('cancelar y mover', () => {
  const s = slotsFor(THU, 'grupo')[1]; // 09:30

  it('gratis hasta 2 h antes; después cuenta como clase', () => {
    expect(hhmm(cancelDeadline(s))).toBe('07:30');
    const st = (book(empty, s, NOW) as { state: AgendaState }).state;
    expect(cancel(st, s, NOW).late).toBe(false);
    expect(cancel(st, s, s.start - 3600_000).late).toBe(true);
    const after = cancel(st, s, NOW);
    expect(after.ok && Object.keys(after.state.bookings)).toEqual([]);
  });

  it('mover libera la vieja y ocupa la nueva', () => {
    const st = (book(empty, s, NOW) as { state: AgendaState }).state;
    const [to] = moveOptions(s, NOW);
    const r = move(st, s, to, NOW);
    expect(r.ok).toBe(true);
    if (r.ok) expect(Object.keys(r.state.bookings)).toEqual([to.id]);
  });

  it('opciones para mover: futuras, con sitio y sin la actual', () => {
    const opts = moveOptions(s, NOW);
    expect(opts).toHaveLength(3);
    for (const o of opts) {
      expect(o.id).not.toBe(s.id);
      expect(isFull(o)).toBe(false);
      expect(o.start).toBeGreaterThan(NOW);
    }
  });

  it('llegar marca y desmarca', () => {
    const st = (book(empty, s, NOW) as { state: AgendaState }).state;
    const r = arrive(st, s);
    expect(r.ok && r.state.bookings[s.id].arrived).toBe(true);
  });

  it('próximas reservas en orden', () => {
    let st = (book(empty, slotsFor(THU, 'grupo')[2], NOW) as { state: AgendaState }).state;
    st = (book(st, s, NOW) as { state: AgendaState }).state;
    expect(upcomingBookings(st, NOW).map((x) => hhmm(x.slot.start))).toEqual(['09:30', '18:00']);
  });
});
