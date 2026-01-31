---
description: Create a new epic with interactive spec
agent: general
---

**Arguments:** $ARGUMENTS

Parse the epic name from arguments using smart parsing (join all words with hyphens).

Examples:
- "initial setup" → "initial-setup"
- "auth-system" → "auth-system"
- "my complex feature" → "my-complex-feature"

Load the lisa skill and execute with:
- Mode: "create-epic"
- Epic name: (parsed name with hyphens)
