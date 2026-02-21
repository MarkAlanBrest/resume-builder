import fs from "fs";
import path from "path";

export async function POST(req) {
  const templatePath = path.join(
    process.cwd(),
    "public",
    "templates",
    "Template.docx"
  );

  const buffer = fs.readFileSync(templatePath);

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": "attachment; filename=Template-Test.docx",
      "Content-Length": buffer.length.toString()
    }
  });
}