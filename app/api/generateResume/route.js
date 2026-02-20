export const runtime = "nodejs";

import path from "path";
import fs from "fs";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req) {
  try {
    const body = await req.json();

    /* ---------- SAFE TEXT CLEANER ---------- */
    function clean(text) {
      if (!text) return "";
      return String(text)
        .replace(/[\u0000-\u001F\u007F]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }

    /* ---------- AI POLISHER ---------- */
    async function polish(text) {
      if (!text || typeof text !== "string") return "";

      try {
        const response = await client.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.4,
          messages: [
            {
              role: "system",
              content:
                "Rewrite the text to be professional, concise, and resume-ready. Do not add new information."
            },
            { role: "user", content: text }
          ]
        });

        return clean(response.choices?.[0]?.message?.content || "");
      } catch (err) {
        console.error("AI ERROR:", err);
        return "";
      }
    }

    /* ============================================================
       BUILD DATA OBJECT FOR DOCXTEMPLATER (STRUCTURED)
       ============================================================ */

    const student = body.student || {};
    const certifications = body.certifications || {};

    /* ---------- WORK EXPERIENCE ---------- */
    const workExperience = Array.isArray(body.workExperience)
      ? await Promise.all(
          body.workExperience.map(async (job) => ({
            employer: clean(job.employer),
            title: clean(job.title),
            start: clean(job.start),
            end: clean(job.end),
            tasks: await polish(job.tasks)
          }))
        )
      : [];

    /* ---------- MILITARY SERVICE ---------- */
    const militaryService = Array.isArray(body.militaryService)
      ? await Promise.all(
          body.militaryService.map(async (mil) => ({
            branch: clean(mil.branch),
            rank: clean(mil.rank),
            dates: clean(mil.dates),
            duties: await polish(mil.duties),
            achievements: await polish(mil.achievements)
          }))
        )
      : [];

    /* ---------- EDUCATION ---------- */
    const education = Array.isArray(body.education)
      ? await Promise.all(
          body.education.map(async (edu) => ({
            school: clean(edu.school),
            program: clean(edu.program),
            startDate: clean(edu.startDate),
            endDate: clean(edu.endDate),
            notes: await polish(edu.notes)
          }))
        )
      : [];

    /* ---------- CERTIFICATIONS + SKILLS ---------- */
    const programCerts = Array.isArray(certifications.programCertsSelected)
      ? certifications.programCertsSelected.map(clean)
      : [];

    const extraCerts = await polish(certifications.extraCerts || "");
    const extraSkills = await polish(certifications.extraSkills || "");

    /* ---------- FINAL DATA OBJECT ---------- */
    const data = {
      TEMPLATE: body.TEMPLATE,

      student: {
        name: clean(student.name),
        email: clean(student.email),
        phone: clean(student.phone),
        address: clean(student.address),
        city: clean(student.city),
        state: clean(student.state),
        zip: clean(student.zip),
        location: clean(`${student.city || ""}, ${student.state || ""}`),
        programCampus: clean(student.programCampus),
        graduationDate: clean(student.graduationDate)
      },

      workExperience,
      militaryService,
      education,

      certifications: {
        programCerts,
        extraCerts,
        extraSkills
      }
    };

    /* ============================================================
       TEMPLATE LOAD
       ============================================================ */

    const templateFile = `${body.TEMPLATE}.docx`;
    const templatePath = path.join(
      process.cwd(),
      "public",
      "templates",
      templateFile
    );

    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true
    });

    doc.setData(data);
    doc.render();

    const buffer = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE"
    });

    /* ---------- RETURN DOCX ---------- */
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": "attachment; filename=resume.docx",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "no-store"
      }
    });

  } catch (err) {
    console.error("RESUME GENERATION ERROR:", err);
    return new Response(
      JSON.stringify({ error: "Failed to generate resume" }),
      { status: 500 }
    );
  }
}