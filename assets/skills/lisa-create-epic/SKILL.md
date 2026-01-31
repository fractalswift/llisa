---
name: lisa-create-epic
description: Create a new epic with interactive spec
---

# Create Epic

**Epic name:** Provided via arguments (already hyphenated)

## Steps

### 1. Check if epic exists

Read `.lisa/epics/<name>/.state`

**If exists:**
```
Epic '<name>' already exists.

Use /lisa-epic-status <name> to see status, or /lisa-continue <name> to resume.
```
STOP.

### 2. Create epic structure

Create directory `.lisa/epics/<name>/` and initialize `.state`:

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

### 3. Interactive spec conversation

Cover these topics:
1. **Goal** - What are we building? Why?
2. **Scope** - What's included? What's out of scope?
3. **Acceptance Criteria** - How do we know it's done?
4. **Technical Constraints** - Any specific tech, patterns, or limitations?

Be conversational. Ask clarifying questions. Push back if scope is too large or vague.

**Keep concise** - aim for 20-50 lines total.

### 4. Save spec

Show the spec and ask:

```
Here's the spec:

[formatted spec content]

Ready to save to .lisa/epics/<name>/spec.md?
```

On confirmation, save using this format:

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
  "currentPhase": "spec"
}
```

### 5. Show next steps and STOP

```
Spec saved to .lisa/epics/<name>/spec.md!

Next steps:
  • /lisa-continue <name> - Continue to research phase (interactive)
  • /lisa-yolo <name> - Auto-execute all remaining phases
  • /lisa-list-epics - See all your epics
```

DO NOT continue automatically. STOP here.
