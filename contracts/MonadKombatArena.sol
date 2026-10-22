// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MonadKombatArena
 * @dev On-chain Match Registry, 1-Time 3.5 MON Faucet, and Spectator Escrow for Monad Kombat.
 */
contract MonadKombatArena {
    address public owner;

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
        uint8 winnerTeam; // 1 = A, 2 = B
        uint64 timestamp;
        bool exists;
    }

    struct SpectatorSession {
        uint256 balance;
        uint256 spentP1;
        uint256 spentP2;
        bool active;
    }

    // Faucet state: 1 claim of 3.5 MON per address
    uint256 public constant FAUCET_AMOUNT = 3.5 ether;
    mapping(address => bool) public hasClaimedFaucet;

    // Arena matches & records
    mapping(bytes6 => MatchProof) public matches;
    mapping(address => PlayerRecord) public playerStats;
    bytes6[] public allRoomCodes;

    // Spectator Sessions: roomCode => spectator => session
    mapping(bytes6 => mapping(address => SpectatorSession)) public sessions;

    event MatchSettled(
        bytes6 indexed roomCode,
        address indexed winner,
        address indexed loser,
        string winnerFighter,
        uint256 timestamp
    );

    event PlayerStatsUpdated(
        address indexed player,
        uint32 wins,
        uint32 losses,
        uint32 matchesPlayed
    );

    event FaucetClaimed(
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );

    event SessionDeposited(
        bytes6 indexed roomCode,
        address indexed spectator,
        uint256 amount
    );

    event SkillSponsored(
        bytes6 indexed roomCode,
        address indexed spectator,
        uint8 targetFighter, // 1 = P1, 2 = P2
        uint8 skillTier,     // 1 = 0.5 MON, 2 = 1.0 MON, 3 = 2.0 MON
        uint256 cost
    );

    event SessionSettled(
        bytes6 indexed roomCode,
        address indexed spectator,
        uint256 refunded
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner/oracle can settle");
        _;
    }

    constructor() payable {
        owner = msg.sender;
    }

    receive() external payable {}

    function fundFaucet() external payable {}

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }

    /**
     * @dev Claim 3.5 test MON once per address from the in-app faucet reserve.
     */
    function claimTestnetMon() external {
        require(!hasClaimedFaucet[msg.sender], "Faucet: 3.5 MON already claimed for this wallet");
        require(address(this).balance >= FAUCET_AMOUNT, "Faucet: Reserve temporarily empty");

        hasClaimedFaucet[msg.sender] = true;
        (bool sent, ) = msg.sender.call{value: FAUCET_AMOUNT}("");
        require(sent, "Faucet: Transfer failed");

        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT, block.timestamp);
    }

    /**
     * @dev Deposit session funds before or during spectating an AI vs AI match.
     */
    function depositSession(bytes6 roomCode) external payable {
        require(msg.value > 0, "Deposit must be greater than 0");
        SpectatorSession storage session = sessions[roomCode][msg.sender];
        session.balance += msg.value;
        session.active = true;

        emit SessionDeposited(roomCode, msg.sender, msg.value);
    }

    /**
     * @dev Spend MON from session to sponsor a skill:
     * tier 1 = 0.5 MON (Skill 1)
     * tier 2 = 1.0 MON (Skill 2)
     * tier 3 = 2.0 MON (Ultimate / Skill 3)
     */
    function spendSponsor(bytes6 roomCode, uint8 targetFighter, uint8 skillTier) external {
        require(targetFighter == 1 || targetFighter == 2, "Invalid target fighter");
        uint256 cost;
        if (skillTier == 1) {
            cost = 0.5 ether;
        } else if (skillTier == 2) {
            cost = 1.0 ether;
        } else if (skillTier == 3) {
            cost = 2.0 ether;
        } else {
            revert("Invalid skill tier");
        }

        SpectatorSession storage session = sessions[roomCode][msg.sender];
        require(session.active, "Session not active");
        require(session.balance >= cost, "Insufficient session balance");

        session.balance -= cost;
        if (targetFighter == 1) {
            session.spentP1 += cost;
        } else {
            session.spentP2 += cost;
        }

        emit SkillSponsored(roomCode, msg.sender, targetFighter, skillTier, cost);
    }

    /**
     * @dev Settle spectator session and automatically refund unused funds to the spectator.
     */
    function settleSession(bytes6 roomCode) external {
        SpectatorSession storage session = sessions[roomCode][msg.sender];
        require(session.active, "Session not active");

        uint256 refund = session.balance;
        session.balance = 0;
        session.active = false;

        if (refund > 0) {
            (bool sent, ) = msg.sender.call{value: refund}("");
            require(sent, "Refund transfer failed");
        }

        emit SessionSettled(roomCode, msg.sender, refund);
    }

    function getSession(bytes6 roomCode, address spectator) external view returns (SpectatorSession memory) {
        return sessions[roomCode][spectator];
    }

    function recordMatch(
        bytes6 roomCode,
        address winner,
        address loser,
        string calldata winnerFighter,
        string calldata loserFighter,
        uint8 winnerTeam
    ) external onlyOwner {
        require(!matches[roomCode].exists, "Match already recorded");

        matches[roomCode] = MatchProof({
            roomCode: roomCode,
            winner: winner,
            loser: loser,
            winnerFighter: winnerFighter,
            loserFighter: loserFighter,
            winnerTeam: winnerTeam,
            timestamp: uint64(block.timestamp),
            exists: true
        });

        allRoomCodes.push(roomCode);

        if (winner != address(0)) {
            PlayerRecord storage w = playerStats[winner];
            w.wins += 1;
            w.matchesPlayed += 1;
            w.lastMatchAt = uint64(block.timestamp);
            emit PlayerStatsUpdated(winner, w.wins, w.losses, w.matchesPlayed);
        }

        if (loser != address(0)) {
            PlayerRecord storage l = playerStats[loser];
            l.losses += 1;
            l.matchesPlayed += 1;
            l.lastMatchAt = uint64(block.timestamp);
            emit PlayerStatsUpdated(loser, l.wins, l.losses, l.matchesPlayed);
        }

        emit MatchSettled(roomCode, winner, loser, winnerFighter, block.timestamp);
    }

    function getPlayerStats(address player) external view returns (PlayerRecord memory) {
        return playerStats[player];
    }

    function getMatch(bytes6 roomCode) external view returns (MatchProof memory) {
        require(matches[roomCode].exists, "Match not found");
        return matches[roomCode];
    }

    function totalMatches() external view returns (uint256) {
        return allRoomCodes.length;
    }
}
