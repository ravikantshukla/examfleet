"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Lang } from "@/lib/i18n";
import { supabaseEnabled } from "@/lib/supabase/config";
import { useUser } from "@/lib/supabase/useUser";

/** Header control: "Login" when signed out, the user's initial when signed in. */
export default function AccountButton({ lang, label }: { lang: Lang; label: string }) {
  const user = useUser();
  const pathname = usePathname() || `/${lang}`;
  if (!supabaseEnabled) return null;
  if (user === undefined) return <span className="h-8 w-8" aria-hidden />;
  if (!user) {
    const onAuthPage = /\/(login|account)$/.test(pathname);
    const next = onAuthPage ? "" : `?next=${encodeURIComponent(pathname)}`;
    return (
      <Link href={`/${lang}/login${next}`} className="rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-ink no-underline">
        {label}
      </Link>
    );
  }
  const name = (user.user_metadata?.full_name as string) || user.email || user.phone || "?";
  const avatar = user.user_metadata?.avatar_url as string | undefined;
  return (
    <Link href={`/${lang}/account`} aria-label={name} className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-primary-soft font-bold text-primary no-underline">
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
      ) : (
        name.replace(/^\+/, "").charAt(0).toUpperCase()
      )}
    </Link>
  );
}
