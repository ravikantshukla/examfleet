import type { Metadata } from "next";
import Leaderboard from "@/components/Leaderboard";
import { DICT, isLang } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = DICT[isLang(lang) ? lang : "en"];
  return { title: t.board.title, description: t.board.today, alternates: { canonical: `/${lang}/leaderboard`, languages: { en: "/en/leaderboard", hi: "/hi/leaderboard" } } };
}

export default async function LeaderboardPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params;
  const lang = isLang(l) ? l : "en";
  const t = DICT[lang];
  return (
    <>
      <h1 className="mb-4 text-3xl">🏆 {t.board.title}</h1>
      <Leaderboard lang={lang} t={t.board} tAccount={t.account} />
    </>
  );
}
