import http from 'node:http';
import { createPublicClient, http as viemHttp, defineChain } from 'viem';
import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { createEphemeralWallet, moveWallet } from './wallet.js';
import { authenticate, createProfile, dashboardProfile, login, loginWithWallet, logout, sessionProfile, setWalletAddress } from './profile.js';
import { chooseFighter, chooseTeam, cleanupRooms, createRoom, joinRoom, matchRoster, roomFor, setMatchRoster, setMode, setReady, startRoom, type Mode, type Team } from './rooms.js';
import { LobbyRoom } from './lobby.js';
import { loadResults, resultFor } from './results.js';
import { loadProfiles } from './profile.js';
import { MatchRoom } from './matchroom.js';

const port = Number(process.env.PORT ?? 2567);
const rpcUrl = process.env.MONAD_TESTNET_RPC_URL ?? 'https://testnet-rpc.monad.xyz';
const chainId = Number(process.env.MONAD_TESTNET_CHAIN_ID ?? 10143);
const milestonesEnabled = process.env.ENABLE_MONAD_MILESTONES === 'true';

if (!rpcUrl) throw new Error('MONAD_TESTNET_RPC_URL is required');
if (chainId !== 10143) throw new Error('Blitzbound server is testnet-only: expected Monad Testnet chain ID 10143');

const monadTestnet = defineChain({ id: chainId, name: 'Monad Testnet', nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 }, rpcUrls: { default: { http: [rpcUrl] } } });
const monad = createPublicClient({ chain: monadTestnet, transport: viemHttp(rpcUrl) });
const corsHeaders = { 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type,authorization', 'access-control-allow-credentials': 'true' };
const json = (response: http.ServerResponse, status: number, body: unknown, origin?: string) => { const allowOrigin = origin && /^https?:\/\/localhost:\d+$/.test(origin) ? origin : 'http://localhost:8000'; response.writeHead(status, { ...corsHeaders, 'access-control-allow-origin': allowOrigin, 'content-type': 'application/json; charset=utf-8' }); response.end(status === 204 ? '' : JSON.stringify(body)); };
const body = async (request: http.IncomingMessage) => { let data = ''; for await (const chunk of request) data += chunk; return JSON.parse(data || '{}') as Record<string, unknown>; };
const token = (request: http.IncomingMessage) => request.headers.authorization?.startsWith('Bearer ') ? request.headers.authorization.slice(7) : undefined;

const httpServer = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') return json(response, 204, null, request.headers.origin);
  try {
    if (request.method === 'GET' && request.url === '/health') return json(response, 200, { name: 'Monad Kombat server', status: 'ok', realtime: 'colyseus', tickRate: 30, network: 'Monad Testnet', chainId, milestonesEnabled });
    if (request.method === 'POST' && request.url === '/api/profile') {
      const input = await body(request);
      const profile = await createProfile(String(input.name ?? ''), String(input.pin ?? ''));
      const walletAddress = createEphemeralWallet(profile.playerId);
      const updatedProfile = setWalletAddress(profile.playerId, walletAddress);
      return json(response, 201, { profile: updatedProfile, warning: 'Temporary Monad Testnet wallet. Do not deposit real funds.' });
    }
    if (request.method === 'POST' && request.url === '/api/login') {
      const input = await body(request);
      const auth = await authenticate(String(input.username ?? ''), String(input.pin ?? ''));
      if (auth.success) {
        return json(response, 200, { token: auth.token, profile: auth.profile });
      }
      return json(response, 401, { error: auth.reason });
    }
    if (request.method === 'POST' && request.url === '/api/wallet-login') {
      const input = await body(request);
      const walletAddress = String(input.walletAddress ?? '');
      if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        return json(response, 400, { error: 'invalid_wallet_address' });
      }
      const result = await loginWithWallet(walletAddress);
      return json(response, 200, result);
    }
    if (request.method === 'POST' && request.url === '/api/logout') { logout(token(request)); return json(response, 204, null); }
    if (request.method === 'GET' && request.url === '/api/profile') {
      const profile = sessionProfile(token(request)); return profile ? json(response, 200, { profile }) : json(response, 401, { error: 'unauthorized' });
    }
    if (request.method === 'POST' && request.url === '/api/rooms') {
      const profile = sessionProfile(token(request)); if (!profile) return json(response, 401, { error: 'unauthorized' });
      const input = await body(request); return json(response, 201, { room: createRoom(profile.playerId, profile.username, String(input.mode ?? '1v1') as Mode) });
    }
    const resultMatch = request.url?.match(/^\/api\/results\/([A-Z0-9]+)$/i);
    if (resultMatch && request.method === 'GET') { const profile = sessionProfile(token(request)); if (!profile) return json(response, 401, { error: 'unauthorized' }); const result = resultFor(resultMatch[1]); if (!result) return json(response, 404, { error: 'result_not_found' }); if (!result.players.some(player => player.playerId === profile.playerId)) return json(response, 403, { error: 'forbidden' }); return json(response, 200, { result }); }
    const roomMatch = request.url?.match(/^\/api\/rooms\/([A-Z0-9]+)$/i);
    if (roomMatch && request.method === 'GET') {
      const profile = sessionProfile(token(request));
      if (!profile) return json(response, 401, { error: 'unauthorized' });
      return json(response, 200, { room: roomFor(roomMatch[1]) });
    }
    if (roomMatch && request.method === 'POST') {
      const profile = sessionProfile(token(request)); if (!profile) return json(response, 401, { error: 'unauthorized' });
      const input = await body(request); const roomCode = roomMatch[1];
      if (input.action === 'join') return json(response, 200, { room: joinRoom(roomCode, profile.playerId, profile.username) });
      if (input.action === 'mode') return json(response, 200, { room: setMode(roomCode, profile.playerId, String(input.mode) as Mode) });
      if (input.action === 'team') return json(response, 200, { room: chooseTeam(roomCode, profile.playerId, String(input.team) as Team) });
      if (input.action === 'fighter') return json(response, 200, { room: chooseFighter(roomCode, profile.playerId, String(input.fighterId)) });
      if (input.action === 'ready') return json(response, 200, { room: setReady(roomCode, profile.playerId, Boolean(input.ready)) });
      if (input.action === 'start') {
        const started = startRoom(roomCode, profile.playerId);
        const matchRoster = started.players.map(player => ({ playerId: player.playerId, username: player.username, team: player.team, fighterId: player.fighterId }));
        setMatchRoster(roomCode, matchRoster as Array<{ playerId: string; username: string; team: Team; fighterId: string }>);
        return json(response, 200, { room: started, matchRoster });
      }
      return json(response, 400, { error: 'unknown_room_action' });
    }
    if (request.method === 'GET' && request.url === '/api/dashboard') {
      const profile = sessionProfile(token(request));
      if (!profile) return json(response, 401, { error: 'unauthorized' });
      const dashboard = dashboardProfile(profile.playerId);
      return dashboard ? json(response, 200, dashboard) : json(response, 404, { error: 'profile_not_found' });
    }
    return json(response, 404, { error: 'not_found' });
  } catch (error) { return json(response, 400, { error: error instanceof Error ? error.message : 'bad_request' }, request.headers.origin); }
});

const cleanupTimer = setInterval(() => cleanupRooms(), 60_000);
cleanupTimer.unref();
const gameServer = new Server({ transport: new WebSocketTransport({ server: httpServer }) });
gameServer.define('lobby', LobbyRoom).filterBy(['code']);
gameServer.define('match', MatchRoom).filterBy(['code']);
void Promise.all([loadProfiles(), loadResults()]).then(() => monad.getBlockNumber()).then(block => { gameServer.listen(port); console.log(`Monad Kombat server listening on http://localhost:${port}`); console.log(`Monad Testnet connected at block ${block}`); console.log('Monad Kombat API & Realtime ready.'); }).catch(error => { console.error('Unable to connect to Monad Testnet:', error); process.exitCode = 1; });
