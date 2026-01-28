# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start for New Claude Code Instances

**Lucie 2.0** is an AI agent (Mastra framework) that serves as a Program Manager for the Pioneers accelerator. It queries a Turso database (synced from Airtable) via Slack and terminal CLI.

**Most common tasks:**
```bash
pnpm dev:cli        # Test agent locally (preferred - no Slack rate limits)
pnpm dev            # Start Mastra dev server for Slack integration
pnpm db:sync        # Sync new data from Airtable to Turso
pnpm db:seed:faq    # Seed FAQ data (general, founders, sessions, startups)
pnpm dbs            # Open Drizzle Studio (GUI at localhost:4983)
```

**Key architectural facts:**
- Agent uses **3 specialized Turso query tools** (NOT Airtable directly): `queryFoundersTool`, `querySessionsTool`, `queryStartupsTool`
- **4th table: FAQ system** - Seeded from JSON files (197 FAQs total), but queryFaqTool is currently disabled (see Intentionally Disabled Features section)
- All imports MUST use `.js` extensions (ESM requirement): `from './file.js'` not `from './file.ts'`
- **Production status: 70% ready** - see TODO.md for known issues
- No testing infrastructure yet (TODO.md #4)
- Mastra storage is in-memory/ephemeral (TODO.md #5)

**Before making changes:**
1. ✅ Read TODO.md for known issues related to your work
2. ✅ Check agent instructions for outdated tool references (TODO.md #3)
3. ✅ Verify field ID mappings if touching database sync

## Common Commands

```bash
# Development
pnpm dev:cli                    # Terminal CLI (preferred for rapid iteration)
pnpm dev:cli --agent lucie      # Specify agent
pnpm dev                        # Mastra dev server (Slack webhooks)

# Build & Production
pnpm build                      # Compile and bundle
pnpm start                      # Start production server

# Database - Schema Management
pnpm dbg                        # Generate migration files
pnpm dbm                        # Apply migrations to Turso
pnpm dbp                        # Push schema directly (dev only, skips migrations)
pnpm dbs                        # Open Drizzle Studio GUI (localhost:4983)

# Database - Data Management
pnpm db:setup                   # Initial setup: push schema + seed data
pnpm db:seed                    # Seed from JSON files (DELETES existing data!)
pnpm db:sync                    # Sync new data from Airtable (incremental, safe)
pnpm db:sync --table=founders   # Sync specific table only
pnpm db:sync --batch=S25        # Sync specific batch only

# Database - FAQ Seeding
pnpm db:seed:faq                # Seed all FAQ categories
pnpm db:seed:faq:general        # Seed specific category
```

## Critical Files Reference

**When modifying agent behavior:**
- Agent config: `src/mastra/agents/lucie-agents.ts`
- Agent instructions: `src/mastra/agents/lucie-instructions.ts`
- Query tools: `src/mastra/tools/query-*-tool.ts`

**When working with database:**
- Schemas: `src/db/schemas/*.ts` (founders, session-events, startups, faq)
- Query helpers: `src/db/helpers/query-*.ts` (query-all-founders, query-sessions, query-startups, query-faq)
- Field ID mappings: `lib/airtable-field-ids-ref.ts`
- Sync script: `src/db/sync-from-airtable.ts`
- Seed script: `src/db/seed.ts`
- FAQ seed script: `src/db/seed-faq-only.ts`

**When debugging:**
- Print helpers: `lib/print-helpers.ts` - use `log()`, `message()`, `error()`
- Slack streaming: `src/mastra/slack/streaming.ts`
- CLI streaming: `src/mastra/terminal/streaming.ts`
- Slack verification: `src/mastra/slack/verify.ts` (HMAC signature)

**Configuration:**
- Mastra instance: `src/mastra/index.ts`
- Drizzle config: `drizzle.config.ts`
- TypeScript: `tsconfig.json`
- Known issues: `TODO.md` (check before making changes!)

## Environment Variables

Required variables (see `.env`):

**AI Models:**
- `MODEL` - Model identifier (default: `anthropic/claude-3-haiku-20240307`)
- `ANTHROPIC_API_KEY` - Required if using Anthropic models
- `OPENAI_API_KEY` - Required if using OpenAI models

**Database (Turso + Drizzle ORM):**
- `TURSO_CONNECTION_URL` - Turso database URL (libsql://...)
- `TURSO_AUTH_TOKEN` - Turso authentication token

**Airtable (for data sync):**
- `AIRTABLE_API_KEY` - API key for Airtable access
- `SU_2025_BASE_ID` - Airtable base ID for cohort data
- `SU_2025_FOUNDERS_PROFILE_BOOK_TABLE_ID` - Founders table ID
- `SU_2025_STARTUPS_TABLE_ID` - Startups table ID
- `SU_2025_SESSIONS_EVENTS_TABLE_ID` - Sessions/events table ID

**Slack (for Slack integration):**
- `SLACK_BOT_TOKEN` - Slack bot token (xoxb-...)
- `SLACK_SIGNING_SECRET` - Signing secret for request verification

**Observability (optional):**
- `MASTRA_CLOUD_ACCESS_TOKEN` - Mastra Cloud observability token

**Note**: No `.env.example` exists yet (TODO.md #10). All variables documented in README.md.

## Common Pitfalls & Gotchas

### Import Paths (ESM Requirement)
- ✅ `from './file.js'` or `from '../db/index.js'`
- ❌ `from './file.ts'` or `from './file'` or `from '../db/index'`
- **Why**: ESM requires explicit `.js` extensions even for `.ts` source files

### Agent Instructions Inconsistencies
- ⚠️ Agent instructions reference `getCohortDataTool` - this tool is **NOT in the active tool list**
- ⚠️ Agent instructions mention AI Lab tool - this tool **doesn't exist** yet (TODO.md #3)
- ✅ Only trust tools in `lucie-agents.ts` tools object: `queryFoundersTool`, `querySessionsTool`, `queryStartupsTool`

### Database Queries
- ⚠️ Batch filtering (`by-batch`) is **disabled** in `queryFoundersTool` (TODO.md #2) - don't re-enable without fixing schema
- ⚠️ Data sync has had corruption bugs - verify field mappings in `sync-from-airtable.ts` before modifying
- ✅ Use `pnpm dbs` to visually inspect database and verify data integrity

### Storage & Persistence
- ⚠️ Mastra storage is **in-memory** (ephemeral, lost on restart) - see TODO.md #5
- ✅ Turso database is persistent
- For production: change `src/mastra/index.ts` storage URL from `:memory:` to `file:../mastra.db`

### Development Workflow
- ✅ Use `pnpm dev:cli` for rapid iteration (avoids Slack rate limits)
- ❌ Don't use `pnpm dev` for quick testing (requires Slack webhook setup)
- ✅ Check TODO.md before making changes to avoid duplicating known issues

## Before Starting Work

**Every time:**
1. ✅ Read TODO.md for known issues related to your work
2. ✅ Use `pnpm dev:cli` for faster iteration (no Slack rate limits)
3. ✅ Follow existing code patterns (check similar files)

**For new features:**
1. ✅ Check if agent instructions need updating
2. ✅ Test in both CLI and Slack (if applicable)
3. ✅ Update field ID mappings if touching Airtable sync
4. ✅ Update TODO.md if implementing tracked tasks

**For bug fixes:**
1. ✅ Verify bug isn't already tracked in TODO.md
2. ✅ Mark TODO.md tasks as completed when fixed
3. ✅ Test fix in terminal CLI before Slack

## Architecture Overview

### Core Components

**Mastra Framework Structure:**
- `src/mastra/index.ts` - Main Mastra instance (agents, storage, logger, routes)
- `src/mastra/agents/` - Agent definitions (instructions, tools, memory, model)
- `src/mastra/tools/` - Tool definitions (functions agents can call)
- `src/mastra/slack/` - Slack integration (routes, streaming, verification)
- `src/mastra/terminal/` - Terminal CLI (interface, streaming)
- `src/mastra/workflows/` - Multi-step workflows (**not actively used**)
- `src/mastra/scorers/` - Performance evaluation (**template only, not implemented**)

**Database Layer:**
- `src/db/index.ts` - Turso database client initialization
- `src/db/schemas/` - Drizzle ORM schemas (founders, session_events, startups, faq)
- `src/db/helpers/` - Query helper functions and seeding scripts
- `lib/airtable-field-ids-ref.ts` - Field ID mappings (Airtable ↔ Turso sync)

**Utility Layer:**
- `bff/ai-lab/` - AI Lab infrastructure (models, services) - **NOT YET IMPLEMENTED** (TODO.md #16)
- `lib/print-helpers.ts` - Logging utilities (use `log()`, `message()`, `error()`)
- `lib/airtable.ts` - Airtable client utilities

### Agent Configuration

**Lucie Agent** (`src/mastra/agents/lucie-agents.ts`):
- Model: Configurable via `MODEL` env variable (supports `anthropic/*` and `openai/*` prefixes)
- Memory: Retains last 20 messages per conversation
- Tools: Three specialized Turso query tools (founders, sessions, startups)
- Instructions: Emphasize concise responses (2-4 sentences), Slack-friendly formatting, date-aware queries

**Three Specialized Tools:**
1. **queryFoundersTool** - Search types: `all`, `by-name`, `by-skills`, `count`
2. **querySessionsTool** - Search types: `all`, `by-name`, `by-speaker`, `by-type`, `by-week`, `upcoming`, `past`, `next`, `count`, `global-search`
3. **queryStartupsTool** - Search types: `all`, `by-name`, `by-industry`, `by-team-member`, `by-description`, `count`, `global-search`

**Note**: Agent instructions incorrectly reference `getCohortDataTool` and AI Lab tool - these are NOT in the active tool list.

### Data Flow

1. User message → Slack webhook or CLI
2. Agent retrieves conversation context (last 20 messages from Memory)
3. Agent selects appropriate Turso query tool based on query type
4. Tool queries Turso database (no Airtable queries - all data synced to Turso)
5. Agent generates response, streams back with visual feedback
6. Conversation context saved to Memory

**Data Source**: Turso database (primary) ← synced from Airtable (source of truth) via `pnpm db:sync`

### Message Context & Memory

Both Slack and CLI use:
- `resourceId`: User/session identifier (e.g., `slack-{teamId}-{userId}`, `terminal-{pid}-{timestamp}`)
- `threadId`: Conversation thread identifier (e.g., `slack-{channelId}-{threadTs}`, `terminal-{timestamp}`)

These enable Mastra Memory to maintain conversation context across turns.

## Development Workflows

### Adding a New Tool

1. Create tool in `src/mastra/tools/` using `createTool` from `@mastra/core/tools`
2. Define input schema with Zod
3. Define output schema with Zod
4. Implement `execute` function
5. Export and add to agent's `tools` object in `src/mastra/agents/lucie-agents.ts`
6. Update agent instructions in `lucie-instructions.ts` with tool selection rules

**Example:**
```typescript
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const myTool = createTool({
  id: 'my-tool',
  description: 'What the tool does',
  inputSchema: z.object({
    searchType: z.enum(['all', 'by-name']),
    searchTerm: z.string().optional(),
  }),
  outputSchema: z.object({
    data: z.array(z.any()),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    // Implementation
    return { data: [], message: 'Result' };
  },
});
```

### Working with Database Schemas

**Adding a New Table:**

1. Create schema file in `src/db/schemas/`:
```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const myTable = sqliteTable('my_table', {
  id: text('id').primaryKey().notNull(),
  name: text('name'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type MyTable = typeof myTable.$inferSelect;
export type NewMyTable = typeof myTable.$inferInsert;
```

2. If syncing from Airtable, add field ID mappings to `lib/airtable-field-ids-ref.ts`:
```typescript
export const myTableAirtableFieldIds = {
  name: 'fldXXXXXXXXXXXXX',
  // ... more mappings
} as const;
```

3. Generate and apply migration:
```bash
pnpm dbg    # Generate migration
pnpm dbm    # Apply to Turso
```

**Schema Design Notes:**
- Use Airtable record IDs as primary keys (text type) for easier sync
- All fields nullable by default (matches Airtable's optional fields)
- Use snake_case for database columns (e.g., `created_at`)
- Include Airtable field IDs in comments: `// Airtable ID: fldXXXXXXXXXXXXX`
- Export type inference: `export type TableName = typeof tableName.$inferSelect;`

### Handling Airtable Schema Changes

1. Export updated table references from Airtable
2. Run `updateAllBases()` from `lib/update-table-ref-ids.ts` to sync field IDs
3. Update Drizzle schemas in `src/db/schemas/` if fields added/removed
4. Generate and apply migrations: `pnpm dbg && pnpm dbm`
5. Update agent instructions if field names changed
6. Run `pnpm db:sync` to sync updated data

### Adding Database Query Helpers

Create helper functions in `src/db/helpers/` for complex queries:

```typescript
import { db } from '../index.js';
import { myTable } from '../schemas/index.js';
import { like, eq, and, or } from 'drizzle-orm';

export async function getAllRecords() {
  return await db.select().from(myTable);
}

export async function searchByName(name: string) {
  return await db.select()
    .from(myTable)
    .where(like(myTable.name, `%${name}%`));
}
```

**Pattern**: Export individual functions, import in tool's `execute` function. Keep helpers focused on database logic.

## Production Status: 70% Ready

### Safe for Production
- ✅ Core query tools (founders, sessions, startups)
- ✅ Slack integration with HMAC security
- ✅ Database layer (Turso + Drizzle)
- ✅ Data sync mechanism from Airtable
- ✅ Streaming responses with error recovery

### NOT Production Ready
- ❌ No testing infrastructure (0% coverage) - TODO.md #4
- ❌ In-memory Mastra storage (data lost on restart) - TODO.md #5
- ❌ No rate limiting on Slack webhooks - TODO.md #7
- ❌ No code quality tools (ESLint, Prettier) - TODO.md #8
- ❌ No CI/CD pipeline - TODO.md #13
- ❌ Agent instructions reference non-existent tools - TODO.md #3

**See TODO.md for complete production readiness checklist and improvement roadmap.**

## Key Technical Details

### TypeScript & ESM Configuration

- **Target**: ES2022
- **Module**: ES2022 with bundler resolution
- **Type**: ESM (`package.json` has `"type": "module"`)
- **Strict mode**: Enabled
- **Import requirement**: Always use `.js` extensions (e.g., `from './file.js'`)
- **No path aliases**: Use relative imports

### Mastra Framework (v1.0.0-beta.19)

**Key Concepts:**
- **Agents**: Autonomous entities with instructions, tools, memory, model config
- **Tools**: Functions agents can call (Zod schemas for inputs/outputs)
- **Memory**: Conversation history (last 20 messages, uses resourceId/threadId)
- **Streaming**: Real-time response generation (chunk types: text-delta, tool-call, tool-output)
- **Storage**: LibSQL for observability data (currently in-memory `:memory:`)
- **Beta status**: Production stability not guaranteed, API may change

**Streaming Chunk Types:**
- `text-delta` - Incremental text chunks
- `tool-call` - Tool invocation start
- `tool-output` - Tool execution result (may contain nested events)
- `workflow-*` - Workflow execution events (not used)
- `agent-execution-event-${string}` - Nested agent events

### Slack Integration

**Security** (`src/mastra/slack/verify.ts`):
- HMAC SHA256 signature verification (timing-safe comparison)
- Replay attack prevention (rejects requests >5 minutes old)
- Signature format validation

**Streaming** (`src/mastra/slack/streaming.ts`):
- Animated spinner (Braille patterns ⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏) updated every 300ms
- Error recovery with 3 retry attempts (exponential backoff)
- Rate limit errors during animation gracefully ignored

**Route Registration** (`src/mastra/slack/routes.ts`):
- Factory function creates routes for multiple Slack apps
- Webhook endpoint: `/slack/{name}/events`
- Handles URL verification and event callbacks
- Asynchronous processing (meets Slack's 3-second timeout)

### Database Architecture

**Turso (Primary Data Source):**
- Fast queries (<100ms typical)
- No rate limits (database connection, not API)
- Type-safe with Drizzle ORM
- **Four tables:**
  - `founders` - Founder profiles (synced from Airtable)
  - `session_events` - Sessions/events data (synced from Airtable)
  - `startups` - Startup profiles (synced from Airtable)
  - `faq` - FAQ entries (seeded from JSON files in `data/2025-Cohort_Data/JSON/faq/`)

**Airtable (Source of Truth):**
- Used only for periodic data sync via `pnpm db:sync`
- NOT queried directly by agent
- Sync uses upsert (insert new, update existing, never deletes)

**Field ID Mappings** (`lib/airtable-field-ids-ref.ts`):
- Maps Drizzle schema fields to Airtable field IDs
- Three mappings: `founderAirtableFieldIds`, `sessionEventAirtableFieldIds`, `startupAirtableFieldIds`
- Enables bidirectional sync

## Common Debugging Patterns

### Debug Database Queries
```typescript
import { log } from '../../../lib/print-helpers.js';

// Log query parameters
log(`Query params: ${JSON.stringify(params)}`);

// Execute query
const result = await db.select().from(table).where(...);

// Log results
log(`Query returned ${result.length} rows`);
```

### Debug Tool Execution
```bash
# Run in terminal CLI and watch for tool call indicators
pnpm dev:cli

# Look for:
# 🔧 Tool calls
# ⚙️ Workflow steps (if used)
```

### Debug Slack Issues
```bash
# Start dev server and check terminal logs
pnpm dev

# Verify signature in src/mastra/slack/verify.ts
# Check for rate limit errors (gracefully ignored during animation)
```

### Inspect Database
```bash
# Open Drizzle Studio GUI
pnpm dbs

# Navigate to http://localhost:4983
# View tables, run queries, inspect data
```

## Quick Reference

### Most Used Commands
```bash
pnpm dev:cli        # Test agent locally (recommended)
pnpm db:sync        # Sync new data from Airtable
pnpm dbs            # Visual database browser
pnpm dbg && pnpm dbm  # Generate and apply migrations
```

### File Navigation
- Agent: `src/mastra/agents/lucie-agents.ts`
- Instructions: `src/mastra/agents/lucie-instructions.ts`
- Tools: `src/mastra/tools/query-*-tool.ts`
- Schemas: `src/db/schemas/*.ts`
- Helpers: `src/db/helpers/query-*.ts`
- Field IDs: `lib/airtable-field-ids-ref.ts`
- Issues: `TODO.md`

### Architecture Decisions

**Why Turso instead of Airtable?**
- Airtable: 5 req/sec limit, 500-2000ms queries
- Turso: No limits, <100ms queries, type-safe
- Airtable remains source of truth for data entry

**Why three tools instead of one?**
- Each optimized for its domain (founders, sessions, startups)
- Specialized search types per data type
- Clearer tool selection for LLM
- Better error isolation

**Why Mastra beta?**
- GA version not released yet
- Beta provides needed functionality
- Active development and support
- Migration path planned (TODO.md #20)

## Important Reminders

1. **Always check TODO.md** before making changes - many known issues documented
2. **Use terminal CLI** (`pnpm dev:cli`) for rapid iteration - avoids Slack rate limits
3. **ESM imports require `.js` extensions** - even for `.ts` source files
4. **Agent instructions have inconsistencies** - only trust tools in `lucie-agents.ts`
5. **Batch filtering is disabled** - don't re-enable without fixing schema (TODO.md #2)
6. **No testing yet** - add tests when implementing new features (TODO.md #4)
7. **Storage is ephemeral** - Mastra storage lost on restart (TODO.md #5)
8. **Update field ID mappings** when touching Airtable sync
9. **Production readiness: 70%** - see TODO.md for blockers
10. **Use `log()` from print-helpers** for debugging (not console.log)

## Intentionally Disabled Features

The following features are documented but **intentionally disabled** (see `docs/DISABLED-FEATURES-SUMMARY.md`):

1. **queryFaqTool** - FAQ queries disabled due to returning too many results for short queries (e.g., "IC" returned 149 FAQs), causing poor UX. The 197 curated FAQs (general, founders, sessions, startups) exist in the database but are no longer accessible to the agent. Can be re-enabled by uncommenting in `lucie-agents.ts`.
2. **Slack streaming animations** - Animated spinners and real-time progress indicators disabled per user request. Reduces Slack API calls by ~95% (from 10-50 calls to 2 calls per response). Original implementation preserved as commented code in `src/mastra/slack/streaming.ts`.
3. **Batch filtering** - `by-batch` search type in queryFoundersTool (broken, commented out until batch field is added to schema)

Check the `docs/` folder for detailed explanations of each disabled feature.

---

For detailed project documentation, see README.md.
For improvement roadmap and known issues, see TODO.md.
For database sync details, see docs/database-sync-guide.md.
