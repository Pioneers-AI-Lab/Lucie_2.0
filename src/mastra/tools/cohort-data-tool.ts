import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import Airtable from 'airtable';

export const getCohortDataTool = createTool({
  id: 'cohort-data-tool',
  description: 'Get data about the Pioneers cohort from Airtable',
  inputSchema: z.object({}),
  outputSchema: z.object({
    data: z.array(z.object({
      id: z.string().describe('The ID of the record'),
      fields: z.record(z.string(), z.any()).describe('The fields of the record'),
    })).describe('The data about the cohort'),
  }),
  execute: async () => {
    return await getCohortData();
  },
});

const getCohortData = async () => {
  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID || !process.env.AIRTABLE_COHORT_TABLE_ID) {
    throw new Error('Missing Airtable environment variables');
  }
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
  const records = await base(process.env.AIRTABLE_COHORT_TABLE_ID).select({}).all();
  return {
    data: records.map((record) => ({
      id: record.id,
      fields: record.fields,
    })),
  };
};
