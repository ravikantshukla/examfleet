import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";
import { DICT, isLang } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = DICT[isLang(lang) ? lang : "en"];
  return { title: t.auth.login, robots: { index: false } };
}

export default async function LoginPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params;
  const lang = isLang(l) ? l : "en";
  const t = DICT[lang];
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-2 text-3xl">🔐 {t.auth.title}</h1>
      <p className="mb-4 text-muted">{t.auth.sub}</p>
      <LoginForm lang={lang} t={t.auth} />
    </div>
  );
}
