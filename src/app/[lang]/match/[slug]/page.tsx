import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MatchGame from "@/components/MatchGame";
import { DICT, LANGS, isLang } from "@/lib/i18n";
import { getMatchSet, getMatchSets } from "@/lib/content";

export const dynamicParams = false;
export const generateStaticParams = () => LANGS.flatMap((lang) => getMatchSets().map((m) => ({ lang, slug: m.slug })));

type P = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, slug } = await params;
  const m = getMatchSet(slug);
  if (!isLang(lang) || !m) return {};
  return {
    title: `${m[lang].title} – ${DICT[lang].modes.match}`,
    description: DICT[lang].modes.matchSub,
    alternates: { canonical: `/${lang}/match/${slug}`, languages: { en: `/en/match/${slug}`, hi: `/hi/match/${slug}` } },
  };
}

export default async function MatchPage({ params }: P) {
  const { lang, slug } = await params;
  const set = getMatchSet(slug);
  if (!isLang(lang) || !set) notFound();
  const t = DICT[lang];
  const others = getMatchSets().filter((m) => m.slug !== slug);
  const next = others[Math.abs([...slug].reduce((a, c) => a + c.charCodeAt(0), 0)) % others.length]?.slug ?? slug;
  return (
    <>
      <Link href={`/${lang}/games`} className="back">← {t.quiz.back}</Link>
      <h1 className="mb-1 text-3xl">{set.icon} {set[lang].title}</h1>
      <MatchGame
        key={`${lang}-${slug}`}
        lang={lang}
        pairs={set.pairs.map((p) => p[lang])}
        nextSlug={next}
        t={{ ...t.match, games: t.nav.games }}
      />
    </>
  );
}
