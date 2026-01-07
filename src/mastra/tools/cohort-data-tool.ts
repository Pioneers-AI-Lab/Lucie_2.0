import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { apiClient } from "../../../lib/api-client";


export const getCohortDataTool = createTool({
  id: "cohort-data-tool",
  description: "Get data about the Pioneers cohort from Airtable",
  inputSchema: z.object({}),
  outputSchema: z.object({
    data: z.array(z.any()).describe("The data about the cohort"),
  }),
	execute: async () => {
		return await getCohortData();
	},
});

const getCohortData = async () => {
	const response = await apiClient.get(`${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_COHORT_TABLE_ID}`);
	const data = await response.json() as { records: any[] };
	return {
		data: data.records,
	};
};
