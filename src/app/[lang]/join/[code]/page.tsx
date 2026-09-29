import type { Metadata } from "next";
import JoinInvite from "@/components/JoinInvite";
import { DICT, isLang } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = DICT[isLang(lang) ? lang : "en"];
  return { title: t.inst.invite, robots: { index: false } };
}

export default async function JoinPage({ params }: { params: Promise<{ lang: string; code: string }> }) {
  const { lang: l, code } = await params;
  const lang = isLang(l) ? l : "en";
  const t = DICT[lang];
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-3xl">🏫 {t.inst.invite}</h1>
      <JoinInvite lang={lang} code={clean} t={t} />
    </div>
  );
}
