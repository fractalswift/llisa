---
name: list-epics
description: List all Lisa epics and their current status
---

# List Epics

Read the `.lisa/epics/` directory directly.

## How to read epic status

For each subdirectory in `.lisa/epics/`:

1. Read `.lisa/epics/<name>/.state` (JSON) if it exists
2. If no `.state`, infer from which files exist:
   - `tasks/` dir exists → execute phase
   - `plan.md` exists → plan phase
   - `research.md` exists → research phase
   - `spec.md` exists → spec phase
3. Count task statuses by reading all `tasks/*.md` files and checking for `## Status: done/blocked/in-progress/pending`

## Display Format

```
Epic: auth-system
  ✓ Spec
  ✓ Research
  ✓ Plan
  ● Execute (3/8 tasks done) [YOLO ACTIVE]

  Next: /lisa:continue auth-system or /lisa:yolo auth-system

---

Epic: initial-setup
  ✓ Spec
  ✓ Research
  ✓ Plan
  ✓ Execute (5/5 complete)

---

Epic: new-feature
  ✓ Spec
  ○ Research
  ○ Plan
  ○ Execute

  Next: /lisa:continue new-feature or /lisa:yolo new-feature
```

**Legend:**
- `✓` = complete (flag is true in .state, or file exists)
- `●` = in progress (has tasks but not all done)
- `○` = not started

**Always show both `/lisa:continue` and `/lisa:yolo` for any epic with spec complete but not fully done.**

**If `.lisa/epics/` does not exist or is empty:**
```
No epics found.

Get started: /lisa:create-epic <name>
```
