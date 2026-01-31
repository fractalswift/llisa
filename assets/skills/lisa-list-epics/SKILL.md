---
name: lisa-list-epics
description: List all epics with phase status
---

# List Epics

Use the `list_epics` tool to get all epics.

Display with phase checkboxes:

```
Epic: initial-setup
  ✓ Spec (complete)
  ○ Research (not started)
  ○ Plan (not started)
  ○ Execute (not started)
  
  Next: /lisa-continue initial-setup or /lisa-yolo initial-setup

Epic: auth-system
  ✓ Spec (complete)
  ✓ Research (complete)
  ● Plan (in progress)
  ○ Execute (not started)
  
  Next: /lisa-continue auth-system or /lisa-yolo auth-system

---

No epics? Start one: /lisa-create-epic <name>
```

**Legend:**
- ✓ = complete
- ● = in progress
- ○ = not started

**Always show both `/lisa-continue` and `/lisa-yolo` for any epic with spec complete.**

**If no epics:**
```
No epics found.

Get started: /lisa-create-epic <name>
```
