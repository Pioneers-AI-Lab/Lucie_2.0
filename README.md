# Lucie 2.0

An AI-powered Program Manager agent built with the Mastra framework for the Pioneers accelerator program. Lucie answers questions about the Pioneers program by querying Airtable data and is accessible through both Slack and a terminal CLI.

## Features

- **Multi-Channel Access**: Interact with Lucie through Slack or terminal CLI
- **Intelligent Data Retrieval**: Queries Airtable with optional filtering for efficient data access
- **Real-Time Streaming**: Streaming responses with visual feedback for tool calls and processing
- **Conversation Memory**: Maintains context across 20 messages for natural multi-turn conversations
- **Flexible Model Support**: Compatible with both Anthropic and OpenAI models
- **Date-Aware Responses**: Handles temporal queries like "next session" or "upcoming events"
- **Observability**: Built-in tracing and logging with Mastra Cloud integration

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
  - [Development](#development)
  - [Terminal CLI](#terminal-cli)
  - [Production](#production)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Development Guide](#development-guide)
  - [Adding a New Tool](#adding-a-new-tool)
  - [Adding a New Agent](#adding-a-new-agent)
  - [Adding a Slack Integration](#adding-a-slack-integration)
- [Deployment](#deployment)
- [Contributing](#contributing)

## Prerequisites

- **Node.js**: >= 22.13.0
- **pnpm**: 10.27.0 or higher
- **Airtable Account**: With API access to your data bases
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

```bash
# AI Model Configuration
MODEL="anthropic/claude-3-haiku-20240307"  # or "openai/gpt-4.1-nano"
ANTHROPIC_API_KEY="your-anthropic-api-key"
OPENAI_API_KEY="your-openai-api-key"

# Airtable Configuration
AIRTABLE_API_KEY="your-airtable-api-key"
SU_2025_BASE_ID="your-pioneers-base-id"
SU_2025_TABLE_ID="your-pioneers-table-id"
AI_LAB_BASE_ID="your-ai-lab-base-id"  # Optional: For future AI Lab integration
AI_LAB_TABLE_ID="your-ai-lab-table-id"  # Optional: For future AI Lab integration

# Slack Configuration (Required for Slack integration)
SLACK_BOT_TOKEN="xoxb-your-slack-bot-token"
SLACK_SIGNING_SECRET="your-slack-signing-secret"

# Observability (Optional)
MASTRA_CLOUD_ACCESS_TOKEN="your-mastra-cloud-token"
```

### Environment Variable Details

- **MODEL**: Specify which LLM to use. Prefix with `anthropic/*` or `openai/*`
- **ANTHROPIC_API_KEY**: Required if using Anthropic models
- **OPENAI_API_KEY**: Required if using OpenAI models
- **AIRTABLE_API_KEY**: API key for Airtable access
- **SU_2025_BASE_ID/TABLE_ID**: Airtable base and table IDs for Pioneers cohort data
- **SLACK_BOT_TOKEN**: OAuth token from your Slack app (starts with `xoxb-`)
- **SLACK_SIGNING_SECRET**: Used to verify requests from Slack
- **MASTRA_CLOUD_ACCESS_TOKEN**: Token for Mastra Cloud observability platform

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
│                        User Interface                        │
│                   (Slack / Terminal CLI)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Mastra Instance                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Agents     │  │   Storage    │  │   Logger     │     │
│  │  (Lucie)     │  │  (LibSQL)    │  │   (Pino)     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Lucie Agent                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Instructions (System Prompt)                          │  │
│  │ - Response style: Concise (2-4 sentences)             │  │
│  │ - Greeting handling                                   │  │
│  │ - Date-aware temporal queries                         │  │
│  │ - Slack-friendly formatting                           │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Model      │  │   Memory     │  │    Tools     │     │
│  │ (Configurable│  │ (Last 20 msgs│  │  (Airtable)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Sources                            │
│              Airtable (Pioneers Cohort Data)                 │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Message** → User sends message via Slack or CLI
2. **Route Handling** → Slack webhook or CLI captures and validates message
3. **Context Retrieval** → Agent retrieves last 20 messages from Memory
4. **Processing** → Agent analyzes message using instructions and model
5. **Tool Execution** → If needed, calls `getCohortDataTool` with optional filters
6. **Response Generation** → Agent generates response based on data
7. **Streaming** → Response streams back with visual feedback
8. **Context Save** → Conversation saved to Memory for future turns

### Tool Architecture

**getCohortDataTool** - Pioneers Cohort Data Query Tool
- Fetches records from Airtable base
- Supports optional filtering:
  - `filterFormula`: Airtable formula syntax (e.g., `"{Role} = 'CTO'"`)
  - `searchField` + `searchText`: Text search in specific field
  - `fieldName` + `fieldValue`: Exact field match
- Returns array of records with `id` and `fields`
- Strategy: Use filters for targeted queries, fetch all for complex analysis

## Project Structure

```
Lucie_2.0/
├── src/mastra/
│   ├── index.ts                 # Main Mastra instance initialization
│   ├── agents/
│   │   ├── lucie-agents.ts      # Lucie agent configuration
│   │   └── lucie-instructions.ts # Agent system instructions
│   ├── tools/
│   │   └── cohort-data-tool.ts  # Airtable data fetching tool
│   ├── slack/
│   │   ├── routes.ts            # Slack webhook route factory
│   │   └── streaming.ts         # Slack streaming logic
│   ├── terminal/
│   │   ├── cli.ts               # Terminal CLI interface
│   │   └── streaming.ts         # Terminal streaming logic
│   ├── workflows/               # Multi-step workflows (unused)
│   └── scorers/                 # Evaluation scorers (unused)
├── lib/
│   ├── airtable.ts              # Airtable client utilities
│   ├── print-helpers.ts         # Logging and output helpers
│   └── update-table-ref-ids.ts  # Table reference sync utilities
├── data/                        # Reference files and mappings
├── airtable_data/               # JSON exports for backup/reference
├── .env                         # Environment configuration
├── CLAUDE.md                    # Claude Code guidance
└── package.json
```

## Development Guide

### Adding a New Tool

Tools extend the agent's capabilities by providing functions it can call.

1. Create a new file in `src/mastra/tools/`:

```typescript
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const myNewTool = createTool({
  id: 'my-new-tool',
  description: 'Clear description of what this tool does',

  // Define input schema
  inputSchema: z.object({
    field: z.string().describe('Description of this field'),
    optional: z.string().optional(),
  }),

  // Define output schema
  outputSchema: z.object({
    data: z.array(z.object({
      id: z.string(),
      value: z.string(),
    })),
  }),

  // Implement the tool logic
  execute: async ({ context }) => {
    const { field, optional } = context;

    // Your API call or data fetching logic here
    const data = await fetchData(field, optional);

    return { data };
  },
});
```

2. Register the tool with the agent in `src/mastra/agents/lucie-agents.ts`:

```typescript
import { myNewTool } from '../tools/my-new-tool';

export const lucie = new Agent({
  // ... other config
  tools: {
    getCohortDataTool,
    myNewTool,  // Add your tool here
  },
});
```

3. Update agent instructions in `lucie-instructions.ts` to explain when and how to use the tool.

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

The default configuration uses in-memory storage. For production, update `src/mastra/index.ts`:

```typescript
storage: new LibSQLStore({
  id: 'mastra-storage',
  url: 'file:../mastra.db',  // Change from ':memory:'
}),
```

## Contributing

When contributing to this project:

1. Use the terminal CLI (`pnpm dev:cli`) for rapid development and testing
2. Follow the existing code structure and patterns
3. Update agent instructions when adding new tools
4. Test both Slack and CLI interfaces if making core changes
5. Keep responses concise - the agent is designed for brief, helpful answers
6. Use the `log()` helper from `lib/print-helpers` for debugging

## Technology Stack

- **Framework**: [Mastra](https://mastra.dev) (v1.0.0-beta)
- **Language**: TypeScript 5.9
- **Runtime**: Node.js >= 22.13.0
- **Package Manager**: pnpm 10.27.0
- **AI Models**: Anthropic Claude / OpenAI GPT
- **Data Source**: Airtable
- **Communication**: Slack Web API
- **Storage**: LibSQL
- **Logging**: Pino
- **Observability**: Mastra Cloud / OpenTelemetry

---

Built with [Mastra](https://mastra.dev) - The AI agent framework for production applications.
