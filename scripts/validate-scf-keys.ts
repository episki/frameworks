import { readFile } from "node:fs/promises";
import path from "node:path";

import { listFrameworkFiles } from "./lib/frameworks";

const SCF_FILE = path.join(process.cwd(), "scf", "scf-latest.json");

/**
 * SCF framework column headings are spreadsheet cells with embedded newlines
 * (e.g. "CIS\r\nCSC\r\n8.1"). Slugify them the same way `scf_keys` are written.
 *
 * "+" is spelled out rather than stripped: "GovRAMP Low" and "GovRAMP Low+" are
 * different baselines and must not collapse onto the same key.
 */
function slugify(heading: string): string {
  return heading
    .replace(/\r?\n/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\+/g, " plus ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type ScfColumns = {
  /** slug -> the raw headings that produced it (more than one means a collision) */
  bySlug: Map<string, string[]>;
};

async function loadScfColumns(): Promise<ScfColumns | null> {
  let raw: string;
  try {
    raw = await readFile(SCF_FILE, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }

  const scf = JSON.parse(raw);
  const bySlug = new Map<string, string[]>();
  for (const domain of scf.domains ?? []) {
    for (const control of domain.controls ?? []) {
      for (const mapping of control.frameworkMappings ?? []) {
        const heading: string = mapping.framework ?? "";
        if (!heading) continue;
        const slug = slugify(heading);
        const headings = bySlug.get(slug) ?? [];
        if (!headings.includes(heading)) headings.push(heading);
        bySlug.set(slug, headings);
      }
    }
  }
  return { bySlug };
}

const columns = await loadScfColumns();
if (!columns) {
  console.error(`scf-keys: ${path.relative(process.cwd(), SCF_FILE)} not found`);
  process.exit(1);
}

const files = await listFrameworkFiles();
const claims = new Map<string, string[]>(); // scf_key -> framework keys claiming it
const unresolved: { framework: string; key: string }[] = [];
let resolved = 0;
let withoutKeys = 0;

for (const file of files) {
  const framework = JSON.parse(await readFile(file, "utf8"));
  const keys: string[] = framework.scf_keys ?? [];
  if (keys.length === 0) {
    withoutKeys++;
    continue;
  }
  for (const key of keys) {
    claims.set(key, [...(claims.get(key) ?? []), framework.key]);
    if (columns.bySlug.has(key)) resolved++;
    else unresolved.push({ framework: framework.key, key });
  }
}

const errors: string[] = [];

// Two frameworks aliasing the same SCF column would each absorb the other's
// crosswalk rows.
for (const [key, owners] of claims) {
  if (owners.length > 1) errors.push(`scf_key "${key}" is claimed by ${owners.join(", ")}`);
}

// Distinct SCF headings that slugify identically cannot be told apart by
// scf_keys (e.g. "GovRAMP Low" and "GovRAMP Low+").
for (const [slug, headings] of columns.bySlug) {
  if (headings.length > 1) {
    errors.push(
      `SCF headings ${headings.map((h) => JSON.stringify(h)).join(" and ")} both slugify to "${slug}"`,
    );
  }
}

const claimed = new Set([...claims.keys()].filter((key) => columns.bySlug.has(key)));
const unclaimed = [...columns.bySlug.keys()].filter((slug) => !claimed.has(slug)).sort();

console.log(
  `scf-keys: ${columns.bySlug.size} SCF crosswalk column(s) in ${path.basename(SCF_FILE)}; ` +
    `${resolved} declared key(s) resolved, ${unresolved.length} unresolved, ` +
    `${withoutKeys} framework(s) declare none`,
);

if (unresolved.length > 0) {
  console.log(
    "scf-keys: unresolved (no such column in the local SCF export — crosswalks cannot be derived):",
  );
  for (const { framework, key } of unresolved) console.log(`  ${framework} -> ${key}`);
}

if (unclaimed.length > 0) {
  console.log("scf-keys: SCF columns no framework claims:");
  for (const slug of unclaimed) console.log(`  ${slug}`);
}

if (errors.length > 0) {
  for (const error of errors) console.error(`scf-keys: ${error}`);
  process.exit(1);
}
