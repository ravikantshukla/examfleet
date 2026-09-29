import type { Metadata } from "next";
import Link from "next/link";
import { DICT, isLang } from "@/lib/i18n";
import { getNotes } from "@/lib/content";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = DICT[isLang(lang) ? lang : "en"];
  return { title: t.notes.title, description: t.modes.notesSub, alternates: { canonical: `/${lang}/notes`, languages: { en: "/en/notes", hi: "/hi/notes" } } };
}

export default async function NotesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params;
  const lang = isLang(l) ? l : "en";
  return (
    <>
      <h1 className="mb-4 text-3xl">📘 {DICT[lang].notes.title}</h1>
      <div className="grid grid-cols-2 gap-3">
        {getNotes().map((n) => (
          <Link key={n.slug} href={`/${lang}/notes/${n.slug}`} className="tile">
            <span className="text-2xl">{n.icon}</span><b>{n[lang].title}</b><small>{n[lang].description}</small>
          </Link>
        ))}
      </div>
    </>
  );
}
