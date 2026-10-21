import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

export type EphemeralWallet = { address: `0x${string}`; privateKey: `0x${string}` };
const wallets = new Map<string, EphemeralWallet>();

export function createEphemeralWallet(playerId: string): `0x${string}` {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  wallets.set(playerId, { address: account.address, privateKey });
  return account.address;
}

export function walletFor(playerId: string) { return wallets.get(playerId); }

export function moveWallet(fromPlayerId: string, toPlayerId: string) {
  const wallet = wallets.get(fromPlayerId);
  if (!wallet) throw new Error('Wallet not found');
  wallets.set(toPlayerId, wallet);
  wallets.delete(fromPlayerId);
}
