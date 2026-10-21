import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const file = process.env.MONAD_KOMBAT_DATA_FILE ?? process.env.BLITZBOUND_DATA_FILE ?? 'data/monad-kombat.json';
let writeQueue = Promise.resolve();

export async function loadData<T>(fallback: T): Promise<T> {
  try { return JSON.parse(await readFile(file, 'utf8')) as T; } catch { return fallback; }
}

export function saveData<T>(value: T) {
  writeQueue = writeQueue.then(async () => { await mkdir(dirname(file), { recursive: true }); await writeFile(file, JSON.stringify(value, null, 2), 'utf8'); });
  return writeQueue;
}
