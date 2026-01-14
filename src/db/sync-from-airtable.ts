#!/usr/bin/env tsx
/**
 * Incremental sync script to fetch new data from Airtable and update Turso database
 *
 * This script:
 * 1. Fetches fresh data from Airtable using the API
 * 2. Transforms using field ID mappings
 * 3. Upserts into Turso (insert new, update existing)
 * 4. Preserves existing records - doesn't delete anything
 *
 * Usage:
 *   pnpm db:sync                    # Sync all tables
 *   pnpm db:sync --table founders   # Sync specific table
 *   pnpm db:sync --batch S25        # Sync only specific batch
 */

import Airtable from 'airtable';
import { db } from './index.js';
import { foundersGridData, sessionEvents, startups } from './schemas/index.js';
import { message, error as printError, log as printLog } from '../../lib/print-helpers.js';
import { eq } from 'drizzle-orm';

const log = (msg: string) => printLog(msg, '');
const error = (msg: string) => printError(msg, '');

// Initialize Airtable
if (!process.env.AIRTABLE_API_KEY) {
  throw new Error('AIRTABLE_API_KEY environment variable is required');
}
if (!process.env.SU_2025_BASE_ID) {
  throw new Error('SU_2025_BASE_ID environment variable is required');
}

const airtable = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY });
const base = airtable.base(process.env.SU_2025_BASE_ID);

// Table IDs/names - Update these to match your Airtable base structure
const TABLES = {
  GRID_VIEW: process.env.GRID_VIEW_TABLE_ID || 'Grid View (all)',
  PROFILE_BOOK: process.env.PROFILE_BOOK_TABLE_ID || 'Pioneers Profile Book',
  SESSIONS: process.env.SESSIONS_TABLE_ID || 'Sessions & Events 2025',
  STARTUPS: process.env.STARTUPS_TABLE_ID || 'Startups 2025',
};

/**
 * Normalize batch value
 */
function normalizeBatch(batch: string | null | undefined): string | null {
  if (!batch) return null;

  return batch
    .replace(/Summer\s*2025/i, 'S25')
    .replace(/Summer\s*25/i, 'S25')
    .replace(/Fall\s*2024/i, 'F24')
    .replace(/Fall\s*24/i, 'F24')
    .replace(/Spring\s*2024/i, 'S24')
    .replace(/Spring\s*24/i, 'S24')
    .replace(/Fall\s*2023/i, 'F23')
    .replace(/Fall\s*23/i, 'F23')
    .trim();
}

/**
 * Sync Grid View founders from Airtable
 */
async function syncGridViewFounders(batchFilter?: string) {
  log('Syncing Grid View founders from Airtable...');

  try {
    // Fetch from Airtable
    const formula = batchFilter ? `{Batch N} = "${batchFilter}"` : '';
    const records = await base(TABLES.GRID_VIEW)
      .select({ filterByFormula: formula })
      .all();

    log(`Fetched ${records.length} records from Airtable Grid View`);

    if (records.length === 0) {
      log('No records to sync');
      return { inserted: 0, updated: 0 };
    }

    let inserted = 0;
    let updated = 0;

    // Process each record
    for (const record of records) {
      const fields = record.fields;

      // Transform to database format (handling misaligned headers)
      const data = {
        id: record.id,
        name: fields['Mobile number'] as string | undefined, // Misaligned: contains name
        emailAddress: fields['Email address'] as string | undefined,
        mobileNumber: fields['Linkedin'] as string | undefined, // Misaligned: contains phone
        linkedin: fields['Intro message'] as string | undefined, // Misaligned: contains LinkedIn
        nationality: fields['Name'] as string | undefined, // Misaligned: contains nationality
        batch: normalizeBatch(fields['Batch N'] as string | undefined),
        age: fields['Age'] as string | undefined,
        technical: fields['Technical'] as string | undefined,
        itExpertise: fields['IT Expertise'] as string | undefined,
        proKeywords: fields['Pitch'] as string | undefined, // Misaligned: contains pro keywords
        personalKeywords: fields['Notes'] as string | undefined, // Misaligned: contains personal keywords
        pitch: fields['Anything you want to let us know?'] as string | undefined,
        introMessage: fields[' please write his/her name below."'] as string | undefined,
        photo: fields['Photo'] as string | undefined,
      };

      // Check if record exists
      const existing = await db
        .select()
        .from(foundersGridData)
        .where(eq(foundersGridData.id, record.id))
        .limit(1);

      if (existing.length > 0) {
        // Update existing record
        await db
          .update(foundersGridData)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(foundersGridData.id, record.id));
        updated++;
      } else {
        // Insert new record
        await db.insert(foundersGridData).values(data);
        inserted++;
      }
    }

    message(`✓ Grid View sync complete: ${inserted} inserted, ${updated} updated`);
    return { inserted, updated };
  } catch (err: any) {
    error(`Grid View sync failed: ${err.message}`);
    throw err;
  }
}

/**
 * Sync Profile Book founders from Airtable
 */
async function syncProfileBookFounders(batchFilter?: string) {
  log('Syncing Profile Book founders from Airtable...');

  try {
    // Fetch from Airtable
    const formula = batchFilter ? `{Batch} = "${batchFilter}"` : '';
    const records = await base(TABLES.PROFILE_BOOK)
      .select({ filterByFormula: formula })
      .all();

    log(`Fetched ${records.length} records from Airtable Profile Book`);

    if (records.length === 0) {
      log('No records to sync');
      return { inserted: 0, updated: 0 };
    }

    let inserted = 0;
    let updated = 0;

    // Process each record and add to Grid View table
    for (const record of records) {
      const fields = record.fields;

      // Transform to Grid View format
      const data = {
        id: record.id,
        name: fields['Email'] as string | undefined, // Misaligned: contains name
        emailAddress: fields['Education'] as string | undefined, // Misaligned: contains email
        linkedin: fields['Industries'] as string | undefined, // Misaligned: contains LinkedIn
        nationality: fields['LinkedIn'] as string | undefined, // Misaligned: contains nationality
        batch: normalizeBatch(fields['Batch'] as string | undefined),
        mobileNumber: fields['Track record / something I am proud of '] as string | undefined, // Misaligned: contains phone
        technical: fields['Technical'] as string | undefined,
        age: fields['Age'] as string | undefined,
        itExpertise: fields['IT Expertise'] as string | undefined,
        proKeywords: fields['Pro Keywords'] as string | undefined,
        personalKeywords: fields['Personal Keywords'] as string | undefined,
        pitch: fields['Pitch'] as string | undefined,
        introMessage: fields['Intro Message'] as string | undefined,
        photo: fields['Your Photo'] as string | undefined,
      };

      // Check if record exists in Grid View table
      const existing = await db
        .select()
        .from(foundersGridData)
        .where(eq(foundersGridData.id, record.id))
        .limit(1);

      if (existing.length > 0) {
        // Update existing record
        await db
          .update(foundersGridData)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(foundersGridData.id, record.id));
        updated++;
      } else {
        // Insert new record
        await db.insert(foundersGridData).values(data);
        inserted++;
      }
    }

    message(`✓ Profile Book sync complete: ${inserted} inserted, ${updated} updated`);
    return { inserted, updated };
  } catch (err: any) {
    error(`Profile Book sync failed: ${err.message}`);
    throw err;
  }
}

/**
 * Sync session events from Airtable
 */
async function syncSessionEvents() {
  log('Syncing session events from Airtable...');

  try {
    const records = await base(TABLES.SESSIONS).select().all();

    log(`Fetched ${records.length} session events from Airtable`);

    if (records.length === 0) {
      log('No records to sync');
      return { inserted: 0, updated: 0 };
    }

    let inserted = 0;
    let updated = 0;

    for (const record of records) {
      const fields = record.fields;

      const data = {
        id: record.id,
        name: fields['Name'] as string | undefined,
        date: fields['Date'] ? new Date(fields['Date'] as string) : null,
        programWeek: fields['Program Week'] as string | undefined,
        typeOfSession: fields['Type of session'] as string | undefined,
        speaker: fields['Speaker'] as string | undefined,
        emails: fields['Emails'] as string | undefined,
        slackInstructionEmailCommu: fields['Slack Instruction & Email Commu'] as string | undefined,
        participants: fields['Participants'] as string | undefined,
        notesFeedback: fields['Notes / Feedback'] as string | undefined,
        notes2: fields['Notes 2'] as string | undefined,
        attachments: fields['Attachments'] as string | undefined,
        nameFromLinked: fields['Name (from Linked)'] as string | undefined,
      };

      const existing = await db
        .select()
        .from(sessionEvents)
        .where(eq(sessionEvents.id, record.id))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(sessionEvents)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(sessionEvents.id, record.id));
        updated++;
      } else {
        await db.insert(sessionEvents).values(data);
        inserted++;
      }
    }

    message(`✓ Session events sync complete: ${inserted} inserted, ${updated} updated`);
    return { inserted, updated };
  } catch (err: any) {
    error(`Session events sync failed: ${err.message}`);
    throw err;
  }
}

/**
 * Sync startups from Airtable
 */
async function syncStartups() {
  log('Syncing startups from Airtable...');

  try {
    const records = await base(TABLES.STARTUPS).select().all();

    log(`Fetched ${records.length} startups from Airtable`);

    if (records.length === 0) {
      log('No records to sync');
      return { inserted: 0, updated: 0 };
    }

    let inserted = 0;
    let updated = 0;

    for (const record of records) {
      const fields = record.fields;

      const data = {
        id: record.id,
        startup: fields['Startup'] as string | undefined,
        industry: fields['Industry'] as string | undefined,
        startupInAWord: fields['Startup in a word'] as string | undefined,
        teamMembers: fields['Team Members'] as string | undefined,
        tractionSummary: fields['Traction Summary'] as string | undefined,
        detailedProgress: fields['Detailed Progress'] as string | undefined,
        previousDecks: fields['Previous Decks'] as string | undefined,
      };

      const existing = await db
        .select()
        .from(startups)
        .where(eq(startups.id, record.id))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(startups)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(startups.id, record.id));
        updated++;
      } else {
        await db.insert(startups).values(data);
        inserted++;
      }
    }

    message(`✓ Startups sync complete: ${inserted} inserted, ${updated} updated`);
    return { inserted, updated };
  } catch (err: any) {
    error(`Startups sync failed: ${err.message}`);
    throw err;
  }
}

/**
 * Main sync function
 */
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const tableArg = args.find(arg => arg.startsWith('--table='));
    const batchArg = args.find(arg => arg.startsWith('--batch='));

    const table = tableArg?.split('=')[1];
    const batch = batchArg?.split('=')[1];

    log('Starting Airtable → Turso sync...');
    if (batch) log(`Filtering by batch: ${batch}`);
    if (table) log(`Syncing only: ${table}`);

    const stats = {
      totalInserted: 0,
      totalUpdated: 0,
    };

    // Sync based on arguments
    if (!table || table === 'founders') {
      const gridResult = await syncGridViewFounders(batch);
      const profileResult = await syncProfileBookFounders(batch);
      stats.totalInserted += gridResult.inserted + profileResult.inserted;
      stats.totalUpdated += gridResult.updated + profileResult.updated;
    }

    if (!table || table === 'sessions') {
      const result = await syncSessionEvents();
      stats.totalInserted += result.inserted;
      stats.totalUpdated += result.updated;
    }

    if (!table || table === 'startups') {
      const result = await syncStartups();
      stats.totalInserted += result.inserted;
      stats.totalUpdated += result.updated;
    }

    message(`\n✓ Sync completed successfully!`);
    message(`  Total inserted: ${stats.totalInserted}`);
    message(`  Total updated: ${stats.totalUpdated}`);

    process.exit(0);
  } catch (err: any) {
    error(`Sync failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
