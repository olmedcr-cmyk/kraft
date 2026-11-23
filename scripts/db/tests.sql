-- Tests de seguridad (RLS) y reglas de negocio. Se corren con scripts/db/test.sh.
-- Cada bloque `do` comprueba una cosa; si falla, para con el mensaje.
--
-- Personas: Elena (entrenadora 472913), Ana y Bea (atletas), Rafa (otro entrenador 111111).
\set elena '''00000000-0000-0000-0000-0000000000e1'''
\set ana   '''00000000-0000-0000-0000-0000000000a1'''
\set bea   '''00000000-0000-0000-0000-0000000000b1'''
\set rafa  '''00000000-0000-0000-0000-0000000000f1'''

-- Como superusuario: preparar el mundo.
insert into auth.users (id, email, raw_user_meta_data) values
  (:elena, 'elena@example.com', '{"name": "Elena"}'),
  (:ana, 'ana@example.com', '{"name": "Ana"}'),
  (:bea, 'bea@example.com', '{}'),
  (:rafa, 'rafa@example.com', '{"name": "Rafa"}');

do $$ begin
  assert (select count(*) from public.profiles) = 4, 'cada usuario nuevo tiene perfil';
  assert (select name from public.profiles where id = '00000000-0000-0000-0000-0000000000a1') = 'Ana', 'el nombre viene de Auth';
end $$;

update public.profiles set role = 'coach' where id in (:elena, :rafa);
insert into public.coaches (id, code, name, modes) values
  (:elena, '472913', 'Elena', '{grupo,solo,online}'),
  (:rafa, '111111', 'Rafa', '{grupo}');

-- Clases de Elena: una de 1 plaza dentro de 1 día, otra que empieza en 1 h, otra llena dentro de 2 días,
-- y una del mes pasado a la que Ana fue.
insert into public.slots (id, coach_id, mode, starts_at, minutes, name, capacity) values
  ('00000000-0000-0000-0000-00000000c001', :elena, 'solo', now() + interval '1 day', 50, 'Personal', 1),
  ('00000000-0000-0000-0000-00000000c002', :elena, 'grupo', now() + interval '1 hour', 50, 'Fuerza', 12),
  ('00000000-0000-0000-0000-00000000c003', :elena, 'grupo', now() + interval '2 days', 50, 'Funcional', 1),
  ('00000000-0000-0000-0000-00000000c004', :elena, 'grupo',
     (date_trunc('month', now() at time zone 'Europe/Madrid') - interval '10 days' + interval '18 hours') at time zone 'Europe/Madrid', 50, 'Movilidad', 12),
  ('00000000-0000-0000-0000-00000000c005', :rafa, 'grupo', now() + interval '1 day', 50, 'De Rafa', 12);

insert into public.sessions (coach_id, athlete_id, day, minutes, body) values
  (:elena, null, current_date, 50, '{"blocks": [{"id": "grupo"}]}'),
  (:elena, :ana, current_date + 1, 30, '{"blocks": [{"id": "solo-ana"}]}');

-- ─── Sin cuenta ─────────────────────────────────────────────────────────────
set role anon;
do $$ begin
  begin perform 1 from public.profiles; raise exception 'FALLO'; exception when insufficient_privilege then null; end;
  begin perform public.link_coach('472913'); raise exception 'FALLO'; exception when insufficient_privilege then null; end;
  begin perform 1 from public.my_coach; raise exception 'FALLO'; exception when insufficient_privilege then null; end;
end $$;
reset role;

-- ─── Ana ────────────────────────────────────────────────────────────────────
select set_config('request.jwt.claim.sub', :ana, false);
set role authenticated;

do $$ begin
  assert (select count(*) from public.profiles) = 1, 'Ana solo ve su perfil';
  assert (select count(*) from public.coaches) = 0, 'Ana no puede listar entrenadores ni códigos';
  assert (select count(*) from public.slots) = 0, 'sin vincular no ve clases';
  assert (select count(*) from public.sessions) = 1, 'sin vincular solo ve su sesión propia';
end $$;

-- No puede hacerse entrenadora ni marcar su borrado a mano.
do $$ begin
  begin update public.profiles set role = 'coach'; raise exception 'FALLO'; exception when insufficient_privilege then null; end;
  begin update public.profiles set delete_requested_at = now(); raise exception 'FALLO'; exception when insufficient_privilege then null; end;
  update public.profiles set name = 'Ana G.', share_effort = true;
  assert (select name from public.profiles) = 'Ana G.', 'puede cambiar su nombre';
end $$;

-- Buscar por código enseña quién es, pero no vincula (solo «Vincular» lo hace).
do $$ begin
  assert (select name from public.find_coach('472913')) = 'Elena', 'buscar: Elena';
  assert (select count(*) from public.find_coach('000000')) = 0, 'buscar código erróneo: nada';
  assert (select count(*) from public.my_coach) = 0, 'buscar no vincula';
end $$;

-- Código: el malo no dice nada; el bueno vincula.
do $$ begin
  assert (select count(*) from public.link_coach('000000')) = 0, 'código erróneo: sin resultado';
  assert (select name from public.link_coach('472913')) = 'Elena', 'código bueno: Elena';
  assert (select name from public.my_coach) = 'Elena', 'my_coach es Elena';
  assert (select code from public.my_coach) = '472913', 'my_coach trae su código (para volver a entrar)';
  assert (select count(*) from public.coaches) = 0, 'vinculada, sigue sin ver la tabla de entrenadores';
  assert (select count(*) from public.slots) = 4, 've las 4 clases de Elena, no la de Rafa';
  assert (select count(*) from public.sessions) = 2, 've la de grupo y la suya';
end $$;

-- Escribir directo en tablas de reglas: prohibido.
do $$ begin
  begin insert into public.bookings (slot_id, athlete_id, status) values ('00000000-0000-0000-0000-00000000c001', auth.uid(), 'confirmed'); raise exception 'FALLO';
  exception when insufficient_privilege then null; end;
  begin insert into public.payments (athlete_id, month, amount_cents, method) values (auth.uid(), '2026-01', 1, 'bizum'); raise exception 'FALLO';
  exception when insufficient_privilege then null; end;
  begin insert into public.coach_athletes (coach_id, athlete_id) values ('00000000-0000-0000-0000-0000000000f1', auth.uid()); raise exception 'FALLO';
  exception when insufficient_privilege then null; end;
  begin perform public.purge_deleted_accounts(); raise exception 'FALLO'; exception when insufficient_privilege then null; end;
  begin perform public.month_bill(auth.uid(), auth.uid(), '2026-01'); raise exception 'FALLO'; exception when insufficient_privilege then null; end;
end $$;

-- Entrenos: reenviar el mismo no duplica.
insert into public.workouts (client_id, day, minutes, tabatas, effort, note)
  values ('00000000-0000-0000-0000-0000000000d1', current_date, 42, 2, 7, 'Rodilla bien');
insert into public.workouts (client_id, day, minutes, tabatas, effort, note)
  values ('00000000-0000-0000-0000-0000000000d1', current_date, 42, 2, 7, 'Rodilla bien')
  on conflict (athlete_id, client_id) do update set minutes = excluded.minutes;
do $$ begin
  assert (select count(*) from public.workouts) = 1, 'un solo entreno tras reenviar';
  begin insert into public.workouts (athlete_id, client_id, day, minutes) values ('00000000-0000-0000-0000-0000000000b1', gen_random_uuid(), current_date, 1); raise exception 'FALLO';
  exception when insufficient_privilege then null; end;
end $$;

-- Reservar: la de 1 plaza, confirmada.
do $$ declare b public.bookings; begin
  b := public.book_slot('00000000-0000-0000-0000-00000000c001');
  assert b.status = 'confirmed', 'Ana: plaza confirmada';
  b := public.book_slot('00000000-0000-0000-0000-00000000c001');
  assert (select count(*) from public.bookings) = 1, 'reservar dos veces no duplica';
  begin perform public.book_slot('00000000-0000-0000-0000-00000000c005'); raise exception 'FALLO';
  exception when no_data_found then null; end;
end $$;
reset role;

-- ─── Bea ────────────────────────────────────────────────────────────────────
select set_config('request.jwt.claim.sub', :bea, false);
set role authenticated;
do $$ declare b public.bookings; begin
  assert (select count(*) from public.workouts) = 0, 'Bea no ve los entrenos de Ana';
  assert (select count(*) from public.sessions) = 0, 'Bea sin vincular no ve sesiones';
  perform public.link_coach('472913');
  assert (select count(*) from public.sessions) = 1, 'Bea ve la de grupo, no la de Ana';
  assert (select count(*) from public.bookings) = 0, 'Bea no ve la reserva de Ana';
  assert (select taken from public.slot_availability where slot_id = '00000000-0000-0000-0000-00000000c001') = 1, 'pero sí que la plaza está cogida';
  b := public.book_slot('00000000-0000-0000-0000-00000000c001', true);
  assert b.status = 'waitlist' and b.position = 1, 'Bea: lista de espera, la primera';
end $$;
reset role;

-- Ana cancela con tiempo: gratis, y Bea entra sola.
select set_config('request.jwt.claim.sub', :ana, false);
set role authenticated;
do $$ declare b public.bookings; begin
  b := public.cancel_booking((select id from public.bookings where slot_id = '00000000-0000-0000-0000-00000000c001'));
  assert b.status = 'cancelled', 'más de 2 h antes: cancelada gratis';
  -- Tarde: dentro de las 2 h se cobra.
  b := public.book_slot('00000000-0000-0000-0000-00000000c002');
  b := public.cancel_booking(b.id);
  assert b.status = 'late_cancel', 'menos de 2 h: cuenta como clase';
  -- Mover a una clase llena no la deja sin plaza.
  b := public.book_slot('00000000-0000-0000-0000-00000000c003');
  assert b.status = 'confirmed', 'Ana coge la última plaza de Funcional';
end $$;
reset role;

do $$ begin
  assert (select status from public.bookings where athlete_id = '00000000-0000-0000-0000-0000000000b1' and slot_id = '00000000-0000-0000-0000-00000000c001') = 'confirmed',
    'Bea sube de la lista de espera';
  assert (select position from public.bookings where athlete_id = '00000000-0000-0000-0000-0000000000b1' and slot_id = '00000000-0000-0000-0000-00000000c001') is null,
    'confirmada, sin puesto';
end $$;

select set_config('request.jwt.claim.sub', :bea, false);
set role authenticated;
do $$ declare b public.bookings; mine uuid; begin
  mine := (select id from public.bookings where slot_id = '00000000-0000-0000-0000-00000000c001');
  begin perform public.move_booking(mine, '00000000-0000-0000-0000-00000000c003'); raise exception 'FALLO';
  exception when raise_exception then
    if sqlerrm = 'FALLO' then raise; end if;
  end;
  assert (select status from public.bookings where id = mine) = 'confirmed', 'tras mover a una llena, conserva su plaza';
  -- Llegar: solo el día de la clase (la suya es mañana).
  begin perform public.set_arrived(mine, true); raise exception 'FALLO';
  exception when raise_exception then if sqlerrm = 'FALLO' then raise; end if; end;
end $$;
reset role;

-- ─── Elena (entrenadora) ────────────────────────────────────────────────────
select set_config('request.jwt.claim.sub', :elena, false);
set role authenticated;
do $$ begin
  assert (select count(*) from public.workouts) = 0, 'Elena no lee la tabla de entrenos directamente';
  assert (select effort from public.coach_workouts) = 7, 'Elena ve el esfuerzo que Ana comparte';
  assert (select count(*) from public.my_athletes) = 2, 'Elena ve a sus 2 atletas';
  assert (select count(*) from public.bookings) >= 3, 'Elena ve las reservas de sus clases';
  -- No puede mandar sesiones a quien no es suyo.
  begin insert into public.sessions (coach_id, athlete_id, day, minutes, body) values (auth.uid(), '00000000-0000-0000-0000-0000000000f1', current_date, 10, '{"blocks": []}');
    raise exception 'FALLO';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- Ana deja de compartir: Elena deja de ver esfuerzo y notas.
update public.profiles set share_effort = false where id = :ana;
select set_config('request.jwt.claim.sub', :elena, false);
set role authenticated;
do $$ begin
  assert (select effort is null and note is null and minutes = 42 from public.coach_workouts), 'sin compartir: minutos sí, esfuerzo y nota no';
end $$;
reset role;

-- Rafa no ve nada de Elena.
select set_config('request.jwt.claim.sub', :rafa, false);
set role authenticated;
do $$ begin
  assert (select count(*) from public.coach_workouts) = 0, 'Rafa no ve entrenos de atletas ajenos';
  assert (select count(*) from public.my_athletes) = 0, 'Rafa no tiene atletas';
  assert (select count(*) from public.bookings) = 0, 'Rafa no ve reservas ajenas';
end $$;
reset role;

-- ─── Pagos ──────────────────────────────────────────────────────────────────
-- Ana fue a Movilidad el mes pasado (8 €).
insert into public.bookings (slot_id, athlete_id, status, arrived_at)
  values ('00000000-0000-0000-0000-00000000c004', :ana, 'confirmed', now() - interval '20 days');

select set_config('request.jwt.claim.sub', :ana, false);
set role authenticated;
do $$ declare
  last text := to_char(date_trunc('month', now() at time zone 'Europe/Madrid') - interval '1 day', 'YYYY-MM');
  this text := to_char(now() at time zone 'Europe/Madrid', 'YYYY-MM');
  p public.payments;
begin
  assert public.my_bill(last) = 800, 'el mes pasado debe 8 €';
  begin perform public.simulate_payment(this, 'bizum'); raise exception 'FALLO';
  exception when raise_exception then if sqlerrm = 'FALLO' then raise; end if; end;
  p := public.simulate_payment(last, 'bizum');
  assert p.amount_cents = 800 and p.payer_name = 'Ana G.', 'pago con el importe del servidor';
  begin perform public.simulate_payment(last, 'tarjeta'); raise exception 'FALLO';
  exception when raise_exception then if sqlerrm = 'FALLO' then raise; end if; end;
  assert (select count(*) from public.payments) = 1, 've su pago';
  assert jsonb_array_length(public.export_my_data() -> 'workouts') = 1, 'la exportación trae sus entrenos';
  assert jsonb_array_length(public.export_my_data() -> 'payments') = 1, 'y sus pagos';
end $$;

-- Límite de intentos de código.
do $$ begin
  for i in 1..6 loop perform public.link_coach('999999'); end loop; -- ya llevaba 4 (2 buscando, 2 vinculando)
  begin perform public.link_coach('472913'); raise exception 'FALLO';
  exception when raise_exception then if sqlerrm = 'FALLO' then raise; end if; end;
end $$;

-- Pide borrar la cuenta.
do $$ begin
  assert public.request_deletion() > now() + interval '29 days', 'se borra en 30 días';
end $$;
reset role;

-- ─── Borrado a los 30 días ──────────────────────────────────────────────────
do $$ begin
  assert public.purge_deleted_accounts() = 0, 'antes de 30 días no se borra';
end $$;
update public.profiles set delete_requested_at = now() - interval '31 days' where id = :ana;
do $$ begin
  assert public.purge_deleted_accounts() = 1, 'a los 30 días se borra';
  assert not exists (select 1 from auth.users where id = '00000000-0000-0000-0000-0000000000a1'), 'usuario borrado';
  assert not exists (select 1 from public.workouts), 'sus entrenos, borrados';
  assert (select count(*) from public.payments where athlete_id is null and payer_name = 'Ana G.') = 1, 'el recibo se queda, sin enlace';
end $$;

-- Lista de espera de clases empezadas: se cierra.
update public.slots set starts_at = now() - interval '1 minute' where id = '00000000-0000-0000-0000-00000000c003';
insert into public.bookings (slot_id, athlete_id, status, position) values ('00000000-0000-0000-0000-00000000c003', :bea, 'waitlist', 1);
do $$ begin
  assert public.close_started_waitlists() = 1, 'cierra la lista de la clase empezada';
end $$;

-- ─── Funciones por clase (20261106140000) ───────────────────────────────────
insert into public.slots (id, coach_id, mode, starts_at, minutes, name, capacity) values
  ('00000000-0000-0000-0000-00000000c006', :elena, 'grupo', now() + interval '3 days', 50, 'Core', 1),
  ('00000000-0000-0000-0000-00000000c007', :elena, 'grupo', now() + interval '4 days', 50, 'Core', 12);
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000c1', 'cris@example.com');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', false);
set role authenticated;
do $$ declare b public.bookings; begin
  perform public.link_coach('472913');
  begin perform public.cancel_slot('00000000-0000-0000-0000-00000000c006'); raise exception 'FALLO';
  exception when no_data_found then null; end;
  b := public.book_slot('00000000-0000-0000-0000-00000000c006');
  b := public.move_slot('00000000-0000-0000-0000-00000000c006', '00000000-0000-0000-0000-00000000c007');
  assert b.status = 'confirmed' and b.slot_id = '00000000-0000-0000-0000-00000000c007', 'move_slot: pasa a la nueva clase';
  assert (select status from public.bookings where slot_id = '00000000-0000-0000-0000-00000000c006') = 'cancelled', 'y la vieja queda cancelada';
  b := public.cancel_slot('00000000-0000-0000-0000-00000000c007');
  assert b.status = 'cancelled', 'cancel_slot: cancelada';
  begin perform public.set_auto_join('00000000-0000-0000-0000-00000000c007', false); raise exception 'FALLO';
  exception when no_data_found then null; end;
  begin perform public.my_active_booking('00000000-0000-0000-0000-00000000c007'); raise exception 'FALLO';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
