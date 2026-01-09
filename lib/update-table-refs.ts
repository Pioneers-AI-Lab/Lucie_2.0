#!/usr/bin/env tsx
/**
 * Script to update all table reference JSON files with Airtable field IDs.
 * Automatically discovers all tables in the base and matches them to JSON/CSV files.
 * Uses environment variables (SU_2025_BASE_ID, AI_LAB_BASE_ID) to determine which base to use.
 *
 * Usage:
 *   tsx lib/update-table-refs.ts [dataDir]
 *
 * Examples:
 *   tsx lib/update-table-refs.ts data/2025-Cohort_Data
 *   tsx lib/update-table-refs.ts data
 *   tsx lib/update-table-refs.ts  # Updates all bases
 */

import 'dotenv/config';
import { updateBaseTableRefs, updateAllBases } from './update-table-ref-ids.js';
import { log } from './print-helpers.js';

async function main() {
  const args = process.argv.slice(2);

  try {
    if (args.length === 0) {
      // Update all bases if no directory specified
      log('No directory specified, updating all bases...', {});
      await updateAllBases();
    } else {
      const dataDir = args[0];
      log(`Starting update process for directory ${dataDir}...`, {});
      await updateBaseTableRefs(dataDir);
    }
    log('✓ All updates completed successfully', {});
  } catch (error) {
    console.error('Error updating table references:', error);
    process.exit(1);
  }
}

main();
