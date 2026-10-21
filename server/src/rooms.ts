import { randomBytes } from 'node:crypto';

export type Mode = '1v1' | '2v2' | '3v3';
export type Team = 'A' | 'B';
export type RoomPlayer = { playerId: string; username: string; team: Team | null; fighterId: string | null; ready: boolean; host: boolean };
export type Room = { code: string; hostPlayerId: string; mode: Mode; status: 'waiting' | 'playing' | 'finished'; players: RoomPlayer[]; createdAt: string };

const rooms = new Map<string, Room>();
const ROOM_TTL_MS = 30 * 60 * 1000;
const FINISHED_TTL_MS = 5 * 60 * 1000;
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const capacities: Record<Mode, number> = { '1v1': 1, '2v2': 2, '3v3': 3 };
const publicRoom = (room: Room) => ({ ...room, players: room.players.map(({ playerId, username, team, fighterId, ready, host }) => ({ playerId, username, team, fighterId, ready, host })), ...(room.status === 'playing' ? { matchRoster: room.players.map(({ playerId, username, team, fighterId }) => ({ playerId, username, team, fighterId })) } : {}) });

function code() { let value = ''; for (let i = 0; i < 6; i++) value += alphabet[randomBytes(1)[0] % alphabet.length]; return value; }
function getRoom(value: string) { const room = rooms.get(value.toUpperCase()); if (!room) throw new Error('Room not found'); return room; }
function requirePlayer(room: Room, playerId: string) { const player = room.players.find(item => item.playerId === playerId); if (!player) throw new Error('Player is not in this room'); return player; }

export function createRoom(playerId: string, username: string, mode: Mode = '1v1') {
  if (!Object.hasOwn(capacities, mode)) throw new Error('Invalid room mode');
  let roomCode = code(); while (rooms.has(roomCode)) roomCode = code();
  const room: Room = { code: roomCode, hostPlayerId: playerId, mode, status: 'waiting', players: [{ playerId, username, team: 'A', fighterId: null, ready: false, host: true }], createdAt: new Date().toISOString() };
  rooms.set(roomCode, room); return publicRoom(room);
}

export function joinRoom(value: string, playerId: string, username: string) {
  const room = getRoom(value); if (room.status !== 'waiting') throw new Error('Room is no longer open');
  if (room.players.some(player => player.playerId === playerId)) return publicRoom(room);
  if (room.players.length >= capacities[room.mode] * 2) throw new Error('Room is full');
  room.players.push({ playerId, username, team: null, fighterId: null, ready: false, host: false }); return publicRoom(room);
}

export function roomFor(value: string) { return publicRoom(getRoom(value)); }
export function setMode(value: string, playerId: string, mode: Mode) {
  const room = getRoom(value); if (room.hostPlayerId !== playerId) throw new Error('Only the host can change mode');
  if (room.status !== 'waiting' || !Object.hasOwn(capacities, mode)) throw new Error('Room mode cannot be changed');
  if (room.players.length > capacities[mode] * 2) throw new Error('Mode capacity is too small');
  room.mode = mode; room.players.forEach(player => { player.ready = false; }); return publicRoom(room);
}

export function chooseTeam(value: string, playerId: string, team: Team) {
  const room = getRoom(value); if (room.status !== 'waiting') throw new Error('Team selection is closed');
  const player = requirePlayer(room, playerId);
  if (player.team === team) return publicRoom(room);
  if (room.players.filter(item => item.team === team).length >= capacities[room.mode]) throw new Error('Team is full');
  player.team = team; player.fighterId = null; player.ready = false; return publicRoom(room);
}

const canonicalFighters = new Set(['vex','rift','nova','nox','sable','forge','jinx','aero','orbit','ember','kite','moss']);
export function chooseFighter(value: string, playerId: string, fighterId: string) {
  const room = getRoom(value); if (room.status !== 'waiting') throw new Error('Fighter selection is closed');
  if (!canonicalFighters.has(fighterId)) throw new Error('Unknown Blitzbound fighter');
  const player = requirePlayer(room, playerId); if (!player.team) throw new Error('Choose a team first');
  if (room.players.some(item => item.playerId !== playerId && item.fighterId === fighterId)) throw new Error('Fighter is already selected');
  player.fighterId = fighterId; player.ready = false; return publicRoom(room);
}

export function setReady(value: string, playerId: string, ready: boolean) {
  const room = getRoom(value); const player = requirePlayer(room, playerId); if (room.status !== 'waiting') throw new Error('Ready check is closed');
  player.ready = ready; return publicRoom(room);
}

export function startRoom(value: string, playerId: string) {
  const room = getRoom(value); if (room.hostPlayerId !== playerId) throw new Error('Only the host can start the room');
  const capacity = capacities[room.mode]; const teamA = room.players.filter(item => item.team === 'A'); const teamB = room.players.filter(item => item.team === 'B');
  if (teamA.length !== capacity || teamB.length !== capacity) throw new Error('Every team slot must be filled');
  if (room.players.some(item => !item.fighterId || !item.ready) || new Set(room.players.map(item => item.fighterId)).size !== room.players.length) throw new Error('Every player must choose a unique fighter and be ready');
  room.status = 'playing'; return publicRoom(room);
}

export function matchRoster(value: string) {
  const room = getRoom(value);
  if (room.status !== 'playing') throw new Error('Room has not started');
  return room.players.map(player => ({ playerId: player.playerId, username: player.username, team: player.team as Team, fighterId: player.fighterId as string }));
}

export function cleanupRooms(now = Date.now()) {
  for (const [roomCode, room] of rooms) {
    const age = now - Date.parse(room.createdAt);
    const ttl = room.status === 'finished' ? FINISHED_TTL_MS : ROOM_TTL_MS;
    if (age > ttl) rooms.delete(roomCode);
  }
}

export function roomExists(value: string) {
  return rooms.has(value.toUpperCase());
}

const matchRosters = new Map<string, Array<{ playerId: string; username: string; team: Team; fighterId: string }>>();
export function setMatchRoster(value: string, roster: Array<{ playerId: string; username: string; team: Team; fighterId: string }>) { matchRosters.set(value.toUpperCase(), roster); }
export function matchRosterSnapshot(value: string) { return matchRosters.get(value.toUpperCase()) ?? null; }
