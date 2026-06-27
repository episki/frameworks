import { readFile } from "node:fs/promises";
import path from "node:path";
import Ajv from "ajv/dist/2020";
import {
  listFrameworkFiles,
  listProfileFiles,
  listMappingFiles,
} from "./lib/frameworks";

async function loadSchema(schemaPath: string): Promise<unknown> {
  const source = await readFile(schemaPath, "utf8");
  if (source.trim().length === 0) {
    throw new Error("schema file is empty");
  }
  return JSON.parse(source);
}

const ajv = new Ajv({ allErrors: true, strict: false });

// Validate every file in `files` against the schema at `schemaFile`.
// Returns true if any error was encountered.
async function validateArtifacts(
  label: string,
  schemaFile: string,
  files: string[],
): Promise<boolean> {
  const schemaPath = path.join(process.cwd(), schemaFile);
  const schemaDisplayPath = path.relative(process.cwd(), schemaPath);

  let schema: unknown;
  try {
    schema = await loadSchema(schemaPath);
  } catch (error) {
    console.error(`${schemaDisplayPath}: ${(error as Error).message}`);
    return true;
  }

  const validate = ajv.compile(schema);
  let hasErrors = false;

  for (const filePath of files) {
    let data: unknown;
    try {
      const source = await readFile(filePath, "utf8");
      data = JSON.parse(source);
    } catch (error) {
      hasErrors = true;
      console.error(`${path.relative(process.cwd(), filePath)}: ${(error as Error).message}`);
      continue;
    }

    const valid = validate(data);
    if (!valid) {
      hasErrors = true;
      console.error(`${path.relative(process.cwd(), filePath)}: schema validation failed`);
      if (validate.errors) {
        for (const issue of validate.errors) {
          const at = issue.instancePath || "/";
          console.error(`  ${at} ${issue.message}`);
        }
      }
    }
  }

  console.log(`${label}: validated ${files.length} file(s) against ${schemaDisplayPath}`);
  return hasErrors;
}

async function main() {
  const results = await Promise.all([
    validateArtifacts("frameworks", "framework.schema.json", await listFrameworkFiles()),
    validateArtifacts("profiles", "profile.schema.json", await listProfileFiles()),
    validateArtifacts("mappings", "mapping.schema.json", await listMappingFiles()),
  ]);

  if (results.some(Boolean)) {
    process.exitCode = 1;
  }
}

await main();
