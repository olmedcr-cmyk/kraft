/**
 * Diario y pago (R6). Lógica pura: lo entrenado por día, lo que se debe cada mes y el progreso.
 * Fechas locales; `now` siempre llega de fuera para poder probarlo.
 */
import { addDays, dayStart, isoDay, weekStart, type Mode } from '@/agenda/model';

/** Lo que pasó un día. Una clase se cobra; lo entrenado por tu cuenta solo cuenta en el progreso. */
export interface DayLog {
  /** «YYYY-MM-DD» */
  day: string;
  /** Clase a la que fuiste (o que cancelaste tarde: se cobra igual, sin minutos). */
  class?: { mode: Mode; minutes: number; late?: boolean };
  /** Sesión del entrenador o tiempo libre hechos en la app. */
  own?: { minutes: number; tabatas: number };
}

export type Method = 'tarjeta' | 'bizum';

export interface Payment {
  /** «YYYY-MM» */
  month: string;
  amount: number;
  method: Method;
  at: number;
  receiptSent?: boolean;
}

export interface DiaryState {
  days: Record<string, DayLog>;
  payments: Record<string, Payment>;
}

/** Precio por clase (de ejemplo; lo fija el centro). */
export const PRICES: Record<Mode, number> = { grupo: 8, solo: 30, online: 5 };
/** El mes cerrado vence el día 5 del siguiente. */
export const DUE_DAY = 5;
/** Un círculo de la gráfica = 10 minutos; cada semana son 3 columnas de 8. */
export const CIRCLE_MIN = 10;
export const WEEK_COLS = 3;
export const COL_ROWS = 8;

const MONTH_NAME = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// ─── Meses ─────────────────────────────────────────────────────────────────

export const monthKey = (t: number) => isoDay(t).slice(0, 7);
export const monthStart = (key: string) => new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1).getTime();
export const shiftMonth = (key: string, n: number) => {
  const d = new Date(monthStart(key));
  d.setMonth(d.getMonth() + n);
  return monthKey(d.getTime());
};
export const monthName = (key: string) => MONTH_NAME[Number(key.slice(5, 7)) - 1];
/** Huecos antes del día 1 (semana de lunes a domingo) y días del mes. */
export function monthGrid(key: string) {
  const first = new Date(monthStart(key));
  const len = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return { offset: (first.getDay() + 6) % 7, len };
}
export const dueDate = (key: string) => addDays(monthStart(shiftMonth(key, 1)), DUE_DAY - 1);

// ─── Cuentas ───────────────────────────────────────────────────────────────

export const minutesOf = (l?: DayLog) => Math.max(l?.class?.minutes ?? 0, l?.own?.minutes ?? 0);
export const trained = (l?: DayLog) => minutesOf(l) > 0;

export const logsIn = (s: DiaryState, key: string) => Object.values(s.days).filter((l) => l.day.startsWith(key));

export interface BillLine {
  mode: Mode;
  count: number;
  price: number;
  total: number;
}

/** Lo que se debe de un mes: una línea por modalidad con clases. */
export function bill(s: DiaryState, key: string): { lines: BillLine[]; amount: number } {
  const count: Record<Mode, number> = { grupo: 0, solo: 0, online: 0 };
  for (const l of logsIn(s, key)) if (l.class) count[l.class.mode]++;
  const lines = (Object.keys(count) as Mode[])
    .filter((m) => count[m] > 0)
    .map((m) => ({ mode: m, count: count[m], price: PRICES[m], total: count[m] * PRICES[m] }));
  return { lines, amount: lines.reduce((a, l) => a + l.total, 0) };
}

export type MonthStatus = 'en-curso' | 'a-pagar' | 'pagado' | 'nada';

export function monthStatus(s: DiaryState, key: string, now: number): MonthStatus {
  if (s.payments[key]) return 'pagado';
  if (key >= monthKey(now)) return 'en-curso';
  return bill(s, key).amount > 0 ? 'a-pagar' : 'nada';
}

/** Días entrenados del mes (las cancelaciones tardías se cobran pero no cuentan). */
export const trainedDays = (s: DiaryState, key: string) => logsIn(s, key).filter(trained).length;

// ─── Cambios ───────────────────────────────────────────────────────────────

const withDay = (s: DiaryState, day: string, f: (l: DayLog) => DayLog | undefined): DiaryState => {
  const next = f(s.days[day] ?? { day });
  const days = { ...s.days };
  if (next && (next.class || next.own)) days[day] = next;
  else delete days[day];
  return { ...s, days };
};

/** Llegaste a clase (o la cancelaste tarde): se apunta y se cobra. */
export const logClass = (s: DiaryState, at: number, mode: Mode, minutes: number, late = false) =>
  withDay(s, isoDay(at), (l) => ({ ...l, class: late ? { mode, minutes: 0, late } : { mode, minutes } }));

/** Deshacer la llegada. */
export const unlogClass = (s: DiaryState, at: number) => withDay(s, isoDay(at), (l) => ({ ...l, class: undefined }));

/** Sesión o tiempo libre terminados: se suman al día. */
export const logOwn = (s: DiaryState, at: number, minutes: number, tabatas: number) =>
  withDay(s, isoDay(at), (l) => ({ ...l, own: { minutes: (l.own?.minutes ?? 0) + minutes, tabatas: (l.own?.tabatas ?? 0) + tabatas } }));

export type PayResult = { ok: true; state: DiaryState; payment: Payment } | { ok: false; reason: 'not-due' | 'paid' | 'empty' };

/** Solo se paga un mes cerrado; el mes en curso se cobra al acabar. */
export function pay(s: DiaryState, key: string, method: Method, now: number): PayResult {
  const st = monthStatus(s, key, now);
  if (st === 'pagado') return { ok: false, reason: 'paid' };
  if (st === 'en-curso') return { ok: false, reason: 'not-due' };
  if (st === 'nada') return { ok: false, reason: 'empty' };
  const payment: Payment = { month: key, amount: bill(s, key).amount, method, at: now, receiptSent: true };
  return { ok: true, payment, state: { ...s, payments: { ...s.payments, [key]: payment } } };
}

// ─── Progreso ──────────────────────────────────────────────────────────────

/** Minutos por semana, de la más antigua a la actual. */
export function weeksMinutes(s: DiaryState, now: number, n = 8): number[] {
  const thisWeek = weekStart(now);
  return Array.from({ length: n }, (_, i) => {
    const w = addDays(thisWeek, (i - n + 1) * 7);
    let m = 0;
    for (let d = 0; d < 7; d++) m += minutesOf(s.days[isoDay(addDays(w, d))]);
    return m;
  });
}

/** Minutos de cada día de esta semana (L…D). */
export const weekDays = (s: DiaryState, now: number) =>
  Array.from({ length: 7 }, (_, d) => minutesOf(s.days[isoDay(addDays(weekStart(now), d))]));

/** Cambio de las 4 últimas semanas frente a las 4 anteriores, en %. */
export function trend(weeks: number[]): number {
  const half = Math.floor(weeks.length / 2);
  const before = weeks.slice(0, half).reduce((a, b) => a + b, 0);
  const after = weeks.slice(half).reduce((a, b) => a + b, 0);
  return before === 0 ? 0 : Math.round(((after - before) / before) * 100);
}

/** Alturas de las 3 columnas de una semana: círculos de 10 min, se llenan por filas de abajo arriba. */
export function weekColumns(minutes: number): number[] {
  const n = Math.min(WEEK_COLS * COL_ROWS, Math.round(minutes / CIRCLE_MIN));
  return Array.from({ length: WEEK_COLS }, (_, c) => Math.floor(n / WEEK_COLS) + (c < n % WEEK_COLS ? 1 : 0));
}

/** Semanas seguidas con algún entreno. La semana en curso aún vacía no rompe la racha. */
export function streakWeeks(s: DiaryState, now: number, max = 52): number {
  const w = weeksMinutes(s, now, max);
  let i = w.length - 1;
  if (w[i] === 0) i--;
  let n = 0;
  while (i >= 0 && w[i] > 0) {
    n++;
    i--;
  }
  return n;
}

/** Sesiones y tabatas de las últimas `n` semanas (incluida la actual). */
export function totals(s: DiaryState, now: number, n = 8) {
  const from = isoDay(addDays(weekStart(now), -(n - 1) * 7));
  const to = isoDay(now);
  let sessions = 0;
  let tabatas = 0;
  for (const l of Object.values(s.days)) {
    if (l.day < from || l.day > to) continue;
    if (trained(l)) sessions++;
    tabatas += l.own?.tabatas ?? 0;
  }
  return { sessions, tabatas };
}

// ─── Ejemplo ───────────────────────────────────────────────────────────────

/**
 * Historial de ejemplo hasta ayer: martes y jueves grupo, sábados solo u online alternos.
 * Las semanas más antiguas, menos (para que el progreso suba). Se sustituye por el backend.
 */
export function sampleDiary(now: number, weeks = 10): DiaryState {
  let s: DiaryState = { days: {}, payments: {} };
  const today = dayStart(now);
  const first = addDays(weekStart(now), -weeks * 7);
  for (let t = first; t < today; t = addDays(t, 1)) {
    const wd = new Date(t).getDay();
    const wk = Math.round((weekStart(now) - weekStart(t)) / (7 * 86_400_000));
    if (wd === 2 || wd === 4) {
      s = logClass(s, t, 'grupo', 50);
      if (wd === 4 && wk < 6) s = logOwn(s, t, 12, 1);
    } else if (wd === 6 && wk < 5) {
      s = logClass(s, t, wk % 2 === 0 ? 'online' : 'solo', wk % 2 === 0 ? 30 : 50);
    } else if (wd === 1 && wk < 3) {
      s = logOwn(s, t, 20, 2);
    }
  }
  // Meses anteriores al último cerrado: pagados.
  const lastClosed = shiftMonth(monthKey(now), -1);
  for (const key of new Set(Object.keys(s.days).map((d) => d.slice(0, 7)))) {
    if (key < lastClosed) s.payments[key] = { month: key, amount: bill(s, key).amount, method: 'tarjeta', at: dueDate(key), receiptSent: true };
  }
  return s;
}
