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
function clean(v) {
  if (v === undefined || v === null) return "";
  return String(v)
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function limit(text, max = 3500) {
  if (!text) return "";
  if (text.length <= max) return text;
  return text.slice(0, max) + "…";
}

// Convert MM/YYYY → Month YYYY
function formatDateToText(dateStr) {
  if (!dateStr) return "";
  const cleaned = dateStr.replace(/-/g, "/").trim();
  const parts = cleaned.split("/");
  if (parts.length < 2) return clean(dateStr);

  const month = parseInt(parts[0], 10);
  const year = parts[1];

  if (isNaN(month) || !year) return clean(dateStr);

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  return `${monthNames[month - 1]} ${year}`;
}

/* ===========================
   STRING → ARRAY (SAFE)
=========================== */
function splitLines(text) {
  if (!text) return [];
  return String(text)
    .split(/\r?\n/)
    .map(clean)
    .filter(Boolean);
}

/* ===========================
   AI HELPER — CLEAN LIST ONLY
=========================== */
async function polishList(list, label) {
  if (!Array.isArray(list) || list.length === 0) return list;

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
${JSON.stringify(list, null, 2)}
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
    return Array.isArray(parsed.items)
      ? parsed.items.map(clean).filter(Boolean)
      : list;
  } catch {
    return list;
  }
}

/* ===========================
   API HANDLER
=========================== */
export async function POST(req) {
  const body = await req.json();

  const s = body.student || {};
  const workExperience = Array.isArray(body.workExperience) ? body.workExperience : [];
  const education = Array.isArray(body.education) ? body.education : [];

  // 🔑 STRINGS FROM FRONTEND
  const allCertsTextRaw = clean(body.allCerts || "");
  const allSkillsTextRaw = clean(body.allSkills || "");

  const careerContext = body.careerContext || {};

  /* ===========================
     BASE DATA
  =========================== */
  const baseData = {
    name: clean(s.name),
    email: clean(s.email),
    phone: clean(s.phone),
    address: clean(s.address),
    city: clean(s.city),
    state: clean(s.state),
    zip: clean(s.zip),
    programCampus: clean(s.programCampus),
    graduationDate: clean(s.graduationDate),

    workExperience: workExperience.map(j => {
      const tasks = Array.isArray(j.tasks) ? j.tasks : [];
      return {
        employer: clean(j.employer),
        employerCity: clean(j.employerCity),
        employerState: clean(j.employerState),
        title: clean(j.title),
        start: formatDateToText(clean(j.start)),
        end: formatDateToText(clean(j.end)),
        task1: clean(tasks[0] || ""),
        task2: clean(tasks[1] || ""),
        task3: clean(tasks[2] || ""),
        task4: clean(tasks[3] || ""),
        task5: clean(tasks[4] || ""),
      };
    }),

    education: education.map(e => ({
      school: clean(e.school),
      program: clean(e.program),
      startDate: clean(e.startDate),
      endDate: clean(e.endDate),
      notes: clean(e.notes),
    })),

    hasWorkExperience: workExperience.length > 0,
    hasEducation: education.length > 0,

    careerContext,
  };

  /* ===========================
     AI POLISH (SUMMARY / WORK / EDU)
  =========================== */
  let polished = {
    summary: "",
    workExperience: baseData.workExperience,
    education: baseData.education,
  };

  try {
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

${masterStyleGuide}

REQUIRED OUTPUT (JSON):
{
  "summary": "one paragraph",
  "summaryBullets": ["...", "..."],
  "workExperience": [...],
  "education": [...]
}

PROFESSIONAL SUMMARY:
- Use ONLY careerContext (objectives, jobTarget, notes)
- 4–6 complete sentences
- Professional tone
- One paragraph
- Do NOT use workExperience or education for the summary

WORK EXPERIENCE (FORMAT + REWRITE — STRICT):
For EACH job, rewrite to match this presentation intent:
Title (professional)
Employer (proper name) (City, STATE)
Start Month Year – End Month Year

TITLE RULES:
- Fix spelling/capitalization
- Convert generic titles to professional titles when obvious
  Example: "teacher" → "Instructor, Building Technology"

EMPLOYER RULES:
- Fix spelling/capitalization
- Expand obvious abbreviations
  Example: "new castle scholl of trades" → "New Castle School of Trades"

LOCATION RULES:
- employerCity in Proper Case (e.g., "New Castle")
- employerState UPPERCASE 2-letter (e.g., "PA")
- Never remove city/state

BULLET RULES:
- Rewrite each non-empty task into a professional resume bullet
- 14–22 words per bullet
- Start with a strong action verb
- Add clarity (scope/tools/outcome) without inventing facts
- No bullet symbols in returned strings

EDUCATION:
- Clean and normalize school/program text
- Keep dates clean
- No invented degrees or institutions
          `.trim()
        },
        {
          role: "user",
          content: JSON.stringify({
            student: {
              name: baseData.name,
              programCampus: baseData.programCampus,
              graduationDate: baseData.graduationDate,
            },
            careerContext,
            workExperience: baseData.workExperience,
            education: baseData.education
          }, null, 2)
        }
      ]
    });

    polished = JSON.parse(completion.choices[0].message.content);
  } catch (e) {
    console.error("AI polish failed:", e);
  }

  /* ===========================
     CERTS / SKILLS — STRINGS
  =========================== */
  let certArray = splitLines(allCertsTextRaw);
  let skillArray = splitLines(allSkillsTextRaw);

  certArray = await polishList(certArray, "certifications");
  skillArray = await polishList(skillArray, "skills");

  const finalData = {
    ...baseData,

    professionalSummary: limit(clean(polished.summary || ""), 600),

    workExperience: baseData.workExperience.map((base, i) => {
      const ai = polished.workExperience?.[i] || {};
      return {
        employer: clean(ai.employer ?? base.employer),
        employerCity: clean(ai.employerCity ?? base.employerCity),
        employerState: clean(ai.employerState ?? base.employerState),
        title: clean(ai.title ?? base.title),
        start: formatDateToText(clean(ai.start ?? base.start)),
        end: formatDateToText(clean(ai.end ?? base.end)),
        task1: limit(clean(ai.task1 ?? base.task1), 300),
        task2: limit(clean(ai.task2 ?? base.task2), 300),
        task3: limit(clean(ai.task3 ?? base.task3), 300),
        task4: limit(clean(ai.task4 ?? base.task4), 300),
        task5: limit(clean(ai.task5 ?? base.task5), 300),
      };
    }),

    education: (polished.education || baseData.education).map((e, i) => {
      const base = baseData.education[i] || {};
      return {
        school: clean(e.school ?? base.school),
        program: clean(e.program ?? base.program),
        startDate: clean(e.startDate ?? base.startDate),
        endDate: clean(e.endDate ?? base.endDate),
        notes: limit(clean(e.notes ?? base.notes), 400),
      };
    }),

    // 🔑 FINAL STRINGS FOR TEMPLATE
    allCertsText: certArray.join("\n"),
    allSkillsText: skillArray.join("\n"),

    hasCertifications: certArray.length > 0,
    hasSkills: skillArray.length > 0,
  };

  /* ===========================
     DOCXTEMPLATER
  =========================== */
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