import path from "node:path";
import { readdir } from "node:fs/promises";

export const FRAMEWORKS_DIR = path.join(process.cwd(), "frameworks");
export const PROFILES_DIR = path.join(process.cwd(), "profiles");
export const MAPPINGS_DIR = path.join(process.cwd(), "mappings");

async function listJsonFiles(dir: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    // Tolerate a missing artifact directory (e.g. no profiles/mappings yet).
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(dir, entry.name))
    .sort();
}

export function listFrameworkFiles(): Promise<string[]> {
  return listJsonFiles(FRAMEWORKS_DIR);
}

export function listProfileFiles(): Promise<string[]> {
  return listJsonFiles(PROFILES_DIR);
}

export function listMappingFiles(): Promise<string[]> {
  return listJsonFiles(MAPPINGS_DIR);
}
