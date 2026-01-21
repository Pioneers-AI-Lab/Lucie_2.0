#!/usr/bin/env tsx
/**
 * Standalone FAQ Seed Script
 *
 * Seeds only the FAQ table from the unified data/faq.json file
 * This script can be run independently without affecting other tables
 *
 * Usage: tsx src/db/seed-faq-only.ts
 * Or: pnpm db:seed:faq
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { randomUUID } from 'crypto';
import { db } from './index.js';
import { faq } from './schemas/index.js';
import { message, error as printError, log as printLog } from '../../lib/print-helpers.js';

const log = (msg: string) => printLog(msg, '');
const error = (msg: string) => printError(msg, '');

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
 * Seed FAQ table from unified faq.json
 */
async function seedFAQ() {
  log('Seeding FAQ from data/faq.json...');

  const jsonData = readJsonFile('data/faq.json');

  if (!jsonData.sections || !Array.isArray(jsonData.sections)) {
    error('Invalid FAQ structure: missing sections array');
    return;
  }

  const { program, location, sections } = jsonData;
  const allFAQEntries: any[] = [];

  // Process each section
  for (const section of sections) {
    const { id: sectionId, title, knowledge_base, metadata } = section;

    if (!knowledge_base) {
      log(`Warning: Section ${sectionId} has no knowledge_base`);
      continue;
    }

    log(`Processing section: ${title} (${sectionId})`);

    // Flatten all Q&As from all categories in this section
    let sectionCount = 0;
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
        sectionCount++;
      }
    }

    log(`  ✓ Loaded ${sectionCount} FAQs from ${title}`);
  }

  if (allFAQEntries.length === 0) {
    log('No valid FAQ entries to insert');
    return;
  }

  log(`\nFound ${allFAQEntries.length} total FAQ entries from ${sections.length} sections`);

  // Delete existing records
  log('Clearing existing FAQ data...');
  await db.delete(faq);

  // Insert in batches of 100
  log('Inserting FAQ entries...');
  const batchSize = 100;
  for (let i = 0; i < allFAQEntries.length; i += batchSize) {
    const batch = allFAQEntries.slice(i, i + batchSize);
    await db.insert(faq).values(batch);
    log(`  Inserted ${Math.min(i + batchSize, allFAQEntries.length)}/${allFAQEntries.length} FAQ entries`);
  }

  // Show breakdown by section
  log('\n📊 FAQ breakdown by section:');
  const sectionBreakdown = sections.map((section: any) => {
    const sectionCount = allFAQEntries.filter(entry =>
      entry.category.startsWith(`${section.id}:`)
    ).length;
    return `  - ${section.title}: ${sectionCount} FAQs`;
  });
  sectionBreakdown.forEach((line: string) => log(line));

  message(`\n✓ Successfully seeded ${allFAQEntries.length} FAQ entries`);
}

/**
 * Main function
 */
async function main() {
  try {
    log('Starting FAQ seed...\n');

    await seedFAQ();

    message('\n✓ FAQ seeding completed successfully!');
    process.exit(0);
  } catch (err: any) {
    error(`\nFAQ seed failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
