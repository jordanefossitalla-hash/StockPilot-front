# StockPilot Front - CI/CD et deploiement VPS

## Vue d'ensemble

Le frontend suit une approche proche du backend:

- CI separee pour verifier lint, tests si presents et build
- CD separee, declenchee uniquement si la CI a reussi sur `push`
- deploiement sur VPS Linux via SSH
- build et service de la SPA dans Docker avec Nginx
- differenciation `staging` et `production` via les environnements GitHub

## Fichiers ajoutes

- `.github/workflows/ci.yml`
- `.github/workflows/cd.yml`
- `Dockerfile`
- `docker-compose.prod.yml`
- `nginx.conf`
- `.env.production.example`

## Flux CI

Declenchement:

- `push` sur `main` et `develop`
- `pull_request` vers `main` et `develop`

Etapes:

1. `npm ci`
2. `npm run lint` si le script existe
3. `npm test -- --runInBand` si le script existe
4. `npm run build`
5. publication de l'artefact `dist`

Note actuelle:

- le projet expose `lint` et `build`
- aucun script `test` n'existe pour le moment, donc cette etape est ignoree automatiquement

## Flux CD

Declenchement:

- automatique apres succes de `Frontend CI` sur un `push`
- manuel via `workflow_dispatch` si besoin

Mapping par branche:

- `main` -> environnement GitHub `production`
- `develop` -> environnement GitHub `staging`

Processus distant:

1. connexion SSH au VPS
2. `git clone` initial si le dossier n'existe pas
3. `git fetch`, `git checkout`, `git reset --hard origin/<branche>`
4. creation ou mise a jour du fichier d'environnement si `FRONTEND_ENV_FILE` est fourni
5. `docker compose -f docker-compose.prod.yml build --pull`
6. `docker compose -f docker-compose.prod.yml up -d --remove-orphans`
7. nettoyage Docker (`image prune`, `builder prune`)
8. affichage des diagnostics en cas d'echec

## Variables d'environnement frontend

Le build Vite consomme principalement:

- `VITE_API_BASE_URL`

Le fichier distant utilise aussi:

- `FRONTEND_PORT` pour exposer Nginx sur le VPS
- `DOCKER_IMAGE_NAME` optionnel
- `DOCKER_CONTAINER_NAME` optionnel

Exemple:

```env
VITE_API_BASE_URL=https://api.stockpilots.net/api/v1
FRONTEND_PORT=8080
DOCKER_IMAGE_NAME=stockpilot-front:latest
DOCKER_CONTAINER_NAME=stockpilot-front
```

Important:

- `VITE_API_BASE_URL` est injecte au build Docker, pas seulement au runtime
- si cette variable est absente, l'application sera construite avec la valeur par defaut du code ou une valeur vide selon le service concerne

## Configuration GitHub recommandee

Creer deux environnements GitHub:

- `staging`
- `production`

Pour chaque environnement, configurer les secrets suivants:

- `VPS_HOST`
- `VPS_PORT`
- `VPS_USER`
- `VPS_SSH_KEY` si authentification par cle SSH
- `VPS_PASSWORD` si authentification par mot de passe
- `FRONTEND_ENV_FILE`

Regle:

- renseigner `VPS_SSH_KEY` ou `VPS_PASSWORD`
- ne pas laisser les deux vides
- si les deux sont renseignes, la cle SSH reste l'option recommandee

Configurer aussi les variables GitHub suivantes par environnement:

- `VPS_APP_DIR`
- `VPS_REPO_URL`
- `FRONTEND_ENV_PATH` optionnel, defaut `.env.production`

Exemples:

- `VPS_APP_DIR=/opt/stockpilot/front`
- `VPS_REPO_URL=git@github.com:your-org/stockpilot-front.git`
- `FRONTEND_ENV_PATH=.env.production`

## Preparation du VPS

Prerequis minimaux:

- Docker Engine installe
- Docker Compose plugin installe (`docker compose`)
- Git installe
- un acces SSH pour l'utilisateur de deploiement
- acces du serveur au depot GitHub (deploy key SSH recommandee si le depot est prive)

Bootstrap type sur Ubuntu:

```bash
sudo apt-get update
sudo apt-get install -y git ca-certificates curl
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
docker --version
docker compose version
git --version
```

Si le depot est prive:

1. generer une cle SSH sur le VPS
2. ajouter la cle publique comme Deploy Key en lecture sur GitHub
3. verifier `ssh -T git@github.com`

## Premier deploiement manuel sur le VPS

```bash
git clone git@github.com:your-org/stockpilot-front.git /opt/stockpilot/front
cd /opt/stockpilot/front
cp .env.production.example .env.production
# editer ensuite .env.production avec les vraies valeurs
docker compose -f docker-compose.prod.yml --env-file .env.production build --pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

L'application sera alors disponible sur le port defini par `FRONTEND_PORT`.

## Reverse proxy et HTTPS

Si le frontend est expose derriere Nginx Proxy Manager, Traefik ou Nginx systeme:

- rediriger le domaine public vers `localhost:${FRONTEND_PORT}`
- activer HTTPS avec Let's Encrypt
- conserver le fallback SPA dans le Nginx du conteneur

## Commandes utiles de diagnostic

```bash
cd /opt/stockpilot/front
docker compose -f docker-compose.prod.yml --env-file .env.production ps
docker compose -f docker-compose.prod.yml --env-file .env.production logs --tail=200
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
docker system df
df -h
```
