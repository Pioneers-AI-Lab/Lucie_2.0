/**
 * FAQ Seeding Helper
 *
 * Seeds the FAQ table from JSON FAQ files
 * Supports multiple FAQ sources: general-questions.json, sessions-faq.json, etc.
 */

import { db } from '../index.js';
import { faq } from '../schemas/faq.js';
import { sql, like, or, eq } from 'drizzle-orm';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

/**
 * Seed FAQ data from a specific JSON file
 */
export async function seedFAQFromFile(fileName: string) {
  console.log(`🔄 Seeding FAQ data from ${fileName}...`);

  // Read JSON file
  const jsonPath = join(process.cwd(), 'data', fileName);

  if (!existsSync(jsonPath)) {
    throw new Error(`FAQ file not found: ${jsonPath}`);
  }

  const jsonData = JSON.parse(readFileSync(jsonPath, 'utf-8'));

  const {
    program,
    location,
    knowledge_base,
    metadata,
  } = jsonData;

  // Flatten all FAQ entries from all categories
  const faqEntries: any[] = [];

  for (const [category, items] of Object.entries(knowledge_base)) {
    for (const item of items as any[]) {
      faqEntries.push({
        id: randomUUID(),
        question: item.question,
        answer: item.answer,
        category,
        program,
        location,
        intendedUse: metadata.intended_use,
        answerStyle: metadata.answer_style,
      });
    }
  }

  console.log(`📝 Found ${faqEntries.length} FAQ entries across ${Object.keys(knowledge_base).length} categories`);

  // Clear existing FAQ data
  await db.delete(faq);
  console.log('🗑️  Cleared existing FAQ data');

  // Insert new FAQ data
  await db.insert(faq).values(faqEntries);
  console.log(`✅ Successfully seeded ${faqEntries.length} FAQ entries`);

  // Show breakdown by category
  const categoryCounts = Object.entries(knowledge_base).map(
    ([category, items]) => `  - ${category}: ${(items as any[]).length} FAQs`
  );
  console.log('📊 FAQ breakdown:');
  console.log(categoryCounts.join('\n'));

  return {
    total: faqEntries.length,
    categories: Object.keys(knowledge_base),
    metadata,
    source: fileName,
  };
}

/**
 * Seed FAQ data from general-questions.json
 */
export async function seedGeneralFAQ() {
  return await seedFAQFromFile('general-questions.json');
}

/**
 * Seed FAQ data from sessions-faq.json
 */
export async function seedSessionsFAQ() {
  return await seedFAQFromFile('sessions-faq.json');
}

/**
 * Seed FAQ data from startups-faq.json
 */
export async function seedStartupsFAQ() {
  return await seedFAQFromFile('startups-faq.json');
}

/**
 * Seed FAQ data from all FAQ files
 * Clears existing data and loads all FAQ sources
 */
export async function seedAllFAQs() {
  console.log('🔄 Seeding all FAQ data...\n');

  // Clear existing FAQ data once
  await db.delete(faq);
  console.log('🗑️  Cleared existing FAQ data\n');

  // Seed general questions (don't clear again)
  const generalResult = await seedFAQFromGeneralWithoutClear();

  // Seed sessions FAQ (don't clear again)
  const sessionsResult = await seedFAQFromSessionsWithoutClear();

  // Seed startups FAQ (don't clear again)
  const startupsResult = await seedFAQFromStartupsWithoutClear();

  const totalFAQs = generalResult.total + sessionsResult.total + startupsResult.total;
  const allCategories = [...generalResult.categories, ...sessionsResult.categories, ...startupsResult.categories];

  console.log(`\n✅ Successfully seeded ${totalFAQs} total FAQ entries`);
  console.log(`📊 Total categories: ${allCategories.length}`);
  console.log(`   - General FAQs: ${generalResult.total} entries`);
  console.log(`   - Sessions FAQs: ${sessionsResult.total} entries`);
  console.log(`   - Startups FAQs: ${startupsResult.total} entries`);

  return {
    total: totalFAQs,
    general: generalResult,
    sessions: sessionsResult,
    startups: startupsResult,
  };
}

/**
 * Helper to seed general FAQs without clearing database
 */
async function seedFAQFromGeneralWithoutClear() {
  console.log('📝 Loading general-questions.json...');
  const jsonPath = join(process.cwd(), 'data', 'general-questions.json');
  const jsonData = JSON.parse(readFileSync(jsonPath, 'utf-8'));

  const { program, location, knowledge_base, metadata } = jsonData;
  const faqEntries: any[] = [];

  for (const [category, items] of Object.entries(knowledge_base)) {
    for (const item of items as any[]) {
      faqEntries.push({
        id: randomUUID(),
        question: item.question,
        answer: item.answer,
        category,
        program,
        location,
        intendedUse: metadata.intended_use,
        answerStyle: metadata.answer_style,
      });
    }
  }

  await db.insert(faq).values(faqEntries);
  console.log(`✅ Loaded ${faqEntries.length} general FAQ entries`);

  return {
    total: faqEntries.length,
    categories: Object.keys(knowledge_base),
    metadata,
  };
}

/**
 * Helper to seed sessions FAQs without clearing database
 */
async function seedFAQFromSessionsWithoutClear() {
  console.log('📝 Loading sessions-faq.json...');
  const jsonPath = join(process.cwd(), 'data', 'sessions-faq.json');
  const jsonData = JSON.parse(readFileSync(jsonPath, 'utf-8'));

  const { program, location, knowledge_base, metadata } = jsonData;
  const faqEntries: any[] = [];

  for (const [category, items] of Object.entries(knowledge_base)) {
    for (const item of items as any[]) {
      faqEntries.push({
        id: randomUUID(),
        question: item.question,
        answer: item.answer,
        category,
        program,
        location,
        intendedUse: metadata.intended_use,
        answerStyle: metadata.answer_style,
      });
    }
  }

  await db.insert(faq).values(faqEntries);
  console.log(`✅ Loaded ${faqEntries.length} sessions FAQ entries`);

  return {
    total: faqEntries.length,
    categories: Object.keys(knowledge_base),
    metadata,
  };
}

/**
 * Helper to seed startups FAQs without clearing database
 */
async function seedFAQFromStartupsWithoutClear() {
  console.log('📝 Loading startups-faq.json...');
  const jsonPath = join(process.cwd(), 'data', 'startups-faq.json');
  const jsonData = JSON.parse(readFileSync(jsonPath, 'utf-8'));

  const { program, location, knowledge_base, metadata } = jsonData;
  const faqEntries: any[] = [];

  for (const [category, items] of Object.entries(knowledge_base)) {
    for (const item of items as any[]) {
      faqEntries.push({
        id: randomUUID(),
        question: item.question,
        answer: item.answer,
        category,
        program,
        location,
        intendedUse: metadata.intended_use,
        answerStyle: metadata.answer_style,
      });
    }
  }

  await db.insert(faq).values(faqEntries);
  console.log(`✅ Loaded ${faqEntries.length} startups FAQ entries`);

  return {
    total: faqEntries.length,
    categories: Object.keys(knowledge_base),
    metadata,
  };
}

/**
 * Get all FAQs by category
 */
export async function getFAQsByCategory(categoryName: string) {
  return await db.select().from(faq).where(eq(faq.category, categoryName));
}

/**
 * Search FAQs by question or answer
 */
export async function searchFAQs(searchTerm: string) {
  const pattern = `%${searchTerm}%`;
  return await db
    .select()
    .from(faq)
    .where(
      or(
        like(faq.question, pattern),
        like(faq.answer, pattern)
      )
    );
}

/**
 * Get all FAQ categories
 */
export async function getFAQCategories() {
  const results = await db
    .selectDistinct({ category: faq.category })
    .from(faq);
  return results.map(r => r.category);
}

/**
 * Get FAQ count
 */
export async function getFAQCount() {
  const result = await db.select({ count: sql<number>`count(*)` }).from(faq);
  return result[0].count;
}

// Run seed if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Check for command line arguments
  const args = process.argv.slice(2);
  const mode = args[0] || 'all';

  let seedPromise;

  switch (mode) {
    case 'general':
      seedPromise = seedGeneralFAQ();
      break;
    case 'sessions':
      seedPromise = seedSessionsFAQ();
      break;
    case 'startups':
      seedPromise = seedStartupsFAQ();
      break;
    case 'all':
    default:
      seedPromise = seedAllFAQs();
      break;
  }

  seedPromise
    .then(() => {
      console.log('\n✅ FAQ seeding complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ FAQ seeding failed:', error);
      process.exit(1);
    });
}
