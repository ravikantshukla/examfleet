import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";
import { DICT, isLang } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: DICT[isLang(lang) ? lang : "en"].account.login, robots: { index: false } };
}

export default async function LoginPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params;
  const lang = isLang(l) ? l : "en";
  const t = DICT[lang].account;
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 text-3xl">{t.loginTitle}</h1>
      <p className="mb-5 text-muted">{t.loginSub}</p>
      <Suspense>
        <LoginForm lang={lang} t={t} />
      </Suspense>
    </div>
  );
}
