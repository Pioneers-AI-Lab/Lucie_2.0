import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import Airtable from 'airtable';

export const getAiLabDataTool = createTool({
  id: 'ai-lab-data-tool',
  description: 'Get data about the AI Lab from Airtable',
  inputSchema: z.object({}),
  outputSchema: z.object({
    data: z.array(z.object({
      id: z.string().describe('The ID of the record'),
      fields: z.record(z.string(), z.any()).describe('The fields of the record'),
    })).describe('The data about the AI Lab'),
  }),
  execute: async () => {
    return await getAiLabData();
  },
});

const getAiLabData = async () => {
  if (
    !process.env.AIRTABLE_API_KEY ||
    !process.env.AI_LAB_BASE_ID ||
    !process.env.AI_LAB_TABLE_ID
  ) {
    throw new Error('Missing Airtable environment variables');
  }
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
    process.env.AI_LAB_BASE_ID,
  );
  const records = await base(process.env.AI_LAB_TABLE_ID).select({}).all();
  return {
    data: records.map((record) => ({
      id: record.id,
      fields: record.fields,
    })),
  };
};
