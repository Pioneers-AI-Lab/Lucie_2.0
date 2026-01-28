import { Agent } from "@mastra/core/agent";
import { Memory } from '@mastra/memory';
import { queryFoundersTool } from '../tools/query-founders-tool';
import { querySessionsTool } from '../tools/query-sessions-tool';
import { queryStartupsTool } from '../tools/query-startups-tool';
import { queryFAQTool } from '../tools/query-faq-tool';
import { lucieInstructions } from "./lucie-instructions";

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

  // model: 'anthropic/claude-3-haiku-20240307',
  model: 'anthropic/claude-3-haiku-latest',
  tools: {
    queryFoundersTool,
    querySessionsTool,
    queryStartupsTool,
    queryFAQTool,
  },
});
