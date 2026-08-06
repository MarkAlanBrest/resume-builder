const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");
const { Document, Packer, Paragraph, TextRun } = require("docx");

function accentLuminance(accentHex) {
  const clean = String(accentHex || "").replace("#", "");
  if (clean.length < 6) return 1;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function buildOverlayFooterXml(name, nameColor, pageColor) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <w:p><w:pict>
      <v:shape id="cornerMarkerOverlay" type="#_x0000_t202" filled="f" stroked="f" style="width:2.75in;height:0.55in;position:absolute;mso-position-horizontal-relative:page;mso-position-horizontal:right;margin-right:0.65in;mso-position-vertical-relative:page;top:0.12in;mso-wrap-style:none">
        <v:textbox><w:txbxContent><w:p><w:pPr><w:jc w:val="right"/></w:pPr>
              <w:r><w:rPr><w:b/><w:color w:val="${nameColor}"/></w:rPr><w:t>${name}</w:t></w:r>
              <w:r><w:br/></w:r>
              <w:r><w:rPr><w:b/><w:color w:val="${pageColor}"/></w:rPr><w:t>Page </w:t></w:r>
              <w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r>
            </w:p></w:txbxContent></v:textbox>
      </v:shape></w:pict></w:p></w:ftr>`;
}

const EMPTY_FIRST_FOOTER_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>';

function nextOverlayRelId(relsXml) {
  const ids = [...relsXml.matchAll(/Id="rId(\d+)"/g)].map((m) => parseInt(m[1], 10));
  return `rId${Math.max(...ids, 0) + 1}`;
}

async function patchCornerOverlayBlob(buffer, overlay) {
  const zip = await JSZip.loadAsync(buffer);
  Object.keys(zip.files).filter((p) => /^word\/(header|footer)\d+\.xml$/.test(p)).forEach((p) => zip.remove(p));
  const relsPath = "word/_rels/document.xml.rels";
  let rels = await zip.file(relsPath).async("string");
  rels = rels.replace(/<Relationship[^>]*Type="[^"]*\/(header|footer)"[^>]*\/>/g, "");
  const defaultRelId = nextOverlayRelId(rels);
  rels = rels.replace("</Relationships>", `<Relationship Id="${defaultRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>`);
  const firstRelId = nextOverlayRelId(rels);
  rels = rels.replace("</Relationships>", `<Relationship Id="${firstRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer2.xml"/></Relationships>`);
  zip.file(relsPath, rels);
  zip.file("word/footer1.xml", buildOverlayFooterXml(overlay.name, overlay.nameColor, overlay.pageColor));
  zip.file("word/footer2.xml", EMPTY_FIRST_FOOTER_XML);
  let ct = await zip.file("[Content_Types].xml").async("string");
  ct = ct.replace(/<Override[^>]*PartName="\/word\/(header|footer)\d+\.xml"[^>]*\/>/g, "");
  if (!ct.includes("/word/footer1.xml")) ct = ct.replace("</Types>", '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>');
  if (!ct.includes("/word/footer2.xml")) ct = ct.replace("</Types>", '<Override PartName="/word/footer2.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>');
  zip.file("[Content_Types].xml", ct);
  let docXml = await zip.file("word/document.xml").async("string");
  docXml = docXml.replace(/<w:sectPr[\s\S]*?<\/w:sectPr>/, (sect) => {
    let s = sect.replace(/<w:(header|footer)Reference[^>]*\/>/g, "");
    if (!s.includes("<w:titlePg")) s = s.replace("<w:pgSz", "<w:titlePg/><w:pgSz");
    const refs = `<w:footerReference w:type="first" r:id="${firstRelId}"/><w:footerReference w:type="default" r:id="${defaultRelId}"/>`;
    s = s.includes("<w:pgSz") ? s.replace("<w:pgSz", `${refs}<w:pgSz`) : s.replace("</w:sectPr>", `${refs}</w:sectPr>`);
    if (!s.includes("<w:pgNumType")) s = s.replace("</w:sectPr>", '<w:pgNumType w:start="1"/></w:sectPr>');
    return s;
  });
  zip.file("word/document.xml", docXml);
  return zip.generateAsync({ type: "nodebuffer" });
}

async function main() {
  const children = Array.from({ length: 80 }, (_, i) => new Paragraph({ children: [new TextRun(`Line ${i + 1}`)] }));
  const doc = new Document({ sections: [{ children }] });
  const raw = await Packer.toBuffer(doc);
  const overlay = { name: "Jane Doe", nameColor: "FFFFFF", pageColor: "E0E0E0" };
  const patched = await patchCornerOverlayBlob(raw, overlay);
  fs.writeFileSync(path.join(__dirname, "test-overlay.docx"), patched);
  const zip = await JSZip.loadAsync(patched);
  console.log(await zip.file("word/document.xml").async("string").then((x) => x.match(/<w:sectPr[\s\S]*?<\/w:sectPr>/)?.[0]));
  console.log("footer1 colors:", (await zip.file("word/footer1.xml").async("string")).includes('w:val="FFFFFF"'));
  console.log("margin:", (await zip.file("word/footer1.xml").async("string")).includes("margin-right:0.65in"));
}

main().catch(console.error);
