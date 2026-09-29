/** Brand and domain settings. Set NEXT_PUBLIC_SITE_URL in Vercel to your real domain. */
export const SITE = {
  name: "ExamFleet",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  dailyCount: 10,
  speedSeconds: 60,
  timeZone: "Asia/Kolkata",
};
