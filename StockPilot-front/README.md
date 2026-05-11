# StockPilot Front

Application frontend de gestion commerciale (dashboard, clients, produits, stock, ventes, commandes, fournisseurs) basee sur React + TypeScript + Vite.

## Stack

- React 19
- TypeScript 6
- Vite 8
- React Router
- Zustand
- React Hook Form + Zod
- Recharts
- ESLint + Biome

## Scripts

- `npm run dev`: lance le serveur local
- `npm run build`: build production (`tsc -b && vite build`)
- `npm run lint`: analyse ESLint
- `npm run preview`: previsualisation du build

## Structure du projet

```txt
src/
  components/      # Composants UI partages (header, sidebar, nav, layouts auth)
  features/        # Donnees, schemas, types, formatters et helpers par domaine
  hooks/           # Hooks react re-utilisables
  layouts/         # Layouts applicatifs (MainLayout)
  pages/           # Pages routees (une page = un fichier)
  routes/          # Garde de routes et router principal
  services/        # Couche d'appel API/services
  store/           # Etat global (Zustand)
  types/           # Types transverses
  utils/           # Utilitaires purs
```

## Conventions de structure

1. Pages
- Chaque ecran route est dans `src/pages`.
- Nommage: `PascalCasePage.tsx`.
- Une page ne doit pas contenir de logique API brute; passer par `src/services`.

2. Features
- Regrouper la logique metier par domaine dans `src/features/<domaine>`.
- Fichiers attendus quand pertinent:
  - `<domain>Types.ts`
  - `<domain>Schemas.ts`
  - `<domain>Data.ts` (mock/dev local)
  - `<domain>Formatters.ts`
  - `<domain>Stats.ts`

3. Services
- Centraliser les appels backend dans `src/services`.
- Eviter les appels `axios` directement dans les pages.

4. Etat
- Etat global partage: Zustand dans `src/store`.
- Etat local UI/formulaire: `useState`/`react-hook-form` dans la page composant.

5. Styles
- Styles globaux dans `src/index.css`.
- Respecter les variables CSS du design system (`--color-*`, `--radius-*`, `--shadow-*`).
- Toute nouvelle page doit inclure les regles responsive mobile/tablette/desktop.

6. Routing
- Routes centralisees dans `src/routes/AppRouter.tsx`.
- Garde auth via `RequireAuth` et `PublicOnlyRoute`.

## Conventions de code

- TypeScript strict: eviter `any`.
- Composants et types en PascalCase.
- Variables/fonctions en camelCase.
- Fonctions utilitaires pures dans `features/*Formatters.ts` ou `utils`.
- Validation formulaire via Zod quand il y a saisie utilisateur.
- Messages UI en francais coherent.

## Process de contribution recommande

1. Creer/modifier la logique metier dans `features` et `services`.
2. Integrer dans la page.
3. Verifier responsive mobile.
4. Executer:

```bash
npm run lint
npm run build
```

5. Corriger les erreurs avant merge.

## Notes techniques

- `VITE_API_BASE_URL` peut etre defini pour activer les endpoints backend de `authService`.
- Sans variable d environnement API, certaines actions utilisent des comportements mock pour le developpement local.
