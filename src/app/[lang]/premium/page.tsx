import type { Metadata } from "next";
import PremiumCheckout from "@/components/PremiumCheckout";
import { DICT, isLang } from "@/lib/i18n";
import { SITE } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = DICT[isLang(lang) ? lang : "en"];
  return { title: t.premium.title, description: t.premium.sub, alternates: { canonical: `/${lang}/premium`, languages: { en: "/en/premium", hi: "/hi/premium" } } };
}

export default async function PremiumPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params;
  const lang = isLang(l) ? l : "en";
  const t = DICT[lang];
  const p = t.premium;
  // Only the key id is public; the secret stays on the server. Checked at build/render time.
  const paymentsOn = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  return (
    <>
      <h1 className="mb-1 text-3xl">⭐ {p.title}</h1>
      <p className="mb-5 text-muted">{p.sub}</p>
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <section className="card border-transparent bg-primary-soft">
          <h2 className="mb-2 text-lg">⭐ {p.title}</h2>
          <ul className="grid gap-1.5">{p.features.map((f) => <li key={f}>✅ {f}</li>)}</ul>
        </section>
        <section className="card">
          <h2 className="mb-2 text-lg">{p.freeTitle}</h2>
          <ul className="grid gap-1.5 text-muted">{p.freeItems.map((f) => <li key={f}>✓ {f}</li>)}</ul>
        </section>
      </div>
      <PremiumCheckout lang={lang} t={t} siteName={SITE.name} paymentsOn={paymentsOn} />
    </>
  );
}
