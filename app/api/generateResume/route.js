import { NextResponse } from "next/server";
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

    // AI helper
    async function polish(text) {
      if (!text || text.trim() === "") return "";
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Rewrite the text to be professional, concise, resume-ready, and error-free."
          },
          { role: "user", content: text }
        ]
      });
      return response.choices[0].message.content.trim();
    }

    // AI‑enhanced fields
    const polished = {
      NAME: body.NAME,
      EMAIL: body.EMAIL,
      PHONE: body.PHONE,
      ADDRESS: body.ADDRESS,
      LOCATION: body.LOCATION,
      PROFESSIONAL_SUMMARY: await polish(body.PROFESSIONAL_SUMMARY),
      SKILLS: await polish(body.SKILLS),
      EXPERIENCE: await polish(body.EXPERIENCE),
      EDUCATION: await polish(body.EDUCATION),
      PROGRAM_CERTIFICATIONS: await polish(body.PROGRAM_CERTIFICATIONS),
      OUTSIDE_CERTIFICATIONS: await polish(body.OUTSIDE_CERTIFICATIONS),
      GENERAL_NOTES: await polish(body.GENERAL_NOTES)
    };

    // Template selection
    const templateFile = body.TEMPLATE + ".docx";
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

    doc.setData(polished);
    doc.render();

    const buffer = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE"
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": "attachment; filename=resume.docx"
      }
    });
  } catch (err) {
    console.error("RESUME GENERATION ERROR:", err);
    return NextResponse.json({ error: "Failed to generate resume" }, { status: 500 });
  }
}
