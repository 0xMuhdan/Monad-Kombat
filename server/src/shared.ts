export type StoredProfile = { playerId: string; username: string; walletAddress: string; pinHash: string; wins: number; losses: number; eliminations: number; createdAt: string; lastLoginAt: string };
export type StoredHistory = { code: string; result: 'win' | 'loss' | 'draw'; eliminations: number; fighterId?: string; savedAt: string };
export type StoredResult = { code: string; winner: 'A' | 'B' | null; players: { playerId: string; team: 'A' | 'B'; fighterId?: string; connected: boolean; hp: number; eliminations?: number; walletAddress?: string }[]; savedAt: string; txHash?: string | null };
export type PersistedData = { profiles: StoredProfile[]; history: Record<string, StoredHistory[]>; results?: StoredResult[] };
