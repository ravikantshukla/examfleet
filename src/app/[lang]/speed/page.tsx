import type { Metadata } from "next";
import QuizPlayer from "@/components/QuizPlayer";
import { DICT, isLang } from "@/lib/i18n";
import { getQuestions, shuffle, subjectLabels, toClient } from "@/lib/content";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = DICT[isLang(lang) ? lang : "en"];
  return {
    title: t.modes.speed,
    description: t.modes.speedSub,
    alternates: { canonical: `/${lang}/speed`, languages: { en: "/en/speed", hi: "/hi/speed" } },
  };
}

export default async function SpeedPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params;
  const lang = isLang(l) ? l : "en";
  const t = DICT[lang];
  // A random pool of up to 80 questions; the player reshuffles if someone answers them all.
  const pool = shuffle(getQuestions()).slice(0, 80).map((q) => toClient(q, lang));
  return (
    <QuizPlayer
      lang={lang}
      mode="speed"
      title={t.modes.speed}
      questions={pool}
      seconds={SITE.speedSeconds}
      subjectLabels={subjectLabels(lang)}
      t={t.quiz}
      siteName={SITE.name}
      shareUrl={`${SITE.url}/${lang}/speed`}
    />
  );
}
