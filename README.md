# ExamFleet

Free, bilingual (English + हिंदी) daily practice for SSC, Railway, Banking and State exams.

- **Daily Challenge:** 10 new questions every day, streaks and a WhatsApp share card
- **Speed Round:** as many correct answers as possible in 60 seconds
- **Practice by subject** with explanations, and crawlable **MCQ pages** for Google search
- **Match the Pairs** revision games, **Quick Notes**, and an **Age Eligibility Calculator**
- **Mock tests** in the real exam pattern: timer, question palette, mark for review, negative marking, section-wise analysis, all-India rank
- **Accounts** (Google or email link): progress synced across devices, dashboard with weak topics, Daily Challenge **leaderboard**
- **AI doubt helper** (Claude) that explains any question in Hindi or English
- **Premium** via Razorpay (₹49 / 30 days, ₹299 / year): all mocks, 50 AI explanations a day, ad-free
- **Coaching institutes**: join codes, class leaderboard and a student activity report
- **AdSense** slots for free users
- New questions are added every night by a scheduled Claude task (see `CONTENT_PLAYBOOK.md`)

Every account, AI, payment and ad feature switches on only when its keys are set, so the site always builds and runs. **See `SETUP.md` to turn them on.**

## Tech

Next.js (App Router, TypeScript) + Tailwind CSS on Vercel, Supabase (Postgres + auth, schema in `supabase/schema.sql`), Razorpay, Claude API. Content is plain JSON in `content/`, so adding questions is just editing files. Scores for leaderboards and mocks are always recomputed on the server, and mock questions are sent without answers.

```
content/
  questions/<subject>.json   question bank (bilingual)
  daily/YYYY-MM-DD.json      the 10 question ids for each day's challenge
  topics.json                Hindi names for topics
  notes/, match/             revision notes and match-the-pairs sets
  mocks/<slug>.json          mock tests (sections of question ids, timing, marking)
supabase/schema.sql          database tables, security rules and leaderboard functions
src/app/api/...              progress, mock, ai, pay (+ webhook) endpoints
scripts/validate-content.mjs  checks every content file (runs on every build)
src/app/[lang]/...           pages (/en/... and /hi/...)
```

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run validate   # check content
npm run stats      # question counts, next free ids
```

## Deploy (Vercel)

1. Import this repo at vercel.com → New Project (framework: Next.js, no settings to change).
2. Add the environment variable `NEXT_PUBLIC_SITE_URL` = your domain, e.g. `https://yourdomain.com`.
3. Add your domain under Project → Settings → Domains and copy the DNS records into your domain registrar.

Every push to `main` redeploys the site, including the nightly question updates.

## Ideas for later

- Phone OTP login (Supabase phone provider + an Indian SMS provider such as MSG91)
- Full-length mocks (100 questions) once the question bank is large enough
- Downloadable PDF question sets for Premium
- Push reminders to keep streaks alive
- Play Store app (wrap this site with Capacitor)
