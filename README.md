# Spark Idea — Système d'affiliation 
 
## Structure

Ce projet utilise le "Pages Router" de Next.js (plutôt que le "App Router")
exprès pour que la structure de fichiers reste plate et facile à envoyer sur
GitHub sans créer de dossiers imbriqués à la main :

```
package.json, next.config.js, tsconfig.json, .env.local.example, globals.css
pages/            → _app.tsx, _document.tsx, index.tsx, signup.tsx
pages/api/        → packs.ts, affiliate-cpa.ts, stripe-connect.ts,
                     stripe-connect-callback.ts, stripe-webhook.ts,
                     admin-affiliates.ts, admin-packs.ts, admin-messages.ts
lib/              → stripe.ts, supabase-client.ts,
                     supabase-server.ts, supabase-admin.ts
supabase-*.sql    → scripts à exécuter dans le SQL Editor de Supabase
                     (schema.sql + functions.sql d'abord, puis
                     migration-cpa.sql pour passer au modèle CPA fixe)
```

Aucun dossier ne contient de sous-dossier, sauf `pages/api/` (obligatoire :
c'est comme ça que Next.js sait que ce sont des routes API).

## Modèle de rémunération : CPA fixe (depuis la migration)

Le système ne fonctionne plus en commission % récurrente mensuelle. Chaque
affilié a un `cpa_amount_cents` sur son compte (15€ par défaut pour un
nouveau compte). Il touche ce montant fixe **une seule fois** par client
validé, versé automatiquement via Stripe Connect dès `checkout.session.completed`
— quel que soit le forfait choisi par le client. Le manager ajuste ce CPA
manuellement depuis `/admin`, affilié par affilié ; le nouveau montant ne
s'applique qu'aux futurs clients, jamais rétroactivement (le CPA de chaque
client déjà validé reste figé dans `referrals.cpa_applied_cents`).
Voir `supabase-migration-cpa.sql` pour le détail du changement de schéma.

## Ce qui est fait dans ce scaffold

- ✅ Schéma de base de données complet (`supabase-schema.sql` + `supabase-functions.sql` + `supabase-migration-cpa.sql`)
- ✅ Connexion Stripe Connect (Account Links — Stripe ne propose plus l'OAuth
  en self-service aux nouvelles plateformes, voir le commentaire dans `stripe-connect.ts`)
- ✅ Webhook Stripe automatique : détecte chaque nouveau client, verse le CPA
  de l'affilié via Stripe Connect, une seule fois par client
- ✅ CPA ajustable uniquement à la main par l'admin, jamais recalculé automatiquement
- ✅ Route admin pour changer le CPA d'un affilié
- ✅ Route admin pour créer un pack
- ✅ Page d'inscription connectée à Supabase Auth
- ✅ Dashboard affilié et admin en React (`pages/dashboard.tsx`, `pages/admin.tsx`)

## Ce qu'il reste à faire

- 🔲 **Route `/api/admin-create-affiliate` manquante** : `pages/admin.tsx`
  l'appelle (bouton "Créer un compte" dans l'onglet Affiliés) mais le fichier
  n'existe pas dans ce repo — ce bouton renvoie actuellement une 404. À
  créer avant de compter dessus, ou à retirer du bouton si tu ne l'utilises pas.
- 🔲 Vraie vérification `is_admin` (les routes admin ont un `// TODO` dessus —
  actuellement n'importe quel compte connecté pourrait appeler ces routes, il FAUT
  corriger ça avant la mise en ligne réelle — d'autant plus critique maintenant
  que ces routes déclenchent des changements de CPA, donc de l'argent réel)
- 🔲 Emails automatiques via Resend (bienvenue, confirmation Stripe, changement de CPA)
- 🔲 Page Messages connectée en temps réel (Supabase Realtime)
- 🔲 Middleware pour protéger `/dashboard` et `/admin` (rediriger si non connecté)

## Mise en route

1. **Installer les dépendances**
   ```
   npm install
   ```

2. **Base de données** — dans le Dashboard Supabase (ton projet
   `zwnzwsqtkojhlhzcedms`) → SQL Editor → coller et exécuter dans l'ordre :
   - `supabase-schema.sql`
   - `supabase-functions.sql`

3. **Variables d'environnement** — copier `.env.local.example` en `.env.local`
   et remplir toutes les valeurs. Mettre les mêmes dans Vercel → Project
   Settings → Environment Variables.

4. **Webhook Stripe** — une fois déployé sur Vercel, aller dans
   Dashboard Stripe → Développeurs → Webhooks → Ajouter un endpoint :
   `https://sparkidea-affliation.vercel.app/api/stripe-webhook`
   (⚠️ l'URL a changé, avant c'était `/api/stripe/webhook`)
   Évènements à cocher : `checkout.session.completed`, `customer.subscription.deleted`.
   (`invoice.paid` n'est plus utilisé par le webhook depuis le passage au CPA
   fixe — tu peux le laisser coché sans risque, ou le décocher, ça ne change rien.)
   Stripe donne alors le `STRIPE_WEBHOOK_SECRET` à copier dans les env vars.

5. **Stripe Connect** — rien à configurer côté Dashboard Stripe pour les
   URLs de redirection : `stripe-connect.ts` utilise Account Links
   (`stripe.accountLinks.create`), qui prennent leurs URLs directement dans
   le code (`refresh_url` / `return_url`), pas dans les Settings Stripe.
   Vérifie juste que `NEXT_PUBLIC_APP_URL` est bien réglé dans les variables
   d'environnement.

6. **Lancer en local**
   ```
   npm run dev
   ```

7. **Déployer** — push sur GitHub, connecter le repo à ton projet Vercel existant
   (`sparkidea-affliation`), ou `vercel --prod` en CLI si tu préfères.
