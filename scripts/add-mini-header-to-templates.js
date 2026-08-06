/**
 * Strips Word headers and injects a fixed top-right textbox overlay into the document body.
 * The overlay floats above existing content and does not use the header tool.
 * Run: node scripts/add-mini-header-to-templates.js
 */
const fs = require("fs");
const path = require("path");
const PizZip = require("pizzip");

const TEMPLATES_DIR = path.join(__dirname, "..", "public", "templates");

const OVERLAY_XML = `<w:p>
  <w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr>
  <w:pict>
    <v:shape id="cornerMarkerOverlay" o:spid="_x0000_s1026" type="#_x0000_t202" style="width:2.75in;height:0.55in;position:absolute;mso-position-horizontal-relative:page;mso-position-horizontal:right;margin-right:0.2in;mso-position-vertical-relative:page;top:0.12in;mso-wrap-style:none">
      <v:textbox style="mso-fit-shape-to-text:t;" insetmode="auto">
        <w:txbxContent>
          <w:p>
            <w:pPr>
              <w:spacing w:before="0" w:after="0"/>
              <w:jc w:val="right"/>
            </w:pPr>
            <w:r><w:rPr><w:sz w:val="14"/><w:color w:val="666666"/></w:rPr><w:t>{name}</w:t></w:r>
            <w:r><w:br/></w:r>
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
</w:p>`;

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

function stripHeaderRefs(documentXml) {
  return documentXml
    .replace(/<w:headerReference[^>]*\/>/g, "")
    .replace(/<w:titlePg\/>/g, "");
}

function ensureVmlNamespaces(documentXml) {
  let xml = documentXml;
  if (!xml.includes('xmlns:v="')) {
    xml = xml.replace(
      "<w:document ",
      '<w:document xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" '
    );
  }
  return xml;
}

function removeExistingOverlay(documentXml) {
  return documentXml.replace(
    /<w:p>\s*<w:pPr><w:spacing w:before="0" w:after="0"\/><\/w:pPr>\s*<w:pict>[\s\S]*?id="cornerMarkerOverlay"[\s\S]*?<\/w:pict>\s*<\/w:p>/,
    ""
  );
}

function injectBodyOverlay(documentXml) {
  let xml = ensureVmlNamespaces(removeExistingOverlay(stripHeaderRefs(documentXml)));
  if (xml.includes('id="cornerMarkerOverlay"')) return xml;
  return xml.replace(/(<w:body>)/, `$1${OVERLAY_XML}`);
}

function patchTemplate(filePath) {
  const zip = new PizZip(fs.readFileSync(filePath));

  stripHeaders(zip);

  const docPath = "word/document.xml";
  const docXml = zip.file(docPath).asText();
  zip.file(docPath, injectBodyOverlay(docXml));

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
