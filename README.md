# French With Us – MVP

Minimal internal course management platform for French lessons.

## Tech Stack

- **Backend:** Node.js, Express, PostgreSQL, Prisma, JWT
- **Frontend:** React (Vite), Tailwind, Axios, React Router

## Setup

### 1. Database

Create a PostgreSQL database and set the connection string in `backend/.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/frenchwithus"
JWT_SECRET="your-secret-key-change-in-production"
PORT=3001
```

### 2. Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
node prisma/seed.js
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Access

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3001

**Default admin:** `admin@frenchwithus.com` / `admin123`

## Deploy on Railway

1. Connect your GitHub repo to Railway.
2. Railway détecte le projet via `nixpacks.toml` (racine).
3. Variables d'environnement (Railway Variables) :
   - `DATABASE_URL` – Chaîne de connexion PostgreSQL (Railway peut en provisionner une)
   - `JWT_SECRET` – **≥64 caractères** (générer : `node backend/scripts/generate-jwt-secret.js`)
   - `FRONTEND_URL` – (optionnel) URL du frontend pour CORS si différent du domaine principal
   - `NODE_ENV=production`
4. Les migrations s'exécutent automatiquement au déploiement (`preDeployCommand`).
5. Le seed s'exécute après les migrations (admin créé si absent).

The build compiles the frontend, copies it to `backend/public`, and serves everything from a single Node process.

## Roles

- **Admin** – Create professors/students, assign students, manage payments, view courses and revenue
- **Professor** – Create courses, add meeting/recording links, start sessions, message students
- **Student** – View courses, access meeting link (when unlocked), view recordings, see payments, message professor

## Course Access Rule

Students can access the meeting link only when:
1. Course date/time has been reached
2. Professor has clicked "Start Course"

Otherwise they see: *"The professor has not started the session yet."*
