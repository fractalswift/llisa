# Installation Changes

## What Changed

The package has been restructured to work correctly with OpenCode's plugin discovery system.

### Previous Structure (Broken)
```
opencode-lisa/
├── .opencode/
│   ├── command/      ← Singular, wrong name
│   │   └── lisa.md
│   └── skill/        ← Singular, wrong name
│       └── lisa/
│           └── SKILL.md
└── package.json (files: [".opencode/command", ".opencode/skill"])
```

**Problem:** OpenCode only scans `.opencode/commands/` (plural) and `.opencode/skills/` (plural) in:
- Project directory: `.opencode/`
- Global directory: `~/.config/opencode/`

It does NOT scan npm package directories in `node_modules/`.

### New Structure (Working)
```
opencode-lisa/
├── bin/
│   └── cli.js        ← NEW: Installer script
├── assets/
│   ├── commands/     ← Plural, correct name
│   │   └── lisa.md
│   └── skills/       ← Plural, correct name
│       └── lisa/
│           └── SKILL.md
├── src/
│   └── index.ts      ← Plugin code (tools, etc.)
└── package.json
    └── bin: { "opencode-lisa": "./bin/cli.js" }
    └── files: ["dist", "bin", "assets"]
```

## How It Works Now

1. **User installs package:**
   ```bash
   npm install -D opencode-lisa
   ```

2. **User runs installer:**
   ```bash
   npx opencode-lisa init
   ```

3. **Installer copies files to project:**
   - `assets/commands/lisa.md` → `.opencode/commands/lisa.md`
   - `assets/skills/lisa/SKILL.md` → `.opencode/skills/lisa/SKILL.md`
   - Adds `"opencode-lisa"` to `opencode.json` plugin array

4. **OpenCode discovers files:**
   - Finds `.opencode/commands/lisa.md` → `/lisa` command available
   - Finds `.opencode/skills/lisa/SKILL.md` → `lisa` skill loadable
   - Loads `opencode-lisa` plugin → Tools registered

## Same Pattern as opencode-context-manager

This follows the exact same pattern as the working `opencode-context-manager` package:
- CLI installer copies files to user's project
- OpenCode discovers them in the standard locations
- Works globally or per-project

## For Development

The `.opencode/` directory in the repo root is for development only:
- Contains the source command/skill files
- Gets copied to `assets/` during development
- Not included in published package

