export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
/** Accounts are optional: without these env vars the site still works, with progress saved only in the browser. */
export const authEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export type Profile = {
  id: string;
  display_name: string | null;
  target_exam: string | null;
  lang: "en" | "hi";
  premium_until: string | null;
  institute_id: string | null;
};
export const isPremium = (p?: Pick<Profile, "premium_until"> | null) =>
  !!p?.premium_until && new Date(p.premium_until).getTime() > Date.now();
