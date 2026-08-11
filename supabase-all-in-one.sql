-- ============================================================
-- Spark Idea — Script complet à coller EN UNE FOIS
-- Supabase → SQL Editor → New query → coller tout → Run
-- ============================================================

-- Table des affiliés
create table if not exists affiliates (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  referral_code text unique not null,
  stripe_account_id text,
  stripe_connected boolean default false,
  commission_rate integer not null default 10,
  rate_locked boolean not null default false,
  active_clients_count integer not null default 0,
  created_at timestamptz default now()
);

-- Paliers de commission
create table if not exists commission_tiers (
  id serial primary key,
  min_clients integer not null,
  rate integer not null
);
insert into commission_tiers (min_clients, rate) values
  (0, 10), (20, 20), (50, 30), (200, 50)
on conflict do nothing;

-- Filleuls
create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid references affiliates(id) on delete set null,
  customer_email text not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null,
  status text not null default 'active',
  commission_rate_at_signup integer not null,
  referred_via_code text,
  created_at timestamptz default now(),
  cancelled_at timestamptz
);

-- Commissions versées
create table if not exists commission_payouts (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid references affiliates(id) on delete set null,
  referral_id uuid references referrals(id) on delete set null,
  amount_cents integer not null,
  stripe_transfer_id text,
  period text not null,
  status text not null default 'paid',
  created_at timestamptz default now()
);

-- Packs / défis bonus
create table if not exists packs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  reward_cents integer not null,
  target_count integer,
  target_plan text,
  starts_at timestamptz default now(),
  ends_at timestamptz,
  active boolean default true,
  created_by uuid references auth.users(id)
);

-- Messages
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid references affiliates(id) on delete cascade,
  sender text not null,
  body text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- Sécurité (RLS) — chaque affilié ne voit/modifie que ses données
-- ============================================================
alter table affiliates enable row level security;
alter table referrals enable row level security;
alter table commission_payouts enable row level security;
alter table messages enable row level security;
alter table packs enable row level security;

create policy "Un affilié voit son propre profil"
  on affiliates for select using (auth.uid() = id);

create policy "Un utilisateur peut créer sa propre fiche affilié"
  on affiliates for insert with check (auth.uid() = id);

create policy "Un affilié voit ses propres filleuls"
  on referrals for select using (affiliate_id = auth.uid());

create policy "Un affilié voit ses propres commissions"
  on commission_payouts for select using (affiliate_id = auth.uid());

create policy "Un affilié voit ses propres messages"
  on messages for select using (affiliate_id = auth.uid());

create policy "Un affilié peut écrire ses propres messages"
  on messages for insert with check (affiliate_id = auth.uid() and sender = 'affiliate');

create policy "Tout le monde connecté voit les packs actifs"
  on packs for select using (active = true);

-- ============================================================
-- Fonctions utilisées par le webhook Stripe
-- ============================================================
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
