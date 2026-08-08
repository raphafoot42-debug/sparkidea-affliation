# Spark Idea — Système d'affiliation

## Ce qui est fait dans ce scaffold

- ✅ Schéma de base de données complet (`supabase/schema.sql` + `supabase/functions.sql`)
- ✅ Connexion Stripe Connect (OAuth, pas de saisie manuelle d'identifiant)
- ✅ Webhook Stripe automatique : détecte chaque paiement, calcule la commission,
  vire l'argent à l'affilié via Stripe Connect, met à jour les paliers
- ✅ Logique de palier automatique + verrouillage manuel par l'admin
- ✅ Route admin pour changer/verrouiller le taux d'un affilié
- ✅ Route admin pour créer un pack
- ✅ Page d'inscription connectée à Supabase Auth

## Ce qu'il reste à faire

- 🔲 Reconstruire les pages du dashboard (affilié + admin) en React, en reprenant le
  design de la maquette (`spark-idea-affiliation-mockup/`) — actuellement seule la
  logique backend est en place
- 🔲 Vraie vérification `is_admin` (les routes admin ont un `// TODO` dessus —
  actuellement n'importe quel compte connecté pourrait appeler ces routes, il FAUT
  corriger ça avant la mise en ligne réelle)
- 🔲 Emails automatiques via Resend (bienvenue, palier débloqué, confirmation Stripe)
- 🔲 Page Messages connectée en temps réel (Supabase Realtime)
- 🔲 Middleware pour protéger `/dashboard` et `/admin` (rediriger si non connecté)

## Mise en route

1. **Installer les dépendances**
   ```
   npm install
   ```

2. **Base de données** — dans le Dashboard Supabase (ton projet
   `zwnzwsqtkojhlhzcedms`) → SQL Editor → coller et exécuter dans l'ordre :
   - `supabase/schema.sql`
   - `supabase/functions.sql`

3. **Variables d'environnement** — copier `.env.local.example` en `.env.local`
   et remplir toutes les valeurs (voir le tableau des clés qu'on a fait ensemble).
   Mettre les mêmes dans Vercel → Project Settings → Environment Variables.

4. **Webhook Stripe** — une fois déployé sur Vercel, aller dans
   Dashboard Stripe → Développeurs → Webhooks → Ajouter un endpoint :
   `https://sparkidea-affliation.vercel.app/api/stripe/webhook`
   Évènements à cocher : `checkout.session.completed`, `invoice.paid`,
   `customer.subscription.deleted`.
   Stripe donne alors le `STRIPE_WEBHOOK_SECRET` à copier dans les env vars.

5. **Lancer en local**
   ```
   npm run dev
   ```

6. **Déployer** — push sur GitHub, connecter le repo à ton projet Vercel existant
   (`sparkidea-affliation`), ou `vercel --prod` en CLI si tu préfères.
