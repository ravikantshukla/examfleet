"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Lang } from "@/lib/i18n";

type Labels = { home: string; daily: string; games: string; notes: string; tools: string };

export default function BottomNav({ lang, labels }: { lang: Lang; labels: Labels }) {
  const path = (usePathname() || "").replace(/^\/(en|hi)/, "");
  const section = path.split("/")[1] || "";
  const active =
    section === "speed" || section === "match" || section === "games" ? "games"
    : section === "notes" ? "notes"
    : section === "tools" ? "tools"
    : section === "daily" ? "daily"
    : section === "" ? "home" : "";
  const items: [keyof Labels, string, string][] = [
    ["home", "", "🏠"], ["daily", "/daily", "🔥"], ["games", "/games", "🎮"], ["notes", "/notes", "📘"], ["tools", "/tools/age-calculator", "🧰"],
  ];
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface">
      <div className="wrap flex h-16 items-center justify-around">
        {items.map(([key, href, icon]) => (
          <Link
            key={key}
            href={`/${lang}${href}`}
            className={`flex flex-1 flex-col items-center gap-0.5 py-1 text-xs font-semibold no-underline ${active === key ? "text-primary" : "text-muted"}`}
          >
            <span className="text-xl leading-none">{icon}</span>
            {labels[key]}
          </Link>
        ))}
      </div>
    </nav>
  );
}
