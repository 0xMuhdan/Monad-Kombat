# Multiplayer Character Selection Fix Bugfix Design

## Overview

The multiplayer create-room lobby can display VEX after a player selects another fighter, or can show a preview and roster indicator that disagree after a refresh. The authoritative room service already accepts canonical fighter IDs and enforces uniqueness, team membership, capacity, readiness, and host rules. The defect is in the client selection and synchronization flow: `lobby.html` submits selections through HTTP but renders on a polling cycle, while the reusable Colyseus lobby client is not connected to that page; additionally, preview rendering derives a legacy-to-canonical fallback separately from the selected roster state.

The fix will keep the backend rules and fighter registry unchanged, establish one authoritative room-state update path for the lobby, and render the roster and large preview from the same current player's canonical `fighterId`. A rejected action will leave the last confirmed room state visible rather than displaying an optimistic or default selection.

## Glossary

- **Bug_Condition (C)**: A valid canonical fighter selection whose confirmed room state, preview, or roster selection does not identify the selected fighter.
- **Property (P)**: For a valid selection, the authoritative room state, roster indicator, preview metadata, and artwork all identify the same canonical fighter.
- **Preservation**: Existing server validation, canonical IDs, fighter uniqueness, room lifecycle rules, asset mappings, and offline-lab behavior remain unchanged.
- **Canonical fighter ID**: One of `vex`, `rift`, `nova`, `nox`, `sable`, `forge`, `jinx`, `aero`, `orbit`, `ember`, `kite`, or `moss`.
- **Legacy fighter ID**: Historical IDs such as `arco` or `fenr`, retained only for established asset/name compatibility in the registry and not introduced into new room state.
- **Authoritative room state**: The `Room` returned by the HTTP room API or emitted by the Colyseus `lobby` message after the server applies an action.
- **Selection view model**: The single canonical fighter record used to render the player's preview and roster selection state.

## Bug Details

### Bug Condition

The bug manifests when a player clicks an available canonical fighter in the multiplayer lobby and the page does not consistently use the confirmed room player's `fighterId` for every visual representation. `lobby.html` currently performs the action through the HTTP API and refreshes by polling; the separate `connectLobby` helper listens for Colyseus state but is not used by the page. The preview also computes `selectedId` through a legacy fallback while the roster uses `mine.fighterId` directly, allowing stale/default or mismatched visual state.

**Formal Specification:**

```text
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

### Examples

- A player starts with VEX, clicks RIFT, and the server accepts `fighterId: "rift"`; the large preview remains VEX while the roster marks RIFT selected.
- A player selects NOVA, then a 500 ms polling refresh rebuilds the page from an older room snapshot; the preview falls back to VEX or the roster loses the selected state even though the server has NOVA.
- A player selects NOX and receives a confirmed room state; the roster uses `nox`, but a separate legacy asset lookup uses an inconsistent ID, so the name, alignment, and artwork do not describe one fighter.
- A player attempts to select a fighter already selected by another participant; the server rejects the action. The last confirmed selection must remain visible and the error must be shown, with no unconfirmed preview.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**

- `chooseFighter` continues to accept only the existing canonical fighter IDs, require team membership, and reject duplicate selections.
- Team capacity, mode changes, host authorization, ready checks, complete-team checks, and match transition rules remain enforced by `server/src/rooms.ts`.
- The room's `fighterId` values remain canonical when passed to `matchRoster`; no new legacy remapping is introduced.
- `fighter-registry.js` remains the source of established display names, alignments, portraits, and atlases, including compatibility entries for legacy IDs.
- Mouse selection, team selection, ready/start controls, room occupancy, and normal lobby navigation continue to work.
- The offline lab selection flow remains independent and unchanged.

**Scope:**

Inputs outside a valid, available canonical fighter selection are unaffected. This includes rejected duplicate selections, selections before joining a team, mode/team/ready/start actions, other room participants' updates, non-lobby flows, and offline-lab interactions. When an action is rejected, the UI must retain the last authoritative selection rather than inventing a new one.

## Hypothesized Root Cause

1. **Two unsynchronized client paths**: `lobby.html` sends actions through `apiCall` and relies on a 500 ms HTTP poll, while `client-multiplayer.js` provides a Colyseus state channel that the page never connects to. This creates stale snapshots and ordering races between action responses and refreshes.

2. **Non-atomic rendering inputs**: `render()` builds roster selection from `mine.fighterId` but computes preview data through `legacyToCanonical[mine?.fighterId] || mine?.fighterId || 'vex'`. The separate fallback can mask missing or stale state and makes it possible for preview and roster to disagree.

3. **Unconfirmed visual state risk**: Selection actions do not define an explicit pending/confirmed boundary. Any future local update or delayed response could render a clicked fighter before the server confirms it, violating rejection behavior.

4. **Synchronization ownership is unclear**: The server sends authoritative lobby messages through `LobbyRoom`, but the page treats polling as authoritative and does not coordinate connection lifecycle, message ordering, or stale-state rejection.

## Correctness Properties

Property 1: Bug Condition - Canonical Fighter Selection Is Fully Reflected

_For any_ input where the bug condition holds (isBugCondition returns true), after the authoritative selection response is accepted, the fixed lobby SHALL render the current player's canonical `fighterId` consistently in room state, roster selected state, preview name, alignment/details, and corresponding character artwork.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Rejected and Non-Selection Behavior

_For any_ input where the bug condition does NOT hold (isBugCondition returns false), the fixed lobby SHALL preserve the original authoritative room rules and behavior, including rejection of duplicate or pre-team selections, occupancy and availability updates, ready/start flow, canonical match roster IDs, established registry assets/names, and offline-lab behavior.

**Validates: Requirements 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

**File**: `lobby.html`

**Function/flow**: Lobby `render`, fighter click handler, room initialization, and synchronization lifecycle.

**Specific Changes**:

1. **Use one authoritative state pipeline**: Connect the page to `connectLobby` or implement equivalent lifecycle handling using the existing Colyseus helper. Apply server-emitted `lobby` states through one state setter; retain HTTP only for initial authenticated fetch/action fallback if required by the existing API contract.

2. **Render from confirmed state only**: Track the latest authoritative room and current player record. Do not set `fighterId` or preview data optimistically before the action response/message confirms it. On error, preserve the prior room and show the server error.

3. **Use a single canonical selection view model**: Resolve the current player's canonical `fighterId` once against `BLITZBOUND_FIGHTERS` and the established artwork mapping, then use that record for the roster selected class, preview image, display name, alignment, and detail text. The default VEX view is used only when no confirmed fighter is selected, not to overwrite a confirmed selection.

4. **Guard stale updates and lifecycle**: Ensure action responses and realtime snapshots cannot overwrite a newer confirmed state with an older snapshot. Clean up polling/room listeners on navigation or match transition, and preserve existing redirect behavior when the room begins playing.

5. **Preserve action payloads**: Continue sending canonical IDs from the roster buttons and keep action names/payloads compatible with the existing HTTP endpoint and `LobbyRoom` messages. No backend validation or room rule changes are required.

**Files reviewed but not behaviorally changed by this design**:

- `fighter-registry.js`: retain canonical and legacy-compatible records and all existing asset references.
- `server/src/rooms.ts`: retain canonical ID validation, uniqueness, team requirement, capacity, readiness, and match roster behavior.
- `server/src/lobby.ts`: retain authoritative `lobby`/`error` message semantics; only adjust if implementation requires a narrowly scoped synchronization acknowledgement without changing room rules.
- `client-multiplayer.js`: reuse its existing authenticated identity-enriched `send` wrapper and lobby subscription, adding only minimal lifecycle/state handling if needed.

## Testing Strategy

### Validation Approach

The strategy first reproduces stale/default preview and mismatched roster behavior on the current client, then verifies that every accepted canonical selection is rendered consistently, and finally checks preservation of all existing server and offline behavior. Tests must distinguish authoritative confirmation from a click event and must include delayed, reordered, rejected, and cross-player updates.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples on the unfixed client before implementation and confirm the synchronization root cause.

**Test Plan**: Use a browser/client harness with a fake room API or test server that can delay the selection response and emit old/new room states in different orders. Observe preview image/name, roster selected class, and room `fighterId` after each event.

**Test Cases**:

1. Select RIFT from initial VEX and assert whether the current preview remains VEX while the room response says RIFT.
2. Select NOVA, then emit an older polling snapshot after the successful action and observe whether the UI reverts.
3. Select each canonical fighter and compare roster ID, preview metadata, and artwork mapping.
4. Reject a duplicate selection and verify whether the unfixed UI displays an unconfirmed fighter or returns to the prior state.

**Expected Counterexamples**:

- Preview and roster selection can be driven by different IDs.
- A stale poll can overwrite a successful action response.
- Default VEX fallback can hide missing confirmation.
- Rejected actions can lack an explicit confirmed-state rollback contract.

### Fix Checking

**Goal**: Verify that every buggy valid selection converges to one confirmed canonical selection.

**Pseudocode:**

```text
FOR ALL X WHERE isBugCondition(X) DO
  result := selectFighter_fixed(X)
  ASSERT result.authoritativeRoomState.fighterId = X.fighterId
  ASSERT result.preview.fighterId = X.fighterId
  ASSERT result.rosterSelection.fighterId = X.fighterId
  ASSERT result.preview.displayName = canonicalDisplayName(X.fighterId)
  ASSERT result.preview.asset = canonicalAsset(X.fighterId)
END FOR
```

### Preservation Checking

**Goal**: Verify that non-buggy inputs retain original behavior and that rejected actions never fabricate state.

**Pseudocode:**

```text
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT roomRules_original(X) = roomRules_fixed(X)
  ASSERT canonicalIDs_original(X) = canonicalIDs_fixed(X)
  ASSERT assetsAndNames_original(X) = assetsAndNames_fixed(X)
  ASSERT offlineLabBehavior_original(X) = offlineLabBehavior_fixed(X)
END FOR
```

**Testing Approach**: Use property-based tests for canonical roster IDs, random action ordering, delayed snapshots, duplicate selections, and preservation of room invariants. Use integration tests to validate the browser UI against the server's HTTP and Colyseus paths.

**Test Cases**:

1. Confirm duplicate and pre-team selections remain rejected and the last confirmed UI state remains visible.
2. Confirm mode, team, ready, start, and match-roster flows preserve existing validation and canonical IDs.
3. Confirm other players' selections update availability without clearing the current player's confirmed selection.
4. Confirm legacy registry compatibility and offline-lab behavior remain unchanged.

### Unit Tests

- Test canonical selection view-model construction for all twelve canonical IDs, including name, alignment, detail, portrait/artwork, and VEX empty-state behavior.
- Test that a confirmed room state updates preview and roster together, while rejected actions preserve the previous confirmed state.
- Test stale-state ordering guards: older snapshots cannot replace newer confirmed room state.
- Test that duplicate and pre-team errors do not mutate local confirmed selection.

### Property-Based Tests

- Generate every canonical fighter and random available-room configurations; verify accepted selection produces matching room ID, roster state, preview metadata, and asset.
- Generate delayed and reordered authoritative snapshots; verify final rendered state equals the newest accepted authoritative state.
- Generate duplicate, no-team, full-team, and invalid-ID actions; verify existing server rejection and unchanged confirmed UI state.
- Generate non-selection actions and verify room capacity, host, ready, uniqueness, match roster, registry mappings, and offline behavior are preserved.

### Integration Tests

- Run a two-player lobby through selecting fighters, changing selections, and observing both clients' availability and previews.
- Exercise HTTP action response followed by Colyseus snapshot and polling/reconnect scenarios, including delayed and out-of-order messages.
- Start a valid room after selection and verify the match receives the same canonical fighter IDs shown in the lobby.
- Verify the offline lab still selects and displays fighters independently of multiplayer synchronization.
