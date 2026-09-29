import Link from "next/link";
import { DICT, isLang } from "@/lib/i18n";
import { SUBJECTS, SUBJECT_KEYS, getQuestions } from "@/lib/content";
import { Hero, SubjectProgress } from "@/components/HomeStatus";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params;
  const lang = isLang(l) ? l : "en";
  const t = DICT[lang];
  const all = getQuestions();
  const counts = Object.fromEntries(SUBJECT_KEYS.map((k) => [k, all.filter((q) => q.subject === k).length]));
  const labels = Object.fromEntries(SUBJECT_KEYS.map((k) => [k, SUBJECTS[k][lang]]));

  const modes = [
    { href: "speed", icon: "⚡", title: t.modes.speed, sub: t.modes.speedSub, hot: true },
    { href: "games", icon: "🧩", title: t.modes.match, sub: t.modes.matchSub, hot: true },
    { href: "notes", icon: "📘", title: t.modes.notes, sub: t.modes.notesSub },
    { href: "tools/age-calculator", icon: "🎂", title: t.modes.age, sub: t.modes.ageSub },
  ];

  return (
    <>
      <Hero lang={lang} t={t.home} />

      <h2 className="mt-7 mb-3 text-2xl">{t.home.games}</h2>
      <div className="grid grid-cols-2 gap-3">
        {modes.map((m) => (
          <Link key={m.href} href={`/${lang}/${m.href}`} className={`tile ${m.hot ? "border-transparent bg-accent-soft" : ""}`}>
            <span className="text-2xl">{m.icon}</span>
            <b>{m.title}</b>
            <small>{m.sub}</small>
          </Link>
        ))}
      </div>

      <h2 className="mt-7 mb-3 text-2xl">{t.home.practice}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {SUBJECT_KEYS.map((k) => (
          <Link key={k} href={`/${lang}/practice/${k}`} className="tile">
            <span className="text-2xl">{SUBJECTS[k].icon}</span>
            <b>{SUBJECTS[k][lang]}</b>
            <small>{counts[k]} {t.home.questions}</small>
          </Link>
        ))}
      </div>

      <SubjectProgress labels={labels} empty={t.home.progressEmpty} title={t.home.progress} />

      <h2 className="mt-7 mb-3 text-xl">{t.home.bank}</h2>
      <div className="flex flex-wrap gap-2">
        {SUBJECT_KEYS.map((k) => (
          <Link key={k} href={`/${lang}/mcq/${k}`} className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink no-underline">
            {SUBJECTS[k][lang]} MCQ
          </Link>
        ))}
      </div>
    </>
  );
}
