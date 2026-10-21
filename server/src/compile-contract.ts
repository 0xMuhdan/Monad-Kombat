import fs from 'node:fs';
import path from 'node:path';
import solc from 'solc';

const contractPath = path.resolve('../contracts/MonadKombatArena.sol');
const source = fs.readFileSync(contractPath, 'utf8');

const input = {
  language: 'Solidity',
  sources: {
    'MonadKombatArena.sol': {
      content: source
    }
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode']
      }
    }
  }
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  for (const err of output.errors) {
    console.error(err.formattedMessage);
    if (err.severity === 'error') {
      process.exit(1);
    }
  }
}

const contract = output.contracts['MonadKombatArena.sol']['MonadKombatArena'];
const artifact = {
  contractName: 'MonadKombatArena',
  abi: contract.abi,
  bytecode: '0x' + contract.evm.bytecode.object
};

const outputPath = path.resolve('./src/MonadKombatArena.json');
fs.writeFileSync(outputPath, JSON.stringify(artifact, null, 2), 'utf8');
console.log('Contract compiled successfully to', outputPath);
