import 'dotenv/config';
import { airtableApiClient } from './airtable-api-client.js';
import { log } from './print-helpers.js';

/**
 * Example function demonstrating Airtable token-based authentication for AI Lab.
 *
 * This function fetches data from the "Table 1" table in the AI Lab base.
 * Airtable uses simple Bearer token authentication via the Authorization header.
 *
 * Equivalent curl command:
 * curl https://api.airtable.com/v0/appPMwMyRE3baXEBV/Table%201 \
 *   -H "Authorization: Bearer YOUR_SECRET_API_TOKEN"
 *
 * @returns Promise that resolves with the table data
 */
export async function fetchAiLabTable1Data() {
  if (!process.env.AIRTABLE_API_KEY) {
    throw new Error('AIRTABLE_API_KEY environment variable is required');
  }

  const baseId = process.env.AI_LAB_BASE_ID || 'appPMwMyRE3baXEBV';
  const tableName = 'Table 1';

  // URL encode the table name for the API endpoint
  const encodedTableName = encodeURIComponent(tableName);

  log(`Fetching data from table "${tableName}" in base ${baseId}...`, {});

  try {
    // The airtableApiClient already includes the Authorization header
    // with the Bearer token from AIRTABLE_API_KEY
    const response = await airtableApiClient
      .get(`${baseId}/${encodedTableName}`)
      .json<{
        records: Array<{
          id: string;
          fields: Record<string, any>;
        }>;
        offset?: string;
      }>();

    log(`Successfully fetched ${response.records.length} records`, {});
    return response;
  } catch (error: any) {
    log(`Error fetching data:`, error);
    throw error;
  }
}

/**
 * Generic function to fetch data from any Airtable table in the AI Lab base using token-based authentication.
 *
 * @param tableName - The name of the table (e.g., 'Table 1')
 * @param options - Optional query parameters (maxRecords, view, filterByFormula, etc.)
 * @returns Promise that resolves with the table data
 */
export async function fetchAiLabTableData(
  tableName: string,
  options?: {
    maxRecords?: number;
    view?: string;
    filterByFormula?: string;
    fields?: string[];
  }
) {
  if (!process.env.AIRTABLE_API_KEY) {
    throw new Error('AIRTABLE_API_KEY environment variable is required');
  }

  const baseId = process.env.AI_LAB_BASE_ID || 'appPMwMyRE3baXEBV';
  const encodedTableName = encodeURIComponent(tableName);
  const url = new URL(`${baseId}/${encodedTableName}`, 'https://api.airtable.com/v0/');

  // Add query parameters if provided
  if (options) {
    if (options.maxRecords) {
      url.searchParams.set('maxRecords', options.maxRecords.toString());
    }
    if (options.view) {
      url.searchParams.set('view', options.view);
    }
    if (options.filterByFormula) {
      url.searchParams.set('filterByFormula', options.filterByFormula);
    }
    if (options.fields) {
      options.fields.forEach((field) => {
        url.searchParams.append('fields[]', field);
      });
    }
  }

  log(`Fetching data from table "${tableName}" in AI Lab base ${baseId}...`, {});

  try {
    // Make request with Bearer token authentication
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Airtable API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = (await response.json()) as {
      records: Array<{
        id: string;
        fields: Record<string, any>;
        createdTime?: string;
      }>;
      offset?: string;
    };

    log(`Successfully fetched ${data.records.length} records`, {});
    return data;
  } catch (error: any) {
    log(`Error fetching data from Airtable:`, error);
    throw error;
  }
}

// Example usage (commented out):
// async function example() {
//   // Using the specific function
//   const table1Data = await fetchAiLabTable1Data();
//   console.log('Table 1 records:', table1Data.records);
//
//   // Using the generic function
//   const tableData = await fetchAiLabTableData(
//     'Table 1',
//     { maxRecords: 10 }
//   );
//   console.log('Table records:', tableData.records);
// }
