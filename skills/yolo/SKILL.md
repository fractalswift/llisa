---
name: yolo
description: Continue a Lisa epic in full auto mode with no checkpoints
---

# Yolo Mode (Full Auto)

**Epic name:** Provided via arguments
**Max iterations:** Provided via arguments (optional, overrides config default)

Full automatic execution. No confirmations. No summaries. Just work.

## YOLO RULES - FOLLOW STRICTLY

1. **NEVER stop to summarize** - No progress updates between tasks. Just work.
2. **NEVER ask for confirmation** - No "Ready to continue?". Just proceed.
3. **NEVER explain what you're about to do** - Don't narrate. Execute.
4. **ALWAYS execute next phase immediately** - After phase completes, start next.
5. **ONLY stop when truly done** - All tasks `done` OR all remaining `blocked`.
6. **ALWAYS use fresh sub-agents** - Each phase and task uses Task tool with clean context.
7. **ALWAYS verify completion** - Check files after each phase/task.
8. **RETRY on failure** - Up to 3 attempts per phase/task before marking blocked.

Yolo is for autonomous execution. User has walked away. Every stop wastes time.

---

## Step 1: Verify spec exists

Read `.lisa/epics/<epicName>/.state`. If no spec:
```
No spec found for epic '<name>'.
Create the epic first: /lisa:create-epic <name>
```
STOP.

---

## Step 2: Activate yolo and write state file

Read `.lisa/config.jsonc` to get `yolo.defaultMaxIterations` (default: 100).
If max iterations was passed as argument, use that instead.

**If yolo was already active (`.state` has `yolo.active: true`):**

Read current iteration from `.state`. Show:
```
Resuming yolo mode (iteration <n>):
  ✓ Spec
  [✓/○] Research
  [✓/○] Plan
  ● Execute - <done>/<total> tasks done

Continuing...
```

Check if `iteration >= maxIterations` — if so:
```
Max yolo iterations (<n>) reached for epic "<epicName>".
Use /lisa:continue <name> to resume interactively.
```
STOP.

Increment iteration in `.state`.

**If starting fresh:**

Update `.state`:
```json
{
  "yolo": {
    "active": true,
    "iteration": 1,
    "maxIterations": <maxIterations>,
    "startedAt": "<ISO timestamp>"
  }
}
```

Write `.lisa/yolo.state`:
```
active=true
epic=<epicName>
iteration=1
max_iterations=<maxIterations>
```

---

## Step 3: Research (if not done)

**If `researchComplete: true` OR `research.md` exists:** Skip to Step 4.

**DO NOT ask. Just launch.**

Launch a Task sub-agent (explore type) with research prompt:

```
---
# Research Phase: <epicName>

You are conducting research for a Lisa epic. Explore the codebase to understand
the architecture, relevant files, and patterns relevant to this spec.

## Git Orientation (if git available)
Before researching:
- Run `git status`
- Run `git log --oneline -10`
If git is not available, skip.

## Output
Save to: .lisa/epics/<epicName>/research.md

# Research: <epicName>

## Overview
[2-3 sentence summary]

## Relevant Files
- `path/to/file` - [why relevant]

## Existing Patterns
[How similar features are implemented]

## Dependencies
[External packages, internal modules relevant]

## Recommendations
[Suggested implementation approach]

Then update .lisa/epics/<epicName>/.state:
- "researchComplete": true
- "currentPhase": "research"
- "lastUpdated": current ISO timestamp

## Epic Spec
<contents of spec.md>
---
```

**After sub-agent completes, verify:**
- `research.md` exists with `## Overview`, `## Relevant Files`, `## Existing Patterns`, `## Recommendations`
- `.state` has `researchComplete: true`

**If fails (attempt 2):**
```
[YOLO RESEARCH RETRY - MUST COMPLETE NOW]
Previous attempt INCOMPLETE. Missing: [list]
YOLO MODE = NO STOPPING. COMPLETE IMMEDIATELY:
1. Read spec.md
2. Write complete research.md with ALL sections
3. Update .state researchComplete: true
DO NOT stop. JUST DO IT.
[original prompt]
```

**If fails (attempt 3):** Final urgent attempt.

**If still fails after 3 attempts:**
Update `.state`: `yolo.active: false`. Update `.lisa/yolo.state`: `active=false`.
```
Yolo stopped: Research failed after 3 attempts.
Missing: [list]
Use /lisa:continue <name> for interactive mode.
```
STOP.

---

## Step 4: Plan (if not done)

**If `planComplete: true` OR `plan.md` exists:** Skip to Step 5.

**DO NOT ask. Just launch.**

Launch a Task sub-agent (general type) with planning prompt:

```
---
# Planning Phase: <epicName>

Break the work into discrete, actionable tasks with clear dependencies.

## Output

### plan.md
Save to: .lisa/epics/<epicName>/plan.md

# Plan: <epicName>

## Overview
[Brief approach]

## Tasks
1. [Task name] - tasks/01-task-name.md

## Dependencies
- 01: []
- 02: [01]

## Risks
- [Risk or "None"]

### Task files
Create each at: .lisa/epics/<epicName>/tasks/XX-task-name.md

# Task X: [Name]

## Status: pending

## Goal
[1 sentence]

## Files
- path/to/file

## Steps
1. [Action]

## Done When
- [ ] [Criterion]

Then update .state: planComplete: true, currentPhase: "plan"

## Guidelines
- ~30 min per task, 3-10 tasks total
- 1-5 files per task
- Simple is better

## Epic Spec
<contents of spec.md>

## Research
<contents of research.md>
---
```

**After sub-agent completes, verify:**
- `plan.md` exists with `## Overview`, `## Tasks`, `## Dependencies`
- Task files exist in `tasks/`
- `.state` has `planComplete: true`

Retry up to 3 times with escalating urgency if needed.

**If fails after 3 attempts:**
Update yolo state to inactive. Report and STOP.

---

## Step 5: Execute

**Loop until all tasks done or all remaining blocked:**

1. **Find available tasks:**
   Read `plan.md` `## Dependencies` section.
   For each task without `## Status: done` or `## Status: blocked`, check deps.
   A task is available if all dependency task files contain `## Status: done`.

2. **If no available tasks and some pending exist:** Dependencies not yet met — wait for parallel tasks or report deadlock.

3. **If no available tasks and all remaining are blocked:**
   Update `.state`: `yolo.active: false`, `executeComplete: false`.
   Update `.lisa/yolo.state`: `active=false`.
   ```
   Yolo stopped: All remaining tasks blocked.
   Blocked tasks: [list]
   Use /lisa:continue <name> to review and unblock.
   ```
   STOP.

4. **For each available task (up to maxParallelTasks from config, default 1):**

   Launch Task sub-agent (general type):

   ```
   ---
   # Execute Task <taskId>: <taskName> — Epic "<epicName>"

   ## Git Orientation (if git available)
   Before starting:
   - `git status`
   - `git log --oneline -10`
   - `git diff HEAD`
   If git not available, skip.

   ## Mission
   Execute the task. When done:
   1. Change status to "done"
   2. Add ## Report with:
      ### What Was Done
      ### Decisions Made
      ### Issues / Notes for Next Task
      ### Files Changed

   ## Constraints
   - Work ONLY within the project directory
   - NO /tmp/, /private/, /var/, /etc/ or system dirs
   - Temp files: use ./.tmp/ or .lisa/epics/<epicName>/tmp/

   ## Epic Spec
   <contents of spec.md>

   ## Research
   <contents of research.md>

   ## Plan
   <contents of plan.md>

   ## Dependency Task Reports
   <for each dependency: its ## Report section only — NOT the full task file>

   ## This Task
   File: .lisa/epics/<epicName>/tasks/<taskFile>
   <full task file contents>
   ---
   ```

   **After sub-agent completes, verify:**
   Read task file. Check for `## Status: done`, `## Report`, `### What Was Done`, `### Files Changed`.

   **If fails:** Retry up to 3 times with escalating urgency.

   **If still fails after 3 attempts:**
   Write `## Status: blocked` to task file. Add note with what failed.
   Continue loop — do NOT stop yolo.

5. **Repeat loop** — no summaries, no pauses.

---

## Step 6: Completion

**When all tasks are done:**

Update `.state`: `executeComplete: true`, `yolo.active: false`, `currentPhase: "execute"`.
Delete `.lisa/yolo.state` (or set `active=false`).

Read `.lisa/config.jsonc` `git.completionMode`:
- `"none"`: skip git
- `"commit"`: `git add -A && git commit -m "feat: complete epic <epicName>"`
- `"pr"`: create branch `epic/<epicName>`, commit, push, `gh pr create --title "feat: <epicName>" --body "Completed by Lisa yolo mode"`

Show:
```
Epic "<epicName>" complete! All X tasks finished.
```
STOP.
