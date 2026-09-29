import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DICT, LANGS, fill, isLang } from "@/lib/i18n";
import { SUBJECTS, SUBJECT_KEYS, getQuestions, isSubject, topicName } from "@/lib/content";
import AdSlot from "@/components/AdSlot";

export const dynamicParams = false;
export const generateStaticParams = () => LANGS.flatMap((lang) => SUBJECT_KEYS.map((subject) => ({ lang, subject })));

type P = { params: Promise<{ lang: string; subject: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, subject } = await params;
  if (!isLang(lang) || !isSubject(subject)) return {};
  const t = DICT[lang];
  const name = SUBJECTS[subject][lang];
  const title = fill(t.mcq.title, { subject: name });
  const description = fill(t.mcq.desc, { subject: name, count: getQuestions(subject).length });
  return {
    title,
    description,
    openGraph: { title, description },
    alternates: { canonical: `/${lang}/mcq/${subject}`, languages: { en: `/en/mcq/${subject}`, hi: `/hi/mcq/${subject}` } },
  };
}

/** Crawlable question bank: every question, answer and explanation is in the HTML for Google. */
export default async function McqPage({ params }: P) {
  const { lang, subject } = await params;
  if (!isLang(lang) || !isSubject(subject)) notFound();
  const t = DICT[lang];
  const name = SUBJECTS[subject][lang];
  const questions = getQuestions(subject);
  const topics = [...new Set(questions.map((q) => q.topic))];
  let n = 0;

  return (
    <article>
      <Link href={`/${lang}`} className="back">← {t.quiz.back}</Link>
      <h1 className="mb-2 text-3xl">{SUBJECTS[subject].icon} {fill(t.mcq.title, { subject: name })}</h1>
      <p className="mb-4 text-muted">{fill(t.mcq.desc, { subject: name, count: questions.length })}</p>
      <Link href={`/${lang}/practice/${subject}`} className="btn mb-6 w-full">▶ {t.mcq.practice}</Link>

      {topics.map((topic) => (
        <section key={topic} className="mb-6">
          <h2 className="mb-3 text-xl">{topicName(topic, lang)}</h2>
          <ol className="grid list-none gap-3 p-0">
            {questions.filter((q) => q.topic === topic).map((q) => {
              n += 1;
              const text = q[lang];
              return (
                <li key={q.id} id={q.id} className="card">
                  <p className="mb-2 font-semibold">Q{n}. {text.q}</p>
                  <ol className="mb-3 grid gap-1 pl-0" style={{ listStyle: "none" }}>
                    {text.o.map((o, i) => <li key={i}>({"abcd"[i]}) {o}</li>)}
                  </ol>
                  <details className="rounded-xl bg-surface-2 p-3">
                    <summary className="cursor-pointer font-semibold text-primary">{t.mcq.show}</summary>
                    <p className="mt-2"><b>{t.mcq.answer}: ({"abcd"[q.answer]}) {text.o[q.answer]}</b></p>
                    <p className="mt-1">{text.e}</p>
                  </details>
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      <AdSlot />
      <div className="mt-8 flex flex-wrap gap-2">
        {SUBJECT_KEYS.filter((k) => k !== subject).map((k) => (
          <Link key={k} href={`/${lang}/mcq/${k}`} className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink no-underline">
            {SUBJECTS[k][lang]} MCQ
          </Link>
        ))}
      </div>
    </article>
  );
}
