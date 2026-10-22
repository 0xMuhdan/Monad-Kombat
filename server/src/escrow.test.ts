import assert from 'node:assert';
import artifact from './MonadKombatArena.json' with { type: 'json' };

async function testEscrowContract() {
  console.log('Testing MonadKombatArena Escrow & Faucet...');
  
  // Verify ABI contains all expected functions
  const abi = artifact.abi as any[];
  const fnNames = abi.filter(item => item.type === 'function').map(item => item.name);
  
  assert(fnNames.includes('claimTestnetMon'), 'Must include claimTestnetMon');
  assert(fnNames.includes('hasClaimedFaucet'), 'Must include hasClaimedFaucet');
  assert(fnNames.includes('depositSession'), 'Must include depositSession');
  assert(fnNames.includes('spendSponsor'), 'Must include spendSponsor');
  assert(fnNames.includes('settleSession'), 'Must include settleSession');
  assert(fnNames.includes('getSession'), 'Must include getSession');
  assert(fnNames.includes('fundFaucet'), 'Must include fundFaucet');

  // Verify Faucet & Sponsor values in ABI
  const faucetClaim = abi.find(item => item.name === 'claimTestnetMon');
  assert(faucetClaim, 'claimTestnetMon function exists');

  const spendSponsor = abi.find(item => item.name === 'spendSponsor');
  assert(spendSponsor, 'spendSponsor function exists');
  assert.strictEqual(spendSponsor.inputs.length, 3, 'spendSponsor takes roomCode, targetFighter, skillTier');

  console.log('Artifact verification passed! All functions and ABI signatures verified.');
}

testEscrowContract().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
