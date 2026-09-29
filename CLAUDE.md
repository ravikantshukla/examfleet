# ExamFleet – notes for Claude

- Next.js 16 App Router + TypeScript + Tailwind v4. Pages live under `src/app/[lang]/` (`en` and `hi`). UI strings are in `src/lib/i18n.ts`; content loaders in `src/lib/content.ts`.
- All questions, daily sets, notes and match sets are JSON in `content/`. Before adding or editing any content, read `CONTENT_PLAYBOOK.md` and follow it exactly.
- `npm run validate` checks content; `npm run build` runs it too. Never push a failing build.
- Don't use `next/font/google` (builds must work without network access to Google Fonts); fonts load via a `<link>` in the layout.
- Keep everything bilingual: any new UI text needs both `en` and `hi` entries.
- Supabase schema lives in `supabase/schema.sql` (idempotent; users can't write scores or premium themselves, the server does with the service role). Browser/server helpers: `src/lib/supabase/{browser,server,shared}.ts`.
- Every account/AI/payment/ads feature must keep working (hidden or "coming soon") when its env vars are missing, so `npm run build` passes with no keys. See `SETUP.md`.
- Never send answers to the browser before a mock test is submitted; always recompute scores on the server (`src/lib/scoring.ts`).
