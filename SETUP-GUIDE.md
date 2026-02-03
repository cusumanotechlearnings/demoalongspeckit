# Synthesis: Setup Guide (No Coding Required)

This guide walks you through everything you need to get Synthesis running on your computer. Think of it like a checklist: do each step in order, and you’ll be able to open the app in your browser and use it.

---

## What You’re Setting Up (In Plain English)

Synthesis needs a few “keys” and one “database” so it can:

1. **Remember who’s signed in** (so you don’t have to log in every time).
2. **Store your resources, assignments, and reports** (so nothing disappears when you close the browser).
3. **Generate quizzes and feedback** (using an AI service).
4. **Store uploaded files** (PDFs, images) so they’re saved with your account.

You’ll create or sign up for each of these, then paste the keys into one file. That’s it.

---

## Step 1: Install Node.js (If You Haven’t Already)

**What it is:** The program that runs the Synthesis app on your computer.

**What to do:**

1. Go to [https://nodejs.org](https://nodejs.org).
2. Download the **LTS** version (the one that says “Recommended for most users”).
3. Run the installer and follow the prompts (you can leave everything as default).
4. Restart your computer or terminal when it’s done.

**How to check it worked:** Open Terminal (Mac) or Command Prompt (Windows), type `node -v`, and press Enter. You should see a version number like `v20.x.x`.

---

## Step 2: Create a Secret for Sign-In (NEXTAUTH_SECRET)

**What it is:** A random password that the app uses behind the scenes to keep your sign-in session secure. You never type this anywhere except in the setup file.

**What to do:**

1. Open Terminal (Mac) or Command Prompt (Windows).
2. Paste this and press Enter:
   - **Mac/Linux:** `openssl rand -base64 32`
   - **Windows (PowerShell):**  
     `[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])`
3. Copy the long string that appears (no spaces). You’ll paste it in Step 6.

**Example of what it looks like:** `K7x9mN2pQ4rT6vY8zA1bC3dE5fG7hJ9kL0mN2pQ4rT6vY8=`

---

## Step 3: Set Up a Database (PostgreSQL)

**What it is:** A place where the app stores users, resources, assignments, and reports. Without it, the app can’t save anything when you’re signed in.

**Easiest option: use a free hosted database**

Pick one of these (all have free tiers):

### Option A: Vercel Postgres (good if you might deploy to Vercel later)

1. Go to [https://vercel.com](https://vercel.com) and sign in (or create an account).
2. Open your **Dashboard** → **Storage** → **Create Database**.
3. Choose **Postgres** and create it (use the default name or pick one).
4. Open the new database → **.env.local** tab (or **Connect** / **Connection string**).
5. Copy the line that looks like:  
   `POSTGRES_URL="postgres://default:xxxxx@xxxxx.postgres.vercel-storage.com:5432/verceldb?sslmode=require"`
6. You’ll need the **full URL** (sometimes called `DATABASE_URL` or `POSTGRES_URL`). Save it for Step 6.

### Option B: Neon (free tier, no credit card for hobby)

1. Go to [https://neon.tech](https://neon.tech) and sign up.
2. Create a new project (e.g. “Synthesis”).
3. On the project dashboard, find **Connection string** (or “Connection details”).
4. Copy the **connection string** (starts with `postgresql://`). Save it for Step 6.

### Option C: Supabase (free tier)

1. Go to [https://supabase.com](https://supabase.com) and sign up.
2. Create a new project (name it “Synthesis” or whatever you like).
3. Go to **Project Settings** → **Database**.
4. Under **Connection string**, choose **URI** and copy it. It should start with `postgresql://`. Save it for Step 6.

**Important:** The app expects the variable to be named `DATABASE_URL`. If your provider gives you `POSTGRES_URL` or something else, you can still use it—just name it `DATABASE_URL` when you paste it in Step 6.

---

## Step 4: Create the Database Tables

**What it is:** The database is empty at first. The app needs “tables” (like spreadsheets) to store users, resources, etc. We give the database a script that creates those tables once.

**What to do:**

1. Open the schema file in your project:  
   **`lib/db/schema.sql`**  
   (Open it in any text editor, or in Cursor/VS Code.)
2. Select all the text in that file (Ctrl+A or Cmd+A) and copy it.
3. In your database provider’s dashboard:
   - **Vercel Postgres:** Use the **Query** tab (or “SQL Editor”) and paste the script, then run it.
   - **Neon:** Open **SQL Editor**, paste the script, and run it.
   - **Supabase:** Go to **SQL Editor** → **New query**, paste the script, and run it.
4. You should see a success message (e.g. “Success” or “Query executed”). You only need to do this once per database.

**If you already ran the schema before:** The app now uses password-based login and forgot-password. Run the migration script **`lib/db/migrations/001_add_passwords.sql`** in your database's SQL editor (same way as above). This adds the password fields and reset-token table.

---

## Step 5: Get an AI API Key (OpenAI)

**What it is:** Synthesis uses an AI service to generate quizzes, extract topics from your text, and grade answers. For that it needs an “API key”—like a password that lets the app talk to the AI.

**What to do:**

1. Go to [https://platform.openai.com](https://platform.openai.com) and sign in or create an account.
2. Click your profile (top right) → **View API keys** (or go to [API keys](https://platform.openai.com/api-keys)).
3. Click **Create new secret key**. Give it a name (e.g. “Synthesis”) and create it.
4. **Copy the key immediately.** It looks like `sk-...` and is shown only once. Save it somewhere safe (e.g. a password manager) and paste it in Step 6.

**Note:** Using the API costs money after free credits. Check OpenAI’s pricing. For light testing, the free tier is often enough.

---

## Step 6: Get a Blob Storage Token (Vercel Blob) — Optional for Basic Use

**What it is:** When you upload files (PDFs, images), the app can store them using Vercel Blob. If you skip this, **text-only** resources and the Instant Challenge will still work; file uploads will fail until you add a token.

**What to do (if you want file uploads):**

1. Go to [https://vercel.com](https://vercel.com) and sign in.
2. Open your **Dashboard** → **Storage** → **Create Database** (or **Blob** if listed).
3. Create a **Blob** store (name it e.g. “Synthesis uploads”).
4. Open it and find **`.env.local`** or **Tokens**.
5. Copy the token that looks like `vercel_blob_rw_...`. Save it for Step 7.

---

## Step 7: Create Your `.env.local` File (Where All the Keys Live)

**What it is:** A private file in your project that holds your secrets. The app reads this file when it starts. **Never share this file or put it on GitHub.**

**What to do:**

1. In your project folder, find the file **`.env.example`** (it might be hidden; in Cursor/VS Code you can open it from the file list).
2. Copy that file and name the copy **`.env.local`** (same folder as `.env.example`).
3. Open **`.env.local`** in a text editor and fill in each value. Replace the placeholder text with your real values. No quotes are needed unless the value has spaces.

**Example of a filled-in `.env.local`:**

```env
# Database — paste your full connection string from Step 3
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# Where the app runs (leave as-is for local)
NEXTAUTH_URL="http://localhost:3000"

# Paste the secret you generated in Step 2
NEXTAUTH_SECRET="K7x9mN2pQ4rT6vY8zA1bC3dE5fG7hJ9kL0mN2pQ4rT6vY8="

# Paste your OpenAI key from Step 5 (starts with sk-)
OPENAI_API_KEY="sk-your-actual-key-here"

# Optional — only if you set up Blob in Step 6
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_your-token-here"

# Optional — for "Forgot password" emails (Resend). Get a key at https://resend.com
# RESEND_API_KEY="re_xxxx"
# EMAIL_FROM="The Forge <onboarding@resend.dev>"
# NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. Save the file and close it. You’re done with setup.

**Forgot password:** To send reset-link emails, add `RESEND_API_KEY` (from [Resend](https://resend.com)) and optionally `EMAIL_FROM` and `NEXT_PUBLIC_APP_URL`. Without these, "Forgot password" will respond successfully but no email is sent.

---

## Step 8: Install Dependencies and Run the App

**What to do:**

1. Open Terminal (or Command Prompt) and go to your project folder, for example:
   - **Mac/Linux:** `cd "/Users/rachelcusumano/Desktop/Overclock Acc Bootcamp/TheForge/demoalongspeckit"`
   - (Use your actual path if it’s different.)
2. Run:  
   `npm install`  
   Wait until it finishes (it downloads the code the app needs).
3. Run:  
   `npm run dev`  
   Wait until you see something like “Ready” or “Local: http://localhost:3000”.
4. Open your browser and go to:  
   **http://localhost:3000**

You should see the Synthesis landing page. Try pasting some text and clicking “Generate Challenge” to test the Instant Challenge.

---

## Quick Checklist

Before you run the app, make sure you’ve done the following:

| Step | What | Required? |
|------|------|------------|
| 1 | Node.js installed | ✅ Yes |
| 2 | NEXTAUTH_SECRET generated | ✅ Yes (for sign-in) |
| 3 | PostgreSQL database created (Vercel / Neon / Supabase) | ✅ Yes (for saving data) |
| 4 | Database tables created (run `lib/db/schema.sql`) | ✅ Yes |
| 5 | OpenAI API key | ✅ Yes (for quizzes and AI features) |
| 6 | Vercel Blob token | ⚪ Optional (only for file uploads) |
| 7 | `.env.local` created and filled in | ✅ Yes |
| 8 | `npm install` then `npm run dev` | ✅ Yes |

---

## Deploying to Vercel

If you deploy this app to Vercel and see **“Server error” at `/api/auth/error`** when signing in, the cause is usually missing or wrong environment variables in the Vercel project.

**In Vercel: Project → Settings → Environment Variables**, add (for Production, and optionally Preview/Development):

| Variable | Example / notes |
|----------|------------------|
| **NEXTAUTH_URL** | `https://your-app.vercel.app` — **no trailing slash**. Use your real Vercel URL. |
| **NEXTAUTH_SECRET** | Same value as in `.env.local` (the long random string from Step 2). |
| **DATABASE_URL** or **POSTGRES_URL** | Your production Postgres connection string (e.g. Vercel Postgres, Neon, Supabase). |
| **OPENAI_API_KEY** | Your OpenAI API key (needed for assignments and AI). |
| **BLOB_READ_WRITE_TOKEN** | Optional; only if you use file uploads in production. |

After changing environment variables, **redeploy** the project (Deployments → … → Redeploy).

Also ensure your **production database** has the same schema as local (run `lib/db/schema.sql` and any migrations in `lib/db/migrations/` against the production DB).

---

## What If Something Goes Wrong?

- **“OPENAI_API_KEY is missing”**  
  You didn’t add `OPENAI_API_KEY` to `.env.local`, or the app is reading a different file. Make sure the file is named exactly `.env.local` and is in the project root (same folder as `package.json`).

- **“missing_connection_string” or “no POSTGRES_URL env var found”**  
  Add your database URL to `.env.local` as **`DATABASE_URL`** (the app also accepts `POSTGRES_URL`). Example: `DATABASE_URL="postgresql://user:pass@host:5432/dbname?sslmode=require"`. Restart `npm run dev` after changing `.env.local`.

- **“Database connection” or “relation does not exist”**  
  Either `DATABASE_URL` in `.env.local` is wrong, or you didn’t run the SQL script from `lib/db/schema.sql` in your database (Step 4).

- **“Sign in doesn’t work” or session errors**  
  Locally: check that `NEXTAUTH_URL` is `http://localhost:3000` and `NEXTAUTH_SECRET` is set (Step 2).  
  On Vercel: see **Deploying to Vercel** above — set `NEXTAUTH_URL` to your production URL (e.g. `https://your-app.vercel.app`) and ensure `NEXTAUTH_SECRET` and `DATABASE_URL`/`POSTGRES_URL` are set in the Vercel project.

- **File upload fails**  
  Add `BLOB_READ_WRITE_TOKEN` to `.env.local` (Step 6). Until then, only text resources work.

- **Port 3000 already in use**  
  Another app is using that port. Either close it or run the app on another port, e.g. `npm run dev -- -p 3001`, then open http://localhost:3001.

---

## Need More Detail?

- Technical quickstart (for developers): **`specs/001-synthesis-web-app/quickstart.md`**
- Database table definitions: **`lib/db/schema.sql`**
- Example env file: **`.env.example`**

Once everything is in place, you can use the app, sign in, add resources, and run through the flows described in the quickstart.
