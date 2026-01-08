import { Agent } from "@mastra/core/agent";
import { Memory } from '@mastra/memory';
import { MCPClient } from '@mastra/mcp';
import { getCohortDataTool } from '../tools/cohort-data-tool';
import { getAiLabDataTool } from '../tools/ai-lab-data-tool';
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
  tools: {
    ...mcpTools,
    getCohortDataTool,
    getAiLabDataTool,
  },
});
