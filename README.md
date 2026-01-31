# opencode-lisa

![Lisa and Ralph](lisa-and-ralph.png)

An intelligent epic workflow plugin for [OpenCode](https://opencode.ai). Like the Ralph Wiggum pattern, but smarter.

**Latest version: 0.5.0** - Redesigned commands for clarity!

## Why Lisa?

The **Ralph Wiggum pattern** is a simple bash loop that keeps feeding prompts to an AI agent until completion. It works, but:

- Ralph is dumb - he just loops forever with the same prompt
- No planning - dives straight into coding
- No context management - context window fills with garbage
- No task dependencies - can't parallelize or sequence work properly

**Lisa plans before she acts:**

- **Structured phases** - spec, research, plan, then execute
- **Dependency-aware tasks** - knows what can run in parallel
- **Fresh context per task** - each task runs in a sub-agent with clean context
- **State persistence** - survives session restarts, tracks progress
- **Yolo mode** - fully autonomous execution when you want it

## Install

One command to install Lisa in your project:

```bash
npx opencode-lisa --opencode
```

Or with Bun:

```bash
bunx opencode-lisa --opencode
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
  "plugin": ["opencode-lisa"]
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
/lisa-create-epic initial setup
/lisa-list-epics
/lisa-continue initial-setup
/lisa-yolo auth-system
```

## How It Works

Lisa breaks large features into phases:

1. **Spec** - Define what you're building (interactive)
2. **Research** - Explore the codebase to understand context
3. **Plan** - Break into discrete tasks with dependencies
4. **Execute** - Run tasks via sub-agents with fresh context

All state is persisted to `.lisa/epics/` so you can stop and resume anytime.

## Configuration

Config lives in `.lisa/config.jsonc`:

```jsonc
{
  "git": {
    "completionMode": "none", // "none" | "commit" | "pr"
  },
  "yolo": {
    "defaultMaxIterations": 100,
  },
}
```

In default mode, Lisa does NOT make commits or PRs. If you want to make commits you'll need git set up, and if you want to make PRs you'll need the github cli set up.

## License

MIT
