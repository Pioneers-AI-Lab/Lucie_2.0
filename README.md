# Lucie 2.0

> **AI-Powered Program Manager** for the Pioneers accelerator program

An intelligent assistant built with the Mastra framework that answers questions about the Pioneers program. Lucie queries a Turso database (synced from Airtable) and is accessible through both Slack and a terminal CLI.

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22.13.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Mastra](https://img.shields.io/badge/Mastra-1.0.0--beta.19-orange)](https://mastra.dev)
[![Production Readiness](https://img.shields.io/badge/Production%20Ready-70%25-yellow)](./TODO.md)

## Features

- **Multi-Channel Access**: Interact with Lucie through Slack or terminal CLI
- **High-Performance Database**: Queries Turso database (LibSQL) with <100ms response times and no rate limits
- **Specialized Query Tools**: Three optimized tools for founders, sessions/events, and startups data
- **Incremental Data Sync**: Automatic synchronization from Airtable to Turso database
- **Real-Time Streaming**: Streaming responses with visual feedback and animated spinners
- **Conversation Memory**: Maintains context across 20 messages for natural multi-turn conversations
- **Flexible Model Support**: Compatible with both Anthropic and OpenAI models
- **Date-Aware Responses**: Handles temporal queries like "next session" or "upcoming events"
- **Type-Safe Database**: Drizzle ORM with full TypeScript type inference
- **Observability**: Built-in tracing and logging with Mastra Cloud integration

## Table of Contents

- [Lucie 2.0](#lucie-20)
  - [Features](#features)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
    - [Environment Variable Details](#environment-variable-details)
  - [Database Setup](#database-setup)
    - [Initial Setup](#initial-setup)
    - [Database Schema](#database-schema)
    - [Syncing Data from Airtable](#syncing-data-from-airtable)
    - [Database Management](#database-management)
  - [Usage](#usage)
    - [Development](#development)
    - [Terminal CLI](#terminal-cli)
    - [Database Commands](#database-commands)
    - [Production](#production)
  - [Architecture](#architecture)
    - [Core Components](#core-components)
    - [Data Flow](#data-flow)
    - [Tool Architecture](#tool-architecture)
      - [1. queryFoundersTool](#1-queryfounderstool)
      - [2. querySessionsTool](#2-querysessionstool)
      - [3. queryStartupsTool](#3-querystartupstool)
    - [Database Architecture](#database-architecture)
  - [Project Structure](#project-structure)
    - [Key Directories](#key-directories)
  - [Development Guide](#development-guide)
    - [Adding a New Tool](#adding-a-new-tool)
      - [Example: Database Query Tool](#example-database-query-tool)
    - [Adding a New Agent](#adding-a-new-agent)
    - [Adding a Slack Integration](#adding-a-slack-integration)
  - [Production Readiness](#production-readiness)
    - [✅ Production Ready Components](#-production-ready-components)
    - [⚠️ Requires Attention Before Production](#️-requires-attention-before-production)
    - [Production Deployment Checklist](#production-deployment-checklist)
  - [Known Issues](#known-issues)
  - [Deployment](#deployment)
    - [Production Build](#production-build)
    - [Environment Setup](#environment-setup)
    - [Persistence](#persistence)
    - [Environment Variables](#environment-variables)
    - [Health Checks](#health-checks)
  - [Contributing](#contributing)
    - [Development Workflow](#development-workflow)
    - [Code Quality](#code-quality)
  - [Technology Stack](#technology-stack)
  - [Documentation](#documentation)
  - [Resources](#resources)
  - [License](#license)

## Prerequisites

- **Node.js**: >= 22.13.0
- **pnpm**: 10.27.0 or higher
- **Turso Database**: [Create a free database](https://turso.tech) for production data storage
- **Airtable Account**: With API access to your bases (used for data synchronization)
- **Slack Workspace** (optional): For Slack integration
- **API Keys**: Anthropic or OpenAI API key depending on your model choice

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Lucie_2.0
```

2. Install dependencies:
```bash
pnpm install
```

3. Create a `.env` file based on the configuration section below.

## Configuration

Create a `.env` file in the project root with the following variables:

> **Note**: See `.env.example` for a complete template (coming soon - see [TODO.md](./TODO.md#-10-create-envexample-file))

```bash
# AI Model Configuration
MODEL="anthropic/claude-3-haiku-20240307"  # or "openai/gpt-4.1-nano"
ANTHROPIC_API_KEY="your-anthropic-api-key"
OPENAI_API_KEY="your-openai-api-key"

# Database Configuration (Turso + Drizzle ORM)
TURSO_CONNECTION_URL="libsql://your-database.turso.io"
TURSO_AUTH_TOKEN="your-turso-auth-token"

# Airtable Configuration (for data synchronization)
AIRTABLE_API_KEY="your-airtable-api-key"
SU_2025_BASE_ID="your-pioneers-base-id"
SU_2025_TABLE_ID="your-pioneers-table-id"
SU_2025_FOUNDERS_PROFILE_BOOK_TABLE_ID="your-pioneers-table-id"
SU_2025_STARTUPS_TABLE_ID="your-pioneers-table-id"
SU_2025_SESSIONS_EVENTS_TABLE_ID="your-pioneers-table-id"

# Airtable Sync Configuration (Optional - for incremental sync)
SU_2025_FOUNDERS_PROFILE_BOOK_TABLE_ID="your-pioneers-table-id"
SU_2025_STARTUPS_TABLE_ID="your-pioneers-table-id"
SU_2025_SESSIONS_EVENTS_TABLE_ID="your-pioneers-table-id"

# Slack Configuration (Required for Slack integration)
SLACK_BOT_TOKEN="xoxb-your-slack-bot-token"
SLACK_SIGNING_SECRET="your-slack-signing-secret"

# Observability (Optional)
MASTRA_CLOUD_ACCESS_TOKEN="your-mastra-cloud-token"
```

### Environment Variable Details

**AI Models:**
- **MODEL**: Specify which LLM to use. Prefix with `anthropic/*` or `openai/*`
- **ANTHROPIC_API_KEY**: Required if using Anthropic models
- **OPENAI_API_KEY**: Required if using OpenAI models

**Database (Turso):**
- **TURSO_CONNECTION_URL**: Your Turso database connection URL (format: `libsql://...`)
- **TURSO_AUTH_TOKEN**: Authentication token for Turso database access
- [Get started with Turso](https://docs.turso.tech/quickstart)

**Airtable (Data Source):**
- **AIRTABLE_API_KEY**: API key for Airtable access
- **SU_2025_BASE_ID**: Airtable base ID for Pioneers cohort data
- **SU_2025_TABLE_ID**: Airtable table ID for Pioneers cohort data
- **PROFILE_BOOK_TABLE_ID**: Table name/ID for Profile Book (default: "Pioneers Profile Book")
- **SESSIONS_TABLE_ID**: Table name/ID for Sessions (default: "Sessions & Events 2025")
- **STARTUPS_TABLE_ID**: Table name/ID for Startups (default: "Startups 2025")

**Slack Integration:**
- **SLACK_BOT_TOKEN**: OAuth token from your Slack app (starts with `xoxb-`)
- **SLACK_SIGNING_SECRET**: Used to verify requests from Slack

**Observability:**
- **MASTRA_CLOUD_ACCESS_TOKEN**: Token for Mastra Cloud observability platform

## Database Setup

Lucie 2.0 uses **Turso** (LibSQL) as its primary database with **Drizzle ORM** for type-safe queries. The database is synced from Airtable data.

### Initial Setup

1. **Create a Turso Database**:
```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Create database
turso db create lucie-db

# Get connection URL and auth token
turso db show lucie-db --url
turso db tokens create lucie-db
```

2. **Configure Environment Variables**:
Add the connection URL and auth token to your `.env` file.

3. **Push Schema and Seed Data**:
```bash
# Push schema to Turso database (first time setup)
pnpm db:push

# Seed database with data from JSON files
pnpm db:seed
```

Alternatively, use the combined setup command:
```bash
pnpm db:setup  # Pushes schema + seeds data
```

### Database Schema

The database includes three main tables:

- **founders** - Founder profiles with professional and personal data
  - Fields: name, email, phone, LinkedIn, skills, batch, etc.
  - ~All founders records

- **session_events** - Sessions and events information
  - Fields: name, date, speaker, type, week, participants, etc.
  - ~100 session/event records

- **startups** - Startup profiles with team and traction data
  - Fields: name, description, industry, team members, traction, etc.
  - ~27 startup records

### Syncing Data from Airtable

To update the database with new data from Airtable:

```bash
# Sync all tables (incremental update, upserts records)
pnpm db:sync

# Sync specific table only
pnpm db:sync --table=founders

# Sync specific batch only
pnpm db:sync --batch=S25

# Combine filters
pnpm db:sync --table=founders --batch=S25
```

**Important Notes**:
- Sync uses **upsert** logic (inserts new records, updates existing ones)
- Does **not** delete records (safe for incremental updates)
- Batch names are automatically normalized ("Summer 2025" → "S25")
- See `docs/database-sync-guide.md` for detailed documentation

### Database Management

```bash
# Generate migrations from schema changes
pnpm dbg  # or: pnpm drizzle-kit generate

# Apply migrations to database
pnpm dbm  # or: pnpm drizzle-kit migrate

# Push schema directly (dev only, skips migrations)
pnpm dbp  # or: pnpm drizzle-kit push

# Open Drizzle Studio (GUI at http://localhost:4983)
pnpm dbs  # or: pnpm drizzle-kit studio
```

## Usage

### Development

Start the Mastra development server with hot reload:

```bash
pnpm dev
```

This starts the server on the configured port with:
- Hot reload for code changes
- Slack webhook endpoints at `/slack/{app-name}/events`
- Observability and logging enabled

### Terminal CLI

For local testing without Slack rate limits, use the interactive terminal CLI:

```bash
# Start CLI with default agent
pnpm dev:cli

# Start CLI with specific agent
pnpm dev:cli --agent lucie
```

The CLI provides:
- Interactive conversation interface
- Multi-turn conversations with memory
- Real-time streaming responses
- Tool call visibility

Type `exit` or `quit` to end the session.

### Database Commands

Manage the Turso database and sync data from Airtable:

```bash
# Initial setup (first time only)
pnpm db:setup            # Push schema + seed data

# Data synchronization
pnpm db:sync             # Sync all data from Airtable (incremental)
pnpm db:sync --table=founders  # Sync specific table
pnpm db:sync --batch=S25       # Sync specific batch

# Schema management
pnpm dbg                 # Generate migration files
pnpm dbm                 # Apply migrations
pnpm dbp                 # Push schema directly (dev only)

# Database inspection
pnpm dbs                 # Open Drizzle Studio GUI
```

**Common Workflows:**

1. **First Time Setup**:
   ```bash
   pnpm db:setup
   ```

2. **Regular Data Updates**:
   ```bash
   pnpm db:sync
   ```

3. **Schema Changes**:
   ```bash
   # Edit schema files in src/db/schemas/
   pnpm dbg    # Generate migration
   pnpm dbm    # Apply migration
   ```

### Production

Build and start the production server:

```bash
# Build the project
pnpm build

# Start production server
pnpm start
```

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                       │
│                   (Slack / Terminal CLI)                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Mastra Instance                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Agents     │  │   Storage    │  │   Logger     │       │
│  │  (Lucie)     │  │  (LibSQL)    │  │   (Pino)     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Lucie Agent                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Instructions (System Prompt)                         │   │
│  │ - Response style: Concise (2-4 sentences)            │   │
│  │ - Greeting handling                                  │   │
│  │ - Date-aware temporal queries                        │   │
│  │ - Slack-friendly formatting                          │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Model      │  │   Memory     │  │    Tools     │       │
│  │ (Configurable│  │ (Last 20 msgs│  │  (3 Turso    │       │
│  │  Claude/GPT) │  │   context)   │  │   queries)   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer (Turso)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Founders    │  │   Sessions   │  │   Startups   │       │
│  │   (All)      │  │  (~100 rows) │  │  (~27 rows)  │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                     Drizzle ORM + LibSQL                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼ (Periodic Sync)
┌─────────────────────────────────────────────────────────────┐
│                   Data Source (Airtable)                    │
│              Pioneers Cohort Data (Source of Truth)         │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Message** → User sends message via Slack or CLI
2. **Route Handling** → Slack webhook or CLI captures and validates message
3. **Context Retrieval** → Agent retrieves last 20 messages from Memory
4. **Processing** → Agent analyzes message using instructions and model
5. **Tool Selection** → Agent selects appropriate Turso query tool:
   - `queryFoundersTool` - Founder queries (by-name, by-skills, by-batch, etc.)
   - `querySessionsTool` - Session/event queries (upcoming, past, by-speaker, etc.)
   - `queryStartupsTool` - Startup queries (by-industry, by-team-member, etc.)
6. **Tool Execution** → Tool queries Turso database with specialized filters
7. **Response Generation** → Agent generates response based on retrieved data
8. **Streaming** → Response streams back with visual feedback (animation, tool indicators)
9. **Context Save** → Conversation saved to Memory for future turns

### Tool Architecture

Lucie uses **three specialized Turso query tools** for fast, efficient data access:

#### 1. queryFoundersTool
Queries founder profiles from Turso database.

**Search Types:**
- `all` - All founders
- `by-name` - Search by founder name
- `by-skills` - Search by technical skills
- `by-batch` - Filter by cohort batch
- `count` - Get total count only

**Performance:** <100ms typical, no rate limits

#### 2. querySessionsTool
Queries session and event records from Turso database.

**Search Types:**
- `all` - All sessions/events
- `upcoming` - Future sessions (date >= today)
- `past` - Past sessions (date < today)
- `next` - Next upcoming session only
- `by-name` - Search by session name
- `by-speaker` - Filter by speaker name
- `by-type` - Filter by session type
- `by-week` - Filter by program week
- `global-search` - Search across all fields
- `count` - Get total count only

**Features:** Date-aware temporal queries, speaker filtering

#### 3. queryStartupsTool
Queries startup profiles from Turso database.

**Search Types:**
- `all` - All startups
- `by-name` - Search by startup name
- `by-industry` - Filter by industry/vertical
- `by-team-member` - Find startups by team member name
- `by-description` - Search in startup descriptions
- `global-search` - Search across all fields
- `count` - Get total count only

**Data Included:** Team info, industry, traction, progress updates

### Database Architecture

**Turso (LibSQL)** serves as the primary data source:
- **Fast queries**: <100ms typical response time
- **No rate limits**: Unlike Airtable API
- **Type-safe**: Drizzle ORM with full TypeScript inference
- **Synced from Airtable**: Periodic sync via `pnpm db:sync`

**Three Tables:**
- `founders` - Founder profiles with comprehensive professional data
- `session_events` - Session and event information with dates and participants
- `startups` - Startup profiles with team and traction data

**Sync Strategy:**
- Airtable remains source of truth for data entry
- Turso database synced via incremental upserts
- Agent queries exclusively use Turso (no direct Airtable access)
- Sync command: `pnpm db:sync` (manual or automated)

## Project Structure

```
Lucie_2.0/
├── src/
│   ├── mastra/
│   │   ├── index.ts                    # Main Mastra instance initialization
│   │   ├── agents/
│   │   │   ├── lucie-agents.ts         # Lucie agent configuration
│   │   │   └── lucie-instructions.ts   # Agent system instructions
│   │   ├── tools/
│   │   │   ├── query-founders-tool.ts  # Turso founders query tool
│   │   │   ├── query-sessions-tool.ts  # Turso sessions query tool
│   │   │   ├── query-startups-tool.ts  # Turso startups query tool
│   │   │   └── cohort-data-tool.ts     # LEGACY: Cross-table search (unused)
│   │   ├── slack/
│   │   │   ├── routes.ts               # Slack webhook route factory
│   │   │   ├── streaming.ts            # Slack streaming logic
│   │   │   └── verify.ts               # HMAC signature verification
│   │   ├── terminal/
│   │   │   ├── cli.ts                  # Terminal CLI interface
│   │   │   └── streaming.ts            # Terminal streaming logic
│   │   ├── workflows/                  # Multi-step workflows (template only)
│   │   └── scorers/                    # Evaluation scorers (template only)
│   └── db/
│       ├── index.ts                    # Turso database client
│       ├── schemas/
│       │   ├── founders.ts             # Founder table schema
│       │   ├── session-events.ts       # Session/event table schema
│       │   ├── startups.ts             # Startup table schema
│       │   └── index.ts                # Schema exports
│       ├── helpers/
│       │   ├── query-all-founders.ts   # Founder query helpers
│       │   ├── query-sessions.ts       # Session query helpers
│       │   └── query-startups.ts       # Startup query helpers
│       ├── seed.ts                     # Database seeding script
│       └── sync-from-airtable.ts       # Airtable sync script
├── lib/
│   ├── airtable.ts                     # Airtable client utilities
│   ├── airtable-field-ids-ref.ts       # Field ID mappings (Airtable ↔ Turso)
│   ├── print-helpers.ts                # Logging and output helpers
│   └── update-table-ref-ids.ts         # Table reference sync utilities
├── data/
│   └── 2025-Cohort_Data/
│       ├── JSON/                       # JSON seed data and reference files
│       └── CSV/                        # CSV exports (backup)
├── docs/
│   ├── database-sync-guide.md          # Database sync documentation
│   └── history/                        # Historical migration docs (TODO)
├── airtable_data/                      # Additional JSON exports
├── .env                                # Environment configuration
├── .gitignore                          # Git ignore rules
├── drizzle.config.ts                   # Drizzle Kit configuration
├── tsconfig.json                       # TypeScript configuration
├── package.json                        # Dependencies and scripts
├── CLAUDE.md                           # Claude Code guidance (detailed)
├── README.md                           # This file
└── TODO.md                             # Improvement roadmap
```

### Key Directories

- **`src/mastra/`** - Mastra framework components (agents, tools, integrations)
- **`src/db/`** - Database layer (schemas, helpers, sync scripts)
- **`lib/`** - Shared utilities and helpers
- **`data/`** - Reference data and seed files
- **`docs/`** - Documentation and guides

## Development Guide

### Adding a New Tool

Tools extend the agent's capabilities by providing functions it can call.

#### Example: Database Query Tool

1. **Create Database Helper** (if needed) in `src/db/helpers/`:

```typescript
import { db } from '../index.js';
import { myTable } from '../schemas/index.js';
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

2. **Create Tool** in `src/mastra/tools/`:

```typescript
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getAllRecords, searchByName } from '../../db/helpers/my-helpers.js';

export const queryMyDataTool = createTool({
  id: 'query-my-data-tool',
  description: 'Queries my data from Turso database with various search types',

  // Define input schema
  inputSchema: z.object({
    searchType: z.enum(['all', 'by-name', 'count'])
      .describe('Type of search to perform'),
    searchTerm: z.string().optional()
      .describe('Search term (required for by-name)'),
  }),

  // Define output schema
  outputSchema: z.object({
    data: z.array(z.object({
      id: z.string(),
      name: z.string(),
      // ... other fields
    })),
    message: z.string(),
  }),

  // Implement the tool logic
  execute: async ({ context }) => {
    const { searchType, searchTerm } = context;

    try {
      let data;

      switch (searchType) {
        case 'all':
          data = await getAllRecords();
          break;
        case 'by-name':
          if (!searchTerm) {
            return { data: [], message: 'Search term required for by-name search' };
          }
          data = await searchByName(searchTerm);
          break;
        case 'count':
          data = await getAllRecords();
          return { data: [], message: `Total records: ${data.length}` };
        default:
          return { data: [], message: 'Invalid search type' };
      }

      return {
        data,
        message: `Found ${data.length} records`,
      };
    } catch (error) {
      console.error('Error querying data:', error);
      return { data: [], message: 'Error querying database' };
    }
  },
});
```

3. **Register Tool** with agent in `src/mastra/agents/lucie-agents.ts`:

```typescript
import { queryFoundersTool } from '../tools/query-founders-tool.js';
import { querySessionsTool } from '../tools/query-sessions-tool.js';
import { queryStartupsTool } from '../tools/query-startups-tool.js';
import { queryMyDataTool } from '../tools/query-my-data-tool.js';

export const lucie = new Agent({
  // ... other config
  tools: {
    queryFoundersTool,
    querySessionsTool,
    queryStartupsTool,
    queryMyDataTool,  // Add your tool here
  },
});
```

4. **Update Agent Instructions** in `lucie-instructions.ts`:

Add tool selection rules explaining when and how to use the new tool:

```typescript
// Example addition to instructions:
- My Data queries → **queryMyDataTool**
  - "Show me all records" → searchType: 'all'
  - "Find John Smith" → searchType: 'by-name', searchTerm: 'John Smith'
```

### Adding a New Agent

Create additional agents for different personas or use cases.

1. Create agent file in `src/mastra/agents/`:

```typescript
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { myTool } from '../tools/my-tool';

export const myAgent = new Agent({
  id: 'my-agent',
  name: 'My Agent',
  description: 'What this agent does',

  memory: new Memory({
    options: {
      lastMessages: 20,
    },
  }),

  instructions: `Your system instructions here...`,
  model: process.env.MODEL || 'anthropic/claude-3-haiku-20240307',

  tools: {
    myTool,
  },
});
```

2. Register in `src/mastra/index.ts`:

```typescript
import { myAgent } from './agents/my-agent';

export const mastra = new Mastra({
  agents: {
    lucie,
    myAgent,  // Add here
  },
  // ... rest of config
});
```

3. Add to CLI agent list in `src/mastra/terminal/cli.ts`:

```typescript
const availableAgents = ['lucie', 'myAgent'];
```

### Adding a Slack Integration

Connect your agent to Slack for real-time interactions.

1. Create a Slack app at [api.slack.com/apps](https://api.slack.com/apps)

2. Configure the app:
   - Enable Event Subscriptions
   - Subscribe to: `app_mention` and `message.im` events
   - Set Request URL: `https://your-domain.com/slack/your-app-name/events`
   - Install app to your workspace

3. Add configuration to `src/mastra/slack/routes.ts`:

```typescript
const slackApps = [
  { name: 'lucie', agentId: 'lucie' },
  { name: 'my-agent', agentId: 'myAgent' },  // Add new app
];
```

4. Add environment variables (use naming pattern for multiple apps):

```bash
# Option 1: Single app (reuses main tokens)
SLACK_BOT_TOKEN="xoxb-..."
SLACK_SIGNING_SECRET="..."

# Option 2: Multiple apps (separate tokens)
SLACK_LUCIE_BOT_TOKEN="xoxb-..."
SLACK_LUCIE_SIGNING_SECRET="..."
SLACK_MY_AGENT_BOT_TOKEN="xoxb-..."
SLACK_MY_AGENT_SIGNING_SECRET="..."
```

5. Deploy and verify the webhook URL in Slack app settings

## Production Readiness

**Current Status: 70% Production Ready**

### ✅ Production Ready Components

- Core agent functionality with three specialized query tools
- Turso database with optimized schemas and indexes
- Slack integration with proper security (HMAC verification)
- Terminal CLI for local testing
- Database sync mechanism from Airtable
- Type-safe database layer with Drizzle ORM
- Streaming responses with error recovery
- Conversation memory (last 20 messages)

### ⚠️ Requires Attention Before Production

See [TODO.md](./TODO.md) for detailed improvement roadmap.

**Critical Issues (Priority 1):**
- [ ] Fix data corruption bug in sync script (misaligned field mappings)
- [ ] Fix or remove broken batch filtering (returns all founders)
- [ ] Remove non-existent tool references from agent instructions

**High Priority (Priority 2):**
- [ ] Add testing infrastructure (currently 0% coverage)
- [ ] Change Mastra storage from in-memory to persistent
- [ ] Add database indexes for query performance
- [ ] Implement rate limiting on Slack webhooks

**Recommended (Priority 3):**
- [ ] Add code quality tools (ESLint, Prettier)
- [ ] Create `.env.example` for easier setup
- [ ] Set up CI/CD pipeline
- [ ] Add query performance monitoring
- [ ] Implement secret management for production

### Production Deployment Checklist

Before deploying to production:

1. **Fix Critical Bugs** (see TODO.md tasks #1-3)
2. **Add Testing** (minimum 70% coverage for critical paths)
3. **Enable Persistent Storage** (change from `:memory:` to `file:` in src/mastra/index.ts)
4. **Add Database Indexes** (for commonly-queried fields)
5. **Implement Rate Limiting** (protect Slack webhook endpoint)
6. **Set Up Monitoring** (query performance, error tracking)
7. **Configure Secret Management** (for production credentials)
8. **Set Up Automated Backups** (for Turso database)
9. **Add CI/CD Pipeline** (automated testing and deployment)
10. **Load Testing** (verify performance under expected traffic)

## Known Issues

See [TODO.md](./TODO.md) for comprehensive list of improvements and known issues.

**Active Issues:**

1. **Data Sync Bug** (Critical): Field mappings in `sync-from-airtable.ts` are misaligned, causing data corruption
2. **Batch Filtering** (Critical): `getFoundersByBatch()` returns all founders instead of filtering by batch
3. **Agent Instructions** (Medium): References non-existent tools (getCohortDataTool, AI Lab tool)
4. **No Tests** (High): Zero test coverage increases risk of regressions
5. **In-Memory Storage** (High): Mastra storage is ephemeral, lost on restart
6. **Missing Indexes** (Medium): Database queries will slow as data grows

**Incomplete Features:**

- AI Lab tool (infrastructure exists, not implemented)
- Agent scorer (template only, needs Lucie-specific implementation)
- Workflows (example exists but unused)

## Deployment

### Production Build

```bash
# Build the project
pnpm build

# The .mastra directory contains the bundled output
# Deploy the contents along with node_modules
```

### Environment Setup

Ensure all required environment variables are set in your production environment:
- Database connection (if using persistent LibSQL)
- API keys (Anthropic/OpenAI, Airtable)
- Slack credentials (if using Slack integration)
- Mastra Cloud token (for observability)

### Persistence

**Important**: The default configuration uses **in-memory storage** which is ephemeral (lost on restart).

For production, update `src/mastra/index.ts`:

```typescript
storage: new LibSQLStore({
  id: 'mastra-storage',
  url: 'file:../mastra.db',  // Change from ':memory:'
}),
```

Add `.mastra.db` to `.gitignore` and set up regular backups.

### Environment Variables

Ensure all production environment variables are properly configured:

- **Required**: `MODEL`, `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`, `TURSO_CONNECTION_URL`, `TURSO_AUTH_TOKEN`
- **For Slack**: `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`
- **For Sync**: `AIRTABLE_API_KEY`, `SU_2025_BASE_ID`, table IDs
- **Optional**: `MASTRA_CLOUD_ACCESS_TOKEN` (observability)

Use a secret management service (AWS Secrets Manager, HashiCorp Vault) instead of `.env` files in production.

### Health Checks

Implement health check endpoints for monitoring:

```typescript
// Example health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    database: 'connected',
    timestamp: new Date().toISOString()
  });
});
```

## Contributing

When contributing to this project:

1. **Review [TODO.md](./TODO.md)** for current priorities and known issues
2. **Use terminal CLI** (`pnpm dev:cli`) for rapid development and testing
3. **Follow existing patterns**: Check similar components for code style
4. **Update agent instructions** when adding new tools or changing behavior
5. **Test both interfaces**: Verify changes work in both Slack and CLI
6. **Keep responses concise**: Agent is designed for brief, helpful answers (2-4 sentences)
7. **Use print helpers**: Use `log()` from `lib/print-helpers` for debugging
8. **Document changes**: Update README and CLAUDE.md for significant changes
9. **Write tests**: Add tests for new features (once testing infrastructure is set up)
10. **Check TODO.md**: Mark tasks as completed when you finish them

### Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes and test with CLI
pnpm dev:cli

# 3. Test with Slack (optional)
pnpm dev  # Expose with ngrok if needed

# 4. Update relevant documentation
# - README.md (user-facing changes)
# - CLAUDE.md (developer guidance)
# - TODO.md (mark completed tasks)

# 5. Commit and push
git add .
git commit -m "feat: add my feature"
git push origin feature/my-feature
```

### Code Quality

Once linting is set up (see TODO.md #8):

```bash
pnpm lint    # Check for issues
pnpm format  # Format code
pnpm test    # Run tests (once set up)
```

## Technology Stack

**Core Framework:**
- **Framework**: [Mastra](https://mastra.dev) v1.0.0-beta.19 (AI agent framework)
- **Language**: TypeScript 5.9 (strict mode, ESM)
- **Runtime**: Node.js >= 22.13.0
- **Package Manager**: pnpm 10.27.0

**AI & Models:**
- **AI Models**: Anthropic Claude / OpenAI GPT (configurable)
- **Default Model**: Claude 3 Haiku (fast, cost-effective)
- **Memory**: Last 20 messages per conversation

**Database & ORM:**
- **Primary Database**: [Turso](https://turso.tech) (LibSQL/SQLite)
- **ORM**: [Drizzle](https://orm.drizzle.team) (type-safe SQL)
- **Data Source**: Airtable (synced to Turso)
- **Storage**: LibSQL (Mastra observability)

**Integrations:**
- **Communication**: Slack Web API (with HMAC verification)
- **CLI**: Custom Node.js terminal interface
- **Logging**: Pino (structured logging)
- **Observability**: Mastra Cloud (optional)

**Development:**
- **Build Tool**: Rollup (via Mastra CLI)
- **Type Checking**: TypeScript compiler
- **Testing**: None (see [TODO.md](./TODO.md#-4-add-testing-infrastructure))
- **Linting**: None (see [TODO.md](./TODO.md#-8-add-code-quality-tools))

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Comprehensive developer guide (35KB, detailed)
- **[TODO.md](./TODO.md)** - Improvement roadmap with 23 tracked tasks
- **[docs/database-sync-guide.md](./docs/database-sync-guide.md)** - Database synchronization guide

## Resources

- **Mastra Documentation**: https://mastra.dev
- **Turso Documentation**: https://docs.turso.tech
- **Drizzle ORM Documentation**: https://orm.drizzle.team
- **Slack API Documentation**: https://api.slack.com

## License

[Add your license here]

---

Built with [Mastra](https://mastra.dev) - The AI agent framework for production applications.

**Project Status**: 70% Production Ready | [View Roadmap](./TODO.md)
