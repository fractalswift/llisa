---
description: Continue an epic in full auto mode (no checkpoints)
argument-hint: <epic-name> [max-iterations]
---

**Arguments:** $ARGUMENTS

Parse arguments:
- First word(s) up to an optional trailing number = epic name (join with hyphens)
- Optional trailing number = max iterations override

Examples:
- `my-feature` → epicName: "my-feature", maxIterations: use config default
- `my feature 50` → epicName: "my-feature", maxIterations: 50
- `my-feature 20` → epicName: "my-feature", maxIterations: 20

Load the lisa:yolo skill with the parsed epic name and max iterations.
