-- ============================================================
-- Spark Idea Affiliation — Migration vers le modèle CPA fixe
-- À exécuter dans Supabase : Dashboard → SQL Editor → New query
-- ⚠️ À exécuter UNE SEULE FOIS, après avoir déployé le nouveau code
--    (webhook, admin, dashboard) pour éviter toute incohérence.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Table affiliates : le CPA remplace le taux de commission
-- ------------------------------------------------------------
alter table affiliates
  add column if not exists cpa_amount_cents integer not null default 1500;
  -- 1500 = 15,00 € — CPA de départ pour tout nouveau sous-affilié.

comment on column affiliates.cpa_amount_cents is
  'Montant fixe en centimes versé une seule fois par client validé. Modifiable manuellement par le manager depuis /admin. Ne change jamais automatiquement.';

-- On garde active_clients_count : toujours utile pour que le manager voie
-- le volume apporté par un sous-affilié (même sans palier automatique).

-- Les anciennes colonnes commission_rate et rate_locked ne sont plus lues
-- par le nouveau code, mais on les laisse en base pour ne rien casser tant
-- que tu n'as pas confirmé que la migration s'est bien passée.
-- Une fois sûr, tu pourras les supprimer avec :
--   alter table affiliates drop column commission_rate;
--   alter table affiliates drop column rate_locked;

-- ------------------------------------------------------------
-- 2. Table referrals : on fige le CPA appliqué à CE client précis
-- ------------------------------------------------------------
alter table referrals
  add column if not exists cpa_applied_cents integer;
  -- Rempli automatiquement par le webhook à la création du referral,
  -- avec le cpa_amount_cents de l'affilié À CE MOMENT-LÀ. Si le manager
  -- change ensuite le CPA de l'affilié, cette ligne ne bouge plus :
  -- l'historique de paiement de ce client reste figé.

comment on column referrals.cpa_applied_cents is
  'CPA figé au moment de la validation de ce client. Ne doit jamais être recalculé après coup.';

-- La colonne commission_rate_at_signup est conservée telle quelle : elle
-- documente simplement ce qui existait avant la bascule, pour tes clients
-- déjà rattachés sous l'ancien modèle. Le nouveau code ne la lit plus.

-- ------------------------------------------------------------
-- 3. Table commission_payouts : rien à changer structurellement
-- ------------------------------------------------------------
-- amount_cents contient déjà le montant réellement versé. Sous le nouveau
-- modèle, une ligne = un CPA payé une fois (au lieu d'une ligne par mois
-- par filleul actif). On ajoute juste un repère pour distinguer les
-- anciennes lignes (modèle %) des nouvelles (modèle CPA) si besoin d'audit :
alter table commission_payouts
  add column if not exists payout_type text not null default 'cpa';
  -- 'cpa' = nouveau modèle, 'legacy_percent' pour marquer manuellement les
  -- lignes historiques si tu veux les distinguer dans un export.

-- ------------------------------------------------------------
-- 4. Paliers automatiques : plus utilisés, on désactive la table
-- ------------------------------------------------------------
-- On ne la supprime pas brutalement (au cas où un ancien code y ferait
-- encore référence quelque part), mais elle n'est plus lue par le
-- nouveau webhook ni par lib/commission.ts (qui est supprimé).
-- Si tu veux la supprimer complètement plus tard :
--   drop table if exists commission_tiers;
