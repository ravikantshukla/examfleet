# ExamFleet content playbook

This file tells whoever adds content (a person, or the nightly Claude task) exactly how to do it.
Follow it strictly: the site is for real exam aspirants, and one wrong answer costs their trust.

## Where content lives

| What | File | Notes |
|---|---|---|
| Questions | `content/questions/<subject>.json` | One array per subject: `polity`, `history`, `geography`, `science`, `maths`, `reasoning`, `economy` (Economy & GK) |
| Daily Challenge | `content/daily/YYYY-MM-DD.json` | `{ "date": "YYYY-MM-DD", "ids": [10 question ids] }`. India date. If a day has no file, the site picks a stable random set. |
| Hindi topic names | `content/topics.json` | Every `topic` used in a question must have a Hindi name here |
| Notes | `content/notes/<slug>.json` | Bilingual one-page revision sheets (simple HTML: `p, h3, ul, li, table, b, div.tip`) |
| Match-the-pairs | `content/match/<slug>.json` | 4 to 6 pairs, bilingual |

Run `npm run validate` after every change (it also runs inside `npm run build`). Run `npm run stats` to see counts per topic, the latest daily set and the **next free id for each subject**.

## Question format

```json
{
  "id": "pol-0011",
  "subject": "polity",
  "topic": "Parliament",
  "exams": ["ssc", "railway", "bank", "state-psc"],
  "difficulty": "medium",
  "answer": 2,
  "en": { "q": "Question?", "o": ["A", "B", "C", "D"], "e": "Why the answer is right, plus one related fact." },
  "hi": { "q": "प्रश्न?", "o": ["क", "ख", "ग", "घ"], "e": "व्याख्या।" },
  "source": "Constitution of India, Art. 79",
  "added": "2026-09-30"
}
```

- `id`: subject prefix + next number (`pol`, `his`, `geo`, `sci`, `mat`, `rea`, `eco`). Never reuse or renumber ids.
- `answer`: index 0–3 of the correct option. Spread correct answers across A/B/C/D; don't make it always B.
- `exams`: any of `ssc`, `railway`, `bank`, `state-psc`, `upsc`, `defence`, `teaching`.
- `source`: the authoritative source you checked (NCERT book and class, Constitution article, RBI/PIB/ministry page). Use `Original` only for maths and reasoning.
- The Hindi block must say exactly the same thing as the English block, with the options in the same order.

## Quality rules (non-negotiable)

1. **Exactly one correct option.** Distractors must be plausible but clearly wrong.
2. **Verify every fact** against an authoritative source (NCERT, the Constitution, official government, RBI, ISRO, census or ministry sites). If sources disagree or you're not sure, drop the question.
3. **Maths and reasoning:** compute the answer with code (e.g. `node -e`) before writing it, and check no other option also works.
4. **Static GK only.** No current affairs, no "current/latest/present" office-holders, no records or rankings that change, no figures that differ between sources (e.g. exact coastline length).
5. **Original wording.** Write in the style of SSC/Railway/Bank papers, but never copy questions from coaching sites, books or previous papers.
6. **Natural Hindi**, the way Hindi-medium exam papers and NCERT Hindi books phrase it (e.g. अनुच्छेद, संशोधन, राष्ट्रपति शासन). Not word-for-word machine translation. Keep numerals as 0–9.
7. **Explanations teach something:** why the answer is right, and one related fact that often appears in exams.
8. **No duplicates.** Before writing, read the existing questions in that subject and topic. The validator rejects identical text, but also avoid asking the same fact in new words.
9. Keep questions under about 40 words and options short.

## Nightly routine (what the scheduled task does)

1. Work on `main` with a fresh `git pull`. Run `npm ci` and `npm run stats`.
2. **Pick the target date** (India time): today if `content/daily/<today>.json` is missing, otherwise tomorrow. If both exist, stop: nothing to do.
3. **Write 10 new questions** with this mix:
   - polity 1, history 2, geography 1, science 2, maths 1, reasoning 2, economy/GK 1
   - difficulty: 4 easy, 4 medium, 2 hard
   - prefer topics with the fewest questions in `npm run stats`, working through the syllabus below
4. Fact-check each one (rules above). Replace anything you can't verify.
5. Append them to the subject files with the next free ids and `added` = today's date. Add any new topic to `content/topics.json`.
6. Create `content/daily/<target>.json` with the 10 new ids, mixing subjects (don't put all of one subject together) and ending on the harder ones.
7. **Sundays:** also write one new note in `content/notes/` on a high-yield topic that has no note yet, bilingual, ending with a `div.tip` memory trick.
8. Run `npm run validate && npm run build`. Fix every error. Never push a failing build.
9. Commit as `content: daily quiz for <target> (+10 questions)` and push to `main`. Vercel deploys it automatically.

## Syllabus to work through (SSC / Railway / Bank / State PSC common core)

- **Polity:** Preamble, Fundamental Rights, DPSP, Fundamental Duties, President, Vice-President, PM & Council of Ministers, Parliament, State Legislature, Governor, Supreme Court, High Courts, Emergency, Amendments, Panchayati Raj, Constitutional bodies (ECI, CAG, UPSC, Finance Commission), Schedules, Sources of the Constitution
- **History:** Harappan civilisation, Vedic age, Buddhism & Jainism, Mauryas, Guptas, South Indian kingdoms, Delhi Sultanate, Vijayanagara, Mughals, Marathas, Bhakti & Sufi, British expansion, 1857, Reform movements, INC & freedom struggle, Governors-General & Viceroys, Constitution-making
- **Geography:** Solar system & Earth, Latitudes/longitudes, Rocks, Atmosphere, Indian physiography, Rivers & dams, Lakes, Climate & monsoon, Soils, Forests & national parks, Minerals, Agriculture & crops, States & capitals, World geography basics
- **Science:** Physics (motion, force, work & energy, light, sound, electricity, magnetism), Chemistry (atoms, acids/bases/salts, metals, carbon compounds, everyday chemistry), Biology (cell, human body systems, nutrition & vitamins, diseases, plants, genetics basics, ecology)
- **Maths:** Number system, LCM/HCF, Simplification, Percentage, Profit & loss, Discount, SI & CI, Ratio, Average, Ages, Time & work, Pipes, Speed/time/distance, Trains, Boats, Mensuration, Algebra basics, Geometry basics, Trigonometry basics, Data interpretation (simple)
- **Reasoning:** Analogy, Classification (odd one out), Number/letter series, Coding-decoding, Blood relations, Direction sense, Ranking/order, Syllogism, Seating arrangement (simple), Calendar, Clock, Venn diagrams, Mathematical operations, Missing number
- **Economy & GK:** RBI & banking, Monetary policy terms, Budget & taxation, Five-year plans & NITI Aayog, National income terms, Books & authors, National symbols, Important days, Space & defence organisations, Sports basics (static facts only), Awards (static facts only), First in India
