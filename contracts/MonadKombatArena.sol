// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MonadKombatArena
 * @dev On-chain Match Registry and Settlement for Monad Kombat on Monad Testnet.
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

    mapping(bytes6 => MatchProof) public matches;
    mapping(address => PlayerRecord) public playerStats;
    bytes6[] public allRoomCodes;

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

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner/oracle can settle");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
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
