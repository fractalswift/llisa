# Lisa - Common Reference

## Working Directory

Epics stored in `.lisa/epics/` relative to where you run `opencode`.

**Structure:**
```
project/
├── .lisa/
│   ├── config.jsonc
│   └── epics/
│       └── epic-name/
│           ├── .state
│           ├── spec.md
│           ├── research.md
│           ├── plan.md
│           └── tasks/
│               ├── 01-task.md
│               └── 02-task.md
```

## Architecture

Lisa uses **fresh sub-agents** for each phase to maintain clean context:

1. **Spec** → Interactive conversation (main agent)
2. **Research** → Task tool with `build_research_context` (explore agent)
3. **Planning** → Task tool with `build_planning_context` (general agent)
4. **Execution** → Task tool with `build_task_context` per task (general agents)

This prevents context pollution and keeps each phase focused.

## Context Building Tools

### build_research_context(epicName)

Returns a complete prompt for the research phase. Usage:

```
const result = await build_research_context("my-epic")
// result.prompt contains the full research prompt
```

**What it does:**
- Reads spec.md
- Returns a structured prompt with research instructions
- Research agent saves findings to research.md

**Sub-agent type:** `explore`

### build_planning_context(epicName)

Returns a complete prompt for the planning phase. Usage:

```
const result = await build_planning_context("my-epic")
// result.prompt contains the full planning prompt
```

**What it does:**
- Reads spec.md and research.md
- Returns a structured prompt with planning instructions
- Planning agent creates plan.md and task files

**Sub-agent type:** `general`

### build_task_context(epicName, taskId)

Returns a complete prompt for executing a specific task. Usage:

```
const result = await build_task_context("my-epic", "01")
// result.prompt contains the full task execution prompt
```

**What it does:**
- Reads spec.md, research.md, plan.md
- Includes only dependency tasks (not all previous tasks)
- Returns structured prompt for task execution
- Task agent executes and updates task file

**Sub-agent type:** `general`

## Verification Tools

Lisa uses deterministic verification to ensure agents actually complete their work:

### verify_research_complete(epicName)

Checks if research phase was properly completed:

```
const result = await verify_research_complete("my-epic")
// result.complete: boolean
// result.checks: { hasResearchFile, hasOverview, hasRelevantFiles, hasPatterns, hasRecommendations, stateUpdated }
// result.issues: string[] (if any checks failed)
```

**Validates:**
- research.md exists
- Has all required sections (Overview, Relevant Files, Existing Patterns, Recommendations)
- .state updated with researchComplete: true

### verify_planning_complete(epicName)

Checks if planning phase was properly completed:

```
const result = await verify_planning_complete("my-epic")
// result.complete: boolean
// result.taskCount: number
// result.checks: { hasPlanFile, hasOverview, hasTasks, hasDependencies, hasTaskFiles, stateUpdated }
// result.issues: string[] (if any checks failed)
```

**Validates:**
- plan.md exists with required sections
- Task files created in tasks/
- .state updated with planComplete: true

### verify_task_complete(epicName, taskId)

Checks if a specific task was properly completed:

```
const result = await verify_task_complete("my-epic", "01")
// result.complete: boolean
// result.checks: { hasDoneStatus, hasReport, hasWhatWasDone, hasFilesChanged }
// result.issues: string[] (if any checks failed)
```

**Validates:**
- Task file exists
- Status marked as "done"
- Has ## Report section
- Has ### What Was Done subsection
- Has ### Files Changed subsection

## Retry Logic

Lisa enforces completion through automatic retries:

**Flow:**
1. Call Task tool with phase/task prompt
2. Call verification tool
3. If incomplete, retry with STRONGER prompt (up to 3 attempts)
4. If still incomplete after 3 attempts:
   - **Interactive mode:** Stop and ask user
   - **Yolo mode:** Mark as blocked, continue with other tasks

**Retry Prompts:**
- **Attempt 1:** Standard prompt
- **Attempt 2:** Adds `[RETRY - MUST COMPLETE]` header with list of missing items
- **Attempt 3:** Adds `[FINAL ATTEMPT]` header with urgent language

This ensures agents actually finish their work rather than stopping early.

## File Formats

### spec.md
```markdown
# Epic: <name>

## Goal
[What and why - 1-2 sentences]

## Scope
- [Included item]

### Out of Scope
- [Excluded item]

## Acceptance Criteria
- [ ] [Measurable criterion]

## Technical Constraints
- [Constraints or "None"]
```

### .state (JSON)
```json
{
  "name": "epic-name",
  "currentPhase": "spec|research|plan|execute",
  "specComplete": false,
  "researchComplete": false,
  "planComplete": false,
  "executeComplete": false,
  "lastUpdated": "ISO timestamp"
}
```

### research.md
```markdown
# Research: <name>

## Overview
[Summary]

## Relevant Files
- `path/file.ts` - [why relevant]

## Existing Patterns
[How similar things are done]

## Dependencies
[Packages/modules needed]

## Recommendations
[Suggested approach]
```

### plan.md
```markdown
# Plan: <name>

## Overview
[Approach summary]

## Tasks
1. [Name] - tasks/01-slug.md
2. [Name] - tasks/02-slug.md

## Dependencies
- 01: []
- 02: [01]
- 03: [01,02]

## Risks
- [Risk and mitigation or "None"]
```

### Task File (tasks/XX-slug.md)
```markdown
# Task X: [Name]

## Status: pending|in-progress|done|blocked

## Goal
[What this accomplishes]

## Files
- path/to/file.ts

## Steps
1. [Concrete step]

## Done When
- [ ] [Criterion]

## Report
(Added after completion)

### What Was Done
- [Changes made]

### Decisions Made
- [Choices and rationale]

### Issues / Notes for Next Task
- [Info for subsequent tasks]

### Files Changed
- [List of files]
```

## Config Schema

`.lisa/config.jsonc`:
```jsonc
{
  "execution": {
    "maxRetries": 3,
    "maxParallelTasks": 1
  },
  "git": {
    "completionMode": "none|commit|pr",
    "branchPrefix": "epic/",
    "autoPush": true
  },
  "yolo": {
    "defaultMaxIterations": 100
  }
}
```

**Merge order:** `~/.config/lisa/config.jsonc` → `.lisa/config.jsonc` → `.lisa/config.local.jsonc`
