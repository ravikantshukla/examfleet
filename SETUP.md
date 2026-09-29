# Turning on accounts, AI, payments and ads

The site runs without any of this. Each step below switches on one group of features. After adding keys in Vercel, **redeploy** (Deployments → ⋯ → Redeploy) so they take effect.

All keys go in **Vercel → your project → Settings → Environment Variables**. `.env.example` lists every key.

---

## 1. Accounts, leaderboards, mock history, institutes (Supabase, free tier)

1. Create a free project at [supabase.com](https://supabase.com). Choose the **Mumbai (ap-south-1)** region for speed in India.
2. Open **SQL Editor → New query**, paste all of `supabase/schema.sql`, and click **Run**. It is safe to run again later.
3. **Authentication → URL Configuration**
   - Site URL: `https://yourdomain.com`
   - Redirect URLs: add `https://yourdomain.com/auth/callback` (and your `…vercel.app/auth/callback` link while testing)
4. **Authentication → Sign In / Providers**
   - **Email** is on by default (login by email link).
   - **Google**: turn it on. It asks for a Client ID and Secret from [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → Create OAuth client ID → Web application. In Google, add the callback URL that Supabase shows you under "Authorized redirect URIs".
5. **Project Settings → API**: copy these into Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon / publishable key
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role / secret key (**never share this one**)

Now the **Log in** button appears, progress syncs across devices, the Daily Challenge leaderboard works, mock results are saved with an all-India rank, and coaching institutes can sign up.

## 2. AI doubt helper (Anthropic API, pay per use)

1. Create a key at [console.anthropic.com](https://console.anthropic.com) and add a little credit.
2. Add `ANTHROPIC_API_KEY` in Vercel.

Needs step 1 (it's for logged-in users). Free users get 3 explanations a day and Premium users 50, tracked in the `ai_usage` table. It uses the fast, low-cost Haiku model by default.

## 3. Premium payments (Razorpay)

1. Sign up at [razorpay.com](https://razorpay.com) and finish KYC. You can test first in **Test Mode**.
2. **Account & Settings → API Keys** → generate keys. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in Vercel.
3. **Account & Settings → Webhooks → Add new webhook**
   - URL: `https://yourdomain.com/api/pay/webhook`
   - Secret: make up a long random string, and add the same value as `RAZORPAY_WEBHOOK_SECRET` in Vercel
   - Events: `payment.captured` and `order.paid`
4. Redeploy. The Buy buttons on `/en/premium` now open Razorpay (UPI, cards, net banking, wallets).

Plans are one-time payments: **₹49 for 30 days** and **₹299 for 1 year**. Paying again extends the end date. To change prices, edit `PLANS` in `src/lib/payments.ts` and the prices in `src/components/PremiumCheckout.tsx`.

Premium unlocks every Premium mock test, 50 AI explanations a day and ad-free pages.

## 4. Ads (Google AdSense)

1. Apply at [adsense.google.com](https://adsense.google.com) with your domain. Approval usually needs some content and traffic first.
2. Once approved, create a **Display ad unit** and add `NEXT_PUBLIC_ADSENSE_CLIENT` (looks like `ca-pub-123…`) and `NEXT_PUBLIC_ADSENSE_SLOT` (the ad unit's number).

Ads appear on the home page, MCQ pages and quiz results, never for Premium users.

## 5. Coaching institutes

- Any logged-in user can create an institute at `/en/institute`. It gets a **6-character join code** and a **14-day trial**.
- Students join with the code or the WhatsApp share link, and the class gets its own leaderboard. The owner sees each student's activity for the last 7 days.
- Set `NEXT_PUBLIC_CONTACT_WHATSAPP` (e.g. `919876543210`) so institutes can contact you to continue after the trial.
- To activate a paying institute: Supabase → **Table Editor → institutes** → set `active_until` to the paid-until date.

## Admin tips

- **Give someone Premium manually:** Table Editor → `profiles` → set `premium_until`.
- **See payments:** Table Editor → `payments` (also visible in the Razorpay dashboard).
- **Users:** Authentication → Users.
