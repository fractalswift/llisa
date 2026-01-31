---
name: lisa
description: Lisa - intelligent epic workflow with spec, research, plan, and execute phases. Smarter than Ralph.
---

# Lisa - Intelligent Epic Workflow

A structured approach to implementing large features by breaking them into phases: spec, research, plan, and execute.

Like the Ralph Wiggum pattern, but smarter. Lisa plans before she acts.

## Working Directory

Epics are stored in \`.lisa/epics/\` relative to **where you run \`opencode\`**.

Run opencode from your project root and epics will be at \`your-project/.lisa/epics/\`.

**Example structure:**
\`\`\`
my-project/           <- run \`opencode\` from here
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
\`\`\`

---

## Parse Arguments

The input format is: \`<epic-name> [mode]\`

### If no arguments or \`help\`:

If the user runs \`/lisa\` with no arguments, or \`/lisa help\`, IMMEDIATELY output EXACTLY this text (verbatim, no modifications, no tool calls):

---

**Lisa - Intelligent Epic Workflow**

**Available Commands:**

\`/lisa list\` - List all epics and their status  
\`/lisa <name>\` - Continue or create an epic (interactive)  
\`/lisa <name> spec\` - Create/view the spec only  
\`/lisa <name> status\` - Show detailed epic status  
\`/lisa <name> yolo\` - Auto-execute mode (no confirmations)  
\`/lisa config view\` - View current configuration  
\`/lisa config init\` - Initialize config with defaults  
\`/lisa config reset\` - Reset config to defaults  

**Examples:**
- \`/lisa list\` - See all your epics
- \`/lisa auth-system\` - Start or continue the auth-system epic
- \`/lisa auth-system yolo\` - Run auth-system in full auto mode

**Get started:** \`/lisa <epic-name>\`

---

**CRITICAL: Output the above help text EXACTLY as shown. Do not add explanations, do not call tools, do not be creative. Just show the menu and stop.**

### Otherwise, parse the arguments with SMART PARSING:

**CRITICAL PARSING RULES:**

The known modes are: \`list\`, \`config\`, \`spec\`, \`yolo\`, \`status\`

**Parse from RIGHT to LEFT:**
1. Check if the LAST argument is a known mode (spec/yolo/status)
2. If yes: everything BEFORE it = epic name (joined with hyphens), last arg = mode
3. If no: check if FIRST argument is "list" or "config" (special modes)
4. Otherwise: ALL arguments = epic name (joined with hyphens), mode = null (default)

**Parsing Examples:**
- \`initial setup\` → name: "initial-setup", mode: null
- \`initial setup yolo\` → name: "initial-setup", mode: "yolo"
- \`my complex feature spec\` → name: "my-complex-feature", mode: "spec"
- \`auth system status\` → name: "auth-system", mode: "status"
- \`list\` → mode: "list" (special, no epic name)
- \`config view\` → mode: "config view" (special, no epic name)
- \`my-feature\` → name: "my-feature", mode: null

**IMPORTANT:** Epic names are stored as hyphenated (e.g., \`initial-setup\`) but display with the user's original spacing in messages.

**Modes:**
- \`list\` → List all epics
- \`config <action>\` → Config management (view/init/reset)
- \`<name>\` (no mode) → Default mode with checkpoints
- \`<name> spec\` → Just create/view spec
- \`<name> yolo\` → Full auto, no checkpoints
- \`<name> status\` → Show status

---

## Mode: config

Handle config subcommands using the \`lisa_config\` tool:

- \`config view\` → Call \`lisa_config(action: "view")\` and display the result
- \`config init\` → Call \`lisa_config(action: "init")\` and confirm creation
- \`config reset\` → Call \`lisa_config(action: "reset")\` and confirm reset

After the tool returns, display the result in a user-friendly format.

---

## Mode: list

**Use the \`list_epics\` tool** to quickly get all epics and their status.

Display the results in a formatted list showing:
- Epic name
- Current phase (spec/research/plan/execute/complete)
- Task progress (X/Y done) if in execute phase
- Whether yolo mode is active

**If no epics found:**
> "No epics found. Start one with \`/lisa <name>\`"

---

## Mode: status

**Use the \`get_epic_status\` tool** to quickly get detailed status.

Display the results showing:
- Current phase
- Which artifacts exist (spec.md, research.md, plan.md)
- Task breakdown: done, in-progress, pending, blocked
- Yolo mode status (if active)
- Suggested next action

**If epic doesn't exist:**
> "Epic '<name>' not found. Start it with \`/lisa <name>\`"

---

## Mode: spec

Interactive spec creation only. Does NOT continue to research/plan/execute.

### If spec already exists:

Read and display the existing spec, then:

> "Spec already exists at \`.lisa/epics/<name>/spec.md\`. You can:
> - Edit it directly in your editor
> - Delete it and run \`/lisa <name> spec\` again to start over
> - Run \`/lisa <name>\` to continue with research and planning"

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
> Ready to save to \`.lisa/epics/<name>/spec.md\`?"

On confirmation, create the directory and save:

\`\`\`
.lisa/epics/<name>/
  spec.md
  .state
\`\`\`

**spec.md format:**
\`\`\`markdown
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
\`\`\`

**.state format (JSON):**
\`\`\`json
{
  "name": "<name>",
  "currentPhase": "spec",
  "specComplete": true,
  "researchComplete": false,
  "planComplete": false,
  "executeComplete": false,
  "lastUpdated": "<timestamp>"
}
\`\`\`

After saving:
> "Spec saved to \`.lisa/epics/<name>/spec.md\`
>
> Next steps:
> - Run \`/lisa <name>\` to continue with research and planning
> - Run \`/lisa <name> yolo\` for full auto execution"

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
4. Save to \`.lisa/epics/<name>/research.md\`
5. Update .state

**research.md format:**
\`\`\`markdown
# Research: <name>

## Overview
[1-2 sentence summary of findings]

## Relevant Files
- \`path/to/file.ts\` - [why it's relevant]
- \`path/to/file.ts\` - [why it's relevant]

## Existing Patterns
[How similar things are done in this codebase]

## Dependencies
[External packages or internal modules needed]

## Technical Findings
[Key discoveries that affect implementation]

## Recommendations
[Suggested approach based on findings]
\`\`\`

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
\`\`\`markdown
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
\`\`\`

**Task file format (tasks/XX-slug.md):**
\`\`\`markdown
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
\`\`\`

After saving:
> "Plan created with X tasks:
> 1. [task 1 name]
> 2. [task 2 name]
> ...
>
> Saved to \`.lisa/epics/<name>/plan.md\`"

### Step 4: Execute phase

**Use \`get_available_tasks\` tool** to quickly see what's ready to run.

**If all tasks done (available and blocked both empty):**
> "All tasks complete! Epic finished."
Stop.

**If tasks remain:**
Show task summary from the tool output and ask:
> "Ready to execute? X tasks remaining:
> - Available now: [from available list]
> - Blocked by dependencies: [from blocked list]"

Wait for confirmation. On "yes" or similar:

**Execute tasks using \`build_task_context\` + Task tool:**

Tasks with satisfied dependencies can be executed in **parallel** (the \`available\` list from \`get_available_tasks\` shows all tasks that are ready). Tasks whose dependencies aren't met yet are in the \`blocked\` list and must wait.

For each task in the \`available\` list:
1. Call \`build_task_context(epicName, taskId)\` to get the prompt
2. Call the Task tool with the prompt to spawn a sub-agent
3. After sub-agent(s) complete, call \`get_available_tasks\` again to refresh the list
4. If a task isn't done, retry up to 3 times, then mark blocked
5. Repeat until all tasks done

**Note:** If executing in parallel, each sub-agent gets the same context snapshot. Their reports will be available for subsequent tasks.

**On task failure (after 3 attempts):**
- Mark task as \`blocked\` in the task file
- Add \`## Blocked Reason: [why]\`
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

4. **ALWAYS execute the next task immediately** - After one task completes, immediately call \`get_available_tasks\` and start the next one.

5. **ONLY stop when truly done** - You stop ONLY when:
   - All tasks have \`## Status: done\`, OR
   - All remaining tasks are \`## Status: blocked\`

6. **Treat each response as a work session** - Your goal is to make maximum progress before your response ends. Execute as many tasks as possible.

**Why these rules matter:** Yolo mode is for autonomous, unattended execution. The user has walked away. Every time you stop to summarize or ask a question, you break the automation and waste the user's time.

**If you're unsure, keep working.** It's better to complete an extra task than to stop and ask.

### If no spec exists:

> "No spec found at \`.lisa/epics/<name>/spec.md\`.
>
> Create one first:
> - Interactively: \`/lisa <name> spec\`
> - Manually: Create \`.lisa/epics/<name>/spec.md\`"

Stop. Do not proceed.

### If spec exists:

**Step 1: Activate yolo mode in .state**

Read the current \`.lisa/epics/<name>/.state\` file and add the \`yolo\` configuration:

\`\`\`json
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
\`\`\`

This tells the Lisa plugin to automatically continue the session when you finish responding.

**Step 2: Run all phases without asking for confirmation:**

1. **Research** (if not done) - explore codebase, save research.md
2. **Plan** (if not done) - create plan.md and task files  
3. **Execute** - use \`get_available_tasks\` + \`build_task_context\` + Task tool

**Execute tasks using \`build_task_context\` + Task tool:**

Tasks with satisfied dependencies can be executed in **parallel** if desired.

1. Call \`get_available_tasks(epicName)\` to get the list of ready tasks
2. For each task in the \`available\` list (can parallelize):
   - Call \`build_task_context(epicName, taskId)\` to get the prompt
   - Call the Task tool with the prompt to spawn a sub-agent
3. After sub-agent(s) complete, call \`get_available_tasks\` again to refresh
4. If a task isn't done, retry up to 3 times, then mark blocked
5. Repeat until all tasks done or all blocked

The plugin will automatically continue the session if context fills up.

**REMEMBER THE YOLO RULES:** Don't stop to summarize. Don't ask questions. Just keep executing tasks until they're all done or blocked.

**On all tasks complete:**
- Update .state: set \`executeComplete: true\` and \`yolo.active: false\`
> "Epic complete! All X tasks finished."

**On task blocked (after 3 attempts):**
- Mark as blocked in the task file, continue with others
- If all remaining tasks blocked:
  - Update .state: set \`yolo.active: false\`
  - Report which tasks are blocked and why

---

## Shared: Task Execution Logic

**IMPORTANT: Use the \`build_task_context\` tool + Task tool for each task.**

This pattern ensures each task runs with fresh context in a sub-agent:
- Fresh context for each task (no accumulated cruft)
- Proper handoff between tasks via reports
- Consistent execution pattern

### Execution Flow (Orchestrator)

As the orchestrator, you manage the overall flow:

1. **Read plan.md** to understand task order and dependencies
2. **For each available task** (dependencies satisfied, not blocked):
   
   **Step A: Build context**
   \`\`\`
   Call build_task_context with:
   - epicName: the epic name  
   - taskId: the task number (e.g., "01", "02")
   \`\`\`
   This returns a \`prompt\` field with the full context.
   
   **Step B: Execute with sub-agent**
   \`\`\`
   Call the Task tool with:
   - description: "Execute task {taskId} of epic {epicName}"
   - prompt: [the prompt returned from build_task_context]
   \`\`\`
   
3. **After sub-agent completes**, check the task file:
   - If \`## Status: done\` → Move to next task
   - If not done → Retry (up to 3 times) or mark blocked
4. **Repeat** until all tasks done or all remaining tasks blocked

### What the Sub-Agent Does

The sub-agent (spawned via Task tool) receives full context and:

1. **Reads the context**: spec, research, plan, all previous task files with reports
2. **Executes the task steps**
3. **Updates the task file**:
   - Changes \`## Status: pending\` to \`## Status: done\`
   - Adds a \`## Report\` section (see format below)
4. **May update future tasks** if the plan needs changes
5. **Confirms completion** when done

### Task File Format (with Report)

After completion, a task file should look like:

\`\`\`markdown
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
\`\`\`

### Handling Failures

When \`execute_epic_task\` returns \`status: "failed"\`:

1. **Check the summary** for what went wrong
2. **Decide**:
   - Retry (up to 3 times) if it seems like a transient issue
   - Mark as blocked if fundamentally broken
   - Revise the plan if the approach is wrong

To mark as blocked:
\`\`\`markdown
## Status: blocked

## Blocked Reason
[Explanation of why this task cannot proceed]
\`\`\`

### On discovering the plan needs changes:

If during execution you realize:
- A task's approach is fundamentally wrong (not just a bug to fix)
- Tasks are missing that should have been included
- Dependencies are incorrect
- The order should change
- New information invalidates earlier assumptions

**You may update the plan. The plan is a living document, not a rigid contract.**

1. **Update the affected task file(s)** in \`tasks/\`:
   - Revise steps if the approach needs changing
   - Update "Files" if different files are involved
   - Update "Done When" if criteria need adjusting

2. **Update \`plan.md\`** if:
   - Adding new tasks (create new task files too)
   - Removing tasks (mark as \`## Status: cancelled\` with reason)
   - Changing dependencies

3. **Document the change** in the task file:
   \`\`\`markdown
   ## Plan Revision
   - Changed: [what changed]
   - Reason: [why the original approach didn't work]
   - Timestamp: [now]
   \`\`\`

4. **Continue execution** with the revised plan

**Key principle:** Do NOT keep retrying a broken approach. If something fundamentally doesn't work, adapt the plan. It's better to revise and succeed than to stubbornly fail.

---

## Shared: Parsing Dependencies

The plan.md Dependencies section looks like:
\`\`\`markdown
## Dependencies
- 01: []
- 02: [01]
- 03: [01, 02]
\`\`\`

A task is **available** when:
1. Status is \`pending\` (or \`in-progress\` with progress notes)
2. All tasks in its dependency list have status \`done\`

A task is **blocked** when:
1. Status is \`blocked\`, OR
2. Any dependency is not \`done\` and not expected to complete

---

## State File (.state)

Track epic progress in \`.lisa/epics/<name>/.state\`:

\`\`\`json
{
  "name": "<name>",
  "currentPhase": "execute",
  "specComplete": true,
  "researchComplete": true,
  "planComplete": true,
  "executeComplete": false,
  "lastUpdated": "2026-01-16T10:00:00Z"
}
\`\`\`

**With yolo mode active:**
\`\`\`json
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
\`\`\`

**Yolo fields:**
- \`active\`: Set to \`true\` when yolo mode starts, \`false\` when complete or stopped
- \`iteration\`: Current iteration count (plugin increments this on each continuation)
- \`maxIterations\`: Safety limit. Use the value from config (\`yolo.defaultMaxIterations\`). Set to 0 for unlimited.
- \`startedAt\`: ISO timestamp when yolo mode was activated

Update this file after each phase completes. The Lisa plugin reads this file to determine whether to auto-continue.

---

## Configuration

Lisa settings are stored in \`.lisa/config.jsonc\`. The config is automatically created with safe defaults when you first create an epic.

**Config locations (merged in order):**
1. \`~/.config/lisa/config.jsonc\` - Global user defaults
2. \`.lisa/config.jsonc\` - Project settings (commit this)
3. \`.lisa/config.local.jsonc\` - Personal overrides (gitignored)

**Use the \`get_lisa_config\` tool** to read current config settings.

**Use the \`lisa_config\` tool** to view or manage config:
- \`lisa_config(action: "view")\` - Show current config and sources
- \`lisa_config(action: "init")\` - Create config if it doesn't exist
- \`lisa_config(action: "reset")\` - Reset config to defaults

### Config Schema

\`\`\`jsonc
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
\`\`\`

### Completion Modes

The \`git.completionMode\` setting controls what happens when an epic completes:

- **\`"none"\`** (default, safest): No git operations. You manage git entirely.
- **\`"commit"\`**: Create a branch and commits, but don't push. You handle push/PR.
- **\`"pr"\`**: Create branch, commits, push, and open a PR via \`gh\` CLI.

---

## Epic Completion

When all tasks are done and the epic is complete, follow this completion flow based on the config:

### Step 1: Check config

Call \`get_lisa_config()\` to read the current \`git.completionMode\`.

### Step 2: Execute completion based on mode

**If \`git.completionMode\` is \`"none"\`:**
- Update \`.state\` with \`executeComplete: true\`
- Report completion to user:
  > "Epic complete! All X tasks finished.
  >
  > Changes have been made but not committed. You can review and commit them manually."

**If \`git.completionMode\` is \`"commit"\`:**
1. Create a new branch if not already on one:
   \`\`\`bash
   git checkout -b {branchPrefix}{epicName}
   \`\`\`
2. Stage and commit all changes:
   \`\`\`bash
   git add -A
   git commit -m "feat: {epic goal summary}"
   \`\`\`
3. Update \`.state\` with \`executeComplete: true\`
4. Report completion:
   > "Epic complete! All X tasks finished.
   >
   > Changes committed to branch \`{branchPrefix}{epicName}\`.
   > Push and create a PR when ready:
   > \`\`\`
   > git push -u origin {branchPrefix}{epicName}
   > gh pr create
   > \`\`\`"

**If \`git.completionMode\` is \`"pr"\`:**
1. Create a new branch if not already on one:
   \`\`\`bash
   git checkout -b {branchPrefix}{epicName}
   \`\`\`
2. Stage and commit all changes:
   \`\`\`bash
   git add -A
   git commit -m "feat: {epic goal summary}"
   \`\`\`
3. Check if \`gh\` CLI is available:
   \`\`\`bash
   which gh
   \`\`\`
4. **If \`gh\` is available and \`autoPush\` is true:**
   \`\`\`bash
   git push -u origin {branchPrefix}{epicName}
   gh pr create --title "{epic goal}" --body "## Summary\\n\\n{epic description}\\n\\n## Tasks Completed\\n\\n{task list}"
   \`\`\`
   Report:
   > "Epic complete! All X tasks finished.
   >
   > PR created: {PR URL}"

5. **If \`gh\` is NOT available:**
   Report:
   > "Epic complete! All X tasks finished.
   >
   > Changes committed to branch \`{branchPrefix}{epicName}\`.
   >
   > Note: GitHub CLI (\`gh\`) not found. Install it to enable automatic PR creation:
   > - macOS: \`brew install gh\`
   > - Then: \`gh auth login\`
   >
   > To create a PR manually:
   > \`\`\`
   > git push -u origin {branchPrefix}{epicName}
   > gh pr create
   > \`\`\`"

### Commit Message Format

Use conventional commits format for the commit message:
- \`feat: {epic goal}\` for new features
- \`fix: {epic goal}\` for bug fixes
- \`refactor: {epic goal}\` for refactoring

Include a brief body with the tasks completed if helpful.

---

## First Epic Setup

When creating the first epic in a project (when \`.lisa/\` doesn't exist):

1. Create \`.lisa/\` directory
2. Create \`.lisa/config.jsonc\` with default settings
3. Create \`.lisa/.gitignore\` containing \`config.local.jsonc\`
4. Create \`.lisa/epics/\` directory
5. Create the epic directory \`.lisa/epics/{epicName}/\`

This ensures config is always present with safe defaults.
`

/**
 * Lisa - Intelligent Epic Workflow Plugin for OpenCode
 *
 * Like the Ralph Wiggum pattern, but smarter. Lisa plans before she acts.
 *
 * Provides:
 * 1. `build_task_context` tool - Builds context for a task (to be used with Task tool)
 * 2. Yolo mode auto-continue - Keeps the session running until all tasks are done
 *
 * Works with the lisa skill (.opencode/skill/lisa/SKILL.md) which manages the epic state.
 */

// ============================================================================
// Types
// ============================================================================

interface YoloState {
  active: boolean
  iteration: number
  maxIterations: number
  startedAt: string
}

interface EpicState {
  name: string
  currentPhase: string
  specComplete: boolean
  researchComplete: boolean
  planComplete: boolean
  executeComplete: boolean
  lastUpdated: string
  yolo?: YoloState
}

// ----------------------------------------------------------------------------
// Lisa Configuration Types
// ----------------------------------------------------------------------------

type GitCompletionMode = "pr" | "commit" | "none"

interface LisaConfigExecution {
  maxRetries: number
}

interface LisaConfigGit {
  completionMode: GitCompletionMode
  branchPrefix: string
  autoPush: boolean
}

interface LisaConfigYolo {
  defaultMaxIterations: number
}

interface LisaConfig {
  execution: LisaConfigExecution
  git: LisaConfigGit
  yolo: LisaConfigYolo
}

// Default configuration (most cautious)
const DEFAULT_CONFIG: LisaConfig = {
  execution: {
    maxRetries: 3,
  },
  git: {
    completionMode: "none",
    branchPrefix: "epic/",
    autoPush: true,
  },
  yolo: {
    defaultMaxIterations: 100,
  },
}

// Default config file content with comments
const DEFAULT_CONFIG_CONTENT = `{
  // Lisa Configuration
  // 
  // Merge order: ~/.config/lisa/config.jsonc -> .lisa/config.jsonc -> .lisa/config.local.jsonc
  // Override locally (gitignored) with: .lisa/config.local.jsonc

  "execution": {
    // Number of retries for failed tasks before stopping
    "maxRetries": 3
  },

  "git": {
    // How the epic completes when all tasks are done:
    //   "pr"     - Create branch, commit, push, and open PR (requires \`gh\` CLI)
    //   "commit" - Create commits only, you handle push/PR manually  
    //   "none"   - No git operations, you manage everything
    "completionMode": "none",

    // Branch naming prefix (e.g., "epic/my-feature")
    "branchPrefix": "epic/",

    // When completionMode is "pr": automatically push and create PR
    // Set false to review commits before pushing
    "autoPush": true
  },

  "yolo": {
    // Maximum iterations in yolo mode before pausing (0 = unlimited)
    "defaultMaxIterations": 100
  }
}
`

// .gitignore content for .lisa directory
const LISA_GITIGNORE_CONTENT = `# Local config overrides (not committed)
config.local.jsonc
`

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Read a file if it exists, return empty string otherwise
 */
async function readFileIfExists(path: string): Promise<string> {
  if (!existsSync(path)) return ""
  try {
    return await readFile(path, "utf-8")
  } catch {
    return ""
  }
}

/**
 * Strip JSON comments (single-line // and multi-line block comments) from a string
 * Simple state-machine approach - handles most common cases
 */
function stripJsonComments(jsonc: string): string {
  // Remove single-line comments (// ...)
  // Be careful not to match // inside strings
  let result = ""
  let inString = false
  let inSingleLineComment = false
  let inMultiLineComment = false
  let i = 0

  while (i < jsonc.length) {
    const char = jsonc[i]
    const nextChar = jsonc[i + 1]

    // Handle string boundaries
    if (!inSingleLineComment && !inMultiLineComment && char === '"' && jsonc[i - 1] !== "\\") {
      inString = !inString
      result += char
      i++
      continue
    }

    // Skip content inside strings
    if (inString) {
      result += char
      i++
      continue
    }

    // Check for comment start
    if (!inSingleLineComment && !inMultiLineComment && char === "/" && nextChar === "/") {
      inSingleLineComment = true
      i += 2
      continue
    }

    if (!inSingleLineComment && !inMultiLineComment && char === "/" && nextChar === "*") {
      inMultiLineComment = true
      i += 2
      continue
    }

    // Check for comment end
    if (inSingleLineComment && (char === "\n" || char === "\r")) {
      inSingleLineComment = false
      result += char
      i++
      continue
    }

    if (inMultiLineComment && char === "*" && nextChar === "/") {
      inMultiLineComment = false
      i += 2
      continue
    }

    // Skip comment content
    if (inSingleLineComment || inMultiLineComment) {
      i++
      continue
    }

    result += char
    i++
  }

  return result
}

/**
 * Deep merge two objects, with source overwriting target for matching keys
 */
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target }

  for (const key of Object.keys(source) as Array<keyof T>) {
    const sourceValue = source[key]
    const targetValue = target[key]

    if (
      sourceValue !== undefined &&
      typeof sourceValue === "object" &&
      sourceValue !== null &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === "object" &&
      targetValue !== null &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(targetValue, sourceValue as any)
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue as T[keyof T]
    }
  }

  return result
}

/**
 * Validate and sanitize config, logging warnings for invalid values
 */
function validateConfig(config: Partial<LisaConfig>, logWarning: (msg: string) => void): LisaConfig {
  const result = deepMerge(DEFAULT_CONFIG, config)

  // Validate execution.maxRetries
  if (typeof result.execution.maxRetries !== "number" || result.execution.maxRetries < 0) {
    logWarning(`Invalid execution.maxRetries: ${result.execution.maxRetries}. Using default: ${DEFAULT_CONFIG.execution.maxRetries}`)
    result.execution.maxRetries = DEFAULT_CONFIG.execution.maxRetries
  }

  // Validate git.completionMode
  const validModes: GitCompletionMode[] = ["pr", "commit", "none"]
  if (!validModes.includes(result.git.completionMode)) {
    logWarning(`Invalid git.completionMode: "${result.git.completionMode}". Using default: "${DEFAULT_CONFIG.git.completionMode}"`)
    result.git.completionMode = DEFAULT_CONFIG.git.completionMode
  }

  // Validate git.branchPrefix
  if (typeof result.git.branchPrefix !== "string" || result.git.branchPrefix.length === 0) {
    logWarning(`Invalid git.branchPrefix: "${result.git.branchPrefix}". Using default: "${DEFAULT_CONFIG.git.branchPrefix}"`)
    result.git.branchPrefix = DEFAULT_CONFIG.git.branchPrefix
  }

  // Validate git.autoPush
  if (typeof result.git.autoPush !== "boolean") {
    logWarning(`Invalid git.autoPush: ${result.git.autoPush}. Using default: ${DEFAULT_CONFIG.git.autoPush}`)
    result.git.autoPush = DEFAULT_CONFIG.git.autoPush
  }

  // Validate yolo.defaultMaxIterations
  if (typeof result.yolo.defaultMaxIterations !== "number" || result.yolo.defaultMaxIterations < 0) {
    logWarning(`Invalid yolo.defaultMaxIterations: ${result.yolo.defaultMaxIterations}. Using default: ${DEFAULT_CONFIG.yolo.defaultMaxIterations}`)
    result.yolo.defaultMaxIterations = DEFAULT_CONFIG.yolo.defaultMaxIterations
  }

  return result
}

/**
 * Load config from a JSONC file
 */
async function loadConfigFile(path: string): Promise<Partial<LisaConfig> | null> {
  if (!existsSync(path)) return null

  try {
    const content = await readFile(path, "utf-8")
    const stripped = stripJsonComments(content)
    return JSON.parse(stripped) as Partial<LisaConfig>
  } catch {
    return null
  }
}

/**
 * Load and merge config from all sources
 * Order: global -> project -> project-local
 */
async function loadConfig(directory: string, logWarning: (msg: string) => void): Promise<LisaConfig> {
  const homeDir = process.env.HOME || process.env.USERPROFILE || ""
  
  // Config file paths
  const globalConfigPath = join(homeDir, ".config", "lisa", "config.jsonc")
  const projectConfigPath = join(directory, ".lisa", "config.jsonc")
  const localConfigPath = join(directory, ".lisa", "config.local.jsonc")

  // Load configs in order
  const globalConfig = await loadConfigFile(globalConfigPath)
  const projectConfig = await loadConfigFile(projectConfigPath)
  const localConfig = await loadConfigFile(localConfigPath)

  // Merge configs
  let merged: Partial<LisaConfig> = {}
  
  if (globalConfig) {
    merged = deepMerge(merged as LisaConfig, globalConfig)
  }
  if (projectConfig) {
    merged = deepMerge(merged as LisaConfig, projectConfig)
  }
  if (localConfig) {
    merged = deepMerge(merged as LisaConfig, localConfig)
  }

  // Validate and return
  return validateConfig(merged, logWarning)
}

/**
 * Ensure .lisa directory exists with config files
 */
async function ensureLisaDirectory(directory: string): Promise<{ created: boolean; configCreated: boolean }> {
  const lisaDir = join(directory, ".lisa")
  const configPath = join(lisaDir, "config.jsonc")
  const gitignorePath = join(lisaDir, ".gitignore")

  let created = false
  let configCreated = false

  // Create .lisa directory if needed
  if (!existsSync(lisaDir)) {
    const { mkdir } = await import("fs/promises")
    await mkdir(lisaDir, { recursive: true })
    created = true
  }

  // Create config.jsonc if it doesn't exist
  if (!existsSync(configPath)) {
    await writeFile(configPath, DEFAULT_CONFIG_CONTENT, "utf-8")
    configCreated = true
  }

  // Create .gitignore if it doesn't exist
  if (!existsSync(gitignorePath)) {
    await writeFile(gitignorePath, LISA_GITIGNORE_CONTENT, "utf-8")
  }

  return { created, configCreated }
}

/**
 * Get all task files for an epic, sorted by task number
 */
async function getTaskFiles(directory: string, epicName: string): Promise<string[]> {
  const tasksDir = join(directory, ".lisa", "epics", epicName, "tasks")

  if (!existsSync(tasksDir)) return []

  try {
    const files = await readdir(tasksDir)
    return files
      .filter((f) => f.endsWith(".md"))
      .sort((a, b) => {
        const numA = parseInt(a.match(/^(\d+)/)?.[1] || "0", 10)
        const numB = parseInt(b.match(/^(\d+)/)?.[1] || "0", 10)
        return numA - numB
      })
  } catch {
    return []
  }
}

/**
 * Find the active epic with yolo mode enabled
 */
async function findActiveYoloEpic(
  directory: string
): Promise<{ name: string; state: EpicState } | null> {
  const epicsDir = join(directory, ".lisa", "epics")

  if (!existsSync(epicsDir)) return null

  try {
    const entries = await readdir(epicsDir, { withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const statePath = join(epicsDir, entry.name, ".state")
      if (!existsSync(statePath)) continue

      try {
        const content = await readFile(statePath, "utf-8")
        const state = JSON.parse(content) as EpicState

        if (state.yolo?.active) {
          return { name: entry.name, state }
        }
      } catch {
        continue
      }
    }
  } catch {
    return null
  }

  return null
}

/**
 * Count remaining tasks for an epic (pending or in-progress)
 */
async function countRemainingTasks(directory: string, epicName: string): Promise<number> {
  const tasksDir = join(directory, ".lisa", "epics", epicName, "tasks")

  if (!existsSync(tasksDir)) return 0

  try {
    const files = await readdir(tasksDir)
    const mdFiles = files.filter((f) => f.endsWith(".md"))

    let remaining = 0
    for (const file of mdFiles) {
      const content = await readFile(join(tasksDir, file), "utf-8")
      if (!content.includes("## Status: done") && !content.includes("## Status: blocked")) {
        remaining++
      }
    }
    return remaining
  } catch {
    return 0
  }
}

/**
 * Update the epic's .state file
 */
async function updateEpicState(
  directory: string,
  epicName: string,
  updates: Partial<EpicState>
): Promise<void> {
  const statePath = join(directory, ".lisa", "epics", epicName, ".state")

  try {
    const content = await readFile(statePath, "utf-8")
    const state = JSON.parse(content) as EpicState

    const newState = { ...state, ...updates, lastUpdated: new Date().toISOString() }

    // Handle nested yolo updates
    if (updates.yolo && state.yolo) {
      newState.yolo = { ...state.yolo, ...updates.yolo }
    }

    await writeFile(statePath, JSON.stringify(newState, null, 2), "utf-8")
  } catch {
    // Ignore errors
  }
}

/**
 * Send a desktop notification (cross-platform)
 * Fails silently if notifications aren't available
 */
async function notify($: any, title: string, message: string): Promise<void> {
  try {
    // macOS
    await $`osascript -e 'display notification "${message}" with title "${title}"'`.quiet()
  } catch {
    try {
      // Linux
      await $`notify-send "${title}" "${message}"`.quiet()
    } catch {
      // Silently fail - don't pollute the UI with console.log
    }
  }
}

/**
 * Get task statistics for an epic
 */
async function getTaskStats(
  directory: string,
  epicName: string
): Promise<{ total: number; done: number; inProgress: number; pending: number; blocked: number }> {
  const tasksDir = join(directory, ".lisa", "epics", epicName, "tasks")

  if (!existsSync(tasksDir)) {
    return { total: 0, done: 0, inProgress: 0, pending: 0, blocked: 0 }
  }

  try {
    const files = await readdir(tasksDir)
    const mdFiles = files.filter((f) => f.endsWith(".md"))

    let done = 0
    let inProgress = 0
    let pending = 0
    let blocked = 0

    for (const file of mdFiles) {
      const content = await readFile(join(tasksDir, file), "utf-8")
      if (content.includes("## Status: done")) {
        done++
      } else if (content.includes("## Status: in-progress")) {
        inProgress++
      } else if (content.includes("## Status: blocked")) {
        blocked++
      } else {
        pending++
      }
    }

    return { total: mdFiles.length, done, inProgress, pending, blocked }
  } catch {
    return { total: 0, done: 0, inProgress: 0, pending: 0, blocked: 0 }
  }
}

/**
 * Parse dependencies from plan.md
 */
async function parseDependencies(
  directory: string,
  epicName: string
): Promise<Map<string, string[]>> {
  const planPath = join(directory, ".lisa", "epics", epicName, "plan.md")
  const deps = new Map<string, string[]>()

  if (!existsSync(planPath)) return deps

  try {
    const content = await readFile(planPath, "utf-8")
    const depsMatch = content.match(/## Dependencies\n([\s\S]*?)(?=\n##|$)/)
    if (!depsMatch) return deps

    const lines = depsMatch[1].trim().split("\n")
    for (const line of lines) {
      const match = line.match(/^-\s*(\d+):\s*\[(.*)\]/)
      if (match) {
        const taskId = match[1]
        const depList = match[2]
          .split(",")
          .map((d) => d.trim())
          .filter((d) => d.length > 0)
        deps.set(taskId, depList)
      }
    }
  } catch {
    // Ignore errors
  }

  return deps
}

// ============================================================================
// Plugin
// ============================================================================

export const LisaPlugin: Plugin = async ({ directory, client, $ }) => {
  // Register /lisa command programmatically
  // This replaces the external .opencode/command/lisa.md file
  if (client.registerCommand) {
    client.registerCommand({
      name: 'lisa',
      description: 'Lisa - intelligent epic workflow (/lisa help for commands)',
      handler: async (args: string[]) => {
        // Parse arguments like the command file would
        const input = args.join(' ').trim()

        // If no args or help, return the help menu from SKILL.md
        if (!input || input === 'help') {
          return LISA_SKILL_CONTENT
        }

        // Otherwise, this would normally invoke the skill
        // For now, return a message directing to use the skill
        return `Lisa command received: "${input}". Use the lisa skill for full functionality.`
      }
    })
  }

  return {
    // ========================================================================
    // Custom Tools
    // ========================================================================
    tool: {
      // ----------------------------------------------------------------------
      // list_epics - Fast listing of all epics
      // ----------------------------------------------------------------------
      list_epics: tool({
        description: `List all epics and their current status.

Returns a list of all epics in .lisa/epics/ with their phase and task progress.
Much faster than manually reading files.`,
        args: {},
        async execute() {
          const epicsDir = join(directory, ".lisa", "epics")

          if (!existsSync(epicsDir)) {
            return JSON.stringify({
              epics: [],
              message: "No epics found. Start one with `/lisa <name>`",
            }, null, 2)
          }

          try {
            const entries = await readdir(epicsDir, { withFileTypes: true })
            const epics: Array<{
              name: string
              phase: string
              tasks: { done: number; total: number } | null
              yoloActive: boolean
            }> = []

            for (const entry of entries) {
              if (!entry.isDirectory()) continue

              const statePath = join(epicsDir, entry.name, ".state")
              let phase = "unknown"
              let yoloActive = false

              if (existsSync(statePath)) {
                try {
                  const content = await readFile(statePath, "utf-8")
                  const state = JSON.parse(content) as EpicState
                  phase = state.currentPhase || "unknown"
                  yoloActive = state.yolo?.active || false
                } catch {
                  phase = "unknown"
                }
              } else {
                // No state file - check what exists
                const hasSpec = existsSync(join(epicsDir, entry.name, "spec.md"))
                const hasResearch = existsSync(join(epicsDir, entry.name, "research.md"))
                const hasPlan = existsSync(join(epicsDir, entry.name, "plan.md"))
                const hasTasks = existsSync(join(epicsDir, entry.name, "tasks"))

                if (hasTasks) phase = "execute"
                else if (hasPlan) phase = "plan"
                else if (hasResearch) phase = "research"
                else if (hasSpec) phase = "spec"
                else phase = "new"
              }

              // Get task stats if in execute phase
              let tasks: { done: number; total: number } | null = null
              if (phase === "execute") {
                const stats = await getTaskStats(directory, entry.name)
                tasks = { done: stats.done, total: stats.total }
              }

              epics.push({ name: entry.name, phase, tasks, yoloActive })
            }

            return JSON.stringify({ epics }, null, 2)
          } catch (error) {
            return JSON.stringify({ epics: [], error: String(error) }, null, 2)
          }
        },
      }),

      // ----------------------------------------------------------------------
      // get_epic_status - Detailed status for one epic
      // ----------------------------------------------------------------------
      get_epic_status: tool({
        description: `Get detailed status for a specific epic.

Returns phase, artifacts, task breakdown, and available actions.
Much faster than manually reading multiple files.`,
        args: {
          epicName: tool.schema.string().describe("Name of the epic"),
        },
        async execute(args) {
          const { epicName } = args
          const epicDir = join(directory, ".lisa", "epics", epicName)

          if (!existsSync(epicDir)) {
            return JSON.stringify({
              found: false,
              error: `Epic "${epicName}" not found. Start it with \`/lisa ${epicName}\``,
            }, null, 2)
          }

          // Check which artifacts exist
          const artifacts = {
            spec: existsSync(join(epicDir, "spec.md")),
            research: existsSync(join(epicDir, "research.md")),
            plan: existsSync(join(epicDir, "plan.md")),
            tasks: existsSync(join(epicDir, "tasks")),
            state: existsSync(join(epicDir, ".state")),
          }

          // Read state
          let state: EpicState | null = null
          if (artifacts.state) {
            try {
              const content = await readFile(join(epicDir, ".state"), "utf-8")
              state = JSON.parse(content)
            } catch {
              state = null
            }
          }

          // Get task stats
          const taskStats = await getTaskStats(directory, epicName)

          // Determine current phase
          let currentPhase = state?.currentPhase || "unknown"
          if (currentPhase === "unknown") {
            if (artifacts.tasks) currentPhase = "execute"
            else if (artifacts.plan) currentPhase = "plan"
            else if (artifacts.research) currentPhase = "research"
            else if (artifacts.spec) currentPhase = "spec"
            else currentPhase = "new"
          }

          // Determine next action
          let nextAction = ""
          if (!artifacts.spec) {
            nextAction = `Create spec with \`/lisa ${epicName} spec\``
          } else if (!artifacts.research) {
            nextAction = `Run \`/lisa ${epicName}\` to start research`
          } else if (!artifacts.plan) {
            nextAction = `Run \`/lisa ${epicName}\` to create plan`
          } else if (taskStats.pending > 0 || taskStats.inProgress > 0) {
            nextAction = `Run \`/lisa ${epicName}\` to continue execution or \`/lisa ${epicName} yolo\` for auto mode`
          } else if (taskStats.blocked > 0) {
            nextAction = `${taskStats.blocked} task(s) blocked - review and unblock`
          } else {
            nextAction = "Epic complete!"
          }

          return JSON.stringify({
            found: true,
            name: epicName,
            currentPhase,
            artifacts,
            tasks: taskStats,
            yolo: state?.yolo || null,
            lastUpdated: state?.lastUpdated || null,
            nextAction,
          }, null, 2)
        },
      }),

      // ----------------------------------------------------------------------
      // get_available_tasks - Tasks ready to execute
      // ----------------------------------------------------------------------
      get_available_tasks: tool({
        description: `Get tasks that are available to execute (dependencies satisfied).

Returns tasks that are pending/in-progress and have all dependencies completed.`,
        args: {
          epicName: tool.schema.string().describe("Name of the epic"),
        },
        async execute(args) {
          const { epicName } = args
          const epicDir = join(directory, ".lisa", "epics", epicName)
          const tasksDir = join(epicDir, "tasks")

          if (!existsSync(tasksDir)) {
            return JSON.stringify({
              available: [],
              blocked: [],
              message: "No tasks directory found",
            }, null, 2)
          }

          // Get all task files
          const taskFiles = await getTaskFiles(directory, epicName)
          if (taskFiles.length === 0) {
            return JSON.stringify({
              available: [],
              blocked: [],
              message: "No task files found",
            }, null, 2)
          }

          // Parse dependencies
          const dependencies = await parseDependencies(directory, epicName)

          // Read task statuses
          const taskStatuses = new Map<string, string>()
          for (const file of taskFiles) {
            const taskId = file.match(/^(\d+)/)?.[1] || ""
            const content = await readFile(join(tasksDir, file), "utf-8")

            if (content.includes("## Status: done")) {
              taskStatuses.set(taskId, "done")
            } else if (content.includes("## Status: in-progress")) {
              taskStatuses.set(taskId, "in-progress")
            } else if (content.includes("## Status: blocked")) {
              taskStatuses.set(taskId, "blocked")
            } else {
              taskStatuses.set(taskId, "pending")
            }
          }

          // Determine which tasks are available
          const available: Array<{ taskId: string; file: string; status: string }> = []
          const blocked: Array<{ taskId: string; file: string; blockedBy: string[] }> = []

          for (const file of taskFiles) {
            const taskId = file.match(/^(\d+)/)?.[1] || ""
            const status = taskStatuses.get(taskId) || "pending"

            // Skip done or blocked tasks
            if (status === "done" || status === "blocked") continue

            // Check dependencies
            const deps = dependencies.get(taskId) || []
            const unmetDeps = deps.filter((depId) => taskStatuses.get(depId) !== "done")

            if (unmetDeps.length === 0) {
              available.push({ taskId, file, status })
            } else {
              blocked.push({ taskId, file, blockedBy: unmetDeps })
            }
          }

          return JSON.stringify({ available, blocked }, null, 2)
        },
      }),

      // ----------------------------------------------------------------------
      // build_task_context - Build context for task execution
      // ----------------------------------------------------------------------
      build_task_context: tool({
        description: `Build the full context for executing an epic task.

This tool reads the epic's spec, research, plan, and all previous completed tasks,
then returns a complete prompt that should be passed to the Task tool to execute
the task with a fresh sub-agent.

Use this before calling the Task tool for each task execution.`,
        args: {
          epicName: tool.schema.string().describe("Name of the epic (the folder name under .lisa/epics/)"),
          taskId: tool.schema
            .string()
            .describe("Task ID - the number prefix like '01', '02', etc."),
        },
        async execute(args) {
          const { epicName, taskId } = args
          const epicDir = join(directory, ".lisa", "epics", epicName)
          const tasksDir = join(epicDir, "tasks")

          // Verify epic exists
          if (!existsSync(epicDir)) {
            return JSON.stringify({
              success: false,
              error: `Epic "${epicName}" not found at ${epicDir}`,
            }, null, 2)
          }

          // Read context files
          const spec = await readFileIfExists(join(epicDir, "spec.md"))
          const research = await readFileIfExists(join(epicDir, "research.md"))
          const plan = await readFileIfExists(join(epicDir, "plan.md"))

          if (!spec) {
            return JSON.stringify({
              success: false,
              error: `No spec.md found for epic "${epicName}"`,
            }, null, 2)
          }

          // Find the task file
          const taskFiles = await getTaskFiles(directory, epicName)
          const taskFile = taskFiles.find((f) => f.startsWith(taskId))

          if (!taskFile) {
            return JSON.stringify({
              success: false,
              error: `Task "${taskId}" not found in ${tasksDir}`,
            }, null, 2)
          }

          const taskPath = join(tasksDir, taskFile)
          const taskContent = await readFile(taskPath, "utf-8")

          // Check if task is already done
          if (taskContent.includes("## Status: done")) {
            return JSON.stringify({
              success: true,
              alreadyDone: true,
              message: `Task ${taskId} is already complete`,
            }, null, 2)
          }

          // Read all previous task files (for context)
          const previousTasks: string[] = []
          for (const file of taskFiles) {
            const fileTaskId = file.match(/^(\d+)/)?.[1] || ""
            if (fileTaskId >= taskId) break // Stop at current task

            const content = await readFile(join(tasksDir, file), "utf-8")
            previousTasks.push(`### ${file}\n\n${content}`)
          }

          // Build the sub-agent prompt
          const prompt = `# Execute Epic Task

You are executing task ${taskId} of epic "${epicName}".

## Your Mission

Execute the task described below. When complete:
1. Update the task file's status from "pending" or "in-progress" to "done"
2. Add a "## Report" section at the end of the task file with:
   - **What Was Done**: List the changes you made
   - **Decisions Made**: Any choices you made and why
   - **Issues / Notes for Next Task**: Anything the next task should know
   - **Files Changed**: List of files created/modified

If you discover the task approach is wrong or future tasks need changes, you may update them.
The plan is a living document.

---

## Epic Spec

${spec}

---

## Research

${research || "(No research conducted yet)"}

---

## Plan

${plan || "(No plan created yet)"}

---

## Previous Completed Tasks

${previousTasks.length > 0 ? previousTasks.join("\n\n---\n\n") : "(This is the first task)"}

---

## Current Task to Execute

**File: .lisa/epics/${epicName}/tasks/${taskFile}**

${taskContent}

---

## Instructions

1. Read and understand the task
2. Execute the steps described
3. Verify the "Done When" criteria are met
4. Update the task file:
   - Change \`## Status: pending\` or \`## Status: in-progress\` to \`## Status: done\`
   - Add a \`## Report\` section at the end
5. If you need to modify future tasks or the plan, do so
6. When complete, confirm what was done
`

          await client.app.log({
            service: "lisa-plugin",
            level: "info",
            message: `Built context for task ${taskId} of epic "${epicName}" (${previousTasks.length} previous tasks)`,
          })

          return JSON.stringify({
            success: true,
            taskFile,
            taskPath,
            prompt,
            message: `Context built for task ${taskId}. Pass the 'prompt' field to the Task tool to execute with a sub-agent.`,
          }, null, 2)
        },
      }),

      // ----------------------------------------------------------------------
      // lisa_config - View and manage Lisa configuration
      // ----------------------------------------------------------------------
      lisa_config: tool({
        description: `View or reset Lisa configuration.

Actions:
- "view": Show current merged configuration and where values come from
- "reset": Reset project config to defaults (creates .lisa/config.jsonc)
- "init": Initialize config if it doesn't exist (non-destructive)`,
        args: {
          action: tool.schema.enum(["view", "reset", "init"]).describe("Action to perform"),
        },
        async execute(args) {
          const { action } = args
          const lisaDir = join(directory, ".lisa")
          const configPath = join(lisaDir, "config.jsonc")
          const localConfigPath = join(lisaDir, "config.local.jsonc")
          const homeDir = process.env.HOME || process.env.USERPROFILE || ""
          const globalConfigPath = join(homeDir, ".config", "lisa", "config.jsonc")

          const logWarning = (msg: string) => {
            client.app.log({
              service: "lisa-plugin",
              level: "warn",
              message: msg,
            })
          }

          if (action === "view") {
            // Load config and show sources
            const config = await loadConfig(directory, logWarning)
            
            const sources: string[] = []
            if (existsSync(globalConfigPath)) sources.push(`Global: ${globalConfigPath}`)
            if (existsSync(configPath)) sources.push(`Project: ${configPath}`)
            if (existsSync(localConfigPath)) sources.push(`Local: ${localConfigPath}`)
            if (sources.length === 0) sources.push("(Using defaults - no config files found)")

            return JSON.stringify({
              config,
              sources,
              paths: {
                global: globalConfigPath,
                project: configPath,
                local: localConfigPath,
              },
            }, null, 2)
          }

          if (action === "reset") {
            // Ensure directory exists and reset config
            const { mkdir } = await import("fs/promises")
            if (!existsSync(lisaDir)) {
              await mkdir(lisaDir, { recursive: true })
            }

            await writeFile(configPath, DEFAULT_CONFIG_CONTENT, "utf-8")
            
            // Also ensure .gitignore exists
            const gitignorePath = join(lisaDir, ".gitignore")
            if (!existsSync(gitignorePath)) {
              await writeFile(gitignorePath, LISA_GITIGNORE_CONTENT, "utf-8")
            }

            return JSON.stringify({
              success: true,
              message: "Config reset to defaults",
              path: configPath,
              tip: "Edit .lisa/config.jsonc to customize settings. Create .lisa/config.local.jsonc for personal overrides (gitignored).",
            }, null, 2)
          }

          if (action === "init") {
            const result = await ensureLisaDirectory(directory)

            if (result.configCreated) {
              return JSON.stringify({
                success: true,
                message: "Config initialized with defaults",
                path: configPath,
                tip: "Edit .lisa/config.jsonc to customize settings. Create .lisa/config.local.jsonc for personal overrides (gitignored).",
              }, null, 2)
            } else {
              return JSON.stringify({
                success: true,
                message: "Config already exists",
                path: configPath,
                tip: "Use action 'reset' to overwrite with defaults, or 'view' to see current config.",
              }, null, 2)
            }
          }

          return JSON.stringify({ success: false, error: `Unknown action: ${action}` }, null, 2)
        },
      }),

      // ----------------------------------------------------------------------
      // get_lisa_config - Get current config for use by other tools/skills
      // ----------------------------------------------------------------------
      get_lisa_config: tool({
        description: `Get the current Lisa configuration.

Returns the merged configuration from all sources (global, project, local).
Use this to check settings like git.completionMode before performing actions.`,
        args: {},
        async execute() {
          const logWarning = (msg: string) => {
            client.app.log({
              service: "lisa-plugin",
              level: "warn",
              message: msg,
            })
          }

          const config = await loadConfig(directory, logWarning)
          return JSON.stringify({ config }, null, 2)
        },
      }),
    },

    // ========================================================================
    // Event Handler: Yolo Mode Auto-Continue
    // ========================================================================
    event: async ({ event }) => {
      if (event.type !== "session.idle") return

      const sessionId = (event as any).properties?.sessionID

      // Debug: log the event
      await client.app.log({
        service: "lisa-plugin",
        level: "info",
        message: `session.idle event received. sessionId: ${sessionId || "UNDEFINED"}`,
      })

      // Find active yolo epic
      const activeEpic = await findActiveYoloEpic(directory)
      if (!activeEpic) {
        await client.app.log({
          service: "lisa-plugin",
          level: "info",
          message: "No active yolo epic found",
        })
        return
      }

      const { name: epicName, state } = activeEpic
      const yolo = state.yolo!

      // Check remaining tasks
      const remaining = await countRemainingTasks(directory, epicName)

      // Log progress
      await client.app.log({
        service: "lisa-plugin",
        level: "info",
        message: `Epic "${epicName}" yolo check: ${remaining} tasks remaining, iteration ${yolo.iteration}/${yolo.maxIterations || "unlimited"}`,
      })

      // Check if complete
      if (remaining === 0) {
        await updateEpicState(directory, epicName, {
          executeComplete: true,
          yolo: { ...yolo, active: false },
        })

        await notify($, "Lisa Complete", `Epic "${epicName}" finished successfully!`)

        await client.app.log({
          service: "lisa-plugin",
          level: "info",
          message: `Epic "${epicName}" completed! All tasks done.`,
        })

        return
      }

      // Check max iterations
      if (yolo.maxIterations > 0 && yolo.iteration >= yolo.maxIterations) {
        await updateEpicState(directory, epicName, {
          yolo: { ...yolo, active: false },
        })

        await notify(
          $,
          "Lisa Stopped",
          `Epic "${epicName}" hit max iterations (${yolo.maxIterations})`
        )

        await client.app.log({
          service: "lisa-plugin",
          level: "warn",
          message: `Epic "${epicName}" stopped: max iterations (${yolo.maxIterations}) reached with ${remaining} tasks remaining`,
        })

        return
      }

      // Continue the epic
      const nextIteration = yolo.iteration + 1
      await updateEpicState(directory, epicName, {
        yolo: { ...yolo, iteration: nextIteration },
      })

      // Send continuation prompt
      if (sessionId) {
        await client.app.log({
          service: "lisa-plugin",
          level: "info",
          message: `Sending continuation prompt for "${epicName}" to session ${sessionId}`,
        })
        
        // Build a forceful continuation prompt that leaves no ambiguity
        const continuationPrompt = `[LISA YOLO MODE - AUTO-CONTINUE]

Epic: ${epicName}
Tasks remaining: ${remaining}
Iteration: ${nextIteration}${yolo.maxIterations > 0 ? ` of ${yolo.maxIterations}` : ""}

MANDATORY ACTIONS:
1. Load the lisa skill
2. Call get_available_tasks("${epicName}") to see ready tasks
3. For each available task, call build_task_context then Task tool
4. Continue until ALL tasks are done

RULES:
- Do NOT stop to summarize
- Do NOT ask for confirmation  
- Do NOT explain what you're about to do
- Just execute the next task immediately

This is automated execution. Keep working.`

        try {
          await client.session.send({
            id: sessionId,
            text: continuationPrompt,
          })

          await client.app.log({
            service: "lisa-plugin",
            level: "info",
            message: `Epic "${epicName}" continuing: iteration ${nextIteration}, ${remaining} tasks remaining`,
          })
        } catch (err) {
          await client.app.log({
            service: "lisa-plugin",
            level: "error",
            message: `Failed to send continuation: ${err}`,
          })
        }
      } else {
        await client.app.log({
          service: "lisa-plugin",
          level: "warn",
          message: `No sessionId available - cannot continue epic "${epicName}"`,
        })
      }
    },
  }
}

// Default export for OpenCode plugin loading
export default LisaPlugin
