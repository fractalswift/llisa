---
description: Show Lisa help menu
agent: general
---

Output EXACTLY this help menu (no skill loading, no tool calls):

---

**Lisa - Intelligent Epic Workflow**

**Create Epics:**

`/lisa-create-epic <name>` - Create new epic (interactive spec)

**Work With Epics:**

`/lisa-list-epics` - List all epics and status  
`/lisa-epic-status <name>` - Show detailed epic status  
`/lisa-continue <name>` - Resume with interactive checkpoints  
`/lisa-yolo <name>` - Resume in full auto mode  

**Help:**

`/lisa-help` - Show this help

**Configuration:** Edit `.lisa/config.jsonc` manually  
**Documentation:** https://github.com/fractalswift/lisa-simpson

**Examples:**
- `/lisa-create-epic auth-system` - Start new epic
- `/lisa-list-epics` - See what epics exist
- `/lisa-continue auth-system` - Continue interactively
- `/lisa-yolo auth-system` - Auto-execute remaining work

**Get started:** `/lisa-create-epic <your-epic-name>`

---

DO NOT call any tools. DO NOT load the skill. Just output the above and stop.
