# Deploying Amazon Business OS (GitHub → Neon → Vercel)

Three pieces are always required: **(1)** your code on **GitHub**, **(2)** a cloud
**Neon** Postgres database, **(3)** a **Vercel** project that connects them.

Do these in order. **Do not delete your local files until Step 4 shows a working live URL.**

---

## Step 1 — Push the code to GitHub

1. Create a new **private** repo at <https://github.com/new> named `amazon-business-os`.
   Do **not** add a README/.gitignore (the repo already has them).
2. In a terminal in the project folder, connect and push:

   ```bash
   cd C:\Users\P.C\Projects\amazon-business-os
   git branch -M main
   git remote add origin https://github.com/<YOUR-USERNAME>/amazon-business-os.git
   git push -u origin main
   ```

   The first push opens a browser to sign in to GitHub (Git Credential Manager). After
   this, your code is safe off your machine. ✅

---

## Step 2 — Create the Neon database

1. Sign up at <https://neon.tech> and create a project (name it anything).
2. In the project dashboard, open **Connect** and copy **two** connection strings:
   - **Pooled** connection (host contains `-pooler`) → this becomes `DATABASE_URL`
   - **Direct** connection (host has **no** `-pooler`) → this becomes `DIRECT_URL`
3. Append `?sslmode=require` if not already present. For the pooled URL also add
   `&pgbouncer=true`, e.g.:

   ```
   DATABASE_URL = postgresql://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true
   DIRECT_URL   = postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### (Optional but recommended) Load demo data into Neon — do this BEFORE wiping your PC

The Vercel build auto-creates the tables (`prisma migrate deploy`), but the demo data
(partners, sales, etc.) is seeded by a separate command. To have a populated dashboard
on first load, run once from your machine against Neon:

```bash
# temporarily point at Neon and seed
$env:DATABASE_URL="<your DIRECT_URL>"; $env:DIRECT_URL="<your DIRECT_URL>"
npx prisma migrate deploy
npm run db:seed
```

(PowerShell syntax shown. Skip this if you'd rather start with an empty app and enter
real data yourself.)

---

## Step 3 — Deploy on Vercel

1. Sign up at <https://vercel.com> with your GitHub account.
2. **Add New → Project → Import** your `amazon-business-os` repo. Vercel auto-detects
   Next.js — leave build settings default.
3. Before deploying, add **Environment Variables** (Settings → Environment Variables):

   | Name           | Value                                            |
   | -------------- | ------------------------------------------------ |
   | `DATABASE_URL` | your Neon **pooled** URL (`-pooler`, `pgbouncer`)|
   | `DIRECT_URL`   | your Neon **direct** URL                         |
   | `NEXT_PUBLIC_APP_NAME` | `Amazon Business OS`                       |

   (Add Clerk/AWS keys later when you enable auth and receipt uploads.)
4. Click **Deploy**. Vercel runs `prisma generate && prisma migrate deploy && next build`,
   which creates your tables in Neon automatically. In ~2 minutes you get a live URL like
   `https://amazon-business-os.vercel.app`.

---

## Step 4 — Verify, THEN clean up

1. Open the Vercel URL and confirm `/dashboard` loads.
2. Confirm your code shows on GitHub.
3. Only now is it safe to delete local files. To work on it again on any machine:

   ```bash
   git clone https://github.com/<YOUR-USERNAME>/amazon-business-os.git
   cd amazon-business-os
   npm install
   # for local dev, copy .env.example → .env and either use Neon or `npm run db:start`
   ```

---

## Notes

- **Redeploys are automatic**: every `git push` to `main` triggers a new Vercel deploy.
- **Local dev still uses embedded Postgres** (`npm run db:start`) — unrelated to Neon.
- If a Vercel build fails on `prisma migrate deploy`, double-check `DIRECT_URL` is the
  **non-pooled** Neon URL.
