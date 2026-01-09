import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { log } from "console";
import Airtable from "airtable";

/**
 * Mastra tool for fetching AI Lab data from Airtable.
 * Returns all records from the configured AI Lab base and table.
 */
export const getAiLabDataTool = createTool({
  id: "ai-lab-data-tool",
  description: "Get data about the AI Lab from Airtable",
  inputSchema: z.object({}),
  outputSchema: z.object({
    data: z
      .array(
        z.object({
          id: z.string().describe("The ID of the record"),
          fields: z
            .record(z.string(), z.any())
            .describe("The fields of the record"),
        }),
      )
      .describe("The data about the AI Lab"),
  }),
  execute: async () => {
    const data = await getAiLabData();
    log("AI Lab data", data);
    return data;
  },
});

/**
 * Fetches all records from the AI Lab Airtable base.
 * Validates required environment variables before making API calls.
 */
const getAiLabData = async () => {
  if (
    !process.env.AIRTABLE_API_KEY ||
    !process.env.AI_LAB_BASE_ID ||
    !process.env.AI_LAB_TABLE_ID
  ) {
    throw new Error("Missing Airtable environment variables");
  }

  // Initialize Airtable client and connect to base
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
    process.env.AI_LAB_BASE_ID,
  );

  // Fetch all records from the table (empty select = all records)
  const records = await base(process.env.AI_LAB_TABLE_ID).select({}).all();

  // Transform records to simplified format with id and fields
  return {
    data: records.map((record) => ({
      id: record.id,
      fields: record.fields,
    })),
  };
};
