<div align="center">

# ⚔️ MONAD KOMBAT
### *Deterministic 60 FPS Cyber-Arcade // On-Chain Warfare on Monad*

**"Your transaction is your weapon."**  
*The first real-time arcade fighting game engineered natively for Monad’s parallel execution, 10,000 TPS, and sub-second finality.*

[![Monad Testnet](https://img.shields.io/badge/Network-Monad_Testnet_(Chain_ID:_10143)-836ef9?style=for-the-badge&logo=ethereum)](https://testnet.monadexplorer.com)
[![Smart Contract](https://img.shields.io/badge/Solidity-0.8.20_Escrow_+_Settlement-363636?style=for-the-badge&logo=solidity)](contracts/MonadKombatArena.sol)
[![Colyseus 30Hz](https://img.shields.io/badge/Realtime_Netcode-Colyseus_Authoritative-00f0ff?style=for-the-badge)](https://colyseus.io/)
[![Canvas 2D 60FPS](https://img.shields.io/badge/Client_Engine-60_FPS_Deterministic-lime?style=for-the-badge)](#)
[![Tests Passing](https://img.shields.io/badge/Test_Suite-15%2F15_PASS-brightgreen?style=for-the-badge)](tests/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

<br/>

**[▶️ Play Live Demo in Browser](https://monad-kombat.vercel.app)** *(No install required, Desktop & Mobile)*

<br/>

[🌟 Executive Summary](#-executive-summary--why-monad) • [⚖️ Judge Evaluation Rubric](#-judge-evaluation--hackathon-rubric) • [🥊 Combat Engine](#-deep-combat-mechanics) • [🏟️ AI Colosseum & Escrow](#-ai-colosseum--live-web3-spectator-escrow)  
[🥋 12 Champions Matrix](#-the-12-champions-matrix) • [🏗️ Technical Architecture](#-technical-architecture) • [📜 Smart Contract Deep Dive](#-smart-contract-deep-dive-monadkombatarenasol) • [🚀 Quick Start](#-quick-start--local-development)

</div>

---

## 🌟 Executive Summary: Why Monad?

For years, Web3 gaming has been paralyzed by blockchain limitations:
* **Turn-Based Bottlenecks**: Developers were forced into slow, turn-based card or board games because block times were too sluggish.
* **Fake Web3**: Other games merely bolted an NFT skin onto an off-chain game with zero meaningful on-chain combat logic.

**MONAD KOMBAT proves what high-throughput, sub-second finality blockchains were truly meant for.**

By integrating with **Monad Testnet (10,000 TPS, 1-second block times, instant finality)**, Monad Kombat establishes an entirely new genre: **Real-Time On-Chain Arcade Combat**:
1. **Uncompromised 60 FPS Mechanics**: Microsecond-responsive combos, air dashes, burst breakers, and hitbox cancels.
2. **Authoritative Anti-Cheat Netcode**: Server-synchronized 30 Hz Colyseus rooms enforce hitbox validation, eliminating client-side manipulation.
3. **On-Chain Proof-of-Fight™**: Match outcomes, kill counts, and player wallets are permanently sealed onto Monad Testnet within the same second the K.O. occurs.
4. **Live Interactive Web3 Spectator Escrow**: Audiences in the AI Colosseum can sponsor fighters with real testnet MON, triggering real-time in-game buffs protected by smart contract session escrows and automated refunds.

---

## ⚖️ Judge Evaluation & Hackathon Rubric

| Judging Criteria | How Monad Kombat Delivers | Verification Point |
| :--- | :--- | :--- |
| **Monad Ecosystem Integration** | Native Monad Testnet (`Chain ID 10143`), automated settlement oracle via Viem, in-app testnet MON faucet, and on-chain spectator escrow. | [`contracts/MonadKombatArena.sol`](contracts/MonadKombatArena.sol) & [`server/src/onchain.ts`](server/src/onchain.ts) |
| **Technical Complexity** | Hybrid architecture uniting a 60 FPS deterministic Canvas 2D engine with a 30 Hz server-authoritative Colyseus WebSocket cluster and automated on-chain settlement. | [`server/src/matchroom.ts`](server/src/matchroom.ts) & [`game.js`](game.js) |
| **Game Design & Polish** | 12 distinct characters with unique frame data, 3-hit cancel chains, fullscreen cinematic cut-ins with voice acting, 4-tier reactive AI, and mobile touch support. | [`fighter-registry.js`](fighter-registry.js) & [`offline-lab.html`](offline-lab.html) |
| **Real Web3 Utility** | Not just a game: features an **AI Colosseum** where decentralized audiences deposit session funds, sponsor live skill buffs, and vote with real-time hype meters. | [`ai-arena.html`](ai-arena.html) & [`spectator-web3.js`](spectator-web3.js) |
| **Execution & Reliability** | 15 automated test suites covering fighter state synchronization, combat physics, damage limits, and smart contract escrow guarantees. | `npm test` (15/15 PASS) |

---

## 💥 Deep Combat Mechanics

Monad Kombat was engineered with the depth expected of tournament fighting titles:

```
[Basic Strike 1] ──► [Basic Strike 2] ──► [Finisher Strike 3] (Knockback)
        │                     │
        ▼ (Cancel)            ▼ (Cancel)
   [Skill 1: Projectile]  [Skill 2: Area Impact]
        │                     │
        └──────────┬──────────┘
                   ▼ (Super Cancel)
          [Ultimate Ability: Fullscreen Cinematic Cut-In]
```

### 1. ⚡ Circuit Overdrive (`Q` / `E` Burst)
* **Emergency Combo Breaker**: When caught in a deadly juggle, trigger Circuit Overdrive to emit a radial neon shockwave that knocks back the aggressor.
* **Overdrive Surge**: Grants a temporary **+25% Movement Speed** and **+25% Attack Damage** boost with an active electric aura for 6 seconds.
* **Tactical Resource**: 22-second cooldown prevents spamming and rewards tactical deployment.

### 2. 🥋 Frame-Perfect Normal Cancels
* A fluid 3-hit standard chain (`Space` -> `Space` -> `Space`) can be interrupted at any frame into **Skill 1 (`I`)** or **Skill 2 (`O`)**.
* Skills feature specific launch and juggle properties, allowing players to discover high-damage custom corner combos.

### 3. 🤖 4-Tier Adaptive CPU Neural AI
* **Easy, Medium, Hard, Excellent**:
* The AI dynamically calculates frame advantages: it dodges incoming projectiles, punishes whiffed attacks during recovery frames, performs anti-air counter-strikes against jumping players, and confirms combo extensions only when previous hits connect.

---

## 🏟️ AI Colosseum & Live Web3 Spectator Escrow

Beyond direct PvP combat, Monad Kombat introduces the **AI Colosseum** (`ai-arena.html`): an autonomous battleground designed for the decentralized community.

```
       [ Decentralized Audience / Spectators ]
                          │
          1-Click Faucet (Claim 3.5 MON)
          Deposit Session Escrow (depositSession)
                          │
         ┌────────────────┴────────────────┐
         ▼                                 ▼
   Sponsor CPU 1 (VEX)              Sponsor CPU 2 (RIFT)
   Tier 1: 0.5 MON (Skill 1)        Tier 1: 0.5 MON (Skill 1)
   Tier 2: 1.0 MON (Skill 2)        Tier 2: 1.0 MON (Skill 2)
   Tier 3: 2.0 MON (Ultimate)       Tier 3: 2.0 MON (Ultimate)
         │                                 │
         └────────────────┬────────────────┘
                          ▼
           [ Realtime Colyseus Room Sync ]
           - Live Visual Skill Cast Triggered
           - Audience Hype Meter Recalculated
           - Automated Escrow Settlement & Refund
```

### Spectator Features:
1. **Smart Contract Escrow**: Spectators deposit session funds via `depositSession(roomCode)`. Unused MON is automatically refunded with zero lockup penalty upon leaving via `settleSession(roomCode)`.
2. **Real-Time Sponsorship Triggers**: When a spectator spends MON on a skill tier, the Colyseus server immediately broadcasts the boost to the AI combatants, triggering special moves or instant ultimate attacks mid-fight.
3. **Audience Hype Meter**: Community voting tracks real-time crowd favoritism across both combatants.
4. **Built-in 3.5 MON Faucet**: Anyone can click **"CLAIM 3.5 MON"** inside the topbar to receive testnet funds directly from the contract's reserve without leaving the arena.

---

## 🥊 The 12 Champions Matrix

Two rival philosophies clash in the arena: **COREBOUND** (cybernetic mecha pilots tuned to quantum energy nodes) and **FERALBOUND** (bio-kinetic demi-human warriors channeling primal force).

| Fighter | Faction | Playstyle Archetype | Key Ability | Signature Ultimate |
| :--- | :---: | :--- | :--- | :--- |
| **VEX** | `COREBOUND` | Heavy Brawler / Drone Summoner | Blitz Bolt (16 DMG) | *Helios Squadron* (Orbital Beam) |
| **RIFT** | `FERALBOUND` | Agile Stalker / Lycan Transformation | Gale Rush (16 DMG) | *Feral Awakening* (Beast Rampage) |
| **NOVA** | `COREBOUND` | Artillery Heavy / Missile Battery | Rocket Salvo (16 DMG) | *Rocket Parade* (Multi-Missile Barrage) |
| **NOX** | `FERALBOUND` | Aerial Assassin / Raven Swarm | Feather Gust (16 DMG) | *Night Murmuration* (Shadow Daggers) |
| **SABLE** | `FERALBOUND` | Mid-Range Zoner / Urumi Steel Whip | Viper Lash (16 DMG) | *Dune Serpent* (Sand Quake) |
| **FORGE** | `COREBOUND` | Unstoppable Tank / Steam Forge Hammer | Steam Impact (16 DMG) | *Forge Quake* (Geothermal Stomp) |
| **JINX** | `COREBOUND` | Trickster / Dual Scissor Blades | Scissor Snatch (16 DMG) | *Grand Finale* (Bladed Ring Trap) |
| **AERO** | `COREBOUND` | High-Mobility Lancer / Stilt-Leg Charges | Frost Piercer (16 DMG) | *Skyfall Lances* (Glacial Drop) |
| **ORBIT** | `COREBOUND` | Gravity Controller / Planetary Spheres | Graviton Burst (16 DMG) | *Grand Orrery* (Singularity Well) |
| **EMBER** | `FERALBOUND` | Heavy Greatsword / Solar Channeler | Sun Crescent (16 DMG) | *Sunmane Roar* (Solar Shockwave) |
| **KITE** | `FERALBOUND` | Rushdown Scout / Twin Baton Flurry | Baton Rush (16 DMG) | *Special Delivery* (Rapid Aerial Striking) |
| **MOSS** | `FERALBOUND` | Counter Specialist / Shell Bastion | Staff Stomp (16 DMG) | *Elder Tortoise* (Spirit Earthshaker) |

---

## 🏗️ Technical Architecture

Monad Kombat separates high-frequency gameplay loop requirements from consensus settlement:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT PRESENTATION TIER                        │
│  - HTML5 Canvas 2D: Deterministic 60 FPS update cycle                  │
│  - Web Audio API: Dynamic Announcer, Hit Reaction SFX, & BGM          │
│  - Dual-Mode Web3 Auth: Ephemeral PIN Wallet or EIP-1193 MetaMask      │
│  - Mobile Engine: Landscape orientation lock + Virtual D-Pad / MOBA Pad│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │  HTTP REST & WebSocket (Port 2567)
┌───────────────────────────────────▼────────────────────────────────────┐
│                       SERVER-AUTHORITATIVE TIER                        │
│  - Colyseus Room Controller (matchroom.ts, lobby.ts)                   │
│  - Authoritative 30 Hz Simulation Loop (Input validation, hitboxes)    │
│  - State Synchronization: Delta snapshots dispatched to all peers      │
│  - Automated Viem Settlement Oracle (Instant match finalization)       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │  JSON-RPC (https://testnet-rpc.monad.xyz)
┌───────────────────────────────────▼────────────────────────────────────┐
│                         MONAD TESTNET (10143)                          │
│  - Smart Contract: MonadKombatArena.sol                                │
│  - Proof-of-Fight™ Immutable Match Registry (Room code, winner, kills) │
│  - Permanent EOA Career Stats (Wins, Losses, Matches Played)           │
│  - Spectator Escrow & In-App Testnet MON Faucet Dispenser              │
│  - Sub-Second Finality Explorer Verification                           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📜 Smart Contract Deep Dive: `MonadKombatArena.sol`

Located at [`contracts/MonadKombatArena.sol`](contracts/MonadKombatArena.sol), compiled and verified for **Monad Testnet**:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MonadKombatArena {
    struct PlayerRecord {
        uint32 wins;
        uint32 losses;
        uint32 eliminations;
        uint32 matchesPlayed;
        uint64 lastMatchAt;
    }

    struct MatchProof {
        bytes6 roomCode;
        address winner;
        address loser;
        string winnerFighter;
        string loserFighter;
        uint8 winnerTeam; // 1 = Team A, 2 = Team B
        uint64 timestamp;
        bool exists;
    }

    struct SpectatorSession {
        uint256 balance;
        uint256 spentP1;
        uint256 spentP2;
        bool active;
    }

    // 1-Click Faucet: 3.5 MON per address
    uint256 public constant FAUCET_AMOUNT = 3.5 ether;
    mapping(address => bool) public hasClaimedFaucet;

    // Arena mappings
    mapping(bytes6 => MatchProof) public matches;
    mapping(address => PlayerRecord) public playerStats;
    mapping(bytes6 => mapping(address => SpectatorSession)) public sessions;

    // Critical interface methods:
    function claimTestnetMon() external;
    function depositSession(bytes6 roomCode) external payable;
    function spendSponsor(bytes6 roomCode, uint8 targetFighter, uint8 skillTier) external;
    function settleSession(bytes6 roomCode) external;
    function recordMatch(bytes6 roomCode, address winner, address loser, string calldata winnerFighter, string calldata loserFighter, uint8 winnerTeam) external onlyOwner;
}
```

---

## 🎮 Arcade Keybindings & Controls

| Command | Action | Description |
| :--- | :--- | :--- |
| `A` / `D` | **Walk / Position** | 320 px/s deterministic horizontal movement |
| **Double-tap** `A` / `D` | **Combat Dash / Run** | 520 px/s burst velocity |
| `W` | **Jump / Double Jump** | 830 px/s impulse; press mid-air for double jump |
| `S` | **Crouch / Fast Fall** | Drops faster to ground from aerial positions |
| **Double-tap** `S` | **Combat Roll** | Invulnerable roll across ground plane |
| `SPACE` | **Basic Attack** | 3-hit progressive combo chain (6 -> 8 -> 12 DMG) |
| `I` | **Skill 1** | Fast projectile or tactical tool (16 DMG, 3s CD) |
| `O` | **Skill 2** | Heavy area attack or launcher (24 DMG, 6s CD) |
| `P` | **Ultimate Ability** | Fullscreen anime cut-in with voice line |
| `Q` or `E` | **Circuit Overdrive** | Emergency combo-breaker shockwave + buff |
| `ESC` | **Pause / Settings** | Audio levels, hitbox toggle, fullscreen |
| `R` | **Reset Training** | Instant arena reset (Training Mode) |

*📱 On smartphones and tablets, Monad Kombat automatically rotates into a fullscreen landscape layout featuring a responsive virtual D-Pad and MOBA-style radial buttons with cooldown clocks.*

---

## 🚀 Quick Start & Local Development

### Prerequisites
* **Node.js**: v20+ or v22+
* **Git**

### 1. Installation
```bash
git clone https://github.com/0xMuhdan/Monad-Kombat.git
cd Monad-Kombat
npm install
cd server && npm install && cd ..
```

### 2. Environment Setup
```bash
cp server/.env.example server/.env
```
Default `server/.env` contents:
```env
PORT=2567
MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz
MONAD_TESTNET_CHAIN_ID=10143
ENABLE_MONAD_MILESTONES=false
DEPLOYER_PRIVATE_KEY=0xa53eccfa56a38e148424f3625d55f2436b3638869e884022b9fadc00aede75b5
```

### 3. Run Automated Test Suite
Execute the 15-test battery validating lobby convergence, rejected selection handling, physics, server hitboxes, and smart contract escrow ABI:
```bash
npm test
```
*Expected: 15 tests passed, 0 failures, 0 TypeScript errors.*

### 4. Launch Development Environment
```bash
# Terminal 1 — Realtime WebSocket & Settlement Oracle:
npm run server

# Terminal 2 — Frontend Development Server:
npm run dev
```

Open `http://localhost:8000` to enter the arena!

---

## 📦 Production Deployment

### Client Static Bundle (Vercel / Netlify / Cloudflare Pages)
```bash
npm run build
```
Vite automatically builds and copies all 277 game assets, sound banks, spritesheets, and HTML entry points into `dist/`. Deploy the `dist/` folder directly to any static CDN host.

### Colyseus Multiplayer & Settlement Server (Render / Railway / VPS)
```bash
npm --prefix server run build
npm --prefix server run start
```
Configure environment variables:
* `PORT=2567`
* `MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz`
* `MONAD_TESTNET_CHAIN_ID=10143`
* `DEPLOYER_PRIVATE_KEY=<your_deployer_key>`

---

## 🛡️ License & Attributions

* **Source Code**: [MIT License](LICENSE)
* **Assets & Media**: [CC BY-NC 4.0](LICENSE-ASSETS.md)
* **Font**: SIL Open Font License ([Rajdhani](assets/fonts/OFL.txt))

---

<div align="center">

**MONAD KOMBAT**  
*Built with passion for the Monad ecosystem.*  
*Where competitive arcade gameplay meets sub-second blockchain finality.*

</div>
