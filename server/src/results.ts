import { loadData, saveData } from './storage.js';
import type { PersistedData, StoredResult } from './shared.js';

type Result = StoredResult;
const results = new Map<string, Result>();

export async function loadResults() {
  const data = await loadData<PersistedData>({ profiles: [], history: {}, results: [] });
  for (const result of data.results ?? []) results.set(result.code, result);
}

async function persistResults() {
  const data = await loadData<PersistedData>({ profiles: [], history: {}, results: [] });
  await saveData({ ...data, results: [...results.values()] });
}

export function saveResult(result: Result) {
  const existing = results.get(result.code);
  if (existing) return existing;
  results.set(result.code, result);
  void persistResults();
  return result;
}

export function updateResultTxHash(code: string, txHash: string) {
  const existing = results.get(code);
  if (existing) {
    existing.txHash = txHash;
    void persistResults();
  }
}

export function resultFor(code: string) { return results.get(code) ?? null; }
export function leaderboard() { return []; }
