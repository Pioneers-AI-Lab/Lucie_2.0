import { createTool } from "@mastra/core/tools";
import { z } from 'zod';
import Airtable from 'airtable';
import aiLabTableRef from '../../../data/ai-lab-table-ref.json';

/**
 * Available AI Lab table fields (from data/ai-lab-table-ref.json)
 * All fields are of type string.
 */
export const AI_LAB_FIELDS = {
  first_name: 'first_name',
  last_name: 'last_name',
  email: 'email',
  notes: 'notes',
  yes_no_feedback: 'yes_no_feedback',
  maxime_coments: 'maxime_coments',
  linkedin_url: 'linkedin_url',
  whatsapp_number: 'whatsapp_number',
  skills: 'skills',
  problem: 'problem',
  first_users: 'first_users',
  favorite_startup: 'favorite_startup',
  about_us: 'about_us',
  refer: 'refer',
  solo_team: 'solo_team',
  availability: 'availability',
  apply_accelerator: 'apply_accelerator',
  notes_2: 'notes_2',
  other: 'other',
  entry: 'entry',
  decision: 'decision',
} as const;

/**
 * Get all available field names from the table reference
 */
const getAvailableFieldNames = (): string[] => {
  return aiLabTableRef.fields.map((field) => field.key);
};

/**
 * Optional filter parameters for precise data fetching.
 * All fields are optional - if none provided, fetches all records.
 *
 * Available fields in AI Lab table:
 * - Personal info: first_name, last_name, email, linkedin_url, whatsapp_number
 * - Application: skills, problem, first_users, favorite_startup, about_us, refer, solo_team, availability, apply_accelerator, entry, decision
 * - Feedback: yes_no_feedback, maxime_coments, notes, notes_2, other
 */
const filterSchema = z
  .object({
    /**
     * Airtable formula for filtering records.
     * Examples:
     * - "{decision} = 'Accepted'" - exact match on decision field
     * - "SEARCH('ML', {skills})" - text search in skills field
     * - "AND({decision} = 'Accepted', {apply_accelerator} = 'Yes')" - multiple conditions
     * - "SEARCH('John', {first_name})" - search for first name containing "John"
     * Field names must match exactly (case-sensitive, snake_case format).
     * Available fields: first_name, last_name, email, skills, problem, decision, apply_accelerator, solo_team, availability, entry, and more.
     */
    filterFormula: z
      .string()
      .optional()
      .describe('Airtable filter formula (e.g., "{decision} = \'Accepted\'")'),

    /**
     * Field name to search for text (case-insensitive partial match).
     * If provided, searches for the searchText within this field.
     * Common searchable fields: skills, problem, first_name, last_name, email, about_us, notes
     */
    searchField: z
      .string()
      .optional()
      .describe(
        'Field name to search within (e.g., "skills", "problem", "first_name")',
      ),

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
     * Example: { fieldName: "decision", fieldValue: "Accepted" }
     * Common fields for exact match: decision, apply_accelerator, solo_team, availability, entry
     */
    fieldName: z
      .string()
      .optional()
      .describe(
        'Field name for exact match (e.g., "decision", "apply_accelerator")',
      ),
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

/**
 * Mastra tool for fetching AI Lab data from Airtable.
 * Supports optional filtering for precise queries. If no filters provided, returns all records.
 *
 * Available fields in AI Lab records:
 * - Personal: first_name, last_name, email, linkedin_url, whatsapp_number
 * - Application: skills, problem, first_users, favorite_startup, about_us, refer, solo_team, availability, apply_accelerator, entry, decision
 * - Feedback: yes_no_feedback, maxime_coments, notes, notes_2, other
 */
export const getAiLabDataTool = createTool({
  id: 'ai-lab-data-tool',
  description: `Get data about the AI Lab from Airtable. Supports optional filtering for precise queries. If no filters provided, returns all records.

Available fields: first_name, last_name, email, linkedin_url, whatsapp_number, skills, problem, first_users, favorite_startup, about_us, refer, solo_team, availability, apply_accelerator, notes, notes_2, yes_no_feedback, maxime_coments, other, entry, decision.

Common use cases:
- Filter by decision: {fieldName: "decision", fieldValue: "Accepted"}
- Search skills: {searchField: "skills", searchText: "ML"}
- Search problems: {searchField: "problem", searchText: "healthcare"}
- Complex filters: {filterFormula: "AND({decision} = 'Accepted', {apply_accelerator} = 'Yes')"}`,
  inputSchema: filterSchema,
  outputSchema: z.object({
    data: z
      .array(
        z.object({
          id: z.string().describe('The ID of the record'),
          fields: z
            .record(z.string(), z.any())
            .describe(
              'The fields of the record. Common fields: first_name, last_name, email, skills, problem, decision, apply_accelerator, solo_team, availability, entry, notes, etc.',
            ),
        }),
      )
      .describe('The filtered data about the AI Lab'),
    totalRecords: z.number().describe('Total number of records returned'),
  }),
  execute: async (input) => {
    const data = await getAiLabData(input);
    return data;
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
    // Validate field name exists in table reference
    const availableFields = getAvailableFieldNames();
    if (!availableFields.includes(input.searchField)) {
      throw new Error(
        `Invalid searchField: "${input.searchField}". Available fields: ${availableFields.join(', ')}`,
      );
    }
    // Use SEARCH for case-insensitive text matching
    // Escape single quotes in search text
    const escapedText = input.searchText.replace(/'/g, "''");
    conditions.push(`SEARCH('${escapedText}', {${input.searchField}})`);
  }

  if (input.fieldName && input.fieldValue) {
    // Validate field name exists in table reference
    const availableFields = getAvailableFieldNames();
    if (!availableFields.includes(input.fieldName)) {
      throw new Error(
        `Invalid fieldName: "${input.fieldName}". Available fields: ${availableFields.join(', ')}`,
      );
    }
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

/**
 * Fetches records from the AI Lab Airtable base with optional filtering.
 * Validates required environment variables before making API calls.
 */
const getAiLabData = async (input: z.infer<typeof filterSchema> = {}) => {
  if (
    !process.env.AIRTABLE_API_KEY ||
    !process.env.AI_LAB_BASE_ID ||
    !process.env.AI_LAB_TABLE_ID
  ) {
    throw new Error('Missing Airtable environment variables');
  }

  // Initialize Airtable client and connect to base
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
    process.env.AI_LAB_BASE_ID,
  );

  // Build select options with optional filter
  const selectOptions: { filterByFormula?: string } = {};
  const filterFormula = buildFilterFormula(input);

  if (filterFormula) {
    selectOptions.filterByFormula = filterFormula;
  }

  // Fetch records (with filter if provided, otherwise all records)
  const records = await base(process.env.AI_LAB_TABLE_ID)
    .select(selectOptions)
    .all();

  // Transform records to simplified format with id and fields
  return {
    data: records.map((record) => ({
      id: record.id,
      fields: record.fields,
    })),
    totalRecords: records.length,
  };
};
