import type { Metadata } from "next";
import Link from "next/link";
import { DICT, isLang } from "@/lib/i18n";
import { getMatchSets } from "@/lib/content";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = DICT[isLang(lang) ? lang : "en"];
  return { title: t.nav.games, description: t.modes.matchSub, alternates: { canonical: `/${lang}/games`, languages: { en: "/en/games", hi: "/hi/games" } } };
}

export default async function GamesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params;
  const lang = isLang(l) ? l : "en";
  const t = DICT[lang];
  return (
    <>
      <h1 className="mb-4 text-3xl">🎮 {t.nav.games}</h1>
      <div className="grid grid-cols-2 gap-3">
        <Link href={`/${lang}/speed`} className="tile border-transparent bg-accent-soft">
          <span className="text-2xl">⚡</span><b>{t.modes.speed}</b><small>{t.modes.speedSub}</small>
        </Link>
        <Link href={`/${lang}/daily`} className="tile border-transparent bg-accent-soft">
          <span className="text-2xl">🔥</span><b>{t.modes.daily}</b><small>{t.modes.dailySub}</small>
        </Link>
      </div>
      <h2 className="mt-7 mb-3 text-2xl">🧩 {t.modes.match}</h2>
      <div className="grid grid-cols-2 gap-3">
        {getMatchSets().map((m) => (
          <Link key={m.slug} href={`/${lang}/match/${m.slug}`} className="tile">
            <span className="text-2xl">{m.icon}</span><b>{m[lang].title}</b><small>{t.modes.matchSub}</small>
          </Link>
        ))}
      </div>
    </>
  );
}
