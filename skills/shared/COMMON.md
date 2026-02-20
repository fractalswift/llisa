# Lisa - Common Reference (Claude Code)

## Working Directory

Epics stored in `.lisa/epics/` relative to the project root.

**Structure:**
```
project/
├── .lisa/
│   ├── config.jsonc
│   ├── yolo.state          ← yolo hook state (key=value)
│   └── epics/
│       └── epic-name/
│           ├── .state      ← JSON state
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
2. **Research** → Task sub-agent (explore type) — reads spec, writes research.md
3. **Planning** → Task sub-agent (general type) — reads spec + research, writes plan.md + task files
4. **Execution** → One Task sub-agent per task — reads spec + research + plan + dependency tasks

This prevents context pollution and keeps each phase focused.

## How Sub-Agents Work (Claude Code)

Unlike the OpenCode version, Claude Code skills do NOT have custom tools.
Sub-agents read files directly using the Read, Glob, Grep, and Bash tools.

### Research sub-agent
Reads `.lisa/epics/<epic>/spec.md`, explores the codebase, writes `research.md`.

### Planning sub-agent
Reads `spec.md` and `research.md`, creates `plan.md` and all task files in `tasks/`.

### Task sub-agent
Reads `spec.md`, `research.md`, `plan.md`, and the report sections of dependency task files.
Executes the task, updates the task file to `## Status: done`, adds `## Report`.

## Verification (Manual Checks)

Since there are no custom verification tools, agents verify completion by checking files directly:

### Research complete when:
- `.lisa/epics/<epic>/research.md` exists
- Contains `## Overview`, `## Relevant Files`, `## Existing Patterns`, `## Recommendations`
- `.state` has `"researchComplete": true`

### Planning complete when:
- `.lisa/epics/<epic>/plan.md` exists
- Contains `## Overview`, `## Tasks`, `## Dependencies`
- At least one task file exists in `tasks/`
- `.state` has `"planComplete": true`

### Task complete when:
- Task file contains `## Status: done`
- Task file contains `## Report`
- Task file contains `### What Was Done`
- Task file contains `### Files Changed`

## Retry Logic

If a sub-agent does not complete its work:

1. **Attempt 1:** Standard prompt
2. **Attempt 2:** Re-launch with `[RETRY - MUST COMPLETE]` header listing what is missing
3. **Attempt 3:** Re-launch with `[FINAL ATTEMPT]` header with urgent language
4. **If still incomplete:**
   - Interactive mode: stop and report to user
   - Yolo mode: mark as blocked, continue with other tasks

Check completion by reading the relevant files after each attempt.

## Dependency Resolution

To find available tasks:
1. Read `plan.md` `## Dependencies` section — format is `- 01: [dep1, dep2]`
2. For each pending/in-progress task, check if all listed deps have `## Status: done`
3. Tasks with all deps done (or no deps) are available to execute

## Yolo State File

The stop hook reads `.lisa/yolo.state` (key=value format):
```
active=true
epic=my-epic-name
iteration=3
max_iterations=100
```

The yolo skill writes this file when activating yolo mode and deletes it on completion.
The stop hook updates `iteration` on each cycle.

## Config

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

Read this file with the Read tool and strip `//` comments before parsing.
If the file does not exist, use the defaults above.

## File Formats

### .state (JSON)
```json
{
  "name": "epic-name",
  "currentPhase": "spec|research|plan|execute",
  "specComplete": false,
  "researchComplete": false,
  "planComplete": false,
  "executeComplete": false,
  "lastUpdated": "ISO timestamp",
  "yolo": {
    "active": false,
    "iteration": 0,
    "maxIterations": 100,
    "startedAt": "ISO timestamp"
  }
}
```

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
