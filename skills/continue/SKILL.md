---
name: continue
description: Continue a Lisa epic with interactive checkpoints at each phase transition
---

# Continue Epic (Interactive Mode)

**Epic name:** Provided via arguments

Three checkpoints only — one at each phase transition. Execution within each confirmed phase runs autonomously to completion.

## Step 1: Load state and verify spec

Read `.lisa/epics/<epicName>/.state`.

**If yolo was active:**
Update `.state` to set `yolo.active: false`. Note to user:
```
Note: Yolo mode was active. Switching to interactive mode.
```
Also update `.lisa/yolo.state` if it exists — set `active=false`.

**If no spec exists:**
```
No spec found for epic '<name>'.

Create the epic first: /lisa:create-epic <name>
```
STOP.

**If spec exists:** Read and briefly summarize it, then continue.

---

## Step 2: Research Phase

**If `researchComplete: true` in .state OR research.md exists:**
> "Research already complete. Proceeding to planning..."
Skip to Step 3.

**If not done, ask:**
> "Ready to start research? I'll explore the codebase with a dedicated agent. (yes/no)"

Wait for confirmation. On yes:

### Research Execution

Build the research prompt inline and launch a sub-agent:

```
Launch a Task sub-agent (explore type) with this prompt:

---
# Research Phase: <epicName>

You are conducting research for a Lisa epic. Explore the codebase to understand
the current architecture, relevant files, and patterns relevant to this spec.

## Your Mission

1. Read the spec carefully to understand what needs to be built
2. Use Glob, Grep, and Read tools to explore the codebase
3. Find relevant existing files and patterns
4. Document your findings

## Output

Save your findings to: .lisa/epics/<epicName>/research.md

Use this exact format:

# Research: <epicName>

## Overview
[2-3 sentence summary of what you found]

## Relevant Files
- `path/to/file` - [why relevant]

## Existing Patterns
[How similar features are implemented, patterns observed]

## Dependencies
[External packages, internal modules relevant to this work]

## Recommendations
[Suggested implementation approach based on findings]

Then update .lisa/epics/<epicName>/.state:
- Set "researchComplete": true
- Set "currentPhase": "research"
- Update "lastUpdated" to current ISO timestamp

## Git Orientation

Before researching, if git is available:
- Run `git status` to see working tree state
- Run `git log --oneline -10` to see recent changes
- If git is not available, skip this step

## Epic Spec

<contents of spec.md>
---
```

**After sub-agent completes, verify by checking:**
- Does `.lisa/epics/<epicName>/research.md` exist?
- Does it contain `## Overview`, `## Relevant Files`, `## Existing Patterns`, `## Recommendations`?
- Does `.state` have `researchComplete: true`?

**If verification passes:** Ask:
> "Research complete. Ready to create the implementation plan? (yes/no)"
Wait for confirmation, then proceed to Step 3.

**If verification fails (attempt 2):**
Re-launch sub-agent with:
```
[RESEARCH RETRY - MUST COMPLETE]

Previous attempt did not complete. Missing:
- [list what is missing]

MANDATORY: Complete ALL items before stopping:
1. Read spec.md
2. Thoroughly explore the codebase
3. Save complete research.md with ALL required sections
4. Update .state with researchComplete: true

DO NOT stop until all items are done.

[original research prompt]
```
Verify again. If passes, ask to continue.

**If verification fails (attempt 3):**
Final attempt with `[FINAL ATTEMPT - COMPLETE OR FAIL]` header.
If still failing after 3 attempts:
```
Research could not be completed after 3 attempts.
Missing: [list issues]

You can:
- Retry: /lisa:continue <name>
- Manually create .lisa/epics/<name>/research.md and set researchComplete: true in .state
```
STOP.

---

## Step 3: Plan Phase

**If `planComplete: true` in .state OR plan.md exists:**
Read plan.md, count tasks.
> "Plan already complete with X tasks. Proceeding to execution..."
Skip to Step 4.

**If not done, ask:**
> "Ready to create the implementation plan? (yes/no)"

Wait for confirmation. On yes:

### Planning Execution

Launch a Task sub-agent (general type) with this prompt:

```
---
# Planning Phase: <epicName>

You are creating an implementation plan for a Lisa epic.
Break the work into discrete, actionable tasks with clear dependencies.

## Your Mission

1. Review the spec and research findings carefully
2. Break work into ~30 minute tasks (typically 3-10 tasks total)
3. Define dependencies between tasks
4. Create plan.md and individual task files

## Output

### plan.md
Save to: .lisa/epics/<epicName>/plan.md

# Plan: <epicName>

## Overview
[Brief approach - 2-3 sentences]

## Tasks
1. [Task name] - tasks/01-task-name.md
2. [Task name] - tasks/02-task-name.md

## Dependencies
- 01: []
- 02: [01]
- 03: [01, 02]

## Risks
- [Risk and mitigation or "None identified"]

### Task files
Create each task at: .lisa/epics/<epicName>/tasks/XX-task-name.md

# Task X: [Name]

## Status: pending

## Goal
[What this task accomplishes - 1 sentence]

## Files
- path/to/file.ts

## Steps
1. [Concrete action]
2. [Concrete action]

## Done When
- [ ] [Specific, verifiable criterion]

Then update .lisa/epics/<epicName>/.state:
- Set "planComplete": true
- Set "currentPhase": "plan"
- Update "lastUpdated"

## Guidelines
- Keep tasks focused (1-5 files per task)
- Make tasks independently verifiable
- Order dependencies logically
- Simple is better

## Epic Spec
<contents of spec.md>

## Research Findings
<contents of research.md>
---
```

**After sub-agent completes, verify:**
- Does `plan.md` exist with `## Overview`, `## Tasks`, `## Dependencies`?
- Do task files exist in `tasks/`?
- Does `.state` have `planComplete: true`?

If fails, retry up to 3 times with escalating urgency (same pattern as research).

**On success, show plan summary and ask:**
> "Plan ready: X tasks created. Ready to start execution? (yes/no)"
Wait for confirmation, then proceed to Step 4.

---

## Step 4: Execute Phase

**Check task status:**
Read all task files in `.lisa/epics/<epicName>/tasks/`. Count by status.

**If all tasks done:**
> "All tasks complete! Epic finished."
Update `.state`: `executeComplete: true`. STOP.

**If tasks remain, show summary:**
```
Ready to execute? X tasks remaining:
  Available now: [list task names with no unmet deps]
  Waiting on deps: [list blocked tasks]
```
Ask: > "(yes/no)"

Wait for confirmation. On yes:

### Execution Loop

Read `.lisa/config.jsonc` for `execution.maxParallelTasks` (default: 1).

**Loop until all tasks done or blocked:**

1. **Find available tasks:**
   Read `plan.md` `## Dependencies` section.
   For each task not yet done, check if all dependency task files have `## Status: done`.
   Collect tasks where all deps are satisfied.

2. **For each available task (up to maxParallelTasks):**

   Build task prompt inline and launch a Task sub-agent (general type):

   ```
   ---
   # Execute Task: <taskId> of epic "<epicName>"

   ## Git Orientation (if git available)
   Run these before starting:
   - `git status`
   - `git log --oneline -10`
   - `git diff HEAD`
   If git is not available, skip and proceed.

   ## Your Mission
   Execute the task below. When complete:
   1. Update task file status from "pending"/"in-progress" to "done"
   2. Add a ## Report section with:
      ### What Was Done
      ### Decisions Made
      ### Issues / Notes for Next Task
      ### Files Changed

   ## CONSTRAINTS
   - Work ONLY within the project directory
   - DO NOT access /tmp/, /private/, /var/, /etc/ or system dirs
   - For temp files use ./.tmp/ or .lisa/epics/<epicName>/tmp/

   ## Epic Spec
   <contents of spec.md>

   ## Research
   <contents of research.md>

   ## Plan
   <contents of plan.md>

   ## Dependency Task Reports
   <for each dependency task: its ## Report section only>

   ## Current Task
   File: .lisa/epics/<epicName>/tasks/<taskFile>
   <full task file contents>
   ---
   ```

   **After sub-agent completes, verify:**
   Read the task file. Check for:
   - `## Status: done`
   - `## Report`
   - `### What Was Done`
   - `### Files Changed`

   **If passes:** Continue to next task.

   **If fails (attempt 2):** Re-launch with:
   ```
   [TASK RETRY - MUST COMPLETE]
   Task <taskId> was NOT completed properly.
   Missing: [list what is missing]

   You MUST:
   1. Complete the task
   2. Update status to "done"
   3. Add ## Report with ### What Was Done and ### Files Changed

   DO NOT stop until ALL criteria are met.

   [original task prompt]
   ```

   **If fails (attempt 3):** Final urgent attempt.

   **If still incomplete after 3 attempts:**
   Update task file: change status to `## Status: blocked`. Add note explaining what failed.
   Report to user: "Task <taskId> blocked after 3 attempts. Moving to next available task."

3. **After batch completes:** Find available tasks again (newly unblocked by completed deps).

4. **Ask:** > "X tasks remaining (Y available now). Continue with next batch? (yes/no)"
   Wait for confirmation before each batch.

5. **Repeat** until all tasks are done or blocked.

**On completion:**

Read `.lisa/config.jsonc` `git.completionMode`:
- `"none"` (default): no git operations
- `"commit"`: `git add -A && git commit -m "feat: complete epic <epicName>"`
- `"pr"`: create branch `epic/<epicName>`, commit, push, `gh pr create`

Update `.state`: `executeComplete: true`, `currentPhase: "execute"`.

Show:
```
Epic complete! All X tasks finished.

Next: review the changes and run your tests.
```
