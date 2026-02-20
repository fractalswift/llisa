---
description: Show Lisa help and commands
---

Output EXACTLY this help menu (no skill loading, no tool calls):

---

**Lisa - Intelligent Epic Workflow**

**Create Epics:**

`/lisa:create-epic <name>` - Create new epic (interactive spec)

**Work With Epics:**

`/lisa:list-epics` - List all epics and status
`/lisa:epic-status <name>` - Show detailed epic status
`/lisa:continue <name>` - Resume with interactive checkpoints
`/lisa:yolo <name> [max-iterations]` - Resume in full auto mode

**Help:**

`/lisa:help` - Show this help

**Configuration:** Edit `.lisa/config.jsonc` manually

**Examples:**
- `/lisa:create-epic auth-system` - Start new epic
- `/lisa:list-epics` - See what epics exist
- `/lisa:continue auth-system` - Continue interactively
- `/lisa:yolo auth-system` - Auto-execute remaining work
- `/lisa:yolo auth-system 50` - Auto-execute with 50 iteration limit

**Writing good specs:**

A good spec is the single most important factor in epic quality. Tips:

- **Acceptance criteria should be verifiable** - "users can log in with email/password" not "auth works well"
- **Explicitly list out-of-scope items** - stops the agent gold-plating or going too wide
- **Mention your test setup** - if you have tests, say so in Technical Constraints; the agent will run them
- **Keep epics focused** - aim for work completable in 1-4 hours of agent time; split larger features into multiple epics
- **Concrete constraints beat vague ones** - "use existing Express middleware pattern in src/middleware/" beats "follow existing patterns"

**Get started:** `/lisa:create-epic <your-epic-name>`

---

DO NOT call any tools. DO NOT load any skill. Just output the above and stop.
