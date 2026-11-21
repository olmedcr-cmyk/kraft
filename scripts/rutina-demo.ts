/**
 * Rutina de demo de Elena para un atleta: sesión propia (manda sobre la de grupo) de hoy y los próximos días.
 * Enseña los tres tipos de bloque (tramos, Tabata, escalera) con ejercicios que tienen ilustración.
 *
 *   node --env-file=.env.local scripts/rutina-demo.ts correo@ejemplo.com [días=7]
 *
 * Usa la clave de servicio: se corre desde el ordenador, nunca va en la app.
 * Si el atleta no está vinculado con Elena, lo vincula. Se puede repetir: actualiza en vez de duplicar.
 */
import { createClient } from '@supabase/supabase-js';

import type { Block } from '../src/session/types.ts';
import { validateSession } from '../src/session/validate.ts';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2]?.trim().toLowerCase();
const days = Number(process.argv[3] ?? 7);
if (!url || !key) {
  console.error('Faltan EXPO_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}
if (!email || !Number.isInteger(days) || days < 1 || days > 31) {
  console.error('Uso: node --env-file=.env.local scripts/rutina-demo.ts correo@ejemplo.com [días 1–31]');
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const TZ = 'Europe/Madrid';
const COACH_CODE = '472913';

/** Unos 30 minutos: corta para enseñarla entera en una demo. */
const MINUTES = 30;
const BLOCKS: Block[] = [
  {
    id: 'calentar',
    kind: 'interval',
    name: 'Calentar',
    tint: 'klein',
    minutes: 4,
    steps: [
      { label: 'Movilidad', seconds: 120, rest: 10 },
      { exercise: 'bridge', label: 'Puente', seconds: 40, rest: 10 },
      { exercise: 'mountain-climber', label: 'Escalador', seconds: 30, rest: 0 },
    ],
  },
  {
    id: 'tabata',
    kind: 'tabata',
    name: 'Tabata',
    tint: 'naranja',
    minutes: 9,
    isNew: true,
    work: 20,
    rest: 10,
    rounds: 8,
    sets: 2,
    setRest: 60,
    a: { exercise: 'burpee', label: 'Burpee' },
    b: { exercise: 'push-up', label: 'Flexiones' },
  },
  {
    id: 'fuerza',
    kind: 'ladder',
    name: 'Fuerza',
    tint: 'klein',
    minutes: 8,
    exercise: { id: 'squat', label: 'Sentadilla goblet' },
    steps: [
      { reps: 12, weight: 12 },
      { reps: 10, weight: 16 },
      { reps: 8, weight: 20 },
      { reps: 6, weight: 24 },
    ],
    after: [{ label: 'Zancadas', detail: '2×12' }, { label: 'Búlgaras', detail: '2×8' }],
  },
  {
    id: 'core',
    kind: 'interval',
    name: 'Core',
    tint: 'tinteNaranja',
    minutes: 4,
    steps: [
      { exercise: 'plank', label: 'Plancha', seconds: 40, rest: 20, hold: true },
      { exercise: 'side-plank', label: 'Izquierda', seconds: 30, rest: 10, hold: true },
      { exercise: 'side-plank', label: 'Derecha', seconds: 30, rest: 20, hold: true },
      { exercise: 'mountain-climber', label: 'Escalador', seconds: 30, rest: 0 },
    ],
  },
  {
    id: 'estirar',
    kind: 'interval',
    name: 'Estirar',
    tint: 'verde',
    minutes: 5,
    steps: [{ label: 'Estirar · libre', seconds: 300, rest: 0 }],
  },
];

function madridDay(n: number): string {
  const d = new Date(Date.now() + n * 86_400_000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

async function must<T extends { error: unknown }>(p: PromiseLike<T>): Promise<T> {
  const r = await p;
  if (r.error) throw r.error;
  return r;
}

async function main() {
  const check = validateSession({ id: 'demo', day: madridDay(0), minutes: MINUTES, body: { blocks: BLOCKS } }, { name: 'Elena' });
  if (!check.ok) throw new Error(`La rutina no pasa la validación: ${check.error}`);

  const { data: list, error } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const athlete = list.users.find((u) => u.email?.toLowerCase() === email);
  if (!athlete) throw new Error(`${email} aún no tiene cuenta: que entre una vez en la app con ese email`);

  const { data: coach } = await must(db.from('coaches').select('id, name').eq('code', COACH_CODE).single());
  if (!coach) throw new Error(`No hay entrenador con el código ${COACH_CODE}: corre antes scripts/semilla.ts`);

  // Vínculo activo con Elena (uno a la vez: se cierran los demás).
  const { data: links } = await must(db.from('coach_athletes').select('coach_id, unlinked_at').eq('athlete_id', athlete.id));
  const active = (links ?? []).find((l) => l.unlinked_at === null);
  if (active?.coach_id !== coach.id) {
    const now = new Date().toISOString();
    await must(db.from('coach_athletes').update({ unlinked_at: now }).eq('athlete_id', athlete.id).is('unlinked_at', null));
    await must(db.from('coach_athletes').upsert({ coach_id: coach.id, athlete_id: athlete.id, linked_at: now, unlinked_at: null }));
    console.log(`✓ ${email} vinculado con ${coach.name}`);
  } else {
    console.log(`✓ ${email} ya estaba con ${coach.name}`);
  }

  let made = 0;
  let changed = 0;
  for (let n = 0; n < days; n++) {
    const day = madridDay(n);
    const { data: had } = await must(db.from('sessions').select('id, version').eq('coach_id', coach.id).eq('athlete_id', athlete.id).eq('day', day).maybeSingle());
    const body = { blocks: BLOCKS };
    if (had) {
      await must(db.from('sessions').update({ minutes: MINUTES, body, schema_version: 1, version: had.version + 1, updated_at: new Date().toISOString() }).eq('id', had.id));
      changed++;
    } else {
      await must(db.from('sessions').insert({ coach_id: coach.id, athlete_id: athlete.id, day, minutes: MINUTES, schema_version: 1, body }));
      made++;
    }
  }
  console.log(`✓ Rutina de ${MINUTES}' del ${madridDay(0)} al ${madridDay(days - 1)}: ${made} nuevas, ${changed} actualizadas`);
}

main().catch((e) => {
  console.error('✕', e?.message ?? e);
  process.exit(1);
});
