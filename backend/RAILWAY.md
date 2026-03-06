# Railway Deployment

## Environment Variables

Set in Railway dashboard:

- `DATABASE_URL` – Provided automatically when you add a Postgres service. Reference it from your app service: `${{Postgres.DATABASE_URL}}`
- `JWT_SECRET` – **Required.** Use 64+ character random string: `openssl rand -base64 48`
- `NODE_ENV` – Set to `production` in production
- `FRONTEND_URL` – (Optional) Restrict CORS to your app URL, e.g. `https://frenshwithus-v2-production.up.railway.app`
- `DISABLE_LIVE_SOCKET` – (Optional) Set to `true` or `1` to disable WebSocket (live “professor online”). Use this if you see **503 Backend.max_conn reached**: it reduces concurrent connections so the site can load. The Live page will show professor as offline.
- `SENTRY_DSN` – (Optional) Monitoring des erreurs avec Sentry
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` – (Required for avatar uploads) Créer un compte sur cloudinary.com

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

## Sauvegardes base de données

1. **Railway Backups** : Activer les backups automatiques dans le dashboard Postgres (plans payants).
2. **Export manuel** : `pg_dump $DATABASE_URL > backup.sql` (Railway Shell ou localement).
3. **Cron externe** : cron-job.org ou GitHub Actions pour dump quotidien vers S3/storage externe.

## 503 Backend.max_conn reached

On free/low-tier Railway the proxy limits how many concurrent connections hit your app. If you see this error:

1. **Quick fix:** In Railway → your service → Variables, add `DISABLE_LIVE_SOCKET` = `true` and redeploy. The site should load; the "professor online" live indicator will be off.
2. **Long-term:** Upgrade your Railway plan for higher connection limits, or host the frontend on Vercel/Netlify so only API traffic hits Railway.

## SSL

The app appends `?sslmode=require` to `DATABASE_URL` if it’s not present, so Railway Postgres SSL works without extra config.
