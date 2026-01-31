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
