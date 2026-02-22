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

// NEW — Convert MM/YYYY → Month YYYY
function formatDateToText(dateStr) {
  if (!dateStr) return "";
  const cleaned = dateStr.replace(/-/g, "/").trim();
  const parts = cleaned.split("/");
  if (parts.length < 2) return clean(dateStr);

  const month = parseInt(parts[0], 10);
  const year = parts[1];

  if (isNaN(month) || !year) return clean(dateStr);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return `${monthNames[month - 1]} ${year}`;
}

// AI helper: clean a list without changing meaning/intent
async function polishList(list, label) {
  const safeList = Array.isArray(list) ? list.map(clean) : [];

  if (safeList.length === 0) {
    return [];
  }

  const prompt = `
You are cleaning a list of ${label} for a student's resume.

Your job is ONLY to:
- fix spelling errors
- fix capitalization
- fix obvious typos
- fix small formatting issues (extra spaces, stray punctuation)
- merge exact duplicates if they appear

You MUST NOT:
- change the meaning or intent
- rewrite items to sound "stronger" or more professional
- add new items
- remove items unless they are clearly nonsense (like "asdfasdf")

Return ONLY valid JSON in this format:

{
  "items": ["...", "...", "..."]
}

Here is the list to clean:
${JSON.stringify(safeList, null, 2)}
`.trim();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "You clean text without changing meaning or intent.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  try {
    const parsed = JSON.parse(response.choices[0].message.content);
    const items = Array.isArray(parsed.items) ? parsed.items : [];
    return items.map(clean).filter((v) => v !== "");
  } catch (e) {
    console.error("polishList JSON parse error:", e);
    return safeList;
  }
}

export async function POST(req) {
  const body = await req.json();

  const s = body.student || {};
  const workExperience = Array.isArray(body.workExperience)
    ? body.workExperience
    : [];
  const education = Array.isArray(body.education) ? body.education : [];

  const allCertsRaw = Array.isArray(body.allCerts) ? body.allCerts : [];
  const allSkillsRaw = Array.isArray(body.allSkills) ? body.allSkills : [];

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

    workExperience: workExperience.map((j) => {
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

    education: education.map((e) => ({
      school: clean(e.school),
      program: clean(e.program),
      startDate: clean(e.startDate),
      endDate: clean(e.endDate),
      notes: clean(e.notes),
    })),

    certifications: {
      allCerts: [],
      allSkills: [],
      allCertsText: "",
      allSkillsText: "",
    },

    hasWorkExperience: workExperience.length > 0,
    hasEducation: education.length > 0,

    careerContext,
  };

  let polished = {
    summary: "",
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
      workExperience: baseData.workExperience.map((j) => ({
        employer: j.employer,
        employerCity: j.employerCity,
        employerState: j.employerState,
        title: j.title,
        start: j.start,
        end: j.end,
        task1: j.task1,
        task2: j.task2,
        task3: j.task3,
        task4: j.task4,
        task5: j.task5,
      })),
      education: baseData.education,
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
You are an AI resume writer for a technical school.
Follow the master style guide EXACTLY.

MASTER STYLE GUIDE:
${masterStyleGuide}
          `.trim(),
        },
        {
          role: "user",
          content: `
Using the master style guide above and the student data below:

1. Select the correct PROGRAM block based on "programCampus".
2. Apply GLOBAL rules + that PROGRAM block only.
3. Build the "summary" field ONLY from:
   - The student's Objective Page (careerContext)
   - The correct PROGRAM block from the style guide
   DO NOT use work history or education to build the summary.

4. Return polished resume content as STRICT JSON.

Formatting rules for workExperience:
- Normalize employerCity to Proper Case.
- Normalize employerState to UPPERCASE 2-letter postal abbreviation.
- Never remove or omit employerCity or employerState.

Formatting rules for workExperience task fields:
- Rewrite each non-empty task into a strong, detailed, professional resume bullet.
- Expand vague tasks using standard responsibilities, tools, methods, or outcomes.
- Keep each bullet 12–22 words.
- No bullet symbols in the returned strings.

⭐ EDUCATION RULES
Formatting rules for education:
- Rewrite school, program, startDate, endDate, and notes into clean, professional resume text.
- Normalize school and program names to Proper Case.
- Expand vague program names into industry-recognized wording.
- Keep dates clean; if incomplete, keep year only.
- No invented degrees or institutions.

Do NOT touch certifications or skills in this call.

Return ONLY valid JSON.

STUDENT DATA:
${JSON.stringify(aiInput, null, 2)}
          `.trim(),
        },
      ],
    });

    polished = JSON.parse(completion.choices[0].message.content);
  } catch (err) {
    console.error("AI polishing (summary/work/education) failed:", err);
  }

  let cleanedCerts = [];
  let cleanedSkills = [];

  try {
    cleanedCerts = await polishList(allCertsRaw, "certifications");
  } catch (e) {
    cleanedCerts = allCertsRaw.map(clean).filter((v) => v !== "");
  }

  try {
    cleanedSkills = await polishList(allSkillsRaw, "skills");
  } catch (e) {
    cleanedSkills = allSkillsRaw.map(clean).filter((v) => v !== "");
  }

  const finalData = {
    ...baseData,

    professionalSummary: clean(polished.summary || ""),

    workExperience: baseData.workExperience.map((base, idx) => {
      const aiJob = polished.workExperience?.[idx] || {};

      return {
        employer: clean(aiJob.employer ?? base.employer),
        employerCity: clean(aiJob.employerCity ?? base.employerCity),
        employerState: clean(aiJob.employerState ?? base.employerState),
        title: clean(aiJob.title ?? base.title),
        start: formatDateToText(clean(aiJob.start ?? base.start)),
        end: formatDateToText(clean(aiJob.end ?? base.end)),
        task1: limit(clean(aiJob.task1 ?? base.task1), 300),
        task2: limit(clean(aiJob.task2 ?? base.task2), 300),
        task3: limit(clean(aiJob.task3 ?? base.task3), 300),
        task4: limit(clean(aiJob.task4 ?? base.task4), 300),
        task5: limit(clean(aiJob.task5 ?? base.task5), 300),
      };
    }),

    education: (polished.education || baseData.education).map((e, idx) => {
      const base = baseData.education[idx] || {};
      return {
        school: clean(e.school ?? base.school),
        program: clean(e.program ?? base.program),
        startDate: clean(e.startDate ?? base.startDate),
        endDate: clean(e.endDate ?? base.endDate),
        notes: limit(clean(e.notes ?? base.notes), 400),
      };
    }),

    certifications: {
      allCerts: cleanedCerts,
      allSkills: cleanedSkills,
      allCertsText: cleanedCerts.join("\n"),
      allSkillsText: cleanedSkills.join("\n"),
    },

    // REQUIRED FOR DOCXTEMPLATER LOOPS
    allCerts: cleanedCerts,
    allSkills: cleanedSkills,

    hasProgramCerts: cleanedCerts.length > 0,
    hasExtraSkills: cleanedSkills.length > 0,
  };

  finalData.professionalSummary = limit(finalData.professionalSummary, 600);

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
    parser(tag) {
      return {
        get: (scope) => {
          const parts = tag.split(".");
          let value = scope;
          for (const p of parts) {
            if (value == null) return "";
            value = value[p];
          }
          return value;
        },
      };
    },
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
