/**
 * A real Word header on page 2+, with an empty first-page header.
 * Run: node scripts/add-mini-header-to-templates.js
 */
const fs = require("fs");
const path = require("path");
const PizZip = require("pizzip");

const TEMPLATES_DIR = path.join(__dirname, "..", "public", "templates");

const HEADER_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr><w:spacing w:before="0" w:after="0"/><w:jc w:val="right"/></w:pPr>
    <w:r><w:rPr><w:b/><w:sz w:val="16"/><w:color w:val="333333"/></w:rPr><w:t>{name}</w:t></w:r>
    <w:r><w:rPr><w:sz w:val="16"/><w:color w:val="666666"/></w:rPr><w:t xml:space="preserve">  |  Page </w:t></w:r>
    <w:r><w:fldChar w:fldCharType="begin"/></w:r>
    <w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>
    <w:r><w:fldChar w:fldCharType="separate"/></w:r>
    <w:r><w:rPr><w:sz w:val="16"/><w:color w:val="666666"/></w:rPr><w:t>2</w:t></w:r>
    <w:r><w:fldChar w:fldCharType="end"/></w:r>
  </w:p>
</w:hdr>`;

const FIRST_HEADER_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>`;

function stripHeaders(zip) {
  Object.keys(zip.files)
    .filter((f) => /^word\/header\d+\.xml$/.test(f))
    .forEach((f) => zip.remove(f));

  const relsPath = "word/_rels/document.xml.rels";
  if (zip.file(relsPath)) {
    let rels = zip.file(relsPath).asText();
    rels = rels.replace(/<Relationship[^>]*Type="[^"]*header"[^>]*\/>/g, "");
    zip.file(relsPath, rels);
  }

  const ctPath = "[Content_Types].xml";
  if (zip.file(ctPath)) {
    let ct = zip.file(ctPath).asText();
    ct = ct.replace(/<Override[^>]*PartName="\/word\/header\d+\.xml"[^>]*\/>/g, "");
    zip.file(ctPath, ct);
  }
}

function ensureHeaderContentType(contentTypesXml, partName) {
  if (contentTypesXml.includes(partName)) return contentTypesXml;
  return contentTypesXml.replace(
    "</Types>",
    `<Override PartName="${partName}" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
</Types>`
  );
}

function nextRelId(relsXml) {
  const ids = [...relsXml.matchAll(/Id="rId(\d+)"/g)].map((m) => parseInt(m[1], 10));
  return `rId${Math.max(...ids, 0) + 1}`;
}

function ensureHeaderRelationship(relsXml, target, relId) {
  if (relsXml.includes(`Target="${target}"`)) return relsXml;
  const rel = `<Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="${target}"/>`;
  return relsXml.replace("</Relationships>", `${rel}</Relationships>`);
}

function getHeaderRelId(relsXml, target) {
  const m = relsXml.match(
    new RegExp(`<Relationship Id="(rId\\d+)"[^>]*Target="${target.replace(".", "\\.")}"`)
  );
  return m ? m[1] : null;
}

function zeroMarginFlags(sectPr) {
  if (sectPr.includes("<w:pgMar")) {
    return sectPr.replace(/<w:pgMar\b[^>]*\/>/g, (m) => {
      let out = m.replace(/\bw:header="[^"]*"/, 'w:header="180"');
      if (!/\bw:header=/.test(out)) out = out.replace("<w:pgMar", '<w:pgMar w:header="180"');
      out = out.replace(/\bw:footer="[^"]*"/, 'w:footer="0"');
      if (!/\bw:footer=/.test(out)) out = out.replace("<w:pgMar", '<w:pgMar w:footer="0"');
      return out;
    });
  }
  const mar = `<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="180" w:footer="0" w:gutter="0"/>`;
  if (sectPr.includes("<w:pgSz")) return sectPr.replace("<w:pgSz", `${mar}<w:pgSz`);
  return sectPr.replace("</w:sectPr>", `${mar}</w:sectPr>`);
}

function ensureSectPrHeaders(documentXml, defaultRelId, firstRelId) {
  const sectMatch = documentXml.match(/<w:sectPr[\s\S]*?<\/w:sectPr>/);
  if (!sectMatch) return documentXml;

  let sectPr = sectMatch[0];
  sectPr = sectPr.replace(/<w:(header|footer)Reference[^>]*\/>/g, "");

  if (!sectPr.includes("<w:titlePg")) {
    if (sectPr.includes("<w:pgSz")) {
      sectPr = sectPr.replace("<w:pgSz", "<w:titlePg/><w:pgSz");
    } else {
      sectPr = sectPr.replace("</w:sectPr>", "<w:titlePg/></w:sectPr>");
    }
  }

  const headerRefs = `<w:headerReference w:type="first" r:id="${firstRelId}"/><w:headerReference w:type="default" r:id="${defaultRelId}"/>`;
  if (sectPr.includes("<w:pgSz")) {
    sectPr = sectPr.replace("<w:pgSz", `${headerRefs}<w:pgSz`);
  } else {
    sectPr = sectPr.replace("</w:sectPr>", `${headerRefs}</w:sectPr>`);
  }

  if (!sectPr.includes("<w:pgNumType")) {
    sectPr = sectPr.replace("</w:sectPr>", `<w:pgNumType w:start="1"/></w:sectPr>`);
  }

  sectPr = zeroMarginFlags(sectPr);
  return documentXml.replace(sectMatch[0], sectPr);
}

function patchTemplate(filePath) {
  const zip = new PizZip(fs.readFileSync(filePath));
  stripHeaders(zip);

  Object.keys(zip.files).filter((f) => /^word\/footer\d+\.xml$/.test(f)).forEach((f) => zip.remove(f));
  zip.file("word/header1.xml", HEADER_XML);
  zip.file("word/header2.xml", FIRST_HEADER_XML);

  const ctPath = "[Content_Types].xml";
  let ct = zip.file(ctPath).asText();
  ct = ct.replace(/<Override[^>]*PartName="\/word\/footer\d+\.xml"[^>]*\/>/g, "");
  ct = ensureHeaderContentType(ct, "/word/header1.xml");
  ct = ensureHeaderContentType(ct, "/word/header2.xml");
  zip.file(ctPath, ct);

  const relsPath = "word/_rels/document.xml.rels";
  let rels = zip.file(relsPath).asText();

  rels = rels.replace(/<Relationship[^>]*Type="[^"]*footer"[^>]*\/>/g, "");
  let defaultRelId = getHeaderRelId(rels, "header1.xml");
  if (!defaultRelId) {
    defaultRelId = nextRelId(rels);
    rels = ensureHeaderRelationship(rels, "header1.xml", defaultRelId);
  }

  let firstRelId = getHeaderRelId(rels, "header2.xml");
  if (!firstRelId) {
    firstRelId = nextRelId(rels);
    rels = ensureHeaderRelationship(rels, "header2.xml", firstRelId);
  }
  zip.file(relsPath, rels);

  defaultRelId = getHeaderRelId(rels, "header1.xml") || defaultRelId;
  firstRelId = getHeaderRelId(rels, "header2.xml") || firstRelId;

  const docPath = "word/document.xml";
  const docXml = zip.file(docPath).asText();
  zip.file(docPath, ensureSectPrHeaders(docXml, defaultRelId, firstRelId));

  fs.writeFileSync(
    filePath,
    zip.generate({ type: "nodebuffer", compression: "DEFLATE" })
  );
  console.log(`Patched ${path.basename(filePath)}`);
}

if (!fs.existsSync(TEMPLATES_DIR)) {
  console.log(`Templates directory not found: ${TEMPLATES_DIR}`);
  process.exit(0);
}

const templates = fs
  .readdirSync(TEMPLATES_DIR)
  .filter((f) => /^Template[A-P]\.docx$/i.test(f))
  .sort();

if (templates.length === 0) {
  console.log("No Template*.docx files found to patch.");
  process.exit(0);
}

templates.forEach((name) => patchTemplate(path.join(TEMPLATES_DIR, name)));
