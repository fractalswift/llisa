---
name: lisa-list-epics
description: List all epics with phase status
---

# List Epics

Use the `list_epics` tool to get all epics.

**Response format:**
```json
{
  "epics": [
    {
      "name": "epic-name",
      "phase": "execute",
      "specComplete": true,
      "researchComplete": true,
      "planComplete": true,
      "executeComplete": false,
      "tasks": { "done": 2, "total": 16 },
      "yoloActive": true
    }
  ]
}
```

## Display Logic

For each epic, display based on completion flags (NOT just current phase):

- **Spec:** Show ✓ if `specComplete: true`, otherwise ○
- **Research:** Show ✓ if `researchComplete: true`, otherwise ○
- **Plan:** Show ✓ if `planComplete: true`, otherwise ○
- **Execute:** 
  - Show ✓ if `executeComplete: true`
  - Show ● with task count if `tasks` exists AND not complete (e.g., "● Execute (2/16 done)")
  - Show ○ if no tasks yet

## Display Format

```
Epic: initial-setup
  ✓ Spec (complete)
  ✓ Research (complete)
  ✓ Plan (complete)
  ✓ Execute (complete - 5/5 tasks)

Epic: add-realtime-updates
  ✓ Spec (complete)
  ✓ Research (complete)
  ✓ Plan (complete)
  ● Execute (in progress - 2/16 tasks done) [YOLO ACTIVE]
  
  Next: /lisa-yolo add-realtime-updates or /lisa-continue add-realtime-updates

Epic: new-feature
  ✓ Spec (complete)
  ○ Research (not started)
  ○ Plan (not started)
  ○ Execute (not started)
  
  Next: /lisa-continue new-feature or /lisa-yolo new-feature

---

No epics? Start one: /lisa-create-epic <name>
```

**Legend:**
- ✓ = complete (checked `*Complete` flag)
- ● = in progress (phase is "execute" but `executeComplete: false`)
- ○ = not started (flag is `false` and no tasks exist)

**Always show both `/lisa-continue` and `/lisa-yolo` for any epic with spec complete.**

**If no epics:**
```
No epics found.

Get started: /lisa-create-epic <name>
```
