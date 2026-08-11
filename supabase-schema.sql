-- ============================================================
-- Spark Idea — Schéma d'affiliation
-- À exécuter dans Supabase : Dashboard → SQL Editor → New query
-- ============================================================

-- Table des affiliés
create table if not exists affiliates (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  referral_code text unique not null,        -- ex: TN2847, utilisé dans ?ref=TN2847
  stripe_account_id text,                     -- acct_... (Stripe Connect), null tant que non connecté
  stripe_connected boolean default false,
  commission_rate integer not null default 10, -- taux actuel en %, calculé automatiquement ou verrouillé
  rate_locked boolean not null default false,  -- si true, le palier automatique ne touche plus au taux
  active_clients_count integer not null default 0, -- compteur mis à jour par trigger, sert au calcul de palier
  created_at timestamptz default now()
);

-- Paliers de commission (modifiables par l'admin sans toucher au code)
create table if not exists commission_tiers (
  id serial primary key,
  min_clients integer not null,   -- seuil de clients ramenés pour atteindre ce palier
  rate integer not null           -- taux en % à partir de ce seuil
);
insert into commission_tiers (min_clients, rate) values
  (0, 10), (20, 20), (50, 30), (200, 50)
on conflict do nothing;

-- Filleuls (clients ramenés par un affilié)
create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid references affiliates(id) on delete set null,
  customer_email text not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null,             -- '9', '24', '74'
  status text not null default 'active', -- 'active' | 'cancelled'
  commission_rate_at_signup integer not null, -- taux figé au moment où CE client a été rattaché
  referred_via_code text,         -- le ?ref= utilisé, pour traçabilité même si l'affilié change
  created_at timestamptz default now(),
  cancelled_at timestamptz
);

-- Commissions versées (une ligne par mois par filleul actif)
create table if not exists commission_payouts (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid references affiliates(id) on delete set null,
  referral_id uuid references referrals(id) on delete set null,
  amount_cents integer not null,
  stripe_transfer_id text,        -- id du virement Stripe Connect effectué
  period text not null,           -- '2026-08' par exemple
  status text not null default 'paid', -- 'paid' | 'failed'
  created_at timestamptz default now()
);

-- Packs / défis bonus créés par l'admin
create table if not exists packs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  reward_cents integer not null,
  target_count integer,           -- ex: 10 clients à ramener, null si pas de compteur
  target_plan text,                -- ex: '74' si le pack cible un forfait précis, null si tous
  starts_at timestamptz default now(),
  ends_at timestamptz,
  active boolean default true,
  created_by uuid references auth.users(id)
);

-- Messages (affilié <-> admin)
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid references affiliates(id) on delete cascade,
  sender text not null,           -- 'affiliate' | 'admin'
  body text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- Row Level Security — chaque affilié ne voit que ses données
-- ============================================================
alter table affiliates enable row level security;
alter table referrals enable row level security;
alter table commission_payouts enable row level security;
alter table messages enable row level security;
alter table packs enable row level security;

create policy "Un affilié voit son propre profil"
  on affiliates for select using (auth.uid() = id);

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

-- NOTE: les actions admin (changer un taux, créer un pack, répondre aux messages)
-- passent par les routes API server-side avec la clé Supabase service_role,
-- qui contourne RLS — jamais exposée au navigateur. Voir lib/supabase/admin.ts
