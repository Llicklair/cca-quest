-- Sincronización de CCA Quest en Supabase: un almacén clave → JSON.
-- Se pega una vez en el SQL Editor del proyecto. Se puede volver a ejecutar sin romper nada.
--
-- Claves: `c-<32 hex>` es el canal de una persona (128 bits aleatorios que solo conocen sus
-- dispositivos) y `p-<10 letras>` un código de vinculación que caduca a los 10 minutos.
-- La tabla tiene RLS sin políticas: con la clave pública no se puede leer, escribir ni listar.
-- Solo se llega a los datos con estas tres funciones y sabiendo la clave exacta.

create table if not exists public.kv (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.kv enable row level security;
revoke all on table public.kv from anon, authenticated;

create or replace function public.kv_valid(key text) returns boolean
language sql immutable set search_path = '' as $$
  select key ~ '^(c-[0-9a-f]{32}|p-[a-z0-9]{10})$'
$$;

create or replace function public.kv_get(key text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  found_data jsonb;
  found_at timestamptz;
begin
  if not public.kv_valid(key) then
    raise exception 'invalid key';
  end if;
  select data, updated_at into found_data, found_at from public.kv where id = key;
  if not found then
    return null;
  end if;
  if key like 'p-%' and found_at < now() - interval '10 minutes' then
    delete from public.kv where id = key;
    return null;
  end if;
  return found_data;
end;
$$;

create or replace function public.kv_put(key text, value jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.kv_valid(key) then
    raise exception 'invalid key';
  end if;
  if octet_length(value::text) > 1000000 then
    raise exception 'value too large';
  end if;
  insert into public.kv (id, data, updated_at) values (key, value, now())
  on conflict (id) do update set data = excluded.data, updated_at = now();
  -- Los códigos de vinculación que nadie usó se limpian solos.
  delete from public.kv where id like 'p-%' and updated_at < now() - interval '1 hour';
end;
$$;

create or replace function public.kv_del(key text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.kv_valid(key) then
    raise exception 'invalid key';
  end if;
  delete from public.kv where id = key;
end;
$$;

revoke execute on function public.kv_valid(text) from public, anon, authenticated;
revoke execute on function public.kv_get(text), public.kv_put(text, jsonb), public.kv_del(text) from public;
grant execute on function public.kv_get(text), public.kv_put(text, jsonb), public.kv_del(text) to anon, authenticated;
