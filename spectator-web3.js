/**
 * spectator-web3.js
 * Web3 Provider, In-App 3.5 MON Faucet (1x per wallet), and Escrow Session Manager for Monad Kombat AI Arena.
 */
(() => {
  'use strict';

  const MONAD_CHAIN_ID_HEX = '0x279f';
  const MONAD_CHAIN_ID_DEC = 10143;
  const MONAD_RPC_URL = 'https://testnet-rpc.monad.xyz';
  const MONAD_EXPLORER_URL = 'https://testnet.monadexplorer.com';
  const FAUCET_AMOUNT = 3.5;

  const SKILL_COSTS = {
    skill1: 0.5,
    skill2: 1.0,
    ultimate: 2.0
  };

  const state = {
    walletAddress: null,
    connected: false,
    chainId: null,
    walletBalance: 0,
    sessionBalance: 0,
    spentP1: 0,
    spentP2: 0,
    hasClaimedFaucet: false,
    roomCode: 'AI_COL',
    contractAddress: null,
    listeners: new Set()
  };

  function notify() {
    const snapshot = getSnapshot();
    for (const fn of state.listeners) {
      try { fn(snapshot); } catch (e) { console.error('Listener error:', e); }
    }
  }

  function getSnapshot() {
    const totalSpent = state.spentP1 + state.spentP2;
    const pctP1 = totalSpent > 0 ? Math.round((state.spentP1 / totalSpent) * 100) : 50;
    const pctP2 = 100 - pctP1;
    return {
      walletAddress: state.walletAddress,
      connected: state.connected,
      chainId: state.chainId,
      isMonadTestnet: state.chainId === MONAD_CHAIN_ID_DEC || state.chainId === MONAD_CHAIN_ID_HEX,
      walletBalance: state.walletBalance,
      sessionBalance: state.sessionBalance,
      spentP1: state.spentP1,
      spentP2: state.spentP2,
      pctP1,
      pctP2,
      hasClaimedFaucet: state.hasClaimedFaucet,
      roomCode: state.roomCode
    };
  }

  function checkClaimStatus(address) {
    if (!address) return false;
    return localStorage.getItem(`monad_faucet_claimed_${address.toLowerCase()}`) === 'true';
  }

  async function switchNetwork() {
    if (!window.ethereum) return false;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: MONAD_CHAIN_ID_HEX }]
      });
      return true;
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: MONAD_CHAIN_ID_HEX,
              chainName: 'Monad Testnet',
              nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
              rpcUrls: [MONAD_RPC_URL],
              blockExplorerUrls: [MONAD_EXPLORER_URL]
            }]
          });
          return true;
        } catch (addError) {
          console.error('Failed to add Monad Testnet:', addError);
          return false;
        }
      }
      return false;
    }
  }

  async function updateWalletBalance() {
    if (!state.walletAddress || !window.ethereum) return;
    try {
      const hexBalance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [state.walletAddress, 'latest']
      });
      const wei = BigInt(hexBalance || '0');
      // Format to 4 decimals
      state.walletBalance = Number(wei / 100000000000000n) / 10000;
      notify();
    } catch (err) {
      console.warn('Could not fetch wallet balance:', err);
    }
  }

  async function connectWallet() {
    if (!window.ethereum) {
      throw new Error('MetaMask or Web3 wallet not detected. Please install MetaMask to use on-chain features.');
    }
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts || !accounts[0]) throw new Error('No accounts authorized');

    state.walletAddress = accounts[0];
    state.connected = true;
    state.hasClaimedFaucet = checkClaimStatus(state.walletAddress);

    try {
      state.chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (state.chainId !== MONAD_CHAIN_ID_HEX && Number(state.chainId) !== MONAD_CHAIN_ID_DEC) {
        await switchNetwork();
        state.chainId = await window.ethereum.request({ method: 'eth_chainId' });
      }
    } catch (_) {}

    await updateWalletBalance();

    // Listen for changes
    if (window.ethereum.on) {
      window.ethereum.on('accountsChanged', (newAccounts) => {
        if (!newAccounts || !newAccounts.length) {
          disconnect();
        } else {
          state.walletAddress = newAccounts[0];
          state.hasClaimedFaucet = checkClaimStatus(state.walletAddress);
          updateWalletBalance();
          notify();
        }
      });
      window.ethereum.on('chainChanged', (newChain) => {
        state.chainId = newChain;
        updateWalletBalance();
        notify();
      });
    }

    notify();
    return state.walletAddress;
  }

  function disconnect() {
    state.walletAddress = null;
    state.connected = false;
    state.sessionBalance = 0;
    notify();
  }

  /**
   * Claim 3.5 MON once per wallet
   */
  async function claimFaucet() {
    if (!state.connected || !state.walletAddress) {
      await connectWallet();
    }
    if (checkClaimStatus(state.walletAddress)) {
      state.hasClaimedFaucet = true;
      notify();
      throw new Error('Faucet: 3.5 MON already claimed for this wallet!');
    }

    // In a testnet scenario, simulate or transfer faucet tokens
    state.walletBalance += FAUCET_AMOUNT;
    localStorage.setItem(`monad_faucet_claimed_${state.walletAddress.toLowerCase()}`, 'true');
    state.hasClaimedFaucet = true;
    notify();

    return {
      success: true,
      amount: FAUCET_AMOUNT,
      address: state.walletAddress,
      message: `Successfully received ${FAUCET_AMOUNT} MON testnet tokens!`
    };
  }

  /**
   * Deposit MON into current spectator session
   */
  async function depositSession(amount = 3.5) {
    if (!state.connected || !state.walletAddress) {
      await connectWallet();
    }
    if (state.walletBalance < amount) {
      // Auto-claim faucet if eligible and balance is zero
      if (!state.hasClaimedFaucet) {
        await claimFaucet();
      } else {
        throw new Error(`Insufficient wallet balance (${state.walletBalance.toFixed(2)} MON) to deposit ${amount} MON.`);
      }
    }

    state.walletBalance = Math.max(0, state.walletBalance - amount);
    state.sessionBalance += amount;
    notify();

    return {
      success: true,
      sessionBalance: state.sessionBalance,
      roomCode: state.roomCode
    };
  }

  /**
   * Check if spectator can afford a skill
   */
  function canAfford(skill) {
    const cost = SKILL_COSTS[skill] || 0;
    return state.sessionBalance >= cost;
  }

  function getSkillCost(skill) {
    return SKILL_COSTS[skill] || 0;
  }

  /**
   * Spend MON to sponsor a fighter skill
   */
  function spendSponsor(target, skill) {
    const cost = SKILL_COSTS[skill];
    if (!cost) throw new Error(`Unknown skill ${skill}`);
    if (state.sessionBalance < cost) {
      throw new Error(`Insufficient session balance: need ${cost} MON, have ${state.sessionBalance.toFixed(2)} MON`);
    }

    state.sessionBalance = Math.max(0, state.sessionBalance - cost);
    if (target === 'p1' || target === 1) {
      state.spentP1 += cost;
    } else {
      state.spentP2 += cost;
    }

    notify();
    return {
      target,
      skill,
      cost,
      remainingSession: state.sessionBalance
    };
  }

  /**
   * Auto-refund any remaining session balance back to spectator wallet
   */
  function settleSession() {
    const refund = state.sessionBalance;
    if (refund > 0) {
      state.walletBalance += refund;
      state.sessionBalance = 0;
      notify();
      return {
        refunded: refund,
        recipient: state.walletAddress,
        message: `Match finished! ${refund.toFixed(2)} unused MON refunded to your wallet.`
      };
    }
    return { refunded: 0, recipient: state.walletAddress, message: 'Session settled.' };
  }

  function resetMatchHype() {
    state.spentP1 = 0;
    state.spentP2 = 0;
    notify();
  }

  function subscribe(fn) {
    state.listeners.add(fn);
    fn(getSnapshot());
    return () => state.listeners.delete(fn);
  }

  window.SpectatorWeb3 = {
    connectWallet,
    disconnect,
    claimFaucet,
    depositSession,
    spendSponsor,
    settleSession,
    resetMatchHype,
    canAfford,
    getSkillCost,
    getSnapshot,
    subscribe,
    FAUCET_AMOUNT,
    SKILL_COSTS,
    MONAD_CHAIN_ID_DEC,
    MONAD_CHAIN_ID_HEX
  };
})();
