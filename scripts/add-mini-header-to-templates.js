/**
 * Page 2+ corner overlay via floating textbox in default footer (not header).
 * Empty first-page footer keeps page 1 clean. No visible footer bar at bottom.
 * Run: node scripts/add-mini-header-to-templates.js
 */
const fs = require("fs");
const path = require("path");
const PizZip = require("pizzip");

const TEMPLATES_DIR = path.join(__dirname, "..", "public", "templates");

const FOOTER_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="w14 w15 w16se w16cid w16 w16cex w16sdtdh w16sdtfl w16du wp14">
  <w:p>
    <w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr>
    <w:pict>
      <v:shape id="cornerMarkerOverlay" o:spid="_x0000_s1026" type="#_x0000_t202" filled="f" stroked="f" style="width:2.75in;height:0.55in;position:absolute;mso-position-horizontal-relative:page;mso-position-horizontal:right;margin-right:0.65in;mso-position-vertical-relative:page;top:0.12in;mso-wrap-style:none">
        <v:textbox style="mso-fit-shape-to-text:t;" insetmode="auto">
          <w:txbxContent>
            <w:p>
              <w:pPr>
                <w:spacing w:before="0" w:after="0"/>
                <w:jc w:val="right"/>
              </w:pPr>
              <w:r><w:rPr><w:sz w:val="14"/><w:color w:val="666666"/></w:rPr><w:t>{name}</w:t></w:r>
              <w:r><w:br/></w:r>
              <w:r><w:rPr><w:sz w:val="14"/><w:color w:val="999999"/></w:rPr><w:t>Page </w:t></w:r>
              <w:r><w:fldChar w:fldCharType="begin"/></w:r>
              <w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>
              <w:r><w:fldChar w:fldCharType="separate"/></w:r>
              <w:r><w:rPr><w:sz w:val="14"/><w:color w:val="999999"/></w:rPr><w:t>1</w:t></w:r>
              <w:r><w:fldChar w:fldCharType="end"/></w:r>
            </w:p>
          </w:txbxContent>
        </v:textbox>
      </v:shape>
    </w:pict>
  </w:p>
</w:ftr>`;

const FIRST_FOOTER_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>`;

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

function ensureFooterContentType(contentTypesXml, partName) {
  if (contentTypesXml.includes(partName)) return contentTypesXml;
  return contentTypesXml.replace(
    "</Types>",
    `<Override PartName="${partName}" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
</Types>`
  );
}

function nextRelId(relsXml) {
  const ids = [...relsXml.matchAll(/Id="rId(\d+)"/g)].map((m) => parseInt(m[1], 10));
  return `rId${Math.max(...ids, 0) + 1}`;
}

function ensureFooterRelationship(relsXml, target, relId) {
  if (relsXml.includes(`Target="${target}"`)) return relsXml;
  const rel = `<Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="${target}"/>`;
  return relsXml.replace("</Relationships>", `${rel}</Relationships>`);
}

function getFooterRelId(relsXml, target) {
  const m = relsXml.match(
    new RegExp(`<Relationship Id="(rId\\d+)"[^>]*Target="${target.replace(".", "\\.")}"`)
  );
  return m ? m[1] : null;
}

function zeroMarginFlags(sectPr) {
  if (sectPr.includes("<w:pgMar")) {
    return sectPr.replace(/<w:pgMar\b[^>]*\/>/g, (m) => {
      let out = m.replace(/\bw:header="[^"]*"/, 'w:header="0"');
      if (!/\bw:header=/.test(out)) out = out.replace("<w:pgMar", '<w:pgMar w:header="0"');
      out = out.replace(/\bw:footer="[^"]*"/, 'w:footer="0"');
      if (!/\bw:footer=/.test(out)) out = out.replace("<w:pgMar", '<w:pgMar w:footer="0"');
      return out;
    });
  }
  const mar = `<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="0" w:footer="0" w:gutter="0"/>`;
  if (sectPr.includes("<w:pgSz")) return sectPr.replace("<w:pgSz", `${mar}<w:pgSz`);
  return sectPr.replace("</w:sectPr>", `${mar}</w:sectPr>`);
}

function ensureSectPrFooters(documentXml, defaultRelId, firstRelId) {
  const sectMatch = documentXml.match(/<w:sectPr[\s\S]*?<\/w:sectPr>/);
  if (!sectMatch) return documentXml;

  let sectPr = sectMatch[0];
  sectPr = sectPr.replace(/<w:headerReference[^>]*\/>/g, "");

  if (!sectPr.includes("<w:titlePg")) {
    if (sectPr.includes("<w:pgSz")) {
      sectPr = sectPr.replace("<w:pgSz", "<w:titlePg/><w:pgSz");
    } else {
      sectPr = sectPr.replace("</w:sectPr>", "<w:titlePg/></w:sectPr>");
    }
  }

  sectPr = sectPr.replace(/<w:footerReference[^>]*\/>/g, "");
  const footerRefs = `<w:footerReference w:type="first" r:id="${firstRelId}"/><w:footerReference w:type="default" r:id="${defaultRelId}"/>`;
  if (sectPr.includes("<w:pgSz")) {
    sectPr = sectPr.replace("<w:pgSz", `${footerRefs}<w:pgSz`);
  } else {
    sectPr = sectPr.replace("</w:sectPr>", `${footerRefs}</w:sectPr>`);
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

  zip.file("word/footer1.xml", FOOTER_XML);
  zip.file("word/footer2.xml", FIRST_FOOTER_XML);

  const ctPath = "[Content_Types].xml";
  let ct = zip.file(ctPath).asText();
  ct = ensureFooterContentType(ct, "/word/footer1.xml");
  ct = ensureFooterContentType(ct, "/word/footer2.xml");
  zip.file(ctPath, ct);

  const relsPath = "word/_rels/document.xml.rels";
  let rels = zip.file(relsPath).asText();

  let defaultRelId = getFooterRelId(rels, "footer1.xml");
  if (!defaultRelId) {
    defaultRelId = nextRelId(rels);
    rels = ensureFooterRelationship(rels, "footer1.xml", defaultRelId);
  }

  let firstRelId = getFooterRelId(rels, "footer2.xml");
  if (!firstRelId) {
    firstRelId = nextRelId(rels);
    rels = ensureFooterRelationship(rels, "footer2.xml", firstRelId);
  }
  zip.file(relsPath, rels);

  defaultRelId = getFooterRelId(rels, "footer1.xml") || defaultRelId;
  firstRelId = getFooterRelId(rels, "footer2.xml") || firstRelId;

  const docPath = "word/document.xml";
  const docXml = zip.file(docPath).asText();
  zip.file(docPath, ensureSectPrFooters(docXml, defaultRelId, firstRelId));

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
