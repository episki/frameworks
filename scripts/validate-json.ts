import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parse, printParseErrorCode, type ParseError } from "jsonc-parser";
import { listFrameworkFiles } from "./lib/frameworks";

type ValidationResult = {
  filePath: string;
  strictError?: Error;
  jsoncErrors: ParseError[];
  value?: unknown;
};

function parseJsonWithErrors(source: string): { value: unknown; errors: ParseError[] } {
  const errors: ParseError[] = [];
  const normalized = source.replace(/^\uFEFF/, "");
  const value = parse(normalized, errors, {
    allowTrailingComma: true,
    allowEmptyContent: false,
  });
  return { value, errors };
}

function formatError(filePath: string, error: ParseError): string {
  const displayPath = path.relative(process.cwd(), filePath);
  return `${displayPath}: ${printParseErrorCode(error.error)} at offset ${error.offset}`;
}

async function validateFile(filePath: string): Promise<ValidationResult> {
  const source = await readFile(filePath, "utf8");

  try {
    JSON.parse(source);
    return { filePath, jsoncErrors: [] };
  } catch (error) {
    const { value, errors } = parseJsonWithErrors(source);
    return {
      filePath,
      strictError: error as Error,
      jsoncErrors: errors,
      value,
    };
  }
}

async function fixFile(result: ValidationResult): Promise<boolean> {
  if (!result.strictError) {
    return true;
  }
  if (result.value === undefined) {
    return false;
  }
  const normalized = JSON.stringify(result.value, null, 2) + "\n";
  await writeFile(result.filePath, normalized, "utf8");
  return true;
}

async function main() {
  const fix = process.argv.includes("--fix");
  const files = await listFrameworkFiles();
  const results = await Promise.all(files.map((file) => validateFile(file)));

  let hasErrors = false;

  for (const result of results) {
    if (!result.strictError) {
      continue;
    }

    if (fix) {
      const fixed = await fixFile(result);
      if (fixed) {
        console.log(`fixed ${path.relative(process.cwd(), result.filePath)}`);
        continue;
      }
    }

    hasErrors = true;
    const displayPath = path.relative(process.cwd(), result.filePath);
    console.error(`${displayPath}: ${result.strictError.message}`);

    if (result.jsoncErrors.length > 0 && result.value === undefined) {
      for (const error of result.jsoncErrors) {
        console.error(formatError(result.filePath, error));
      }
    }
  }

  if (hasErrors) {
    process.exitCode = 1;
  }
}

await main();
