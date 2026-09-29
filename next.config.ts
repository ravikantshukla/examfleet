import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Question files are read from /content at request time (daily quiz, speed round),
  // so make sure they ship with every server function.
  outputFileTracingIncludes: {
    "/*": ["./content/**/*"],
  },
  async redirects() {
    return [{ source: "/", destination: "/en", permanent: false }];
  },
};

export default nextConfig;
