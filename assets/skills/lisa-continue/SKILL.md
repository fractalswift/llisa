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
> "Ready to start research? I'll explore the codebase with a dedicated agent."

Wait for confirmation. On yes:

### Research Execution with Verification

**ATTEMPT 1:**
1. Call `build_research_context("${epicName}")` to get the research prompt
2. Call **Task tool** with:
   - prompt: the returned prompt from build_research_context
   - subagent_type: "explore"
3. After Task completes, call `verify_research_complete("${epicName}")`
4. **If verification.complete === true:**
   - Show: "Research complete. Continue to planning?"
   - STOP and wait for user confirmation

**ATTEMPT 2** (if attempt 1 incomplete):
1. Call **Task tool** again with STRONGER prompt:
   ```
   [RESEARCH RETRY - MUST COMPLETE]
   
   Your previous attempt did not complete successfully.
   MISSING: [list issues from verification.issues]
   
   MANDATORY ACTIONS - DO NOT STOP UNTIL DONE:
   1. Read spec.md to understand requirements
   2. Explore codebase thoroughly
   3. Save COMPLETE research.md with ALL sections
   4. Update .state with researchComplete: true
   
   You MUST complete all items above. DO NOT stop early.
   DO NOT say "I will do this" - DO IT NOW.
   
   [original prompt from build_research_context]
   ```
2. After Task completes, call `verify_research_complete("${epicName}")` again
3. **If verification.complete === true:** Ask to continue to planning

**ATTEMPT 3** (if attempt 2 incomplete):
1. Call **Task tool** one more time with FINAL prompt:
   ```
   [FINAL ATTEMPT - COMPLETE OR FAIL]
   
   This is your FINAL attempt. If incomplete, task will be marked BLOCKED.
   
   STILL MISSING: [list remaining issues]
   
   DO EXACTLY THIS:
   1. Read spec.md
   2. Write research.md with ALL required sections
   3. Update .state file
   4. Confirm completion
   
   NO EXCUSES. DO IT NOW.
   ```
2. After Task completes, call `verify_research_complete("${epicName}")`
3. **If still incomplete:**
   - Update `.state` to set researchComplete: false with note about issues
   - Show: "Research could not be completed after 3 attempts. Issues: [list]. You can retry with /lisa-continue ${epicName} or mark research as manually complete."
   - STOP

---

## Step 3: Plan Phase

**If plan.md exists:**
> "Plan already complete with X tasks. Proceeding to execution..."
Skip to step 4.

**If not done:**
> "Ready to create the implementation plan?"

Wait for confirmation. On yes:

### Planning Execution with Verification

Same retry pattern as Research (3 attempts max):

**ATTEMPT 1:**
1. Call `build_planning_context("${epicName}")` to get the planning prompt
2. Call **Task tool** with:
   - prompt: the returned prompt from build_planning_context
   - subagent_type: "general"
3. After Task completes, call `verify_planning_complete("${epicName}")`
4. **If verification.complete === true:** Show summary and ask to continue to execution

**ATTEMPT 2-3:** Same retry logic with stronger prompts

**If still incomplete after 3 attempts:**
- Show: "Planning could not be completed after 3 attempts. Issues: [list]. You can retry or manually create the plan."
- STOP

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

### Execution Loop with Verification

Use config `execution.maxParallelTasks` (default: 1).

**For each task:**

1. Call `get_available_tasks(epicName)`
2. Take up to `maxParallelTasks` from available list
3. For each task:
   - Call `build_task_context(epicName, taskId)`
   - Call **Task tool** with the prompt
   - **After Task completes, call `verify_task_complete(epicName, taskId)`**
   
4. **If verification.complete === true:** Continue to next task
   
5. **If verification.complete === false:**
   
   **RETRY ATTEMPT 2:**
   - Call **Task tool** with STRONGER prompt:
     ```
     [TASK RETRY - MUST COMPLETE]
     
     Task ${taskId} was NOT completed properly.
     MISSING: [list verification.issues]
     
     You MUST:
     1. Complete the task described in ${taskFile}
     2. Update status to "done"
     3. Add ## Report section with ### What Was Done and ### Files Changed
     4. DO NOT stop until ALL criteria are met
     
     DO IT NOW. NO EXCUSES.
     
     [original task prompt]
     ```
   - After Task completes, call `verify_task_complete(epicName, taskId)` again
   
   **RETRY ATTEMPT 3:**
   - If still incomplete, final attempt with URGENT prompt
   - After Task completes, call verification
   
   **IF STILL INCOMPLETE:**
   - Mark task as `blocked` in task file
   - Show: "Task ${taskId} blocked after 3 attempts. Moving to next task."
   - Continue with other tasks

6. After all available tasks processed, call `get_available_tasks` again
7. Show progress, ask "Continue with next batch?"
8. Repeat until all done or all remaining tasks blocked

**On all complete:**
Check config `git.completionMode` and handle accordingly (see COMMON.md).

Show:
> "Epic complete! All X tasks finished.
>
> Changes made: [summary]"
