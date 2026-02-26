# Railway Deployment

## Environment Variables

Set in Railway dashboard:

- `DATABASE_URL` – Provided automatically when you add a Postgres service. Reference it from your app service: `${{Postgres.DATABASE_URL}}`
- `JWT_SECRET` – **Required.** Use 64+ character random string: `openssl rand -base64 48`
- `NODE_ENV` – Set to `production` in production
- `FRONTEND_URL` – (Optional) Restrict CORS to your app URL, e.g. `https://frenshwithus-v2-production.up.railway.app`

## Production Migration Command

**Option A – Migrations (recommended for production):**

```bash
npx prisma generate && npx prisma migrate deploy
```

Or: `npm run railway:deploy`

Use this after you’ve created migrations locally with `npx prisma migrate dev`.

**Option B – Schema push (no migration history):**

```bash
npx prisma generate && npx prisma db push
```

Use this if you haven’t created migrations yet. Add as a **build command** or **deploy hook** in Railway so it runs before `npm start`.

## SSL

The app appends `?sslmode=require` to `DATABASE_URL` if it’s not present, so Railway Postgres SSL works without extra config.
