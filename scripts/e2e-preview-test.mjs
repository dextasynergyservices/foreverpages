import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

const base = path.resolve(new URL(import.meta.url).pathname, "../.template-test");
const sampleDir = path.join(base, "sample");
const assetsDir = path.join(sampleDir, "assets");
const zipPath = path.join(base, "sample.zip");
const extractDir = path.join(base, "extracted");
const rewrittenDir = path.join(base, "rewritten");

function ensure(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function run() {
  ensure(base);
  // clean
  [sampleDir, extractDir, rewrittenDir].forEach((d) => {
    if (fs.existsSync(d)) fs.rmSync(d, { recursive: true, force: true });
  });

  ensure(assetsDir);

  // create index.html referencing an asset with a relative path
  const indexHtml = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Sample Template</title>
  <link rel="stylesheet" href="./assets/styles.css">
</head>
<body>
  <h1>Hello Template</h1>
  <img src="./assets/photo.jpg" alt="photo">
  <script src="./assets/app.js"></script>
</body>
</html>`;

  fs.writeFileSync(path.join(sampleDir, "index.html"), indexHtml, "utf8");
  fs.writeFileSync(path.join(assetsDir, "styles.css"), "body{background:#fafafa}", "utf8");
  fs.writeFileSync(path.join(assetsDir, "photo.jpg"), "FAKE_IMAGE_BYTES", "utf8");
  fs.writeFileSync(path.join(assetsDir, "app.js"), 'console.log("hello");', "utf8");

  // zip the sampleDir
  const zip = new AdmZip();
  zip.addLocalFolder(sampleDir, "");
  zip.writeZip(zipPath);
  console.log("Created zip:", zipPath);

  // simulate artifactAssets map returned from build callback (Cloudinary URLs)
  const assetsMap = {
    "assets/styles.css": "https://res.cloudinary.com/demo/styles.css",
    "assets/photo.jpg": "https://res.cloudinary.com/demo/photo.jpg",
    "assets/app.js": "https://res.cloudinary.com/demo/app.js",
  };

  // extract zip
  const z2 = new AdmZip(zipPath);
  ensure(extractDir);
  z2.extractAllTo(extractDir, true);
  console.log("Extracted to:", extractDir);

  // find index.html
  const indexPath = path.join(extractDir, "index.html");
  if (!fs.existsSync(indexPath)) {
    console.error("index.html not found in extracted zip");
    process.exit(2);
  }

  let html = fs.readFileSync(indexPath, "utf8");

  // rewrite relative asset refs to absolute using assetsMap
  // naive replacement: replace "./assets/<file>" and "assets/<file>"
  for (const [rel, url] of Object.entries(assetsMap)) {
    const rel1 = "./" + rel;
    const rel2 = rel;
    const re1 = new RegExp(rel1.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&"), "g");
    const re2 = new RegExp(rel2.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&"), "g");
    html = html.replace(re1, url).replace(re2, url);
  }

  ensure(rewrittenDir);
  const outPath = path.join(rewrittenDir, "index.html");
  fs.writeFileSync(outPath, html, "utf8");
  console.log("Wrote rewritten HTML to:", outPath);

  console.log("--- Rewritten HTML preview ---");
  const lines = html.split("\n").slice(0, 40).join("\n");
  console.log(lines);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
