import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import Airtable from 'airtable';

/**
 * Optional filter parameters for precise data fetching.
 * All fields are optional - if none provided, fetches all records.
 */
const filterSchema = z
  .object({
    /**
     * Airtable formula for filtering records.
     * Examples:
     * - "{Role} = 'CTO'" - exact match
     * - "SEARCH('ML', {Skills})" - text search
     * - "AND({Role} = 'Founder', {Status} = 'Active')" - multiple conditions
     * - "{Date} > '2025-01-01'" - date comparison
     * Field names must match exactly (case-sensitive, including spaces).
     */
    filterFormula: z
      .string()
      .optional()
      .describe('Airtable filter formula (e.g., "{Role} = \'CTO\'")'),

    /**
     * Field name to search for text (case-insensitive partial match).
     * If provided, searches for the searchText within this field.
     */
    searchField: z.string().optional().describe('Field name to search within'),

    /**
     * Text to search for in the searchField.
     * Only used if searchField is provided.
     */
    searchText: z
      .string()
      .optional()
      .describe('Text to search for (case-insensitive)'),

    /**
     * Field name and value for exact match filtering.
     * Example: { fieldName: "Role", fieldValue: "CTO" }
     */
    fieldName: z.string().optional().describe('Field name for exact match'),
    fieldValue: z.string().optional().describe('Field value for exact match'),
  })
  .refine(
    (data) => {
      // If searchField is provided, searchText must also be provided
      if (data.searchField && !data.searchText) return false;
      // If fieldName is provided, fieldValue must also be provided
      if (data.fieldName && !data.fieldValue) return false;
      return true;
    },
    {
      message:
        'searchField requires searchText, and fieldName requires fieldValue',
    },
  );

export const getCohortDataTool = createTool({
  id: 'cohort-data-tool',
  description:
    'Get data about the Pioneers cohort from Airtable. Supports optional filtering for precise queries. If no filters provided, returns all records.',
  inputSchema: filterSchema,
  outputSchema: z.object({
    data: z
      .array(
        z.object({
          id: z.string().describe('The ID of the record'),
          fields: z
            .record(z.string(), z.any())
            .describe('The fields of the record'),
        }),
      )
      .describe('The filtered data about the cohort'),
    totalRecords: z.number().describe('Total number of records returned'),
  }),
  execute: async (input) => {
    return await getCohortData(input);
  },
});

/**
 * Builds Airtable filter formula from input parameters.
 */
const buildFilterFormula = (
  input: z.infer<typeof filterSchema>,
): string | undefined => {
  // If explicit formula provided, use it
  if (input.filterFormula) {
    return input.filterFormula;
  }

  // Build formula from search parameters
  const conditions: string[] = [];

  if (input.searchField && input.searchText) {
    // Use SEARCH for case-insensitive text matching
    // Escape single quotes in search text
    const escapedText = input.searchText.replace(/'/g, "''");
    conditions.push(`SEARCH('${escapedText}', {${input.searchField}})`);
  }

  if (input.fieldName && input.fieldValue) {
    // Exact match - escape single quotes in value
    const escapedValue = input.fieldValue.replace(/'/g, "''");
    conditions.push(`{${input.fieldName}} = '${escapedValue}'`);
  }

  if (conditions.length === 0) {
    return undefined; // No filter
  }

  // Combine multiple conditions with AND
  return conditions.length === 1
    ? conditions[0]
    : `AND(${conditions.join(', ')})`;
};

const getCohortData = async (input: z.infer<typeof filterSchema> = {}) => {
  if (
    !process.env.AIRTABLE_API_KEY ||
    !process.env.SU_2025_BASE_ID ||
    !process.env.SU_2025_TABLE_ID
  ) {
    throw new Error('Missing Airtable environment variables');
  }

  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
    process.env.SU_2025_BASE_ID,
  );

  // Build select options with optional filter
  const selectOptions: { filterByFormula?: string } = {};
  const filterFormula = buildFilterFormula(input);

  if (filterFormula) {
    selectOptions.filterByFormula = filterFormula;
  }

  const records = await base(process.env.SU_2025_TABLE_ID)
    .select(selectOptions)
    .all();

  return {
    data: records.map((record) => ({
      id: record.id,
      fields: record.fields,
    })),
    totalRecords: records.length,
  };
};
