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

**Slack Integration:**
- `SLACK_BOT_TOKEN` - Slack bot token for the Lucie app
- `SLACK_SIGNING_SECRET` - Slack signing secret for request verification

**Airtable:**
- `AIRTABLE_API_KEY` - API key for Airtable access
- `SU_2025_BASE_ID` - Airtable base ID for the cohort data (Pioneers program data)
- `SU_2025_TABLE_ID` - Airtable table ID for the cohort data
- `AI_LAB_BASE_ID` - Airtable base ID for the AI Lab data
- `AI_LAB_TABLE_ID` - Airtable table ID for the AI Lab data

**AI Models:**
- `MODEL` - Model identifier (default: `anthropic/claude-3-haiku-20240307`, configurable to `openai/gpt-4.1-nano` or other models)
- `ANTHROPIC_API_KEY` - Anthropic API key (required if using Anthropic models)
- `OPENAI_API_KEY` - OpenAI API key (required if using OpenAI models)

**MCP Integration:**
- `HTTP_MCP_ENDPOINT` - HTTP endpoint for MCP server (provides additional tools via Model Context Protocol)

**Observability:**
- `MASTRA_CLOUD_ACCESS_TOKEN` - Token for Mastra Cloud observability platform

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
- Uses configurable model via `MODEL` env variable (default: `anthropic/claude-3-haiku-20240307`)
- Supports both Anthropic and OpenAI models (prefix: `anthropic/*` or `openai/*`)
- Memory configured to retain last 20 messages
- Detailed system instructions (`lucie-instructions.ts`) emphasize:
  - Concise, direct responses (2-4 sentences)
  - Greeting message handling (don't use tools for greetings)
  - Broad query strategy: query for "all" data, then filter intelligently with LLM reasoning
  - Slack-friendly formatting (bold, bullets, emoji)
  - Date-aware responses using current date
- **Static Tools**: Two Airtable data fetching tools (cohort and AI Lab)
- **MCP Integration**: MCP client (`lucieMcpClient`) configured with HTTP endpoint for additional tools

### Tool Architecture

**Static Airtable Tools**:
- **getCohortDataTool** (`src/mastra/tools/cohort-data-tool.ts`):
  - Fetches all records from the Pioneers cohort Airtable base
  - Uses `SU_2025_BASE_ID` and `SU_2025_TABLE_ID` environment variables
  - Returns array of records with `id` and `fields` properties
  - No input parameters - fetches all data for LLM to filter

- **getAiLabDataTool** (`src/mastra/tools/ai-lab-data-tool.ts`):
  - Fetches all records from the AI Lab Airtable base
  - Uses `AI_LAB_BASE_ID` and `AI_LAB_TABLE_ID` environment variables
  - Returns array of records with `id` and `fields` properties
  - Field mapping reference available in `data/ai-lab-table-ref.json`

**MCP (Model Context Protocol) Tools**:
- MCP client configured in `src/mastra/mcp/mcp-servers.ts` with HTTP endpoint
- Provides additional tools beyond the static Airtable tools
- Tools are loaded from the configured MCP server at runtime
- The MCP endpoint is specified via `HTTP_MCP_ENDPOINT` environment variable

### Data Sources

**Airtable Bases**:
The agent accesses two Airtable bases:
1. **Pioneers Cohort Data** (`SU_2025_BASE_ID`/`SU_2025_TABLE_ID`):
   - Contains information about the Pioneers accelerator program
   - Includes pioneer profiles, sessions, events, general Q&A
   - Accessed via `getCohortDataTool`

2. **AI Lab Data** (`AI_LAB_BASE_ID`/`AI_LAB_TABLE_ID`):
   - Contains AI Lab participant information and feedback
   - Field structure documented in `data/ai-lab-table-ref.json`
   - Includes fields: first_name, last_name, email, skills, problem, notes, decision, etc.
   - Accessed via `getAiLabDataTool`

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
3. Agent retrieves conversation context from Memory (last 20 messages)
4. Agent processes message using instructions, memory, and available tools
5. Agent may call Airtable tools (`getCohortDataTool`, `getAiLabDataTool`) or MCP tools to fetch data
6. For Airtable queries:
   - Tool fetches ALL records from the specified base/table (no filtering at DB level)
   - Agent's LLM analyzes returned data to answer the specific question
   - This "broad query, intelligent filtering" approach leverages LLM reasoning
7. Agent generates response based on retrieved data
8. Response streams back to Slack (with animation) or terminal (real-time text)
9. Conversation context saved to Memory for future turns

### Storage and Observability

- **Storage**: LibSQL in-memory storage (`:memory:`) for observability, scores, and other data. Can be changed to `file:../mastra.db` for persistence.
- **Logger**: Pino logger at `info` level
- **Observability**: Enabled with `default` exporter for tracing (DefaultExporter and CloudExporter available)

## Development Workflow

### Adding a New Tool

1. Create tool in `src/mastra/tools/` using `createTool` from `@mastra/core/tools`
2. Define input schema with Zod (use empty object if no inputs needed)
3. Define output schema with Zod
4. Implement `execute` function (typically an async API call)
5. Export tool and add it to agent's `tools` object in `src/mastra/agents/lucie-agents.ts`

Example structure:
```typescript
export const myTool = createTool({
  id: 'my-tool',
  description: 'What the tool does',
  inputSchema: z.object({}),
  outputSchema: z.object({ data: z.array(...) }),
  execute: async () => {
    // Fetch data
    return { data: [...] };
  },
});
```

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

### Configuring MCP Servers

1. Update the `servers` object in `src/mastra/mcp/mcp-servers.ts`
2. Servers can be configured as:
   - **HTTP endpoints**: `{ url: new URL(process.env.HTTP_MCP_ENDPOINT) }`
   - **Local server processes**: `{ command: "node", args: ["path/to/server.js"] }`
3. MCP tools are automatically discovered and loaded when the MCP client initializes
4. The MCP client is then referenced in the agent definition to provide additional tools

## Key Implementation Details

### Mastra Framework

This project uses Mastra (v1.0.0-beta), an AI agent framework. Key concepts:
- **Agents**: Autonomous entities with instructions, tools, memory, and model configuration
- **Tools**: Functions agents can call (defined with Zod schemas for inputs/outputs)
- **Workflows**: Multi-step processes (not currently used in this project)
- **Scorers**: Evaluation functions for agent performance (defined but not actively used)
- **Memory**: Conversation history management (configured per agent)
- **Streaming**: Real-time response generation with chunk types (text-delta, tool-call, tool-output, workflow-*)
- **Storage**: LibSQL for persisting observability data and scores

### Model Context Protocol (MCP)

MCP provides a standardized way to connect LLMs to external tools and data sources:
- **MCPClient** (`@mastra/mcp`): Client for connecting to MCP servers
- **Servers**: Can be HTTP endpoints or local processes that expose tools/resources/prompts
- **Configuration**: MCP servers defined in `src/mastra/mcp/mcp-servers.ts`
- **Integration**: MCP client provides tools to agents beyond the static Airtable tools
- Current setup uses HTTP MCP endpoint for additional tool capabilities

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

### Build and Deployment
- The `.mastra` directory is gitignored and contains build artifacts
- Mastra CLI handles bundling via Rollup (see `.mastra/bundler-config.mjs` and `.mastra/.build/`)
- Node.js version required: `>=22.13.0` (specified in package.json engines)
- Package manager: pnpm (v10.27.0)

### Agent Configuration
- Agent instructions are lengthy but critical - they define the agent's behavior, response style, and tool usage patterns
- Instructions stored in separate file (`lucie-instructions.ts`) for better maintainability
- Model is configurable via `MODEL` environment variable (supports `openai/*` and `anthropic/*` prefixes)
- Instructions are date-aware: they inject current date for handling temporal queries ("next session", "upcoming events")

### Development Best Practices
- **Terminal CLI is preferred for rapid iteration** - avoids Slack rate limits and provides cleaner debugging experience
- Run `pnpm dev:cli` for local testing with interactive agent interface
- Use `log()` helper from `lib/print-helpers` for debugging (visible in terminal output)
- Slack streaming uses rate limit-tolerant animation (errors during animation updates are ignored)
- All Airtable tools fetch complete datasets - filtering/analysis happens at LLM level, not query level

### Project Structure Notes
- `data/` directory contains reference files like AI Lab table field mappings
- `lib/` contains shared utilities (print helpers, Airtable client, utils)
- `ai/` directory has documentation about Mastra and Composio frameworks
- `bff/` directory contains AI Lab related files
- Agent instructions emphasize concise responses (2-4 sentences) with Slack-friendly formatting
