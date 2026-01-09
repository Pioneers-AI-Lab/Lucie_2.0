import { MCPClient } from '@mastra/mcp';

export const lucieMcpClient = new MCPClient({
  id: 'lucie-mcp-client',
  servers: {
    airtable: {
      url: new URL(process.env.HTTP_MCP_ENDPOINT as string),
    },
  },
});
