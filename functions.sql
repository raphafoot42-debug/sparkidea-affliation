-- À exécuter après schema.sql dans le SQL Editor de Supabase

create or replace function increment_active_clients(affiliate_id uuid)
returns void as $$
  update affiliates
  set active_clients_count = active_clients_count + 1
  where id = affiliate_id;
$$ language sql;

create or replace function decrement_active_clients(affiliate_id uuid)
returns void as $$
  update affiliates
  set active_clients_count = greatest(active_clients_count - 1, 0)
  where id = affiliate_id;
$$ language sql;
