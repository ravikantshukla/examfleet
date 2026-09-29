import type { Metadata } from "next";
import Link from "next/link";
import { DICT, fill, isLang } from "@/lib/i18n";
import { getMocks, mockCount } from "@/lib/content";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = DICT[isLang(lang) ? lang : "en"];
  return { title: t.mock.title, description: t.mock.sub, alternates: { canonical: `/${lang}/mocks`, languages: { en: "/en/mocks", hi: "/hi/mocks" } } };
}

export default async function MocksPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params;
  const lang = isLang(l) ? l : "en";
  const t = DICT[lang].mock;
  return (
    <>
      <h1 className="mb-1 text-3xl">📝 {t.title}</h1>
      <p className="mb-5 text-muted">{t.sub}</p>
      <div className="grid gap-3">
        {getMocks().sort((a, b) => Number(a.premium) - Number(b.premium)).map((m) => (
          <Link key={m.slug} href={`/${lang}/mocks/${m.slug}`} className="card flex items-start gap-3 text-ink no-underline">
            <span className="text-3xl">{m.icon}</span>
            <span className="flex-1">
              <span className="mb-1 flex flex-wrap items-center gap-2">
                <b className="text-lg">{m[lang].title}</b>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${m.premium ? "bg-accent-soft text-accent" : "bg-good-soft text-good"}`}>
                  {m.premium ? `⭐ ${t.premium}` : t.free}
                </span>
              </span>
              <span className="block text-sm text-muted">{m[lang].description}</span>
              <span className="mt-1 block text-sm font-semibold">
                {mockCount(m)} {t.questions} · {m.durationMin} {t.minutes} · {fill(t.marking, { right: m.marks.correct, wrong: m.marks.wrong })}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
