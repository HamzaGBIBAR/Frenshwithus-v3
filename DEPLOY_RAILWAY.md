# Déploiement Railway – contourner le timeout du snapshot

Si tu as l’erreur **"repository snapshot operation timed out"**, utilise le déploiement via la CLI Railway au lieu de GitHub.

## 1. Installer Railway CLI

```bash
npm install -g @railway/cli
```

Ou : https://docs.railway.app/develop/cli

## 2. Se connecter et lier le projet

```bash
railway login
cd FrenchWithUs
railway link
```

Choisis ton projet et le service `Frenchwithus-v2`.

## 3. Déployer depuis ta machine

```bash
railway up
```

Le déploiement se fait à partir de ton dossier local, sans passer par le snapshot GitHub.

## 4. Autres pistes si ça bloque encore

- Attendre quelques minutes et réessayer (problème réseau côté Railway)
- Vérifier https://status.railway.app
- Vérifier que le dépôt GitHub n’est pas trop volumineux (Railway conseille < 45 MB)
