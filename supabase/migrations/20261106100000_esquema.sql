-- KRAFT · esquema v1 (diseño: docs/superpowers/specs/2026-11-06-backend-supabase-design.md)
--
-- Seguridad: RLS en todas las tablas. Lo que tiene reglas de negocio (aforo, plazo de 2 h,
-- lista de espera, código de entrenador, pagos) solo se escribe con funciones `security definer`.
-- Importes en céntimos. Los meses y días de cobro se cuentan en hora de Madrid.

-- ─── Tipos ──────────────────────────────────────────────────────────────────

create type public.user_role as enum ('athlete', 'coach');
create type public.class_mode as enum ('grupo', 'solo', 'online');
create type public.booking_status as enum ('confirmed', 'waitlist', 'cancelled', 'late_cancel');
create type public.pay_method as enum ('tarjeta', 'bizum');

-- Zona horaria del negocio (v1: un solo centro, en España).
create function public.kraft_tz() returns text language sql immutable as $$ select 'Europe/Madrid' $$;

-- Plazo de cancelación gratis.
create function public.free_cancel() returns interval language sql immutable as $$ select interval '2 hours' $$;

-- ─── Tablas ─────────────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '' check (char_length(name) <= 80),
  role public.user_role not null default 'athlete',
  -- Aceptó términos y privacidad y confirmó 14 años o más.
  accepted_at timestamptz,
  -- Esfuerzo y notas al entrenador (KL1). Sesiones y pagos los ve siempre.
  share_effort boolean not null default true,
  -- RGPD: apagados por defecto.
  analytics boolean not null default false,
  emails boolean not null default false,
  health boolean not null default false,
  -- Borrado pedido: se ejecuta a los 30 días.
  delete_requested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.coaches (
  id uuid primary key references public.profiles (id) on delete cascade,
  code char(6) not null unique check (code ~ '^[0-9]{6}$'),
  name text not null check (char_length(name) between 1 and 80),
  modes public.class_mode[] not null default '{grupo}',
  -- Precio por clase según modo, en céntimos.
  price_cents jsonb not null default '{"grupo": 800, "solo": 3000, "online": 500}'
);

create table public.coach_athletes (
  coach_id uuid not null references public.coaches (id) on delete cascade,
  athlete_id uuid not null references public.profiles (id) on delete cascade,
  linked_at timestamptz not null default now(),
  unlinked_at timestamptz,
  primary key (coach_id, athlete_id)
);
create index coach_athletes_athlete on public.coach_athletes (athlete_id) where unlinked_at is null;

-- Sesión del entrenador. `athlete_id` nulo = para todo su grupo; una propia del atleta manda sobre la de grupo.
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches (id) on delete cascade,
  athlete_id uuid references public.profiles (id) on delete cascade,
  day date not null,
  minutes int not null check (minutes between 1 and 600),
  schema_version int not null default 1 check (schema_version >= 1),
  body jsonb not null check (jsonb_typeof(body -> 'blocks') = 'array'),
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index sessions_one_per_day on public.sessions (coach_id, coalesce(athlete_id, '00000000-0000-0000-0000-000000000000'::uuid), day);
create index sessions_athlete_day on public.sessions (athlete_id, day);

-- Lo entrenado en la app (sesión o tiempo libre). `client_id`: el reenvío desde la cola no duplica.
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  client_id uuid not null,
  day date not null,
  minutes int not null check (minutes between 0 and 1440),
  tabatas int not null default 0 check (tabatas between 0 and 200),
  session_id uuid references public.sessions (id) on delete set null,
  effort smallint check (effort between 1 and 10),
  note text check (char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  unique (athlete_id, client_id)
);
create index workouts_athlete_day on public.workouts (athlete_id, day);

create table public.slots (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches (id) on delete cascade,
  mode public.class_mode not null,
  starts_at timestamptz not null,
  minutes int not null check (minutes between 5 and 600),
  name text not null check (char_length(name) between 1 and 80),
  room int,
  floor int,
  directions text,
  -- 0 = sin límite (online).
  capacity int not null default 0 check (capacity >= 0),
  bring jsonb not null default '[]' check (jsonb_typeof(bring) = 'array'),
  created_at timestamptz not null default now()
);
create index slots_coach_start on public.slots (coach_id, starts_at);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.slots (id) on delete cascade,
  athlete_id uuid not null references public.profiles (id) on delete cascade,
  status public.booking_status not null,
  -- Puesto en la lista de espera (1 = la siguiente).
  position int check (position >= 1),
  auto_join boolean not null default false,
  arrived_at timestamptz,
  booked_at timestamptz not null default now(),
  cancelled_at timestamptz,
  check ((status = 'waitlist') = (position is not null))
);
create unique index bookings_one_active on public.bookings (slot_id, athlete_id) where status in ('confirmed', 'waitlist');
create index bookings_athlete on public.bookings (athlete_id);

-- Solo el servidor escribe pagos. Al borrar la cuenta se quedan (lo pide la ley), sin enlace al usuario.
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references public.profiles (id) on delete set null,
  coach_id uuid references public.coaches (id) on delete set null,
  month char(7) not null check (month ~ '^[0-9]{4}-[0-9]{2}$'),
  amount_cents int not null check (amount_cents > 0),
  method public.pay_method not null,
  provider_ref text,
  -- Copiado para el recibo: sigue valiendo aunque se borre el perfil.
  payer_name text not null default '',
  paid_at timestamptz not null default now(),
  receipt_sent_at timestamptz,
  unique (athlete_id, coach_id, month)
);

-- Intentos de código de entrenador: frena a quien prueba códigos a ciegas.
create table public.link_attempts (
  athlete_id uuid not null references public.profiles (id) on delete cascade,
  at timestamptz not null default now()
);
create index link_attempts_recent on public.link_attempts (athlete_id, at);

-- ─── updated_at ─────────────────────────────────────────────────────────────

create function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger sessions_touch before update on public.sessions for each row execute function public.touch_updated_at();

-- Cada usuario nuevo de Auth tiene su perfil de atleta.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, name) values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ─── Ayudas para las reglas ─────────────────────────────────────────────────

-- ¿Es `athlete` atleta activo de `coach`?
create function public.is_linked(coach uuid, athlete uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.coach_athletes ca
    where ca.coach_id = coach and ca.athlete_id = athlete and ca.unlinked_at is null
  )
$$;

-- Entrenador activo del atleta (uno a la vez).
create function public.current_coach(athlete uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select ca.coach_id from public.coach_athletes ca
  where ca.athlete_id = athlete and ca.unlinked_at is null
  order by ca.linked_at desc limit 1
$$;

-- ─── RLS ────────────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.coaches enable row level security;
alter table public.coach_athletes enable row level security;
alter table public.sessions enable row level security;
alter table public.workouts enable row level security;
alter table public.slots enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.link_attempts enable row level security;

-- Nadie sin cuenta toca nada (las funciones se cierran al final, cuando ya existen).
revoke all on all tables in schema public from anon;

-- Perfil: el tuyo. El rol y el borrado no se cambian a mano (columnas sin permiso de escritura).
create policy profiles_own_read on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_own_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
revoke insert, update, delete on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (name, accepted_at, share_effort, analytics, emails, health) on public.profiles to authenticated;

-- Entrenadores: cada uno ve su ficha. Los atletas la ven por `my_coach` (así no se pueden listar códigos).
create policy coaches_own on public.coaches for select to authenticated using (id = auth.uid());
revoke insert, update, delete on public.coaches from authenticated;
grant select on public.coaches to authenticated;

-- Vínculos: los ven las dos partes; solo se escriben con link_coach / unlink_coach.
create policy coach_athletes_parties on public.coach_athletes for select to authenticated
  using (athlete_id = auth.uid() or coach_id = auth.uid());
revoke insert, update, delete on public.coach_athletes from authenticated;
grant select on public.coach_athletes to authenticated;

-- Sesiones: el atleta, las suyas y las de grupo de su entrenador; el entrenador, las de sus atletas.
create policy sessions_athlete_read on public.sessions for select to authenticated
  using (athlete_id = auth.uid() or (athlete_id is null and public.is_linked(coach_id, auth.uid())));
create policy sessions_coach_all on public.sessions for all to authenticated
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid() and (athlete_id is null or public.is_linked(auth.uid(), athlete_id)));
grant select, insert, update, delete on public.sessions to authenticated;

-- Entrenos: solo el atleta. El entrenador los ve por `coach_workouts` (sin esfuerzo ni notas si no se comparten).
create policy workouts_own on public.workouts for all to authenticated
  using (athlete_id = auth.uid()) with check (athlete_id = auth.uid());
grant select, insert, update, delete on public.workouts to authenticated;

-- Clases: las ven sus atletas; las escribe su entrenador.
create policy slots_athlete_read on public.slots for select to authenticated using (public.is_linked(coach_id, auth.uid()));
create policy slots_coach_all on public.slots for all to authenticated using (coach_id = auth.uid()) with check (coach_id = auth.uid());
grant select, insert, update, delete on public.slots to authenticated;

-- Reservas: el atleta ve las suyas; el entrenador, las de sus clases. Escribir, solo con funciones.
create policy bookings_own_read on public.bookings for select to authenticated using (athlete_id = auth.uid());
create policy bookings_coach_read on public.bookings for select to authenticated
  using (exists (select 1 from public.slots s where s.id = slot_id and s.coach_id = auth.uid()));
revoke insert, update, delete on public.bookings from authenticated;
grant select on public.bookings to authenticated;

-- Pagos: leer las dos partes; escribir, nadie desde la app.
create policy payments_parties on public.payments for select to authenticated
  using (athlete_id = auth.uid() or coach_id = auth.uid());
revoke insert, update, delete on public.payments from authenticated;
grant select on public.payments to authenticated;

-- Intentos: nadie desde la app.
revoke all on public.link_attempts from authenticated;

-- ─── Vistas (corren como su dueño: el filtro va dentro) ─────────────────────

-- Tu entrenador activo.
create view public.my_coach with (security_barrier) as
  select c.id, c.name, c.modes, c.price_cents, ca.linked_at
  from public.coaches c
  join public.coach_athletes ca on ca.coach_id = c.id
  where ca.athlete_id = auth.uid() and ca.unlinked_at is null;

-- Plazas ocupadas y lista de espera de las clases que puedes ver (sin decir quién).
create view public.slot_availability with (security_barrier) as
  select s.id as slot_id,
         count(b.*) filter (where b.status = 'confirmed')::int as taken,
         count(b.*) filter (where b.status = 'waitlist')::int as queue
  from public.slots s
  left join public.bookings b on b.slot_id = s.id
  where public.is_linked(s.coach_id, auth.uid()) or s.coach_id = auth.uid()
  group by s.id;

-- Para el entrenador: sus atletas y lo que entrenan; esfuerzo y notas solo si el atleta lo comparte.
create view public.my_athletes with (security_barrier) as
  select p.id, p.name, ca.linked_at
  from public.coach_athletes ca
  join public.profiles p on p.id = ca.athlete_id
  where ca.coach_id = auth.uid() and ca.unlinked_at is null;

create view public.coach_workouts with (security_barrier) as
  select w.id, w.athlete_id, w.day, w.minutes, w.tabatas, w.session_id,
         case when p.share_effort then w.effort end as effort,
         case when p.share_effort then w.note end as note,
         w.created_at
  from public.workouts w
  join public.profiles p on p.id = w.athlete_id
  where public.is_linked(auth.uid(), w.athlete_id);

revoke all on public.my_coach, public.slot_availability, public.my_athletes, public.coach_workouts from anon;
grant select on public.my_coach, public.slot_availability, public.my_athletes, public.coach_workouts to authenticated;

-- ─── Funciones de negocio ───────────────────────────────────────────────────

-- Vincular con el código del entrenador. Devuelve su ficha, o nada si el código no vale.
-- Máximo 10 intentos por hora: un código de 6 cifras no se puede adivinar a base de probar.
create function public.link_coach(p_code text)
returns table (id uuid, name text, modes public.class_mode[])
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  me uuid := auth.uid();
  c public.coaches;
begin
  if me is null then raise exception 'sin sesión' using errcode = '28000'; end if;
  if (select count(*) from public.link_attempts a where a.athlete_id = me and a.at > now() - interval '1 hour') >= 10 then
    raise exception 'demasiados intentos' using errcode = 'P0001', hint = 'espera';
  end if;
  insert into public.link_attempts (athlete_id) values (me);

  select * into c from public.coaches where code = p_code;
  if not found or c.id = me then return; end if;

  -- Un entrenador a la vez: el anterior deja de ver tus datos.
  update public.coach_athletes set unlinked_at = now()
    where athlete_id = me and coach_id <> c.id and unlinked_at is null;
  insert into public.coach_athletes (coach_id, athlete_id) values (c.id, me)
    on conflict (coach_id, athlete_id) do update set unlinked_at = null, linked_at = now();

  return query select c.id, c.name, c.modes;
end $$;

create function public.unlink_coach() returns void
language sql security definer set search_path = '' as $$
  update public.coach_athletes set unlinked_at = now() where athlete_id = auth.uid() and unlinked_at is null;
$$;

-- Reservar. Con plaza, confirmada; llena, a la lista de espera. La clase se bloquea para que
-- dos personas no se queden la última plaza a la vez.
create function public.book_slot(p_slot uuid, p_auto_join boolean default true)
returns public.bookings
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  s public.slots;
  b public.bookings;
  taken int;
begin
  select * into s from public.slots where id = p_slot for update;
  if not found or not public.is_linked(s.coach_id, me) then raise exception 'clase no encontrada' using errcode = 'P0002'; end if;
  if s.starts_at <= now() then raise exception 'la clase ya empezó' using errcode = 'P0001'; end if;

  select * into b from public.bookings where slot_id = p_slot and athlete_id = me and status in ('confirmed', 'waitlist');
  if found then return b; end if;

  select count(*) into taken from public.bookings where slot_id = p_slot and status = 'confirmed';
  if s.capacity = 0 or taken < s.capacity then
    insert into public.bookings (slot_id, athlete_id, status) values (p_slot, me, 'confirmed') returning * into b;
  else
    insert into public.bookings (slot_id, athlete_id, status, position, auto_join)
    values (p_slot, me, 'waitlist',
            coalesce((select max(position) from public.bookings where slot_id = p_slot and status = 'waitlist'), 0) + 1,
            p_auto_join)
    returning * into b;
  end if;
  return b;
end $$;

-- Sube a quien toque de la lista de espera si hay hueco (solo los que pidieron «entrar solo»).
create function public.promote_waitlist(p_slot uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  s public.slots;
  free int;
  nxt public.bookings;
begin
  select * into s from public.slots where id = p_slot for update;
  if s.starts_at <= now() then return; end if;
  loop
    select s.capacity - count(*) into free from public.bookings where slot_id = p_slot and status = 'confirmed';
    exit when s.capacity > 0 and free <= 0;
    select * into nxt from public.bookings
      where slot_id = p_slot and status = 'waitlist' and auto_join order by position limit 1;
    exit when not found;
    update public.bookings set status = 'confirmed', position = null where id = nxt.id;
    exit when s.capacity = 0;
  end loop;
  -- Renumera la lista: 1, 2, 3…
  update public.bookings b set position = r.n
    from (select id, row_number() over (order by position) as n from public.bookings
          where slot_id = p_slot and status = 'waitlist') r
    where b.id = r.id and b.position is distinct from r.n;
end $$;

-- Cancelar. Más de 2 h antes, gratis; después cuenta como clase (se cobra). Salir de la lista, siempre gratis.
create function public.cancel_booking(p_booking uuid)
returns public.bookings
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  b public.bookings;
  s public.slots;
begin
  select * into b from public.bookings where id = p_booking and athlete_id = me for update;
  if not found or b.status not in ('confirmed', 'waitlist') then raise exception 'reserva no encontrada' using errcode = 'P0002'; end if;
  select * into s from public.slots where id = b.slot_id;
  if s.starts_at <= now() then raise exception 'la clase ya empezó' using errcode = 'P0001'; end if;

  update public.bookings
    set status = case when b.status = 'confirmed' and now() > s.starts_at - public.free_cancel() then 'late_cancel'::public.booking_status else 'cancelled' end,
        position = null, cancelled_at = now()
    where id = b.id returning * into b;
  perform public.promote_waitlist(s.id);
  return b;
end $$;

-- Mover: reserva la nueva y cancela la anterior en un solo paso (con sus reglas de plazo).
create function public.move_booking(p_booking uuid, p_to uuid)
returns public.bookings
language plpgsql security definer set search_path = '' as $$
declare
  nb public.bookings;
begin
  nb := public.book_slot(p_to, true);
  -- Mover a una clase llena no te deja sin plaza: no se cambia nada.
  if nb.status <> 'confirmed' then raise exception 'la clase está llena' using errcode = 'P0001'; end if;
  perform public.cancel_booking(p_booking);
  return nb;
end $$;

-- Llego / no llego: el mismo día de la clase y con la reserva confirmada.
create function public.set_arrived(p_booking uuid, p_arrived boolean)
returns public.bookings
language plpgsql security definer set search_path = '' as $$
declare
  b public.bookings;
  s public.slots;
begin
  select * into b from public.bookings where id = p_booking and athlete_id = auth.uid() and status = 'confirmed' for update;
  if not found then raise exception 'reserva no encontrada' using errcode = 'P0002'; end if;
  select * into s from public.slots where id = b.slot_id;
  if (s.starts_at at time zone public.kraft_tz())::date <> (now() at time zone public.kraft_tz())::date then
    raise exception 'solo el día de la clase' using errcode = 'P0001';
  end if;
  update public.bookings set arrived_at = case when p_arrived then coalesce(arrived_at, now()) end where id = b.id returning * into b;
  return b;
end $$;

-- Lo que se debe de un mes con un entrenador: clases a las que fuiste + cancelaciones tardías.
create function public.month_bill(p_athlete uuid, p_coach uuid, p_month text)
returns int
language sql stable security definer set search_path = '' as $$
  select coalesce(sum((c.price_cents ->> s.mode::text)::int), 0)::int
  from public.bookings b
  join public.slots s on s.id = b.slot_id
  join public.coaches c on c.id = s.coach_id
  where b.athlete_id = p_athlete and s.coach_id = p_coach
    and to_char(s.starts_at at time zone public.kraft_tz(), 'YYYY-MM') = p_month
    and (b.arrived_at is not null or b.status = 'late_cancel')
$$;

-- Tu factura de un mes (con tu entrenador actual).
create function public.my_bill(p_month text) returns int
language sql stable security definer set search_path = '' as $$
  select public.month_bill(auth.uid(), public.current_coach(auth.uid()), p_month)
$$;

-- SOLO MIENTRAS NO HAYA PASARELA: marca un mes como pagado con el importe que calcula el servidor.
-- Se borra en la migración que traiga el pago real.
create function public.simulate_payment(p_month text, p_method public.pay_method)
returns public.payments
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  coach uuid := public.current_coach(auth.uid());
  amount int;
  p public.payments;
begin
  if coach is null then raise exception 'sin entrenador' using errcode = 'P0001'; end if;
  if p_month !~ '^[0-9]{4}-[0-9]{2}$' or p_month >= to_char(now() at time zone public.kraft_tz(), 'YYYY-MM') then
    raise exception 'el mes aún no está cerrado' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.payments where athlete_id = me and coach_id = coach and month = p_month) then
    raise exception 'ya está pagado' using errcode = 'P0001';
  end if;
  amount := public.month_bill(me, coach, p_month);
  if amount <= 0 then raise exception 'no hay nada que pagar' using errcode = 'P0001'; end if;
  insert into public.payments (athlete_id, coach_id, month, amount_cents, method, payer_name)
    values (me, coach, p_month, amount, p_method, (select name from public.profiles where id = me))
    returning * into p;
  return p;
end $$;

-- Pedir y anular el borrado de la cuenta (se ejecuta a los 30 días).
create function public.request_deletion() returns timestamptz
language sql security definer set search_path = '' as $$
  update public.profiles set delete_requested_at = coalesce(delete_requested_at, now()) where id = auth.uid()
  returning delete_requested_at + interval '30 days';
$$;

create function public.cancel_deletion() returns void
language sql security definer set search_path = '' as $$
  update public.profiles set delete_requested_at = null where id = auth.uid();
$$;

-- Todo lo tuyo (RGPD art. 15 y 20). La app lo pasa a CSV.
create function public.export_my_data() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(p) - 'id' from public.profiles p where p.id = auth.uid()),
    'coach', (select jsonb_build_object('name', c.name, 'linked_at', ca.linked_at)
              from public.coach_athletes ca join public.coaches c on c.id = ca.coach_id
              where ca.athlete_id = auth.uid() and ca.unlinked_at is null limit 1),
    'workouts', coalesce((select jsonb_agg(to_jsonb(w) - 'athlete_id' order by w.day) from public.workouts w where w.athlete_id = auth.uid()), '[]'),
    'bookings', coalesce((select jsonb_agg(jsonb_build_object('class', s.name, 'mode', s.mode, 'starts_at', s.starts_at, 'status', b.status, 'arrived_at', b.arrived_at) order by s.starts_at)
                          from public.bookings b join public.slots s on s.id = b.slot_id where b.athlete_id = auth.uid()), '[]'),
    'payments', coalesce((select jsonb_agg(to_jsonb(p) - 'athlete_id' - 'coach_id' order by p.month) from public.payments p where p.athlete_id = auth.uid()), '[]')
  )
$$;

-- ─── Tareas programadas ─────────────────────────────────────────────────────

-- Borra las cuentas con más de 30 días desde que se pidió. Los pagos se quedan sin enlace.
create function public.purge_deleted_accounts() returns int
language plpgsql security definer set search_path = '' as $$
declare
  n int;
begin
  with gone as (
    delete from auth.users u using public.profiles p
    where p.id = u.id and p.delete_requested_at < now() - interval '30 days'
    returning u.id
  ) select count(*) into n from gone;
  return n;
end $$;

-- Cierra la lista de espera de las clases que ya empezaron.
create function public.close_started_waitlists() returns int
language plpgsql security definer set search_path = '' as $$
declare
  n int;
begin
  with closed as (
    update public.bookings b set status = 'cancelled', position = null, cancelled_at = now()
    from public.slots s
    where s.id = b.slot_id and b.status = 'waitlist' and s.starts_at <= now()
    returning b.id
  ) select count(*) into n from closed;
  return n;
end $$;

-- Por defecto Postgres deja ejecutar cualquier función a todos (y Supabase, a anon y authenticated).
-- Se cierra todo y se abre solo lo que la app usa. `is_linked` la necesitan las reglas RLS.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.link_coach(text), public.unlink_coach(), public.book_slot(uuid, boolean),
  public.cancel_booking(uuid), public.move_booking(uuid, uuid), public.set_arrived(uuid, boolean), public.my_bill(text),
  public.simulate_payment(text, public.pay_method), public.request_deletion(), public.cancel_deletion(),
  public.export_my_data(), public.is_linked(uuid, uuid), public.kraft_tz(), public.free_cancel()
  to authenticated;

-- pg_cron existe en Supabase; en un Postgres de pruebas puede no estar.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('kraft-purge-deleted', '15 3 * * *', 'select public.purge_deleted_accounts()');
    perform cron.schedule('kraft-close-waitlists', '*/5 * * * *', 'select public.close_started_waitlists()');
  end if;
end $$;
