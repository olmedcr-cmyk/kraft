-- KRAFT · buscar entrenador sin vincular.
-- K7Coach: con la sexta cifra se ve quién es; solo «Vincular» cambia de entrenador (link_coach).
-- Antes, teclear el código ya desvinculaba del anterior sin confirmar.
-- Cuenta como intento, igual que link_coach (10 por hora entre las dos): no sirve para adivinar códigos.

create function public.find_coach(p_code text)
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
  return query select c.id, c.name, c.modes;
end $$;

revoke execute on function public.find_coach(text) from public, anon, authenticated;
grant execute on function public.find_coach(text) to authenticated;

-- Al volver a entrar (otra vez, u otro móvil) la app recupera tu entrenador sin repetir el alta.
-- Necesita su código para enseñarlo en Tú; ya lo conoces porque lo escribiste para vincularte.
create or replace view public.my_coach with (security_barrier) as
  select c.id, c.name, c.modes, c.price_cents, ca.linked_at, c.code
  from public.coaches c
  join public.coach_athletes ca on ca.coach_id = c.id
  where ca.athlete_id = auth.uid() and ca.unlinked_at is null;
