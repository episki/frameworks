import { readFile } from "node:fs/promises";
import path from "node:path";
import Ajv from "ajv/dist/2020";
import { listFrameworkFiles } from "./lib/frameworks";

async function loadSchema(schemaPath: string): Promise<unknown> {
  const source = await readFile(schemaPath, "utf8");
  if (source.trim().length === 0) {
    throw new Error("schema file is empty");
  }
  return JSON.parse(source);
}

async function main() {
  const schemaPath = path.join(process.cwd(), "framework.schema.json");
  const schemaDisplayPath = path.relative(process.cwd(), schemaPath);
  const files = await listFrameworkFiles();
  let schema: unknown;

  try {
    schema = await loadSchema(schemaPath);
  } catch (error) {
    console.error(`${schemaDisplayPath}: ${(error as Error).message}`);
    process.exitCode = 1;
    return;
  }

  const ajv = new Ajv({ allErrors: true, strict: false });
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

  if (hasErrors) {
    process.exitCode = 1;
  }
}

await main();
