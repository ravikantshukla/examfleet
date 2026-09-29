import type { Metadata } from "next";
import Institute from "@/components/Institute";
import { DICT, isLang } from "@/lib/i18n";
import { SITE } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = DICT[isLang(lang) ? lang : "en"];
  return { title: t.inst.title, description: t.inst.sub, alternates: { canonical: `/${lang}/institute`, languages: { en: "/en/institute", hi: "/hi/institute" } } };
}

export default async function InstitutePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params;
  const lang = isLang(l) ? l : "en";
  const t = DICT[lang];
  return (
    <>
      <h1 className="mb-1 text-3xl">🏫 {t.inst.title}</h1>
      <p className="mb-5 text-muted">{t.inst.sub}</p>
      <Institute lang={lang} t={t} siteUrl={SITE.url} />
    </>
  );
}
