import type { Metadata } from "next";
import AgeCalculator from "@/components/AgeCalculator";
import { DICT, isLang } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = DICT[isLang(lang) ? lang : "en"];
  return {
    title: t.age.title,
    description: t.age.desc,
    alternates: { canonical: `/${lang}/tools/age-calculator`, languages: { en: "/en/tools/age-calculator", hi: "/hi/tools/age-calculator" } },
  };
}

export default async function AgePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params;
  const t = DICT[isLang(l) ? l : "en"];
  return (
    <>
      <h1 className="mb-2 text-3xl">🎂 {t.age.title}</h1>
      <p className="mb-4 text-muted">{t.age.desc}</p>
      <AgeCalculator t={t.age} />
    </>
  );
}
