"use client";
import Link from "next/link";
import type { Dict } from "@/lib/i18n";
import { useAuth } from "./AuthProvider";
import { JoinForm } from "./Institute";

export default function JoinInvite({ lang, code, t }: { lang: string; code: string; t: Dict }) {
  const { enabled, ready, user } = useAuth();
  if (!enabled) return <div className="card">{t.account.notEnabled}</div>;
  if (!ready) return <p className="text-muted">{t.common.loading}</p>;
  if (!user) {
    return (
      <div className="card text-center">
        <p className="mb-2 font-display text-3xl font-extrabold tracking-[0.3em] text-primary">{code}</p>
        <p className="mb-3">{t.inst.loginFirst}</p>
        <Link href={`/${lang}/login?next=/${lang}/join/${code}`} className="btn">{t.account.login}</Link>
      </div>
    );
  }
  return (
    <>
      <JoinForm t={t} initialCode={code} />
      <Link href={`/${lang}/leaderboard`} className="btn btn-ghost mt-4 w-full">🏆 {t.board.title}</Link>
    </>
  );
}
