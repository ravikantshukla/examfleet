import type { Metadata } from "next";
import AccountPanel from "@/components/AccountPanel";
import { DICT, isLang } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = DICT[isLang(lang) ? lang : "en"];
  return { title: t.auth.account, robots: { index: false } };
}

export default async function AccountPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params;
  const lang = isLang(l) ? l : "en";
  const t = DICT[lang];
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-3xl">👤 {t.auth.account}</h1>
      <AccountPanel lang={lang} t={t.auth} home={t.home} best={`${t.quiz.best} · ${t.modes.speed}`} />
    </div>
  );
}
