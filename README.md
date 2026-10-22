<div align="center">

# ⚔️ MONAD KOMBAT
### *Your Transaction Is Your Weapon.*

**The Next-Generation 2D Cyber-Fighter Powered by Monad Blockchain.**  
*Sub-second finality meets 60 FPS deterministic combat. Every combo counts, every match is verified on-chain.*

[![Monad Testnet](https://img.shields.io/badge/Network-Monad_Testnet_(10143)-836ef9?style=for-the-badge&logo=ethereum)](https://testnet.monadexplorer.com)
[![Smart Contract](https://img.shields.io/badge/Solidity-0.8.20-363636?style=for-the-badge&logo=solidity)](contracts/MonadKombatArena.sol)
[![Colyseus](https://img.shields.io/badge/Colyseus-Realtime_Netcode-00f0ff?style=for-the-badge)](https://colyseus.io/)
[![Canvas 2D](https://img.shields.io/badge/Engine-60_FPS_Deterministic-lime?style=for-the-badge)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

<br/>

[🕹️ Live Demo](https://monad-kombat.vercel.app) • [📖 Architecture](#-architecture-hybrid-web3-netcode) • [🥊 Fighter Roster](#-the-12-champions) • [⛓️ On-Chain Settlement](#-on-chain-proof-of-fight) • [🚀 Quick Start](#-quick-start-guide)

</div>

---

## ⚡ The Vision: Web3 Arcade Without Compromise

Legacy blockchain games forced players to choose between **sluggish on-chain turns** or **disconnected off-chain gameplay with arbitrary token gating**.

**MONAD KOMBAT shatters this paradigm.**

By harnessing **Monad’s 10,000 TPS, 1-second block times, and sub-second transaction finality**, Monad Kombat delivers an authentic arcade fighting experience:
- **Zero-Latency Inputs**: 60 FPS deterministic client prediction with zero input lag.
- **Server-Authoritative Fairness**: 30 Hz Colyseus tickrate eliminates client-side tampering, desyncs, and rage-quits.
- **Proof-of-Fight™ Settlement**: Match results, eliminations, winner/loser wallet addresses, and timestamps are sealed directly on Monad Testnet via `MonadKombatArena.sol` the moment the final K.O. lands.

> *"In Monad Kombat, speed is not a feature — it's survival."*

---

## 💥 Groundbreaking Combat Mechanics

### 1. ⚡ Circuit Overdrive (`Q` / `E` Burst)
An emergency defensive combo-breaker and momentum shifter:
- **Radial Shockwave**: Immediately interrupts opponent rushdown and blasts aggressive enemies backward.
- **Overdrive Surge**: Grants a **+25% Movement Speed** and **+25% Attack Damage** buff with an electrifying neon aura for 6 seconds.
- **Tactical Cooldown**: 22-second cooldown requires high-stakes timing.

### 2. 🥋 Frame-Perfect Cancel Chains
- **3-Hit Basic Attack**: Smooth hit-confirm chains (`Space` -> `Space` -> `Space`) with progressive knockback.
- **Special Skill Cancels**: Cancel basic normals instantly into **Skill 1 (`I`)** or **Skill 2 (`O`)** to extend juggles.
- **Cinematic Ultimates (`P`)**: Fullscreen anime cut-ins summoning independent strikes that continue while the player repositions.

### 3. 🤖 Deep Reactive CPU Brain
- **4 AI Intelligence Levels**: *Easy, Medium, Hard, Excellent*.
- The CPU dynamically tracks frame advantages, punishes whiffs, ant-airs jumping approaches, dodges projectiles, and only commits to follow-ups when hits actually land.

### 4. 🏟️ AI Colosseum & Web3 Spectator Arena
- **Live Autonomous Battles**: Spectators gather in real-time rooms to watch high-level CPU vs CPU clashes.
- **On-Chain Skill Sponsorship**: Spectators deposit session funds to trigger real-time skill boosts and ultimate strikes for their chosen fighter with instant visual feedback.
- **Interactive Audience Hype Meter**: Dynamic community voting tracks audience sentiment live across the round.
- **In-App Testnet Faucet**: 1-click testnet MON dispenser built directly into the arena interface so anyone can jump into the action immediately.

---

## 🥊 The 12 Champions

Twelve fighters battle across two ideological factions: **COREBOUND** (precision cybernetic chassis tuned to high-frequency energy cores) and **FERALBOUND** (instinctual demibeast warriors channeling raw kinetic momentum).

| Fighter | Faction | Combat Archetype | Signature Ultimate |
| :--- | :---: | :--- | :--- |
| **VEX** | `COREBOUND` | Heavy Brawler / Drone Support | *Helios Squadron* (Orbital Laser) |
| **RIFT** | `FERALBOUND` | Agile / Beast Transformation | *Feral Awakening* (Werewolf Rampage) |
| **NOVA** | `COREBOUND` | Heavy Mech / Ballistic Barrage | *Rocket Parade* (Multi-Missile Salvo) |
| **NOX** | `FERALBOUND` | Aerial Assassin / Raven Swarm | *Night Murmuration* (Shadow Dagger) |
| **SABLE** | `FERALBOUND` | Mid-Range / Urumi Whip & Serpent | *Dune Serpent* (Coiling Quake) |
| **FORGE** | `COREBOUND` | Superheavy Tank / Steam Forge Hammer | *Forge Quake* (Geothermal Stomp) |
| **JINX** | `COREBOUND` | Trickster / Dual Clockwork Blades | *Grand Finale* (Bladed Ring Trap) |
| **AERO** | `COREBOUND` | Piercing Lancer / Stilt-Leg Charges | *Skyfall Lances* (Glacial Piercer) |
| **ORBIT** | `COREBOUND` | Gravitational Zoner / Orrery Spheres | *Grand Orrery* (Singularity Well) |
| **EMBER** | `FERALBOUND` | Sunmane Powerhouse / Greatsword | *Sunmane Roar* (Solar Shockwave) |
| **KITE** | `FERALBOUND` | Rushdown Courier / Twin Batons | *Special Delivery* (Baton Flurry) |
| **MOSS** | `FERALBOUND` | Guardian / Shell Counter Defender | *Elder Tortoise* (Spirit Earthshaker) |

---

## 🏗️ Architecture: Hybrid Web3 Netcode

Monad Kombat marries high-performance WebSockets with Monad's parallelized execution layer:

```
┌────────────────────────────────────────────────────────┐
│                      CLIENT TIER                       │
│  - 60 FPS Deterministic Canvas 2D Engine               │
│  - Cyberpunk Tournament HUD & Pilot Dashboard          │
│  - EIP-1193 MetaMask Integration (Monad Chain ID 10143)│
└───────────────────────┬────────────────────────────────┘
                        │  HTTP (REST) & Colyseus WebSocket (Port 2567)
┌───────────────────────▼────────────────────────────────┐
│                     SERVER TIER                        │
│  - Colyseus Realtime Room Cluster (matchroom.ts)       │
│  - Authoritative 30 Hz Physics, Damage & Anti-Cheat    │
│  - Automated Viem Settlement Oracle                    │
└───────────────────────┬────────────────────────────────┘
                        │  JSON-RPC (https://testnet-rpc.monad.xyz)
┌───────────────────────▼────────────────────────────────┐
│                 MONAD TESTNET (10143)                  │
│  - Smart Contract: MonadKombatArena.sol                │
│  - Proof-of-Fight™ Immutable Match Registry            │
│  - Player Career Records (Wins, Losses, Eliminations)  │
│  - Sub-Second Finality Settlement Verification         │
└────────────────────────────────────────────────────────┘
```

---

## ⛓️ On-Chain Proof-of-Fight™

The core smart contract [`contracts/MonadKombatArena.sol`](contracts/MonadKombatArena.sol) acts as the decentralized combat registry on **Monad Testnet**:

```solidity
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
```

### Key On-Chain Capabilities:
* **Tamper-Proof Match Settlement**: Only the authorized game oracle can record verified match outcomes.
* **Player Combat Passports**: Lifelong on-chain stats tracking (`wins`, `losses`, `eliminations`, `matchesPlayed`, `lastMatchAt`).
* **Direct Explorer Verification**: Every match outcome links directly to the transaction proof on [Monad Explorer](https://testnet.monadexplorer.com).

---

## 🎮 Arcade Keybindings

| Command | Action |
| :--- | :--- |
| `A` / `D` | Move Left / Right |
| Double-tap `A` / `D` | High-Speed Dash / Run |
| `W` | Jump (Press in mid-air to Double Jump) |
| `S` | Crouch / Fast Fall in air |
| Double-tap `S` | Evasive Combat Roll |
| `SPACE` | Basic 3-Hit Strike Chain |
| `I` | Skill 1 (Projectile / Special) |
| `O` | Skill 2 (Area Damage / Gap Closer) |
| `P` | **Ultimate Ability** (Cinematic Cut-In) |
| `Q` or `E` | **Circuit Overdrive** (Emergency Burst Shockwave) |
| `ESC` | Pause / Settings Menu |
| `R` | Reset Position (Training Mode) |

*📱 Touch controls with MOBA-style radial buttons and virtual D-pad activate automatically on mobile devices.*

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) v20+ or v22+
- Git

### 1. Clone & Install
```bash
git clone https://github.com/0xMuhdan/Monad-Kombat.git
cd Monad-Kombat
npm install
cd server && npm install && cd ..
```

### 2. Configure Environment
```bash
# Server configuration
cp server/.env.example server/.env
```
Default `server/.env` template:
```env
PORT=2567
MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz
MONAD_TESTNET_CHAIN_ID=10143
ENABLE_MONAD_MILESTONES=false
DEPLOYER_PRIVATE_KEY=your_private_key_here
```

### 3. Run Automated Tests
Verify all 15 combat mechanics, lobby sync, and room preservation tests:
```bash
npm test
```

### 4. Start Local Development
Run backend server and frontend client concurrently:

```bash
# Terminal 1 — Start Realtime Colyseus Game Server & Oracle:
npm run server

# Terminal 2 — Start Vite Client:
npm run dev
```

Open `http://localhost:8000` in your browser and enter the arena!

---

## 📦 Production Deployment

### Static Frontend (Vercel / Cloudflare / Netlify)
The frontend build is completely self-contained with zero runtime dependencies:
```bash
npm run build
```
Deploy the generated `/dist` folder. All game assets (audio, sprites, fonts, stylesheets) are automatically packaged and pre-cached via service workers.

### Realtime Backend (Render / Railway / VPS)
Run on any persistent Node.js runtime:
```bash
npm --prefix server run build
npm --prefix server run start
```

---

## 🛡️ License

* **Source Code**: [MIT License](LICENSE)
* **Visual & Audio Assets**: [CC BY-NC 4.0](LICENSE-ASSETS.md)
* **Typography**: SIL Open Font License ([Rajdhani](assets/fonts/OFL.txt))

---

<div align="center">
  <sub>Built with passion for the Monad Ecosystem. Monad Kombat proves that Web3 games can be instant, beautiful, and competitive.</sub>
</div>
