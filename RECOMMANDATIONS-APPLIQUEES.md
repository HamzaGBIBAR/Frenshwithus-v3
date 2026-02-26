# Recommandations appliquées – FrenchWithUs

**Date :** 26 février 2025

---

## Modifications appliquées

### Priorité haute

| Action | Modification |
|--------|--------------|
| **FRONTEND_URL** | `.env.example` et `README.md` mis à jour avec instructions claires. CORS utilise déjà `FRONTEND_URL` et `RAILWAY_PUBLIC_DOMAIN`. |
| **JWT_SECRET** | Validation stricte en production : le serveur s’arrête si JWT_SECRET < 64 caractères. Script `backend/scripts/generate-jwt-secret.js` pour générer une clé. |
| **npm audit frontend** | `npm audit fix` exécuté : vulnérabilité Rollup (haute) corrigée. 2 vulnérabilités modérées (esbuild/vite) restantes, correction possible uniquement avec `--force` (changement majeur). |

### Priorité moyenne

| Action | Modification |
|--------|--------------|
| **Prisma** | Mise à jour vers 6.x tentée ; erreur EPERM (fichier verrouillé, possiblement OneDrive). Projet conservé sur Prisma 5.22. |
| **CSP** | Scripts inline déplacés vers `frontend/public/init.js`. `'unsafe-inline'` retiré de `scriptSrc`. Conservé pour `styleSrc` (Tailwind/React). |

### Priorité basse

| Action | Modification |
|--------|--------------|
| **Tests** | Tests ajoutés : `backend/test/auth.test.js` (JWT), `backend/test/health.test.js` (API). Commande : `npm test` dans backend. |
| **Sentry** | Intégration optionnelle : `@sentry/node`, `backend/src/lib/sentry.js`. Actif si `SENTRY_DSN` est défini. Capture des erreurs dans le handler global et dans uncaughtException/unhandledRejection. |
| **Sauvegardes** | Section ajoutée dans `RAILWAY.md` : stratégie de sauvegarde (Railway Backups, export manuel, cron externe). |

---

## Commandes exécutées

```bash
# Frontend – audit et correction
cd frontend && npm audit fix

# Backend – installation des dépendances
cd backend && npm install

# Tests
cd backend && npm test
```

---

## Fichiers modifiés/créés

| Fichier | Action |
|---------|--------|
| `backend/.env.example` | Instructions JWT_SECRET, FRONTEND_URL, SENTRY_DSN |
| `backend/src/index.js` | Validation JWT_SECRET stricte, init Sentry, captureException |
| `backend/scripts/generate-jwt-secret.js` | **Nouveau** – génération de clé JWT |
| `backend/src/lib/sentry.js` | **Nouveau** – intégration Sentry optionnelle |
| `backend/src/middleware/security.js` | CSP sans `'unsafe-inline'` pour scriptSrc |
| `backend/test/auth.test.js` | **Nouveau** – tests JWT |
| `backend/test/health.test.js` | **Nouveau** – test health API |
| `backend/package.json` | @sentry/node, script test |
| `backend/RAILWAY.md` | SENTRY_DSN, section sauvegardes |
| `frontend/index.html` | Scripts inline remplacés par `/init.js` |
| `frontend/public/init.js` | **Nouveau** – thème et RTL |
| `README.md` | Instructions déploiement mises à jour |

---

## Recommandations restantes

1. **JWT_SECRET en production** : exécuter `node backend/scripts/generate-jwt-secret.js` et définir la valeur dans Railway Variables.
2. **FRONTEND_URL** : définir dans Railway si le frontend est sur un domaine différent.
3. **Vulnérabilités frontend** : les 2 modérées (esbuild/vite) nécessitent `npm audit fix --force` (passage à Vite 7). À évaluer selon la stabilité du projet.
4. **Prisma 6/7** : mise à jour possible après fermeture des processus utilisant les fichiers Prisma (OneDrive, antivirus, etc.).
5. **Sentry** : créer un projet sur sentry.io et définir `SENTRY_DSN` dans Railway pour activer le monitoring.
