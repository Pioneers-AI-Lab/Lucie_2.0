#!/usr/bin/env tsx
/**
 * Seed script to populate Turso database from JSON files
 *
 * This script reads the readable JSON exports from Airtable and populates
 * the Turso database with founders, session events, startups, and FAQ data.
 *
 * Usage: tsx src/db/seed.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { randomUUID } from 'crypto';
import { db } from './index.js';
import { founders, sessionEvents, startups, faq } from './schemas/index.js';
import { message, error as printError, log as printLog } from '../../lib/print-helpers.js';

const log = (msg: string) => printLog(msg, '');
const error = (msg: string) => printError(msg, '');

const FOUNDERS_FIELD_MAP: Record<string, string> = {
  Founder: 'founder',
  Name: 'name',
  Whatsapp: 'whatsapp',
  Email: 'email',
  'Your photo': 'yourPhoto',
  Education: 'education',
  Nationality: 'nationality',
  Gender: 'gender',
  YearsofXP: 'yearsOfXp',
  Degree: 'degree',
  AcademicField: 'academicField',
  LinkedIn: 'linkedin',
  Introduction: 'introduction',
  'Tech Skills': 'techSkills',
  Industries: 'industries',
  'Roles I could take': 'rolesICouldTake',
  'Companies Worked': 'companiesWorked',
  Batch: 'batch',
};

const SESSION_EVENTS_FIELD_MAP: Record<string, string> = {
  Name: 'name',
  Date: 'date',
  'Program Week': 'programWeek',
  'Type of session': 'typeOfSession',
  Speaker: 'speaker',
};

const STARTUPS_FIELD_MAP: Record<string, string> = {
  Startup: 'startup',
  Industry: 'industry',
  'Startup in a word': 'startupInAWord',
  'Team Members': 'teamMembers',
  'Traction Summary': 'tractionSummary',
  'Detailed Progress': 'detailedProgress',
};

/**
 * FAQ field mapping - FAQ data comes from a structured JSON file
 * with sections containing knowledge_base objects. Fields are mapped directly
 * from the JSON structure to the database schema.
 */
const FAQ_FIELD_MAP = {
  question: 'question',       // Question text from FAQ
  answer: 'answer',           // Answer text from FAQ
  category: 'category',       // Derived from section:category format
  program: 'program',         // Program name (e.g., "Summer 2025")
  location: 'location',       // Program location (e.g., "Amsterdam")
  intendedUse: 'intendedUse', // Metadata: intended use description
  answerStyle: 'answerStyle', // Metadata: answer style guidance
} as const;

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
    } else if (Array.isArray(value)) {
      // Convert arrays to comma-separated strings for text fields
      transformed[dbKey] = arrayToString(value);
    } else if (typeof value === 'object' && value !== null) {
      // Skip objects like [object Object]
      continue;
    } else if (typeof value === 'string' && value.includes('[object Object]')) {
      // Skip stringified objects
      continue;
    } else {
      // All fields are text in schema, convert to string
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

  const jsonData = readJsonFile('data/pioneers_profile_book_table_records_readable.json');
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

  const jsonData = readJsonFile('data/session_events_records_readable.json');
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

  const jsonData = readJsonFile('data/startups_table_records_readable.json');
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
 * Seed FAQ table from unified faq.json
 */
async function seedFAQ() {
  log('Seeding FAQ...');

  const jsonData = readJsonFile('data/faq.json');

  if (!jsonData.sections || !Array.isArray(jsonData.sections)) {
    error('Invalid FAQ structure: missing sections array');
    return;
  }

  const { program, location, sections } = jsonData;
  const allFAQEntries: any[] = [];

  // Process each section
  for (const section of sections) {
    const { id: sectionId, knowledge_base, metadata } = section;

    if (!knowledge_base) {
      log(`Warning: Section ${sectionId} has no knowledge_base`);
      continue;
    }

    // Flatten all Q&As from all categories in this section
    for (const [category, items] of Object.entries(knowledge_base)) {
      if (!Array.isArray(items)) {
        log(`Warning: Category ${category} in section ${sectionId} is not an array`);
        continue;
      }

      for (const item of items as any[]) {
        if (!item.question || !item.answer) {
          log(`Warning: Invalid FAQ item in ${category} (section: ${sectionId})`);
          continue;
        }

        allFAQEntries.push({
          id: randomUUID(),
          question: item.question,
          answer: item.answer,
          category: `${sectionId}:${category}`, // Prefix category with section ID for uniqueness
          program,
          location,
          intendedUse: metadata?.intended_use || metadata?.intendedUse,
          answerStyle: metadata?.answer_style || metadata?.answerStyle,
        });
      }
    }
  }

  if (allFAQEntries.length === 0) {
    log('No valid FAQ entries to insert');
    return;
  }

  log(`Found ${allFAQEntries.length} total FAQ entries from ${sections.length} sections`);

  // Delete existing records
  await db.delete(faq);

  // Insert in batches of 100
  const batchSize = 100;
  for (let i = 0; i < allFAQEntries.length; i += batchSize) {
    const batch = allFAQEntries.slice(i, i + batchSize);
    await db.insert(faq).values(batch);
    log(`Inserted ${Math.min(i + batchSize, allFAQEntries.length)}/${allFAQEntries.length} FAQ entries`);
  }

  // Show breakdown by section
  const sectionBreakdown = sections.map((section: any) => {
    const sectionCount = allFAQEntries.filter(entry =>
      entry.category.startsWith(`${section.id}:`)
    ).length;
    return `  - ${section.title}: ${sectionCount} FAQs`;
  });

  message(`✓ Successfully seeded ${allFAQEntries.length} FAQ entries`);
  log('FAQ breakdown by section:');
  sectionBreakdown.forEach((line: string) => log(line));
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
    await seedFAQ();

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
