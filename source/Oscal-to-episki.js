const fs = require("fs");
const path = require("path");

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function saveJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function convertOscalControl(oscalCtrl) {
  const ref = oscalCtrl.id || oscalCtrl["control-id"] || "unknown";

  const title =
    oscalCtrl.title ||
    (oscalCtrl["control-title"] ? oscalCtrl["control-title"] : "");

  const description =
    oscalCtrl.description && oscalCtrl.description[0]
      ? oscalCtrl.description[0].text
      : "";

  const subcontrols = (oscalCtrl.controls || []).map(c =>
    convertOscalControl(c)
  );

  return {
    ref: ref,
    control: title,
    description: description,
    testingProcedures: [],
    controls: subcontrols
  };
}

function convertOscalCatalog(oscal) {
  if (!oscal.catalog) {
    throw new Error("File does not contain .catalog (not a valid OSCAL file)");
  }

  const catalog = oscal.catalog;

  if (!catalog.groups && !catalog.controls) {
    throw new Error("OSCAL catalog has no groups or controls");
  }

  let controls = [];

  if (catalog.groups) {
    for (const group of catalog.groups) {
      if (group.controls) {
        controls = controls.concat(group.controls);
      }
    }
  }

  if (catalog.controls) {
    controls = controls.concat(catalog.controls);
  }

  return {controls: controls.map(convertOscalControl)};
}

async function main() {
  const inputPath = process.argv[2];

  if (!inputPath) {
    console.error("Usage: node OSCAL-to-Episki.js <oscal-file.json>");
    process.exit(1);
  }

  const fullPath = path.resolve(inputPath);

  console.log("Loading:", fullPath);

  let json;

  try {
    json = loadJson(fullPath);
  } catch (err) {
    console.error("❌ Failed to read JSON:", err.message);
    process.exit(1);
  }

  console.log("Converting OSCAL → Episki…");

  let result;

  try {
    result = convertOscalCatalog(json);
  } catch (err) {
    console.error("❌ Conversion error:", err.message);
    process.exit(1);
  }

 const inputName = path.basename(fullPath, ".json");  
const outPath = path.join(
  path.dirname(fullPath),
  `${inputName}_episki.json`
);


  saveJson(outPath, result);

  console.log("✅ Done! Saved to:", outPath);
}

main();
