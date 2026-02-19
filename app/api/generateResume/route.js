import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

export async function POST(req) {
  try {
    const body = await req.json();

    const safe = (v) => {
      if (v === undefined || v === null) return "";
      if (String(v).trim().toLowerCase() === "undefined") return "";
      return String(v);
    };

    const templateMap = {
      Template: "Template.docx",
      TemplateA: "TemplateA.docx",
      TemplateB: "TemplateB.docx",
      TemplateC: "TemplateC.docx"
    };

    const templateFile = templateMap[body.TEMPLATE] || "Template.docx";

    const templatePath = path.join(
      process.cwd(),
      "public",
      "templates",
      templateFile
    );

    if (!fs.existsSync(templatePath)) {
      console.error("Template missing:", templatePath);
      return new Response("Template not found", { status: 500 });
    }

    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true
    });

    doc.setData({
      NAME: safe(body.NAME),
      EMAIL: safe(body.EMAIL),
      PHONE: safe(body.PHONE),
      ADDRESS: safe(body.ADDRESS),
      LOCATION: safe(body.LOCATION),

      PROFESSIONAL_SUMMARY: safe(body.PROFESSIONAL_SUMMARY),
      SKILLS: safe(body.SKILLS),
      EXPERIENCE: safe(body.EXPERIENCE),
      EDUCATION: safe(body.EDUCATION),
      PROGRAM_CERTIFICATIONS: safe(body.PROGRAM_CERTIFICATIONS),
      OUTSIDE_CERTIFICATIONS: safe(body.OUTSIDE_CERTIFICATIONS),
      GENERAL_NOTES: safe(body.GENERAL_NOTES)
    });

    doc.render();

    const buffer = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE"
    });

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": "attachment; filename=resume.docx"
      }
    });

  } catch (err) {
    console.error("RESUME GENERATION ERROR:", err);
    return new Response("Resume generation failed", { status: 500 });
  }
}
