import fs from 'node:fs';
import path from 'node:path';
import { createPublicClient, createWalletClient, defineChain, formatEther, http } from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';

// Load MonadKombatArena ABI & Bytecode
const artifactPath = path.resolve('./src/MonadKombatArena.json');
if (!fs.existsSync(artifactPath)) {
  console.error('Artifact not found. Please run "npm run compile" first.');
  process.exit(1);
}
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

const rpcUrl = process.env.MONAD_TESTNET_RPC_URL || 'https://testnet-rpc.monad.xyz';
const chainId = Number(process.env.MONAD_TESTNET_CHAIN_ID || 10143);

const monadTestnet = defineChain({
  id: chainId,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl] } }
});

const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(rpcUrl)
});

async function main() {
  let privateKey = process.env.DEPLOYER_PRIVATE_KEY || process.env.MONAD_PRIVATE_KEY;
  if (!privateKey) {
    console.log('No DEPLOYER_PRIVATE_KEY found in environment or .env.');
    console.log('Generating a dedicated deployer key for you...');
    privateKey = generatePrivateKey();
    console.log('----------------------------------------------------');
    console.log('DEPLOYER KEY GENERATED:');
    console.log('Private Key:', privateKey);
    console.log('----------------------------------------------------');
  }

  if (!privateKey.startsWith('0x')) {
    privateKey = ('0x' + privateKey) as `0x${string}`;
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  console.log('Deployer Address:', account.address);

  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Deployer Balance: ${formatEther(balance)} MON`);

  if (balance === 0n) {
    console.log('\n⚠️ SALDO MON KOSONG!');
    console.log(`Silakan minta testnet MON dari faucet untuk address: ${account.address}`);
    console.log('Faucet link: https://testnet.monad.xyz');
    console.log('Setelah mendapatkan testnet MON, simpan private key berikut di server/.env:');
    console.log(`DEPLOYER_PRIVATE_KEY=${privateKey}`);
    console.log('Lalu jalankan kembali: npm run deploy:contract');
    return;
  }

  console.log('\nDeploying BlitzboundArena to Monad Testnet...');
  const walletClient = createWalletClient({
    account,
    chain: monadTestnet,
    transport: http(rpcUrl)
  });

  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode as `0x${string}`
  });

  console.log('Deployment Transaction Hash:', hash);
  console.log(`View on Explorer: https://testnet.monadexplorer.com/tx/${hash}`);
  console.log('Waiting for confirmation on Monad Testnet (sub-second finality)...');

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('\n✅ CONTRACT DEPLOYED SUCCESSFULLY!');
  console.log('Contract Address:', receipt.contractAddress);
  console.log(`Explorer Link: https://testnet.monadexplorer.com/address/${receipt.contractAddress}`);

  // Update .env with ARENA_CONTRACT_ADDRESS
  const envPath = path.resolve('./.env');
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  if (envContent.includes('ARENA_CONTRACT_ADDRESS=')) {
    envContent = envContent.replace(/ARENA_CONTRACT_ADDRESS=.*/g, `ARENA_CONTRACT_ADDRESS=${receipt.contractAddress}`);
  } else {
    envContent += `\nARENA_CONTRACT_ADDRESS=${receipt.contractAddress}\n`;
  }
  if (!envContent.includes('DEPLOYER_PRIVATE_KEY=')) {
    envContent += `DEPLOYER_PRIVATE_KEY=${privateKey}\n`;
  }
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('Updated server/.env with ARENA_CONTRACT_ADDRESS and DEPLOYER_PRIVATE_KEY.');
}

main().catch(err => {
  console.error('Deployment failed:', err);
  process.exit(1);
});
