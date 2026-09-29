import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import Dashboard from "@/components/Dashboard";
import { DICT, isLang } from "@/lib/i18n";
import { getMocks, subjectLabels } from "@/lib/content";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: DICT[isLang(lang) ? lang : "en"].dash.title, robots: { index: false } };
}

export default async function DashboardPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params;
  const lang = isLang(l) ? l : "en";
  const topics: Record<string, string> = lang === "hi"
    ? JSON.parse(fs.readFileSync(path.join(process.cwd(), "content", "topics.json"), "utf8"))
    : {};
  const mockTitles = Object.fromEntries(getMocks().map((m) => [m.slug, m[lang].title]));
  return <Dashboard lang={lang} t={DICT[lang]} subjects={subjectLabels(lang)} topics={topics} mockTitles={mockTitles} />;
}
