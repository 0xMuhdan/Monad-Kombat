import { Client } from '@colyseus/sdk';

const API_URL = globalThis.BLITZBOUND_API_URL || 'http://localhost:2567';
const WS_URL = globalThis.BLITZBOUND_WS_URL || 'ws://localhost:2567';

export async function fetchRoom(code, token) {
  const response = await fetch(`${API_URL}/api/rooms/${encodeURIComponent(code)}`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'room_request_failed');
  return data.room;
}

export async function connectLobby({ code, playerId, username, onState, onError }) {
  const client = new Client(WS_URL);
  client.auth.token = localStorage.getItem('blitzbound.session') || '';
  const token = client.auth.token;
  const room = await client.joinOrCreate('lobby', { code, playerId, username, token });
  room.onMessage('lobby', onState);
  room.onMessage('error', onError || (() => {}));
  return {
    room,
    send(type, message) { room.send(type, { playerId, ...message }); },
    leave() { return room.leave(); }
  };
}
