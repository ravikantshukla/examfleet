# Supabase setup (accounts + synced progress)

Accounts are optional. Without the Supabase env vars the site runs exactly as before and progress lives only in the browser. With them, a **Login** button appears in the header, and each signed-in user's streak, best scores and subject accuracy are saved to their account and merged across devices.

About 15 minutes of clicking. Do the steps in order.

## 1. Create the project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Name: `examfleet`. Region: **Mumbai (ap-south-1)**, closest to your users and to Vercel's `bom1`. Save the database password in a password manager.

## 2. Create the tables

**Option A: dashboard (no install).** Open **SQL Editor → New query**, paste the whole of
[`supabase/migrations/20260929000000_accounts_and_progress.sql`](supabase/migrations/20260929000000_accounts_and_progress.sql) and click **Run**.

**Option B: CLI.**

```bash
npx supabase login
npx supabase link --project-ref YOUR-PROJECT-REF   # the ref is in the project URL
npx supabase db push                               # applies everything in supabase/migrations
```

Either way you get:

| Table | What it holds | Who can access it |
|---|---|---|
| `profiles` | name, avatar, preferred language (created automatically on sign-up) | the user themself |
| `progress` | streak, last daily date, best speed score, per-subject right/total | the user themself |
| `daily_scores` | one score per user per day (first attempt); ready for leaderboards | the user can add, never edit |

Row-level security is on for every table, so the public key in the browser can only reach the signed-in user's own rows.

## 3. Add the keys to the app

In Supabase, open **Project Settings → API Keys** and copy the **Project URL** and the **publishable key** (`sb_publishable_...`; the legacy `anon` key also works). Never use the `secret` / `service_role` key in this app.

- **Local:** `cp .env.example .env.local`, then fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- **Vercel:** Project → Settings → Environment Variables, add the same two keys (Production, Preview and Development), then redeploy.

## 4. Auth URLs

Supabase → **Authentication → URL Configuration**:

- **Site URL:** `https://YOUR-DOMAIN` (the value of `NEXT_PUBLIC_SITE_URL`)
- **Redirect URLs:** add
  - `https://YOUR-DOMAIN/auth/callback`
  - `http://localhost:3000/auth/callback`
  - `https://*-YOUR-VERCEL-TEAM.vercel.app/auth/callback` (optional, for preview deploys)

## 5. Email login code

Email login is on by default. The app asks for a **6-digit code**, so the email must contain it:

1. **Authentication → Emails → Templates → Magic Link**. Replace the body with:

   ```html
   <h2>Your ExamFleet login code</h2>
   <p>Enter this code in the app: <b style="font-size:24px;letter-spacing:4px">{{ .Token }}</b></p>
   <p>Or tap to log in: <a href="{{ .ConfirmationURL }}">Log in to ExamFleet</a></p>
   <p>आपका लॉगिन कोड: <b>{{ .Token }}</b></p>
   ```

2. Also paste it into the **Confirm signup** template, which new users receive on their first login.
3. **Authentication → Providers → Email**: set **Email OTP Length** to `6`.
4. Supabase's built-in mailer is limited to a few emails per hour, which is enough for testing only. Before launch, set up **Authentication → Emails → SMTP Settings** with a real provider (Brevo, Resend, Amazon SES, ...).

## 6. Google login

1. [Google Cloud Console](https://console.cloud.google.com/) → create a project → **APIs & Services → OAuth consent screen**: External, app name `ExamFleet`, your support email, and your domain as an authorised domain.
2. **Credentials → Create credentials → OAuth client ID** → *Web application*.
   - Authorised JavaScript origins: `https://YOUR-DOMAIN`, `http://localhost:3000`
   - Authorised redirect URI: `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback` (Supabase shows this exact URL on the Google provider page)
3. Supabase → **Authentication → Providers → Google**: enable it and paste the client ID and secret.

If you don't want Google yet, set `NEXT_PUBLIC_AUTH_GOOGLE=0` to hide the button.

## 7. Phone (SMS) login (optional)

SMS costs money and needs a provider. For India, MSG91 or Twilio with a DLT-registered template.

1. Supabase → **Authentication → Providers → Phone**: enable it and fill in your provider's credentials. The SMS template must include `{{ .Code }}`.
2. Set `NEXT_PUBLIC_AUTH_PHONE=1` in Vercel and redeploy. The login page then offers "Use mobile number" (+91 numbers).

## 8. Check it works

1. `npm run dev`, then open http://localhost:3000/en. A **Login** button appears at the top right.
2. Play the Daily Challenge while logged out, then log in with your email code.
3. Supabase → **Table Editor → progress** now has your row, and `daily_scores` has today's score.
4. Open the site in another browser and log in with the same account. Your streak appears there too.

## How sync works (for developers)

- `localStorage` is still the source the UI reads (`src/lib/progress.ts`). Every save fires an `ef:progress` event.
- `src/components/SyncManager.tsx` (mounted in the layout) listens to that event and to Supabase auth changes:
  - **On sign-in:** it pulls the account's `progress` + `daily_scores`, merges them with the browser's copy (`mergeProgress`: newer streak wins, best scores take the max, each subject keeps the record with more answers), saves locally and pushes back.
  - **While signed in:** each save is pushed 1.5 s later (debounced).
  - Progress that a *different* account left in this browser is never merged into the new one. Logging out clears this device's copy.
- `/auth/callback` (`src/app/auth/callback/route.ts`) finishes Google sign-in and email-link sign-in and sets the session cookie. `src/lib/supabase/server.ts` is ready for server-side reads (e.g. leaderboards, premium checks).
- Scores are written by the browser, so a determined user could fake their own numbers. That doesn't matter while they're private. **Before building a public leaderboard**, compute daily scores on the server (a route handler or an Edge Function that grades answers), and drop the `daily_scores: insert own` policy.
