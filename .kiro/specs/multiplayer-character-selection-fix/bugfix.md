# Bugfix Requirements Document

## Introduction

Fix the Blitzbound multiplayer create-room lobby so a player can select a different fighter and see the selected fighter reflected immediately and consistently in the lobby preview and room state. The fix covers the client lobby selection flow and its synchronization with the authoritative room state, while preserving backend room rules, canonical fighter IDs, display-name mapping, character assets, and existing offline lab behavior.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a player opens a multiplayer create-room lobby whose initial fighter preview is VEX and clicks another available fighter such as RIFT or NOVA THEN the lobby may continue displaying VEX in the large selected-fighter preview instead of the clicked fighter.

1.2 WHEN a player selects a fighter and the lobby refreshes or receives room state from the multiplayer synchronization path THEN the selected preview may be rebuilt from stale, mismatched, or non-canonical fighter state, causing the preview and roster selection indicator to disagree.

1.3 WHEN a player changes fighter in the multiplayer lobby THEN the visible preview, canonical room `fighterId`, display name, alignment/details, and corresponding character artwork are not guaranteed to update as one synchronized selection.

### Expected Behavior (Correct)

2.1 WHEN a player clicks an available fighter in the multiplayer create-room lobby THEN the system SHALL submit that fighter's canonical ID to the authoritative room action and update the player's room state without reverting to the default VEX selection.

2.2 WHEN the authoritative room state confirms a fighter selection or is refreshed after selection THEN the system SHALL render the selected fighter's preview image, canonical display name, alignment/details, and roster selected state from the same canonical fighter ID.

2.3 WHEN a player selects any available canonical fighter, including VEX, RIFT, NOVA, NOX, SABLE, FORGE, JINX, AERO, ORBIT, EMBER, KITE, or MOSS THEN the system SHALL show that fighter in the player's multiplayer preview and preserve the selection across normal lobby polling or realtime state updates.

2.4 WHEN another player selects or changes a fighter THEN the system SHALL update room occupancy and availability from authoritative room state, keeping already-selected fighters unavailable to other players while allowing the current player to retain and display their own selection.

2.5 WHEN a fighter selection request is rejected by backend room rules THEN the system SHALL keep the last authoritative selection, show the returned error, and SHALL NOT present an unconfirmed preview as if it were saved.

2.6 WHEN a player selects a fighter in the multiplayer lobby THEN the system SHALL use the existing canonical fighter IDs, display-name mapping, and corresponding character assets, without changing backend uniqueness, team, ready, capacity, or start-match rules.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a player selects a fighter that is already selected by another room participant THEN the system SHALL CONTINUE TO reject the duplicate according to existing backend uniqueness rules and keep the fighter unavailable in the roster.

3.2 WHEN a player has not joined a team THEN the system SHALL CONTINUE TO require team selection before accepting a fighter selection.

3.3 WHEN the host changes room mode, players join teams, players ready up, or the host starts a valid room THEN the system SHALL CONTINUE TO enforce the existing room capacity, host authorization, readiness, and complete-team rules.

3.4 WHEN the multiplayer room transitions to a match THEN the system SHALL CONTINUE TO pass the selected canonical fighter IDs into the match roster without renaming or remapping them to legacy IDs.

3.5 WHEN a player uses the offline lab character-selection flow THEN the system SHALL CONTINUE to behave as it does today, independently of the multiplayer lobby selection fix.

3.6 WHEN the lobby renders a canonical fighter or its established legacy asset mapping THEN the system SHALL CONTINUE to use the existing character assets and Blitzbound-facing display names, including VEX/RIFT/NOVA and the remaining roster names.

### Bug Condition and Properties

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type MultiplayerLobbySelection
  OUTPUT: boolean

  RETURN X.action = "select fighter"
    AND X.fighterId is an available canonical fighter ID
    AND (X.previewAfterAction != X.fighterId
         OR X.rosterSelectionAfterRefresh != X.fighterId
         OR X.authoritativeRoomState.fighterId != X.fighterId)
END FUNCTION
```

```pascal
// Property: Fix Checking
FOR ALL X WHERE isBugCondition(X) DO
  result ← selectFighter'(X)
  ASSERT result.authoritativeRoomState.fighterId = X.fighterId
    AND result.preview.fighterId = X.fighterId
    AND result.rosterSelection.fighterId = X.fighterId
    AND result.preview.displayName = canonicalDisplayName(X.fighterId)
    AND result.preview.asset = canonicalAsset(X.fighterId)
END FOR
```

```pascal
// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT F(X).roomRules = F'(X).roomRules
    AND F(X).canonicalIDs = F'(X).canonicalIDs
    AND F(X).displayNames = F'(X).displayNames
    AND F(X).characterAssets = F'(X).characterAssets
    AND F(X).offlineLabBehavior = F'(X).offlineLabBehavior
END FOR
```
