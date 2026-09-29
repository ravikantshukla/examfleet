import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QuizPlayer from "@/components/QuizPlayer";
import { DICT, LANGS, fill, isLang } from "@/lib/i18n";
import { SUBJECTS, SUBJECT_KEYS, getQuestions, isSubject, subjectLabels, toClient } from "@/lib/content";
import { SITE } from "@/lib/site";

export const dynamicParams = false;
export const generateStaticParams = () => LANGS.flatMap((lang) => SUBJECT_KEYS.map((subject) => ({ lang, subject })));

type P = { params: Promise<{ lang: string; subject: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, subject } = await params;
  if (!isLang(lang) || !isSubject(subject)) return {};
  const name = SUBJECTS[subject][lang];
  return {
    title: lang === "hi" ? `${name} अभ्यास क्विज़` : `${name} Practice Quiz`,
    description: fill(DICT[lang].mcq.desc, { subject: name, count: getQuestions(subject).length }),
    alternates: { canonical: `/${lang}/practice/${subject}`, languages: { en: `/en/practice/${subject}`, hi: `/hi/practice/${subject}` } },
  };
}

export default async function PracticePage({ params }: P) {
  const { lang, subject } = await params;
  if (!isLang(lang) || !isSubject(subject)) notFound();
  const t = DICT[lang];
  const questions = getQuestions(subject).map((q) => toClient(q, lang));
  return (
    <>
      <QuizPlayer
        lang={lang}
        mode="practice"
        title={SUBJECTS[subject][lang]}
        questions={questions}
        subjectLabels={subjectLabels(lang)}
        t={t.quiz}
        siteName={SITE.name}
        shareUrl={`${SITE.url}/${lang}/practice/${subject}`}
      />
      <p className="mt-6 text-center">
        <Link href={`/${lang}/mcq/${subject}`} className="font-semibold">
          📄 {fill(t.mcq.title, { subject: SUBJECTS[subject][lang] })}
        </Link>
      </p>
    </>
  );
}
