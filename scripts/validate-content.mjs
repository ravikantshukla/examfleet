#!/usr/bin/env node
/**
 * Content validator for ExamFleet.
 *
 *   npm run validate        -> check every content file, exit 1 on any error
 *   npm run stats           -> also print counts per subject / topic / difficulty
 *
 * The nightly content task runs this before committing, and `npm run build`
 * runs it too, so a broken question can never reach the live site.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "content");
const SUBJECT_PREFIX = {
  polity: "pol", history: "his", geography: "geo", science: "sci",
  maths: "mat", reasoning: "rea", economy: "eco",
};
const EXAMS = new Set(["ssc", "railway", "bank", "state-psc", "upsc", "defence", "teaching"]);
const DIFFICULTY = new Set(["easy", "medium", "hard"]);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);
const readJson = (file) => {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (e) { err(path.relative(ROOT, file), `invalid JSON (${e.message})`); return null; }
};
const str = (v) => typeof v === "string" && v.trim().length > 0;
const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/* ---------------- topics (English name -> Hindi name) ---------------- */
const topicsFile = path.join(ROOT, "topics.json");
const TOPICS = fs.existsSync(topicsFile) ? readJson(topicsFile) || {} : {};
if (!fs.existsSync(topicsFile)) err("topics.json", "missing");

/* ---------------- questions ---------------- */
const ids = new Map();
const byText = new Map();
const all = [];
for (const file of fs.readdirSync(path.join(ROOT, "questions")).filter((f) => f.endsWith(".json")).sort()) {
  const subject = file.replace(/\.json$/, "");
  const where = `questions/${file}`;
  if (!SUBJECT_PREFIX[subject]) { err(where, `unknown subject file (allowed: ${Object.keys(SUBJECT_PREFIX).join(", ")})`); continue; }
  const list = readJson(path.join(ROOT, "questions", file));
  if (!Array.isArray(list)) { err(where, "must be a JSON array"); continue; }
  list.forEach((q, i) => {
    const w = `${where} #${i + 1}${q && q.id ? ` (${q.id})` : ""}`;
    if (!q || typeof q !== "object") return err(w, "not an object");
    if (!new RegExp(`^${SUBJECT_PREFIX[subject]}-\\d{4}$`).test(q.id || "")) err(w, `id must look like ${SUBJECT_PREFIX[subject]}-0001`);
    else if (ids.has(q.id)) err(w, `duplicate id (also in ${ids.get(q.id)})`);
    else ids.set(q.id, where);
    if (q.subject !== subject) err(w, `subject must be "${subject}"`);
    if (!str(q.topic)) err(w, "topic is required");
    else if (!str(TOPICS[q.topic])) err(w, `topic "${q.topic}" has no Hindi name in content/topics.json`);
    if (!Array.isArray(q.exams) || q.exams.length === 0 || q.exams.some((x) => !EXAMS.has(x))) err(w, `exams must be a non-empty list from: ${[...EXAMS].join(", ")}`);
    if (!DIFFICULTY.has(q.difficulty)) err(w, "difficulty must be easy, medium or hard");
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) err(w, "answer must be 0, 1, 2 or 3");
    if (!str(q.source)) err(w, "source is required (e.g. 'NCERT Class 10 Science' or 'Original')");
    if (!DATE_RE.test(q.added || "")) err(w, "added must be a YYYY-MM-DD date");
    for (const lang of ["en", "hi"]) {
      const t = q[lang];
      if (!t || typeof t !== "object") { err(w, `missing ${lang} block`); continue; }
      if (!str(t.q)) err(w, `${lang}.q is empty`);
      if (!str(t.e)) err(w, `${lang}.e (explanation) is empty`);
      if (!Array.isArray(t.o) || t.o.length !== 4 || t.o.some((o) => !str(o))) err(w, `${lang}.o must have exactly 4 non-empty options`);
      else if (new Set(t.o.map((o) => o.trim().toLowerCase())).size !== 4) err(w, `${lang}.o has duplicate options`);
    }
    if (q.hi && q.en && /[a-z]{4,}/.test(q.hi.q) && !/[ऀ-ॿ]/.test(q.hi.q)) warn(w, "hi.q has no Devanagari text; is it translated?");
    if (q.en && str(q.en.q)) {
      const k = norm(q.en.q);
      if (byText.has(k)) err(w, `same question text as ${byText.get(k)}`);
      else byText.set(k, q.id);
    }
    all.push(q);
  });
}

/* ---------------- daily sets ---------------- */
const dailyDir = path.join(ROOT, "daily");
const dailyFiles = fs.existsSync(dailyDir) ? fs.readdirSync(dailyDir).filter((f) => f.endsWith(".json")).sort() : [];
for (const file of dailyFiles) {
  const where = `daily/${file}`;
  const d = readJson(path.join(dailyDir, file));
  if (!d) continue;
  if (d.date !== file.replace(/\.json$/, "") || !DATE_RE.test(d.date)) err(where, "date must match the file name (YYYY-MM-DD.json)");
  if (!Array.isArray(d.ids) || d.ids.length !== 10) err(where, "ids must list exactly 10 question ids");
  else {
    if (new Set(d.ids).size !== 10) err(where, "ids contains duplicates");
    d.ids.filter((id) => !ids.has(id)).forEach((id) => err(where, `unknown question id ${id}`));
  }
}

/* ---------------- notes ---------------- */
for (const file of fs.readdirSync(path.join(ROOT, "notes")).filter((f) => f.endsWith(".json"))) {
  const where = `notes/${file}`;
  const n = readJson(path.join(ROOT, "notes", file));
  if (!n) continue;
  if (n.slug !== file.replace(/\.json$/, "") || !/^[a-z0-9-]+$/.test(n.slug)) err(where, "slug must match file name and use a-z, 0-9 and dashes");
  if (!SUBJECT_PREFIX[n.subject]) err(where, "unknown subject");
  if (!DATE_RE.test(n.updated || "")) err(where, "updated must be YYYY-MM-DD");
  for (const l of ["en", "hi"]) {
    if (!n[l] || !str(n[l].title) || !str(n[l].description) || !str(n[l].body)) err(where, `${l} needs title, description and body`);
    else if (/<script|on\w+=|javascript:/i.test(n[l].body)) err(where, `${l}.body contains script or inline event handlers`);
  }
}

/* ---------------- match sets ---------------- */
for (const file of fs.readdirSync(path.join(ROOT, "match")).filter((f) => f.endsWith(".json"))) {
  const where = `match/${file}`;
  const m = readJson(path.join(ROOT, "match", file));
  if (!m) continue;
  if (m.slug !== file.replace(/\.json$/, "")) err(where, "slug must match file name");
  if (!str(m.en?.title) || !str(m.hi?.title)) err(where, "en.title and hi.title are required");
  if (!Array.isArray(m.pairs) || m.pairs.length < 4 || m.pairs.length > 6) err(where, "pairs must have 4 to 6 items");
  else m.pairs.forEach((p, i) => {
    for (const l of ["en", "hi"]) if (!Array.isArray(p[l]) || p[l].length !== 2 || !str(p[l][0]) || !str(p[l][1])) err(where, `pair ${i + 1} needs ${l}: [left, right]`);
  });
}

/* ---------------- mock tests ---------------- */
const mockDir = path.join(ROOT, "mocks");
for (const file of fs.existsSync(mockDir) ? fs.readdirSync(mockDir).filter((f) => f.endsWith(".json")) : []) {
  const where = `mocks/${file}`;
  const m = readJson(path.join(mockDir, file));
  if (!m) continue;
  if (m.slug !== file.replace(/\.json$/, "") || !/^[a-z0-9-]+$/.test(m.slug)) err(where, "slug must match file name");
  if (!EXAMS.has(m.exam)) err(where, "exam must be one of the allowed exam keys");
  if (typeof m.premium !== "boolean") err(where, "premium must be true or false");
  if (!(m.durationMin > 0 && m.durationMin <= 180)) err(where, "durationMin must be 1–180");
  if (!(m.marks?.correct > 0) || !(m.marks?.wrong >= 0)) err(where, "marks needs correct > 0 and wrong >= 0 (penalty as a positive number)");
  for (const l of ["en", "hi"]) if (!str(m[l]?.title) || !str(m[l]?.description)) err(where, `${l}.title and ${l}.description are required`);
  const seen = new Set();
  if (!Array.isArray(m.sections) || !m.sections.length) err(where, "sections must be a non-empty list");
  else m.sections.forEach((s, i) => {
    if (!str(s.en) || !str(s.hi)) err(where, `section ${i + 1} needs en and hi names`);
    if (!Array.isArray(s.ids) || !s.ids.length) return err(where, `section ${i + 1} needs ids`);
    s.ids.forEach((id) => {
      if (!ids.has(id)) err(where, `unknown question id ${id}`);
      if (seen.has(id)) err(where, `question ${id} appears twice`);
      seen.add(id);
    });
  });
}

/* ---------------- report ---------------- */
if (process.argv.includes("--stats")) {
  const count = (key) => all.reduce((acc, q) => ((acc[key(q)] = (acc[key(q)] || 0) + 1), acc), {});
  console.log(`Questions: ${all.length}`);
  console.log("By subject:", count((q) => q.subject));
  console.log("By difficulty:", count((q) => q.difficulty));
  console.log("By topic:");
  const topics = count((q) => `${q.subject} / ${q.topic}`);
  Object.keys(topics).sort().forEach((t) => console.log(`  ${t}: ${topics[t]}`));
  const used = new Set();
  dailyFiles.forEach((f) => readJson(path.join(dailyDir, f))?.ids?.forEach((id) => used.add(id)));
  console.log(`Daily sets: ${dailyFiles.length} (latest: ${dailyFiles.at(-1)?.replace(".json", "") ?? "none"})`);
  console.log(`Questions never used in a daily set: ${all.filter((q) => !used.has(q.id)).length}`);
  const next = Object.fromEntries(Object.entries(SUBJECT_PREFIX).map(([s, p]) => {
    const max = all.filter((q) => q.subject === s).reduce((m, q) => Math.max(m, Number(q.id.slice(4))), 0);
    return [s, `${p}-${String(max + 1).padStart(4, "0")}`];
  }));
  console.log("Next free ids:", next);
}
warnings.forEach((w) => console.warn(`warning  ${w}`));
if (errors.length) {
  errors.forEach((e) => console.error(`error    ${e}`));
  console.error(`\n${errors.length} error(s). Fix them before publishing.`);
  process.exit(1);
}
console.log(`Content OK: ${all.length} questions, ${dailyFiles.length} daily sets.`);
