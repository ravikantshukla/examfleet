import { SAAS, type SaasDict } from "./i18n-saas";

export const LANGS = ["en", "hi"] as const;
export type Lang = (typeof LANGS)[number];
export const isLang = (v: string): v is Lang => (LANGS as readonly string[]).includes(v);

/** Replace {name} placeholders. */
export const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));

const en = {
  langName: "English",
  otherLang: "हिंदी",
  tagline: "Free daily practice for SSC, Railway, Banking & State exams",
  nav: { home: "Home", daily: "Daily", games: "Games", notes: "Notes", tools: "Tools" },
  home: {
    title: "Crack your Sarkari exam, 10 questions a day",
    sub: "Free, bilingual practice for SSC, Railway, Banking & State exams. Build a streak, beat your friends.",
    start: "Start today's challenge",
    done: "Done today – play again",
    streak: "day streak",
    games: "Play & revise",
    practice: "Practice by subject",
    questions: "questions",
    progress: "Your accuracy",
    progressEmpty: "Answer a few questions and your subject-wise accuracy will show up here.",
    bank: "MCQs with answers",
  },
  modes: {
    daily: "Daily Challenge", dailySub: "Same 10 questions for everyone today",
    speed: "Speed Round", speedSub: "Answer as many as you can in 60 seconds",
    match: "Match the Pairs", matchSub: "Revise facts by matching",
    notes: "Quick Notes", notesSub: "One-page revision sheets",
    age: "Age Calculator", ageSub: "Check your exam age eligibility",
  },
  quiz: {
    question: "Question", of: "of", next: "Next", finish: "See result",
    correct: "Correct!", wrong: "Wrong. Correct answer:",
    score: "Your score", best: "Best", timeUp: "Time's up!", correctAnswers: "correct answers",
    share: "Share on WhatsApp", tryAgain: "Try again", home: "Home", review: "Review answers",
    great: "Excellent! You're exam-ready on this.", good: "Good job! A little more revision and you're there.",
    low: "Keep going – read the notes and try again.",
    shareText: "I scored {score}/{total} in today's {mode} on {site}! Can you beat me? 👉 {url}",
    shareSpeed: "I got {score} correct in 60 seconds on {site}'s Speed Round! Try it 👉 {url}",
    back: "Back", practiceMore: "Practice more {subject}",
  },
  match: {
    pick: "Tap an item on the left, then its match on the right.",
    mistakes: "Mistakes", time: "Time", done: "All matched!", another: "Try another set",
  },
  mcq: {
    title: "{subject} MCQ Questions with Answers",
    desc: "{count} {subject} multiple-choice questions with answers and explanations for SSC, Railway, Banking and State exams. Free, in English and Hindi.",
    show: "Show answer", answer: "Answer", practice: "Practice these as a quiz",
  },
  notes: { title: "Quick Notes", practice: "Practice this topic" },
  age: {
    title: "Exam Age Eligibility Calculator",
    desc: "Calculate your exact age on the exam cut-off date and check eligibility with OBC, SC/ST and PwBD relaxation.",
    dob: "Date of birth", asOn: "Age as on (cut-off date)", min: "Minimum age", max: "Maximum age",
    category: "Category",
    cats: ["General / EWS (no relaxation)", "OBC (+3 years)", "SC / ST (+5 years)", "PwBD – General (+10 years)"],
    check: "Check eligibility", yourAge: "Your age on the cut-off date",
    years: "years", months: "months", days: "days",
    eligible: "You are eligible ✅", tooYoung: "Not eligible yet – below the minimum age ❌", tooOld: "Not eligible – above the upper age limit ❌",
    upper: "Upper age limit with relaxation",
    note: "Relaxations shown are the common central-government rules. Always confirm with the official notification.",
  },
  footer: "Free practice for government exam aspirants.",
};

type BaseDict = typeof en;

const hi: BaseDict = {
  langName: "हिंदी",
  otherLang: "English",
  tagline: "SSC, रेलवे, बैंकिंग और राज्य परीक्षाओं के लिए मुफ़्त रोज़ाना अभ्यास",
  nav: { home: "होम", daily: "डेली", games: "गेम्स", notes: "नोट्स", tools: "टूल्स" },
  home: {
    title: "रोज़ 10 सवाल, सरकारी नौकरी की पक्की तैयारी",
    sub: "SSC, रेलवे, बैंकिंग और राज्य परीक्षाओं के लिए मुफ़्त अभ्यास, हिंदी और अंग्रेज़ी में। स्ट्रीक बनाइए, दोस्तों को हराइए।",
    start: "आज का चैलेंज शुरू करें",
    done: "आज पूरा हुआ – फिर से खेलें",
    streak: "दिन की स्ट्रीक",
    games: "खेलें और दोहराएँ",
    practice: "विषय अनुसार अभ्यास",
    questions: "प्रश्न",
    progress: "आपकी सटीकता",
    progressEmpty: "कुछ प्रश्नों के उत्तर दीजिए, फिर यहाँ विषयवार सटीकता दिखेगी।",
    bank: "उत्तर सहित MCQ",
  },
  modes: {
    daily: "डेली चैलेंज", dailySub: "आज सबके लिए वही 10 सवाल",
    speed: "स्पीड राउंड", speedSub: "60 सेकंड में जितने हो सकें उतने जवाब दें",
    match: "जोड़ी मिलाओ", matchSub: "मिलान करके तथ्य दोहराएँ",
    notes: "क्विक नोट्स", notesSub: "एक पेज के रिवीज़न नोट्स",
    age: "आयु कैलकुलेटर", ageSub: "परीक्षा की आयु पात्रता जाँचें",
  },
  quiz: {
    question: "प्रश्न", of: "/", next: "अगला", finish: "परिणाम देखें",
    correct: "सही जवाब!", wrong: "गलत। सही उत्तर:",
    score: "आपका स्कोर", best: "बेस्ट", timeUp: "समय समाप्त!", correctAnswers: "सही उत्तर",
    share: "WhatsApp पर शेयर करें", tryAgain: "फिर से कोशिश करें", home: "होम", review: "उत्तर देखें",
    great: "शानदार! इस टॉपिक पर आप परीक्षा के लिए तैयार हैं।", good: "बढ़िया! थोड़ा और रिवीज़न करें।",
    low: "हार मत मानिए – नोट्स पढ़ें और फिर कोशिश करें।",
    shareText: "मैंने {site} के आज के {mode} में {score}/{total} स्कोर किया! क्या आप मुझे हरा सकते हैं? 👉 {url}",
    shareSpeed: "मैंने {site} के स्पीड राउंड में 60 सेकंड में {score} सही जवाब दिए! आप भी आज़माएँ 👉 {url}",
    back: "वापस", practiceMore: "{subject} का और अभ्यास करें",
  },
  match: {
    pick: "बाईं ओर एक आइटम चुनें, फिर दाईं ओर उसका मिलान।",
    mistakes: "गलतियाँ", time: "समय", done: "सब मिल गए!", another: "दूसरा सेट खेलें",
  },
  mcq: {
    title: "{subject} MCQ प्रश्न उत्तर सहित",
    desc: "SSC, रेलवे, बैंकिंग और राज्य परीक्षाओं के लिए {subject} के {count} बहुविकल्पीय प्रश्न, उत्तर और व्याख्या सहित। मुफ़्त, हिंदी और अंग्रेज़ी में।",
    show: "उत्तर देखें", answer: "उत्तर", practice: "इन्हें क्विज़ की तरह हल करें",
  },
  notes: { title: "क्विक नोट्स", practice: "इस टॉपिक का अभ्यास करें" },
  age: {
    title: "परीक्षा आयु पात्रता कैलकुलेटर",
    desc: "परीक्षा की कट-ऑफ तिथि पर अपनी सटीक आयु जानें और OBC, SC/ST व दिव्यांग छूट के साथ पात्रता जाँचें।",
    dob: "जन्म तिथि", asOn: "आयु की गणना तिथि (कट-ऑफ)", min: "न्यूनतम आयु", max: "अधिकतम आयु",
    category: "श्रेणी",
    cats: ["सामान्य / EWS (कोई छूट नहीं)", "OBC (+3 वर्ष)", "SC / ST (+5 वर्ष)", "दिव्यांग – सामान्य (+10 वर्ष)"],
    check: "पात्रता जाँचें", yourAge: "कट-ऑफ तिथि पर आपकी आयु",
    years: "वर्ष", months: "माह", days: "दिन",
    eligible: "आप पात्र हैं ✅", tooYoung: "अभी पात्र नहीं – न्यूनतम आयु से कम ❌", tooOld: "पात्र नहीं – अधिकतम आयु सीमा से अधिक ❌",
    upper: "छूट सहित ऊपरी आयु सीमा",
    note: "दिखाई गई छूट केंद्र सरकार के सामान्य नियम हैं। हमेशा आधिकारिक अधिसूचना से पुष्टि करें।",
  },
  footer: "सरकारी परीक्षा की तैयारी करने वालों के लिए मुफ़्त अभ्यास।",
};

export const DICT: Record<Lang, BaseDict & SaasDict> = { en: { ...en, ...SAAS.en }, hi: { ...hi, ...SAAS.hi } };
type FullDict = BaseDict & SaasDict;
export type { FullDict as Dict };
