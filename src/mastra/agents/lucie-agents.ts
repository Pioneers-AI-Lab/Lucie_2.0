import { Agent } from "@mastra/core/agent";
import { Memory } from '@mastra/memory';
import { MCPClient } from '@mastra/mcp';
import { Composio } from '@composio/core';
import { MastraProvider } from '@composio/mastra';
import { lucieInstructions } from './lucie-instructions';

const mcp = new MCPClient({
  servers: {},
});

const mcpTools = await mcp.listTools();

export const lucie = new Agent({
  id: 'lucie',
  name: 'lucie',
  description: 'Lucie is the Pioneers Program Manager',
  memory: new Memory({
    options: {
      lastMessages: 20,
    },
  }),
  instructions: lucieInstructions,

  // todo: change the anthropic env to use the one max gets
  // model: 'openai/gpt-4.1-mini',
  model: 'anthropic/claude-3-haiku-20240307',
  tools: async ({ requestContext }) => {
    const composio = new Composio({
      provider: new MastraProvider(),
    });

    // retrieve userId and activeAccount from the requestContext
    const userId = requestContext.get<'userId', string>('userId');
    const activeAccount = requestContext.get<
      'activeAccount',
      Awaited<
        ReturnType<typeof composio.connectedAccounts.list>
      >['items'][number]
    >('activeAccount');

    // return empty set of tools if activeAccount isn't present
    if (!activeAccount) return {};

    // fetch composio tools and dynamically use them in the agent
    const composioTools = await composio.tools.get(userId, {
      toolkits: [activeAccount.toolkit.slug],
    });

    return composioTools;
  },
  ...mcpTools,
});
