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
import { founders, sessionEvents, startups } from './schemas/index.js';
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
  FOUNDERS: process.env.PROFILE_BOOK_TABLE_ID || 'Pioneers Profile Book',
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
 * Sync founders from Airtable
 */
async function syncFounders(batchFilter?: string) {
  log('Syncing founders from Airtable...');

  try {
    // Fetch from Airtable
    const formula = batchFilter ? `{Batch} = "${batchFilter}"` : '';
    const records = await base(TABLES.FOUNDERS)
      .select({ filterByFormula: formula })
      .all();

    log(`Fetched ${records.length} founders from Airtable`);

    if (records.length === 0) {
      log('No records to sync');
      return { inserted: 0, updated: 0 };
    }

    let inserted = 0;
    let updated = 0;

    // Process each record
    for (const record of records) {
      const fields = record.fields;

      // Transform to founders schema (handling misaligned headers from Airtable)
      const data = {
        id: record.id,
        name: fields['Email'] as string | undefined, // Misaligned: contains name
        email: fields['Education'] as string | undefined, // Misaligned: contains email
        whatsapp: fields['Track record / something I am proud of '] as string | undefined, // Misaligned: contains phone
        linkedin: fields['Industries'] as string | undefined, // Misaligned: contains LinkedIn
        nationality: fields['LinkedIn'] as string | undefined, // Misaligned: contains nationality
        status: fields['Nationality'] as string | undefined, // Misaligned: contains status
        batch: normalizeBatch(fields['Batch'] as string | undefined),
        yourPhoto: fields['Your Photo'] as string | undefined,
        techSkills: fields['Roles I could take'] as string | undefined, // Misaligned
        rolesICouldTake: fields['Name'] as string | undefined, // Misaligned
        trackRecordProud: fields['Status'] as string | undefined, // Misaligned
        companiesWorked: fields['Are you open to join another project during the program? '] as string | undefined, // Misaligned
        degree: fields['Companies Worked'] as string | undefined, // Misaligned
        existingProjectIdea: fields['Degree'] as string | undefined, // Misaligned
        education: fields['Do you have an existing project/idea ?'] as string | undefined, // Misaligned
        gender: fields['Founder'] as string | undefined, // Misaligned
        leftProgram: fields['Gender'] as string | undefined, // Misaligned
        industries: fields['"If yes'] as string | undefined, // Misaligned
        interestedInWorkingOn: fields['Tech Skills'] as string | undefined, // Misaligned
        yearsOfXp: fields['What I am interested in working on:'] ?
          parseInt(fields['What I am interested in working on:'] as string, 10) : null,
        introduction: fields['Introduction:'] as string | undefined,
        academicField: fields['Academic Field'] as string | undefined,
        projectExplanation: fields[' explain it in a few words"'] as string | undefined,
        joiningWithCofounder: fields[' please insert his/her name below."'] as string | undefined,
        existingCofounderName: fields['"Are you joining with an existing cofounder? If yes'] as string | undefined,
        openToJoinAnotherProject: fields['I confirm my enrolment to the Pioneers program Batch SU25.'] as string | undefined,
      };

      // Check if record exists
      const existing = await db
        .select()
        .from(founders)
        .where(eq(founders.id, record.id))
        .limit(1);

      if (existing.length > 0) {
        // Update existing record
        await db
          .update(founders)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(founders.id, record.id));
        updated++;
      } else {
        // Insert new record
        await db.insert(founders).values(data);
        inserted++;
      }
    }

    message(`✓ Founders sync complete: ${inserted} inserted, ${updated} updated`);
    return { inserted, updated };
  } catch (err: any) {
    error(`Founders sync failed: ${err.message}`);
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
      const result = await syncFounders(batch);
      stats.totalInserted += result.inserted;
      stats.totalUpdated += result.updated;
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
