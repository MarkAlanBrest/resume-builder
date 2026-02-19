import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const body = req.body || {};

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

    const templateFile =
      templateMap[body.TEMPLATE] || "Template.docx";

    const templatePath = path.join(
      process.cwd(),
      "templates",
      templateFile
    );

    if (!fs.existsSync(templatePath)) {
      console.error("Template missing:", templatePath);
      return res.status(500).send("Template not found");
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

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=resume.docx"
    );

    return res.status(200).send(buffer);

  } catch (err) {
    console.error("RESUME GENERATION ERROR:", err);
    return res.status(500).send("Resume generation failed");
  }
}
