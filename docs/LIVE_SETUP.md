# Configuration du cours en direct (Live) – Style Teams

## Vue d'ensemble

Chaque **cours** a sa propre salle live (comme Teams). L'accès se fait depuis le **planning** :

- **Professeur** : Planning → cours du jour → « Démarrer le cours » → ouvre la salle Jitsi
- **Étudiant** : Mes cours → prochains cours → « Rejoindre » → rejoint la salle (ou attend le professeur)

## Flux

1. Le cours apparaît dans le planning (professeur et étudiant)
2. Le jour du cours, le professeur clique « Démarrer le cours » sur le cours concerné
3. Le professeur entre dans la salle Jitsi (room = `frenchwithus-course-{courseId}`)
4. L'étudiant clique « Rejoindre » sur son cours
5. Si le professeur est déjà en ligne → salle affichée
6. Sinon → message d'attente + notification toast quand le professeur arrive

## Règles de sécurité

- Accès à `/live?courseId=xxx` uniquement pour le professeur ou l'étudiant du cours
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
| GET | `/api/live-access?courseId=xxx` | Vérifie l'accès au cours et l'état `professorOnline` |
| POST | `/api/live/session/start` | Professeur : démarre une session (body: `{ courseId }`) |
| POST | `/api/live/session/end` | Professeur : termine une session (optionnel : `recordingUrl`) |
| GET | `/api/live/sessions` | Historique des sessions (professeur/admin) |

## Test

1. Créer un cours (admin) pour aujourd'hui, assigner un professeur et un étudiant
2. **Professeur** : Planning → trouver le cours → « Démarrer le cours » → salle Jitsi s'ouvre
3. **Étudiant** : Mes cours → prochains cours → « Rejoindre » → si le prof est en ligne, salle affichée ; sinon message d'attente
4. Quand le professeur rejoint, l'étudiant en attente reçoit une notification toast

## CSP (Content Security Policy)

En production, `meet.jit.si` est autorisé dans `script-src`, `connect-src` et `frame-src` pour permettre l'iframe Jitsi.
