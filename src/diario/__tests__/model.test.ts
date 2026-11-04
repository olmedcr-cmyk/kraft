import {
  bill,
  dueDate,
  logClass,
  logOwn,
  monthGrid,
  monthKey,
  monthStatus,
  pay,
  sampleDiary,
  shiftMonth,
  streakWeeks,
  totals,
  trainedDays,
  trend,
  unlogClass,
  weekColumns,
  weekDays,
  weeksMinutes,
  type DiaryState,
} from '../model';

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();
const NOW = at(2026, 11, 4, 10); // miércoles 4 nov 2026
const empty: DiaryState = { days: {}, payments: {} };

describe('meses', () => {
  it('rejilla de lunes a domingo', () => {
    expect(monthGrid('2026-10')).toEqual({ offset: 3, len: 31 }); // 1 oct = jueves
    expect(monthGrid('2026-11')).toEqual({ offset: 6, len: 30 }); // 1 nov = domingo
  });
  it('cambia de año', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
  });
  it('octubre vence el 5 de noviembre', () => {
    expect(new Date(dueDate('2026-10')).getDate()).toBe(5);
    expect(monthKey(dueDate('2026-10'))).toBe('2026-11');
  });
});

describe('cuenta del mes', () => {
  let s = empty;
  s = logClass(s, at(2026, 10, 1), 'grupo', 50);
  s = logClass(s, at(2026, 10, 6), 'grupo', 50);
  s = logClass(s, at(2026, 10, 3), 'solo', 50);
  s = logClass(s, at(2026, 10, 10), 'online', 30);
  s = logOwn(s, at(2026, 10, 12), 20, 2);

  it('una línea por modalidad con clases', () => {
    const b = bill(s, '2026-10');
    expect(b.lines).toEqual([
      { mode: 'grupo', count: 2, price: 8, total: 16 },
      { mode: 'solo', count: 1, price: 30, total: 30 },
      { mode: 'online', count: 1, price: 5, total: 5 },
    ]);
    expect(b.amount).toBe(51);
  });
  it('lo entrenado por tu cuenta no se cobra pero cuenta como día', () => {
    expect(trainedDays(s, '2026-10')).toBe(5);
  });
  it('cancelar tarde se cobra y no cuenta como día entrenado', () => {
    const t = logClass(empty, at(2026, 10, 20), 'grupo', 50, true);
    expect(bill(t, '2026-10').amount).toBe(8);
    expect(trainedDays(t, '2026-10')).toBe(0);
  });
  it('deshacer la llegada quita la clase y deja lo propio', () => {
    let t = logClass(empty, at(2026, 10, 12), 'grupo', 50);
    t = logOwn(t, at(2026, 10, 12), 20, 1);
    t = unlogClass(t, at(2026, 10, 12));
    expect(t.days['2026-10-12']).toEqual({ day: '2026-10-12', class: undefined, own: { minutes: 20, tabatas: 1 } });
    expect(unlogClass(logClass(empty, at(2026, 10, 1), 'solo', 50), at(2026, 10, 1)).days).toEqual({});
  });

  it('estados: en curso, a pagar, pagado, nada', () => {
    expect(monthStatus(s, '2026-11', NOW)).toBe('en-curso');
    expect(monthStatus(s, '2026-10', NOW)).toBe('a-pagar');
    expect(monthStatus(s, '2026-09', NOW)).toBe('nada');
    const r = pay(s, '2026-10', 'tarjeta', NOW);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.payment.amount).toBe(51);
      expect(monthStatus(r.state, '2026-10', NOW)).toBe('pagado');
      expect(pay(r.state, '2026-10', 'tarjeta', NOW)).toEqual({ ok: false, reason: 'paid' });
    }
  });
  it('el mes en curso no se paga antes de tiempo', () => {
    expect(pay(s, '2026-11', 'bizum', NOW)).toEqual({ ok: false, reason: 'not-due' });
    expect(pay(s, '2026-09', 'bizum', NOW)).toEqual({ ok: false, reason: 'empty' });
  });
});

describe('progreso', () => {
  it('círculos de 10 min repartidos por filas', () => {
    expect(weekColumns(0)).toEqual([0, 0, 0]);
    expect(weekColumns(100)).toEqual([4, 3, 3]);
    expect(weekColumns(110)).toEqual([4, 4, 3]);
    expect(weekColumns(999)).toEqual([8, 8, 8]);
  });
  it('tendencia: últimas 4 frente a las 4 anteriores', () => {
    expect(trend([100, 100, 100, 100, 118, 118, 118, 118])).toBe(18);
    expect(trend([0, 0, 0, 0, 50, 0, 0, 0])).toBe(0);
  });
  it('semanas y días de esta semana', () => {
    let s = logClass(empty, at(2026, 11, 3), 'grupo', 50); // martes
    s = logOwn(s, at(2026, 11, 3), 20, 1);
    s = logOwn(s, at(2026, 10, 27), 30, 0); // semana anterior
    expect(weekDays(s, NOW)).toEqual([0, 50, 0, 0, 0, 0, 0]);
    expect(weeksMinutes(s, NOW, 2)).toEqual([30, 50]);
  });
  it('racha de semanas: la semana en curso vacía no la rompe', () => {
    let s = logOwn(empty, at(2026, 10, 27), 30, 0);
    s = logOwn(s, at(2026, 10, 20), 30, 0);
    expect(streakWeeks(s, NOW)).toBe(2);
    s = logOwn(s, at(2026, 11, 2), 30, 0);
    expect(streakWeeks(s, NOW)).toBe(3);
    expect(streakWeeks(logOwn(empty, at(2026, 10, 20), 30, 0), NOW)).toBe(0);
  });
  it('sesiones y tabatas de las últimas 8 semanas', () => {
    let s = logOwn(empty, at(2026, 11, 2), 20, 2);
    s = logClass(s, at(2026, 11, 3), 'grupo', 50);
    s = logOwn(s, at(2026, 8, 1), 20, 5); // fuera de la ventana
    expect(totals(s, NOW)).toEqual({ sessions: 2, tabatas: 2 });
  });
});

describe('ejemplo', () => {
  const s = sampleDiary(NOW);
  it('nada de hoy ni del futuro', () => {
    expect(Object.keys(s.days).every((d) => d < '2026-11-04')).toBe(true);
  });
  it('el último mes cerrado queda por pagar; los anteriores, pagados', () => {
    expect(monthStatus(s, '2026-10', NOW)).toBe('a-pagar');
    expect(monthStatus(s, '2026-09', NOW)).toBe('pagado');
  });
  it('el progreso sube', () => {
    expect(trend(weeksMinutes(s, NOW))).toBeGreaterThan(0);
  });
});
