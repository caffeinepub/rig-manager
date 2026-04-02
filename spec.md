# Rig Manager

## Current State
Dashboard.tsx getFlaggedItems checks reserve expiry and AAD dates but NOT jump counts. RigDetail.tsx renders canopy cards with InfoRow values but no inline warnings.

## Requested Changes (Diff)

### Add
- Jump limit flagging for Main Canopy in getFlaggedItems: total jumps >= 1500, line set >= 350, main risers >= 1000
- Jump limit flagging for Tandem Canopy in getFlaggedItems: total jumps >= 1500, line set >= 350, drogue/bridle >= 600, lower bridle/kill line >= 300
- Inline warning badges in RigDetail.tsx on both canopy cards when limits are reached

### Modify
- getFlaggedItems in Dashboard.tsx: extend with canopy jump limit checks
- RigDetail.tsx InfoRows for jump counts: add warning indicator when value meets or exceeds limit

### Remove
Nothing.

## Implementation Plan
1. Extend getFlaggedItems in Dashboard.tsx with mainCanopy and tandemCanopy jump count checks, pushing critical flags with descriptive labels
2. In RigDetail.tsx, add inline red warning badge or icon next to jump count InfoRows for both canopy types when their respective limits are met
