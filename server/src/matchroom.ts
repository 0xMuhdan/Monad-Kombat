import { Room as ColyseusRoom } from '@colyseus/core';
import type { Client } from '@colyseus/core';
import { advance, attack, connect, createMatch, disconnect, input, jump, matchFor, special } from './match.js';
import { matchRoster, matchRosterSnapshot } from './rooms.js';
import { saveResult, updateResultTxHash } from './results.js';
import { recordMatchResult, sessionProfile, profileById } from './profile.js';
import { recordMatchOnChain } from './onchain.js';

type Options = { code: string; playerId?: string; token?: string; spectator?: boolean; roster?: { playerId: string; username: string; team: 'A' | 'B' | null; fighterId: string | null }[] };

export class MatchRoom extends ColyseusRoom {
  maxClients = 50;
  private code = '';
  private players = new Map<string, string>();
  private spectators = new Map<string, string>();
  private hypeP1 = 0;
  private hypeP2 = 0;
  private roomSetup = { p1: 'arco', p2: 'fenr', level: 'medium', stage: 'bellora' };
  private reconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly reconnectGraceMs = 8000;
  private initialized = false;

  onCreate(options: Options) {
    try {
      this.code = options.code;
      console.log('[MATCH] create attempt', { code: this.code });
      let roster = options.roster ?? matchRosterSnapshot(this.code);
      if (!roster) {
        try {
          roster = matchRoster(this.code);
        } catch (_) {
          roster = [];
        }
      }
      createMatch(this.code, roster.map(player => ({ ...player, team: player.team as 'A' | 'B', fighterId: player.fighterId as string, x: 0, y: 0, hp: 100, connected: false, sequence: 0, attackReadyAt: 0, skillReadyAt: 0, ultimateReadyAt: 0, burstReadyAt: 0, attackFlashUntil: 0, lastHitAt: 0, eliminations: 0, animation: 'idle', animationUntil: 0 })));
    this.initialized = true;
    this.setPatchRate(1000 / 30);
    this.setSimulationInterval(() => { const state = advance(this.code); if (state.phase === 'finished' && !state.resultSaved) { state.resultSaved = true; const savedAt = new Date().toISOString(); const players = state.players.map(({ playerId, team, fighterId, connected, hp, eliminations }) => ({ playerId, team, fighterId, connected, hp, eliminations })); saveResult({ code: this.code, winner: state.winner, players, savedAt }); void recordMatchResult(this.code, state.winner, players, savedAt).catch(error => console.error('Unable to persist match result:', error)); void (async () => { try { const winnerPlayer = players.find(p => p.team === state.winner); const loserPlayer = players.find(p => p.team !== state.winner); const winnerProfile = winnerPlayer ? profileById(winnerPlayer.playerId) : null; const loserProfile = loserPlayer ? profileById(loserPlayer.playerId) : null; const winnerAddress = (winnerProfile?.walletAddress as `0x${string}`) || '0x0000000000000000000000000000000000000000'; const loserAddress = (loserProfile?.walletAddress as `0x${string}`) || '0x0000000000000000000000000000000000000000'; const txHash = await recordMatchOnChain(this.code, winnerAddress, loserAddress, winnerPlayer?.fighterId || 'vex', loserPlayer?.fighterId || 'rift', state.winner || 'A'); if (txHash) updateResultTxHash(this.code, txHash); } catch (e) { console.error('On-chain match settlement error:', e); } })(); } this.broadcast('snapshot', state); }, 1000 / 30);
    this.onMessage('input', (client, message: { sequence: number; left?: boolean; right?: boolean }) => {
      const playerId = this.players.get(client.sessionId);
      if (!playerId) return client.send('error', { error: 'player_not_registered' });
      this.reply(client, () => input(this.code, playerId, message));
    });
    this.onMessage('attack', (client, message: { sequence: number }) => {
      const playerId = this.players.get(client.sessionId);
      if (!playerId) return client.send('error', { error: 'player_not_registered' });
      this.reply(client, () => attack(this.code, playerId, message.sequence));
    });
    this.onMessage('jump', (client, message: { sequence: number }) => {
      const playerId = this.players.get(client.sessionId);if (!playerId) return client.send('error', { error: 'player_not_registered' });
      this.reply(client, () => jump(this.code, playerId, message.sequence));
    });
    this.onMessage('special', (client, message: { sequence: number; kind: 'skill'|'ultimate'|'burst' }) => {
      const playerId = this.players.get(client.sessionId);if (!playerId) return client.send('error', { error: 'player_not_registered' });
      this.reply(client, () => special(this.code, playerId, message.sequence, message.kind));
    });
    this.onMessage('sponsor_action', (client, message: { target: 'p1' | 'p2'; skill: 'skill1' | 'skill2' | 'ultimate'; amount: number; sponsorName?: string }) => {
      const target = message.target === 'p1' ? 'p1' : 'p2';
      const amount = Number(message.amount) || 0;
      if (target === 'p1') {
        this.hypeP1 += amount;
      } else {
        this.hypeP2 += amount;
      }
      const totalHype = this.hypeP1 + this.hypeP2;
      const pctP1 = totalHype > 0 ? Math.round((this.hypeP1 / totalHype) * 100) : 50;
      const pctP2 = 100 - pctP1;

      this.broadcast('sponsor_event', {
        target: message.target,
        skill: message.skill,
        amount,
        sponsorName: message.sponsorName || 'Spectator',
        hypeP1: this.hypeP1,
        hypeP2: this.hypeP2,
        pctP1,
        pctP2
      });
    });
    this.onMessage('room_setup', (client, message: { p1: string; p2: string; level: string; stage: string }) => {
      this.roomSetup = { ...this.roomSetup, ...message };
      this.broadcast('room_setup', this.roomSetup);
    });
    this.onMessage('request_setup', (client) => {
      client.send('room_setup', this.roomSetup);
    });
    this.onMessage('request_hype', (client) => {
      const totalHype = this.hypeP1 + this.hypeP2;
      const pctP1 = totalHype > 0 ? Math.round((this.hypeP1 / totalHype) * 100) : 50;
      client.send('hype_update', {
        hypeP1: this.hypeP1,
        hypeP2: this.hypeP2,
        pctP1,
        pctP2: 100 - pctP1
      });
    });
    } catch (error) {
      console.error('[MATCH] onCreate failed', { code: this.code, error: error instanceof Error ? error.stack : error });
      throw error;
    }
  }

  onJoin(client: Client, options: Options) {
    if (!this.initialized) throw new Error('Match is still initializing');
    console.log('[MATCH] join attempt', { code: this.code, playerId: options?.playerId, spectator: Boolean(options?.spectator), hasToken: Boolean(options?.token) });
    
    if (options?.spectator) {
      const spectatorId = options?.playerId || `spectator_${client.sessionId.slice(0, 5)}`;
      this.spectators.set(client.sessionId, spectatorId);
      console.log('[MATCH] spectator joined', { code: this.code, spectatorId });
      const totalHype = this.hypeP1 + this.hypeP2;
      const pctP1 = totalHype > 0 ? Math.round((this.hypeP1 / totalHype) * 100) : 50;
      client.send('hype_update', { hypeP1: this.hypeP1, hypeP2: this.hypeP2, pctP1, pctP2: 100 - pctP1 });
      client.send('room_setup', this.roomSetup);
      this.broadcast('spectator_count', { count: this.spectators.size });
      const state = matchFor(this.code);
      if (state) client.send('snapshot', state);
      return;
    }

    const playerId = options?.playerId;
    const profile = sessionProfile(options?.token);
    const rosterPlayer = matchRoster(this.code).find(player => player.playerId === playerId);
    if (!profile || profile.playerId !== playerId) throw new Error('Unauthorized match connection');
    if (!playerId || !rosterPlayer || this.players.has(client.sessionId) || [...this.players.values()].includes(playerId)) throw new Error('Player is not part of this match');
    const pending = this.reconnectTimers.get(playerId);
    if (pending) { clearTimeout(pending); this.reconnectTimers.delete(playerId); }
    this.players.set(client.sessionId, playerId);
    const state = connect(this.code, playerId) ?? matchFor(this.code);
    client.send('snapshot', state);
    this.broadcast('snapshot', state);
  }

  onLeave(client: Client) {
    if (this.spectators.has(client.sessionId)) {
      this.spectators.delete(client.sessionId);
      this.broadcast('spectator_count', { count: this.spectators.size });
      return;
    }
    const playerId = this.players.get(client.sessionId);
    this.players.delete(client.sessionId);
    if (!playerId) return;
    const timer = setTimeout(() => {
      this.reconnectTimers.delete(playerId);
      if (![...this.players.values()].includes(playerId)) this.broadcast('snapshot', disconnect(this.code, playerId));
    }, this.reconnectGraceMs);
    this.reconnectTimers.set(playerId, timer);
  }

  onDispose() {
    for (const timer of this.reconnectTimers.values()) clearTimeout(timer);
    this.reconnectTimers.clear();
    this.players.clear();
  }
  private reply(client: Client, operation: () => unknown) { try { operation(); } catch (error) { client.send('error', { error: error instanceof Error ? error.message : 'match_action_failed' }); } }
}
