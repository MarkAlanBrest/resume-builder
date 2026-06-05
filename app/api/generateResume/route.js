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
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "") // remove invalid XML chars
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeAllStrings(v) {
  if (Array.isArray(v)) {
    return v.map(sanitizeAllStrings);
  }
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.entries(v).map(([k, val]) => [k, sanitizeAllStrings(val)])
    );
  }
  if (typeof v === "string") {
    return v
      .replace(/[\u2018\u2019]/g, "'")     // curly apostrophes
      .replace(/[\u201C\u201D]/g, '"')     // curly quotes
      .replace(/\u00A0/g, " ")             // non-breaking spaces
      .replace(/[\u200B-\u200F]/g, "")     // zero-width chars
      .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ""); // invalid XML
  }
  return v;
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
  return text.slice(0, max) + "...";
}

function formatDateToText(dateStr) {
  if (!dateStr) return "";
  if (String(dateStr).trim().toLowerCase() === "present") return "Present";

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
  return !text || String(text).trim() === "";
}
function isWeakTask(text, base) {
  if (!text) return true;

  const cleaned = clean(text);
  const baseClean = clean(base);

  // Too short (not expanded properly)
  if (cleaned.split(" ").length < 10) return true;

  // Identical to original input
  if (cleaned.toLowerCase() === baseClean.toLowerCase()) return true;

  return false;
}

function expandFallback(text, title) {
  const cleaned = clean(text || "");
  if (!cleaned) return "";
  return cleaned.replace(/^./, c => c.toUpperCase()).replace(/\.$/, "") + ".";
} 

function isCurrentJob(job) {
  return String(job?.end || "").trim().toLowerCase() === "present";
}
  

/* ===========================
   🔽 ADDED SORT HELPERS (ONLY ADDITION)
=========================== */
function dateSortValue(dateStr, presentValue = 999912) {
  const value = String(dateStr || "").trim().toLowerCase();
  if (!value) return 0;
  if (/\b(present|current|expected)\b/.test(value)) return presentValue;

  const match = value.match(/\b(0?[1-9]|1[0-2])\s*[/-]\s*(\d{4})\b/);
  if (!match) return 0;

  const month = Number(match[1]);
  const year = Number(match[2]);
  return year * 100 + month;
}

function sortJobsNewestFirst(jobs) {
  return [...jobs].sort((a, b) => {
    const endDiff = dateSortValue(b.end) - dateSortValue(a.end);
    if (endDiff !== 0) return endDiff;

    return dateSortValue(b.start, 0) - dateSortValue(a.start, 0);
  });
}

function sortEducationNewestFirst(education) {
  return [...education].sort((a, b) => {
    const endDiff = dateSortValue(b.endDate) - dateSortValue(a.endDate);
    if (endDiff !== 0) return endDiff;

    return dateSortValue(b.startDate, 0) - dateSortValue(a.startDate, 0);
  });
}

/* ===========================
   PROGRAM BLOCK EXTRACTOR
=========================== */
function normalizeProgramKey(value) {
  return String(value || "")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function extractProgramBlock(guide, programName) {
  if (!guide || !programName) return "";
  const marker = `===== PROGRAM: ${programName} =====`;
  const start = guide.indexOf(marker);
  if (start !== -1) {
    const next = guide.indexOf("===== PROGRAM:", start + marker.length);
    return guide.slice(start, next === -1 ? guide.length : next).trim();
  }

  const target = normalizeProgramKey(programName);
  const markers = [...guide.matchAll(/===== PROGRAM: ([\s\S]*?) =====/g)];
  const match = markers.find(m => normalizeProgramKey(m[1]) === target);
  if (!match) return "";

  const fallbackStart = match.index;
  const fallbackNext = guide.indexOf("===== PROGRAM:", fallbackStart + match[0].length);
  return guide.slice(fallbackStart, fallbackNext === -1 ? guide.length : fallbackNext).trim();
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
- Correct spelling and capitalization
- Normalize formatting
- Rewrite text into clear, professional, resume-ready language
- Preserve the original meaning and intent

DO NOT:
- Invent duties, skills, credentials, or experience
- Add facts not present in the input
- Exaggerate responsibilities or seniority

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

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      Allow: "POST, OPTIONS",
    },
  });
}

export async function POST(req) {

  const body = await req.json();

  // SKIP AI when frontend already has finalData
  if (body.finalData) {

    const templatePath = path.join(
      process.cwd(),
      "public",
      "templates",
      `${body.TEMPLATE}.docx`
    );

    const content = fs.readFileSync(templatePath);
const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "{", end: "}" },
    });
const safeData = sanitizeAllStrings(body.finalData);
doc.setData(safeData);



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

  if (!body.TEMPLATE) {
    return new Response("Missing TEMPLATE value", { status: 400 });
  }

  const s = body.student || {};

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
      
      
function fixTypos(t){
  return clean(t)
    .replace(/\btuaghr\b/gi,"taught")
    .replace(/\btaight\b/gi,"taught")
    .replace(/\blassons?\b/gi,"lessons")
    .replace(/\bconstruciton\b/gi,"construction");
}

const rawTasks = [
  j.task1,
  j.task2,
  j.task3,
  j.task4,
  j.task5,

  // ⭐ ADD THESE TWO LINES
  ...(Array.isArray(j.bullets) ? j.bullets : []),
  ...(Array.isArray(j.duties) ? j.duties : [])
].map(fixTypos).filter(Boolean);


const tasksArr = rawTasks;


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
        isCurrent: isCurrentJob(j),
        tenseInstruction: isCurrentJob(j)
          ? "Use present tense for ongoing responsibilities in this job."
          : "Use past tense for this completed job.",
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

  // Derive the guide from the raw selected program first; clean() removes em dashes used in style-guide markers.
  const programName = String(s.programCampus || body.education?.[0]?.program || "").trim();
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

objectives: body.careerContext?.objectives || "",


  program: programName,
  programGuide,
  skills: skillArray,
  certifications: certArray,
 workExperience: baseData.workExperience.map(j => ({
  ...j,
  task1: j.task1,
  task2: j.task2,
  task3: j.task3,
  task4: j.task4,
  task5: j.task5
})),

  education: baseData.education,

  // ⭐ ADD THIS — SAFE VERSION
  summaryBullets: body.summary1 || body.summary2 || body.summary3 || body.summary4 || body.summary5
    ? [
        body.summary1 || "",
        body.summary2 || "",
        body.summary3 || "",
        body.summary4 || "",
        body.summary5 || ""
      ].filter(Boolean)
    : []
};


    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          
 
  role: "system",
content: `
You are an AI resume writer.

MASTER STYLE GUIDE: Follow the programGuide only.

GLOBAL RULES:
- Do not return empty or partial sections.

LANGUAGE & STYLE RULES:
- Use professional, employer-facing language.
- Do NOT use first person ("I", "we").
- Avoid filler phrases and buzzwords.
- Do not repeat the same idea across sections.
- ALWAYS correct spelling and typographical errors in ALL sections.

FORMATTING RULES:
- Return plain text only.
- Do NOT include bullet characters or numbering.
- Do NOT include headings inside fields.

TENSE RULES:
- Work experience uses past tense unless the job entry has end date "Present" or isCurrent true.
- For current jobs, use present-tense action verbs for ongoing responsibilities, such as Manage, Operate, Maintain, Build, Coordinate, Train, Assist, Install, Repair, or Supervise.
- For completed jobs, use past-tense action verbs, such as Managed, Operated, Maintained, Built, Coordinated, Trained, Assisted, Installed, Repaired, or Supervised.
- Do not convert current-job verbs like Manage, Maintains, Operate, or Coordinates into past tense.
- Professional summary, objectives, program description, and tools use present tense.

--------------------------------------------------

WORK EXPERIENCE RULES

Each job duty (task1–task5) is a short description of a responsibility.  
Rewrite each one into a full, professional resume sentence.

The workExperience array contains job entries. 
Each job entry includes fields named task1, task2, task3, task4, and task5. 
Each of these fields contains a short, user-entered job duty.
Each job entry also includes isCurrent and tenseInstruction. You MUST follow these fields when choosing verb tense.

You MUST rewrite task1–task5 for every job entry using the WORK EXPERIENCE RULES.
Return the rewritten sentences in the same fields: task1, task2, task3, task4, task5.
Return workExperience in the exact same order as provided.

Requirements:
...


• Fully rewrite the sentence. Do NOT lightly edit the original text.
• Correct all spelling and grammar errors.
• Start with a strong action verb.
• Expand the input into a clear, detailed, resume-quality sentence.
• Sentences must contain 16–24 words.
• You ARE allowed to add realistic, job‑appropriate detail, tools, safety practices, shop responsibilities, and hands‑on context even if not stated.
• Emphasize construction tasks, tool use, measurements, safety procedures, demonstrations, and practical skill development.
• Teaching roles may reference demonstrations, guided practice, tool handling, safety instruction, and shop management.
• Added detail must be plausible for the role.
• Do NOT include bullet characters or numbering.
• Do NOT copy the original wording.
• Each rewritten duty must use different verbs, structure, and phrasing.
• Avoid repeating the same sentence pattern or ending across duties.



--------------------------------------------------

EDUCATION RULES

- Education fields are factual.
- Fix spelling, punctuation, capitalization, and spacing.
- Do NOT rewrite, summarize, or add education content.
- Do NOT change dates, school names, or program names.
- Notes may be rewritten into professional resume-ready language.
- Preserve the original meaning of the notes.
- Do NOT invent honors, awards, or achievements not present in the input.

--------------------------------------------------

PROGRAM DESCRIPTION RULES:
- Write a resume-style program description describing the candidate’s completed training.
- Write 5–7 complete sentences.
- Frame the program as hands-on experience and skill development, not advertising.
- Do NOT use promotional language such as “This program prepares…”.
- Do NOT invent certifications, licenses, or achievements.
- Use past tense for completed training.
- Return the paragraph as the value for "programDescription".

PROGRAM TOOLS RULES:
- Write a resume-style tools section describing tools the candidate has used.
- Write 3–4 complete sentences.
- Frame tools as hands-on experience.
- Use phrasing such as:
  "Experienced using..."
  "Hands-on experience with..."
  "Worked with tools including..."
- Base content ONLY on the programGuide and program context.
- Do NOT invent tools.

--------------------------------------------------

OBJECTIVES RULES:
- Rewrite objectives into professional resume language.
- Preserve the original intent and job focus.
- Do NOT repeat the objectives verbatim.
- Do NOT invent job titles, credentials, or experience.
- Use present or future-oriented language.
- Objectives must inform both the Professional Summary and Summary Bullets.

--------------------------------------------------

PROFESSIONAL SUMMARY RULES:
- Write ONE concise professional summary (3–4 sentences max).
- Do NOT use first person ("I") or third person names (no "he/she" or the person's name).
- Write in implied first person (standard resume style with no subject).
- Base the summary primarily on the Objectives input.
- Support with relevant work experience, education, and technical skills.

STYLE REQUIREMENTS:
- Use direct, specific, resume-quality language.
- Focus on skills, tools, equipment, and hands-on experience.
- Avoid generic phrases such as "dedicated", "hardworking", "team player", or "motivated".
- Avoid repeating the same idea in multiple sentences.
- Keep sentences tight, clear, and impactful.

CONSTRAINTS:
- Do NOT exaggerate experience or invent credentials.
- Do NOT add information not present in the input.
- Do NOT include filler or unnecessary wording.

--------------------------------------------------

SUMMARY BULLETS RULES

Write 3–5 professional resume bullet statements.

• Each bullet must describe a job skill, technical ability, tool usage, or work responsibility.
• Do NOT write generic traits such as punctual, reliable, hardworking, team player, or motivated.
• Start each sentence with an action verb.
• Sentences should typically contain 14–20 words.
• Focus on job skills, safety practices, tools, construction tasks, mechanical work, or shop responsibilities.
• Do NOT include bullet characters or numbering.
• Each bullet must sound like resume content, not a personality trait or classroom description.

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



let raw = completion.choices[0].message.content || "";


// 🔥 STRIP MARKDOWN CODE FENCES
raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();

try {
  polished = JSON.parse(raw);
} catch {
  polished = {};
}

if (Array.isArray(polished.education)) {
  polished.education = sortEducationNewestFirst(polished.education);
}

} catch (e) {
  console.error("AI polish failed:", e);
}

/* BUILD FINAL DATA */

const summaryBullets = Array.isArray(polished.summaryBullets)
  ? polished.summaryBullets.map(clean).filter(Boolean)
  : [];

function safeTask(aiTask, baseTask, title) {
  const cleanedAI = clean(aiTask);
  const cleanedBase = clean(baseTask);
 
  if (cleanedAI && cleanedAI.split(" ").length >= 10) {
    return limit(cleanedAI, 300);
  }

  return limit(expandFallback(cleanedBase, title), 300);
}


const finalData = {
  ...baseData,

  programTools: clean(polished.programTools || ""),
  professionalSummary: limit(clean(polished.summary || ""), 1200),
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

 task1: safeTask(ai.task1, base.task1, base.title),
task2: safeTask(ai.task2, base.task2, base.title),
task3: safeTask(ai.task3, base.task3, base.title),
task4: safeTask(ai.task4, base.task4, base.title),
task5: safeTask(ai.task5, base.task5, base.title),

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

/* RETURN JSON TO FRONTEND (AI ONLY RUNS HERE) */


  const safeFinalData = sanitizeAllStrings(finalData);

return new Response(JSON.stringify({ finalData: safeFinalData }), {

  status: 200,
  headers: { "Content-Type": "application/json" },
});
}
