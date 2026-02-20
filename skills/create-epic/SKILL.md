---
name: create-epic
description: Create a new Lisa epic with an interactive spec conversation
---

# Create Epic

**Epic name:** Provided via arguments (already hyphenated)

## Step 1: Check if epic exists

Check if `.lisa/epics/<name>/.state` exists.

**If exists:**
```
Epic '<name>' already exists.

Use /lisa:epic-status <name> to see status, or /lisa:continue <name> to resume.
```
STOP.

## Step 2: Create epic structure

Create directory `.lisa/epics/<name>/` and write `.lisa/epics/<name>/.state`:

```json
{
  "name": "<name>",
  "currentPhase": "spec",
  "specComplete": false,
  "researchComplete": false,
  "planComplete": false,
  "executeComplete": false,
  "lastUpdated": "<ISO timestamp>"
}
```

Also ensure `.lisa/` exists and create `.lisa/config.jsonc` if it doesn't exist:

```jsonc
{
  // Lisa Configuration
  "execution": {
    "maxRetries": 3,
    "maxParallelTasks": 1
  },
  "git": {
    "completionMode": "none",
    "branchPrefix": "epic/",
    "autoPush": true
  },
  "yolo": {
    "defaultMaxIterations": 100
  }
}
```

## Step 3: Interactive spec conversation

Have a natural conversation to cover:

1. **Goal** - What are we building? Why?
2. **Scope** - What's included? What's explicitly out of scope?
3. **Acceptance Criteria** - How do we know it's done? Make these verifiable.
4. **Technical Constraints** - Specific tech, patterns, limitations? Do tests exist?

Be conversational. Ask clarifying questions. Push back if scope is too large or vague.
Keep concise — aim for 20-50 lines total in the final spec.

## Step 4: Save spec

Show the spec and ask:

```
Here's the spec:

[formatted spec content]

Ready to save to .lisa/epics/<name>/spec.md?
```

On confirmation, save:

```markdown
# Epic: <name>

## Goal
[What we're building and why - 1-2 sentences]

## Scope
- [Included item]
- [Included item]

### Out of Scope
- [Excluded item]

## Acceptance Criteria
- [ ] [Measurable criterion]
- [ ] [Measurable criterion]

## Technical Constraints
- [Constraints or "None"]
```

Update `.state`:
```json
{
  "specComplete": true,
  "currentPhase": "spec",
  "lastUpdated": "<ISO timestamp>"
}
```

## Step 5: Show next steps and STOP

```
Spec saved to .lisa/epics/<name>/spec.md

Next steps:
  • /lisa:continue <name> - Continue to research phase (interactive, with checkpoints)
  • /lisa:yolo <name> - Auto-execute all remaining phases
  • /lisa:list-epics - See all your epics
```

DO NOT continue automatically. STOP here and wait for the user.
