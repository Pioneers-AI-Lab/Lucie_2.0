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

/**
 * Field name mappings from Profile Book readable JSON to database schema
 *
 * CRITICAL: The Airtable JSON export has SEVERELY MISALIGNED column headers!
 * These mappings are based on what the data ACTUALLY contains (verified for Dylan Mérigaud record).
 * DO NOT "fix" these to be logical - they must match the actual misaligned data!
 *
 * This mapping is for Profile Book fields only (matches pioneers-profile-book-table-ref.json).
 * Grid View fields (mobileNumber, age, introMessage, etc.) have been removed.
 *
 * Complete verified misalignments:
 *   'Email' → name (Dylan Mérigaud)
 *   'Education' → email (merigaudconsulting@gmail.com)
 *   'Industries' → linkedin (https://www.linkedin.com/in/dylanmerigaud)
 *   'LinkedIn' → nationality (France)
 *   'Nationality' → status (No, I have other commitments.)
 *   'Status' → trackRecordProud (- Worked for 7 years...)
 *   'Track record...' → whatsapp (+33781877734)
 *   'Name' → rolesICouldTake (Design,Tech Dev...)
 *   ... and many more (see mappings below)
 */
const FOUNDERS_FIELD_MAP: Record<string, string> = {
  // === CRITICAL MISALIGNMENTS (verified) ===
  Email: 'name', // Contains: person's name
  Education: 'email', // Contains: actual email address
  Industries: 'linkedin', // Contains: LinkedIn URL
  LinkedIn: 'nationality', // Contains: actual nationality
  Nationality: 'status', // Contains: availability status
  Status: 'trackRecordProud', // Contains: track record text
  'Track record / something I am proud of ': 'whatsapp', // Contains: phone number
  Name: 'rolesICouldTake', // Contains: roles list
  'Are you open to join another project during the program? ':
    'companiesWorked', // Contains: companies list
  'Companies Worked': 'degree', // Contains: degree level
  Degree: 'existingProjectIdea', // Contains: Yes/No for project
  'Do you have an existing project/idea ?': 'education', // Contains: education institution
  Founder: 'gender', // Contains: gender
  Gender: 'leftProgram', // Contains: enrollment confirmation
  '"If yes': 'industries', // Contains: industries list
  'Tech Skills': 'interestedInWorkingOn', // Contains: what they want to work on
  'What I am interested in working on:': 'yearsOfXp', // Contains: years (as string like "7")
  'Roles I could take': 'techSkills', // Contains: actual tech skills

  // === Project/cofounder fields ===
  ' explain it in a few words"': 'projectExplanation',
  ' please insert his/her name below."': 'joiningWithCofounder',
  '"Are you joining with an existing cofounder? If yes':
    'existingCofounderName',

  // === Fields that match correctly ===
  'Introduction:': 'introduction',
  'Academic Field': 'academicField',
  'Your Photo': 'yourPhoto',
  'left program': 'leftProgram', // Note: lowercase in records file
  'I confirm my enrolment to the Pioneers program Batch SU25.':
    'openToJoinAnotherProject',
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
 * Transform JSON record to database format
 */
function transformFounder(recordId: string, record: any): any {
  const fields = record.fields || {};
  const transformed: any = { id: recordId };

  for (const [jsonKey, dbKey] of Object.entries(FOUNDERS_FIELD_MAP)) {
    const value = fields[jsonKey];

    if (value === undefined || value === null) {
      continue;
    }

    // Handle special type conversions
    if (dbKey === 'yearsOfXp') {
      // Try to parse as integer
      const parsed = parseInt(value, 10);
      transformed[dbKey] = isNaN(parsed) ? null : parsed;
    } else if (Array.isArray(value)) {
      // Convert arrays to comma-separated strings (e.g., Tech Skills, Industries)
      transformed[dbKey] = value.join(', ');
    } else if (typeof value === 'object' && value !== null) {
      // Skip objects like [object Object] or photo objects
      continue;
    } else if (typeof value === 'string' && value.includes('[object Object]')) {
      // Skip stringified objects
      continue;
    } else {
      transformed[dbKey] = typeof value === 'string' ? value : String(value);
    }
  }

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
