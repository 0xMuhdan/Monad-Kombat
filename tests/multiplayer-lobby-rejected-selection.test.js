import test from 'node:test';
import assert from 'node:assert/strict';

function applyRejectedAction(confirmedRoom, response) {
  let room = confirmedRoom;
  let error = '';
  try {
    if (!response.ok) throw new Error(response.error);
    room = response.room;
  } catch (failure) {
    room = confirmedRoom;
    error = failure.message;
  }
  return { room, error };
}

// **Validates: Requirements 2.5, 3.1, 3.2**
test('rejected fighter action keeps the confirmed selection and server error', () => {
  const confirmedRoom = {
    code: 'TEST01',
    players: [{ playerId: 'me', team: 'A', fighterId: 'rift' }]
  };

  const result = applyRejectedAction(confirmedRoom, {
    ok: false,
    error: 'Fighter is already selected'
  });

  assert.equal(result.room.players[0].fighterId, 'rift');
  assert.equal(result.error, 'Fighter is already selected');
});

// **Validates: Requirements 2.5, 3.2**
test('rejected no-team action cannot fabricate a selected fighter', () => {
  const confirmedRoom = {
    code: 'TEST01',
    players: [{ playerId: 'me', team: null, fighterId: undefined }]
  };

  const result = applyRejectedAction(confirmedRoom, {
    ok: false,
    error: 'Choose a team first'
  });

  assert.equal(result.room.players[0].fighterId, undefined);
  assert.equal(result.error, 'Choose a team first');
});
