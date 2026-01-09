# Composio

> Composio is a platform that connects AI agents to 500+ external tools and services through managed authentication, tool execution, and triggers. It simplifies integrating AI agents with SaaS applications, developer tools, and custom APIs.

Composio provides managed OAuth and API key authentication, tool execution across multiple AI frameworks (OpenAI, Anthropic, LangChain, CrewAI, etc.), MCP server support, and webhooks/triggers for real-time agent actions.

## Get Started
- [Welcome to Composio](https://docs.composio.dev/docs/welcome): Composio is the simplest way to connect AI agents to external tools and services.
- [Quickstart](https://docs.composio.dev/docs/quickstart): Add composio tools to your AI agents
- [IDE and Agent Setup](https://docs.composio.dev/docs/dev-setup): Setup your AI IDE and agent to help you ship faster with Composio
- [Providers](https://docs.composio.dev/docs/providers): Use Composio with any AI framework

## Capabilities
- [Managed Authentication](https://docs.composio.dev/docs/managed-authentication): Auth management for your AI agents
- [Tools](https://docs.composio.dev/docs/tools): 500+ authenticated actions for AI agents
- [MCP (Model Context Protocol)](https://docs.composio.dev/docs/mcp): Universal tool protocol for any AI client
- [Triggers](https://docs.composio.dev/docs/triggers): Real-time events from 500+ integrations

## Tools and Triggers
- [Fetching tools and schemas](https://docs.composio.dev/docs/fetching-tools): Fetch and filter tools, and inspect schemas
- [Authenticating Tools](https://docs.composio.dev/docs/authenticating-tools): Create auth configs and connect user accounts
- [Executing Tools](https://docs.composio.dev/docs/executing-tools): Learn how to execute Composio's tools with different providers and frameworks
- [Using Triggers](https://docs.composio.dev/docs/using-triggers): Send payloads to your AI agents or systems based on events in apps.
- [Modify tool behavior: Schema Modifiers](https://docs.composio.dev/docs/tools/modify/modifying-tool-schemas): Customize how tools appear to agents
- [Modify tool behavior: Before Execution Modifiers](https://docs.composio.dev/docs/tools/modify/modifying-tool-inputs): Modify tool arguments before execution
- [Modify tool behavior: After Execution Modifiers](https://docs.composio.dev/docs/tools/modify/modifying-tool-outputs): Transform tool results after execution
- [Creating custom tools](https://docs.composio.dev/docs/custom-tools): Learn how to extend Composio's toolkits with your own tools
- [Toolkit versioning](https://docs.composio.dev/docs/toolkit-versioning): Pin specific tool versions for consistent behavior in production

## Authentication
- [Custom Auth Configs](https://docs.composio.dev/docs/custom-auth-configs): Customize auth configs for any toolkit
- [Programmatic Auth Configs](https://docs.composio.dev/docs/programmatic-auth-configs): Create auth configs programmatically
- [Custom Auth Parameters](https://docs.composio.dev/docs/custom-auth-params): Inject custom credentials in headers or parameters
- [Connected Accounts](https://docs.composio.dev/docs/connected-accounts): Manage and monitor user connections to toolkits
- [User Management](https://docs.composio.dev/docs/user-management): Manage users and their connected accounts

## MCP
- [MCP quickstart](https://docs.composio.dev/docs/mcp-quickstart): Create your first MCP server
- [Server management](https://docs.composio.dev/docs/mcp-server-management): Create, update, and manage MCP servers
- [Provider integrations](https://docs.composio.dev/docs/mcp-providers): Connect MCP servers to AI frameworks

## Tool Router (Beta)
- [Tool Router Quick Start](https://docs.composio.dev/docs/tool-router/quick-start-deprecated): Learn how to use tool router to route tool calls to the correct tool.

## Resources
- [CLI](https://docs.composio.dev/docs/cli): Generate type definitions and manage authentication
- [Debugging Info](https://docs.composio.dev/docs/resources/debugging-info): Share your debugging info with Composio team for faster issue resolution
- [Migration Guides: Migration guides](https://docs.composio.dev/docs/migration-guide/overview): Guides for migrating to newer versions of Composio
- [Migration Guides: Our next generation SDKs](https://docs.composio.dev/docs/migration-guide/new-sdk): Learn more about Composio's next generation SDKs and how to migrate
- [Migration Guides: Toolkit versioning migration](https://docs.composio.dev/docs/migration-guide/toolkit-versioning): Migrate to the new toolkit versioning system
- [Troubleshooting: Troubleshooting](https://docs.composio.dev/docs/troubleshooting/overview): Common issues and quick links
- [Troubleshooting: API](https://docs.composio.dev/docs/troubleshooting/api): Troubleshooting API issues
- [Troubleshooting: Authentication](https://docs.composio.dev/docs/troubleshooting/authentication): Troubleshooting authentication issues
- [Troubleshooting: CLI](https://docs.composio.dev/docs/troubleshooting/cli): Troubleshooting CLI issues
- [Troubleshooting: Dashboard](https://docs.composio.dev/docs/troubleshooting/dashboard): Troubleshooting dashboard issues
- [Troubleshooting: MCP](https://docs.composio.dev/docs/troubleshooting/mcp): Troubleshooting MCP server issues
- [Troubleshooting: SDKs](https://docs.composio.dev/docs/troubleshooting/sdks): Troubleshooting SDK issues
- [Troubleshooting: Tools & Toolkits](https://docs.composio.dev/docs/troubleshooting/tools): Troubleshooting tool execution issues
- [Troubleshooting: Triggers](https://docs.composio.dev/docs/troubleshooting/triggers): Troubleshooting trigger issues

## Tool Router
- [Tool Router](https://docs.composio.dev/tool-router/overview)
- [Quickstart](https://docs.composio.dev/tool-router/quickstart)
- [Users and sessions](https://docs.composio.dev/tool-router/users-and-sessions)
- [Authentication](https://docs.composio.dev/tool-router/authentication)
- [Tools and toolkits](https://docs.composio.dev/tool-router/tools-and-toolkits)
- [Using In-chat authentication](https://docs.composio.dev/tool-router/using-in-chat-authentication)
- [Manually authenticating users](https://docs.composio.dev/tool-router/manually-authenticating-users)
- [Managing multiple accounts](https://docs.composio.dev/tool-router/managing-multiple-accounts)
- [White-labeling authentication](https://docs.composio.dev/tool-router/white-labeling-authentication)
- [Using custom auth configs](https://docs.composio.dev/tool-router/using-custom-auth-configs)
- [Using with MCP clients](https://docs.composio.dev/tool-router/using-with-mcp-clients)
- [Using as a native tool](https://docs.composio.dev/tool-router/using-as-a-native-tool)
- [Migration Guides: Migration from the beta release version](https://docs.composio.dev/tool-router/migration-guide/tool-router/migration-guide/beta-to-stable): Migrate from Tool Router beta to the stable version

## Providers
- [OpenAI Providers](https://docs.composio.dev/providers/openai): Use Composio with OpenAI's Responses and Chat Completion APIs
- [Anthropic Provider](https://docs.composio.dev/providers/anthropic): Use Composio tools with Claude
- [Google Gen AI Provider](https://docs.composio.dev/providers/google): Use Composio with Gemini through the Google Gen AI SDK
- [LangChain Provider](https://docs.composio.dev/providers/langchain): Use Composio tools with LangChain
- [LlamaIndex Provider](https://docs.composio.dev/providers/llamaindex): Use Composio tools with LlamaIndex
- [CrewAI Provider](https://docs.composio.dev/providers/crewai): Use Composio tools with CrewAI agents
- [Vercel AI SDK Provider](https://docs.composio.dev/providers/vercel): Use Composio with Vercel AI SDK
- [OpenAI Agents Provider](https://docs.composio.dev/providers/openai-agents): Use Composio with OpenAI's Agents SDK
- [Mastra Provider](https://docs.composio.dev/providers/mastra): Use Composio with Mastra's TypeScript framework
- [TypeScript Custom Provider](https://docs.composio.dev/providers/custom/typescript): Learn how to create custom providers for any AI platform in TypeScript
- [Python Custom Provider](https://docs.composio.dev/providers/custom/python): Learn how to create custom providers for any AI framework in Python

## Toolkits
- [Tools JSON](https://docs.composio.dev/robots-only/tools.json): Machine-readable JSON with all 700+ toolkit slugs, descriptions, and tool names

## API Reference
- [Python SDK Reference](https://docs.composio.dev/python/python-sdk-reference)
- [Core Classes: Composio](https://docs.composio.dev/type-script/core-classes/composio)
- [Core Classes: ComposioProvider](https://docs.composio.dev/type-script/core-classes/composio-provider)
- [Core Classes: OpenAIProvider](https://docs.composio.dev/type-script/core-classes/open-ai-provider)
- [Core Classes: BaseAgenticProvider](https://docs.composio.dev/type-script/core-classes/base-agentic-provider)
- [Core Classes: BaseNonAgenticProvider](https://docs.composio.dev/type-script/core-classes/base-non-agentic-provider)
- [Models: Tools](https://docs.composio.dev/type-script/models/tools)
- [Models: Toolkits](https://docs.composio.dev/type-script/models/toolkits)
- [Models: Triggers](https://docs.composio.dev/type-script/models/triggers)
- [Models: AuthConfigs](https://docs.composio.dev/type-script/models/auth-configs)
- [Models: ConnectedAccounts](https://docs.composio.dev/type-script/models/connected-accounts)
- [Models: CustomTools](https://docs.composio.dev/type-script/models/custom-tools)

## Examples
- [Basic FastAPI Server](https://docs.composio.dev/examples/fast-api): Build a simple Gmail agent with Composio and FastAPI
- [Basic Hono Server](https://docs.composio.dev/examples/hono): Build a Gmail agent HTTP service with Hono
- [Gmail Labeler](https://docs.composio.dev/examples/gmail-labeler): Build an agent that automatically labels incoming Gmail messages using triggers
- [Slack summariser](https://docs.composio.dev/examples/slack-summariser): Build an agent that summarizes Slack channel messages
- [Supabase SQL Agent](https://docs.composio.dev/examples/supabase-sql-agent): Build an agent that executes SQL queries on Supabase using natural language
- [Full Stack Chat App](https://docs.composio.dev/examples/vercel-chat): Build a chat interface where users can connect and use their own apps
- [Tool Type Generator](https://docs.composio.dev/examples/tool-generator): Build your own platform using raw tool definitions
