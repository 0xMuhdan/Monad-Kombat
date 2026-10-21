import test from 'node:test';
import assert from 'node:assert/strict';
import { createMatch, matchFor, advance, input, jump, attack, special, disconnect, connect } from './match.js';

test('creates a match with valid canonical fighters and positions teams correctly', () => {
  const code = 'MATCH1';
  const players = [
    { playerId: 'p1', username: 'Player1', team: 'A' as const, fighterId: 'vex' },
    { playerId: 'p2', username: 'Player2', team: 'B' as const, fighterId: 'rift' }
  ];
  const state = createMatch(code, players as any);
  assert.equal(state.phase, 'playing');
  assert.equal(state.players.length, 2);
  assert.equal(state.players[0].hp, 100);
  assert.equal(state.players[1].hp, 100);
  assert.equal(state.players[0].x, 300); // Team A start: 300 + 0*90
  assert.equal(state.players[1].x, 1600 - 300 - 1 * 90); // Team B start: 1600 - 300 - 1*90 = 1210
});

test('rejects match creation with invalid fighter IDs', () => {
  const code = 'BADM1';
  const players = [
    { playerId: 'p1', username: 'Player1', team: 'A' as const, fighterId: 'nonexistent' }
  ];
  assert.throws(() => createMatch(code, players as any), /Invalid Blitzbound fighter roster/);
});

test('handles player input, movement bounds, and jumping', () => {
  const code = 'MATCH2';
  const players = [
    { playerId: 'p1', username: 'Player1', team: 'A' as const, fighterId: 'vex' },
    { playerId: 'p2', username: 'Player2', team: 'B' as const, fighterId: 'rift' }
  ];
  createMatch(code, players as any);
  connect(code, 'p1');
  connect(code, 'p2');

  // Move right
  input(code, 'p1', { sequence: 1, right: true });
  const afterMove = matchFor(code);
  assert.ok(afterMove.players[0].x > 300);

  // Jump
  jump(code, 'p1', 2);
  const afterJump = matchFor(code);
  assert.equal(afterJump.players[0].y, 180);
});

test('handles attacks, damage application, cooldowns, and knockout', () => {
  const code = 'MATCH3';
  const players = [
    { playerId: 'p1', username: 'Player1', team: 'A' as const, fighterId: 'vex' },
    { playerId: 'p2', username: 'Player2', team: 'B' as const, fighterId: 'rift' }
  ];
  createMatch(code, players as any);
  connect(code, 'p1');
  connect(code, 'p2');

  // Move p1 close to p2 with inputs
  for (let seq = 1; seq <= 50; seq++) {
    input(code, 'p1', { sequence: seq, right: true });
    input(code, 'p2', { sequence: seq, left: true });
  }

  const beforeAttack = matchFor(code);
  const distance = Math.abs(beforeAttack.players[0].x - beforeAttack.players[1].x);
  assert.ok(distance <= 150, `Distance ${distance} should be <= 150`);

  attack(code, 'p1', 100);
  const afterAttack = matchFor(code);
  assert.equal(afterAttack.players[1].hp, 90); // 100 - 10 damage

  // Cooldown prevents immediate second attack
  attack(code, 'p1', 101);
  assert.equal(matchFor(code).players[1].hp, 90);
});

test('handles special moves: skill, ultimate, and burst', () => {
  const code = 'MATCH4';
  const players = [
    { playerId: 'p1', username: 'Player1', team: 'A' as const, fighterId: 'vex' },
    { playerId: 'p2', username: 'Player2', team: 'B' as const, fighterId: 'rift' }
  ];
  createMatch(code, players as any);
  connect(code, 'p1');
  connect(code, 'p2');

  for (let seq = 1; seq <= 50; seq++) {
    input(code, 'p1', { sequence: seq, right: true });
    input(code, 'p2', { sequence: seq, left: true });
  }

  // Skill attack
  special(code, 'p1', 100, 'skill');
  assert.equal(matchFor(code).players[1].hp, 84); // 100 - 16 damage

  // Burst attack
  special(code, 'p1', 101, 'burst');
  assert.equal(matchFor(code).players[1].hp, 66); // 84 - 18 damage

  // Ultimate attack
  special(code, 'p1', 102, 'ultimate');
  assert.equal(matchFor(code).players[1].hp, 38); // 66 - 28 damage
});

test('resolves winner when all players on a team are eliminated', () => {
  const code = 'MATCH5';
  const players = [
    { playerId: 'p1', username: 'Player1', team: 'A' as const, fighterId: 'vex' },
    { playerId: 'p2', username: 'Player2', team: 'B' as const, fighterId: 'rift' }
  ];
  createMatch(code, players as any);
  connect(code, 'p1');
  connect(code, 'p2');

  for (let seq = 1; seq <= 50; seq++) {
    input(code, 'p1', { sequence: seq, right: true });
    input(code, 'p2', { sequence: seq, left: true });
  }

  // Set p2 to low hp by applying attacks or disconnect
  disconnect(code, 'p2');
  const finalState = matchFor(code);
  assert.equal(finalState.players[1].hp, 0);
  assert.equal(finalState.phase, 'finished');
  assert.equal(finalState.winner, 'A');
});

test('resolves draw when both teams are wiped out', () => {
  const code = 'MATCH6';
  const players = [
    { playerId: 'p1', username: 'Player1', team: 'A' as const, fighterId: 'vex' },
    { playerId: 'p2', username: 'Player2', team: 'B' as const, fighterId: 'rift' }
  ];
  createMatch(code, players as any);
  connect(code, 'p1');
  connect(code, 'p2');

  disconnect(code, 'p1');
  disconnect(code, 'p2');
  const finalState = matchFor(code);
  assert.equal(finalState.phase, 'finished');
  assert.equal(finalState.winner, null); // Draw
});
