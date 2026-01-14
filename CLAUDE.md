# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Lucie 2.0**, an AI agent built with the Mastra framework that serves as a Program Manager for the Pioneers accelerator program. The agent answers questions about the program by querying Airtable data and can be accessed through both Slack and a terminal CLI.

## Common Commands

```bash
# Development - Start Mastra dev server (includes hot reload)
pnpm dev

# Development - Run terminal CLI for local agent testing (preferred for rapid iteration)
pnpm dev:cli
# or with specific agent:
pnpm dev:cli --agent lucie

# Build - Compile and bundle for production
pnpm build

# Production - Start production server
pnpm start

# Database - Generate migration files from schema changes
pnpm drizzle-kit generate
# or shorthand:
pnpm dbg

# Database - Apply migrations to Turso database
pnpm drizzle-kit migrate
# or shorthand:
pnpm dbm

# Database - Push schema directly to database (dev only, skips migrations)
pnpm drizzle-kit push
# or shorthand:
pnpm dbp

# Database - Open Drizzle Studio for database inspection (GUI at http://localhost:4983)
pnpm drizzle-kit studio
# or shorthand:
pnpm dbs

# Database - Seed Turso database from JSON files (deletes existing data!)
pnpm db:seed

# Database - Setup database: push schema + seed data
pnpm db:setup
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
- **Tools**: Four data fetching tools:
  - `getCohortDataTool` - Legacy Airtable direct access (still available for fallback)
  - `queryFoundersTool` - Turso database query for founders (137 records across two tables)
  - `querySessionsTool` - Turso database query for sessions/events (100 records)
  - `queryStartupsTool` - Turso database query for startups (27 records)
- **Note**: Agent instructions reference an AI Lab tool that is not yet implemented

### Tool Architecture

The agent has **four data query tools** - three modern Turso database tools and one legacy Airtable tool:

**Primary Tools (Turso Database - Recommended)**:

1. **queryFoundersTool** (`src/mastra/tools/query-founders-tool.ts`):
   - Queries 137 unique founders from Turso database (no rate limits, much faster)
   - Combines data from two tables:
     - Profile Book (37 founders) - Detailed professional data
     - Grid View (100 founders) - Essential contact info
   - **Search types**: `all`, `by-name`, `by-skills`, `by-batch`, `count`
   - Each result includes `source` field indicating origin (profile_book or grid_view)
   - Uses helper functions from `src/db/helpers/query-all-founders.ts`

2. **querySessionsTool** (`src/mastra/tools/query-sessions-tool.ts`):
   - Queries 100 session/event records from Turso database
   - **Search types**: `all`, `by-name`, `by-speaker`, `by-type`, `by-week`, `upcoming`, `past`, `next`, `count`, `global-search`
   - Supports temporal queries (upcoming, past, next session)
   - Uses helper functions from `src/db/helpers/query-sessions.ts`

3. **queryStartupsTool** (`src/mastra/tools/query-startups-tool.ts`):
   - Queries 27 startup records from Turso database
   - **Search types**: `all`, `by-name`, `by-industry`, `by-team-member`, `by-description`, `count`, `global-search`
   - Includes team info, traction, and progress data
   - Uses helper functions from `src/db/helpers/query-startups.ts`

**Legacy Tool (Airtable - Fallback Only)**:

4. **getCohortDataTool** (`src/mastra/tools/cohort-data-tool.ts`):
   - Direct Airtable access (retained for fallback or data not yet in Turso)
   - Uses `SU_2025_BASE_ID` and `SU_2025_TABLE_ID` environment variables
   - **Filtering options**:
     - `filterFormula`: Airtable formula (e.g., `"{Role} = 'CTO'"`)
     - `searchField` + `searchText`: Text search in specific field
     - `fieldName` + `fieldValue`: Exact match on a field
   - Returns array of records with `id` and `fields` properties

**Tool Selection Strategy**:
- **Prefer Turso tools** (`queryFoundersTool`, `querySessionsTool`, `queryStartupsTool`) for all queries
- Turso tools are faster (no rate limits), more reliable, and provide better search capabilities
- Use `getCohortDataTool` only as fallback or for data not yet migrated to Turso
- Turso tools include specialized search types (e.g., "upcoming sessions", "by-skills") vs generic Airtable filtering

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

2. **Turso Database (Production Ready)**:
   - **Purpose**: Structured, queryable storage layer for Airtable data
   - **Current Status**: ✅ Fully seeded and operational
   - **Tables**:
     - `founders` - Founder profiles from Profile Book view (37 records) - comprehensive data
     - `founders_grid_data` - Founder profiles from Grid view (100 records) - essential contact info
     - `session_events` - Session and event information (100 records) with dates, speakers, and participants
     - `startups` - Startup profiles (27 records) with team information, industry, and traction data
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
- **Animation System**: Braille pattern spinners (⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏) updated every 300ms
- **Chunk Types**: Handles `text-delta`, `tool-call`, `tool-output`, nested workflow events
- **Nested Event Handling**: Workflow events wrapped in `tool-output` chunks are unwrapped via `handleNestedChunkEvents()`
- **State Tracking**: Maintains `text`, `chunkType`, `toolName`, `workflowName`, `stepName`, `agentName`
- **Error Recovery**:
  - Try-catch wraps entire streaming operation
  - Errors posted to Slack with ❌ prefix
  - Retry logic: 3 attempts with exponential backoff for final message delivery
  - Rate limit errors during animation gracefully ignored (prevents user interruption)
- **Security** (`src/mastra/slack/verify.ts`):
  - HMAC SHA256 signature verification (timing-safe comparison)
  - Replay attack prevention (rejects requests >5 minutes old)
  - Validates signature format before comparison

### Terminal CLI

**CLI** (`src/mastra/terminal/cli.ts`):
- Interactive terminal interface for testing agents locally
- Avoids Slack rate limits during development
- **Agent Selection**:
  - Via `--agent` flag: `--agent lucie` or `--agent=lucie`
  - Interactive menu fallback if invalid/missing
- **Context Management**:
  - `resourceId`: `terminal-{pid}-{timestamp}` (session identifier)
  - `threadId`: Dynamic per conversation (enables memory persistence)
- Multi-turn conversations with memory (last 20 messages)
- Type `exit` or `quit` to end session

**Streaming** (`src/mastra/terminal/streaming.ts`):
- Real-time text streaming to stdout (character by character, different from Slack's message updates)
- **Progress Indicators**:
  - 🔧 Tool calls
  - ⚙️ Workflow steps
  - 🔄 Workflow execution
- Uses shared `handleNestedChunkEvents()` utility for nested event processing
- Immediate console output (no retry logic needed)

### Data Flow

1. User sends message via Slack or terminal CLI
2. Route handler/CLI parses message and initiates agent streaming
3. Agent retrieves conversation context from Memory (last 20 messages)
4. Agent processes message using instructions, memory, and available tools
5. Agent selects appropriate tool and calls it:
   - **Turso tools** (preferred): Fast database queries with specialized search types
     - `queryFoundersTool` - For founder-related queries (by name, skills, batch)
     - `querySessionsTool` - For session/event queries (by name, speaker, upcoming/past)
     - `queryStartupsTool` - For startup queries (by name, industry, team member)
   - **Airtable tool** (fallback): Direct Airtable access with formula filtering
     - `getCohortDataTool` - For data not yet in Turso or complex custom queries
6. Agent generates response based on retrieved data
7. Response streams back to Slack (with animation) or terminal (real-time text)
8. Conversation context saved to Memory for future turns

### Storage and Observability

- **Mastra Storage**: LibSQL in-memory storage (`:memory:`) for observability, scores, and agent metadata. Can be changed to `file:../mastra.db` for persistence.
- **Application Database**: Turso (hosted LibSQL) via Drizzle ORM for structured application data (founders, sessions, startups)
  - Three Turso query tools actively used by the agent
  - Database helpers in `src/db/helpers/` provide specialized query functions
- **Logger**: Pino logger at `info` level with default exporter
- **Print Helpers** (`lib/print-helpers.ts`): Color-coded logging utilities:
  - `message()` - Green output with ✓ for success messages
  - `log()` - Yellow output with ⚠️ for warnings/info
  - `error()` - Red output with ✗ for errors
- **Observability**: Mastra Cloud integration enabled via `MASTRA_CLOUD_ACCESS_TOKEN`
- **Mastra Version**: Beta (1.0.0-beta.19) - production stability not guaranteed

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

### Using Turso Query Tools

The agent has three specialized Turso database query tools that are **much faster** than Airtable queries with **no rate limits**:

**1. Query Founders** (`queryFoundersTool`):
```typescript
// Example: Get all founders
{ searchType: 'all' }

// Example: Search by name
{ searchType: 'by-name', searchTerm: 'John' }

// Example: Search by skills
{ searchType: 'by-skills', searchTerm: 'Python' }

// Example: Filter by batch
{ searchType: 'by-batch', searchTerm: 'F24' }

// Example: Get count only
{ searchType: 'count' }
```

**2. Query Sessions** (`querySessionsTool`):
```typescript
// Example: Get upcoming sessions
{ searchType: 'upcoming' }

// Example: Get next session
{ searchType: 'next' }

// Example: Search by speaker
{ searchType: 'by-speaker', searchTerm: 'Jane' }

// Example: Filter by week
{ searchType: 'by-week', searchTerm: 'Week 3' }

// Example: Global search across all fields
{ searchType: 'global-search', searchTerm: 'workshop' }
```

**3. Query Startups** (`queryStartupsTool`):
```typescript
// Example: Get all startups
{ searchType: 'all' }

// Example: Search by industry
{ searchType: 'by-industry', searchTerm: 'FinTech' }

// Example: Find startups by team member
{ searchType: 'by-team-member', searchTerm: 'Alice' }

// Example: Global search
{ searchType: 'global-search', searchTerm: 'AI' }
```

**Database Helpers**:
Each tool uses helper functions from `src/db/helpers/`:
- `query-all-founders.ts` - Founder queries with SQL, merges Profile Book + Grid View data
- `query-sessions.ts` - Session queries with date handling and temporal filters
- `query-startups.ts` - Startup queries with team member and industry searches

**When to Add Database Helpers**:
- Add helper functions in `src/db/helpers/` for complex queries
- Use Drizzle ORM operators (`like`, `eq`, `and`, `or`, `gte`, `lte`) for filtering
- Helper pattern: export individual functions, import in tool's `execute` function
- Keep helpers focused on database logic, not business logic

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
import { db } from '../db/index.js';
import { sessions } from '../db/schemas/session-events.js';

const allSessions = await db.select().from(sessions);
```

**Schema Design Notes**:
- Use Airtable record IDs as primary keys (text type) for easier sync
- All fields nullable by default to match Airtable's optional field structure
- Include Airtable field IDs in comments for traceability (format: `// Airtable ID: fld...`)
- Add `createdAt`/`updatedAt` timestamps (not from Airtable, managed by database)
- Use snake_case for database column names (e.g., `your_photo`), match Airtable camelCase in field ID mappings
- Export type inference: `export type TableName = typeof tableName.$inferSelect;`
- Export insert type: `export type NewTableName = typeof tableName.$inferInsert;`

**Airtable ↔ Turso Sync Strategy**:

The field ID mapping system enables bidirectional synchronization:

1. **Airtable Field IDs** (`lib/airtable-field-ids-ref.ts`):
   - Maps schema field names to Airtable field IDs (format: `fldXXXXXXXXXXXXX`)
   - Three mappings defined: `founderAirtableFieldIds`, `sessionEventAirtableFieldIds`, `startupAirtableFieldIds`
   - Uses `as const` for type safety
   - Source: `data/2025-Cohort_Data/JSON/founders/*-table-ref.json`

2. **Field ID Update Utilities** (`lib/update-table-ref-ids.ts`):
   - `updateBaseTableRefs()` - Sync single base table references
   - `updateAllBases()` - Sync all bases at once
   - `findJsonFile()`, `findCsvFile()` - Locate reference files
   - Works with CSV exports and normalized table names
   - **Usage**: Run when Airtable schema changes to update mappings

3. **Data Synchronization Workflow**:
   ```typescript
   // Example: Syncing founders from Airtable to Turso
   import { db } from '../db/index.js';
   import { founders } from '../db/schemas/founders.js';
   import { founderAirtableFieldIds } from '../lib/airtable-field-ids-ref.js';
   import Airtable from 'airtable';

   // Fetch from Airtable
   const records = await base(tableId).select().all();

   // Transform using field ID mappings
   const founderData = records.map(record => ({
     id: record.id,
     name: record.fields[founderAirtableFieldIds.name],
     email: record.fields[founderAirtableFieldIds.email],
     // ... map all fields using field IDs
   }));

   // Insert into Turso
   await db.insert(founders).values(founderData);
   ```

4. **Migration Status & Strategy**:
   - **Current**: Direct Airtable queries via `getCohortDataTool`
   - **In Progress**: Turso schemas defined, infrastructure ready
   - **Pending**: Data migration scripts, tool updates
   - **Recommended**: Dual-read approach - keep Airtable tool while building Turso tools, gradually migrate queries

## Key Implementation Details

### Mastra Framework

This project uses Mastra (v1.0.0-beta.19), an AI agent framework. Key concepts:

- **Agents**: Autonomous entities with instructions, tools, memory, and model configuration
- **Tools**: Functions agents can call (defined with Zod schemas for inputs/outputs)
- **Workflows**: Multi-step processes (infrastructure exists in `src/mastra/workflows/` but not actively used)
- **Scorers**: Evaluation functions for agent performance (template exists in `src/mastra/scorers/lucie-scorer.ts` but needs Lucie-specific implementation)
- **Memory**: Conversation history management (configured per agent, stores last 20 messages)
  - Uses `resourceId` to identify user/session
  - Uses `threadId` to identify conversation thread
  - Format examples: `slack-{teamId}-{userId}`, `terminal-{pid}-{timestamp}`
- **Streaming**: Real-time response generation with chunk types:
  - `text-delta` - Incremental text chunks
  - `tool-call` - Tool invocation start
  - `tool-output` - Tool execution result (may contain nested events)
  - `workflow-*` - Workflow execution events (can be nested in tool-output)
  - `agent-execution-event-${string}` - Nested agent events
- **Storage**: LibSQL for persisting observability data and scores
- **Beta Status**: v1.0.0-beta.19 means production stability not guaranteed, API may change

### Agent Instructions Philosophy

The Lucie agent uses a **Turso-first querying strategy**:
- **Primary approach**: Use Turso query tools (`queryFoundersTool`, `querySessionsTool`, `queryStartupsTool`)
  - Much faster (no API rate limits)
  - Specialized search types (by-name, by-skills, upcoming, past, etc.)
  - Structured data with consistent schemas
- **Fallback approach**: Use Airtable tool (`getCohortDataTool`) only when:
  - Data not available in Turso
  - Custom complex queries not supported by Turso tools
- **Tool selection**: Agent intelligently picks the right tool based on query type
  - "Who are the CTOs?" → `queryFoundersTool` with `by-skills` search
  - "What's the next session?" → `querySessionsTool` with `next` search
  - "Show me FinTech startups" → `queryStartupsTool` with `by-industry` search
- LLM handles post-query analysis and formatting of results

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
- **Includes**: `src/**/*`, `lib`, `bff/ai-lab`
- **Note**: No path aliases configured - use relative imports

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
- **Prefer Turso query tools** over Airtable tool - faster, no rate limits, better search capabilities
- Database helpers provide specialized query functions (by name, by skills, upcoming sessions, etc.)

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
  - `schemas/founders.ts` - Founder table schema from Profile Book view (detailed)
  - `schemas/founders-grid-data.ts` - Founder table schema from Grid view (contact info)
  - `schemas/session-events.ts` - Session events schema with dates and participants
  - `schemas/startups.ts` - Startup information schema with traction and team data
  - `schemas/index.ts` - Central schema exports
  - `helpers/query-all-founders.ts` - Founder query helper functions
  - `helpers/query-sessions.ts` - Session query helper functions
  - `helpers/query-startups.ts` - Startup query helper functions
- `drizzle.config.ts` - Drizzle Kit configuration for migrations
- `migrations/` - Generated SQL migration files (gitignored, auto-generated by drizzle-kit)
- Agent instructions emphasize concise responses (2-4 sentences) with Slack-friendly formatting
- **Known inconsistency**: Agent instructions (`lucie-instructions.ts`) reference AI Lab tool that doesn't exist yet

### Database Migration Status
- **✅ COMPLETED**:
  - Turso setup and configuration (`drizzle.config.ts`)
  - Drizzle ORM integration (`src/db/index.ts`)
  - **Four schemas fully defined and seeded**:
    - `founders.ts` - 37 records from Profile Book view
    - `founders-grid-data.ts` - 100 records from Grid view
    - `session-events.ts` - 100 records
    - `startups.ts` - 27 records
  - Field ID mappings for all tables (`lib/airtable-field-ids-ref.ts`)
  - Migration infrastructure (migrations auto-generated in `migrations/` directory, gitignored)
  - **Seed script** (`src/db/seed.ts`) - ✅ PRODUCTION READY, handles misaligned Airtable exports
  - JSON seed data prepared in `data/2025-Cohort_Data/JSON/` for all tables
  - **Database successfully seeded with all data** - verified working
- **✅ MIGRATION COMPLETED**:
  - **Three Turso query tools implemented and active**:
    - `queryFoundersTool` - 137 founders (Profile Book + Grid View)
    - `querySessionsTool` - 100 sessions/events
    - `queryStartupsTool` - 27 startups
  - Database helper functions in `src/db/helpers/` for specialized queries
  - Agent now uses Turso tools as primary data source
  - `getCohortDataTool` retained as fallback for edge cases
- **⏳ PENDING**:
  - Sync mechanism for keeping Turso data fresh from Airtable (manual updates for now)
  - Consider removing `getCohortDataTool` if no longer needed
- **Important**: Run `pnpm db:setup` to push schema and seed data (use `pnpm db:seed` to re-seed without schema changes)

### Testing & Quality Infrastructure

**Current State**: No testing framework configured
- `package.json` test script: `"test": "echo \"Error: no test specified\" && exit 1"`
- No linting configuration (ESLint, Prettier)
- No pre-commit hooks (Husky, lint-staged)
- No CI/CD pipeline

**Recommended for Production**:
- Add Vitest for unit/integration testing
- Test patterns needed for:
  - Agent instruction effectiveness
  - Tool execution with mocked Airtable/Turso responses
  - Slack streaming and error recovery
  - Field ID mapping accuracy
- Add ESLint + Prettier for code consistency
- Configure pre-commit hooks for quality gates

### Development Workflows & Best Practices

**Local Development with Slack**:
1. Use terminal CLI (`pnpm dev:cli`) for rapid iteration - avoids Slack rate limits
2. For Slack integration testing, use ngrok or similar to expose local server:
   ```bash
   pnpm dev  # Start on port 4111 (or configured port)
   ngrok http 4111  # Expose to public URL
   # Update Slack app webhook URL to ngrok URL
   ```
3. Monitor Slack webhook logs in terminal for debugging

**Environment Management**:
- `.env` file contains all credentials (gitignored via `.env*` pattern - safe from accidental commits)
- No `.env.example` file - all required variables documented in CLAUDE.md Environment Variables section
- Switch models by changing `MODEL` env variable (supports `anthropic/*` and `openai/*` prefixes)

**Debugging Strategies**:
- **Agent Instructions**: Test in terminal CLI, inspect tool calls and responses
- **Streaming Issues**: Check console logs for chunk types, state transitions
- **Airtable Queries**: Use `log()` from `lib/print-helpers` to inspect filter formulas
- **Database Issues**: Use Drizzle Studio (`pnpm dbs`) to inspect data
- **Slack Issues**: Check Slack API logs, verify signature in `src/mastra/slack/verify.ts`

**Handling Airtable Schema Changes**:
1. Export updated table references from Airtable
2. Run `updateAllBases()` from `lib/update-table-ref-ids.ts` to sync field IDs
3. Update Drizzle schemas in `src/db/schemas/` if fields added/removed
4. Generate and apply migrations: `pnpm dbg && pnpm dbm`
5. Update agent instructions if field names changed

**Data Organization**:
- `data/2025-Cohort_Data/CSV/` - CSV exports from Airtable (reference/backup)
- `data/2025-Cohort_Data/JSON/` - JSON reference files with field IDs (source of truth for mappings)
- `data/airtable_data/` - Multiple backup/reference JSON exports organized by table type
- Scripts: `data/convert-to-json-by-id.ts`, `data/fix-and-format.ts` for transformations

### Incomplete Components & Future Work

**AI Lab Integration** (Infrastructure defined, not implemented):
- Environment variables configured: `AI_LAB_BASE_ID`, `AI_LAB_TABLE_ID`
- Models and services exist: `bff/ai-lab/models/ai-lab-model.ts`, `bff/ai-lab/services/ai-lab-service.ts`
- Field ID mappings defined in `lib/airtable-field-ids-ref.ts`
- Tool not implemented - agent instructions reference it but it doesn't exist
- **Blocker**: Unclear requirements or prioritization

**Scorers** (Template exists, needs implementation):
- `src/mastra/scorers/lucie-scorer.ts` - Copied from weather example
- Comment: "it needs to be updated to her needs"
- **Usage**: Define evaluation criteria for agent responses (accuracy, helpfulness, tone)
- **Implementation needed**: Define scoring functions specific to Lucie's domain

**Workflows** (Infrastructure unused):
- `src/mastra/workflows/weather-workflow.ts` - Example workflow
- Not integrated with Lucie agent
- **Potential use cases**: Multi-step data processing, complex query orchestration

### Security Considerations

**Slack Integration**:
- HMAC SHA256 signature verification prevents unauthorized requests
- Timing-safe comparison prevents timing attacks
- 5-minute timestamp window prevents replay attacks
- Signature format validation before comparison

**Credential Management**:
- All secrets in `.env` file (gitignored, no `.env.example` - variables documented in CLAUDE.md)
- No secret rotation strategy documented
- Turso auth tokens have database-level access
- Airtable API keys have base-level access
- **Recommendation**: Use secret management service (AWS Secrets Manager, HashiCorp Vault) for production

**Rate Limiting**:
- No rate limiting implemented on Slack webhooks
- Slack streaming animation errors gracefully ignored to prevent rate limit issues
- **Recommendation**: Add rate limiting middleware for production

### Performance Considerations

**Streaming**:
- Animation updates every 300ms (balance between smoothness and rate limits)
- Character-by-character terminal output may be slow for long responses
- Slack message updates have API rate limits (~1 request/second per channel)

**Airtable Queries**:
- No caching layer - every query hits Airtable API
- Filter formulas can be complex - test performance with large datasets
- **Recommendation**: Implement caching or move to Turso for performance

**Memory**:
- Stores last 20 messages per conversation
- In-memory storage for Mastra (ephemeral on restart)
- **Recommendation**: Use persistent storage for production (`file:../mastra.db`)

**Turso Query Performance**:
- Turso tools are significantly faster than Airtable direct queries
- No rate limits (local database connection vs API calls)
- Specialized search functions optimized for common query patterns
- **Recommendation**: Always prefer Turso tools over `getCohortDataTool` unless data not available
