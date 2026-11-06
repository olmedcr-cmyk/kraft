/**
 * Prueba de humo contra el Supabase real: dos atletas de prueba entran con código de email,
 * se vinculan con Elena, reservan, entrenan y comprueban que no se ven entre sí. Al final se borran.
 *
 *   node --env-file=.env.local scripts/probar-remoto.ts
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { validateSession } from '../src/session/validate.ts';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const anon = process.env.EXPO_PUBLIC_SUPABASE_KEY!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !anon || !service) throw new Error('Faltan claves en .env.local');

const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
const created: string[] = [];
let fails = 0;

function ok(cond: unknown, msg: string) {
  if (cond) console.log(`  ✓ ${msg}`);
  else {
    fails++;
    console.log(`  ✕ ${msg}`);
  }
}

/** Crea el usuario y entra como lo haría la app: código de email (OTP) verificado con la clave pública. */
async function athlete(name: string): Promise<{ db: SupabaseClient; id: string }> {
  const email = `${name.toLowerCase()}-prueba-${Date.now()}@kraft.example`;
  const { data: u, error } = await admin.auth.admin.createUser({ email, email_confirm: true, user_metadata: { name } });
  if (error) throw error;
  created.push(u.user.id);
  const { data: link, error: e2 } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (e2) throw e2;
  const otp = link.properties.email_otp;
  ok(/^\d{6}$/.test(otp), `${name}: el código de email tiene 6 cifras`);
  const db = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: e3 } = await db.auth.verifyOtp({ email, token: otp, type: 'email' });
  if (e3) throw e3;
  return { db, id: u.user.id };
}

async function main() {
  console.log('Ana');
  const ana = await athlete('Ana');
  ok((await ana.db.from('profiles').select('name')).data?.[0]?.name === 'Ana', 've su perfil, con su nombre');
  ok((await ana.db.from('profiles').select('id')).data?.length === 1, 'solo ve su perfil');
  ok((await ana.db.from('coaches').select('id')).data?.length === 0, 'no puede listar entrenadores ni códigos');
  ok((await ana.db.from('slots').select('id')).data?.length === 0, 'sin vincular no ve clases');
  ok((await ana.db.rpc('link_coach', { p_code: '000000' })).data?.length === 0, 'código erróneo: nada');
  const link = await ana.db.rpc('link_coach', { p_code: '472913' });
  ok(link.data?.[0]?.name === 'Elena', 'código 472913: Elena');
  ok((await ana.db.from('my_coach').select('name')).data?.[0]?.name === 'Elena', 'my_coach: Elena');

  const slots = (await ana.db.from('slots').select('id, starts_at, mode, capacity').gt('starts_at', new Date(Date.now() + 3 * 3600_000).toISOString()).order('starts_at')).data ?? [];
  ok(slots.length > 50, `ve las clases de Elena (${slots.length})`);

  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date());
  const ses = (await ana.db.from('sessions').select('id, day, minutes, schema_version, body').eq('day', today)).data?.[0];
  const v = validateSession(ses, { name: 'Elena' });
  ok(v.ok, `la sesión de hoy llega y pasa la validación${v.ok ? '' : `: ${v.error}`}`);

  const grupo = slots.find((s) => s.mode === 'grupo')!;
  const b = await ana.db.rpc('book_slot', { p_slot: grupo.id, p_auto_join: true });
  ok(b.data?.status === 'confirmed', 'reserva una clase de grupo');
  ok((await ana.db.from('slot_availability').select('taken').eq('slot_id', grupo.id)).data?.[0]?.taken >= 1, 'la plaza cuenta como ocupada');
  const direct = await ana.db.from('bookings').insert({ slot_id: grupo.id, athlete_id: ana.id, status: 'confirmed' });
  ok(direct.error, 'no puede escribir reservas a mano');
  const pay = await ana.db.from('payments').insert({ athlete_id: ana.id, month: '2026-01', amount_cents: 1, method: 'bizum' });
  ok(pay.error, 'no puede apuntarse pagos');

  const w = { client_id: crypto.randomUUID(), day: today, minutes: 42, tabatas: 2, effort: 4, note: 'Prueba' };
  await ana.db.from('workouts').upsert(w, { onConflict: 'athlete_id,client_id', ignoreDuplicates: true });
  await ana.db.from('workouts').upsert(w, { onConflict: 'athlete_id,client_id', ignoreDuplicates: true });
  ok((await ana.db.from('workouts').select('id')).data?.length === 1, 'reenviar el mismo entreno no duplica');
  const exp = await ana.db.rpc('export_my_data');
  ok(exp.data?.workouts?.length === 1 && exp.data?.bookings?.length === 1, 'la exportación trae entrenos y reservas');

  console.log('Bea');
  const bea = await athlete('Bea');
  await bea.db.rpc('link_coach', { p_code: '472913' });
  ok((await bea.db.from('workouts').select('id')).data?.length === 0, 'no ve los entrenos de Ana');
  ok((await bea.db.from('bookings').select('id')).data?.length === 0, 'no ve las reservas de Ana');
  ok((await bea.db.from('profiles').select('id')).data?.length === 1, 'no ve el perfil de Ana');

  console.log('Ana cancela');
  const c = await ana.db.rpc('cancel_booking', { p_booking: b.data.id });
  ok(c.data?.status === 'cancelled', 'con más de 2 h, gratis');

  const del = await ana.db.rpc('request_deletion');
  ok(del.data && new Date(del.data).getTime() > Date.now() + 29 * 86_400_000, 'pedir borrado: en 30 días');
}

main()
  .catch((e) => {
    fails++;
    console.error('✕', e?.message ?? e);
  })
  .finally(async () => {
    for (const id of created) await admin.auth.admin.deleteUser(id);
    console.log(`Usuarios de prueba borrados (${created.length}).`);
    console.log(fails ? `✕ ${fails} fallos` : '✓ Supabase real: todo bien');
    process.exit(fails ? 1 : 0);
  });
