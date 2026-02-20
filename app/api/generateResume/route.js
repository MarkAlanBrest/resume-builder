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
        .replace(/[\u0000-\u001F\u007F]/g, " ") // control chars only
        .replace(/\s+/g, " ")
        .trim();
    }

    /* ---------- AI POLISHER ---------- */
    async function polish(text) {
      if (!text || text.trim() === "") return "";

      try {
        const response = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "Rewrite the text to be professional, concise, and resume-ready."
            },
            { role: "user", content: text }
          ],
          temperature: 0.4
        });

        const output = response.choices?.[0]?.message?.content || "";
        return clean(output);
      } catch (err) {
        console.error("AI ERROR:", err);
        return "";
      }
    }

    /* ---------- DATA ---------- */
    const data = {
      NAME: clean(body.NAME),
      EMAIL: clean(body.EMAIL),
      PHONE: clean(body.PHONE),
      ADDRESS: clean(body.ADDRESS),
      LOCATION: clean(body.LOCATION),
      PROFESSIONAL_SUMMARY: await polish(body.PROFESSIONAL_SUMMARY),
      SKILLS: await polish(body.SKILLS),
      EXPERIENCE: await polish(body.EXPERIENCE),
      EDUCATION: await polish(body.EDUCATION),
      PROGRAM_CERTIFICATIONS: await polish(body.PROGRAM_CERTIFICATIONS),
      OUTSIDE_CERTIFICATIONS: await polish(body.OUTSIDE_CERTIFICATIONS),
      GENERAL_NOTES: await polish(body.GENERAL_NOTES)
    };

    /* ---------- TEMPLATE ---------- */
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

    /* ---------- RETURN DOCX (CRITICAL FIX) ---------- */
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