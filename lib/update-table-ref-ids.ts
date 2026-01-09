/**
 * Utility functions to update table reference JSON files with Airtable field IDs.
 *
 * Usage examples:
 *
 * 1. Update all tables in a base (automatically discovers tables and files):
 *    import { updateBaseTableRefs } from './lib/update-table-ref-ids.js';
 *    await updateBaseTableRefs('data/2025-Cohort_Data');
 *
 * 2. Update all bases:
 *    import { updateAllBases } from './lib/update-table-ref-ids.js';
 *    await updateAllBases();
 *
 * 3. Using the CLI script:
 *    tsx lib/update-table-refs.ts data/2025-Cohort_Data
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, basename } from 'path';
import Airtable from 'airtable';
import { airtableApiClient } from './airtable-api-client.js';
import { log } from './print-helpers.js';

/**
 * Gets the AI Lab base ID from environment variables.
 * Throws error if not set.
 */
function getAiLabBaseId(): string {
  const baseId = process.env.AI_LAB_BASE_ID;
  if (!baseId) {
    throw new Error('AI_LAB_BASE_ID environment variable is required');
  }
  return baseId;
}

/**
 * Gets the Cohort base ID from environment variables.
 * Throws error if not set.
 */
function getCohortBaseId(): string {
  const baseId = process.env.SU_2025_BASE_ID;
  if (!baseId) {
    throw new Error('SU_2025_BASE_ID environment variable is required');
  }
  return baseId;
}


interface FieldRef {
  key: string;
  type: string;
  id: string | null;
  index: number;
}

interface TableRef {
  fields: FieldRef[];
}

/**
 * Normalizes a table name to match file naming conventions.
 * Converts "Table Name" to "table-name" for JSON files.
 */
function normalizeTableName(tableName: string): string {
  return tableName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Finds a matching JSON file for a table name.
 * Looks for files matching pattern: {normalized-table-name}-table-ref.json
 */
function findJsonFile(tableName: string, dataDir: string): string | null {
  const normalized = normalizeTableName(tableName);
  const jsonFileName = `${normalized}-table-ref.json`;
  const jsonPath = join(dataDir, jsonFileName);

  if (existsSync(jsonPath)) {
    return jsonPath;
  }

  return null;
}

/**
 * Finds a matching CSV file for a table name.
 * Looks for files matching pattern: {Table Name}-Grid view.csv
 */
function findCsvFile(tableName: string, dataDir: string): string | null {
  const csvFileName = `${tableName}-Grid view.csv`;
  const csvPath = join(dataDir, csvFileName);

  if (existsSync(csvPath)) {
    return csvPath;
  }

  // Try alternative patterns
  const files = readdirSync(dataDir);
  const csvFiles = files.filter((f) => f.endsWith('.csv') && f.includes(tableName));
  if (csvFiles.length > 0) {
    return join(dataDir, csvFiles[0]);
  }

  return null;
}

/**
 * Fetches field IDs from Airtable and updates the corresponding JSON reference file.
 *
 * @param baseId - The Airtable base ID
 * @param tableId - The Airtable table ID
 * @param jsonFilePath - Path to the JSON reference file to update
 * @param csvHeaderRow - Optional: First row of CSV file with actual field names from Airtable
 *                       If provided, will match fields by name. Otherwise, matches by index.
 * @returns Promise that resolves when the file is updated
 */
async function updateTableRefIds(
  baseId: string,
  tableId: string,
  jsonFilePath: string,
  csvHeaderRow?: string[]
): Promise<void> {
  if (!process.env.AIRTABLE_API_KEY) {
    throw new Error('AIRTABLE_API_KEY environment variable is required');
  }

  // Read the existing JSON file
  const jsonContent = readFileSync(jsonFilePath, 'utf-8');
  const tableRef: TableRef = JSON.parse(jsonContent);

  // Fetch fields from Airtable API
  log(`Fetching fields from Airtable base ${baseId}, table ${tableId}...`, {});
  const response = await airtableApiClient
    .get(`${baseId}`)
    .json<{ fields: Array<{ id: string; name: string; type: string }> }>();

  const airtableFields = response.fields;
  log(`Found ${airtableFields.length} fields in Airtable`, {});

  // Create a map of Airtable field names to field IDs
  const fieldMap = new Map<string, string>();
  airtableFields.forEach((field) => {
    fieldMap.set(field.name, field.id);
  });

  // Update the JSON file with field IDs
  let updatedCount = 0;
  tableRef.fields.forEach((fieldRef, index) => {
    let fieldId: string | null = null;

    if (csvHeaderRow && csvHeaderRow[index]) {
      // Match by CSV header name (which should match Airtable field name)
      const csvFieldName = csvHeaderRow[index];

      // Try exact match first
      fieldId = fieldMap.get(csvFieldName) || null;

      // If no exact match, try case-insensitive match
      if (!fieldId) {
        for (const [airtableName, id] of fieldMap.entries()) {
          if (airtableName.toLowerCase() === csvFieldName.toLowerCase()) {
            fieldId = id;
            log(`Matched "${csvFieldName}" to "${airtableName}" (case-insensitive)`, {});
            break;
          }
        }
      }

      if (fieldId) {
        log(`Matched field "${csvFieldName}" (index ${index}) to ID: ${fieldId}`, {});
      } else {
        log(`Warning: Could not find Airtable field for CSV header "${csvFieldName}" at index ${index}`, {});
      }
    } else {
      // Match by index (assumes Airtable fields are in the same order as JSON fields)
      if (index < airtableFields.length) {
        fieldId = airtableFields[index].id;
        log(`Matched field at index ${index} ("${airtableFields[index].name}") to ID: ${fieldId}`, {});
      } else {
        log(`Warning: Index ${index} exceeds number of Airtable fields (${airtableFields.length})`, {});
      }
    }

    if (fieldId) {
      fieldRef.id = fieldId;
      updatedCount++;
    }
  });

  // Write the updated JSON back to the file
  writeFileSync(jsonFilePath, JSON.stringify(tableRef, null, 2) + '\n', 'utf-8');
  log(`Updated ${updatedCount} field IDs in ${jsonFilePath}`, {});
}

/**
 * Helper function to read CSV header row from a CSV file.
 *
 * @param csvFilePath - Path to the CSV file
 * @returns Array of header names
 */
export function readCsvHeader(csvFilePath: string): string[] {
  const csvContent = readFileSync(csvFilePath, 'utf-8');
  const firstLine = csvContent.split('\n')[0];

  // Simple CSV parsing (handles quoted fields)
  const headers: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < firstLine.length; i++) {
    const char = firstLine[i];
    const nextChar = i < firstLine.length - 1 ? firstLine[i + 1] : null;

    if (char === '"') {
      // Handle escaped quotes ("")
      if (nextChar === '"' && inQuotes) {
        currentField += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      headers.push(currentField.trim());
      currentField = '';
    } else {
      currentField += char;
    }
  }

  // Add the last field
  if (currentField.trim() || headers.length > 0) {
    headers.push(currentField.trim());
  }

  return headers;
}

/**
 * Determines which base ID to use based on the data directory.
 */
function getBaseIdForDataDir(dataDir: string): string {
  if (dataDir.includes('2025-Cohort_Data') || dataDir.includes('Cohort')) {
    return getCohortBaseId();
  } else if (dataDir.includes('ai-lab') || dataDir.includes('ai_lab')) {
    return getAiLabBaseId();
  }
  // Default to cohort base if unclear
  return getCohortBaseId();
}

/**
 * Extracts table name from a JSON filename.
 * Example: "exit-form-table-ref.json" -> "Exit Form"
 */
function extractTableNameFromJsonFile(filename: string): string {
  // Remove "-table-ref.json" suffix
  const name = filename.replace(/-table-ref\.json$/, '');
  // Convert kebab-case to Title Case
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Finds all JSON table reference files in a directory.
 */
function findJsonFiles(dataDir: string): Array<{ path: string; tableName: string }> {
  const files = readdirSync(dataDir);
  const jsonFiles = files.filter((f) => f.endsWith('-table-ref.json'));

  return jsonFiles.map((file) => {
    const path = join(dataDir, file);
    const tableName = extractTableNameFromJsonFile(file);
    return { path, tableName };
  });
}

/**
 * Tries to get field metadata by accessing the table via SDK and making API calls.
 * Since we can't use the base schema endpoint, we try to access fields using table name.
 */
async function getFieldsByTableName(
  baseId: string,
  tableName: string
): Promise<Array<{ id: string; name: string; type: string }> | null> {
  if (!process.env.AIRTABLE_API_KEY) {
    return null;
  }

  // Try using table name directly in the API endpoint
  // Some Airtable endpoints might accept table names
  try {
    const response = await airtableApiClient
      .get(`${baseId}/${encodeURIComponent(tableName)}/fields`)
      .json<{ fields: Array<{ id: string; name: string; type: string }> }>();
    return response.fields;
  } catch (error: any) {
    // If that fails, try URL-encoded version
    try {
      const response = await airtableApiClient
        .get(`${baseId}/${encodeURIComponent(tableName)}/fields`)
        .json<{ fields: Array<{ id: string; name: string; type: string }> }>();
      return response.fields;
    } catch (err) {
      // Table name doesn't work, we need table ID
      return null;
    }
  }
}

/**
 * Fetches all tables from an Airtable base and updates matching JSON reference files.
 * Discovers tables by scanning JSON files in the directory and matching them to Airtable tables.
 * Uses environment variables to determine which base to use based on the data directory.
 *
 * @param dataDir - Directory containing the JSON and CSV files (e.g., 'data/2025-Cohort_Data')
 * @returns Promise that resolves when all matching files are updated
 */
export async function updateBaseTableRefs(
  dataDir: string
): Promise<void> {
  if (!process.env.AIRTABLE_API_KEY) {
    throw new Error('AIRTABLE_API_KEY environment variable is required');
  }

  const baseId = getBaseIdForDataDir(dataDir);
  log(`Using base ID ${baseId} for directory ${dataDir}`, {});

  // Find all JSON table reference files in the directory
  const jsonFiles = findJsonFiles(dataDir);
  log(`Found ${jsonFiles.length} JSON table reference files`, {});

  if (jsonFiles.length === 0) {
    log(`No JSON table reference files found in ${dataDir}`, {});
    return;
  }

  // Initialize Airtable base
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(baseId);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const { path: jsonFilePath, tableName } of jsonFiles) {
    try {
      log(`Processing table "${tableName}" from file ${jsonFilePath}...`, {});

      // Try to get fields using table name
      let airtableFields = await getFieldsByTableName(baseId, tableName);

      // If that didn't work, try normalized name
      if (!airtableFields) {
        const normalizedName = normalizeTableName(tableName);
        if (normalizedName !== tableName.toLowerCase()) {
          airtableFields = await getFieldsByTableName(baseId, normalizedName);
        }
      }

      // If still no fields, try to verify table exists via SDK and provide helpful error
      if (!airtableFields) {
        try {
          const table = base(tableName);
          await table.select({ maxRecords: 1 }).firstPage();
          // Table exists but we can't get field metadata without table ID
          log(`Table "${tableName}" exists but cannot fetch field metadata without table ID.`, {});
          log(`The /v0/meta/bases/{baseId} endpoint requires special permissions.`, {});
          log(`Please provide table IDs manually or use a different API key with base schema access.`, {});
          skippedCount++;
          continue;
        } catch (sdkError) {
          log(`Table "${tableName}" not found in base ${baseId}`, {});
          skippedCount++;
          continue;
        }
      }

      // Found fields, proceed with update
      log(`Found ${airtableFields.length} fields for table "${tableName}"`, {});

      // Find matching CSV file (optional)
      const csvFilePath = findCsvFile(tableName, dataDir);
      let csvHeaders: string[] | undefined;
      if (csvFilePath) {
        log(`Found CSV file: ${csvFilePath}`, {});
        csvHeaders = readCsvHeader(csvFilePath);
      }

      // Update the JSON file with field IDs
      log(`Updating ${jsonFilePath} for table "${tableName}"...`, {});
      await updateTableRefIdsByName(baseId, tableName, jsonFilePath, csvHeaders, airtableFields);
      updatedCount++;
    } catch (error) {
      log(`Error updating ${jsonFilePath}:`, error);
      skippedCount++;
    }
  }

  log(`✓ Successfully updated ${updatedCount} table reference files`, {});
  if (skippedCount > 0) {
    log(`⚠ Skipped ${skippedCount} files (could not find matching tables)`, {});
  }
}

/**
 * Updates table reference IDs using table name and pre-fetched fields.
 */
async function updateTableRefIdsByName(
  baseId: string,
  tableName: string,
  jsonFilePath: string,
  csvHeaderRow: string[] | undefined,
  airtableFields: Array<{ id: string; name: string; type: string }>
): Promise<void> {
  // Read the existing JSON file
  const jsonContent = readFileSync(jsonFilePath, 'utf-8');
  const tableRef: TableRef = JSON.parse(jsonContent);

  // Create a map of Airtable field names to field IDs
  const fieldMap = new Map<string, string>();
  airtableFields.forEach((field) => {
    fieldMap.set(field.name, field.id);
  });

  // Update the JSON file with field IDs (same logic as before)
  let updatedCount = 0;
  tableRef.fields.forEach((fieldRef, index) => {
    let fieldId: string | null = null;

    if (csvHeaderRow && csvHeaderRow[index]) {
      const csvFieldName = csvHeaderRow[index];
      fieldId = fieldMap.get(csvFieldName) || null;

      if (!fieldId) {
        for (const [airtableName, id] of fieldMap.entries()) {
          if (airtableName.toLowerCase() === csvFieldName.toLowerCase()) {
            fieldId = id;
            break;
          }
        }
      }
    } else {
      if (index < airtableFields.length) {
        fieldId = airtableFields[index].id;
      }
    }

    if (fieldId) {
      fieldRef.id = fieldId;
      updatedCount++;
    }
  });

  // Write the updated JSON back to the file
  writeFileSync(jsonFilePath, JSON.stringify(tableRef, null, 2) + '\n', 'utf-8');
  log(`Updated ${updatedCount} field IDs in ${jsonFilePath}`, {});
}

/**
 * Updates all bases automatically using environment variables.
 * Updates both the cohort base (SU_2025_BASE_ID) and AI Lab base (AI_LAB_BASE_ID).
 *
 * @param cohortDataDir - Directory for cohort data (default: 'data/2025-Cohort_Data')
 * @param aiLabDataDir - Directory for AI Lab data (default: 'data')
 * @returns Promise that resolves when all bases are updated
 */
export async function updateAllBases(
  cohortDataDir: string = 'data/2025-Cohort_Data',
  aiLabDataDir: string = 'data'
): Promise<void> {
  log('Starting update for all bases...', {});

  // Update cohort base
  try {
    const cohortBaseId = getCohortBaseId();
    log(`Updating cohort base (${cohortBaseId})...`, {});
    await updateBaseTableRefs(cohortDataDir);
  } catch (error) {
    log(`Error updating cohort base:`, error);
  }

  // Update AI Lab base
  try {
    const aiLabBaseId = getAiLabBaseId();
    log(`Updating AI Lab base (${aiLabBaseId})...`, {});
    await updateBaseTableRefs(aiLabDataDir);
  } catch (error) {
    log(`Error updating AI Lab base:`, error);
  }

  log('✓ Finished updating all bases', {});
}
