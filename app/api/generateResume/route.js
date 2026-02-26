console.log(
  "TEST PATH:",
  require("fs").existsSync(
    require("path").join(process.cwd(), "lib", "styleguides2", "masterStyleGuide.js")
  )
);

import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import OpenAI from "openai";
import { masterStyleGuide } from "../../../lib/styleguides2/masterStyleGuide.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ===========================
   HELPERS
=========================== */

function normalizeEmployer(text) {
  if (!text) return "";

  return titleCaseSafe(text)
    .replace(/\bScholl\b/i, "School")
    .replace(/\bOf\b/g, "of");
}
function clean(v) {
  if (v === undefined || v === null) return "";
  return String(v)
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCaseSafe(v) {
  if (!v) return "";
  return String(v)
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

function formatPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return clean(phone);
}

function limit(text, max = 3500) {
  if (!text) return "";
  if (text.length <= max) return text;
  return text.slice(0, max) + "…";
}

function formatDateToText(dateStr) {
  if (!dateStr) return "";
  const cleaned = clean(dateStr).replace(/-/g, "/").trim();
  const parts = cleaned.split("/");
  if (parts.length < 2) return clean(dateStr);

  const month = parseInt(parts[0], 10);
  const year = parts[1];

  if (isNaN(month) || !year) return clean(dateStr);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const idx = month - 1;
  if (idx < 0 || idx > 11) return clean(dateStr);
  return `${monthNames[idx]} ${year}`;
}



function splitLines(text) {
  if (!text) return [];
  return String(text)
    .split(/\r?\n/)
    .map(clean)
    .filter(Boolean);
}


function looksWeak(text) {
  return !text || text.split(" ").length < 4;
}

function expandFallback(text, title) {
  if (!text) return "";

  const cleaned = clean(text);

  // Remove duplicated leading verbs (prevents "managed managed", "taught taught")
  const normalized = cleaned.replace(
    /^(managed|manage|taught|teach|created|create|performed|handled)\s+/i,
    ""
  );

  const patterns = [
    t => `Provided instruction related to ${t} while maintaining professional standards in the ${title} role.`,
    t => `Oversaw and coordinated ${t} as part of daily responsibilities in the ${title} role.`,
    t => `Supported ${t} through effective organization and professional communication in the ${title} role.`,
    t => `Contributed to ${t} while demonstrating reliability and professionalism in the ${title} role.`
  ];

  // Rotate sentence structure so bullets don’t all look alike
  const pick = patterns[Math.floor(Math.random() * patterns.length)];
  return pick(normalized).replace(
  title,
  titleCaseSafe(title)
);
}

/* ===========================
   🔽 ADDED SORT HELPERS (ONLY ADDITION)
=========================== */
function sortJobsNewestFirst(jobs) {
  return [...jobs].sort((a, b) => {
    const endA =
      !a.end || String(a.end).toLowerCase() === "present"
        ? new Date("9999-12-31")
        : new Date(a.end);

    const endB =
      !b.end || String(b.end).toLowerCase() === "present"
        ? new Date("9999-12-31")
        : new Date(b.end);

    return endB - endA;
  });
}

function sortEducationNewestFirst(education) {
  return [...education].sort((a, b) => {
    const endA =
      !a.endDate || String(a.endDate).toLowerCase() === "present"
        ? new Date("9999-12-31")
        : new Date(a.endDate);

    const endB =
      !b.endDate || String(b.endDate).toLowerCase() === "present"
        ? new Date("9999-12-31")
        : new Date(b.endDate);

    return endB - endA;
  });
}

/* ===========================
   PROGRAM BLOCK EXTRACTOR
=========================== */
function extractProgramBlock(guide, programName) {
  if (!guide || !programName) return "";
  const marker = `===== PROGRAM: ${programName} =====`;
  const start = guide.indexOf(marker);
  if (start === -1) return "";
  const next = guide.indexOf("===== PROGRAM:", start + marker.length);
  return guide.slice(start, next === -1 ? guide.length : next).trim();
}

/* ===========================
   AI HELPER — CLEAN LIST ONLY
=========================== */
async function polishList(list, label) {
  const safeList = Array.isArray(list) ? list.map(clean).filter(Boolean) : [];
  if (safeList.length === 0) return [];

  const prompt = `
You are cleaning a list of ${label} for a student's resume.

ONLY:
- Fix spelling
- Fix capitalization
- Fix minor formatting
- Remove exact duplicates

DO NOT:
- Rewrite
- Add content
- Strengthen language

Return JSON ONLY:
{ "items": ["...", "..."] }

LIST:
${JSON.stringify(safeList, null, 2)}
`.trim();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You clean text only." },
      { role: "user", content: prompt }
    ]
  });

  try {
    const parsed = JSON.parse(response.choices[0].message.content);
    const items = Array.isArray(parsed.items) ? parsed.items : safeList;
    return items.map(clean).filter(Boolean);
  } catch {
    return safeList;
  }
}

/* ===========================
   API HANDLER
=========================== */
export async function POST(req) {
  const body = await req.json();

  const s = body.student || {};

  /* 🔽 CHANGED: apply sorting ONCE, immediately */
  const workExperience = sortJobsNewestFirst(
    Array.isArray(body.workExperience) ? body.workExperience : []
  );

  const education = sortEducationNewestFirst(
    Array.isArray(body.education) ? body.education : []
  );

  const allCertsTextRaw = clean(body.allCerts || "");
  const allSkillsTextRaw = clean(body.allSkills || "");
  const careerContext = body.careerContext || {};

  const baseData = {
    name: clean(s.name),
    email: clean(s.email),
    phone: formatPhone(s.phone),
    address: clean(s.address),
    city: clean(s.city),
    state: clean(s.state),
    zip: clean(s.zip),
    programCampus: clean(s.programCampus),
    graduationDate: clean(s.graduationDate),

    workExperience: workExperience.map(j => {
      
      
const rawTasks = [
  j.task1,
  j.task2,
  j.task3,
  j.task4,
  j.task5
].map(clean).filter(Boolean);

const tasksArr =
  Array.isArray(j.tasks) && j.tasks.length > 0
    ? j.tasks.map(clean).filter(Boolean)
    : rawTasks;

const t1 = tasksArr[0] || "";
const t2 = tasksArr[1] || "";
const t3 = tasksArr[2] || "";
const t4 = tasksArr[3] || "";
const t5 = tasksArr[4] || "";




      return {
        employer: clean(j.employer),
        employerCity: clean(j.employerCity),
        employerState: clean(j.employerState),
        title: clean(j.title),
        start: formatDateToText(clean(j.start)),
        end: formatDateToText(clean(j.end)),
        task1: t1,
        task2: t2,
        task3: t3,
        task4: t4,
        task5: t5,
      };
    }),

    education: education.map(e => ({
      school: clean(e.school),
      program: clean(e.program),
      eduCity: clean(e.city),
      eduState: clean(e.state),
      startDate: formatDateToText(clean(e.startDate)),
      endDate: formatDateToText(clean(e.endDate)),
      notes: clean(e.notes),
    })),

    hasWorkExperience: workExperience.some(
      j => clean(j.employer) || clean(j.title)
    ),
    hasEducation: education.length > 0,

    careerContext,
  };

  // derive program name + block from masterStyleGuide
  const programName = baseData.education?.[0]?.program || "";
  const programGuide = extractProgramBlock(masterStyleGuide, programName);

  /* ===========================
     CERTS / SKILLS
=========================== */
  const certArray = await polishList(
    splitLines(allCertsTextRaw),
    "certifications"
  );
  const skillArray = await polishList(
    splitLines(allSkillsTextRaw),
    "skills"
  );

  /* ===========================
     AI POLISH
=========================== */
  let polished = {
    summary: "",
    summaryBullets: [],
workExperience: baseData.workExperience.map(j => ({
  ...j,
  task1: j.task1 || "",
  task2: j.task2 || "",
  task3: j.task3 || "",
  task4: j.task4 || "",
  task5: j.task5 || ""
})),

    
    education: baseData.education,
  };

  try {
 const aiInput = {
  student: {
    name: baseData.name,
    programCampus: baseData.programCampus,
    graduationDate: baseData.graduationDate,
  },
  careerContext: baseData.careerContext,

  objectives: body.objectives || "", // 👈 ADD THIS LINE

  program: programName,
  programGuide,
  skills: skillArray,
  certifications: certArray,
  workExperience: baseData.workExperience,
  education: baseData.education
};

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          
 
  role: "system",
content: `
You are an AI resume writer.
Follow the MASTER STYLE GUIDE EXACTLY.

MASTER STYLE GUIDE:
${masterStyleGuide}

GLOBAL RULES:
- Follow the MASTER STYLE GUIDE exactly.
- If a section requires a minimum number of sentences, you MUST meet it.
- Do not return empty or partial sections.

LANGUAGE & STYLE RULES:
- Use professional, employer-facing language.
- Do NOT use first person ("I", "we").
- Do NOT refer to "student", "learner", or "trainee".
- Avoid filler phrases and buzzwords.
- Do not repeat the same idea across sections.
- ALWAYS correct spelling and obvious typographical errors
  in ALL sections, even when rewriting is otherwise restricted.

FORMATTING RULES:
- Return plain text only.
- Do NOT include bullet characters, numbering, or line breaks.
- Do NOT include headings inside fields.

TENSE RULES:
- Work experience uses past tense unless the end date is Present.
- Professional summary, objectives, program description, and tools use present tense.

--------------------------------------------------

WORK EXPERIENCE RULES:
- For each job in workExperience:
  - Rewrite task1–task5 into ONE clear, professional, resume-ready sentence EACH.
  - Each sentence MUST be 12–20 words.
  - Each sentence MUST include:
    • a clear action (what was done)
    • an object or responsibility (what it was done to)
    • context or outcome when appropriate
  - Use the student’s wording as the base and EXPAND it into a complete sentence.
  - Do NOT invent duties, employers, dates, tools, or experience.
  - Fix grammar, capitalization, clarity, and punctuation only.
  - Do NOT add bullet characters.
  - Keep employer, city, state, title, start, and end fields unchanged
    unless correcting spelling.

--------------------------------------------------

EDUCATION RULES:
- Education fields are factual.
- Fix punctuation, capitalization, and spacing ONLY.
- Do NOT rewrite, summarize, or add any education content.
- GPA formatting is allowed (example: "Achieved a 3.8 GPA").
- Do NOT change dates, school names, or program names.
- Notes may be cleaned for punctuation only.

--------------------------------------------------

PROGRAM TOOLS RULES:
- Write a resume-style tools section describing tools the candidate has used.
- Write 3–4 complete sentences.
- Frame all tools as hands-on experience, not instructional exposure.
- Use phrasing such as:
  • "Experienced using..."
  • "Hands-on experience with..."
  • "Worked with tools including..."
- Do NOT refer to students, training environments, or instructional settings.
- Do NOT describe safety gear as "training-related"; describe it as workplace use.
- Base content ONLY on the programGuide and program context.
- Do NOT invent tools not reasonably implied by the program.

PROGRAM TOOLS RULES:
- Write a resume-style tools section describing tools the candidate has used.
- Write 3–4 complete sentences.
- Frame all tools as hands-on experience, not instructional exposure.
- Use phrasing such as:
  • "Experienced using..."
  • "Hands-on experience with..."
  • "Worked with tools including..."
- Do NOT refer to students, training environments, or instructional settings.
- Do NOT describe safety gear as "training-related"; describe it as workplace use.
- Base content ONLY on the programGuide and program context.
- Do NOT invent tools not reasonably implied by the program.

--------------------------------------------------

OBJECTIVES RULES:
- Objectives represent the student’s career goal and intent.
- Rewrite objectives into professional resume language.
- Preserve the original intent and job focus.
- Do NOT repeat the objectives verbatim.
- Do NOT invent job titles, credentials, or experience.
- Use present or future-oriented language.
- Objectives must inform both the Professional Summary and Summary Bullets.

--------------------------------------------------

PROFESSIONAL SUMMARY RULES:
- Write ONE concise paragraph (5–7 complete sentences).
- Write in third person only.
- The summary MUST be primarily based on the Objectives input.
- Use work experience, education, and skills only to SUPPORT the objectives.
- Do NOT repeat objectives verbatim.
- Do NOT exaggerate experience or invent credentials.
- Use present tense for current skills and career focus.

SUMMARY BULLETS RULES:
- Write 3–5 professional, resume-ready bullet statements.
- Each bullet MUST be one complete sentence of 12–18 words.
- Bullets MUST be derived from the Objectives input WHEN PROVIDED.
- If Objectives are missing, brief, or generic, infer intent from
  education, program, and work experience instead.
- Expand basic traits into employer-facing statements.
- Bullets should reflect career goals, skills focus, safety awareness,
  or job intent.
- Do NOT repeat paragraph sentences word-for-word.
- Do NOT include bullet characters or numbering.

--------------------------------------------------

REQUIRED OUTPUT (JSON):
{
  "summary": "one paragraph",
  "summaryBullets": ["...", "..."],
  "workExperience": [...],
  "education": [...],
  "programDescription": "...",
  "programTools": "..."
}



`.trim()


        },
        {
          role: "user",
          content: JSON.stringify(aiInput, null, 2)
        }
      ]
    });

 polished = JSON.parse(completion.choices[0].message.content);

// ⭐ FIX: Sort AI output BEFORE mapping so indexes stay aligned
if (Array.isArray(polished.workExperience)) {
  polished.workExperience = sortJobsNewestFirst(polished.workExperience);
}

if (Array.isArray(polished.education)) {
  polished.education = sortEducationNewestFirst(polished.education);
}

} catch (e) {
  console.error("AI polish failed:", e);
}


  

  const summaryBullets = Array.isArray(polished.summaryBullets)
    ? polished.summaryBullets.map(clean).filter(Boolean)
    : [];

  const finalData = {
    ...baseData,
    programTools: clean(polished.programTools || ""),
    professionalSummary: limit(clean(polished.summary || ""), 600),
    programDescription: clean(polished.programDescription || ""),

    summary1: clean(summaryBullets[0] || ""),
    summary2: clean(summaryBullets[1] || ""),
    summary3: clean(summaryBullets[2] || ""),
    summary4: clean(summaryBullets[3] || ""),
    summary5: clean(summaryBullets[4] || ""),

    workExperience: baseData.workExperience.map((base, i) => {
  const ai = polished.workExperience?.[i] || {};
  return {
 employer: normalizeEmployer(ai.employer ?? base.employer),
employerCity: titleCaseSafe(clean(ai.employerCity ?? base.employerCity)),
employerState: clean(ai.employerState ?? base.employerState),
title: titleCaseSafe(clean(ai.title ?? base.title)),
start: formatDateToText(clean(ai.start ?? base.start)),
end: formatDateToText(clean(ai.end ?? base.end)),

   task1: looksWeak(ai.task1)
  ? expandFallback(base.task1, base.title)
  : limit(clean(ai.task1), 300),

task2: looksWeak(ai.task2)
  ? expandFallback(base.task2, base.title)
  : limit(clean(ai.task2), 300),

task3: looksWeak(ai.task3)
  ? expandFallback(base.task3, base.title)
  : limit(clean(ai.task3), 300),

task4: looksWeak(ai.task4)
  ? expandFallback(base.task4, base.title)
  : limit(clean(ai.task4), 300),

task5: looksWeak(ai.task5)
  ? expandFallback(base.task5, base.title)
  : limit(clean(ai.task5), 300),
  };
}),

    education: (polished.education || baseData.education).map((e, i) => {
      const base = baseData.education[i] || {};
      return {
        school: clean(e.school ?? base.school),
        program: clean(e.program ?? base.program),
        eduCity: clean(e.eduCity ?? base.eduCity),
        eduState: clean(e.eduState ?? base.eduState),
        startDate: clean(e.startDate ?? base.startDate),
        endDate: clean(e.endDate ?? base.endDate),
        notes: limit(clean(e.notes ?? base.notes), 400),
      };
    }),

    hasProgramCerts: certArray.length > 0,
    cert1: certArray[0] || "",
    cert2: certArray[1] || "",
    cert3: certArray[2] || "",
    cert4: certArray[3] || "",
    cert5: certArray[4] || "",
    cert6: certArray[5] || "",
    cert7: certArray[6] || "",
    cert8: certArray[7] || "",
    cert9: certArray[8] || "",
    cert10: certArray[9] || "",

    hasExtraSkills: skillArray.length > 0,
    skill1: skillArray[0] || "",
    skill2: skillArray[1] || "",
    skill3: skillArray[2] || "",
    skill4: skillArray[3] || "",
    skill5: skillArray[4] || "",
    skill6: skillArray[5] || "",
    skill7: skillArray[6] || "",
    skill8: skillArray[7] || "",
    skill9: skillArray[8] || "",
    skill10: skillArray[9] || "",
  };

  

  const templatePath = path.join(
    process.cwd(),
    "public",
    "templates",
    `${body.TEMPLATE}.docx`
  );

  const content = fs.readFileSync(templatePath, "binary");
  const zip = new PizZip(content);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{", end: "}" },
  });

  doc.setData(finalData);
  doc.render();

  const buffer = doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": "attachment; filename=resume.docx",
      "Content-Length": buffer.length.toString(),
    },
  });
}
