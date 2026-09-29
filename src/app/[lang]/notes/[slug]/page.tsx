import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DICT, LANGS, isLang } from "@/lib/i18n";
import { SUBJECTS, getNote, getNotes } from "@/lib/content";

export const dynamicParams = false;
export const generateStaticParams = () => LANGS.flatMap((lang) => getNotes().map((n) => ({ lang, slug: n.slug })));

type P = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, slug } = await params;
  const n = getNote(slug);
  if (!isLang(lang) || !n) return {};
  return {
    title: n[lang].title,
    description: n[lang].description,
    openGraph: { title: n[lang].title, description: n[lang].description, type: "article" },
    alternates: { canonical: `/${lang}/notes/${slug}`, languages: { en: `/en/notes/${slug}`, hi: `/hi/notes/${slug}` } },
  };
}

export default async function NotePage({ params }: P) {
  const { lang, slug } = await params;
  const n = getNote(slug);
  if (!isLang(lang) || !n) notFound();
  const t = DICT[lang];
  return (
    <>
      <Link href={`/${lang}/notes`} className="back">← {t.quiz.back}</Link>
      <article className="card">
        <span className="chip mb-2">{SUBJECTS[n.subject].icon} {SUBJECTS[n.subject][lang]}</span>
        <h1 className="mb-1 text-3xl">{n[lang].title}</h1>
        <p className="mb-2 text-muted">{n[lang].description}</p>
        {/* Notes are our own reviewed content (validated to contain no scripts). */}
        <div className="prose-note" dangerouslySetInnerHTML={{ __html: n[lang].body }} />
        <Link href={`/${lang}/practice/${n.subject}`} className="btn mt-4 w-full">
          {SUBJECTS[n.subject].icon} {t.notes.practice} →
        </Link>
      </article>
    </>
  );
}
