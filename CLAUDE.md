# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start for New Claude Code Instances

**Lucie 2.0** is an AI agent (Mastra framework) that serves as a Program Manager for the Pioneers accelerator. It queries a Turso database (synced from Airtable) via Slack and terminal CLI.

**Most common commands:**
```bash
pnpm dev:cli        # Test agent in terminal (preferred - no Slack rate limits)
pnpm dev            # Start Mastra dev server for Slack integration
pnpm db:sync        # Sync new data from Airtable to Turso
pnpm dbs            # Open Drizzle Studio (GUI at localhost:4983)
```

**Critical architectural facts:**
- **ESM REQUIREMENT**: ALL imports MUST use `.js` extensions: `from './file.js'` NOT `from './file.ts'` or `from './file'`
- Agent has **3 active tools** (NOT Airtable API): `queryFoundersTool`, `querySessionsTool`, `queryStartupsTool`
- **4th table exists but disabled**: FAQ system (197 FAQs) - queryFaqTool commented out in `lucie-agents.ts`
- **Production status: 70% ready** - see TODO.md before making changes
- **No testing yet** - add tests when implementing features (TODO.md #4)
- **Storage is ephemeral** - Mastra uses `:memory:` storage (TODO.md #5)

**Before making any changes:**
1. ✅ Read TODO.md for known issues (many bugs documented)
2. ✅ Use `pnpm dev:cli` for testing (much faster than Slack)
3. ✅ Check field ID mappings if touching database sync (common bug source)

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

## Critical Gotchas - Read This First

### 🚨 ESM Import Paths (WILL BREAK IF WRONG)
**ALWAYS use `.js` extensions even for TypeScript files:**
- ✅ CORRECT: `from './file.js'`, `from '../db/index.js'`, `from '../../lib/helpers.js'`
- ❌ WRONG: `from './file'`, `from './file.ts'`, `from '../db/index'`
- **Why**: `package.json` has `"type": "module"` - Node requires explicit extensions for ESM

### ⚠️ Known Broken Features (Don't Re-Enable Without Fixing)
1. **Batch filtering** - `by-batch` search returns ALL founders (commented out in `queryFoundersTool`)
2. **Agent instructions** - Reference non-existent tools (`getCohortDataTool`, AI Lab tool)
3. **FAQ tool** - Disabled due to returning 149 results for "IC" (infrastructure exists, just commented out)

### ⚠️ Data Sync Landmines
- Field mappings in `sync-from-airtable.ts` have caused corruption bugs
- ALWAYS verify field IDs in `lib/airtable-field-ids-ref.ts` match Airtable
- Use `pnpm dbs` to visually inspect data after sync

### 💡 Development Best Practices
- **Test locally first**: Use `pnpm dev:cli` (instant feedback, no Slack rate limits)
- **Check TODO.md first**: Many known issues already documented
- **Use print helpers**: Import `log()` from `lib/print-helpers.ts` not `console.log`
- **Update TODO.md**: Mark tasks completed when you fix them

## Workflow Checklist

**Before starting any work:**
1. Check TODO.md for known issues
2. Understand ESM import requirements (`.js` extensions)
3. Test using `pnpm dev:cli` not Slack

**When adding a tool:**
1. Create tool in `src/mastra/tools/` (use `createTool` from `@mastra/core/tools`)
2. Add to agent's `tools` object in `lucie-agents.ts`
3. Update agent instructions in `lucie-instructions.ts`
4. Test in CLI with various queries

**When modifying database:**
1. Edit schema in `src/db/schemas/`
2. Run `pnpm dbg` (generate migration)
3. Run `pnpm dbm` (apply migration)
4. Update field IDs in `lib/airtable-field-ids-ref.ts` if syncing from Airtable
5. Test with `pnpm dbs` (visual DB browser)

**When done:**
1. Test in terminal CLI
2. Test in Slack (if applicable)
3. Mark completed TODO.md tasks
4. Use `.js` imports everywhere!

## Architecture Overview

### High-Level Structure

```
User (Slack/CLI)
  → Mastra Instance
    → Lucie Agent (instructions, memory, model)
      → 3 Tools (queryFounders, querySessions, queryStartups)
        → Database Helpers
          → Turso Database (4 tables)
            ← Synced from Airtable (source of truth)
```

### Key Directories

**Core Agent (`src/mastra/`):**
- `index.ts` - Mastra instance initialization
- `agents/lucie-agents.ts` - Agent config (tools, model, memory)
- `agents/lucie-instructions.ts` - System prompt (252 lines)
- `tools/query-*-tool.ts` - Three active tools (founders, sessions, startups)
- `slack/streaming.ts` - Slack integration (ANIMATION DISABLED - see docs/)
- `terminal/cli.ts` - Terminal interface

**Database (`src/db/`):**
- `schemas/*.ts` - Drizzle ORM schemas (4 tables: founders, session_events, startups, faq)
- `helpers/query-*.ts` - Query functions used by tools
- `sync-from-airtable.ts` - Data sync script (KNOWN BUGS - see TODO.md #1)
- `seed.ts` - JSON seeding script

**Utilities (`lib/`):**
- `print-helpers.ts` - Use `log()` not `console.log`
- `airtable-field-ids-ref.ts` - Field ID mappings (critical for sync)
- `airtable.ts` - Airtable client

### Agent Configuration

**Lucie** (`src/mastra/agents/lucie-agents.ts`):
- **Model**: Configurable via `MODEL` env var (supports `anthropic/*` or `openai/*`)
- **Memory**: Last 20 messages per conversation
- **Tools**: 3 active (queryFounders, querySessions, queryStartups)
- **Instructions**: Concise responses (2-4 sentences), Slack-friendly, date-aware

**Three Active Tools:**
1. **queryFoundersTool** - `all`, `by-name`, `by-skills`, `count` (⚠️ `by-batch` disabled)
2. **querySessionsTool** - `all`, `upcoming`, `past`, `next`, `by-name`, `by-speaker`, `by-type`, `by-week`, `global-search`, `count`
3. **queryStartupsTool** - `all`, `by-name`, `by-industry`, `by-team-member`, `by-description`, `global-search`, `count`

### Data Flow

1. User message → Slack webhook or CLI
2. Agent loads last 20 messages (Memory)
3. Agent selects tool → tool queries Turso → returns data
4. Agent generates response (streams to user)
5. Conversation saved to Memory

**Important**: Turso is primary data source (fast, no rate limits). Airtable is source of truth for data entry only.

## Common Development Tasks

### Adding a New Tool

**Files to modify:**
1. `src/mastra/tools/my-tool.ts` - Create tool
2. `src/mastra/agents/lucie-agents.ts` - Register tool
3. `src/mastra/agents/lucie-instructions.ts` - Add tool selection rules

**Tool template:**
```typescript
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getAllRecords } from '../../db/helpers/my-helpers.js'; // Note .js extension!

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
    const { searchType, searchTerm } = context;
    const data = await getAllRecords();
    return { data, message: `Found ${data.length} records` };
  },
});
```

### Adding a Database Table

**Workflow:**
```bash
# 1. Create schema in src/db/schemas/my-table.ts
# 2. Add field IDs to lib/airtable-field-ids-ref.ts (if syncing from Airtable)
pnpm dbg    # 3. Generate migration
pnpm dbm    # 4. Apply migration to Turso
pnpm dbs    # 5. Verify in Drizzle Studio
```

**Schema pattern:**
```typescript
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const myTable = sqliteTable('my_table', {
  id: text('id').primaryKey().notNull(), // Use Airtable record ID
  name: text('name'),                     // All fields nullable by default
  email: text('email'),                   // Use snake_case for columns
});

export type MyTable = typeof myTable.$inferSelect;
export type NewMyTable = typeof myTable.$inferInsert;
```

### Adding Query Helpers

**Pattern:** Create focused query functions in `src/db/helpers/`:

```typescript
import { db } from '../index.js'; // Note .js!
import { myTable } from '../schemas/index.js'; // Note .js!
import { like, eq } from 'drizzle-orm';

export async function getAllRecords() {
  return await db.select().from(myTable);
}

export async function searchByName(name: string) {
  return await db.select()
    .from(myTable)
    .where(like(myTable.name, `%${name}%`));
}
```

Import in tool: `import { getAllRecords } from '../../db/helpers/my-helpers.js';`

## Production Status: ~70% Ready

### ✅ Production Safe
- Core query tools working
- Slack integration with HMAC security
- Database layer optimized
- Data sync from Airtable

### ❌ Blockers
- **Critical bug**: Data sync field mapping misaligned (TODO.md #1) - FIXED
- **No testing**: 0% coverage (TODO.md #4)
- **Ephemeral storage**: Mastra uses `:memory:` (TODO.md #5)
- **No rate limiting**: Slack webhooks unprotected (TODO.md #7)
- **Agent instructions**: Reference non-existent tools (TODO.md #3)

**See TODO.md for complete checklist - 23 tracked improvements.**

## Technical Stack

### TypeScript & ESM
- **Module system**: ES2022 with `"type": "module"` in package.json
- **CRITICAL**: MUST use `.js` extensions for imports (even for .ts files)
- **Target**: ES2022, strict mode enabled
- **No path aliases**: Use relative imports only

### Mastra Framework (v1.0.0-beta.19)
- **Beta status**: API may change, not production-stable yet
- **Agents**: Instructions + tools + memory + model
- **Memory**: Last 20 messages per conversation (resourceId/threadId)
- **Storage**: LibSQL (currently `:memory:` - ephemeral!)
- **Streaming**: Real-time responses (text-delta, tool-call, tool-output chunks)

### Database (Turso + Drizzle ORM)
- **Turso (LibSQL)**: Primary data source, <100ms queries, no rate limits
- **Airtable**: Source of truth for data entry (synced via `pnpm db:sync`)
- **Four tables**: founders, session_events, startups, faq (197 entries)
- **Sync strategy**: Upsert only (no deletes), incremental updates

### Slack Integration
- **Security**: HMAC SHA256 verification, replay attack prevention
- **Streaming**: DISABLED (static "Processing..." message) - see docs/
- **Endpoints**: `/slack/{name}/events`
- **Note**: Animation code preserved as comments in `streaming.ts`

## Debugging & Common Issues

### Quick Debugging Commands
```bash
pnpm dev:cli    # Test agent locally (watch for 🔧 tool calls)
pnpm dbs        # Visual DB browser at localhost:4983
pnpm db:sync    # Sync data from Airtable (check for errors)
```

### Common Errors & Fixes

**"Cannot find module" or "ERR_MODULE_NOT_FOUND"**
- ❌ You used `from './file'` or `from './file.ts'`
- ✅ Fix: Use `from './file.js'` (ALWAYS .js extension)

**"Tool not working / not being called"**
- Check agent instructions reference the tool correctly
- Verify tool is in `lucie-agents.ts` tools object
- Test with `pnpm dev:cli` to see tool selection

**"Data sync returning wrong data"**
- Field IDs may have changed in Airtable
- Verify mappings in `lib/airtable-field-ids-ref.ts`
- Use `pnpm dbs` to visually inspect synced data

**"Memory not persisting across restarts"**
- Mastra storage is `:memory:` (ephemeral by design)
- Change to `file:../mastra.db` in `src/mastra/index.ts` for production

### Logging Best Practices
```typescript
import { log, message, error } from '../../../lib/print-helpers.js';

log(`Query params: ${JSON.stringify(params)}`);     // Debug info
message(`Found ${results.length} records`);          // User-facing
error(`Failed to query database: ${err.message}`);   // Errors
```

## Quick Reference

### Essential Commands
```bash
# Development
pnpm dev:cli        # Test agent in terminal (PREFERRED)
pnpm dev            # Start Mastra server for Slack

# Database
pnpm dbs            # Visual DB browser (localhost:4983)
pnpm db:sync        # Sync from Airtable (incremental, safe)
pnpm dbg && pnpm dbm # Generate + apply migrations

# Build
pnpm build          # Compile for production
pnpm start          # Run production server
```

### Critical Files
| What | Where |
|------|-------|
| Agent config | `src/mastra/agents/lucie-agents.ts` |
| System prompt | `src/mastra/agents/lucie-instructions.ts` |
| Tools | `src/mastra/tools/query-*-tool.ts` |
| DB schemas | `src/db/schemas/*.ts` |
| Query helpers | `src/db/helpers/query-*.ts` |
| Field IDs | `lib/airtable-field-ids-ref.ts` |
| Known issues | `TODO.md` (23 tasks) |

### Key Architecture Decisions

**Why Turso not Airtable API?**
- Turso: <100ms, no rate limits, type-safe
- Airtable: 500-2000ms, 5 req/sec limit
- Airtable still source of truth for data entry

**Why 3 tools not 1?**
- Domain-specific optimization
- Clearer LLM tool selection
- Better error isolation

**Why Mastra beta?**
- GA not released yet
- Migration planned (TODO.md #20)

## Final Reminders

1. **ALWAYS use `.js` extensions** - imports will break otherwise (ESM requirement)
2. **Check TODO.md first** - many known issues already documented
3. **Test with CLI not Slack** - `pnpm dev:cli` is much faster
4. **Don't re-enable broken features** - batch filtering, FAQ tool need fixes first
5. **Verify field IDs** - when touching Airtable sync (common bug source)
6. **Use print-helpers** - `log()` not `console.log`
7. **Update TODO.md** - mark tasks completed when you fix them
8. **Storage is ephemeral** - Mastra uses `:memory:` (data lost on restart)
9. **Production: 70% ready** - see TODO.md for 23 tracked improvements
10. **Agent instructions outdated** - reference non-existent tools (TODO.md #3)

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
