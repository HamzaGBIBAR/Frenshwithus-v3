# Configuration du cours en direct (Live)

## Vue d'ensemble

Le système permet aux **étudiants** et **professeurs** d'accéder à des cours en direct via Jitsi Meet. Les étudiants ne peuvent rejoindre que lorsque le professeur est déjà en ligne.

## Règles de sécurité

- Seuls les rôles `STUDENT` et `PROFESSOR` peuvent accéder à `/live`
- Les étudiants voient un message d'attente tant que le professeur n'est pas connecté
- Notification toast automatique quand le professeur arrive
- Vérification JWT côté serveur pour toutes les routes

## Démarrage

### 1. Base de données

```bash
cd backend
npx prisma db push   # ou npx prisma migrate deploy
npx prisma generate  # si nécessaire
```

### 2. Backend

```bash
cd backend
npm run dev
```

Le serveur démarre avec :
- API REST sur `/api`
- WebSocket sur `/live-socket` pour l'état `professorOnline` et les notifications

### 3. Frontend (développement)

```bash
cd frontend
npm run dev
```

Le proxy Vite redirige `/api` et `/live-socket` vers le backend.

### 4. Production

- Build : `cd frontend && npm run build`
- Le backend sert les fichiers statiques depuis `backend/public`
- Configurer `FRONTEND_URL` ou `RAILWAY_PUBLIC_DOMAIN` pour CORS et WebSocket

## Enregistrement des sessions

Le modèle `LiveSession` stocke les métadonnées (début, fin, lien d'enregistrement).

### Option A : Jitsi Meet (meet.jit.si)

L'enregistrement nécessite un déploiement Jitsi auto-hébergé avec **Jibri**. Le service public meet.jit.si ne permet pas l'enregistrement programmatique.

### Option B : Daily.co

1. Créer un compte sur [daily.co](https://daily.co)
2. Obtenir une API key
3. Adapter le frontend pour utiliser l'API Daily au lieu de Jitsi
4. Lors de la fin de session, récupérer l'URL d'enregistrement et l'envoyer à `POST /api/live/session/end` avec `{ sessionId, recordingUrl }`

## API

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/live-access` | Vérifie l'accès et l'état `professorOnline` |
| POST | `/api/live/session/start` | Professeur : démarre une session |
| POST | `/api/live/session/end` | Professeur : termine une session (optionnel : `recordingUrl`) |
| GET | `/api/live/sessions` | Historique des sessions (professeur/admin) |

## Test

1. Se connecter en tant que **professeur** → aller sur `/live` → la salle Jitsi s'affiche
2. Dans un autre navigateur (ou mode privé), se connecter en tant qu'**étudiant** → aller sur `/live` → message d'attente
3. Quand le professeur est sur `/live`, l'étudiant reçoit une notification toast et la salle s'affiche automatiquement

## CSP (Content Security Policy)

En production, `meet.jit.si` est autorisé dans `script-src`, `connect-src` et `frame-src` pour permettre l'iframe Jitsi.
