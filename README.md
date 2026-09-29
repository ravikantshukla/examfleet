# ExamFleet

Free, bilingual (English + हिंदी) daily practice for SSC, Railway, Banking and State exams.

- **Daily Challenge:** 10 new questions every day, streaks and a WhatsApp share card
- **Speed Round:** as many correct answers as possible in 60 seconds
- **Practice by subject** with explanations, and crawlable **MCQ pages** for Google search
- **Match the Pairs** revision games, **Quick Notes**, and an **Age Eligibility Calculator**
- New questions are added every night by a scheduled Claude task (see `CONTENT_PLAYBOOK.md`)

## Tech

Next.js (App Router, TypeScript) + Tailwind CSS, deployed on Vercel. Content is plain JSON in `content/`, so adding questions is just editing files. Progress (streaks, accuracy) is stored in the browser, and synced to the user's account when they log in (Supabase: Google or email code, optional SMS). Payments and AI features come next.

```
content/
  questions/<subject>.json   question bank (bilingual)
  daily/YYYY-MM-DD.json      the 10 question ids for each day's challenge
  topics.json                Hindi names for topics
  notes/, match/             revision notes and match-the-pairs sets
scripts/validate-content.mjs  checks every content file (runs on every build)
supabase/migrations/          database tables + row-level security for accounts
src/app/[lang]/...           pages (/en/... and /hi/...)
```

## Run locally

```bash
npm install
cp .env.example .env.local   # optional: Supabase keys for login (see SUPABASE_SETUP.md)
npm run dev        # http://localhost:3000
npm run validate   # check content
npm run stats      # question counts, next free ids
```

## Deploy (Vercel)

1. Import this repo at vercel.com → New Project (framework: Next.js, no settings to change).
2. Add the environment variable `NEXT_PUBLIC_SITE_URL` = your domain, e.g. `https://yourdomain.com`. For accounts, also add the Supabase keys: follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md).
3. Add your domain under Project → Settings → Domains and copy the DNS records into your domain registrar.

Every push to `main` redeploys the site, including the nightly question updates.

## Roadmap

1. ~~Login (Google / email / phone OTP) with Supabase, synced streaks and progress~~ ✅ (see `SUPABASE_SETUP.md`)
2. Full mock tests with timers and all-India leaderboard
3. Premium plan via Razorpay (ad-free, detailed analytics, weak-topic practice, PDFs)
4. AI doubt helper in Hindi and English (Claude API)
5. Coaching-centre white-label dashboards
