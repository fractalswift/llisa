---
name: lisa
description: Lisa - intelligent epic workflow with spec, research, plan, and execute phases. Smarter than Ralph.
---

# Lisa - Intelligent Epic Workflow

A structured approach to implementing large features by breaking them into phases: spec, research, plan, and execute.

Like the Ralph Wiggum pattern, but smarter. Lisa plans before she acts.

## Working Directory

Epics are stored in `.lisa/epics/` relative to **where you run `opencode`**. 

Run opencode from your project root and epics will be at `your-project/.lisa/epics/`.

**Example structure:**
```
my-project/           <- run `opencode` from here
├── .lisa/
│   ├── config.jsonc
│   ├── .gitignore
│   └── epics/
│       └── my-feature/
│           ├── .state
│           ├── spec.md
│           └── tasks/
├── src/
└── package.json
```

---

## Parse Arguments

The input format is: `<epic-name> [mode]`

### If no arguments or `help`:

If the user runs `/lisa` with no arguments, or `/lisa help`, immediately respond with this help menu (no tool calls needed):

```
Lisa - Intelligent Epic Workflow

Available Commands:

  /lisa list                - List all epics and their status
  /lisa <name>              - Continue or create an epic (interactive)
  /lisa <name> spec         - Create/view the spec only
  /lisa <name> status       - Show detailed epic status
  /lisa <name> yolo         - Auto-execute mode (no confirmations)
  /lisa config view         - View current configuration
  /lisa config init         - Initialize config with defaults
  /lisa config reset        - Reset config to defaults

Examples:
  /lisa list                - See all your epics
  /lisa auth-system         - Start or continue the auth-system epic
  /lisa auth-system yolo    - Run auth-system in full auto mode

Get started: /lisa <epic-name>
```

**Stop here. Do not call any tools or do anything else.**

### Otherwise, parse the arguments:

**Modes:**
- `list` → List all epics
- `config <action>` → Config management (view/init/reset)
- `<name>` (no mode) → Default mode with checkpoints
- `<name> spec` → Just create/view spec
- `<name> yolo` → Full auto, no checkpoints
- `<name> status` → Show status

**Examples:**
- `list` → list all epics
- `config view` → show config
- `my-feature` → default mode
- `my-feature spec` → spec only
- `my-feature yolo` → full auto
- `my-feature status` → show status

---

## Mode: config

Handle config subcommands using the `lisa_config` tool:

- `config view` → Call `lisa_config(action: "view")` and display the result
- `config init` → Call `lisa_config(action: "init")` and confirm creation
- `config reset` → Call `lisa_config(action: "reset")` and confirm reset

After the tool returns, display the result in a user-friendly format.

---

## Mode: list

**Use the `list_epics` tool** to quickly get all epics and their status.

Display the results in a formatted list showing:
- Epic name
- Current phase (spec/research/plan/execute/complete)
- Task progress (X/Y done) if in execute phase
- Whether yolo mode is active

**If no epics found:**
> "No epics found. Start one with `/lisa <name>`"

---

## Mode: status

**Use the `get_epic_status` tool** to quickly get detailed status.

Display the results showing:
- Current phase
- Which artifacts exist (spec.md, research.md, plan.md)
- Task breakdown: done, in-progress, pending, blocked
- Yolo mode status (if active)
- Suggested next action

**If epic doesn't exist:**
> "Epic '<name>' not found. Start it with `/lisa <name>`"

---

## Mode: spec

Interactive spec creation only. Does NOT continue to research/plan/execute.

### If spec already exists:

Read and display the existing spec, then:

> "Spec already exists at `.lisa/epics/<name>/spec.md`. You can:
> - Edit it directly in your editor
> - Delete it and run `/lisa <name> spec` again to start over
> - Run `/lisa <name>` to continue with research and planning"

### If no spec exists:

Have an interactive conversation to define the spec. Cover:

1. **Goal** - What are we trying to achieve? Why?
2. **Scope** - What's included? What's explicitly out of scope?
3. **Acceptance Criteria** - How do we know when it's done?
4. **Technical Constraints** - Any specific technologies, patterns, or limitations?

Be conversational. Ask clarifying questions. Push back if scope is too large or vague.

**Keep it concise** - aim for 20-50 lines. Focus on "what" and "why", not "how".

### When conversation is complete:

Summarize the spec and ask:

> "Here's the spec:
> 
> [formatted spec]
> 
> Ready to save to `.lisa/epics/<name>/spec.md`?"

On confirmation, create the directory and save:

```
.lisa/epics/<name>/
  spec.md
  .state
```

**spec.md format:**
```markdown
# Epic: <name>

## Goal
[What we're building and why - 1-2 sentences]

## Scope
- [What's included]
- [What's included]

### Out of Scope
- [What we're NOT doing]

## Acceptance Criteria
- [ ] [Measurable criterion]
- [ ] [Measurable criterion]

## Technical Constraints
- [Any constraints, or "None"]
```

**.state format (JSON):**
```json
{
  "name": "<name>",
  "currentPhase": "spec",
  "specComplete": true,
  "researchComplete": false,
  "planComplete": false,
  "executeComplete": false,
  "lastUpdated": "<timestamp>"
}
```

After saving:
> "Spec saved to `.lisa/epics/<name>/spec.md`
> 
> Next steps:
> - Run `/lisa <name>` to continue with research and planning
> - Run `/lisa <name> yolo` for full auto execution"

---

## Mode: default (with checkpoints)

This is the main interactive mode. It guides you through each phase with approval checkpoints.

### Step 1: Ensure spec exists

**If no spec:**
Run the spec conversation (same as spec mode). After saving, continue to step 2.

**If spec exists:**
Read and briefly summarize it, then continue to step 2.

### Step 2: Research phase

**If research.md already exists:**
> "Research already complete. Proceeding to planning..."
Skip to step 3.

**If research not done:**
> "Ready to start research? I'll explore the codebase to understand what's needed for this epic."

Wait for confirmation. On "yes" or similar:

1. Read spec.md
2. Explore the codebase using available tools (LSP, grep, glob, file reads)
3. Document findings
4. Save to `.lisa/epics/<name>/research.md`
5. Update .state

**research.md format:**
```markdown
# Research: <name>

## Overview
[1-2 sentence summary of findings]

## Relevant Files
- `path/to/file.ts` - [why it's relevant]
- `path/to/file.ts` - [why it's relevant]

## Existing Patterns
[How similar things are done in this codebase]

## Dependencies
[External packages or internal modules needed]

## Technical Findings
[Key discoveries that affect implementation]

## Recommendations
[Suggested approach based on findings]
```

After saving:
> "Research complete and saved. Found X relevant files. Key insight: [one line summary]"

### Step 3: Plan phase

**If plan.md already exists:**
> "Plan already complete with X tasks. Proceeding to execution..."
Skip to step 4.

**If plan not done:**
> "Ready to create the implementation plan?"

Wait for confirmation. On "yes" or similar:

1. Read spec.md and research.md
2. Break down into discrete tasks (aim for 1-5 files per task, ~30 min of work each)
3. Define dependencies between tasks
4. Save plan.md and individual task files
5. Update .state

**plan.md format:**
```markdown
# Plan: <name>

## Overview
[1-2 sentence summary of approach]

## Tasks

1. [Task name] - tasks/01-[slug].md
2. [Task name] - tasks/02-[slug].md
3. [Task name] - tasks/03-[slug].md

## Dependencies

- 01: []
- 02: [01]
- 03: [01]
- 04: [02, 03]

## Risks
- [Risk and mitigation, or "None identified"]
```

**Task file format (tasks/XX-slug.md):**
```markdown
# Task X: [Name]

## Status: pending

## Goal
[What this task accomplishes - 1-2 sentences]

## Files
- path/to/file1.ts
- path/to/file2.ts

## Steps
1. [Concrete step]
2. [Concrete step]
3. [Concrete step]

## Done When
- [ ] [Testable criterion]
- [ ] [Testable criterion]
```

After saving:
> "Plan created with X tasks:
> 1. [task 1 name]
> 2. [task 2 name]
> ...
> 
> Saved to `.lisa/epics/<name>/plan.md`"

### Step 4: Execute phase

**Use `get_available_tasks` tool** to quickly see what's ready to run.

**If all tasks done (available and blocked both empty):**
> "All tasks complete! Epic finished."
Stop.

**If tasks remain:**
Show task summary from the tool output and ask:
> "Ready to execute? X tasks remaining:
> - Available now: [from available list]
> - Blocked by dependencies: [from blocked list]"

Wait for confirmation. On "yes" or similar:

**Execute tasks using `build_task_context` + Task tool:**

Tasks with satisfied dependencies can be executed in **parallel** (the `available` list from `get_available_tasks` shows all tasks that are ready). Tasks whose dependencies aren't met yet are in the `blocked` list and must wait.

For each task in the `available` list:
1. Call `build_task_context(epicName, taskId)` to get the prompt
2. Call the Task tool with the prompt to spawn a sub-agent
3. After sub-agent(s) complete, call `get_available_tasks` again to refresh the list
4. If a task isn't done, retry up to 3 times, then mark blocked
5. Repeat until all tasks done

**Note:** If executing in parallel, each sub-agent gets the same context snapshot. Their reports will be available for subsequent tasks.

**On task failure (after 3 attempts):**
- Mark task as `blocked` in the task file
- Add `## Blocked Reason: [why]`
- Continue with other available tasks

**On all tasks complete:**
> "Epic complete! All X tasks finished.
> 
> Summary of changes:
> - [file]: [what changed]
> - [file]: [what changed]"

---

## Mode: yolo (full auto)

Full automatic execution with no checkpoints. Requires spec to exist.

**IMPORTANT:** In yolo mode, the Lisa plugin monitors for session idle events and automatically continues execution until all tasks are complete. You don't need to worry about session limits - just keep working and the plugin handles continuation.

### YOLO MODE RULES - READ CAREFULLY

When in yolo mode, you MUST follow these rules strictly:

1. **NEVER stop to summarize progress** - Don't say "I've completed X, Y tasks remain". Just keep working.

2. **NEVER ask for confirmation** - Don't say "Ready to continue?" or "Should I proceed?". Just proceed.

3. **NEVER explain what you're about to do** - Don't narrate. Execute.

4. **ALWAYS execute the next task immediately** - After one task completes, immediately call `get_available_tasks` and start the next one.

5. **ONLY stop when truly done** - You stop ONLY when:
   - All tasks have `## Status: done`, OR
   - All remaining tasks are `## Status: blocked`

6. **Treat each response as a work session** - Your goal is to make maximum progress before your response ends. Execute as many tasks as possible.

**Why these rules matter:** Yolo mode is for autonomous, unattended execution. The user has walked away. Every time you stop to summarize or ask a question, you break the automation and waste the user's time.

**If you're unsure, keep working.** It's better to complete an extra task than to stop and ask.

### If no spec exists:

> "No spec found at `.lisa/epics/<name>/spec.md`.
> 
> Create one first:
> - Interactively: `/lisa <name> spec`
> - Manually: Create `.lisa/epics/<name>/spec.md`"

Stop. Do not proceed.

### If spec exists:

**Step 1: Activate yolo mode in .state**

Read the current `.lisa/epics/<name>/.state` file and add the `yolo` configuration:

```json
{
  "name": "<name>",
  "currentPhase": "...",
  "specComplete": true,
  "researchComplete": false,
  "planComplete": false,
  "executeComplete": false,
  "lastUpdated": "<timestamp>",
  "yolo": {
    "active": true,
    "iteration": 1,
    "maxIterations": 100,
    "startedAt": "<current ISO timestamp>"
  }
}
```

This tells the Lisa plugin to automatically continue the session when you finish responding.

**Step 2: Run all phases without asking for confirmation:**

1. **Research** (if not done) - explore codebase, save research.md
2. **Plan** (if not done) - create plan.md and task files  
3. **Execute** - use `get_available_tasks` + `build_task_context` + Task tool

**Execute tasks using `build_task_context` + Task tool:**

Tasks with satisfied dependencies can be executed in **parallel** if desired.

1. Call `get_available_tasks(epicName)` to get the list of ready tasks
2. For each task in the `available` list (can parallelize):
   - Call `build_task_context(epicName, taskId)` to get the prompt
   - Call the Task tool with the prompt to spawn a sub-agent
3. After sub-agent(s) complete, call `get_available_tasks` again to refresh
4. If a task isn't done, retry up to 3 times, then mark blocked
5. Repeat until all tasks done or all blocked

The plugin will automatically continue the session if context fills up.

**REMEMBER THE YOLO RULES:** Don't stop to summarize. Don't ask questions. Just keep executing tasks until they're all done or blocked.

**On all tasks complete:**
- Update .state: set `executeComplete: true` and `yolo.active: false`
> "Epic complete! All X tasks finished."

**On task blocked (after 3 attempts):**
- Mark as blocked in the task file, continue with others
- If all remaining tasks blocked:
  - Update .state: set `yolo.active: false`
  - Report which tasks are blocked and why

---

## Shared: Task Execution Logic

**IMPORTANT: Use the `build_task_context` tool + Task tool for each task.**

This pattern ensures each task runs with fresh context in a sub-agent:
- Fresh context for each task (no accumulated cruft)
- Proper handoff between tasks via reports
- Consistent execution pattern

### Execution Flow (Orchestrator)

As the orchestrator, you manage the overall flow:

1. **Read plan.md** to understand task order and dependencies
2. **For each available task** (dependencies satisfied, not blocked):
   
   **Step A: Build context**
   ```
   Call build_task_context with:
   - epicName: the epic name  
   - taskId: the task number (e.g., "01", "02")
   ```
   This returns a `prompt` field with the full context.
   
   **Step B: Execute with sub-agent**
   ```
   Call the Task tool with:
   - description: "Execute task {taskId} of epic {epicName}"
   - prompt: [the prompt returned from build_task_context]
   ```
   
3. **After sub-agent completes**, check the task file:
   - If `## Status: done` → Move to next task
   - If not done → Retry (up to 3 times) or mark blocked
4. **Repeat** until all tasks done or all remaining tasks blocked

### What the Sub-Agent Does

The sub-agent (spawned via Task tool) receives full context and:

1. **Reads the context**: spec, research, plan, all previous task files with reports
2. **Executes the task steps**
3. **Updates the task file**:
   - Changes `## Status: pending` to `## Status: done`
   - Adds a `## Report` section (see format below)
4. **May update future tasks** if the plan needs changes
5. **Confirms completion** when done

### Task File Format (with Report)

After completion, a task file should look like:

```markdown
# Task 01: [Name]

## Status: done

## Goal
[What this task accomplishes]

## Files
- path/to/file1.ts
- path/to/file2.ts

## Steps
1. [Concrete step]
2. [Concrete step]

## Done When
- [x] [Criterion - now checked]
- [x] [Criterion - now checked]

## Report

### What Was Done
- Created X component
- Added Y functionality
- Configured Z

### Decisions Made
- Chose approach A over B because [reason]
- Used library X for [reason]

### Issues / Notes for Next Task
- The API returns data in format X, next task should handle this
- Found that Y needs to be done differently than planned

### Files Changed
- src/components/Foo.tsx (new)
- src/hooks/useBar.ts (modified)
- package.json (added dependency)
```

### Handling Failures

When `execute_epic_task` returns `status: "failed"`:

1. **Check the summary** for what went wrong
2. **Decide**:
   - Retry (up to 3 times) if it seems like a transient issue
   - Mark as blocked if fundamentally broken
   - Revise the plan if the approach is wrong

To mark as blocked:
```markdown
## Status: blocked

## Blocked Reason
[Explanation of why this task cannot proceed]
```

### On discovering the plan needs changes:

If during execution you realize:
- A task's approach is fundamentally wrong (not just a bug to fix)
- Tasks are missing that should have been included
- Dependencies are incorrect
- The order should change
- New information invalidates earlier assumptions

**You may update the plan. The plan is a living document, not a rigid contract.**

1. **Update the affected task file(s)** in `tasks/`:
   - Revise steps if the approach needs changing
   - Update "Files" if different files are involved
   - Update "Done When" if criteria need adjusting

2. **Update `plan.md`** if:
   - Adding new tasks (create new task files too)
   - Removing tasks (mark as `## Status: cancelled` with reason)
   - Changing dependencies

3. **Document the change** in the task file:
   ```markdown
   ## Plan Revision
   - Changed: [what changed]
   - Reason: [why the original approach didn't work]
   - Timestamp: [now]
   ```

4. **Continue execution** with the revised plan

**Key principle:** Do NOT keep retrying a broken approach. If something fundamentally doesn't work, adapt the plan. It's better to revise and succeed than to stubbornly fail.

---

## Shared: Parsing Dependencies

The plan.md Dependencies section looks like:
```markdown
## Dependencies
- 01: []
- 02: [01]
- 03: [01, 02]
```

A task is **available** when:
1. Status is `pending` (or `in-progress` with progress notes)
2. All tasks in its dependency list have status `done`

A task is **blocked** when:
1. Status is `blocked`, OR
2. Any dependency is not `done` and not expected to complete

---

## State File (.state)

Track epic progress in `.lisa/epics/<name>/.state`:

```json
{
  "name": "<name>",
  "currentPhase": "execute",
  "specComplete": true,
  "researchComplete": true,
  "planComplete": true,
  "executeComplete": false,
  "lastUpdated": "2026-01-16T10:00:00Z"
}
```

**With yolo mode active:**
```json
{
  "name": "<name>",
  "currentPhase": "execute",
  "specComplete": true,
  "researchComplete": true,
  "planComplete": true,
  "executeComplete": false,
  "lastUpdated": "2026-01-16T10:00:00Z",
  "yolo": {
    "active": true,
    "iteration": 1,
    "maxIterations": 100,
    "startedAt": "2026-01-16T10:00:00Z"
  }
}
```

**Yolo fields:**
- `active`: Set to `true` when yolo mode starts, `false` when complete or stopped
- `iteration`: Current iteration count (plugin increments this on each continuation)
- `maxIterations`: Safety limit. Use the value from config (`yolo.defaultMaxIterations`). Set to 0 for unlimited.
- `startedAt`: ISO timestamp when yolo mode was activated

Update this file after each phase completes. The Lisa plugin reads this file to determine whether to auto-continue.

---

## Configuration

Lisa settings are stored in `.lisa/config.jsonc`. The config is automatically created with safe defaults when you first create an epic.

**Config locations (merged in order):**
1. `~/.config/lisa/config.jsonc` - Global user defaults
2. `.lisa/config.jsonc` - Project settings (commit this)
3. `.lisa/config.local.jsonc` - Personal overrides (gitignored)

**Use the `get_lisa_config` tool** to read current config settings.

**Use the `lisa_config` tool** to view or manage config:
- `lisa_config(action: "view")` - Show current config and sources
- `lisa_config(action: "init")` - Create config if it doesn't exist
- `lisa_config(action: "reset")` - Reset config to defaults

### Config Schema

```jsonc
{
  "execution": {
    "maxRetries": 3           // Retries for failed tasks before marking blocked
  },
  "git": {
    "completionMode": "none", // "pr" | "commit" | "none"
    "branchPrefix": "epic/",  // Branch naming prefix
    "autoPush": true          // Auto-push when completionMode is "pr"
  },
  "yolo": {
    "defaultMaxIterations": 100  // Default max iterations (0 = unlimited)
  }
}
```

### Completion Modes

The `git.completionMode` setting controls what happens when an epic completes:

- **`"none"`** (default, safest): No git operations. You manage git entirely.
- **`"commit"`**: Create a branch and commits, but don't push. You handle push/PR.
- **`"pr"`**: Create branch, commits, push, and open a PR via `gh` CLI.

---

## Epic Completion

When all tasks are done and the epic is complete, follow this completion flow based on the config:

### Step 1: Check config

Call `get_lisa_config()` to read the current `git.completionMode`.

### Step 2: Execute completion based on mode

**If `git.completionMode` is `"none"`:**
- Update `.state` with `executeComplete: true`
- Report completion to user:
  > "Epic complete! All X tasks finished.
  > 
  > Changes have been made but not committed. You can review and commit them manually."

**If `git.completionMode` is `"commit"`:**
1. Create a new branch if not already on one:
   ```bash
   git checkout -b {branchPrefix}{epicName}
   ```
2. Stage and commit all changes:
   ```bash
   git add -A
   git commit -m "feat: {epic goal summary}"
   ```
3. Update `.state` with `executeComplete: true`
4. Report completion:
   > "Epic complete! All X tasks finished.
   > 
   > Changes committed to branch `{branchPrefix}{epicName}`.
   > Push and create a PR when ready:
   > ```
   > git push -u origin {branchPrefix}{epicName}
   > gh pr create
   > ```"

**If `git.completionMode` is `"pr"`:**
1. Create a new branch if not already on one:
   ```bash
   git checkout -b {branchPrefix}{epicName}
   ```
2. Stage and commit all changes:
   ```bash
   git add -A
   git commit -m "feat: {epic goal summary}"
   ```
3. Check if `gh` CLI is available:
   ```bash
   which gh
   ```
4. **If `gh` is available and `autoPush` is true:**
   ```bash
   git push -u origin {branchPrefix}{epicName}
   gh pr create --title "{epic goal}" --body "## Summary\n\n{epic description}\n\n## Tasks Completed\n\n{task list}"
   ```
   Report:
   > "Epic complete! All X tasks finished.
   > 
   > PR created: {PR URL}"

5. **If `gh` is NOT available:**
   Report:
   > "Epic complete! All X tasks finished.
   > 
   > Changes committed to branch `{branchPrefix}{epicName}`.
   > 
   > Note: GitHub CLI (`gh`) not found. Install it to enable automatic PR creation:
   > - macOS: `brew install gh`
   > - Then: `gh auth login`
   > 
   > To create a PR manually:
   > ```
   > git push -u origin {branchPrefix}{epicName}
   > gh pr create
   > ```"

### Commit Message Format

Use conventional commits format for the commit message:
- `feat: {epic goal}` for new features
- `fix: {epic goal}` for bug fixes
- `refactor: {epic goal}` for refactoring

Include a brief body with the tasks completed if helpful.

---

## First Epic Setup

When creating the first epic in a project (when `.lisa/` doesn't exist):

1. Create `.lisa/` directory
2. Create `.lisa/config.jsonc` with default settings
3. Create `.lisa/.gitignore` containing `config.local.jsonc`
4. Create `.lisa/epics/` directory
5. Create the epic directory `.lisa/epics/{epicName}/`

This ensures config is always present with safe defaults.
