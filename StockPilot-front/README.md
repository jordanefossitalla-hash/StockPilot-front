# StockPilot Front

Interface web de gestion commerciale: dashboard, clients, fournisseurs, produits, stock, ventes, commandes et parametres.

## Apercu

Le projet est une application React moderne construite avec Vite et TypeScript.
Il vise un usage quotidien sur desktop et mobile avec:

- un design system centralise dans `src/index.css`
- des pages metier organisees par domaine
- une navigation protegee (auth)
- des formulaires valides avec React Hook Form + Zod

## Stack technique

- React 19
- TypeScript 6
- Vite 8
- React Router
- Zustand
- React Hook Form + Zod
- Recharts
- ESLint + Biome
- Tailwind CSS (via plugin Vite)

## Prerequis

- Node.js 20+
- npm 10+

## Installation

```bash
npm install
```

## Lancer le projet

```bash
npm run dev
```

Le serveur de developpement Vite demarre ensuite en local (ex: `http://localhost:5173`).

## Scripts disponibles

- `npm run dev` lance le serveur local
- `npm run build` genere le build production (`tsc -b && vite build`)
- `npm run lint` execute ESLint sur le projet
- `npm run preview` lance un serveur de preview du build

## Variables d'environnement

Le frontend supporte une URL API via:

- `VITE_API_BASE_URL`

Exemple de fichier `.env`:

```env
VITE_API_BASE_URL=https://api.example.com
```

Sans configuration API, certaines fonctionnalites utilisent des comportements mock pour faciliter le developpement local.

## PWA

Le frontend est maintenant configure comme Progressive Web App (PWA):

- manifeste web genere au build
- service worker de precache pour les assets statiques
- installable sur mobile et desktop compatibles

Comportement actuel:

- le shell applicatif et les assets du build restent disponibles hors ligne apres une premiere visite
- la creation et la mise a jour des commandes client peuvent etre mises en file hors ligne puis resynchronisees au retour reseau
- les autres modules metier (hors commandes) restent majoritairement dependants du reseau en temps reel

## Structure du projet

```txt
src/
  components/      # Composants UI partages (header, sidebar, nav, layouts auth)
  features/        # Donnees, schemas, types, formatters et helpers par domaine
  hooks/           # Hooks React reutilisables
  layouts/         # Layouts applicatifs (MainLayout)
  pages/           # Pages routees (une page = un fichier)
  routes/          # Router principal + gardes d'acces
  services/        # Appels API / services
  store/           # Etat global (Zustand)
  types/           # Types transverses
  utils/           # Fonctions utilitaires pures
```

## Conventions du projet

### 1) Organisation metier

- Chaque ecran route est dans `src/pages`.
- Nommage des pages: `PascalCasePage.tsx`.
- La logique metier est regroupee dans `src/features/<domaine>`.

Fichiers courants par domaine (selon besoin):

- `<domain>Types.ts`
- `<domain>Schemas.ts`
- `<domain>Data.ts` (mock/dev local)
- `<domain>Formatters.ts`
- `<domain>Stats.ts`

### 2) Services et etat

- Centraliser les appels backend dans `src/services`.
- Eviter les appels `axios` directs dans les pages.
- Etat global partage dans `src/store` (Zustand).
- Etat local UI/formulaire via `useState` et `react-hook-form`.

### 3) Styles et responsive

- Styles globaux dans `src/index.css`.
- Reutiliser les variables du design system (`--color-*`, `--radius-*`, `--shadow-*`).
- Toute nouvelle page doit etre testee au minimum sur:
  - mobile (`<= 640px`)
  - tablette (`<= 1023px`)
  - desktop (`> 1023px`)
- Eviter les largeurs fixes non necessaires pour limiter les debordements horizontaux.

### 4) Qualite de code

- TypeScript strict, eviter `any`.
- Composants et types en PascalCase.
- Variables/fonctions en camelCase.
- Validation des formulaires avec Zod des qu'il y a de la saisie utilisateur.
- Copier-coller de labels/messages: garder un francais coherent sur toutes les pages.

## Workflow de contribution

1. Implementer la logique dans `features` et/ou `services`.
2. Integrer dans la page concernee.
3. Verifier le responsive mobile.
4. Lancer les controles:

```bash
npm run lint
npm run build
```

5. Corriger les erreurs avant merge.

## Checklist avant PR

- [ ] Pas d'erreur TypeScript
- [ ] Lint OK
- [ ] Build production OK
- [ ] Responsive mobile valide sur les pages modifiees
- [ ] Libelles FR relus (accents, coherence)
