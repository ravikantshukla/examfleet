"use client";
import Link from "next/link";
import { useState } from "react";
import type { Dict } from "@/lib/i18n";
import { fill } from "@/lib/i18n";
import { useAuth } from "./AuthProvider";

/** "Ask AI to explain" box under a question's explanation. */
export default function AskAI({ id, lang, t }: { id: string; lang: string; t: Dict["ai"] }) {
  const { enabled, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [doubt, setDoubt] = useState("");
  const [state, setState] = useState<{ status: "idle" | "loading" | "done" | "error" | "limit"; text?: string; left?: number }>({ status: "idle" });

  if (!enabled) return null;
  if (!user) {
    return (
      <Link href={`/${lang}/login`} className="mt-3 inline-block text-sm font-semibold">
        {t.ask} · {t.loginFirst}
      </Link>
    );
  }

  async function ask() {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, lang, doubt }) });
      const data = await res.json();
      if (res.status === 429) return setState({ status: "limit", left: 0 });
      if (!res.ok) return setState({ status: "error" });
      setState({ status: "done", text: data.text, left: data.left });
    } catch {
      setState({ status: "error" });
    }
  }

  if (!open) {
    return <button onClick={() => setOpen(true)} className="mt-3 text-sm font-semibold text-primary">{t.ask}</button>;
  }
  return (
    <div className="mt-3 rounded-xl border border-line bg-surface p-3">
      {state.status !== "done" && (
        <>
          <textarea
            value={doubt}
            onChange={(e) => setDoubt(e.target.value)}
            maxLength={300}
            rows={2}
            placeholder={t.placeholder}
            className="field text-[0.95rem]"
          />
          <button onClick={ask} disabled={state.status === "loading"} className="btn mt-2 w-full min-h-10 py-2 text-sm">
            {state.status === "loading" ? t.thinking : `🤖 ${t.send}`}
          </button>
        </>
      )}
      {state.status === "done" && (
        <>
          <div className="whitespace-pre-line text-[0.97rem]">{state.text}</div>
          <p className="mt-2 text-xs text-muted">{t.disclaimer}{state.left !== undefined ? ` · ${fill(t.left, { n: state.left })}` : ""}</p>
        </>
      )}
      {state.status === "limit" && (
        <p className="mt-2 text-sm">{t.limit} <Link href={`/${lang}/premium`}>→ Premium</Link></p>
      )}
      {state.status === "error" && <p className="mt-2 text-sm text-bad">{t.error}</p>}
    </div>
  );
}
