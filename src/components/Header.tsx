"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Lang } from "@/lib/i18n";
import { SITE } from "@/lib/site";

export default function Header({ lang }: { lang: Lang }) {
  const pathname = usePathname() || `/${lang}`;
  const swap = (to: Lang) => pathname.replace(/^\/(en|hi)(?=\/|$)/, `/${to}`);
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg/95 backdrop-blur">
      <div className="wrap flex h-14 items-center justify-between">
        <Link href={`/${lang}`} className="flex items-center gap-2 font-display text-xl font-extrabold text-ink no-underline">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-base text-primary-ink">E</span>
          {SITE.name}
        </Link>
        <nav aria-label="Language" className="flex rounded-full bg-surface-2 p-1 text-sm font-semibold">
          {(["en", "hi"] as const).map((l) => (
            <Link
              key={l}
              href={swap(l)}
              hrefLang={l}
              className={`rounded-full px-3 py-1 no-underline ${l === lang ? "bg-surface text-ink shadow-card" : "text-muted"}`}
            >
              {l === "en" ? "EN" : "हिं"}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
