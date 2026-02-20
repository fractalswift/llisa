---
name: epic-status
description: Show detailed status for a specific Lisa epic
---

# Epic Status

**Epic name:** Provided via arguments

Read `.lisa/epics/<epicName>/` directly.

## If epic doesn't exist:
```
Epic '<name>' not found.

Create it with: /lisa:create-epic <name>
```
STOP.

## Display

Read `.state`, `spec.md`, `research.md`, `plan.md`, and all task files.

```
Epic: <name>
Phase: <current phase>

Progress:
  ✓ Spec   - complete (.lisa/epics/<name>/spec.md)
  ✓ Research - complete
  ✓ Plan   - complete (X tasks)
  ● Execute - in progress (3/8 tasks done)
    ✓ 01-setup-database
    ✓ 02-create-models
    ✓ 03-api-endpoints
    ○ 04-add-auth (pending)
    ○ 05-write-tests (waiting on 04)
    ✗ 06-deploy-config (blocked)

Spec Summary:
<first 4-5 lines of spec.md Goal and Acceptance Criteria sections>

Yolo: <active with iteration X/Y | not active>

Next Actions:
  • /lisa:continue <name> - Resume interactively
  • /lisa:yolo <name> - Auto-execute remaining work
```

**Task status icons:**
- `✓` = done
- `○` = pending or waiting on dependencies
- `✗` = blocked
- `→` = in-progress
