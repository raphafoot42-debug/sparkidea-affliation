# Spark Idea

## Installation

```bash
npm install
cp .env.example .env
```

Remplis `.env` avec tes vraies valeurs (voir `.env.example` pour la liste
complète : clé Anthropic, clés Stripe + les 2 Price ID, secret de session).

## Base de données

```bash
npx prisma generate
npx prisma migrate dev --name init
```

Ça crée le fichier `dev.db` (SQLite) avec toutes les tables.

Pour appliquer directement les changements du schéma à une base configurée dans
`DATABASE_URL`, utilise `npm run prisma:push`. Cette commande est volontairement
séparée du build : le déploiement peut compiler l'application sans accès à la
base de données.

## Lancer en local

```bash
npm run dev
```

Le site est sur http://localhost:3000

## Créer ton compte admin

Aucune interface pour ça volontairement (l'admin ne doit pas passer par le
parcours normal). Le plus simple pour l'instant :

```bash
npx prisma studio
```

Ça ouvre une interface visuelle sur ta base de données. Crée-toi un compte
via `/signup` normalement, puis dans Prisma Studio, trouve ta ligne dans la
table `User` et passe `isAdmin` à `true`.

## Stripe en local (webhook)

Pour tester les paiements en local, installe la Stripe CLI puis :

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Ça te donne un `whsec_...` à mettre dans `STRIPE_WEBHOOK_SECRET`.

## Ce qui est fait

- Authentification (mots de passe hachés, sessions sécurisées)
- Génération IA avec les 6 critères validés
- Anti-abus 5 jours par appareil sur l'étape gratuite
- Stripe complet (checkout, webhook, résiliation immédiate)
- Toutes les pages : accueil, résultat gratuit, inscription/connexion,
  forfaits, dashboard, mes idées, paramètres, admin
- Carte mentale interactive (glisser-déposer, zoom, tactile) branchée à
  la vraie IA, avec chat contextuel isolé par projet
- Limite de messages IA par mois selon le forfait

## Ce qui reste à faire avant une vraie mise en production

- **Emails transactionnels** : la réinitialisation de mot de passe par
  l'admin génère un mot de passe temporaire mais ne l'envoie pas par email
  (branché nulle part pour l'instant — voir le commentaire TODO dans
  `app/api/admin/reset-password/route.ts`)
- **Pages légales** : mentions légales, CGV, politique de confidentialité —
  mises de côté pour plus tard, mais obligatoires avant de prendre un vrai
  paiement
- **Migration vers PostgreSQL** pour la prod (changer juste le `provider`
  dans `prisma/schema.prisma`)
- **Tests** : rien n'est testé automatiquement, à faire tester manuellement
  bloc par bloc avant la mise en ligne
- **Le pincement à deux doigts et le redimensionnement manuel du panneau IA**
  vus dans les maquettes HTML n'ont pas été repris ici pour rester dans les
  temps — la carte mentale actuelle gère le glisser-déposer (souris et
  tactile un doigt) et le zoom à la molette, mais pas encore le pincement à
  deux doigts. Dis-le-moi si tu veux qu'on l'ajoute.
