import type { MetadataRoute } from "next";
import { LANGS } from "@/lib/i18n";
import { SUBJECT_KEYS, getMatchSets, getMocks, getNotes } from "@/lib/content";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "", "/daily", "/speed", "/games", "/notes", "/tools/age-calculator", "/mocks", "/leaderboard", "/premium", "/institute",
    ...getMocks().map((m) => `/mocks/${m.slug}`),
    ...SUBJECT_KEYS.flatMap((s) => [`/mcq/${s}`, `/practice/${s}`]),
    ...getNotes().map((n) => `/notes/${n.slug}`),
    ...getMatchSets().map((m) => `/match/${m.slug}`),
  ];
  return paths.flatMap((p) =>
    LANGS.map((lang) => ({
      url: `${SITE.url}/${lang}${p}`,
      changeFrequency: p === "/daily" || p.startsWith("/mcq") ? ("daily" as const) : ("weekly" as const),
      priority: p === "" ? 1 : p.startsWith("/mcq") || p === "/daily" ? 0.8 : 0.6,
      alternates: { languages: Object.fromEntries(LANGS.map((l) => [l, `${SITE.url}/${l}${p}`])) },
    })),
  );
}
