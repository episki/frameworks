import path from "node:path";
import { readdir } from "node:fs/promises";

export const FRAMEWORKS_DIR = path.join(process.cwd(), "frameworks");

export async function listFrameworkFiles(): Promise<string[]> {
  const entries = await readdir(FRAMEWORKS_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(FRAMEWORKS_DIR, entry.name))
    .sort();
}
