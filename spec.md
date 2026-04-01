# Rig Manager

## Current State
Both FiftyJumpCheckModal.tsx and TandemFiftyJumpCheckModal.tsx have a Notes textarea. No image upload exists. blob-storage component is now selected.

## Requested Changes (Diff)

### Add
- Multiple image upload below the Notes textarea in both checklist modals
- Thumbnail previews with remove buttons
- Images uploaded via ExternalBlob.fromBytes, displayed via getDirectURL()
- Image URLs included in submitted checklistData JSON
- RigDetail history view shows note images as thumbnails

### Modify
- FiftyJumpCheckModal: add noteImages state, upload handler, thumbnail grid, pass images in submission
- TandemFiftyJumpCheckModal: same
- RigDetail: render note images in completed checklist history

### Remove
- Nothing

## Implementation Plan
1. Add image upload UI + state to both modal components
2. Use ExternalBlob.fromBytes to upload, getDirectURL() to display
3. Serialize image URLs into checklistData JSON noteImages field
4. Display note images in RigDetail checklist history
