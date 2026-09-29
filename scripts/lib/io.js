import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const DATA_DIR = path.join(ROOT, 'public', 'data');
export const CACHE_DIR = path.join(ROOT, '.cache');

export async function readData(file) {
  return JSON.parse(await readFile(path.join(DATA_DIR, file), 'utf8'));
}

/** Writes a data file (object or ready-made JSON text) and returns its size in bytes. */
export async function writeData(file, content) {
  const text = typeof content === 'string' ? content : JSON.stringify(content);
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(path.join(DATA_DIR, file), text);
  return Buffer.byteLength(text);
}

export const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;
