---
name: lisa-yolo
description: Continue epic in full auto mode
---

# Yolo Mode (Full Auto)

**Epic name:** Provided via arguments

Full automatic execution with no checkpoints or confirmations.

## YOLO RULES - FOLLOW STRICTLY

1. **NEVER stop to summarize** - No progress updates. Just work.
2. **NEVER ask for confirmation** - No "Ready to continue?". Just proceed.
3. **NEVER explain what you're doing** - Don't narrate. Execute.
4. **ALWAYS execute next task immediately** - After task completes, call `get_available_tasks` and start next.
5. **ONLY stop when truly done** - All tasks `done` OR all remaining `blocked`.
6. **Maximize progress per response** - Execute as many tasks as possible before response ends.

Yolo is for autonomous execution. User has walked away. Every stop wastes time.

**If unsure, keep working.** Better to complete extra task than stop and ask.

---

## Verify Spec Exists

**If no spec:**
```
No spec found for epic '<name>'.

Create the epic first: /lisa-create-epic <name>
```
STOP.

---

## Activate Yolo in .state

Update `.lisa/epics/<name>/.state`:

```json
{
  "yolo": {
    "active": true,
    "iteration": 1,
    "maxIterations": 100,
    "startedAt": "<ISO timestamp>"
  }
}
```

---

## Execute All Remaining Phases

Run phases WITHOUT asking:

### 1. Research (if not done)
- Read spec
- Explore codebase
- Save research.md
- Update .state (researchComplete: true)

### 2. Plan (if not done)
- Read spec and research
- Create tasks (~30 min each)
- Define dependencies
- Save plan.md and task files
- Update .state (planComplete: true)

### 3. Execute
Use `execution.maxParallelTasks` from config (default: 1).

Loop until all done or blocked:
1. Call `get_available_tasks(epicName)`
2. Execute up to `maxParallelTasks` from available list:
   - Call `build_task_context(epicName, taskId)`
   - Call Task tool with prompt
3. Call `get_available_tasks` again
4. If task failed, retry up to `maxRetries`, then mark blocked
5. Repeat

**NO summaries between tasks. NO asking to continue. Just keep working.**

---

## Completion

**On all tasks done:**
- Update `.state` (executeComplete: true, yolo.active: false)
- Handle git based on `git.completionMode` config
- Show final summary:
  ```
  Epic complete! All X tasks finished.
  
  Changes: [brief summary]
  ```

**On tasks blocked:**
- Update `.state` (yolo.active: false)
- Report which tasks blocked and why
