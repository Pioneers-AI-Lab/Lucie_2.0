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
import {
  founderAirtableFieldIds,
  sessionEventAirtableFieldIds,
  startupAirtableFieldIds,
} from '../../lib/airtable-field-ids-ref.js';

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

      // Helper function to safely parse integer values
      const safeParseInt = (value: any): number | null => {
        if (value === null || value === undefined || value === '') return null;
        const parsed = typeof value === 'number' ? value : parseInt(value, 10);
        return isNaN(parsed) ? null : parsed;
      };

      // Transform to founders schema using Airtable field IDs
      const data = {
        id: record.id,
        name: fields[founderAirtableFieldIds.name] as string | undefined,
        email: fields[founderAirtableFieldIds.email] as string | undefined,
        whatsapp: fields[founderAirtableFieldIds.whatsapp] as string | undefined,
        linkedin: fields[founderAirtableFieldIds.linkedin] as string | undefined,
        nationality: fields[founderAirtableFieldIds.nationality] as string | undefined,
        status: fields[founderAirtableFieldIds.status] as string | undefined,
        batch: normalizeBatch(fields['Batch'] as string | undefined),
        yourPhoto: fields[founderAirtableFieldIds.yourPhoto] as string | undefined,
        techSkills: fields[founderAirtableFieldIds.techSkills] as string | undefined,
        rolesICouldTake: fields[founderAirtableFieldIds.rolesICouldTake] as string | undefined,
        trackRecordProud: fields[founderAirtableFieldIds.trackRecordProud] as string | undefined,
        companiesWorked: fields[founderAirtableFieldIds.companiesWorked] as string | undefined,
        degree: fields[founderAirtableFieldIds.degree] as string | undefined,
        existingProjectIdea: fields[founderAirtableFieldIds.existingProjectIdea] as string | undefined,
        education: fields[founderAirtableFieldIds.education] as string | undefined,
        gender: fields[founderAirtableFieldIds.gender] as string | undefined,
        leftProgram: fields[founderAirtableFieldIds.leftProgram] as string | undefined,
        industries: fields[founderAirtableFieldIds.industries] as string | undefined,
        interestedInWorkingOn: fields[founderAirtableFieldIds.interestedInWorkingOn] as string | undefined,
        yearsOfXp: safeParseInt(fields[founderAirtableFieldIds.yearsOfXp]),
        introduction: fields[founderAirtableFieldIds.introduction] as string | undefined,
        academicField: fields[founderAirtableFieldIds.academicField] as string | undefined,
        projectExplanation: fields[founderAirtableFieldIds.projectExplanation] as string | undefined,
        joiningWithCofounder: fields[founderAirtableFieldIds.joiningWithCofounder] as string | undefined,
        existingCofounderName: fields[founderAirtableFieldIds.existingCofounderName] as string | undefined,
        openToJoinAnotherProject: fields[founderAirtableFieldIds.openToJoinAnotherProject] as string | undefined,
        founder: fields[founderAirtableFieldIds.founder] as string | undefined,
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
        name: fields[sessionEventAirtableFieldIds.name] as string | undefined,
        date: fields[sessionEventAirtableFieldIds.date] ? new Date(fields[sessionEventAirtableFieldIds.date] as string) : null,
        programWeek: fields[sessionEventAirtableFieldIds.programWeek] as string | undefined,
        typeOfSession: fields[sessionEventAirtableFieldIds.typeOfSession] as string | undefined,
        speaker: fields[sessionEventAirtableFieldIds.speaker] as string | undefined,
        emails: fields[sessionEventAirtableFieldIds.emails] as string | undefined,
        slackInstructionEmailCommu: fields[sessionEventAirtableFieldIds.slackInstructionEmailCommu] as string | undefined,
        participants: fields[sessionEventAirtableFieldIds.participants] as string | undefined,
        notesFeedback: fields[sessionEventAirtableFieldIds.notesFeedback] as string | undefined,
        notes2: fields[sessionEventAirtableFieldIds.notes2] as string | undefined,
        attachments: fields[sessionEventAirtableFieldIds.attachments] as string | undefined,
        nameFromLinked: fields[sessionEventAirtableFieldIds.nameFromLinked] as string | undefined,
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
        startup: fields[startupAirtableFieldIds.startup] as string | undefined,
        industry: fields[startupAirtableFieldIds.industry] as string | undefined,
        startupInAWord: fields[startupAirtableFieldIds.startupInAWord] as string | undefined,
        teamMembers: fields[startupAirtableFieldIds.teamMembers] as string | undefined,
        tractionSummary: fields[startupAirtableFieldIds.tractionSummary] as string | undefined,
        detailedProgress: fields[startupAirtableFieldIds.detailedProgress] as string | undefined,
        previousDecks: fields[startupAirtableFieldIds.previousDecks] as string | undefined,
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
