"use client";
import { useEffect, useRef } from "react";
import { useAuth } from "./AuthProvider";

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";
const SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT || "";

declare global { interface Window { adsbygoogle?: unknown[] } }

/** Google AdSense unit. Renders nothing until AdSense is configured, and never for Premium users. */
export default function AdSlot() {
  const { ready, premium } = useAuth();
  const pushed = useRef(false);
  const show = Boolean(CLIENT && SLOT && ready && !premium);

  useEffect(() => {
    if (!show || pushed.current) return;
    if (!document.querySelector("script[data-adsense]")) {
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`;
      s.crossOrigin = "anonymous";
      s.dataset.adsense = "1";
      document.head.appendChild(s);
    }
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); pushed.current = true; } catch { /* ad blocked */ }
  }, [show]);

  if (!show) return null;
  return (
    <div className="my-5 min-h-24 overflow-hidden text-center">
      <ins className="adsbygoogle" style={{ display: "block" }} data-ad-client={CLIENT} data-ad-slot={SLOT} data-ad-format="auto" data-full-width-responsive="true" />
    </div>
  );
}
