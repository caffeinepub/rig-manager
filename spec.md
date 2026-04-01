# Rig Manager

## Current State
Rigs track `totalJumps` (lifetime counter). Each pack job increments it. There is no 50-jump milestone tracking or associated checklist.

## Requested Changes (Diff)

### Add
- `jumpsSinceLastCheck` field on `Rig` — resets to 0 after each completed 50-jump check
- `FiftyJumpCheck` type and store: records rigId, completedBy, date, signature, and all checklist item responses
- `completeFiftyJumpCheck(rigId, input)` backend function — saves the checklist record and resets `jumpsSinceLastCheck` to 0
- `getFiftyJumpChecks(rigId)` backend query — returns all completed 50-jump checks for a rig
- Frontend: jump tally progress bar/counter on rig detail (e.g. "38 / 50 jumps since last check")
- Frontend: when `jumpsSinceLastCheck >= 50`, the rig is flagged with a banner/alert. A 50-jump checklist modal is shown. The user cannot dismiss it without completing and submitting the checklist.
- Frontend: 50-jump checklist form with standard skydiving rig inspection items (checkboxes + notes + signature + completed-by name)
- Frontend: after submission, counter resets and flag clears
- History of completed 50-jump checks visible in a new tab or section on rig detail

### Modify
- `addPackJob` — also increments `jumpsSinceLastCheck` on the rig
- `Rig` type — add `jumpsSinceLastCheck: Nat` field
- `createRig` — initialize `jumpsSinceLastCheck = 0`
- `updateRig` — preserve `jumpsSinceLastCheck`

### Remove
- Nothing removed

## Implementation Plan
1. Update backend: add `jumpsSinceLastCheck` to Rig type, add FiftyJumpCheck type/store, add `completeFiftyJumpCheck` and `getFiftyJumpChecks` functions, update `addPackJob` to increment `jumpsSinceLastCheck`, update `createRig` and `updateRig`
2. Regenerate backend bindings (backend.d.ts)
3. Frontend: add jump tally counter display on rig detail
4. Frontend: add flag/banner when jumpsSinceLastCheck >= 50
5. Frontend: build 50-jump checklist modal form with checkboxes, notes, signature, submit
6. Frontend: add completed checks history section/tab
