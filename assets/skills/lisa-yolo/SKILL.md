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
4. **ALWAYS execute next phase immediately** - After phase completes, start next phase.
5. **ONLY stop when truly done** - All tasks `done` OR all remaining `blocked`.
6. **Maximize progress per response** - Execute as many phases/tasks as possible.
7. **ALWAYS use fresh agents** - Each phase uses Task tool with clean context.
8. **ALWAYS verify completion** - Use verify_* tools after each phase.
9. **RETRY on failure** - Up to 3 attempts per phase before marking blocked.

Yolo is for autonomous execution. User has walked away. Every stop wastes time.

**If unsure, keep working.** Better to complete extra work than stop and ask.

---

## Verify Spec Exists

**If no spec:**
```
No spec found for epic '<name>'.

Create the epic first: /lisa-create-epic <name>
```
STOP.

---

## Activate/Resume Yolo in .state

Read current `.state` to check if yolo was previously active.

**If `yolo.active: true` already exists:**
```
Yolo mode was previously active (iteration ${currentIteration}).

Resuming from current state:
  ✓ Spec - ${specComplete ? 'complete' : 'not started'}
  ${researchComplete ? '✓' : '○'} Research - ${researchComplete ? 'complete' : 'not started'}
  ${planComplete ? '✓' : '○'} Plan - ${planComplete ? 'complete' : 'not started'}
  ● Execute - ${completedTasks}/${totalTasks} tasks done

Continuing yolo execution...
```

Increment iteration counter. Check if `iteration > maxIterations`:
```
Error: Max yolo iterations (${maxIterations}) reached.

The epic may be stuck or too complex for fully automatic execution.

Resume with:
  • /lisa-continue <name> - Switch to interactive mode with checkpoints
```
STOP.

**If yolo not active or new start:**
Update `.state`:
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

Run phases WITHOUT asking, using **fresh sub-agents** with **verification and retry**:

### 1. Research (if not done)

**DO NOT ask. Just do it.**

**ATTEMPT 1:**
1. Call `build_research_context("${epicName}")`
2. Call **Task tool** with:
   - prompt: returned research prompt
   - subagent_type: "explore"
3. Call `verify_research_complete("${epicName}")`
4. **If verification.complete === true:** Immediately proceed to planning

**ATTEMPT 2** (if incomplete):
1. Call **Task tool** with STRONGER prompt:
   ```
   [YOLO RESEARCH RETRY - MUST COMPLETE NOW]
   
   Previous attempt INCOMPLETE. Issues: [verification.issues]
   
   YOLO MODE = NO STOPPING. COMPLETE IMMEDIATELY:
   1. Read spec.md
   2. Write complete research.md
   3. Update .state
   
   DO NOT stop. DO NOT explain. JUST DO IT.
   
   [original research prompt]
   ```
2. Call `verify_research_complete("${epicName}")`
3. **If complete:** Proceed to planning

**ATTEMPT 3** (if still incomplete):
1. Final attempt with URGENT prompt
2. Call verification
3. **If still incomplete:**
   - Update `.state.yolo.active = false`
   - Show: "Yolo mode stopped: Research failed after 3 attempts. Issues: [list]. Use /lisa-continue ${epicName} for interactive mode."
   - STOP

---

### 2. Plan (if not done)

**DO NOT ask. Just do it.**

Same retry pattern as Research:

**ATTEMPT 1:**
1. Call `build_planning_context("${epicName}")`
2. Call **Task tool** with:
   - prompt: returned planning prompt
   - subagent_type: "general"
3. Call `verify_planning_complete("${epicName}")`
4. **If complete:** Immediately proceed to execution

**ATTEMPTS 2-3:** Same retry logic with stronger prompts

**If still incomplete after 3 attempts:**
- Stop yolo mode
- Report failure
- STOP

---

### 3. Execute

Use `execution.maxParallelTasks` from config (default: 1).

**TASK EXECUTION WITH VERIFICATION:**

Loop until all done or blocked:

1. Call `get_available_tasks(epicName)`
2. For each available task (up to maxParallelTasks):
   
   **ATTEMPT 1:**
   - Call `build_task_context(epicName, taskId)`
   - Call **Task tool** with prompt
   - Call `verify_task_complete(epicName, taskId)`
   - **If complete:** Move to next task
   
   **ATTEMPT 2** (if incomplete):
   - Call **Task tool** with STRONGER prompt:
     ```
     [YOLO TASK RETRY - COMPLETE IMMEDIATELY]
     
     Task ${taskId} NOT COMPLETE. Issues: [verification.issues]
     
     YOLO RULES:
     - DO NOT stop
     - DO NOT summarize
     - COMPLETE THE TASK NOW
     - Update status to "done"
     - Add full ## Report section
     
     [original task prompt]
     ```
   - Call verification
   - **If complete:** Move to next task
   
   **ATTEMPT 3** (if still incomplete):
   - Final attempt with URGENT prompt
   - Call verification
   - **If still incomplete:**
     - Mark task as `blocked` in task file
     - Continue with other tasks (DO NOT stop yolo)

3. Call `get_available_tasks` again
4. **REPEAT** - No summaries, just keep executing

**If all remaining tasks are blocked:**
- Update `.state.yolo.active = false`
- Show: "Yolo mode stopped: All remaining tasks blocked after retries."
- List blocked tasks and reasons
- STOP

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
