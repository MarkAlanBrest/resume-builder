import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

export async function POST(req) {
  const body = await req.json();

  console.log("STUDENT RECEIVED:", body.student);

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
    linebreaks: true
  });

  doc.setData(body.student || {});
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
}