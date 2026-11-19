/**
 * Give every untitled control a label derived from its own text
 * (scripts/lib/deriveLabel.ts). Labels the source already has are never
 * touched. Dry run by default: prints what it would set. `--write` saves.
 *
 *   bun scripts/derive-labels.ts [--write] [file-name-fragment]
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { listFrameworkFiles } from "./lib/frameworks";
import { deriveLabel } from "./lib/deriveLabel";

interface Node {
  ref: string;
  label?: string;
  description?: string;
  controls?: Node[];
  [key: string]: unknown;
}

const write = process.argv.includes("--write");
const filter = process.argv.slice(2).find((a) => !a.startsWith("--"));

/** Put `label` straight after `ref`, where every labelled node keeps it. */
function withLabel(node: Node, label: string): Node {
  const out: Node = { ref: node.ref, label };
  for (const [key, value] of Object.entries(node)) {
    if (key !== "ref" && key !== "label") out[key] = value;
  }
  return out;
}

function label(nodes: Node[], parentLabel: string | null, changes: string[]): Node[] {
  return nodes.map((node) => {
    let current = node;
    if (!node.label) {
      const derived = deriveLabel({
        description: node.description,
        hasChildren: (node.controls?.length ?? 0) > 0,
        parentLabel,
      });
      if (derived) {
        current = withLabel(node, derived);
        changes.push(`${node.ref}\t${derived}`);
      }
    }
    if (current.controls?.length) {
      current = { ...current, controls: label(current.controls, current.label ?? parentLabel, changes) };
    }
    return current;
  });
}

for (const file of await listFrameworkFiles()) {
  if (filter && !file.includes(filter)) continue;
  const doc = JSON.parse(await readFile(file, "utf8")) as { controls: Node[] };
  const changes: string[] = [];
  const controls = label(doc.controls, null, changes);
  if (changes.length === 0) continue;
  console.log(`\n${path.basename(file)}: ${changes.length} labels`);
  for (const line of changes) console.log(`  ${line}`);
  if (write) await writeFile(file, `${JSON.stringify({ ...doc, controls }, null, 2)}\n`);
}
if (!write) console.log("\nDry run. Pass --write to save.");
