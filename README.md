# llisa

![Lisa and Ralph](lisa-and-ralph.png)

LLM-powered epic workflows for [OpenCode](https://opencode.ai). Like the Ralph Wiggum pattern, but smarter.

**Latest version: 1.0.0** - Fresh agent architecture with verification!

## Why Lisa?

The **Ralph Wiggum pattern** is a simple bash loop that keeps feeding prompts to an AI agent until completion. It works, but:

- Ralph is dumb - he just loops forever with the same prompt
- No planning - dives straight into coding
- No context management - context window fills with garbage
- No task dependencies - can't parallelize or sequence work properly

**Lisa plans before she acts:**

- **Structured phases** - spec, research, plan, then execute
- **Fresh context per phase** - each phase runs in a sub-agent with clean context
- **Verification + retry** - deterministic checks ensure agents complete their work
- **Dependency-aware tasks** - knows what can run in parallel
- **State persistence** - survives session restarts, tracks progress
- **Yolo mode** - fully autonomous execution when you want it

## Install

One command to install Lisa in your project:

```bash
npx llisa --opencode
```

Or with Bun:

```bash
bunx llisa --opencode
```

This creates an `opencode.json` file with Lisa configured. The plugin will be automatically downloaded by OpenCode when you start it.

Requires [OpenCode](https://opencode.ai) 1.0+.

### Global Installation

To use Lisa in all your projects, add to your global OpenCode config:

```bash
# Create or edit ~/.config/opencode/opencode.json
```

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["llisa"]
}
```

## Usage

**Create Epics:**
```
/lisa-create-epic <name>   - Create new epic (interactive spec)
```

**Work With Epics:**
```
/lisa-list-epics           - List all epics with status
/lisa-epic-status <name>   - Show detailed epic status
/lisa-continue <name>      - Resume with interactive checkpoints
/lisa-yolo <name>          - Resume in full auto mode
```

**Help:**
```
/lisa-help                 - Show help menu
```

**Examples:**
```
/lisa-create-epic initial-setup
/lisa-list-epics
/lisa-continue initial-setup
/lisa-yolo auth-system
```

## How It Works

Lisa breaks large features into phases:

1. **Spec** - Define what you're building (interactive)
2. **Research** - Explore the codebase (fresh agent, verified completion)
3. **Plan** - Break into discrete tasks with dependencies (fresh agent, verified)
4. **Execute** - Run tasks via sub-agents with clean context (verified per task)

Each phase uses a fresh agent to prevent context pollution. Verification tools ensure phases actually complete before moving forward.

All state is persisted to `.lisa/epics/` so you can stop and resume anytime.

## Configuration

Config lives in `.lisa/config.jsonc`:

```jsonc
{
  "execution": {
    "maxRetries": 3,           // Retries per task/phase before blocking
    "maxParallelTasks": 1      // Tasks to run in parallel (1 = sequential)
  },
  "git": {
    "completionMode": "none",  // "none" | "commit" | "pr"
    "branchPrefix": "epic/",
    "autoPush": true
  },
  "yolo": {
    "defaultMaxIterations": 100
  }
}
```

In default mode, Lisa does NOT make commits or PRs. If you want to make commits you'll need git set up, and if you want to make PRs you'll need the github cli set up.

## What's New in 1.0

- **Fresh agent architecture** - Research, planning, and execution each use isolated sub-agents
- **Verification tools** - Deterministic checks ensure phases complete properly
- **Automatic retry** - Up to 3 attempts per phase with progressively stronger prompts
- **Token efficiency** - Fresh context per phase prevents context window bloat

## License

MIT
