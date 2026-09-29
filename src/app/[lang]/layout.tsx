import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { DICT, LANGS, isLang } from "@/lib/i18n";
import { SITE } from "@/lib/site";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

export const dynamicParams = false;
export const generateStaticParams = () => LANGS.map((lang) => ({ lang }));

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = DICT[isLang(lang) ? lang : "en"];
  return {
    metadataBase: new URL(SITE.url),
    title: { default: `${SITE.name} – ${t.home.title}`, template: `%s | ${SITE.name}` },
    description: t.tagline,
    applicationName: SITE.name,
    icons: { icon: "/icon.svg" },
    openGraph: { siteName: SITE.name, type: "website", locale: lang === "hi" ? "hi_IN" : "en_IN" },
    alternates: { canonical: `/${lang}`, languages: { en: "/en", hi: "/hi" } },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3B3FD8" },
    { media: "(prefers-color-scheme: dark)", color: "#12121C" },
  ],
};

export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = DICT[lang];
  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Mukta:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="min-h-screen pb-24 font-sans antialiased">
        <Header lang={lang} />
        <main className="wrap py-5">{children}</main>
        <footer className="wrap pb-6 text-center text-sm text-muted">
          © {new Date().getFullYear()} {SITE.name} · {t.footer}
        </footer>
        <BottomNav lang={lang} labels={t.nav} />
      </body>
    </html>
  );
}
