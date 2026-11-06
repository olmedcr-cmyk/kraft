/**
 * Semilla de Supabase: Elena (entrenadora, código 472913), sus clases de las próximas 2 semanas
 * y la sesión de ejemplo como sesión de grupo para cada día.
 *
 * Usa la clave de servicio: se corre DESDE EL ORDENADOR, nunca va en la app.
 *   node --env-file=.env.local scripts/semilla.ts
 * .env.local (no se sube a git):
 *   EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=...
 *
 * Se puede repetir: no duplica (busca antes de crear).
 */
import { createClient } from '@supabase/supabase-js';

import { SAMPLE_SESSION } from '../src/data/sampleSession.ts';
import { validateSession } from '../src/session/validate.ts';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Faltan EXPO_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const TZ = 'Europe/Madrid';
const DAYS = 14;
const COACH = { email: 'elena@kraft.example', name: 'Elena', code: '472913', modes: ['grupo', 'solo', 'online'] };

// Las mismas clases que src/agenda/model.ts (TEMPLATE), en hora de Madrid. Domingo cerrado.
const BRING_SALA = [{ label: 'Toalla' }, { label: 'Agua' }, { label: 'Zapatillas' }, { label: 'Esterilla', provided: true }];
const BRING_CASA = [{ label: 'Agua' }, { label: 'Esterilla' }];
const TEMPLATE = [
  { mode: 'grupo', t: '07:00', name: 'Fuerza', minutes: 50, room: 1, capacity: 12 },
  { mode: 'grupo', t: '09:30', name: 'Funcional', minutes: 50, room: 2, capacity: 12 },
  { mode: 'grupo', t: '18:00', name: 'Movilidad', minutes: 50, room: 4, capacity: 12 },
  { mode: 'grupo', t: '19:00', name: 'Funcional', minutes: 50, room: 2, capacity: 12 },
  { mode: 'solo', t: '08:00', name: 'Personal', minutes: 50, room: 3, capacity: 1 },
  { mode: 'solo', t: '12:00', name: 'Personal', minutes: 50, room: 3, capacity: 1 },
  { mode: 'solo', t: '19:00', name: 'Personal', minutes: 50, room: 1, capacity: 1 },
  { mode: 'online', t: '07:30', name: 'Tabata en directo', minutes: 20, capacity: 0 },
  { mode: 'online', t: '13:00', name: 'Movilidad', minutes: 30, capacity: 0 },
  { mode: 'online', t: '20:00', name: 'Core', minutes: 20, capacity: 0 },
] as const;

/** «2026-11-06» en Madrid, `n` días desde hoy. */
function madridDay(n: number): string {
  const d = new Date(Date.now() + n * 86_400_000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

/** «2026-11-06» + «07:00» de Madrid → instante ISO (con su desfase de verano o invierno). */
function madridInstant(day: string, hhmm: string): string {
  const guess = new Date(`${day}T${hhmm}:00Z`);
  const offset = new Intl.DateTimeFormat('en-US', { timeZone: TZ, timeZoneName: 'longOffset' }).format(guess).match(/GMT([+-]\d{2}):(\d{2})/);
  const sign = offset ? offset[1] : '+01';
  return new Date(`${day}T${hhmm}:00${sign}:${offset ? offset[2] : '00'}`).toISOString();
}

async function coachUser(): Promise<string> {
  const { data: list, error } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const found = list.users.find((u) => u.email === COACH.email);
  if (found) return found.id;
  const { data, error: e2 } = await db.auth.admin.createUser({ email: COACH.email, email_confirm: true, user_metadata: { name: COACH.name } });
  if (e2) throw e2;
  return data.user.id;
}

async function main() {
  const check = validateSession({ id: 'semilla', day: madridDay(0), minutes: SAMPLE_SESSION.minutes, body: { blocks: SAMPLE_SESSION.blocks } }, { name: COACH.name });
  if (!check.ok) throw new Error(`La sesión de ejemplo no pasa la validación: ${check.error}`);

  const coachId = await coachUser();
  await must(db.from('profiles').update({ role: 'coach', name: COACH.name }).eq('id', coachId));
  await must(db.from('coaches').upsert({ id: coachId, code: COACH.code, name: COACH.name, modes: COACH.modes }));
  console.log(`✓ ${COACH.name} (${COACH.code})`);

  // Clases: las que falten de los próximos 14 días.
  const from = madridInstant(madridDay(0), '00:00');
  const { data: existing } = await db.from('slots').select('starts_at, name, mode').eq('coach_id', coachId).gte('starts_at', from);
  const have = new Set((existing ?? []).map((s) => `${new Date(s.starts_at).toISOString()}|${s.mode}|${s.name}`));
  const slots = [];
  for (let n = 0; n < DAYS; n++) {
    const day = madridDay(n);
    if (new Date(`${day}T12:00:00Z`).getUTCDay() === 0) continue;
    for (const s of TEMPLATE) {
      const starts_at = madridInstant(day, s.t);
      if (have.has(`${starts_at}|${s.mode}|${s.name}`)) continue;
      const room = 'room' in s ? s.room : null;
      slots.push({
        coach_id: coachId,
        mode: s.mode,
        starts_at,
        minutes: s.minutes,
        name: s.name,
        room,
        floor: room ? 1 : null,
        directions: room ? 'Entrada, 2ª puerta a la derecha' : null,
        capacity: s.capacity,
        bring: room ? BRING_SALA : BRING_CASA,
      });
    }
  }
  if (slots.length) await must(db.from('slots').insert(slots));
  console.log(`✓ ${slots.length} clases nuevas`);

  // Sesión de grupo para cada día (si no la hay).
  const sessions = [];
  for (let n = 0; n < DAYS; n++) {
    const day = madridDay(n);
    const { count } = await db.from('sessions').select('id', { count: 'exact', head: true }).eq('coach_id', coachId).is('athlete_id', null).eq('day', day);
    if (!count) sessions.push({ coach_id: coachId, athlete_id: null, day, minutes: SAMPLE_SESSION.minutes, schema_version: 1, body: { blocks: SAMPLE_SESSION.blocks } });
  }
  if (sessions.length) await must(db.from('sessions').insert(sessions));
  console.log(`✓ ${sessions.length} sesiones de grupo`);
}

async function must<T extends { error: unknown }>(p: PromiseLike<T>): Promise<T> {
  const r = await p;
  if (r.error) throw r.error;
  return r;
}

main().catch((e) => {
  console.error('✕', e?.message ?? e);
  process.exit(1);
});
