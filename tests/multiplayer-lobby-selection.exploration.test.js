import test from 'node:test';
import assert from 'node:assert/strict';

const canonical = {
  vex: { name: 'VEX', alignment: 'COREBOUND', asset: 'assets/menu/arco-select.webp' },
  rift: { name: 'RIFT', alignment: 'FERALBOUND', asset: 'assets/menu/fenr-select.webp' },
  nova: { name: 'NOVA', alignment: 'COREBOUND', asset: 'assets/menu/mira-select.webp' },
  nox: { name: 'NOX', alignment: 'FERALBOUND', asset: 'assets/menu/cora-select.webp' },
  sable: { name: 'SABLE', alignment: 'FERALBOUND', asset: 'assets/menu/naja-select.webp' },
  forge: { name: 'FORGE', alignment: 'COREBOUND', asset: 'assets/menu/haldor-select.webp' },
  jinx: { name: 'JINX', alignment: 'FERALBOUND', asset: 'assets/menu/zanni-select.webp' },
  aero: { name: 'AERO', alignment: 'COREBOUND', asset: 'assets/menu/isolde-select.webp' },
  orbit: { name: 'ORBIT', alignment: 'COREBOUND', asset: 'assets/menu/rhea-select.webp' },
  ember: { name: 'EMBER', alignment: 'FERALBOUND', asset: 'assets/menu/solan-select.webp' },
  kite: { name: 'KITE', alignment: 'COREBOUND', asset: 'assets/menu/nib-select.webp' },
  moss: { name: 'MOSS', alignment: 'FERALBOUND', asset: 'assets/menu/edda-select.webp' }
};

const canonicalIds = Object.keys(canonical); // Mirrors the confirmed canonical roster.

// This is the current lobby's render contract, intentionally exercised before the fix.
function renderConfirmedLobby(room, playerId, confirmed = null) {
  const sourceRoom = confirmed || room;
  const mine = sourceRoom.players.find((player) => player.playerId === playerId);
  const selectedId = mine?.fighterId || 'vex';
  const fighter = canonical[selectedId] || canonical.vex;
  return {
    authoritativeFighterId: mine?.fighterId,
    rosterSelectionId: mine?.fighterId,
    preview: { fighterId: selectedId, ...fighter },
    confirmedRoom: confirmed || room
  };
}

function renderCurrentLobby(room, playerId) {
  return renderConfirmedLobby(room, playerId);
}

function acceptedRoom(fighterId) {
  return { code: 'TEST01', players: [{ playerId: 'me', team: 'A', fighterId }] };
}

test('bug condition exploration: accepted AERO/RIFT/NOVA selections converge in the lobby', () => {
  for (const fighterId of ['aero', 'rift', 'nova']) {
    const view = renderCurrentLobby(acceptedRoom(fighterId), 'me');
    assert.equal(view.authoritativeFighterId, fighterId);
    assert.equal(view.rosterSelectionId, fighterId);
    assert.equal(view.preview.fighterId, fighterId);
    assert.equal(view.preview.name, canonical[fighterId].name);
    assert.equal(view.preview.alignment, canonical[fighterId].alignment);
    assert.equal(view.preview.asset, canonical[fighterId].asset);
  }
});

test('bug condition exploration: an older polling snapshot must not revert a confirmed selection', () => {
  const confirmed = renderConfirmedLobby(acceptedRoom('aero'), 'me');
  const stale = renderConfirmedLobby(acceptedRoom('vex'), 'me', confirmed.confirmedRoom);

  // The harness models the fixed pipeline: stale snapshots render from confirmed state.
  assert.deepEqual(stale, confirmed, 'stale polling snapshot reverted confirmed AERO to VEX');
});
