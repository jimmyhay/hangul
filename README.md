# Korean/Japanese ↔ English Translator — self-hosted version

This is the Vercel-ready version of your translator app: static frontend
in `public/index.html`, two backend functions in `api/`, no window.storage
dependency.

## What you need first

- An Anthropic API key: https://console.anthropic.com (Settings > API Keys).
  This is billed separately from your claude.ai subscription — pay-per-use,
  translation calls for personal use cost fractions of a cent each.
- A Supabase project (you already have an account).
- A Vercel account (you already have one).
- Git and a GitHub account (Vercel deploys from a GitHub repo).

## 1. Set up Supabase

1. In the Supabase dashboard, create a new project (any name/region/password
   you like — the password is just for direct DB access, you won't need it
   day to day).
2. Once it's ready, go to **SQL Editor > New query**, paste in the contents
   of `supabase-schema.sql` from this folder, and click **Run**.
3. Go to **Project Settings > API**. You'll need two values from here in a
   minute: the **Project URL** and the **service_role key** (not the
   `anon` key — the service_role key, since our function needs full access
   and the frontend never talks to Supabase directly).

## 2. Push this folder to GitHub

```bash
cd vercel-app
git init
git add .
git commit -m "Initial commit"
```
Create a new empty repo on GitHub, then:
```bash
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main
```

## 3. Deploy on Vercel

1. In the Vercel dashboard: **Add New > Project**, import the GitHub repo
   you just pushed.
2. Before deploying, open **Environment Variables** and add:
   - `ANTHROPIC_API_KEY` — your key from console.anthropic.com
   - `SUPABASE_URL` — the Project URL from Supabase step 1.3
   - `SUPABASE_SERVICE_ROLE_KEY` — the service_role key from step 1.3
   - `APP_SECRET` — make up any private passphrase (letters/numbers, no
     spaces needed) — this is what keeps random visitors from reading or
     wiping your flashcards if they ever find your app's URL. Treat it like
     a password.
3. Click **Deploy**. Vercel will build and give you a live URL like
   `your-app.vercel.app`.

## 4. First open

Visit your new URL. The app will ask you to enter your app passphrase once
(the same `APP_SECRET` value from step 3.2) — it's saved in that browser
after that, so you won't be asked again on that device. Enter it again if
you open the app on a different device/browser.

## 5. Put it on your phone

Open the URL in Safari on your iPhone, tap **Share > Add to Home Screen**.
It'll behave like a native app from there — and this time, since it's not
running inside claude.ai's sandbox, everything (including anything that
needs real network access) works normally.

## Notes

- Your existing flashcards saved inside claude.ai **do not** carry over
  automatically — that's a separate storage system. Ask me for an export
  tool if you want to move them across.
- Redeploying after future changes: just `git push` — Vercel auto-deploys
  every push to `main`.
- If you ever rotate `APP_SECRET`, update it in both Vercel's environment
  variables and clear `localStorage` on each device (or just update the
  value there) so they match.
