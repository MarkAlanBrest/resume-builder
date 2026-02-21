import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import expressions from "docxtemplater/expressions";   // ⭐ REQUIRED FOR DOT-NOTATION

function clean(v) {
  if (v === undefined || v === null) return "";
  return String(v)
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(req) {
  const body = await req.json();

  const s = body.student || {};
  const workExperience = Array.isArray(body.workExperience)
    ? body.workExperience
    : [];
  const education = Array.isArray(body.education) ? body.education : [];
  const certifications = body.certifications || {};

  // ⭐ MERGED DATA OBJECT (what the template sees)
  const data = {
    // flat fields
    name: clean(s.name),
    email: clean(s.email),
    phone: clean(s.phone),
    address: clean(s.address),
    city: clean(s.city),
    state: clean(s.state),
    zip: clean(s.zip),
    programCampus: clean(s.programCampus),
    graduationDate: clean(s.graduationDate),

    // arrays for loops
    workExperience: workExperience.map((j) => ({
      employer: clean(j.employer),
      title: clean(j.title),
      start: clean(j.start),
      end: clean(j.end),
      tasks: clean(j.tasks),
    })),

    education: education.map((e) => ({
      school: clean(e.school),
      program: clean(e.program),
      startDate: clean(e.startDate),
      endDate: clean(e.endDate),
      notes: clean(e.notes),
    })),

    certifications: {
      programCerts: Array.isArray(certifications.programCerts)
        ? certifications.programCerts.map(clean)
        : [],
      extraCerts: clean(certifications.extraCerts),
      extraSkills: clean(certifications.extraSkills),
    },

    // booleans
    hasWorkExperience: workExperience.length > 0,
    hasEducation: education.length > 0,
    hasProgramCerts:
      Array.isArray(certifications.programCerts) &&
      certifications.programCerts.length > 0,
    hasExtraCerts:
      !!certifications.extraCerts &&
      String(certifications.extraCerts).trim() !== "",
    hasExtraSkills:
      !!certifications.extraSkills &&
      String(certifications.extraSkills).trim() !== "",
  };

  // ⭐ LOAD TEMPLATE
  const templatePath = path.join(
    process.cwd(),
    "public",
    "templates",
    `${body.TEMPLATE}.docx`
  );

  const content = fs.readFileSync(templatePath, "binary");
  const zip = new PizZip(content);

  // ⭐ THE CRITICAL FIX — OFFICIAL DOT-NOTATION PARSER
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{", end: "}" }, // single braces like your template
    parser: expressions.parser, // ⭐ enables nested paths + sections + {.}
  });

  doc.setData(data);
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
