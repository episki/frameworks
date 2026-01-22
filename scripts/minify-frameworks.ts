import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parse, printParseErrorCode, type ParseError } from "jsonc-parser";
import { listFrameworkFiles } from "./lib/frameworks";

function parseJson(source: string): { value: unknown; errors: ParseError[] } {
  const errors: ParseError[] = [];
  const normalized = source.replace(/^\uFEFF/, "");
  const value = parse(normalized, errors, {
    allowTrailingComma: true,
    allowEmptyContent: false,
  });
  return { value, errors };
}

async function main() {
  const files = await listFrameworkFiles();
  let hasErrors = false;

  const outputDir = path.join(process.cwd(), "frameworks", "min");
  await mkdir(outputDir, { recursive: true });

  for (const filePath of files) {
    const source = await readFile(filePath, "utf8");
    const { value, errors } = parseJson(source);

    if (errors.length > 0 || value === undefined) {
      hasErrors = true;
      for (const error of errors) {
        console.error(
          `${path.relative(process.cwd(), filePath)}: ${printParseErrorCode(error.error)} at offset ${error.offset}`,
        );
      }
      continue;
    }

    const minified = JSON.stringify(value) + "\n";
    const outputPath = path.join(outputDir, path.basename(filePath));
    await writeFile(outputPath, minified, "utf8");
    console.log(
      `minified ${path.relative(process.cwd(), filePath)} -> ${path.relative(process.cwd(), outputPath)}`,
    );
  }

  if (hasErrors) {
    process.exitCode = 1;
  }
}

await main();
