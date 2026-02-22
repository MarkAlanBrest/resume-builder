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
  const workExperience = Array.isArray(body.workExperience) ? body.workExperience : [];
  const education = Array.isArray(body.education) ? body.education : [];

  const allCertsTextRaw = clean(body.allCerts || "");
  const allSkillsTextRaw = clean(body.allSkills || "");
  const careerContext = body.careerContext || {};

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

    hasWorkExperience: workExperience.some(j => clean(j.employer) || clean(j.title)),
    hasEducation: education.length > 0,

    careerContext,
  };

  /* ===========================
     AI POLISH (SUMMARY + WORK + EDU)
=========================== */
  let polished = {
    summary: "",
    summaryBullets: [],
    workExperience: baseData.workExperience,
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

REQUIRED OUTPUT (JSON):
{
  "summary": "one paragraph",
  "summaryBullets": ["...", "..."],
  "workExperience": [...],
  "education": [...]
}

PROFESSIONAL SUMMARY RULES:
- Build "summary" and "summaryBullets" using ONLY careerContext (objectives, jobTarget, notes)
- Do NOT use workExperience or education for the summary
- summary = 3–4 sentences, one paragraph
- summaryBullets = 3–5 bullets, 8–14 words each, NO bullet symbols

WORK EXPERIENCE RULES:
- Rewrite each non-empty task into a strong resume bullet (12–22 words)
- No bullet symbols
- Never remove employerCity or employerState
- Normalize employerCity to Proper Case
- Normalize employerState to UPPERCASE 2-letter

EDUCATION RULES:
- Clean and normalize school/program
- Keep dates clean
- No invented degrees or schools
          `.trim()
        },
        {
          role: "user",
          content: JSON.stringify(aiInput, null, 2)
        }
      ]
    });

    polished = JSON.parse(completion.choices[0].message.content);
  } catch (e) {
    console.error("AI polish failed:", e);
  }

  /* ===========================
     CERTS / SKILLS (LIGHT CLEAN)
=========================== */
  const certArray = await polishList(splitLines(allCertsTextRaw), "certifications");
  const skillArray = await polishList(splitLines(allSkillsTextRaw), "skills");

  const summaryBullets = Array.isArray(polished.summaryBullets) ? polished.summaryBullets : [];

  const finalData = {
    ...baseData,

    professionalSummary: limit(clean(polished.summary || ""), 600),

    summary1: clean(summaryBullets[0] || ""),
    summary2: clean(summaryBullets[1] || ""),
    summary3: clean(summaryBullets[2] || ""),
    summary4: clean(summaryBullets[3] || ""),
    summary5: clean(summaryBullets[4] || ""),

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