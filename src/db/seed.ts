#!/usr/bin/env tsx
/**
 * Seed script to populate Turso database from JSON files
 *
 * This script reads the readable JSON exports from Airtable and populates
 * the Turso database with founders, session events, and startups data.
 *
 * Usage: tsx src/db/seed.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { db } from './index.js';
import { founders, sessionEvents, startups } from './schemas/index.js';
import { message, error as printError, log as printLog } from '../../lib/print-helpers.js';

// Wrapper functions that match our usage
const log = (msg: string) => printLog(msg, '');
const error = (msg: string) => printError(msg, '');

// CRITICAL: The Airtable JSON export has SEVERELY MISALIGNED column headers!
// These mappings must match the actual misaligned data structure from sync-from-airtable.ts
// Field order matches pioneers-profile-book-table-ref.json
const FOUNDERS_FIELD_MAP: Record<string, string> = {
  // Basic Information (table-ref index 0-4)
  Name: 'name', // Misaligned: contains name (index 0)
  Status: 'status', // Misaligned: contains status (index 1)
  Whatsapp: 'whatsapp', // Misaligned: contains phone (index 2)
  Email: 'email', // Misaligned: contains email (index 3)
  'Your photo': 'yourPhoto', // Photo is an array of objects (index 4)
  // Project Information (table-ref index 5-9)
  'Do you have an existing project/idea ?': 'existingProjectIdea', // Misaligned (index 5)
  ' explain it in a few words': 'projectExplanation', // Misaligned (partial field name) (index 6)
  'Are you joining with an existing cofounder? If yes': 'existingCofounderName', // Misaligned (partial field name) (index 7)
  'I confirm my enrolment to the Pioneers program Batch': 'openToJoinAnotherProject', // (index 8)
  ' please insert his/her name below': 'joiningWithCofounder', // Misaligned (partial field name) (index 9)
  // Professional Profile (table-ref index 10-16)
  LinkedIn: 'linkedin', // Misaligned: contains LinkedIn (index 10)
  'Roles I could take': 'techSkills', // Misaligned (index 11)
  Industries: 'industries', // Misaligned (partial field name) (index 12)
  // Note: 'Name' at index 13 maps to 'rolesICouldTake' but we can't have duplicate keys
  'Track record / something I am proud of ': 'trackRecordProud', // Misaligned (index 14)
  'Tech Skills': 'interestedInWorkingOn', // Misaligned (index 15)
  'Introduction:': 'introduction', // (index 16)
  // Professional Background (table-ref index 17)
  'Companies Worked': 'companiesWorked', // Misaligned (index 17)
  // Education (table-ref index 18-23)
  Education: 'education', // Misaligned (index 18)
  Nationality: 'nationality', // Misaligned: contains nationality (index 19)
  Gender: 'gender', // Misaligned (index 20)
  YearsofXP: 'yearsOfXp', // Misaligned (index 21)
  Degree: 'degree', // Misaligned (index 22)
  AcademicField: 'academicField', // (index 23)
  // Relationships (table-ref index 24)
  Founder: 'founder', // (index 24)
  // Note: 'Gender' at index 25 maps to 'leftProgram' but we can't have duplicate keys
};

const SESSION_EVENTS_FIELD_MAP: Record<string, string> = {
  Name: 'name',
  Date: 'date',
  'Program Week': 'programWeek',
  'Type of session': 'typeOfSession',
  Speaker: 'speaker',
  Emails: 'emails',
  'Slack Instruction & Email Commu': 'slackInstructionEmailCommu',
  Participants: 'participants',
  'Notes / Feedback': 'notesFeedback',
  'Notes 2': 'notes2',
  Attachments: 'attachments',
  'Name (from Linked)': 'nameFromLinked',
};

const STARTUPS_FIELD_MAP: Record<string, string> = {
  Startup: 'startup',
  Industry: 'industry',
  'Startup in a word': 'startupInAWord',
  'Team Members': 'teamMembers',
  'Traction Summary': 'tractionSummary',
  'Detailed Progress': 'detailedProgress',
  'Previous Decks': 'previousDecks',
};

/**
 * Helper function to safely parse integer values
 */
function safeParseInt(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Helper function to convert arrays to comma-separated strings
 */
function arrayToString(value: any): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

/**
 * Transform JSON record to database format
 * CRITICAL: Matches the transformation logic from sync-from-airtable.ts
 */
function transformFounder(recordId: string, record: any): any {
  const fields = record.fields || {};
  const transformed: any = { id: recordId };

  // Process fields from the field map
  for (const [jsonKey, dbKey] of Object.entries(FOUNDERS_FIELD_MAP)) {
    const value = fields[jsonKey];

    if (value === undefined || value === null) {
      continue;
    }

    // Handle special type conversions
    if (dbKey === 'yourPhoto') {
      // Photo is an array of objects - stringify it
      transformed[dbKey] = JSON.stringify(value);
    } else if (dbKey === 'yearsOfXp') {
      // Parse as integer
      transformed[dbKey] = safeParseInt(value);
    } else if (Array.isArray(value)) {
      // Convert arrays to comma-separated strings
      transformed[dbKey] = arrayToString(value);
    } else if (typeof value === 'object' && value !== null) {
      // Skip objects like [object Object]
      continue;
    } else if (typeof value === 'string' && value.includes('[object Object]')) {
      // Skip stringified objects
      continue;
    } else {
      transformed[dbKey] = typeof value === 'string' ? value : String(value);
    }
  }

  // Handle fields that can't be in the map due to duplicate keys
  // Note: Due to misaligned headers, some field names appear multiple times
  // These additional mappings match sync-from-airtable.ts lines 122 and 140

  // rolesICouldTake: maps from 'Name' at index 13 (but we already used 'Name' for name at index 0)
  // This would need special handling if the JSON structure actually has duplicate keys
  // For now, commenting out as the standard field map handles the primary occurrence
  // transformed.rolesICouldTake = arrayToString(fields['Name']); // Would conflict with name field

  // leftProgram: maps from 'Gender' at index 25 (but we already used 'Gender' for gender at index 20)
  // This would need special handling if the JSON structure actually has duplicate keys
  // transformed.leftProgram = arrayToString(fields['Gender']); // Would conflict with gender field

  return transformed;
}

/**
 * Transform session event record
 */
function transformSessionEvent(recordId: string, record: any): any {
  const fields = record.fields || {};
  const transformed: any = { id: recordId };

  for (const [jsonKey, dbKey] of Object.entries(SESSION_EVENTS_FIELD_MAP)) {
    const value = fields[jsonKey];

    if (value === undefined || value === null) {
      continue;
    }

    // Handle date conversion
    if (dbKey === 'date') {
      try {
        const dateValue = new Date(value);
        transformed[dbKey] = dateValue;
      } catch (e) {
        log(`Warning: Could not parse date: ${value}`);
        continue;
      }
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      continue;
    } else if (typeof value === 'string' && value.includes('[object Object]')) {
      continue;
    } else {
      transformed[dbKey] = typeof value === 'string' ? value : String(value);
    }
  }

  return transformed;
}

/**
 * Transform startup record
 */
function transformStartup(recordId: string, record: any): any {
  const fields = record.fields || {};
  const transformed: any = { id: recordId };

  for (const [jsonKey, dbKey] of Object.entries(STARTUPS_FIELD_MAP)) {
    const value = fields[jsonKey];

    if (value === undefined || value === null) {
      continue;
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
      continue;
    } else if (typeof value === 'string' && value.includes('[object Object]')) {
      continue;
    } else {
      transformed[dbKey] = typeof value === 'string' ? value : String(value);
    }
  }

  return transformed;
}

/**
 * Read and parse JSON file
 */
function readJsonFile(filePath: string): any {
  try {
    const fullPath = resolve(process.cwd(), filePath);
    const content = readFileSync(fullPath, 'utf-8');
    return JSON.parse(content);
  } catch (err: any) {
    error(`Failed to read ${filePath}: ${err.message}`);
    throw err;
  }
}

/**
 * Seed founders table
 */
async function seedFounders() {
  log('Seeding founders...');

  const jsonData = readJsonFile('data/2025-Cohort_Data/JSON/founders/pioneers_profile_book_table_records_readable.json');
  const records = Object.entries(jsonData);

  if (records.length === 0) {
    log('No founder records found');
    return;
  }

  const transformed = records
    .map(([recordId, record]) => transformFounder(recordId, record))
    .filter(record => record.name); // Only include records with names

  if (transformed.length === 0) {
    log('No valid founder records to insert');
    return;
  }

  // Delete existing records
  await db.delete(founders);

  // Insert in batches of 100
  const batchSize = 100;
  for (let i = 0; i < transformed.length; i += batchSize) {
    const batch = transformed.slice(i, i + batchSize);
    await db.insert(founders).values(batch);
    log(`Inserted ${Math.min(i + batchSize, transformed.length)}/${transformed.length} founders`);
  }

  message(`✓ Successfully seeded ${transformed.length} founders`);
}

/**
 * Seed session events table
 */
async function seedSessionEvents() {
  log('Seeding session events...');

  const jsonData = readJsonFile('data/2025-Cohort_Data/JSON/founders/sessions_events_2025_readable.json');
  const records = Object.entries(jsonData);

  if (records.length === 0) {
    log('No session event records found');
    return;
  }

  const transformed = records
    .map(([recordId, record]) => transformSessionEvent(recordId, record))
    .filter(record => record.name); // Only include records with names

  if (transformed.length === 0) {
    log('No valid session event records to insert');
    return;
  }

  // Delete existing records
  await db.delete(sessionEvents);

  // Insert in batches of 100
  const batchSize = 100;
  for (let i = 0; i < transformed.length; i += batchSize) {
    const batch = transformed.slice(i, i + batchSize);
    await db.insert(sessionEvents).values(batch);
    log(`Inserted ${Math.min(i + batchSize, transformed.length)}/${transformed.length} session events`);
  }

  message(`✓ Successfully seeded ${transformed.length} session events`);
}

/**
 * Seed startups table
 */
async function seedStartups() {
  log('Seeding startups...');

  const jsonData = readJsonFile('data/2025-Cohort_Data/JSON/founders/startups_2025_readable.json');
  const records = Object.entries(jsonData);

  if (records.length === 0) {
    log('No startup records found');
    return;
  }

  const transformed = records
    .map(([recordId, record]) => transformStartup(recordId, record))
    .filter(record => record.startup); // Only include records with startup names

  if (transformed.length === 0) {
    log('No valid startup records to insert');
    return;
  }

  // Delete existing records
  await db.delete(startups);

  // Insert in batches of 100
  const batchSize = 100;
  for (let i = 0; i < transformed.length; i += batchSize) {
    const batch = transformed.slice(i, i + batchSize);
    await db.insert(startups).values(batch);
    log(`Inserted ${Math.min(i + batchSize, transformed.length)}/${transformed.length} startups`);
  }

  message(`✓ Successfully seeded ${transformed.length} startups`);
}

/**
 * Main seed function
 */
async function main() {
  try {
    log('Starting database seed...');

    await seedFounders();
    await seedSessionEvents();
    await seedStartups();

    message('✓ Database seeding completed successfully!');
    process.exit(0);
  } catch (err: any) {
    error(`Seed failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
