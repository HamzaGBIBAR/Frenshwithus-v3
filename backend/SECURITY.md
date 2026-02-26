# Security Measures

## Implemented

### Database
- SSL/TLS for non-local Postgres (Railway)
- Prisma parameterized queries (no raw SQL)
- Credentials in env vars only (.env gitignored)

### Authentication
- Short-lived access tokens (20 min)
- Refresh tokens in httpOnly, secure, sameSite cookies
- No JWT in localStorage (XSS-safe)
- JWT_SECRET length warning (64+ chars in production)

### Backend
- Helmet security headers + CSP
- Rate limiting: 200 req/15min general, 10 req/15min for login
- HTTPS redirect in production
- CORS restricted (FRONTEND_URL or same-origin)
- Input validation (express-validator) on auth + admin routes
- JSON body limit 10kb

### Frontend
- withCredentials for cookie-based auth
- Token refresh on 401 with retry
- No secrets in frontend code

### Deployment
- Migrations in preDeployCommand (DB reachable)
- NODE_ENV=production recommended
- Run `npm run audit` regularly
