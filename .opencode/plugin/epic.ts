import type { Plugin } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"
import { readdir, readFile, writeFile } from "fs/promises"
import { existsSync } from "fs"
import { join } from "path"

/**
 * Epic Workflow Plugin for OpenCode
 *
 * Provides:
 * 1. `build_task_context` tool - Builds context for a task (to be used with Task tool)
 * 2. Yolo mode auto-continue - Keeps the session running until all tasks are done
 *
 * Works with the epic skill (.opencode/skill/epic/SKILL.md) which manages the epic state.
 */

// ============================================================================
// Types
// ============================================================================

interface YoloState {
  active: boolean
  iteration: number
  maxIterations: number
  startedAt: string
}

interface EpicState {
  name: string
  currentPhase: string
  specComplete: boolean
  researchComplete: boolean
  planComplete: boolean
  executeComplete: boolean
  lastUpdated: string
  yolo?: YoloState
}

// ----------------------------------------------------------------------------
// Epic Configuration Types
// ----------------------------------------------------------------------------

type GitCompletionMode = "pr" | "commit" | "none"

interface EpicConfigExecution {
  maxRetries: number
}

interface EpicConfigGit {
  completionMode: GitCompletionMode
  branchPrefix: string
  autoPush: boolean
}

interface EpicConfigYolo {
  defaultMaxIterations: number
}

interface EpicConfig {
  execution: EpicConfigExecution
  git: EpicConfigGit
  yolo: EpicConfigYolo
}

// Default configuration (most cautious)
const DEFAULT_CONFIG: EpicConfig = {
  execution: {
    maxRetries: 3,
  },
  git: {
    completionMode: "none",
    branchPrefix: "epic/",
    autoPush: true,
  },
  yolo: {
    defaultMaxIterations: 100,
  },
}

// Default config file content with comments
const DEFAULT_CONFIG_CONTENT = `{
  // Epic Workflow Configuration
  // 
  // Merge order: ~/.config/epic-workflow/config.jsonc -> .epics/config.jsonc -> .epics/config.local.jsonc
  // Override locally (gitignored) with: .epics/config.local.jsonc

  "execution": {
    // Number of retries for failed tasks before stopping
    "maxRetries": 3
  },

  "git": {
    // How the epic completes when all tasks are done:
    //   "pr"     - Create branch, commit, push, and open PR (requires \`gh\` CLI)
    //   "commit" - Create commits only, you handle push/PR manually  
    //   "none"   - No git operations, you manage everything
    "completionMode": "none",

    // Branch naming prefix (e.g., "epic/my-feature")
    "branchPrefix": "epic/",

    // When completionMode is "pr": automatically push and create PR
    // Set false to review commits before pushing
    "autoPush": true
  },

  "yolo": {
    // Maximum iterations in yolo mode before pausing (0 = unlimited)
    "defaultMaxIterations": 100
  }
}
`

// .gitignore content for .epics directory
const EPICS_GITIGNORE_CONTENT = `# Local config overrides (not committed)
config.local.jsonc
`

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Read a file if it exists, return empty string otherwise
 */
async function readFileIfExists(path: string): Promise<string> {
  if (!existsSync(path)) return ""
  try {
    return await readFile(path, "utf-8")
  } catch {
    return ""
  }
}

/**
 * Strip JSON comments (single-line // and multi-line block comments) from a string
 * Simple state-machine approach - handles most common cases
 */
function stripJsonComments(jsonc: string): string {
  // Remove single-line comments (// ...)
  // Be careful not to match // inside strings
  let result = ""
  let inString = false
  let inSingleLineComment = false
  let inMultiLineComment = false
  let i = 0

  while (i < jsonc.length) {
    const char = jsonc[i]
    const nextChar = jsonc[i + 1]

    // Handle string boundaries
    if (!inSingleLineComment && !inMultiLineComment && char === '"' && jsonc[i - 1] !== "\\") {
      inString = !inString
      result += char
      i++
      continue
    }

    // Skip content inside strings
    if (inString) {
      result += char
      i++
      continue
    }

    // Check for comment start
    if (!inSingleLineComment && !inMultiLineComment && char === "/" && nextChar === "/") {
      inSingleLineComment = true
      i += 2
      continue
    }

    if (!inSingleLineComment && !inMultiLineComment && char === "/" && nextChar === "*") {
      inMultiLineComment = true
      i += 2
      continue
    }

    // Check for comment end
    if (inSingleLineComment && (char === "\n" || char === "\r")) {
      inSingleLineComment = false
      result += char
      i++
      continue
    }

    if (inMultiLineComment && char === "*" && nextChar === "/") {
      inMultiLineComment = false
      i += 2
      continue
    }

    // Skip comment content
    if (inSingleLineComment || inMultiLineComment) {
      i++
      continue
    }

    result += char
    i++
  }

  return result
}

/**
 * Deep merge two objects, with source overwriting target for matching keys
 */
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target }

  for (const key of Object.keys(source) as Array<keyof T>) {
    const sourceValue = source[key]
    const targetValue = target[key]

    if (
      sourceValue !== undefined &&
      typeof sourceValue === "object" &&
      sourceValue !== null &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === "object" &&
      targetValue !== null &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(targetValue, sourceValue as any)
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue as T[keyof T]
    }
  }

  return result
}

/**
 * Validate and sanitize config, logging warnings for invalid values
 */
function validateConfig(config: Partial<EpicConfig>, logWarning: (msg: string) => void): EpicConfig {
  const result = deepMerge(DEFAULT_CONFIG, config)

  // Validate execution.maxRetries
  if (typeof result.execution.maxRetries !== "number" || result.execution.maxRetries < 0) {
    logWarning(`Invalid execution.maxRetries: ${result.execution.maxRetries}. Using default: ${DEFAULT_CONFIG.execution.maxRetries}`)
    result.execution.maxRetries = DEFAULT_CONFIG.execution.maxRetries
  }

  // Validate git.completionMode
  const validModes: GitCompletionMode[] = ["pr", "commit", "none"]
  if (!validModes.includes(result.git.completionMode)) {
    logWarning(`Invalid git.completionMode: "${result.git.completionMode}". Using default: "${DEFAULT_CONFIG.git.completionMode}"`)
    result.git.completionMode = DEFAULT_CONFIG.git.completionMode
  }

  // Validate git.branchPrefix
  if (typeof result.git.branchPrefix !== "string" || result.git.branchPrefix.length === 0) {
    logWarning(`Invalid git.branchPrefix: "${result.git.branchPrefix}". Using default: "${DEFAULT_CONFIG.git.branchPrefix}"`)
    result.git.branchPrefix = DEFAULT_CONFIG.git.branchPrefix
  }

  // Validate git.autoPush
  if (typeof result.git.autoPush !== "boolean") {
    logWarning(`Invalid git.autoPush: ${result.git.autoPush}. Using default: ${DEFAULT_CONFIG.git.autoPush}`)
    result.git.autoPush = DEFAULT_CONFIG.git.autoPush
  }

  // Validate yolo.defaultMaxIterations
  if (typeof result.yolo.defaultMaxIterations !== "number" || result.yolo.defaultMaxIterations < 0) {
    logWarning(`Invalid yolo.defaultMaxIterations: ${result.yolo.defaultMaxIterations}. Using default: ${DEFAULT_CONFIG.yolo.defaultMaxIterations}`)
    result.yolo.defaultMaxIterations = DEFAULT_CONFIG.yolo.defaultMaxIterations
  }

  return result
}

/**
 * Load config from a JSONC file
 */
async function loadConfigFile(path: string): Promise<Partial<EpicConfig> | null> {
  if (!existsSync(path)) return null

  try {
    const content = await readFile(path, "utf-8")
    const stripped = stripJsonComments(content)
    return JSON.parse(stripped) as Partial<EpicConfig>
  } catch {
    return null
  }
}

/**
 * Load and merge config from all sources
 * Order: global -> project -> project-local
 */
async function loadConfig(directory: string, logWarning: (msg: string) => void): Promise<EpicConfig> {
  const homeDir = process.env.HOME || process.env.USERPROFILE || ""
  
  // Config file paths
  const globalConfigPath = join(homeDir, ".config", "epic-workflow", "config.jsonc")
  const projectConfigPath = join(directory, ".epics", "config.jsonc")
  const localConfigPath = join(directory, ".epics", "config.local.jsonc")

  // Load configs in order
  const globalConfig = await loadConfigFile(globalConfigPath)
  const projectConfig = await loadConfigFile(projectConfigPath)
  const localConfig = await loadConfigFile(localConfigPath)

  // Merge configs
  let merged: Partial<EpicConfig> = {}
  
  if (globalConfig) {
    merged = deepMerge(merged as EpicConfig, globalConfig)
  }
  if (projectConfig) {
    merged = deepMerge(merged as EpicConfig, projectConfig)
  }
  if (localConfig) {
    merged = deepMerge(merged as EpicConfig, localConfig)
  }

  // Validate and return
  return validateConfig(merged, logWarning)
}

/**
 * Ensure .epics directory exists with config files
 */
async function ensureEpicsDirectory(directory: string): Promise<{ created: boolean; configCreated: boolean }> {
  const epicsDir = join(directory, ".epics")
  const configPath = join(epicsDir, "config.jsonc")
  const gitignorePath = join(epicsDir, ".gitignore")

  let created = false
  let configCreated = false

  // Create .epics directory if needed
  if (!existsSync(epicsDir)) {
    const { mkdir } = await import("fs/promises")
    await mkdir(epicsDir, { recursive: true })
    created = true
  }

  // Create config.jsonc if it doesn't exist
  if (!existsSync(configPath)) {
    await writeFile(configPath, DEFAULT_CONFIG_CONTENT, "utf-8")
    configCreated = true
  }

  // Create .gitignore if it doesn't exist
  if (!existsSync(gitignorePath)) {
    await writeFile(gitignorePath, EPICS_GITIGNORE_CONTENT, "utf-8")
  }

  return { created, configCreated }
}

/**
 * Get all task files for an epic, sorted by task number
 */
async function getTaskFiles(directory: string, epicName: string): Promise<string[]> {
  const tasksDir = join(directory, ".epics", epicName, "tasks")

  if (!existsSync(tasksDir)) return []

  try {
    const files = await readdir(tasksDir)
    return files
      .filter((f) => f.endsWith(".md"))
      .sort((a, b) => {
        const numA = parseInt(a.match(/^(\d+)/)?.[1] || "0", 10)
        const numB = parseInt(b.match(/^(\d+)/)?.[1] || "0", 10)
        return numA - numB
      })
  } catch {
    return []
  }
}

/**
 * Find the active epic with yolo mode enabled
 */
async function findActiveYoloEpic(
  directory: string
): Promise<{ name: string; state: EpicState } | null> {
  const epicsDir = join(directory, ".epics")

  if (!existsSync(epicsDir)) return null

  try {
    const entries = await readdir(epicsDir, { withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const statePath = join(epicsDir, entry.name, ".state")
      if (!existsSync(statePath)) continue

      try {
        const content = await readFile(statePath, "utf-8")
        const state = JSON.parse(content) as EpicState

        if (state.yolo?.active) {
          return { name: entry.name, state }
        }
      } catch {
        continue
      }
    }
  } catch {
    return null
  }

  return null
}

/**
 * Count remaining tasks for an epic (pending or in-progress)
 */
async function countRemainingTasks(directory: string, epicName: string): Promise<number> {
  const tasksDir = join(directory, ".epics", epicName, "tasks")

  if (!existsSync(tasksDir)) return 0

  try {
    const files = await readdir(tasksDir)
    const mdFiles = files.filter((f) => f.endsWith(".md"))

    let remaining = 0
    for (const file of mdFiles) {
      const content = await readFile(join(tasksDir, file), "utf-8")
      if (!content.includes("## Status: done") && !content.includes("## Status: blocked")) {
        remaining++
      }
    }
    return remaining
  } catch {
    return 0
  }
}

/**
 * Update the epic's .state file
 */
async function updateEpicState(
  directory: string,
  epicName: string,
  updates: Partial<EpicState>
): Promise<void> {
  const statePath = join(directory, ".epics", epicName, ".state")

  try {
    const content = await readFile(statePath, "utf-8")
    const state = JSON.parse(content) as EpicState

    const newState = { ...state, ...updates, lastUpdated: new Date().toISOString() }

    // Handle nested yolo updates
    if (updates.yolo && state.yolo) {
      newState.yolo = { ...state.yolo, ...updates.yolo }
    }

    await writeFile(statePath, JSON.stringify(newState, null, 2), "utf-8")
  } catch {
    // Ignore errors
  }
}

/**
 * Send a desktop notification (cross-platform)
 * Fails silently if notifications aren't available
 */
async function notify($: any, title: string, message: string): Promise<void> {
  try {
    // macOS
    await $`osascript -e 'display notification "${message}" with title "${title}"'`.quiet()
  } catch {
    try {
      // Linux
      await $`notify-send "${title}" "${message}"`.quiet()
    } catch {
      // Silently fail - don't pollute the UI with console.log
    }
  }
}

/**
 * Get task statistics for an epic
 */
async function getTaskStats(
  directory: string,
  epicName: string
): Promise<{ total: number; done: number; inProgress: number; pending: number; blocked: number }> {
  const tasksDir = join(directory, ".epics", epicName, "tasks")

  if (!existsSync(tasksDir)) {
    return { total: 0, done: 0, inProgress: 0, pending: 0, blocked: 0 }
  }

  try {
    const files = await readdir(tasksDir)
    const mdFiles = files.filter((f) => f.endsWith(".md"))

    let done = 0
    let inProgress = 0
    let pending = 0
    let blocked = 0

    for (const file of mdFiles) {
      const content = await readFile(join(tasksDir, file), "utf-8")
      if (content.includes("## Status: done")) {
        done++
      } else if (content.includes("## Status: in-progress")) {
        inProgress++
      } else if (content.includes("## Status: blocked")) {
        blocked++
      } else {
        pending++
      }
    }

    return { total: mdFiles.length, done, inProgress, pending, blocked }
  } catch {
    return { total: 0, done: 0, inProgress: 0, pending: 0, blocked: 0 }
  }
}

/**
 * Parse dependencies from plan.md
 */
async function parseDependencies(
  directory: string,
  epicName: string
): Promise<Map<string, string[]>> {
  const planPath = join(directory, ".epics", epicName, "plan.md")
  const deps = new Map<string, string[]>()

  if (!existsSync(planPath)) return deps

  try {
    const content = await readFile(planPath, "utf-8")
    const depsMatch = content.match(/## Dependencies\n([\s\S]*?)(?=\n##|$)/)
    if (!depsMatch) return deps

    const lines = depsMatch[1].trim().split("\n")
    for (const line of lines) {
      const match = line.match(/^-\s*(\d+):\s*\[(.*)\]/)
      if (match) {
        const taskId = match[1]
        const depList = match[2]
          .split(",")
          .map((d) => d.trim())
          .filter((d) => d.length > 0)
        deps.set(taskId, depList)
      }
    }
  } catch {
    // Ignore errors
  }

  return deps
}

// ============================================================================
// Plugin
// ============================================================================

export const EpicWorkflowPlugin: Plugin = async ({ directory, client, $ }) => {
  return {
    // ========================================================================
    // Custom Tools
    // ========================================================================
    tool: {
      // ----------------------------------------------------------------------
      // list_epics - Fast listing of all epics
      // ----------------------------------------------------------------------
      list_epics: tool({
        description: `List all epics and their current status.

Returns a list of all epics in .epics/ with their phase and task progress.
Much faster than manually reading files.`,
        args: {},
        async execute() {
          const epicsDir = join(directory, ".epics")

          if (!existsSync(epicsDir)) {
            return JSON.stringify({
              epics: [],
              message: "No epics found. Start one with `/epic <name>`",
            }, null, 2)
          }

          try {
            const entries = await readdir(epicsDir, { withFileTypes: true })
            const epics: Array<{
              name: string
              phase: string
              tasks: { done: number; total: number } | null
              yoloActive: boolean
            }> = []

            for (const entry of entries) {
              if (!entry.isDirectory()) continue

              const statePath = join(epicsDir, entry.name, ".state")
              let phase = "unknown"
              let yoloActive = false

              if (existsSync(statePath)) {
                try {
                  const content = await readFile(statePath, "utf-8")
                  const state = JSON.parse(content) as EpicState
                  phase = state.currentPhase || "unknown"
                  yoloActive = state.yolo?.active || false
                } catch {
                  phase = "unknown"
                }
              } else {
                // No state file - check what exists
                const hasSpec = existsSync(join(epicsDir, entry.name, "spec.md"))
                const hasResearch = existsSync(join(epicsDir, entry.name, "research.md"))
                const hasPlan = existsSync(join(epicsDir, entry.name, "plan.md"))
                const hasTasks = existsSync(join(epicsDir, entry.name, "tasks"))

                if (hasTasks) phase = "execute"
                else if (hasPlan) phase = "plan"
                else if (hasResearch) phase = "research"
                else if (hasSpec) phase = "spec"
                else phase = "new"
              }

              // Get task stats if in execute phase
              let tasks: { done: number; total: number } | null = null
              if (phase === "execute") {
                const stats = await getTaskStats(directory, entry.name)
                tasks = { done: stats.done, total: stats.total }
              }

              epics.push({ name: entry.name, phase, tasks, yoloActive })
            }

            return JSON.stringify({ epics }, null, 2)
          } catch (error) {
            return JSON.stringify({ epics: [], error: String(error) }, null, 2)
          }
        },
      }),

      // ----------------------------------------------------------------------
      // get_epic_status - Detailed status for one epic
      // ----------------------------------------------------------------------
      get_epic_status: tool({
        description: `Get detailed status for a specific epic.

Returns phase, artifacts, task breakdown, and available actions.
Much faster than manually reading multiple files.`,
        args: {
          epicName: tool.schema.string().describe("Name of the epic"),
        },
        async execute(args) {
          const { epicName } = args
          const epicDir = join(directory, ".epics", epicName)

          if (!existsSync(epicDir)) {
            return JSON.stringify({
              found: false,
              error: `Epic "${epicName}" not found. Start it with \`/epic ${epicName}\``,
            }, null, 2)
          }

          // Check which artifacts exist
          const artifacts = {
            spec: existsSync(join(epicDir, "spec.md")),
            research: existsSync(join(epicDir, "research.md")),
            plan: existsSync(join(epicDir, "plan.md")),
            tasks: existsSync(join(epicDir, "tasks")),
            state: existsSync(join(epicDir, ".state")),
          }

          // Read state
          let state: EpicState | null = null
          if (artifacts.state) {
            try {
              const content = await readFile(join(epicDir, ".state"), "utf-8")
              state = JSON.parse(content)
            } catch {
              state = null
            }
          }

          // Get task stats
          const taskStats = await getTaskStats(directory, epicName)

          // Determine current phase
          let currentPhase = state?.currentPhase || "unknown"
          if (currentPhase === "unknown") {
            if (artifacts.tasks) currentPhase = "execute"
            else if (artifacts.plan) currentPhase = "plan"
            else if (artifacts.research) currentPhase = "research"
            else if (artifacts.spec) currentPhase = "spec"
            else currentPhase = "new"
          }

          // Determine next action
          let nextAction = ""
          if (!artifacts.spec) {
            nextAction = `Create spec with \`/epic ${epicName} spec\``
          } else if (!artifacts.research) {
            nextAction = `Run \`/epic ${epicName}\` to start research`
          } else if (!artifacts.plan) {
            nextAction = `Run \`/epic ${epicName}\` to create plan`
          } else if (taskStats.pending > 0 || taskStats.inProgress > 0) {
            nextAction = `Run \`/epic ${epicName}\` to continue execution or \`/epic ${epicName} yolo\` for auto mode`
          } else if (taskStats.blocked > 0) {
            nextAction = `${taskStats.blocked} task(s) blocked - review and unblock`
          } else {
            nextAction = "Epic complete!"
          }

          return JSON.stringify({
            found: true,
            name: epicName,
            currentPhase,
            artifacts,
            tasks: taskStats,
            yolo: state?.yolo || null,
            lastUpdated: state?.lastUpdated || null,
            nextAction,
          }, null, 2)
        },
      }),

      // ----------------------------------------------------------------------
      // get_available_tasks - Tasks ready to execute
      // ----------------------------------------------------------------------
      get_available_tasks: tool({
        description: `Get tasks that are available to execute (dependencies satisfied).

Returns tasks that are pending/in-progress and have all dependencies completed.`,
        args: {
          epicName: tool.schema.string().describe("Name of the epic"),
        },
        async execute(args) {
          const { epicName } = args
          const epicDir = join(directory, ".epics", epicName)
          const tasksDir = join(epicDir, "tasks")

          if (!existsSync(tasksDir)) {
            return JSON.stringify({
              available: [],
              blocked: [],
              message: "No tasks directory found",
            }, null, 2)
          }

          // Get all task files
          const taskFiles = await getTaskFiles(directory, epicName)
          if (taskFiles.length === 0) {
            return JSON.stringify({
              available: [],
              blocked: [],
              message: "No task files found",
            }, null, 2)
          }

          // Parse dependencies
          const dependencies = await parseDependencies(directory, epicName)

          // Read task statuses
          const taskStatuses = new Map<string, string>()
          for (const file of taskFiles) {
            const taskId = file.match(/^(\d+)/)?.[1] || ""
            const content = await readFile(join(tasksDir, file), "utf-8")

            if (content.includes("## Status: done")) {
              taskStatuses.set(taskId, "done")
            } else if (content.includes("## Status: in-progress")) {
              taskStatuses.set(taskId, "in-progress")
            } else if (content.includes("## Status: blocked")) {
              taskStatuses.set(taskId, "blocked")
            } else {
              taskStatuses.set(taskId, "pending")
            }
          }

          // Determine which tasks are available
          const available: Array<{ taskId: string; file: string; status: string }> = []
          const blocked: Array<{ taskId: string; file: string; blockedBy: string[] }> = []

          for (const file of taskFiles) {
            const taskId = file.match(/^(\d+)/)?.[1] || ""
            const status = taskStatuses.get(taskId) || "pending"

            // Skip done or blocked tasks
            if (status === "done" || status === "blocked") continue

            // Check dependencies
            const deps = dependencies.get(taskId) || []
            const unmetDeps = deps.filter((depId) => taskStatuses.get(depId) !== "done")

            if (unmetDeps.length === 0) {
              available.push({ taskId, file, status })
            } else {
              blocked.push({ taskId, file, blockedBy: unmetDeps })
            }
          }

          return JSON.stringify({ available, blocked }, null, 2)
        },
      }),

      // ----------------------------------------------------------------------
      // build_task_context - Build context for task execution
      // ----------------------------------------------------------------------
      build_task_context: tool({
        description: `Build the full context for executing an epic task.

This tool reads the epic's spec, research, plan, and all previous completed tasks,
then returns a complete prompt that should be passed to the Task tool to execute
the task with a fresh sub-agent.

Use this before calling the Task tool for each task execution.`,
        args: {
          epicName: tool.schema.string().describe("Name of the epic (the folder name under .epics/)"),
          taskId: tool.schema
            .string()
            .describe("Task ID - the number prefix like '01', '02', etc."),
        },
        async execute(args) {
          const { epicName, taskId } = args
          const epicDir = join(directory, ".epics", epicName)
          const tasksDir = join(epicDir, "tasks")

          // Verify epic exists
          if (!existsSync(epicDir)) {
            return JSON.stringify({
              success: false,
              error: `Epic "${epicName}" not found at ${epicDir}`,
            }, null, 2)
          }

          // Read context files
          const spec = await readFileIfExists(join(epicDir, "spec.md"))
          const research = await readFileIfExists(join(epicDir, "research.md"))
          const plan = await readFileIfExists(join(epicDir, "plan.md"))

          if (!spec) {
            return JSON.stringify({
              success: false,
              error: `No spec.md found for epic "${epicName}"`,
            }, null, 2)
          }

          // Find the task file
          const taskFiles = await getTaskFiles(directory, epicName)
          const taskFile = taskFiles.find((f) => f.startsWith(taskId))

          if (!taskFile) {
            return JSON.stringify({
              success: false,
              error: `Task "${taskId}" not found in ${tasksDir}`,
            }, null, 2)
          }

          const taskPath = join(tasksDir, taskFile)
          const taskContent = await readFile(taskPath, "utf-8")

          // Check if task is already done
          if (taskContent.includes("## Status: done")) {
            return JSON.stringify({
              success: true,
              alreadyDone: true,
              message: `Task ${taskId} is already complete`,
            }, null, 2)
          }

          // Read all previous task files (for context)
          const previousTasks: string[] = []
          for (const file of taskFiles) {
            const fileTaskId = file.match(/^(\d+)/)?.[1] || ""
            if (fileTaskId >= taskId) break // Stop at current task

            const content = await readFile(join(tasksDir, file), "utf-8")
            previousTasks.push(`### ${file}\n\n${content}`)
          }

          // Build the sub-agent prompt
          const prompt = `# Execute Epic Task

You are executing task ${taskId} of epic "${epicName}".

## Your Mission

Execute the task described below. When complete:
1. Update the task file's status from "pending" or "in-progress" to "done"
2. Add a "## Report" section at the end of the task file with:
   - **What Was Done**: List the changes you made
   - **Decisions Made**: Any choices you made and why
   - **Issues / Notes for Next Task**: Anything the next task should know
   - **Files Changed**: List of files created/modified

If you discover the task approach is wrong or future tasks need changes, you may update them.
The plan is a living document.

---

## Epic Spec

${spec}

---

## Research

${research || "(No research conducted yet)"}

---

## Plan

${plan || "(No plan created yet)"}

---

## Previous Completed Tasks

${previousTasks.length > 0 ? previousTasks.join("\n\n---\n\n") : "(This is the first task)"}

---

## Current Task to Execute

**File: .epics/${epicName}/tasks/${taskFile}**

${taskContent}

---

## Instructions

1. Read and understand the task
2. Execute the steps described
3. Verify the "Done When" criteria are met
4. Update the task file:
   - Change \`## Status: pending\` or \`## Status: in-progress\` to \`## Status: done\`
   - Add a \`## Report\` section at the end
5. If you need to modify future tasks or the plan, do so
6. When complete, confirm what was done
`

          await client.app.log({
            service: "epic-plugin",
            level: "info",
            message: `Built context for task ${taskId} of epic "${epicName}" (${previousTasks.length} previous tasks)`,
          })

          return JSON.stringify({
            success: true,
            taskFile,
            taskPath,
            prompt,
            message: `Context built for task ${taskId}. Pass the 'prompt' field to the Task tool to execute with a sub-agent.`,
          }, null, 2)
        },
      }),

      // ----------------------------------------------------------------------
      // epic_config - View and manage epic configuration
      // ----------------------------------------------------------------------
      epic_config: tool({
        description: `View or reset epic configuration.

Actions:
- "view": Show current merged configuration and where values come from
- "reset": Reset project config to defaults (creates .epics/config.jsonc)
- "init": Initialize config if it doesn't exist (non-destructive)`,
        args: {
          action: tool.schema.enum(["view", "reset", "init"]).describe("Action to perform"),
        },
        async execute(args) {
          const { action } = args
          const epicsDir = join(directory, ".epics")
          const configPath = join(epicsDir, "config.jsonc")
          const localConfigPath = join(epicsDir, "config.local.jsonc")
          const homeDir = process.env.HOME || process.env.USERPROFILE || ""
          const globalConfigPath = join(homeDir, ".config", "epic-workflow", "config.jsonc")

          const logWarning = (msg: string) => {
            client.app.log({
              service: "epic-plugin",
              level: "warn",
              message: msg,
            })
          }

          if (action === "view") {
            // Load config and show sources
            const config = await loadConfig(directory, logWarning)
            
            const sources: string[] = []
            if (existsSync(globalConfigPath)) sources.push(`Global: ${globalConfigPath}`)
            if (existsSync(configPath)) sources.push(`Project: ${configPath}`)
            if (existsSync(localConfigPath)) sources.push(`Local: ${localConfigPath}`)
            if (sources.length === 0) sources.push("(Using defaults - no config files found)")

            return JSON.stringify({
              config,
              sources,
              paths: {
                global: globalConfigPath,
                project: configPath,
                local: localConfigPath,
              },
            }, null, 2)
          }

          if (action === "reset") {
            // Ensure directory exists and reset config
            const { mkdir } = await import("fs/promises")
            if (!existsSync(epicsDir)) {
              await mkdir(epicsDir, { recursive: true })
            }

            await writeFile(configPath, DEFAULT_CONFIG_CONTENT, "utf-8")
            
            // Also ensure .gitignore exists
            const gitignorePath = join(epicsDir, ".gitignore")
            if (!existsSync(gitignorePath)) {
              await writeFile(gitignorePath, EPICS_GITIGNORE_CONTENT, "utf-8")
            }

            return JSON.stringify({
              success: true,
              message: "Config reset to defaults",
              path: configPath,
              tip: "Edit .epics/config.jsonc to customize settings. Create .epics/config.local.jsonc for personal overrides (gitignored).",
            }, null, 2)
          }

          if (action === "init") {
            const result = await ensureEpicsDirectory(directory)

            if (result.configCreated) {
              return JSON.stringify({
                success: true,
                message: "Config initialized with defaults",
                path: configPath,
                tip: "Edit .epics/config.jsonc to customize settings. Create .epics/config.local.jsonc for personal overrides (gitignored).",
              }, null, 2)
            } else {
              return JSON.stringify({
                success: true,
                message: "Config already exists",
                path: configPath,
                tip: "Use action 'reset' to overwrite with defaults, or 'view' to see current config.",
              }, null, 2)
            }
          }

          return JSON.stringify({ success: false, error: `Unknown action: ${action}` }, null, 2)
        },
      }),

      // ----------------------------------------------------------------------
      // get_epic_config - Get current config for use by other tools/skills
      // ----------------------------------------------------------------------
      get_epic_config: tool({
        description: `Get the current epic configuration.

Returns the merged configuration from all sources (global, project, local).
Use this to check settings like git.completionMode before performing actions.`,
        args: {},
        async execute() {
          const logWarning = (msg: string) => {
            client.app.log({
              service: "epic-plugin",
              level: "warn",
              message: msg,
            })
          }

          const config = await loadConfig(directory, logWarning)
          return JSON.stringify({ config }, null, 2)
        },
      }),
    },

    // ========================================================================
    // Event Handler: Yolo Mode Auto-Continue
    // ========================================================================
    event: async ({ event }) => {
      if (event.type !== "session.idle") return

      const sessionId = (event as any).properties?.sessionID

      // Debug: log the event
      await client.app.log({
        service: "epic-plugin",
        level: "info",
        message: `session.idle event received. sessionId: ${sessionId || "UNDEFINED"}`,
      })

      // Find active yolo epic
      const activeEpic = await findActiveYoloEpic(directory)
      if (!activeEpic) {
        await client.app.log({
          service: "epic-plugin",
          level: "info",
          message: "No active yolo epic found",
        })
        return
      }

      const { name: epicName, state } = activeEpic
      const yolo = state.yolo!

      // Check remaining tasks
      const remaining = await countRemainingTasks(directory, epicName)

      // Log progress
      await client.app.log({
        service: "epic-plugin",
        level: "info",
        message: `Epic "${epicName}" yolo check: ${remaining} tasks remaining, iteration ${yolo.iteration}/${yolo.maxIterations || "unlimited"}`,
      })

      // Check if complete
      if (remaining === 0) {
        await updateEpicState(directory, epicName, {
          executeComplete: true,
          yolo: { ...yolo, active: false },
        })

        await notify($, "Epic Complete", `Epic "${epicName}" finished successfully!`)

        await client.app.log({
          service: "epic-plugin",
          level: "info",
          message: `Epic "${epicName}" completed! All tasks done.`,
        })

        return
      }

      // Check max iterations
      if (yolo.maxIterations > 0 && yolo.iteration >= yolo.maxIterations) {
        await updateEpicState(directory, epicName, {
          yolo: { ...yolo, active: false },
        })

        await notify(
          $,
          "Epic Stopped",
          `Epic "${epicName}" hit max iterations (${yolo.maxIterations})`
        )

        await client.app.log({
          service: "epic-plugin",
          level: "warn",
          message: `Epic "${epicName}" stopped: max iterations (${yolo.maxIterations}) reached with ${remaining} tasks remaining`,
        })

        return
      }

      // Continue the epic
      const nextIteration = yolo.iteration + 1
      await updateEpicState(directory, epicName, {
        yolo: { ...yolo, iteration: nextIteration },
      })

      // Send continuation prompt
      if (sessionId) {
        await client.app.log({
          service: "epic-plugin",
          level: "info",
          message: `Sending continuation prompt for "${epicName}" to session ${sessionId}`,
        })
        
        try {
          await client.session.send({
            id: sessionId,
            text: `Continue executing epic "${epicName}". ${remaining} task(s) remaining. [Iteration ${nextIteration}${yolo.maxIterations > 0 ? `/${yolo.maxIterations}` : ""}]`,
          })

          await client.app.log({
            service: "epic-plugin",
            level: "info",
            message: `Epic "${epicName}" continuing: iteration ${nextIteration}, ${remaining} tasks remaining`,
          })
        } catch (err) {
          await client.app.log({
            service: "epic-plugin",
            level: "error",
            message: `Failed to send continuation: ${err}`,
          })
        }
      } else {
        await client.app.log({
          service: "epic-plugin",
          level: "warn",
          message: `No sessionId available - cannot continue epic "${epicName}"`,
        })
      }
    },
  }
}
