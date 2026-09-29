import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} – Daily Govt Exam Quiz`,
    short_name: SITE.name,
    description: "Free daily practice for SSC, Railway, Banking & State exams in English and Hindi.",
    start_url: "/en",
    display: "standalone",
    background_color: "#F6F5FB",
    theme_color: "#3B3FD8",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
