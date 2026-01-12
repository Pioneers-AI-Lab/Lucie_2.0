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

# Database - Generate migration files from schema changes
pnpm drizzle-kit generate

# Database - Apply migrations to Turso database
pnpm drizzle-kit migrate

# Database - Open Drizzle Studio for database inspection
pnpm drizzle-kit studio
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
- `AI_LAB_BASE_ID` - Airtable base ID for AI Lab data (defined but not yet implemented in tools)
- `AI_LAB_TABLE_ID` - Airtable table ID for AI Lab data (defined but not yet implemented in tools)

**AI Models:**
- `MODEL` - Model identifier (default: `anthropic/claude-3-haiku-20240307`, configurable to `openai/gpt-4.1-nano` or other models)
- `ANTHROPIC_API_KEY` - Anthropic API key (required if using Anthropic models)
- `OPENAI_API_KEY` - OpenAI API key (required if using OpenAI models)

**Observability:**
- `MASTRA_CLOUD_ACCESS_TOKEN` - Token for Mastra Cloud observability platform

**Database (Turso + Drizzle ORM):**
- `TURSO_CONNECTION_URL` - Turso database connection URL (libsql://...)
- `TURSO_AUTH_TOKEN` - Turso authentication token for database access

## Architecture

### Core Structure

The codebase follows Mastra's agent framework conventions:

- **`src/mastra/index.ts`** - Main Mastra instance initialization. Registers agents, storage (LibSQL), logger (Pino), and API routes.
- **`src/mastra/agents/`** - Agent definitions with instructions, tools, memory, and model configuration
- **`src/mastra/tools/`** - Tool definitions (functions agents can call)
- **`src/mastra/workflows/`** - Multi-step workflow definitions (not actively used)
- **`src/mastra/scorers/`** - Evaluation scorers for agent performance (not actively used)
- **`src/mastra/slack/`** - Slack integration and streaming logic
- **`src/mastra/terminal/`** - Terminal CLI and streaming logic
- **`src/db/`** - Database infrastructure with Turso + Drizzle ORM
  - `src/db/index.ts` - Database client initialization
  - `src/db/schemas/` - Drizzle ORM schema definitions (currently: founders)
- **`lib/`** - Shared utility functions (Airtable client, print helpers, update scripts, field ID mappings)

### Agent Architecture

**Lucie Agent** (`src/mastra/agents/lucie-agents.ts`):
- Uses configurable model via `MODEL` env variable (default: `anthropic/claude-3-haiku-20240307`)
- Supports both Anthropic and OpenAI models (prefix: `anthropic/*` or `openai/*`)
- Memory configured to retain last 20 messages
- Detailed system instructions (`lucie-instructions.ts`) emphasize:
  - Concise, direct responses (2-4 sentences)
  - Greeting message handling (don't use tools for greetings)
  - Optional filtering strategy: supports both filtered queries and fetching all data for LLM analysis
  - Slack-friendly formatting (bold, bullets, emoji)
  - Date-aware responses using current date
- **Tools**: One Airtable data fetching tool (`getCohortDataTool`)
- **Note**: Agent instructions reference an AI Lab tool that is not yet implemented

### Tool Architecture

**Airtable Tool with Optional Filtering**:

The agent currently has one tool that supports optional filtering parameters for efficient data retrieval:

- **getCohortDataTool** (`src/mastra/tools/cohort-data-tool.ts`):
  - Fetches records from the Pioneers cohort Airtable base
  - Uses `SU_2025_BASE_ID` and `SU_2025_TABLE_ID` environment variables
  - Returns array of records with `id` and `fields` properties
  - **Filtering options**:
    - `filterFormula`: Airtable formula (e.g., `"{Role} = 'CTO'"`)
    - `searchField` + `searchText`: Text search in specific field (case-insensitive)
    - `fieldName` + `fieldValue`: Exact match on a field
  - If no filters provided, fetches all records

**Filtering Strategy**:
The agent instructions guide when to use filters vs. fetching all data:
- Use filters for simple, targeted queries (e.g., "CTOs", "Accepted applicants")
- Fetch all data when query requires cross-field analysis, date comparisons, or complex reasoning
- LLM handles final filtering/analysis after data retrieval

### Data Sources

**Airtable → Turso Database Migration Pattern**:

The project is in transition from direct Airtable querying to a Turso database with structured schemas:

1. **Primary Data Source - Airtable**:
   - **Pioneers Cohort Data** (`SU_2025_BASE_ID`/`SU_2025_TABLE_ID`):
     - Contains information about the Pioneers accelerator program
     - Includes pioneer profiles, sessions, events, general Q&A
     - Accessed via `getCohortDataTool`
   - **AI Lab Data** (`AI_LAB_BASE_ID`/`AI_LAB_TABLE_ID`):
     - Environment variables configured but tool not yet implemented
     - Local data files exist in `airtable_data/` and `bff/ai-lab/`

2. **Turso Database (In Development)**:
   - **Purpose**: Structured, queryable storage layer for Airtable data
   - **Current Status**: Schema and infrastructure in place, data migration pending
   - **Tables**:
     - `founders` - Founder profiles with comprehensive personal/professional data
     - Additional tables (sessions, startups) mapped but schemas not yet created
   - **Field ID Mappings** (`lib/airtable-field-ids-ref.ts`):
     - Maps Drizzle schema field names to Airtable field IDs
     - Three mappings: `founderAirtableFieldIds`, `sessionEventAirtableFieldIds`, `startupAirtableFieldIds`
     - Enables bidirectional sync between Airtable and Turso
   - **Configuration**: `drizzle.config.ts` for migrations and schema management

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
- Progress indicators for tool calls and workflows
- Similar chunk processing to Slack streaming

### Data Flow

1. User sends message via Slack or terminal CLI
2. Route handler/CLI parses message and initiates agent streaming
3. Agent retrieves conversation context from Memory (last 20 messages)
4. Agent processes message using instructions, memory, and available tool
5. Agent may call `getCohortDataTool` with optional filtering:
   - **With filters**: Specific queries (e.g., "CTOs", "Accepted applicants") are filtered at Airtable level
   - **Without filters**: Fetch all data for complex queries requiring LLM analysis
   - Agent's LLM analyzes returned data to answer the specific question
6. Agent generates response based on retrieved data
7. Response streams back to Slack (with animation) or terminal (real-time text)
8. Conversation context saved to Memory for future turns

### Storage and Observability

- **Mastra Storage**: LibSQL in-memory storage (`:memory:`) for observability, scores, and agent metadata. Can be changed to `file:../mastra.db` for persistence.
- **Application Database**: Turso (hosted LibSQL) via Drizzle ORM for structured application data (founders, sessions, startups)
- **Logger**: Pino logger at `info` level
- **Observability**: Enabled with `default` exporter for tracing

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
3. Add environment variables: `SLACK_BOT_TOKEN` and `SLACK_SIGNING_SECRET` (or use naming pattern `SLACK_{APP_NAME}_*` for multiple apps)
4. Create Slack app at api.slack.com/apps
5. Configure webhook URL: `https://your-domain.com/slack/{name}/events`
6. Enable Event Subscriptions and subscribe to `app_mention` and `message.im` events

### Working with Database Schemas

**Adding a New Table Schema**:

1. Create schema file in `src/db/schemas/` (e.g., `sessions.ts`):
```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey().notNull(),
  name: text('name'),
  date: integer('date', { mode: 'timestamp' }),
  // ... other fields
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
```

2. If syncing from Airtable, add field ID mappings to `lib/airtable-field-ids-ref.ts`:
```typescript
export const sessionAirtableFieldIds = {
  name: 'fld...',
  date: 'fld...',
  // ... mapping schema field names to Airtable field IDs
} as const;
```

3. Generate migration:
```bash
pnpm drizzle-kit generate
```

4. Apply migration to Turso:
```bash
pnpm drizzle-kit migrate
```

5. Import and use in your code:
```typescript
import { db } from '@/db';
import { sessions } from '@/db/schemas/session';

const allSessions = await db.select().from(sessions);
```

**Schema Design Notes**:
- Use Airtable record IDs as primary keys (text type) for easier sync
- All fields nullable by default to match Airtable's optional field structure
- Include Airtable field IDs in comments for traceability
- Add `createdAt`/`updatedAt` timestamps (not from Airtable, managed by database)
- Use snake_case for database column names, camelCase for TypeScript field names

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

### Agent Instructions Philosophy

The Lucie agent supports a flexible querying strategy:
- **Filtered queries**: For targeted questions with known field values (e.g., "CTOs", "Accepted applicants")
- **Broad queries**: For complex questions requiring cross-field analysis or date comparisons
- LLM handles intelligent filtering after data retrieval
- This approach balances efficiency (filtering at DB level when possible) with flexibility (LLM analysis for complex queries)

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
- **Path Aliases**: `@/db` resolves to `src/db/` for database imports

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
- `getCohortDataTool` supports optional filtering - use when appropriate for efficiency

### Project Structure Notes
- `data/2025-Cohort_Data/JSON/founders/` contains Airtable table reference JSONs with field IDs
- `airtable_data/` contains JSON exports of Airtable data for reference/backup
- `bff/ai-lab/` contains models and services for AI Lab (not yet integrated with agent)
- `lib/` contains shared utilities:
  - `airtable.ts` - Airtable client for API interactions
  - `airtable-field-ids-ref.ts` - Field ID mappings for Airtable ↔ Turso sync
  - `print-helpers.ts` - Logging utilities for development
  - `update-table-ref-ids.ts` - Scripts for syncing table reference data
- `src/db/` contains database infrastructure:
  - `index.ts` - Turso database client initialization
  - `schemas/founder.ts` - Founder table schema (first migrated table)
  - Additional schemas pending: sessions, startups
- `drizzle.config.ts` - Drizzle Kit configuration for migrations
- `migrations/` - Generated SQL migration files (not yet in repo, created by drizzle-kit)
- Agent instructions emphasize concise responses (2-4 sentences) with Slack-friendly formatting
- **Known inconsistency**: Agent instructions (`lucie-instructions.ts`) reference AI Lab tool that doesn't exist yet

### Database Migration Status
- **Completed**: Turso setup, Drizzle ORM integration, founders schema, field ID mappings
- **Pending**: Data migration from Airtable to Turso, sessions/startups schemas, tool updates to query Turso instead of Airtable
- **Strategy**: Dual-read approach possible - keep Airtable tool while building Turso tools, then gradually migrate
