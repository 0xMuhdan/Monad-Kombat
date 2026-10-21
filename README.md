# ⚔️ MONAD KOMBAT

> **"Your transaction is your weapon."**  
> *A community powered fighting game where every on-chain transaction can change the battle.*

[![Monad Testnet](https://img.shields.io/badge/Network-Monad_Testnet_(10143)-836ef9?style=for-the-badge&logo=ethereum)](https://testnet.monadexplorer.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Colyseus](https://img.shields.io/badge/Colyseus-Realtime_Netcode-00f0ff?style=for-the-badge)](https://colyseus.io/)
[![Canvas 2D](https://img.shields.io/badge/Canvas_2D-60_FPS-lime?style=for-the-badge)](#)

---

## ⚡ Overview

**MONAD KOMBAT** is a fast-paced 2D cyber-fighting game engineered specifically to leverage the sub-second finality and high throughput of **Monad Testnet**. 

Combining deterministic 60 FPS client-side combat with server-authoritative multiplayer netcode and native smart contract settlements, Monad Kombat proves how high-speed blockchains unlock real-time Web3 gaming experiences without compromising arcade-grade responsiveness.

---

## 🥊 Key Features

- **12 Unique Fighters**: Two rival factions — **COREBOUND** (precision mecha pilots synced to unstable energy nodes) vs **FERALBOUND** (instinctual warriors channeling raw momentum).
  - Fighters: `VEX`, `RIFT`, `NOVA`, `NOX`, `SABLE`, `FORGE`, `JINX`, `AERO`, `ORBIT`, `EMBER`, `KITE`, `MOSS`.
- **Circuit Overdrive [Q / E] (Burst Mechanic)**:
  - Emergency combo-breaker: Blasts away aggressive opponents with a radial neon shockwave.
  - Active Buff: Grants +25% movement speed and +25% attack damage with an electric neon aura for 6 seconds.
- **Server-Authoritative Multiplayer**:
  - WebSocket multiplayer powered by **Colyseus** with tick-rate state synchronization.
  - Private lobby creation, team assignment, mode selection (1v1, 2v2, 3v3), and character locking.
- **Web3 Monad Integration**:
  - **Dual-Mode Login**: Seamless instant ephemeral access or native **MetaMask / Monad Testnet** connection with auto-network switching (Chain ID: `10143`).
  - **On-Chain Match Settlement**: Match winners, room codes, and timestamps are verified and permanently recorded on Monad Testnet via the `BlitzboundArena.sol` smart contract.
  - **Explorer Verification**: Direct links to view match proofs on [Monad Explorer](https://testnet.monadexplorer.com).

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────┐
│                      CLIENT TIER                       │
│  - Canvas 2D Deterministic Engine (60 FPS)             │
│  - Cyberpunk Tournament HUD & Dynamic Roster Previews  │
│  - Web3 EIP-1193 MetaMask Integration (Chain ID 10143) │
└───────────────────────┬────────────────────────────────┘
                        │
         WebSocket / HTTP API (Port 2567)
                        │
┌───────────────────────▼────────────────────────────────┐
│                     SERVER TIER                        │
│  - Colyseus Realtime Room Management (matchroom.ts)    │
│  - Anti-Cheat & Authoritative Hitbox/Physics Engine    │
│  - Viem Monad Testnet Automated Settlement Oracle      │
└───────────────────────┬────────────────────────────────┘
                        │
          RPC JSON-RPC (https://testnet-rpc.monad.xyz)
                        │
┌───────────────────────▼────────────────────────────────┐
│                 MONAD TESTNET (10143)                  │
│  - Smart Contract: BlitzboundArena.sol                 │
│  - Proof-of-Fight Match Registry & Combat Records      │
│  - Sub-Second Finality Settlement                      │
└────────────────────────────────────────────────────────┘
```

---

## 🎮 Controls

| Action | Keyboard |
| :--- | :--- |
| **Move** | `A` (Left) / `D` (Right) |
| **Dash / Run** | Double-tap `A` or `D` |
| **Jump** | `W` |
| **Crouch / Fast Fall** | `S` |
| **Roll** | Double-tap `S` |
| **Basic Combo** | `SPACE` (3-hit chain) |
| **Skill 1** | `I` |
| **Skill 2** | `O` |
| **Ultimate (Cut-in)** | `P` |
| **Circuit Overdrive (Burst)** | `Q` or `E` |
| **Pause / Menu** | `ESC` |
| **Reset (Training)** | `R` |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v20+ or v22+
- Git

### 1. Installation
```powershell
npm install
cd server; npm install; cd ..
```

### 2. Configure Environment
Copy the example configuration:
```powershell
Copy-Item server/.env.example server/.env
```
Default `server/.env` configuration:
```env
PORT=2567
MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz
MONAD_TESTNET_CHAIN_ID=10143
ENABLE_MONAD_MILESTONES=false
```

### 3. Run Development Servers
Open two terminal windows:

**Terminal 1 — Backend Colyseus & API Server (Port 2567):**
```powershell
npm run server
```

**Terminal 2 — Frontend Web Server:**
```powershell
npm run dev
```

Open your browser at `http://localhost:8000` (or the port shown by Vite).

---

## 📜 Smart Contract Deployment

To compile and deploy the `BlitzboundArena.sol` contract to Monad Testnet:

```powershell
npm run deploy:contract
```

The script will display the deployer wallet address and check its MON balance. Once funded via the [Monad Testnet Faucet](https://testnet.monad.xyz), re-running the command will deploy the contract with sub-second confirmation and automatically configure `server/.env`.
