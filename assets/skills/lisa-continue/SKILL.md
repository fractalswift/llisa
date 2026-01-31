---
name: lisa-continue
description: Continue an epic with interactive checkpoints
---

# Continue Epic (Interactive Mode)

**Epic name:** Provided via arguments

Phases: Spec → Research → Plan → Execute

## Step 1: Check yolo status and verify spec exists

**Check `.state` for yolo status:**

If `yolo.active: true`:
```
Note: Yolo mode was active. Switching to interactive mode.
```
Update `.state`:
```json
{
  "yolo": {
    "active": false
  }
}
```

**If no spec:**
```
No spec found for epic '<name>'.

Create the epic first: /lisa-create-epic <name>
```
STOP.

**If spec exists:**
Read and briefly summarize, then continue to step 2.

---

## Step 2: Research Phase

**If research.md exists:**
> "Research already complete. Proceeding to planning..."
Skip to step 3.

**If not done:**
> "Ready to start research? I'll explore the codebase."

Wait for confirmation. On yes:

1. Read spec.md
2. Explore codebase (use grep, glob, read files as needed)
3. Save to `.lisa/epics/<name>/research.md` (see format in COMMON.md)
4. Update `.state` (researchComplete: true, currentPhase: "research")
5. Ask: "Research complete. Continue to planning?"

---

## Step 3: Plan Phase

**If plan.md exists:**
> "Plan already complete with X tasks. Proceeding to execution..."
Skip to step 4.

**If not done:**
> "Ready to create the implementation plan?"

Wait for confirmation. On yes:

1. Read spec.md and research.md
2. Break into tasks (~30 min each, 1-5 files per task)
3. Define dependencies between tasks
4. Save plan.md and task files (see formats in COMMON.md)
5. Update `.state` (planComplete: true, currentPhase: "plan")
6. Show summary: "Plan created with X tasks. Continue to execution?"

---

## Step 4: Execute Phase

Use `get_available_tasks` tool to check status.

**If all tasks done:**
> "All tasks complete! Epic finished."
STOP.

**If tasks remain:**
Show summary and ask:
> "Ready to execute? X tasks remaining:
> - Available now: [list]
> - Blocked: [list]"

Wait for confirmation. On yes:

### Execution Loop

Use config `execution.maxParallelTasks` (default: 1).

1. Call `get_available_tasks(epicName)`
2. Take up to `maxParallelTasks` from available list
3. For each task:
   - Call `build_task_context(epicName, taskId)`
   - Call Task tool with the prompt
4. After completion, call `get_available_tasks` again
5. Show progress, ask "Continue with next task?"
6. Repeat until all done or blocked

**On failure (after maxRetries):**
- Mark as `blocked`
- Continue with other tasks

**On all complete:**
Check config `git.completionMode` and handle accordingly (see COMMON.md).

Show:
> "Epic complete! All X tasks finished.
>
> Changes made: [summary]"
