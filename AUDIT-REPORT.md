# Rapport d'audit – FrenchWithUs

**Date :** 25 février 2025  
**Périmètre :** Frontend, Backend, Prisma, Railway, Sécurité

---

## 1. Erreurs trouvées et corrigées

### 1.1 CORS (sécurité)
- **Problème :** En production sans `FRONTEND_URL`, `getAllowedOrigins()` renvoyait `true` (toutes origines autorisées).
- **Correction :** Utilisation de `RAILWAY_PUBLIC_DOMAIN` (Railway) pour restreindre les origines. Fallback avec avertissement si aucune variable n’est définie.

### 1.2 Validation des entrées (sécurité)
- **Problème :** Routes admin (`POST /courses`, `POST /payments`, `PUT /payments/:id/status`), professor (`POST /availability`, `POST /messages`), student (`POST /messages`) sans validation.
- **Correction :** Ajout de validations express-validator pour toutes ces routes.

### 1.3 Validation `professorId` (null)
- **Problème :** `userUpdateValidation` rejetait `professorId: null` pour désassigner un étudiant.
- **Correction :** `optional({ values: 'null' })` pour accepter `null`.

### 1.4 Gestion des erreurs async
- **Problème :** Les erreurs des handlers async n’étaient pas propagées vers le gestionnaire d’erreurs global.
- **Correction :** Ajout de `express-async-errors` et d’un gestionnaire global pour les erreurs Prisma (P2025 → 404, P2002 → 409).

### 1.5 Build cross‑plateforme
- **Problème :** `cp -r` (Unix) faisait échouer le build sur Windows.
- **Correction :** Script Node `scripts/copy-frontend.js` utilisant `fs.cpSync()` pour copier le frontend.

### 1.6 Route login
- **Problème :** Validation manuelle redondante dans `/login`.
- **Correction :** Utilisation du middleware `validate` pour simplifier le code.

---

## 2. État actuel (vérifié)

### Base de données & Prisma
- `schema.prisma` utilise `env("DATABASE_URL")`.
- SSL ajouté automatiquement pour les URLs non locales (index.js, seed.js).
- Migrations exécutées uniquement via `preDeployCommand` (pas pendant le build).
- Requêtes Prisma paramétrées (pas d’injection SQL).

### Frontend
- `baseURL: '/api'` (relatif) → compatible production (même origine).
- Proxy Vite vers `localhost:3001` en dev.
- Aucun localhost en dur en production.

### Sécurité
- Helmet activé en production.
- Rate limiting : 200 req/15 min global, 10 req/15 min sur `/api/auth/login`.
- JWT vérifié au démarrage (JWT_SECRET requis).
- Cookies httpOnly, secure en production, sameSite: lax.
- `.env` dans `.gitignore`.

### Railway
- `railway.json` : buildCommand, preDeployCommand, healthcheckPath configurés.
- `nixpacks.toml` : phases install/build mises à jour pour le script de copie.
- Migrations exécutées avant le déploiement.
- Seed idempotent (upsert).

---

## 3. Recommandations d’amélioration

### Priorité haute
1. **FRONTEND_URL** : Définir en production si le frontend est sur un domaine différent.
2. **JWT_SECRET** : Utiliser au moins 64 caractères aléatoires (`openssl rand -base64 48`).
3. **npm audit** : Corriger les vulnérabilités frontend (2 moderate, 1 high).

### Priorité moyenne
4. **Prisma** : Mise à jour possible vers 7.x (actuellement 5.22).
5. **CSP** : Remplacer `'unsafe-inline'` par des nonces si possible.
6. **Logs** : Ajouter un logger structuré (pino, winston) pour la production.

### Priorité basse
7. **Tests** : Ajouter des tests unitaires et d’intégration.
8. **Monitoring** : Intégrer Sentry ou équivalent pour les erreurs en production.
9. **Backup DB** : Configurer des sauvegardes automatiques sur Railway.

---

## 4. Fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| `backend/src/middleware/security.js` | CORS avec RAILWAY_PUBLIC_DOMAIN |
| `backend/src/middleware/validate.js` | Validations course, payment, message, availability, assign |
| `backend/src/routes/admin.js` | Validation sur courses, payments, assign |
| `backend/src/routes/professor.js` | Validation sur availability, messages |
| `backend/src/routes/student.js` | Validation sur messages |
| `backend/src/routes/auth.js` | Middleware validate sur login |
| `backend/src/index.js` | express-async-errors, gestionnaire d’erreurs global |
| `backend/package.json` | express-async-errors |
| `backend/.env.example` | Commentaire FRONTEND_URL |
| `backend/scripts/copy-frontend.js` | **Nouveau** – copie cross‑plateforme |
| `package.json` | Build avec node scripts/copy-frontend.js |
| `nixpacks.toml` | Build avec node scripts/copy-frontend.js |
