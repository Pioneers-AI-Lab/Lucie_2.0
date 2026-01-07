# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Lucie 2.0**, an AI agent built with the Mastra framework that serves as a Program Manager for the Pioneers accelerator program. The agent answers questions about the program by querying Airtable data and can be accessed through both Slack and a terminal CLI.

## Common Commands

```bash
# Development - Start Mastra dev server (includes hot reload)
pnpm dev

# Development - Run terminal CLI for local agent testing
pnpm dev:cli
# or with specific agent:
pnpm dev:cli --agent lucie

# Build - Compile and bundle for production
pnpm build

# Production - Start production server
pnpm start
```

## Environment Variables

Required environment variables (see `.env`):

- `AIRTABLE_API_KEY` - API key for Airtable access
- `SU_2025_BASE_ID` - Airtable base ID for the cohort data
- `SU_2025_TABLE_ID` - Airtable table ID for the cohort data
- `SLACK_BOT_TOKEN` - Slack bot token for the Lucie app
- `SLACK_SIGNING_SECRET` - Slack signing secret for request verification
- OpenAI API key (model: `gpt-4o-mini`)

## Architecture

### Core Structure

The codebase follows Mastra's agent framework conventions:

- **`src/mastra/index.ts`** - Main Mastra instance initialization. Registers agents, workflows, scorers, storage (LibSQL), and logger (Pino).
- **`src/mastra/agents/`** - Agent definitions with instructions, tools, memory, and model configuration
- **`src/mastra/tools/`** - Tool definitions (functions agents can call)
- **`src/mastra/workflows/`** - Multi-step workflow definitions
- **`src/mastra/scorers/`** - Evaluation scorers for agent performance
- **`src/mastra/slack/`** - Slack integration and streaming logic
- **`src/mastra/terminal/`** - Terminal CLI and streaming logic
- **`lib/`** - Shared utility functions

### Agent Architecture

**Lucie Agent** (`src/mastra/agents/lucie-agents.ts`):
- Uses `gpt-4o-mini` model
- Has Memory configured to retain last 20 messages
- Detailed system instructions emphasize:
  - Concise, direct responses (2-4 sentences)
  - Greeting message handling (don't use tools for greetings)
  - Broad query strategy: query for "all" data, then filter intelligently with LLM reasoning
  - Slack-friendly formatting (bold, bullets, emoji)
  - Date-aware responses using current date
- Currently uses `getCohortDataTool` to fetch data from Airtable

### Tool Architecture

**getCohortDataTool** (`src/mastra/tools/cohort-data-tool.ts`):
- Fetches all records from Airtable base/table specified in environment variables
- Returns raw records with ID and fields
- No input schema (no parameters)
- Agent is instructed to analyze returned data intelligently rather than rely on complex queries

### Slack Integration

**Route Registration** (`src/mastra/slack/routes.ts`):
- Factory function `createSlackEventsRoute` generates routes for multiple Slack apps
- Each app gets webhook at `/slack/{name}/events`
- Handles URL verification challenge and event callbacks
- Verifies request signatures using HMAC
- Processes `app_mention` and direct `message` events
- Strips bot mentions from message text
- Asynchronous processing to meet Slack's 3-second timeout requirement
- Currently configured for one app: "lucie"

**Streaming** (`src/mastra/slack/streaming.ts`):
- Posts initial "thinking" message with animated spinner
- Streams agent response chunks in real-time
- Updates Slack message with status indicators for tool calls and workflow steps
- Handles nested workflow events from tool-output chunks
- Graceful error handling with retry logic (3 attempts with exponential backoff)
- Animation runs every 300ms until completion

### Terminal CLI

**CLI** (`src/mastra/terminal/cli.ts`):
- Interactive terminal interface for testing agents locally
- Avoids Slack rate limits during development
- Agent selection via `--agent` flag or interactive menu
- Multi-turn conversations with memory
- Type `exit` or `quit` to end session

**Streaming** (`src/mastra/terminal/streaming.ts`):
- Real-time text streaming to stdout (character by character)
- Progress indicators for tool calls and workflows (commented out for cleaner output)
- Similar chunk processing to Slack streaming

### Data Flow

1. User sends message via Slack or terminal CLI
2. Route handler/CLI parses message and initiates agent streaming
3. Agent processes message using instructions, memory, and tools
4. Agent may call `getCohortDataTool` to fetch Airtable data
5. Agent analyzes data and generates response
6. Response streams back to Slack (with animation) or terminal (real-time text)

### Storage and Observability

- **Storage**: LibSQL in-memory storage (`:memory:`) for observability, scores, and other data. Can be changed to `file:../mastra.db` for persistence.
- **Logger**: Pino logger at `info` level
- **Observability**: Currently disabled (commented out in `src/mastra/index.ts`)

## Development Workflow

### Adding a New Tool

1. Create tool in `src/mastra/tools/` using `createTool` from `@mastra/core/tools`
2. Define input schema with Zod
3. Define output schema with Zod
4. Implement `execute` function
5. Export tool and register in agent's `tools` config in `src/mastra/agents/`

### Adding a New Agent

1. Create agent file in `src/mastra/agents/`
2. Define instructions, model, tools, and memory
3. Export agent and register in `src/mastra/index.ts` under `agents` config
4. Add to `availableAgents` array in `src/mastra/terminal/cli.ts`
5. Optionally add Slack app configuration in `src/mastra/slack/routes.ts`

### Adding a New Slack App

1. Create and configure agent (see above)
2. Add configuration to `slackApps` array in `src/mastra/slack/routes.ts`
3. Add environment variables: `SLACK_{APP_NAME}_BOT_TOKEN` and `SLACK_{APP_NAME}_SIGNING_SECRET`
4. Create Slack app at api.slack.com/apps
5. Configure webhook URL: `https://your-domain.com/slack/{name}/events`
6. Enable Event Subscriptions and subscribe to `app_mention` and `message.im` events

## Key Implementation Details

### Mastra Framework

This project uses Mastra (v1.0.0-beta), an AI agent framework. Key concepts:
- **Agents**: Autonomous entities with instructions, tools, memory, and model
- **Tools**: Functions agents can call (defined with Zod schemas)
- **Workflows**: Multi-step processes (not currently used in this project)
- **Scorers**: Evaluation functions for agent performance
- **Memory**: Conversation history management
- **Streaming**: Real-time response generation with chunk types (text-delta, tool-call, tool-output, workflow-*)

### Agent Instructions Philosophy

The Lucie agent is instructed to use a "broad query, intelligent filtering" strategy:
- Query tools with broad terms like "all pioneers", "sessions", etc.
- Let the LLM analyze and filter the returned data
- Avoid overly specific or complex queries
- This approach leverages the LLM's intelligence rather than database query complexity

### Message Context

Both Slack and terminal interfaces use:
- `resourceId`: Identifies the user/session (e.g., `slack-{teamId}-{userId}` or `terminal-{pid}-{timestamp}`)
- `threadId`: Identifies the conversation thread (e.g., `slack-{channelId}-{threadTs}` or `terminal-{timestamp}`)

These IDs enable Mastra's Memory to maintain conversation context across turns.

## TypeScript Configuration

- **Target**: ES2022
- **Module**: ES2022 with bundler resolution
- **Type**: ESM (package.json has `"type": "module"`)
- **Strict mode**: Enabled
- **No emit**: Enabled (Mastra handles bundling)

## Important Notes

- The `.mastra` directory is gitignored and contains build artifacts
- Mastra CLI handles bundling via Rollup (see `.mastra/bundler-config.mjs` and `.mastra/.build/`)
- Agent instructions are lengthy but critical - they define the agent's behavior, response style, and tool usage patterns
- Slack streaming uses rate limit-tolerant animation (errors during animation updates are ignored)
- Terminal CLI is preferred for rapid iteration during development
