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

function cleanArray(v) {
  if (!Array.isArray(v)) return [];
  return v.map(clean).filter((x) => x !== "");
}

/* FIXED */
function tasksToArray(v) {
  if (Array.isArray(v)) return cleanArray(v);

  const s = String(v || "");
  if (!s.trim()) return [];

  return s
    .split(/\r?\n|;|,/g)
    .map((t) =>
      clean(t)
        .replace(/^([•\-\–\—*]+)\s*/g, "")
        .trim()
    )
    .filter(Boolean);
}

function tasksToText(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return "";
  return arr.map(clean).filter(Boolean).join("; ");
}

function limit(text, max = 3500) {
  if (!text) return "";
  if (text.length <= max) return text;
  return text.slice(0, max) + "…";
}

export async function POST(req) {
  const body = await req.json();

  const s = body.student || {};
  const workExperience = Array.isArray(body.workExperience)
    ? body.workExperience
    : [];
  const education = Array.isArray(body.education) ? body.education : [];
  const certifications = body.certifications || {};
  const careerContext = body.careerContext || {};

  const rawProgramCerts = Array.isArray(certifications.programCerts)
    ? certifications.programCerts
    : [];

  const cleanedProgramCerts = rawProgramCerts
    .map(clean)
    .filter((v) => v !== "");

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

    workExperience: workExperience.map((j) => ({
      employer: clean(j.employer),
      employerCity: clean(j.employerCity),
      employerState: clean(j.employerState),
      title: clean(j.title),
      start: clean(j.start),
      end: clean(j.end),
      tasks: tasksToArray(j.tasks),
    })),

    education: education.map((e) => ({
      school: clean(e.school),
      program: clean(e.program),
      startDate: clean(e.startDate),
      endDate: clean(e.endDate),
      notes: clean(e.notes),
    })),

    certifications: {
      programCerts: cleanedProgramCerts,
      programCertsText: cleanedProgramCerts.join(", "),
      extraCerts: clean(certifications.extraCerts),
      extraSkills: clean(certifications.extraSkills),
    },

    hasWorkExperience: workExperience.length > 0,
    hasEducation: education.length > 0,
    hasProgramCerts: cleanedProgramCerts.length > 0,
    hasExtraCerts:
      !!certifications.extraCerts &&
      String(certifications.extraCerts).trim() !== "",
    hasExtraSkills:
      !!certifications.extraSkills &&
      String(certifications.extraSkills).trim() !== "",

    careerContext,
  };

  let polished = {
    summary: "",
    workExperience: baseData.workExperience,
    education: baseData.education,
    certificationsText: baseData.certifications.programCertsText,
    extraCerts: baseData.certifications.extraCerts,
    extraSkills: baseData.certifications.extraSkills,
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
        tasks: tasksToText(j.tasks),
      })),
      education: baseData.education,
      certifications: {
        programCerts: baseData.certifications.programCerts,
        programCertsText: baseData.certifications.programCertsText,
        extraCerts: baseData.certifications.extraCerts,
        extraSkills: baseData.certifications.extraSkills,
      },
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
   - The student's certifications (programCerts, extraCerts)
   DO NOT use work history or education to build the summary.
   The summary MUST be a 2–4 sentence professional paragraph that functions as an introduction/objective section.
   The summary MUST NOT use the student's name. Write in third-person without naming the student.

4. Return polished resume content as STRICT JSON with this exact structure:

{
  "summary": "string",
  "workExperience": [
    {
      "employer": "string",
      "employerCity": "string",
      "employerState": "string",
      "title": "string",
      "start": "string",
      "end": "string",
      "tasks": ["string","string","string"]
    }
  ],
  "education": [...],
  "certificationsText": "string",
  "extraCerts": "string",
  "extraSkills": "string"
}

Formatting rules for workExperience:
- Normalize employerCity to Proper Case.
- Normalize employerState to UPPERCASE 2-letter postal abbreviation.
- Never remove or omit employerCity or employerState.

Formatting rules for workExperience.tasks:
- Rewrite tasks into 3–5 strong resume bullet statements.
- Return tasks as a JSON ARRAY of strings.
- NO bullet symbols.

Return ONLY valid JSON.

STUDENT DATA:
${JSON.stringify(aiInput, null, 2)}
          `.trim(),
        },
      ],
    });

    polished = JSON.parse(completion.choices[0].message.content);
  } catch (err) {
    console.error("AI polishing failed:", err);
  }

  const finalData = {
    ...baseData,

    professionalSummary: clean(polished.summary || ""),

    workExperience: baseData.workExperience.map((base, idx) => {
      const aiJob = polished.workExperience?.[idx] || {};
      const aiTasks = tasksToArray(aiJob.tasks);

      return {
        employer: clean(aiJob.employer ?? base.employer),
        employerCity: clean(aiJob.employerCity ?? base.employerCity),
        employerState: clean(aiJob.employerState ?? base.employerState),
        title: clean(aiJob.title ?? base.title),
        start: clean(aiJob.start ?? base.start),
        end: clean(aiJob.end ?? base.end),
        tasks: aiTasks.length ? aiTasks : base.tasks,
      };
    }),

    education: polished.education.map((e, idx) => {
      const base = baseData.education[idx] || {};
      return {
        school: clean(e.school ?? base.school),
        program: clean(e.program ?? base.program),
        startDate: clean(e.startDate ?? base.startDate),
        endDate: clean(e.endDate ?? base.endDate),
        notes: clean(e.notes ?? base.notes),
      };
    }),

    certifications: {
      programCerts: baseData.certifications.programCerts,
      programCertsText: clean(polished.certificationsText),
      extraCerts: clean(polished.extraCerts),
      extraSkills: clean(polished.extraSkills),
    },

    hasProgramCerts: clean(polished.certificationsText) !== "",
    hasExtraCerts: clean(polished.extraCerts) !== "",
    hasExtraSkills: clean(polished.extraSkills) !== "",
  };

  finalData.professionalSummary = limit(finalData.professionalSummary, 600);

  finalData.workExperience = finalData.workExperience.map((j) => ({
    ...j,
    tasks: Array.isArray(j.tasks) ? j.tasks.map((t) => limit(t, 300)) : [],
  }));

  finalData.education = finalData.education.map((e) => ({
    ...e,
    notes: limit(e.notes, 400),
  }));

  finalData.certifications.extraSkills = limit(
    finalData.certifications.extraSkills,
    600
  );

  finalData.certifications.extraCerts = limit(
    finalData.certifications.extraCerts,
    600
  );

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
finalData.workExperience = [
  {
    employer: "Test Company",
    employerCity: "New Castle",
    employerState: "PA",
    title: "Test Technician",
    start: "01/2024",
    end: "Present",
    tasks: [
      "Installed and tested electrical systems",
      "Read blueprints and schematics",
      "Maintained tools and work area",
    ],
  },
];
finalData.hasWorkExperience = true;
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