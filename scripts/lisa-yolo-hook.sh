#!/bin/bash

# Lisa Yolo Stop Hook
# Prevents session exit when a lisa yolo loop is active
# Feeds a continuation prompt back to drive the next iteration

set -euo pipefail

# Check for jq dependency
if ! command -v jq &> /dev/null; then
  echo "⚠️  Lisa yolo: jq is required but not installed." >&2
  echo "   Install it with: brew install jq (macOS) or apt install jq (Linux)" >&2
  echo "   Lisa yolo loop is stopping." >&2
  exit 0
fi

# Lisa yolo state file - simple key=value format, written by the yolo skill
LISA_YOLO_STATE=".lisa/yolo.state"

if [[ ! -f "$LISA_YOLO_STATE" ]]; then
  # No active yolo loop - allow exit
  exit 0
fi

# Read hook input from stdin
HOOK_INPUT=$(cat)

# Parse state file (key=value format)
ACTIVE=$(grep '^active=' "$LISA_YOLO_STATE" 2>/dev/null | sed 's/active=//' || echo "false")
EPIC_NAME=$(grep '^epic=' "$LISA_YOLO_STATE" 2>/dev/null | sed 's/epic=//' || echo "")
ITERATION=$(grep '^iteration=' "$LISA_YOLO_STATE" 2>/dev/null | sed 's/iteration=//' || echo "0")
MAX_ITERATIONS=$(grep '^max_iterations=' "$LISA_YOLO_STATE" 2>/dev/null | sed 's/max_iterations=//' || echo "100")

# Check if yolo is active
if [[ "$ACTIVE" != "true" ]]; then
  exit 0
fi

# Validate epic name
if [[ -z "$EPIC_NAME" ]]; then
  echo "⚠️  Lisa yolo: State file missing epic name." >&2
  echo "   File: $LISA_YOLO_STATE" >&2
  echo "   Lisa yolo loop is stopping." >&2
  rm -f "$LISA_YOLO_STATE"
  exit 0
fi

# Validate numeric fields
if [[ ! "$ITERATION" =~ ^[0-9]+$ ]]; then
  echo "⚠️  Lisa yolo: State file corrupted." >&2
  echo "   File: $LISA_YOLO_STATE" >&2
  echo "   Problem: 'iteration' is not a valid number (got: '$ITERATION')" >&2
  echo "   Lisa yolo loop is stopping." >&2
  rm -f "$LISA_YOLO_STATE"
  exit 0
fi

if [[ ! "$MAX_ITERATIONS" =~ ^[0-9]+$ ]]; then
  echo "⚠️  Lisa yolo: State file corrupted." >&2
  echo "   File: $LISA_YOLO_STATE" >&2
  echo "   Problem: 'max_iterations' is not a valid number (got: '$MAX_ITERATIONS')" >&2
  echo "   Lisa yolo loop is stopping." >&2
  rm -f "$LISA_YOLO_STATE"
  exit 0
fi

# Check if max iterations reached
if [[ $MAX_ITERATIONS -gt 0 ]] && [[ $ITERATION -ge $MAX_ITERATIONS ]]; then
  echo "🛑 Lisa yolo: Max iterations ($MAX_ITERATIONS) reached for epic \"$EPIC_NAME\"." >&2
  echo "   Use /lisa:continue $EPIC_NAME to resume interactively." >&2
  # Mark yolo as inactive in .state file
  TEMP_FILE="${LISA_YOLO_STATE}.tmp.$$"
  sed "s/^active=.*/active=false/" "$LISA_YOLO_STATE" > "$TEMP_FILE"
  mv "$TEMP_FILE" "$LISA_YOLO_STATE"
  # Also update the epic's .state JSON if it exists
  EPIC_STATE=".lisa/epics/${EPIC_NAME}/.state"
  if [[ -f "$EPIC_STATE" ]] && command -v jq &> /dev/null; then
    TEMP_JSON="${EPIC_STATE}.tmp.$$"
    jq '.yolo.active = false' "$EPIC_STATE" > "$TEMP_JSON" && mv "$TEMP_JSON" "$EPIC_STATE"
  fi
  exit 0
fi

# Increment iteration
NEXT_ITERATION=$((ITERATION + 1))

# Update state file
TEMP_FILE="${LISA_YOLO_STATE}.tmp.$$"
sed "s/^iteration=.*/iteration=$NEXT_ITERATION/" "$LISA_YOLO_STATE" > "$TEMP_FILE"
mv "$TEMP_FILE" "$LISA_YOLO_STATE"

# Also update iteration in epic's .state JSON
EPIC_STATE=".lisa/epics/${EPIC_NAME}/.state"
if [[ -f "$EPIC_STATE" ]]; then
  TEMP_JSON="${EPIC_STATE}.tmp.$$"
  jq ".yolo.iteration = $NEXT_ITERATION" "$EPIC_STATE" > "$TEMP_JSON" && mv "$TEMP_JSON" "$EPIC_STATE"
fi

# Build continuation prompt
CONTINUATION_PROMPT="[LISA YOLO - AUTO-CONTINUE]

Epic: $EPIC_NAME
Iteration: $NEXT_ITERATION of $MAX_ITERATIONS

Load the lisa:yolo skill and continue executing epic \"$EPIC_NAME\".

RULES:
- Do NOT stop to summarize
- Do NOT ask for confirmation
- Do NOT explain what you are about to do
- Just load the skill and execute the next available task immediately

This is automated yolo execution. Keep working."

SYSTEM_MSG="🔄 Lisa yolo iteration $NEXT_ITERATION/$MAX_ITERATIONS | Epic: $EPIC_NAME | To stop: delete .lisa/yolo.state"

# Output JSON to block the stop and feed continuation prompt back
jq -n \
  --arg prompt "$CONTINUATION_PROMPT" \
  --arg msg "$SYSTEM_MSG" \
  '{
    "decision": "block",
    "reason": $prompt,
    "systemMessage": $msg
  }'

exit 0
