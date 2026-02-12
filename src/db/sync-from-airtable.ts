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

/**
 * Sync founders from Airtable
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

    // Helper: convert arrays/selects to comma-separated string
    const arrayToString = (value: any): string | undefined => {
      if (value === null || value === undefined) return undefined;
      if (Array.isArray(value)) return value.join(', ');
      return String(value);
    };

    for (const record of records) {
      const fields = record.fields;

      // Airtable field names from pnpm run db:pull-columns (Onboarding Form 2026)
      const data = {
        id: record.id,
        name: arrayToString(fields['Full Name']),
        email: arrayToString(fields['Email']),
        whatsapp: arrayToString(fields['Whatsapp']),
        yourPhoto:
          fields['Your photo'] != null
            ? JSON.stringify(fields['Your photo'])
            : undefined,
        gender: arrayToString(fields['Gender']),
        linkedin: arrayToString(fields['LinkedIn']),
        nationality: arrayToString(fields['Nationality']),
        introduction: arrayToString(fields['Introduce yourself']),
        techSkills: arrayToString(fields['Hard Skills']),
        industries: arrayToString(fields['Industries']),
        companiesWorked: arrayToString(fields['Notable companies worked at']),
        education: arrayToString(fields['Main education']),
        degree: arrayToString(fields['Degree']),
        academicField: arrayToString(fields['Field of study']),
        founder: arrayToString(fields['Founder']),
        batch: 'W26',
        yearsOfXp: arrayToString(fields['Years of XP']),
        status: arrayToString(fields['Status']),
        leftProgram: arrayToString(fields['left program']),
        trackRecord: arrayToString(fields['Track record']),
        rolesICouldTake: arrayToString(fields['Roles I could take']),
        interestedInWorkingOn: arrayToString(
          fields['What I am interested in working on:'],
        ),
        confirmEnrolment: arrayToString(fields['Status']),
        existingProjectIdea: arrayToString(
          fields['Do you have an existing project/idea ?'],
        ),
        projectExplanation: arrayToString(
          fields['If yes, explain it in a few words'],
        ),
        existingCofounderName: arrayToString(
          fields['If yes, write their names below.'],
        ),
        joiningWithCofounder: arrayToString(
          fields['Do you have existing co-founders in the batch ?'],
        ),
        openToJoinAnotherProject: arrayToString(
          fields['Are you open to join another project during the program? '],
        ),
        anythingToLetUsKnow: arrayToString(
          fields['Anything else worth mentioning'],
        ),
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

    const arrayToString = (value: any): string | undefined => {
      if (value === null || value === undefined) return undefined;
      if (Array.isArray(value)) return value.join(', ');
      return String(value);
    };

    for (const record of records) {
      const fields = record.fields;

      // Airtable field names from pnpm run db:pull-columns (session_event_feb26)
      const data = {
        id: record.id,
        name: fields['Name'] as string | undefined,
        date: fields['Date'] ? new Date(fields['Date'] as string) : null,
        programWeek: fields['Program Week'] as string | undefined,
        typeOfSession: arrayToString(fields['Type of session']),
        speaker: fields['Speaker'] as string | undefined,
        notesFeedback: fields['Notes / Feedback'] as string | undefined,
        slackInstructions: fields['Slack Instruction & Email Commu'] as string | undefined,
        emails: fields['Emails'] as string | undefined,
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
    if (table) log(`Syncing only: ${table}`);
    if (batch) log(`Note: Batch filtering not implemented in sync script`);

    const stats = {
      totalInserted: 0,
      totalUpdated: 0,
    };

    // Sync based on arguments
    if (!table || table === 'founders') {
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
