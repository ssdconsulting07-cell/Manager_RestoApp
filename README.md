# Manager_RestoApp — SenYummies Manager (équipe Back-office)

Application interne par rôle : Cuisine, Gérant, Manager, Livreur. Stack : React 18 + Vite, authentification JWT.

## Démarrage rapide

```
cp .env.example .env
npm install
npm run dev
```

L'app tourne sur `http://localhost:5174` (ou le port suivant si 5173 est déjà pris par Client_RestoApp). Elle attend le backend sur `http://localhost:8080/api/v1` (voir `VITE_API_BASE_URL` dans `.env`) — lancez `Backend_RestoApp` en local (`docker compose up --build`), ou demandez à l'équipe Backend un environnement partagé.

Autres scripts : `npm run build` (build de prod), `npm run preview` (prévisualiser le build).

## Organisation — par rôle

Le code est organisé par rôle dans `src/features/<role>/`, pas par type de fichier :

- `features/cuisine/` — Commandes, Préparation
- `features/gerant/` — Menu
- `features/manager/` — Statistiques, Personnel
- `features/livreur/` — Livraisons

L'écran de connexion (commun aux 4 rôles, avant qu'un rôle ne soit connu) et les autres pièces transverses (auth, layout, composants partagés) restent hors de `features/`.

## Le contrat d'API

Le contrat (`openapi.yaml`) vit uniquement dans `Backend_RestoApp`. Consultez la doc générée (Swagger UI) une fois le backend lancé : `http://localhost:8080/api/v1/swagger-ui.html` — pas de fichier à synchroniser ici.

## Rappels

- `src/api/client.js` — client HTTP déjà configuré (auth JWT, gère le format d'erreur standard `{ code, message, field }`). À utiliser pour tous les appels API.
- Un rôle = un espace dédié ; ne jamais mélanger la logique de plusieurs rôles dans un même écran.
- **Stratégie de branches (identique dans les 3 dépôts)** : `feature/*` → PR vers `develop` → `staging` → `preprod` → `main`. Branches principales protégées, chaque promotion passe par la CI.
