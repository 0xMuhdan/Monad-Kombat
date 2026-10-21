import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseFighter, chooseTeam, createRoom, joinRoom, matchRoster, roomFor, setReady, startRoom } from './rooms.js';

const canonicalIds = ['vex', 'rift', 'nova', 'nox', 'sable', 'forge', 'jinx', 'aero', 'orbit', 'ember', 'kite', 'moss'];
const uniqueRoom = (mode: '1v1' | '2v2' | '3v3' = '1v1') => createRoom(`host-${Math.random()}`, 'Host', mode);

// **Validates: Requirements 3.1, 3.2**
test('rejects duplicate fighter selections without changing either player state', () => {
  const room = uniqueRoom('1v1');
  const joined = joinRoom(room.code, 'guest-duplicate', 'Guest');
  chooseTeam(room.code, 'guest-duplicate', 'B');
  chooseFighter(room.code, room.players[0].playerId, 'aero');
  assert.throws(() => chooseFighter(room.code, 'guest-duplicate', 'aero'), /already selected/);
  const after = roomFor(room.code);
  assert.equal(after.players.find(player => player.playerId === room.players[0].playerId)?.fighterId, 'aero');
  assert.equal(after.players.find(player => player.playerId === 'guest-duplicate')?.fighterId, null);
});

// **Validates: Requirements 3.1, 3.2**
test('rejects fighter selection before team assignment', () => {
  const room = uniqueRoom();
  joinRoom(room.code, 'guest-no-team', 'Guest');
  assert.throws(() => chooseFighter(room.code, 'guest-no-team', 'rift'), /Choose a team first/);
  assert.equal(roomFor(room.code).players.find(player => player.playerId === 'guest-no-team')?.fighterId, null);
});

// **Validates: Requirements 3.3**
test('keeps cross-player fighter availability independent from current selection', () => {
  const room = uniqueRoom('2v2');
  joinRoom(room.code, 'guest-cross', 'Guest');
  chooseTeam(room.code, room.players[0].playerId, 'A');
  chooseTeam(room.code, 'guest-cross', 'B');
  chooseFighter(room.code, room.players[0].playerId, 'nova');
  assert.throws(() => chooseFighter(room.code, 'guest-cross', 'nova'), /already selected/);
  chooseFighter(room.code, 'guest-cross', 'moss');
  assert.deepEqual(roomFor(room.code).players.map(player => player.fighterId), ['nova', 'moss']);
});

// **Validates: Requirements 3.4, 3.5**
test('preserves every canonical ID in the room and match roster', () => {
  for (const fighterId of canonicalIds) {
    const room = uniqueRoom();
    chooseFighter(room.code, room.players[0].playerId, fighterId);
    assert.equal(roomFor(room.code).players[0].fighterId, fighterId);
  }
});

// **Validates: Requirements 3.5**
test('preserves canonical and legacy registry display and asset mappings', async () => {
  const fs = await import('node:fs/promises');
  const source = await fs.readFile(new URL('../../fighter-registry.js', import.meta.url), 'utf8');
  for (const fighterId of canonicalIds) {
    assert.match(source, new RegExp(`${fighterId}:`), `missing registry entry for ${fighterId}`);
  }
  assert.ok(source.includes("portrait: 'assets/"));
  assert.ok(source.includes("atlas: 'assets/"));
  assert.match(source, /arco: \{ name: 'VEX'/);
  assert.match(source, /fenr: \{ name: 'RIFT'/);
});

// **Validates: Requirements 3.6**
test('keeps offline lab independent of multiplayer room synchronization', async () => {
  const fs = await import('node:fs/promises');
  const source = await fs.readFile(new URL('../../offline-lab.html', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /apiCall|connectLobby|LobbyRoom|fighterId.*room/i);
  assert.match(source, /character-select|offline|training/i);
});
