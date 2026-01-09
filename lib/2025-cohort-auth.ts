import 'dotenv/config';
import { airtableApiClient } from './airtable-api-client.js';
import { log } from './print-helpers.js';

/**
 * Example function demonstrating Airtable token-based authentication.
 *
 * This function fetches data from the "Main SU 2025" table in the cohort base.
 * Airtable uses simple Bearer token authentication via the Authorization header.
 *
 * Equivalent curl command:
 * curl https://api.airtable.com/v0/appUx24OUnsGrJyLU/Main%20SU%202025 \
 *   -H "Authorization: Bearer YOUR_SECRET_API_TOKEN"
 *
 * @returns Promise that resolves with the table data
 */
export async function fetchMainSU2025Data() {
  if (!process.env.AIRTABLE_API_KEY) {
    throw new Error('AIRTABLE_API_KEY environment variable is required');
  }

  const baseId = process.env.SU_2025_BASE_ID || 'appUx24OUnsGrJyLU';
  const tableName = 'Main SU 2025';

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
 * Generic function to fetch data from any Airtable table using token-based authentication.
 *
 * @param baseId - The Airtable base ID (e.g., 'appUx24OUnsGrJyLU')
 * @param tableName - The name of the table (e.g., 'Main SU 2025')
 * @param options - Optional query parameters (maxRecords, view, filterByFormula, etc.)
 * @returns Promise that resolves with the table data
 */
export async function fetchAirtableTableData(
  baseId: string,
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

  log(`Fetching data from table "${tableName}" in base ${baseId}...`, {});

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
//   const mainSUData = await fetchMainSU2025Data();
//   console.log('Main SU 2025 records:', mainSUData.records);
//
//   // Using the generic function
//   const tableData = await fetchAirtableTableData(
//     'appUx24OUnsGrJyLU',
//     'Main SU 2025',
//     { maxRecords: 10 }
//   );
//   console.log('Table records:', tableData.records);
// }
