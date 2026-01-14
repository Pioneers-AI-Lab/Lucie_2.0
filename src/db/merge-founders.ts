#!/usr/bin/env tsx
/**
 * Merge founders from Profile Book into Grid View table
 *
 * This script:
 * 1. Reads all founders from the `founders` table (Profile Book - 37 records)
 * 2. Maps their fields to the `founders_grid_data` schema
 * 3. Transforms batch value from "Summer 2025" to "S25"
 * 4. Inserts them into `founders_grid_data` table
 *
 * Usage: tsx src/db/merge-founders.ts
 */

import { db } from './index.js';
import { founders, foundersGridData } from './schemas/index.js';
import { message, error as printError, log as printLog } from '../../lib/print-helpers.js';

const log = (msg: string) => printLog(msg, '');
const error = (msg: string) => printError(msg, '');

/**
 * Normalize batch value
 * "Summer 2025" -> "S25"
 * "Summer 25" -> "S25"
 * "Fall 2024" -> "F24"
 * etc.
 */
function normalizeBatch(batch: string | null): string | null {
  if (!batch) return null;

  const normalized = batch
    .replace(/Summer\s*2025/i, 'S25')
    .replace(/Summer\s*25/i, 'S25')
    .replace(/Fall\s*2024/i, 'F24')
    .replace(/Spring\s*2024/i, 'S24')
    .trim();

  return normalized;
}

/**
 * Map founders record to founders_grid_data schema
 */
function mapToGridData(founder: any): any {
  // Note: Due to Airtable misalignment, founders.name contains EMAIL
  // and founders.email contains actual email (verified from query results)

  return {
    id: founder.id,
    name: founder.name, // This is actually the email due to misalignment, but keeping as-is
    emailAddress: founder.email, // Map to emailAddress field
    mobileNumber: founder.whatsapp, // Map whatsapp to mobileNumber
    linkedin: founder.linkedin,
    nationality: founder.nationality,
    batch: normalizeBatch(founder.batch), // Normalize batch value
    technical: founder.technical,
    age: founder.age,
    itExpertise: founder.itExpertise,
    proKeywords: founder.proKeywords,
    personalKeywords: founder.personalKeywords,
    pitch: founder.pitch,
    introMessage: founder.introMessage,
    photo: founder.yourPhoto,
  };
}

async function main() {
  try {
    log('Starting founders merge...');

    // Read all founders from Profile Book table
    const profileFounders = await db.select().from(founders);
    log(`Found ${profileFounders.length} founders in Profile Book table`);

    if (profileFounders.length === 0) {
      log('No founders to merge');
      return;
    }

    // Map to grid data schema
    const mappedFounders = profileFounders.map(mapToGridData);

    // Show batch transformations
    log('\nBatch transformations:');
    const batchCounts: Record<string, number> = {};
    mappedFounders.forEach(f => {
      const batch = f.batch || 'null';
      batchCounts[batch] = (batchCounts[batch] || 0) + 1;
    });
    console.table(batchCounts);

    // Insert into founders_grid_data
    log('\nInserting into founders_grid_data table...');

    // Insert in batches to avoid issues
    const batchSize = 20;
    let inserted = 0;

    for (let i = 0; i < mappedFounders.length; i += batchSize) {
      const batch = mappedFounders.slice(i, i + batchSize);

      try {
        await db.insert(foundersGridData).values(batch);
        inserted += batch.length;
        log(`Inserted ${inserted}/${mappedFounders.length} founders`);
      } catch (err: any) {
        // Check if it's a duplicate key error
        if (err.message?.includes('UNIQUE constraint failed')) {
          log(`Skipping batch due to duplicates (records may already exist)`);

          // Try inserting one by one to identify which are duplicates
          for (const record of batch) {
            try {
              await db.insert(foundersGridData).values(record);
              inserted++;
            } catch (dupErr: any) {
              if (dupErr.message?.includes('UNIQUE constraint failed')) {
                log(`Skipping duplicate record: ${record.id}`);
              } else {
                throw dupErr;
              }
            }
          }
        } else {
          throw err;
        }
      }
    }

    message(`✓ Successfully merged ${inserted} founders into founders_grid_data`);

    // Verify final counts
    const profileCount = await db.select().from(founders);
    const gridCount = await db.select().from(foundersGridData);

    log(`\nFinal counts:`);
    log(`  - Profile Book: ${profileCount.length} records`);
    log(`  - Grid View (after merge): ${gridCount.length} records`);

    message('✓ Merge completed successfully!');
    process.exit(0);
  } catch (err: any) {
    error(`Merge failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
