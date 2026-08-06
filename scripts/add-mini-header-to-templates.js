/**
 * Adds a mini header (name + page number) to all Template*.docx files.
 * Run: node scripts/add-mini-header-to-templates.js
 */
const fs = require("fs");
const path = require("path");
const PizZip = require("pizzip");

const TEMPLATES_DIR = path.join(__dirname, "..", "public", "templates");

const HEADER_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="w14 w15 w16se w16cid w16 w16cex w16sdtdh w16sdtfl w16du wp14">
  <w:p>
    <w:pPr>
      <w:pStyle w:val="Header"/>
      <w:tabStops><w:tab w:val="right" w:pos="10560"/></w:tabStops>
      <w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="CCCCCC"/></w:pBdr>
    </w:pPr>
    <w:r><w:rPr><w:b/><w:sz w:val="16"/><w:color w:val="333333"/></w:rPr><w:t>{name}</w:t></w:r>
    <w:r><w:tab/></w:r>
    <w:r><w:fldChar w:fldCharType="begin"/></w:r>
    <w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>
    <w:r><w:fldChar w:fldCharType="separate"/></w:r>
    <w:r><w:rPr><w:sz w:val="16"/><w:color w:val="666666"/></w:rPr><w:t>1</w:t></w:r>
    <w:r><w:fldChar w:fldCharType="end"/></w:r>
  </w:p>
</w:hdr>`;

function ensureContentType(contentTypesXml) {
  if (contentTypesXml.includes("/word/header")) return contentTypesXml;
  return contentTypesXml.replace(
    "</Types>",
  `<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
</Types>`
  );
}

function addHeaderRelationship(relsXml) {
  if (relsXml.includes("Target=\"header1.xml\"")) return relsXml;
  const ids = [...relsXml.matchAll(/Id="rId(\d+)"/g)].map((m) => parseInt(m[1], 10));
  const nextId = Math.max(...ids, 0) + 1;
  const rel = `<Relationship Id="rId${nextId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>`;
  return relsXml.replace("</Relationships>", `${rel}</Relationships>`);
}

function getHeaderRelId(relsXml) {
  const m = relsXml.match(
    /<Relationship Id="(rId\d+)"[^>]*Target="header1\.xml"/
  );
  return m ? m[1] : null;
}

function ensureSectPrHeader(documentXml, relId) {
  const sectMatch = documentXml.match(/<w:sectPr[\s\S]*?<\/w:sectPr>/);
  if (!sectMatch) return documentXml;

  let sectPr = sectMatch[0];
  if (sectPr.includes(`r:id="${relId}"`)) return documentXml;

  const headerRef = `<w:headerReference w:type="default" r:id="${relId}"/>`;
  if (sectPr.includes("<w:pgSz")) {
    sectPr = sectPr.replace("<w:pgSz", `${headerRef}<w:pgSz`);
  } else {
    sectPr = sectPr.replace("</w:sectPr>", `${headerRef}</w:sectPr>`);
  }

  if (!sectPr.includes("<w:pgNumType")) {
    sectPr = sectPr.replace("</w:sectPr>", `<w:pgNumType w:start="1"/></w:sectPr>`);
  }

  return documentXml.replace(sectMatch[0], sectPr);
}

function patchTemplate(filePath) {
  const content = fs.readFileSync(filePath);
  const zip = new PizZip(content);

  const headerFiles = Object.keys(zip.files).filter(
    (f) => f.match(/^word\/header\d+\.xml$/)
  );

  if (headerFiles.length > 0) {
    headerFiles.forEach((f) => zip.file(f, HEADER_XML));
  } else {
    zip.file("word/header1.xml", HEADER_XML);

    const ctPath = "[Content_Types].xml";
    const ct = zip.file(ctPath).asText();
    zip.file(ctPath, ensureContentType(ct));

    const relsPath = "word/_rels/document.xml.rels";
    const rels = zip.file(relsPath).asText();
    const updatedRels = addHeaderRelationship(rels);
    zip.file(relsPath, updatedRels);

    const relId = getHeaderRelId(updatedRels);
    const docPath = "word/document.xml";
    const docXml = zip.file(docPath).asText();
    zip.file(docPath, ensureSectPrHeader(docXml, relId));
  }

  fs.writeFileSync(
    filePath,
    zip.generate({ type: "nodebuffer", compression: "DEFLATE" })
  );
  console.log(`Patched ${path.basename(filePath)}`);
}

const templates = fs
  .readdirSync(TEMPLATES_DIR)
  .filter((f) => /^Template[A-P]\.docx$/i.test(f))
  .sort();

templates.forEach((name) => patchTemplate(path.join(TEMPLATES_DIR, name)));
