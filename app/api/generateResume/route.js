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

function properCase(str) {
  const s = clean(str);
  if (!s) return "";
  return s
    .toLowerCase()
    .split(" ")
    .map(w => (w.length <= 3 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

function formatPhone(phone) {
  const d = String(phone || "").replace(/\D/g, "");
  if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
  return clean(phone);
}

function limit(text, max = 3500) {
  if (!text) return "";
  if (text.length <= max) return text;
  return text.slice(0, max) + "…";
}

function formatDateToText(dateStr) {
  if (!dateStr) return "";
  const parts = clean(dateStr).replace(/-/g, "/").split("/");
  if (parts.length < 2) return clean(dateStr);

  const month = parseInt(parts[0], 10);
  const year = parts[1];
  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];
  if (!months[month - 1] || !year) return clean(dateStr);
  return `${months[month - 1]} ${year}`;
}

function splitLines(text) {
  if (!text) return [];
  return String(text).split(/\r?\n/).map(clean).filter(Boolean);
}

/* ===========================
   LIGHT CLEAN (CERTS / SKILLS)
=========================== */
async function polishList(list, label) {
  const safe = Array.isArray(list) ? list.map(clean).filter(Boolean) : [];
  if (!safe.length) return [];

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "Clean text only. Do not rewrite." },
      {
        role: "user",
        content: JSON.stringify({
          task: `Clean ${label}`,
          items: safe
        })
      }
    ]
  });

  try {
    const parsed = JSON.parse(res.choices[0].message.content);
    return Array.isArray(parsed.items) ? parsed.items.map(clean) : safe;
  } catch {
    return safe;
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
  const careerContext = body.careerContext || {};

  const baseData = {
    name: clean(s.name),
    email: clean(s.email),
    phone: formatPhone(s.phone),
    address: clean(s.address),
    city: properCase(s.city),
    state: clean(s.state).toUpperCase().slice(0, 2),
    zip: clean(s.zip),
    programCampus: clean(s.programCampus),
    graduationDate: clean(s.graduationDate),

    workExperience: workExperience.map(j => ({
      employer: clean(j.employer),
      employerCity: properCase(j.employerCity),
      employerState: clean(j.employerState).toUpperCase().slice(0, 2),
      title: clean(j.title),
      start: formatDateToText(j.start),
      end: formatDateToText(j.end),
      task1: clean(j.task1),
      task2: clean(j.task2),
      task3: clean(j.task3),
      task4: clean(j.task4),
      task5: clean(j.task5),
    })),

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
     AI POLISH (FORCED)
=========================== */
  let polished = {
    summary: "",
    summaryBullets: [],
    workExperience: [],
    education: []
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

PROFESSIONAL SUMMARY RULES (STRICT):
- Use ONLY careerContext (objectives, jobTarget, notes)
- ONE paragraph, 4–6 complete sentences
- Confident, professional tone

SUMMARY BULLETS RULES (STRICT):
- 4–6 bullets
- 14–22 words each
- Professional, outcome-focused
- NO bullet symbols

WORK EXPERIENCE RULES (STRICT):
- ALWAYS rewrite employer and title professionally
- Fix spelling and capitalization
- employer/title Proper Case
- Rewrite EVERY task into a professional resume bullet (14–22 words)
- Start each task with an action verb
- NO bullet symbols

EDUCATION RULES:
- Normalize school and program names
- Keep dates clean
- No invented credentials

Return JSON ONLY.
          `.trim()
        },
        {
          role: "user",
          content: JSON.stringify({
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

  const certArray = await polishList(splitLines(body.allCerts), "certifications");
  const skillArray = await polishList(splitLines(body.allSkills), "skills");

  const finalData = {
    ...baseData,

    professionalSummary: limit(clean(polished.summary), 600),

    summary1: clean(polished.summaryBullets?.[0]),
    summary2: clean(polished.summaryBullets?.[1]),
    summary3: clean(polished.summaryBullets?.[2]),
    summary4: clean(polished.summaryBullets?.[3]),
    summary5: clean(polished.summaryBullets?.[4]),

    workExperience: baseData.workExperience.map((base, i) => {
      const ai = polished.workExperience?.[i] ?? {};
      return {
        employer: clean(ai.employer || base.employer),
        employerCity: clean(ai.employerCity || base.employerCity),
        employerState: clean(ai.employerState || base.employerState),
        title: clean(ai.title || base.title),
        start: clean(ai.start || base.start),
        end: clean(ai.end || base.end),
        task1: limit(clean(ai.task1 || base.task1), 300),
        task2: limit(clean(ai.task2 || base.task2), 300),
        task3: limit(clean(ai.task3 || base.task3), 300),
        task4: limit(clean(ai.task4 || base.task4), 300),
        task5: limit(clean(ai.task5 || base.task5), 300),
      };
    }),

    education: (polished.education || baseData.education),

    hasProgramCerts: certArray.length > 0,
    cert1: certArray[0] || "",
    cert2: certArray[1] || "",
    cert3: certArray[2] || "",
    cert4: certArray[3] || "",
    cert5: certArray[4] || "",

    hasExtraSkills: skillArray.length > 0,
    skill1: skillArray[0] || "",
    skill2: skillArray[1] || "",
    skill3: skillArray[2] || "",
    skill4: skillArray[3] || "",
    skill5: skillArray[4] || "",
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