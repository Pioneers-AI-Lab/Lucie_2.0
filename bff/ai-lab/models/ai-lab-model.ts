import { z } from 'zod';
import { airtableApiClient } from '../../../lib/airtable-api-client';
import { log } from '../../../lib/print-helpers';

const aiLabFieldsSchema = z.object({
	key: z.string(),
	type: z.string(),
	id: z.string(),
	index: z.number(),
})

export type AiLabFields = z.infer<typeof aiLabFieldsSchema>;

// get env variables
const airtableApiKey = process.env.AIRTABLE_API_KEY;
const airtableBaseId = process.env.AI_LAB_BASE_ID;
const airtableTableId = process.env.AI_LAB_TABLE_ID;
if (!airtableApiKey || !airtableBaseId || !airtableTableId) {
	throw new Error('Missing Airtable environment variables');
}

export const aiLabModel = {
	async getFields() {
		const response = await airtableApiClient.get(`${airtableBaseId}/${airtableTableId}/fields`).json();
		log('Airtable fields', response);
		return aiLabFieldsSchema.parse(response);
	},
}
