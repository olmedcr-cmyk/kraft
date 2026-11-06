-- KRAFT · reservas por clase.
-- La app trabaja sin red: cuando reservas offline aún no conoce el id de la reserva, solo el de la clase.
-- Estas funciones buscan tu reserva activa en esa clase y aplican las mismas reglas que las de 20261106100000.

create function public.my_active_booking(p_slot uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select id from public.bookings
  where slot_id = p_slot and athlete_id = auth.uid() and status in ('confirmed', 'waitlist')
$$;

-- Cancelar tu reserva (o salir de la lista) de esa clase.
create function public.cancel_slot(p_slot uuid) returns public.bookings
language plpgsql security definer set search_path = '' as $$
declare
  b uuid := public.my_active_booking(p_slot);
begin
  if b is null then raise exception 'reserva no encontrada' using errcode = 'P0002'; end if;
  return public.cancel_booking(b);
end $$;

-- Mover tu reserva de una clase a otra.
create function public.move_slot(p_from uuid, p_to uuid) returns public.bookings
language plpgsql security definer set search_path = '' as $$
declare
  b uuid := public.my_active_booking(p_from);
begin
  if b is null then raise exception 'reserva no encontrada' using errcode = 'P0002'; end if;
  return public.move_booking(b, p_to);
end $$;

-- Llego / no llego a esa clase.
create function public.arrive_slot(p_slot uuid, p_arrived boolean) returns public.bookings
language plpgsql security definer set search_path = '' as $$
declare
  b uuid := public.my_active_booking(p_slot);
begin
  if b is null then raise exception 'reserva no encontrada' using errcode = 'P0002'; end if;
  return public.set_arrived(b, p_arrived);
end $$;

-- Entrar solo si se libera plaza (lista de espera).
create function public.set_auto_join(p_slot uuid, p_auto boolean) returns public.bookings
language plpgsql security definer set search_path = '' as $$
declare
  b public.bookings;
begin
  update public.bookings set auto_join = p_auto
    where id = public.my_active_booking(p_slot) and status = 'waitlist'
    returning * into b;
  if not found then raise exception 'no estás en la lista de espera' using errcode = 'P0002'; end if;
  return b;
end $$;

revoke execute on function public.my_active_booking(uuid), public.cancel_slot(uuid), public.move_slot(uuid, uuid),
  public.arrive_slot(uuid, boolean), public.set_auto_join(uuid, boolean) from public, anon, authenticated;
grant execute on function public.cancel_slot(uuid), public.move_slot(uuid, uuid),
  public.arrive_slot(uuid, boolean), public.set_auto_join(uuid, boolean) to authenticated;
