import { Room as ColyseusRoom } from '@colyseus/core';
import type { Client } from '@colyseus/core';
import { roomFor, joinRoom, setMode, chooseTeam, chooseFighter, setReady, startRoom, type Mode, type Team } from './rooms.js';
import { sessionProfile } from './profile.js';

type Options = { code: string; playerId: string; username: string; token?: string };

export class LobbyRoom extends ColyseusRoom {
  maxClients = 6;
  private code = '';

  onCreate(options: Options) {
    console.log('[LOBBY] create', { code: options.code, playerId: options.playerId, hasToken: Boolean(options.token) });
    this.code = options.code;
    this.setPatchRate(1000 / 30);
    this.onMessage('join', (client, message: { playerId: string; username: string }) => this.reply(client, () => joinRoom(this.code, message.playerId, message.username)));
    this.onMessage('mode', (client, message: { playerId: string; mode: Mode }) => this.reply(client, () => setMode(this.code, message.playerId, message.mode)));
    this.onMessage('team', (client, message: { playerId: string; team: Team }) => this.reply(client, () => chooseTeam(this.code, message.playerId, message.team)));
    this.onMessage('fighter', (client, message: { playerId: string; fighterId: string }) => this.reply(client, () => chooseFighter(this.code, message.playerId, message.fighterId)));
    this.onMessage('ready', (client, message: { playerId: string; ready: boolean }) => this.reply(client, () => setReady(this.code, message.playerId, message.ready)));
    this.onMessage('start', (client, message: { playerId: string }) => this.reply(client, () => startRoom(this.code, message.playerId)));
  }

  onJoin(client: Client, options: Options) {
    const profile = sessionProfile(options.token);
    if (!profile || profile.playerId !== options.playerId) throw new Error('Unauthorized lobby connection');
    client.send('lobby', roomFor(options.code));
    this.broadcast('lobby', roomFor(this.code));
  }

  onLeave() { this.broadcast('lobby', roomFor(this.code)); }

  private reply(client: Client, operation: () => unknown) {
    try { const state = operation(); this.broadcast('lobby', state); } catch (error) { client.send('error', { error: error instanceof Error ? error.message : 'lobby_action_failed' }); }
  }
}
