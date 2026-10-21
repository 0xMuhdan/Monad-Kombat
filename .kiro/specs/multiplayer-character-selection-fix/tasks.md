# Implementation Plan

## Overview

This plan follows the bug-condition workflow for the multiplayer character-selection synchronization fix. It first establishes failing exploration coverage, then records preservation behavior, implements the fix, and finally validates the complete regression surface without changing application code in this task.

## Task Dependency Graph

```text
1 (Bug Condition Exploration)
  |
  v
2 (Preservation Tests)
  |
  v
3 (Implementation)
  |\
  | +--> 3.1 Establish authoritative room-state pipeline
  | +--> 3.2 Render preview and roster from canonical view model
  | +--> 3.3 Preserve confirmed state on rejected actions
  | +--> 3.4 Verify Property 1 Expected Behavior
  | +--> 3.5 Verify Property 2 Preservation
  v
4 (Checkpoint)
```

```json
{
  "waves": [
    {"id": "1", "tasks": ["1"], "dependsOn": []},
    {"id": "2", "tasks": ["2"], "dependsOn": ["1"]},
    {"id": "3", "tasks": ["3"], "dependsOn": ["2"]},
    {"id": "4", "tasks": ["4"], "dependsOn": ["3"]}
  ]
}
```

## Tasks

- [x] 1. Write the bug condition exploration test
  - **Property 1: Bug Condition** - Accepted Canonical Fighter Selection Converges
  - **CRITICAL**: Write and run this test against the unfixed client before implementing the fix; the expected failure confirms the stale/mismatched selection bug.
  - Build a browser/client harness or equivalent lobby test fixture with an initial confirmed VEX selection and controllable room API responses.
  - Define `isBugCondition(X)` as a select-fighter action for an available canonical ID where the preview, refreshed roster selection, or authoritative current-player `fighterId` differs from the requested ID.
  - Scope generated cases to each canonical fighter ID (`vex`, `rift`, `nova`, `nox`, `sable`, `forge`, `jinx`, `aero`, `orbit`, `ember`, `kite`, `moss`) and available room configurations.
  - For accepted selections, assert the expected behavior from design: authoritative room `fighterId`, selected roster ID, preview fighter ID, display name, alignment/details, and artwork all match the requested canonical ID.
  - Include delayed action responses and an older polling snapshot after a successful selection to expose preview reversion or roster/preview disagreement.
  - Document concrete counterexamples found on unfixed code, such as selecting RIFT or NOVA while the large preview remains VEX.
  - **EXPECTED OUTCOME ON UNFIXED CODE**: The test fails for at least one valid selection or stale-update ordering case; do not modify the test to make it pass.
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Write preservation property tests before implementing the fix
  - **Property 2: Preservation** - Rejected Actions and Existing Lobby Behavior Remain Unchanged
  - **IMPORTANT**: Follow observation-first methodology: run the unfixed behavior for non-buggy inputs, record outputs/errors, then encode those observations in tests.
  - Verify duplicate fighter selections remain rejected by existing backend uniqueness rules, the last confirmed fighter remains rendered, and no unconfirmed preview is shown.
  - Verify selecting before joining a team remains rejected and does not mutate the confirmed room or local selection state.
  - Verify cross-player selections update occupancy and fighter availability while preserving the current player's confirmed selection.
  - Verify mode changes, team joins, ready toggles, host authorization, capacity checks, complete-team checks, and valid start behavior remain unchanged.
  - Verify `matchRoster` receives the same canonical fighter IDs selected in the room, with no legacy remapping.
  - Verify `fighter-registry.js` display names, alignments, portraits, atlases, and established legacy asset compatibility remain unchanged.
  - Verify the offline lab character-selection flow remains independent of multiplayer synchronization.
  - Include property-based cases for non-selection actions, rejected duplicate/no-team/invalid-ID actions, and established asset/name mappings; confirm these tests pass on unfixed code.
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3. Implement the authoritative, canonical lobby selection fix
  - [x] 3.1 Establish one confirmed room-state pipeline in `lobby.html`
    - Use the existing authenticated lobby subscription/realtime helper where appropriate, or implement equivalent lifecycle handling while retaining the current HTTP API contract.
    - Route initial fetches, action confirmations, and authoritative lobby updates through a single room-state setter.
    - Track the newest confirmed room state and reject or ignore stale polling/realtime snapshots so an older update cannot overwrite a newer accepted fighter selection.
    - Clean up polling and realtime listeners on navigation or match transition while preserving the existing playing-room redirect.
    - _Bug_Condition: `isBugCondition(X)` for an available canonical fighter selection whose preview, roster state, or authoritative `fighterId` disagrees with the requested ID._
    - _Expected_Behavior: Accepted selections converge to one confirmed canonical current-player selection across room state and all rendered views; stale snapshots cannot regress it._
    - _Preservation: Keep existing HTTP actions, room lifecycle behavior, error semantics, and backend validation unchanged._
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 3.3_

  - [x] 3.2 Render the preview and roster from one canonical selection view model
    - Resolve the current player's confirmed canonical `fighterId` exactly once against `BLITZBOUND_FIGHTERS` and the established artwork mapping.
    - Use that resolved record for roster selected state, preview image/artwork, canonical display name, alignment, and detail text.
    - Use the VEX empty-state only when no confirmed fighter exists; do not use a legacy fallback to overwrite or mask a confirmed canonical selection.
    - Preserve canonical fighter IDs in action payloads and retain all existing character assets and Blitzbound-facing names.
    - _Bug_Condition: Preview and roster may currently derive different IDs through separate canonical/legacy fallback paths._
    - _Expected_Behavior: `preview.fighterId = rosterSelection.fighterId = authoritativeRoomState.fighterId`, with matching `canonicalDisplayName` and `canonicalAsset`._
    - _Preservation: Do not modify `fighter-registry.js`, canonical ID definitions, legacy compatibility mappings, or offline-lab rendering._
    - _Requirements: 2.1, 2.2, 2.3, 2.6, 3.4, 3.5, 3.6_

  - [x] 3.3 Preserve confirmed state on rejected fighter actions
    - Ensure a fighter click does not optimistically replace the confirmed selection.
    - On a rejected duplicate, pre-team, invalid, or otherwise failed action, retain the previous authoritative room state and visible preview/roster selection, and display the returned error.
    - Add or update the test fixture so rejected responses cannot fabricate a selected fighter.
    - _Bug_Condition: A selection request can leave the UI without an explicit pending/confirmed boundary._
    - _Expected_Behavior: Rejected actions preserve the last authoritative selection and show the server error._
    - _Preservation: Existing backend rejection messages and uniqueness/team rules remain authoritative._
    - _Requirements: 2.5, 3.1, 3.2_

  - [x] 3.4 Verify accepted selection behavior with the existing exploration test
    - **Property 1: Expected Behavior** - Accepted Canonical Fighter Selection Converges
    - Re-run the same test created in task 1; do not create a replacement test.
    - Cover all twelve canonical IDs, delayed responses, stale snapshots, and the final confirmed preview/roster consistency assertions.
    - **EXPECTED OUTCOME**: The exploration test now passes, proving the bug condition is fixed for accepted selections.
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.5 Verify preservation behavior with the existing preservation tests
    - **Property 2: Preservation** - Rejected Actions and Existing Lobby Behavior Remain Unchanged
    - Re-run the same tests created in task 2; do not create replacement tests.
    - Confirm rejected selections, cross-player availability, room lifecycle/regression flows, canonical match roster IDs, registry assets/names, and offline lab behavior remain intact.
    - **EXPECTED OUTCOME**: All preservation tests pass with no backend rule or non-lobby regression.
    - _Requirements: 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 4. Checkpoint - Validate the complete bugfix
  - Run the full relevant unit, property-based, client/integration, and backend test suites in non-watch mode.
  - Confirm accepted selection, stale update ordering, rejected selection rollback, cross-player availability, and regression flow tests all pass together.
  - Confirm no implementation changes were made to backend room rules, canonical fighter IDs, established character assets/registry mappings, or offline lab behavior unless narrowly required for synchronization compatibility.
  - Confirm the lobby redirects correctly when the room starts and cleans up synchronization resources on navigation.
  - If any test fails, document the failure and resolve it before marking the checkpoint complete.
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

## Notes

- Preserve the existing task order: exploration and preservation tests precede implementation, and the checkpoint remains last.
- Keep Property 1 and Property 2 labels intact so property-based test status tooling can identify them.
- This document-only update does not implement application code or alter the existing requirements.
