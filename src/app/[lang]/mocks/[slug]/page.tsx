import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MockPlayer from "@/components/MockPlayer";
import { DICT, LANGS, isLang } from "@/lib/i18n";
import { getMock, getMocks, mockCount } from "@/lib/content";

export const dynamicParams = false;
export const generateStaticParams = () => LANGS.flatMap((lang) => getMocks().map((m) => ({ lang, slug: m.slug })));

type P = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, slug } = await params;
  const m = getMock(slug);
  if (!isLang(lang) || !m) return {};
  return {
    title: m[lang].title, description: m[lang].description,
    alternates: { canonical: `/${lang}/mocks/${slug}`, languages: { en: `/en/mocks/${slug}`, hi: `/hi/mocks/${slug}` } },
  };
}

export default async function MockPage({ params }: P) {
  const { lang, slug } = await params;
  const mock = getMock(slug);
  if (!isLang(lang) || !mock) notFound();
  const t = DICT[lang];
  return (
    <>
      <Link href={`/${lang}/mocks`} className="back">← {t.mock.title}</Link>
      <h1 className="mb-1 text-3xl">{mock.icon} {mock[lang].title}</h1>
      <p className="mb-4 text-muted">{mock[lang].description}</p>
      <MockPlayer
        lang={lang}
        slug={slug}
        title={mock[lang].title}
        premium={mock.premium}
        count={mockCount(mock)}
        durationMin={mock.durationMin}
        marks={mock.marks}
        t={t}
      />
    </>
  );
}
