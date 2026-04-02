# Rig Manager

## Current State
Flagging warnings exist on rig dashboard cards. Inside the RigDetail view, the Reserve Canopy ComponentCard has a basic `isReserveExpiringSoon` amber warning. The AAD ComponentCard has no inline warnings at all.

## Requested Changes (Diff)

### Add
- Warning banners inside the AAD ComponentCard for:
  - AAD service overdue (critical/red)
  - AAD service due within 30 days (warning/amber)
  - AAD end of life reached (critical/red)
  - AAD end of life within 30 days (warning/amber)
- Enhanced reserve expiry warning: show critical (red) when expired, amber when expiring within 30 days, with days remaining count

### Modify
- RigDetail.tsx: add computed AAD warning flags and render warning banners inside the AAD ComponentCard
- RigDetail.tsx: improve the reserve expiry warning to differentiate expired vs expiring-soon

### Remove
Nothing removed.

## Implementation Plan
1. In RigDetail.tsx, add helper logic to compute AAD service days remaining and end-of-life days remaining
2. Render warning banners inside the AAD ComponentCard (before InfoRows)
3. Enhance the reserve expiry banner to show red/critical when expired, include days remaining
