import fs from 'node:fs';
import path from 'node:path';
import { createPublicClient, createWalletClient, defineChain, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const rpcUrl = process.env.MONAD_TESTNET_RPC_URL || 'https://testnet-rpc.monad.xyz';
const chainId = Number(process.env.MONAD_TESTNET_CHAIN_ID || 10143);
const contractAddress = process.env.ARENA_CONTRACT_ADDRESS as `0x${string}` | undefined;
const privateKey = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}` | undefined;

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

let artifactAbi: any = null;
try {
  const artifactPath = path.resolve('./src/MonadKombatArena.json');
  if (fs.existsSync(artifactPath)) {
    artifactAbi = JSON.parse(fs.readFileSync(artifactPath, 'utf8')).abi;
  }
} catch (_) {}

export async function recordMatchOnChain(
  roomCode: string,
  winnerAddress: `0x${string}` = '0x0000000000000000000000000000000000000000',
  loserAddress: `0x${string}` = '0x0000000000000000000000000000000000000000',
  winnerFighter: string = 'vex',
  loserFighter: string = 'rift',
  winnerTeam: 'A' | 'B' = 'A'
): Promise<string | null> {
  if (!contractAddress || !privateKey || !artifactAbi) {
    return null;
  }

  try {
    const account = privateKeyToAccount(privateKey);
    const walletClient = createWalletClient({
      account,
      chain: monadTestnet,
      transport: http(rpcUrl)
    });

    const codeBytes6 = ('0x' + Buffer.from(roomCode.slice(0, 6).padEnd(6, ' ')).toString('hex')) as `0x${string}`;

    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: artifactAbi,
      functionName: 'recordMatch',
      args: [
        codeBytes6,
        winnerAddress,
        loserAddress,
        winnerFighter,
        loserFighter,
        winnerTeam === 'A' ? 1 : 2
      ]
    });

    console.log(`[MONAD ON-CHAIN] Match ${roomCode} recorded! TxHash: ${hash}`);
    return hash;
  } catch (error) {
    console.error(`[MONAD ON-CHAIN] Failed to record match on-chain:`, error);
    return null;
  }
}
