# ExamFleet – notes for Claude

- Next.js 16 App Router + TypeScript + Tailwind v4. Pages live under `src/app/[lang]/` (`en` and `hi`). UI strings are in `src/lib/i18n.ts`; content loaders in `src/lib/content.ts`.
- All questions, daily sets, notes and match sets are JSON in `content/`. Before adding or editing any content, read `CONTENT_PLAYBOOK.md` and follow it exactly.
- `npm run validate` checks content; `npm run build` runs it too. Never push a failing build.
- Don't use `next/font/google` (builds must work without network access to Google Fonts); fonts load via a `<link>` in the layout.
- Keep everything bilingual: any new UI text needs both `en` and `hi` entries.
- Accounts are optional Supabase auth (`src/lib/supabase/`, setup in `SUPABASE_SETUP.md`). With no `NEXT_PUBLIC_SUPABASE_*` env vars the build must still work and all login UI stays hidden. Progress UI always reads localStorage (`src/lib/progress.ts`); `SyncManager` mirrors it to Supabase. Schema changes go in a new file under `supabase/migrations/`, with RLS on every table.
