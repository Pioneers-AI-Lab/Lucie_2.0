import { Composio } from '@composio/core';

// Initialize Composio
const composio = new Composio({
apiKey: process.env.COMPOSIO_API_KEY
});

// Create MCP server with multiple toolkits
const server = await composio.mcp.create("mcp-config-73840", {  // Pick a unique name for your MCP server
toolkits: [
  {
    authConfigId: process.env.COMPOSIO_AUTH_AIRTABLE_CONFIG_ID, // Your Airtable auth config ID
    toolkit: "airtable"
  },
],
allowedTools: ["AIRTABLE_FETCH_RECORDS", "AIRTABLE_CREATE_RECORD", "AIRTABLE_UPDATE_RECORD", "AIRTABLE_DELETE_RECORD"]
});

console.log(`Server created: ${server.id}`);
