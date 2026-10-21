import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { loadData, saveData } from './storage.js';
import type { PersistedData, StoredHistory, StoredProfile } from './shared.js';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

export type Profile = {
  playerId: string;
  username: string;
  walletAddress: string;
  pinHash: string;
  wins: number;
  losses: number;
  eliminations: number;
  createdAt: string;
  lastLoginAt: string;
};

const profiles = new Map<string, Profile>();
const sessions = new Map<string, string>();
const usernameIndex = new Map<string, string>();
const history = new Map<string, Array<{ code: string; result: 'win' | 'loss' | 'draw'; eliminations: number; fighterId?: string; savedAt: string }>>();

export async function loadProfiles() {
  const data = await loadData<PersistedData>({ profiles: [], history: {} });
  for (const profile of data.profiles) { profiles.set(profile.playerId, profile); usernameIndex.set(profile.username.toLowerCase(), profile.playerId); }
  for (const [playerId, entries] of Object.entries(data.history)) history.set(playerId, entries);
}

async function persist() {
  const data: PersistedData = { profiles: [...profiles.values()] as StoredProfile[], history: Object.fromEntries(history) as Record<string, StoredHistory[]> };
  await saveData(data);
}

function normalizeName(name: string): string {
  const clean = name.trim().replace(/[^a-zA-Z0-9 _-]/g, '').replace(/\s+/g, ' ');
  if (clean.length < 2 || clean.length > 20) throw new Error('Name must be 2-20 characters');
  return clean;
}

async function hashPin(pin: string): Promise<string> {
  if (!/^\d{4,8}$/.test(pin)) throw new Error('PIN must contain 4-8 digits');
  const salt = randomBytes(16);
  const derived = await scrypt(pin, salt, 64) as Buffer;
  return `${salt.toString('hex')}:${derived.toString('hex')}`;
}

async function verifyPin(pin: string, encoded: string): Promise<boolean> {
  const [saltHex, keyHex] = encoded.split(':');
  if (!saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, 'hex');
  const actual = await scrypt(pin, Buffer.from(saltHex, 'hex'), expected.length) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function publicProfile(profile: Profile) {
  const { pinHash: _pinHash, ...safe } = profile;
  return safe;
}

export async function createProfile(name: string, pin: string, walletAddress = ''): Promise<ReturnType<typeof publicProfile>> {
  const base = normalizeName(name);
  let username = '';
  do username = `${base}#${randomBytes(2).readUInt16BE(0) % 10000}`.padEnd(base.length + 5, '0');
  while (usernameIndex.has(username));
  const now = new Date().toISOString();
  const profile: Profile = { playerId: randomUUID(), username, walletAddress, pinHash: await hashPin(pin), wins: 0, losses: 0, eliminations: 0, createdAt: now, lastLoginAt: now };
  profiles.set(profile.playerId, profile);
  usernameIndex.set(profile.username.toLowerCase(), profile.playerId);
  await persist();
  return publicProfile(profile);
}

export async function authenticate(username: string, pin: string): Promise<
  | { success: true; token: string; profile: ReturnType<typeof publicProfile> }
  | { success: false; reason: 'user_not_found' | 'invalid_pin' }
> {
  const query = username.trim().toLowerCase();
  let profile: Profile | undefined;

  // 1. Check exact match by full username (e.g. "dunz#2944")
  if (usernameIndex.has(query)) {
    profile = profiles.get(usernameIndex.get(query)!);
  }

  // 2. If not found by exact tag, check by base name (e.g. "dunz")
  const base = normalizeName(username).toLowerCase();
  const candidateMatches: Profile[] = [];
  if (!profile) {
    for (const p of profiles.values()) {
      const pBase = p.username.split('#')[0].toLowerCase();
      if (pBase === base || p.username.toLowerCase() === query) {
        candidateMatches.push(p);
      }
    }

    // Check if any candidate has matching PIN
    for (const p of candidateMatches) {
      if (await verifyPin(pin, p.pinHash)) {
        profile = p;
        break;
      }
    }
  }

  if (profile) {
    if (await verifyPin(pin, profile.pinHash)) {
      profile.lastLoginAt = new Date().toISOString();
      await persist();
      const token = randomBytes(32).toString('base64url');
      sessions.set(token, profile.playerId);
      return { success: true, token, profile: publicProfile(profile) };
    } else {
      return { success: false, reason: 'invalid_pin' };
    }
  }

  if (candidateMatches.length > 0) {
    return { success: false, reason: 'invalid_pin' };
  }

  return { success: false, reason: 'user_not_found' };
}

export async function login(username: string, pin: string): Promise<{ token: string; profile: ReturnType<typeof publicProfile> } | null> {
  const auth = await authenticate(username, pin);
  return auth.success ? { token: auth.token, profile: auth.profile } : null;
}

export async function loginWithWallet(walletAddress: string): Promise<{ token: string; profile: ReturnType<typeof publicProfile> }> {
  const normalized = walletAddress.toLowerCase();
  let found: Profile | undefined;
  for (const p of profiles.values()) {
    if (p.walletAddress && p.walletAddress.toLowerCase() === normalized) {
      found = p;
      break;
    }
  }

  if (!found) {
    const baseName = `Pilot_${walletAddress.slice(2, 6)}`;
    const created = await createProfile(baseName, '0000', walletAddress);
    found = profiles.get(created.playerId)!;
  }

  found.lastLoginAt = new Date().toISOString();
  await persist();
  const token = randomBytes(32).toString('base64url');
  sessions.set(token, found.playerId);
  return { token, profile: publicProfile(found) };
}

export function sessionProfile(token: string | undefined) {
  const playerId = token ? sessions.get(token) : undefined;
  const profile = playerId ? profiles.get(playerId) : undefined;
  return profile ? publicProfile(profile) : null;
}

export function profileById(playerId: string) {
  const profile = profiles.get(playerId);
  return profile ? publicProfile(profile) : null;
}

export function logout(token: string | undefined) { if (token) sessions.delete(token); }

export function setWalletAddress(playerId: string, walletAddress: string) {
  const profile = profiles.get(playerId);
  if (!profile) throw new Error('Profile not found');
  profile.walletAddress = walletAddress;
  return publicProfile(profile);
}

export async function recordMatchResult(code: string, winner: 'A' | 'B' | null, players: Array<{ playerId: string; team: 'A' | 'B'; fighterId?: string; connected: boolean; hp: number; eliminations?: number }>, savedAt: string) {
  for (const player of players) {
    const profile = profiles.get(player.playerId); if (!profile) continue;
    const wins = winner !== null && player.team === winner; const draw = winner === null; profile.wins += wins ? 1 : 0; profile.losses += !wins && !draw ? 1 : 0; profile.eliminations += player.eliminations ?? 0;
    const list = history.get(player.playerId) ?? []; list.unshift({ code, result: draw ? 'draw' : wins ? 'win' : 'loss', eliminations: player.eliminations ?? 0, fighterId: player.fighterId, savedAt }); history.set(player.playerId, list.slice(0, 50));
  }
  await persist();
}

export function dashboardProfile(playerId: string) {
  const profile = profiles.get(playerId);
  if (!profile) return null;
  return { profile: publicProfile(profile), history: history.get(playerId) ?? [], leaderboard: [...profiles.values()].map(publicProfile).sort((a, b) => b.wins - a.wins || b.eliminations - a.eliminations).slice(0, 20) };
}

export function recordEliminations(playerId: string, count: number) {
  const profile = profiles.get(playerId);
  if (!profile || count <= 0) return;
  profile.eliminations += count;
}
