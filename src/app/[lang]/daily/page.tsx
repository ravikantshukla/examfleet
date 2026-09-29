import type { Metadata } from "next";
import QuizPlayer from "@/components/QuizPlayer";
import { DICT, isLang } from "@/lib/i18n";
import { getDailySet, subjectLabels, toClient } from "@/lib/content";
import { SITE } from "@/lib/site";

// Re-check every 5 minutes so the set rolls over at midnight India time.
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = DICT[isLang(lang) ? lang : "en"];
  return {
    title: t.modes.daily,
    description: t.modes.dailySub,
    alternates: { canonical: `/${lang}/daily`, languages: { en: "/en/daily", hi: "/hi/daily" } },
  };
}

export default async function DailyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params;
  const lang = isLang(l) ? l : "en";
  const t = DICT[lang];
  const daily = getDailySet();
  return (
    <QuizPlayer
      key={daily.date}
      lang={lang}
      mode="daily"
      date={daily.date}
      title={t.modes.daily}
      questions={daily.questions.map((q) => toClient(q, lang))}
      subjectLabels={subjectLabels(lang)}
      t={t.quiz}
      tAi={t.ai}
      tAccount={t.account}
      siteName={SITE.name}
      shareUrl={`${SITE.url}/${lang}/daily`}
    />
  );
}
