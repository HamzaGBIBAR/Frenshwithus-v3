# Preparing the site for production

## Clear all test data and keep only the admin account

From the **backend** folder, run:

```bash
npm run db:reset-production
```

This will:

- Delete all **reservations** (contact form submissions)
- Delete all **blocked IPs**
- Delete all **users** except those with role `ADMIN` (professors and students are removed)
- Automatically remove their **courses**, **messages**, **availability**, **payments**, **notifications**, etc.

**Your admin account is kept** (e.g. `admin@frenchwithus.com` from the seed).

### When to run it

- After you have deployed to Railway and want to wipe test data.
- Ensure `DATABASE_URL` points to your **production** database when you run the command.

---

### Option A — Depuis ton PC (le plus simple)

Tu exécutes la commande sur ton ordinateur, mais en te connectant à la base **Railway** :

1. Ouvre **Railway** → ton projet → onglet **Variables**.
2. Copie la valeur de **`DATABASE_URL`** (clique sur "Reveal" si elle est masquée).
3. Sur ton PC, ouvre un terminal dans le dossier **`backend`** du projet.
4. Définis la variable une seule fois pour cette session (PowerShell) :
   ```powershell
   $env:DATABASE_URL="COLLE_ICI_LA_URL_COPIÉE"
   ```
   (Remplace `COLLE_ICI_LA_URL_COPIÉE` par la vraie valeur, sans espaces.)
5. Lance le reset :
   ```powershell
   npm run db:reset-production
   ```
6. Tu devrais voir les lignes "Deleted reservations: ...", "Deleted users: ...", etc. La base sur **Railway** est alors vidée (sauf le compte admin).

---

### Option B — Avec Railway CLI (commande dans l’environnement Railway)

1. Installe Railway CLI : https://docs.railway.app/develop/cli  
   (par ex. avec npm : `npm install -g @railway/cli`)
2. Connecte-toi : `railway login`
3. Dans le dossier **`backend`**, lie le projet : `railway link` (choisis ton projet et le bon service).
4. Lance la commande avec les variables Railway (donc la bonne `DATABASE_URL`) :
   ```bash
   railway run npm run db:reset-production
   ```
   La commande s’exécute avec l’environnement Railway ; la base de production est celle qui est modifiée.

### After reset

- Log in with your admin email and the password you set in the seed (`Fr3nchW1thUs#Adm1n2025!` unless you changed it).
- You can create new professors and students from the admin dashboard when you are ready.
