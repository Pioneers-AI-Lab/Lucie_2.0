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
 *   Note: Batch filtering not available - Batch field not in Profile Book schema
 */

import Airtable from 'airtable';
import { db } from './index.js';
import { founders, sessionEvents, startups } from './schemas/index.js';
import { message, error as printError, log as printLog } from '../../lib/print-helpers.js';
import { eq } from 'drizzle-orm';
// Note: Field IDs are not used because Airtable API returns human-readable field names
// import { founderAirtableFieldIds, sessionEventAirtableFieldIds, startupAirtableFieldIds } from '../../lib/airtable-field-ids-ref.js';

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
  FOUNDERS:
    process.env.SU_2025_FOUNDERS_PROFILE_BOOK_TABLE_ID ||
    'Pioneers Profile Book',
  SESSIONS:
    process.env.SU_2025_SESSIONS_EVENTS_TABLE_ID || 'Sessions & Events 2025',
  STARTUPS: process.env.SU_2025_STARTUPS_TABLE_ID || 'Startups 2025',
};

// Note: Batch field removed from Profile Book schema - batch filtering not available

/**
 * Sync founders from Airtable
 * Note: Batch filtering not available - Batch field not in Profile Book schema
 */
async function syncFounders() {
  log('Syncing founders from Airtable...');

  try {
    // Fetch from Airtable
    const records = await base(TABLES.FOUNDERS).select().all();

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

      // Helper function to safely parse integer values
      const safeParseInt = (value: any): number | null => {
        if (value === null || value === undefined || value === '') return null;
        const parsed = typeof value === 'number' ? value : parseInt(value, 10);
        return isNaN(parsed) ? null : parsed;
      };

      // Helper function to convert arrays to comma-separated strings
      const arrayToString = (value: any): string | undefined => {
        if (value === null || value === undefined) return undefined;
        if (Array.isArray(value)) return value.join(', ');
        return String(value);
      };

      // Transform to founders schema using Airtable human-readable field names
      // CRITICAL: The Airtable JSON export has SEVERELY MISALIGNED column headers!
      // These mappings match seed.ts and must match the actual misaligned data!
      // Field order matches pioneers-profile-book-table-ref.json
      const data = {
        id: record.id,
        // Basic Information (table-ref index 0-4)
        name: arrayToString(fields['Name']), // Misaligned: contains name (index 0)
        email: arrayToString(fields['Email']), // Misaligned: contains email (index 3)
        status: arrayToString(fields['Status']), // Misaligned: contains status (index 1)
        whatsapp: arrayToString(fields['Whatsapp']), // Misaligned: contains phone (index 2)
        yourPhoto: fields['Your photo']
          ? JSON.stringify(fields['Your photo'])
          : undefined, // Photo is an array of objects (index 4)
        // Project Information (table-ref index 5-9)
        existingProjectIdea: arrayToString(
          fields['Do you have an existing project/idea ?'],
        ), // Misaligned (index 5)
        projectExplanation: arrayToString(fields[' explain it in a few words']), // Misaligned (partial field name) (index 6)
        existingCofounderName: arrayToString(
          fields['Are you joining with an existing cofounder? If yes'],
        ), // Misaligned (partial field name) (index 7)
        openToJoinAnotherProject: arrayToString(
          fields['I confirm my enrolment to the Pioneers program Batch'],
        ), // (index 8)
        joiningWithCofounder: arrayToString(
          fields[' please insert his/her name below'],
        ), // Misaligned (partial field name) (index 9)
        // Professional Profile (table-ref index 10-16)
        linkedin: arrayToString(fields['LinkedIn']), // Misaligned: contains LinkedIn (index 10)
        techSkills: arrayToString(fields['Roles I could take']), // Misaligned (index 11)
        industries: arrayToString(fields['Industries']), // Misaligned (partial field name) (index 12)
        rolesICouldTake: arrayToString(fields['Name']), // Misaligned (index 13)
        trackRecordProud: arrayToString(
          fields['Track record / something I am proud of '],
        ), // Misaligned (index 14)
        interestedInWorkingOn: arrayToString(fields['Tech Skills']), // Misaligned (index 15)
        introduction: arrayToString(fields['Introduction:']), // (index 16)
        // Professional Background (table-ref index 17)
        companiesWorked: arrayToString(fields['Companies Worked']), // Misaligned (index 17)
        // Education (table-ref index 18-23)
        education: arrayToString(fields['Education']), // Misaligned (index 18)
        nationality: arrayToString(fields['Nationality']), // Misaligned: contains nationality (index 19)
        gender: arrayToString(fields['Gender']), // Misaligned (index 20)
        yearsOfXp: arrayToString(fields['Years of XP']), // Misaligned (index 21)
        degree: arrayToString(fields['Degree']), // Misaligned (index 22)
        academicField: arrayToString(fields['Academic Field']), // (index 23)
        // Relationships (table-ref index 24)
        founder: arrayToString(fields['Founder']), // (index 24)
        // Status (table-ref index 25)
        leftProgram: arrayToString(fields['Gender']), // Misaligned (index 25)
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

    message(
      `✓ Founders sync complete: ${inserted} inserted, ${updated} updated`,
    );
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

      // Use human-readable field names (Airtable API returns these, not field IDs)
      const data = {
        id: record.id,
        name: fields['Name'] as string | undefined,
        date: fields['Date'] ? new Date(fields['Date'] as string) : null,
        programWeek: fields['Program Week'] as string | undefined,
        typeOfSession: fields['Type of session'] as string | undefined,
        speaker: fields['Speaker'] as string | undefined,
        emails: fields['Emails'] as string | undefined,
        slackInstructionEmailCommu: fields[
          'Slack Instruction & Email Commu'
        ] as string | undefined,
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

    message(
      `✓ Session events sync complete: ${inserted} inserted, ${updated} updated`,
    );
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

      // Use human-readable field names (Airtable API returns these, not field IDs)
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

    message(
      `✓ Startups sync complete: ${inserted} inserted, ${updated} updated`,
    );
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
    const tableArg = args.find((arg) => arg.startsWith('--table='));
    const batchArg = args.find((arg) => arg.startsWith('--batch='));

    const table = tableArg?.split('=')[1];
    const batch = batchArg?.split('=')[1];

    log('Starting Airtable → Turso sync...');
    if (batch)
      log(
        `⚠️  Batch filtering not available - Batch field not in Profile Book schema`,
      );
    if (table) log(`Syncing only: ${table}`);

    const stats = {
      totalInserted: 0,
      totalUpdated: 0,
    };

    // Sync based on arguments
    if (!table || table === 'founders') {
      // Note: batch parameter ignored - Batch field not in Profile Book schema
      const result = await syncFounders();
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
