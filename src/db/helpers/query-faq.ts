/**
 * Helper functions to query FAQ data from Turso database
 */

import { db } from '../index.js';
import { faq } from '../schemas/index.js';
import { or, sql } from 'drizzle-orm';

// Use Drizzle's inferred type instead of manual interface
export type FAQ = typeof faq.$inferSelect;

/**
 * Get all FAQ entries from the database
 *
 * @param limit - Optional limit on number of results
 * @returns Array of all FAQ entries
 */
export async function getAllFAQs(limit?: number): Promise<FAQ[]> {
  const query = db.select().from(faq);
  if (limit && limit > 0) {
    return await query.limit(limit);
  }
  return await query;
}

/**
 * Search FAQs by keyword in questions and answers
 * Case-insensitive search across both question and answer fields
 * Improved: Splits multi-word searches and matches if ANY word is found
 * Example: "find co-founder" finds FAQs with "find" OR "co-founder" in question/answer
 *
 * @param searchTerm - Keyword(s) to search for
 * @param limit - Optional limit on number of results
 * @returns Array of matching FAQ entries
 */
export async function searchFAQs(
  searchTerm: string,
  limit?: number,
): Promise<FAQ[]> {
  // Trim and validate input
  const trimmedTerm = searchTerm.trim();
  if (!trimmedTerm) {
    return [];
  }

  // Split into words for multi-word search
  const words = trimmedTerm.split(/\s+/).filter((w) => w.length > 0);

  // Build search conditions for each word
  const conditions = words.flatMap((word) => {
    const pattern = `%${word}%`;
    return [
      // Case-insensitive search in question
      sql`LOWER(${faq.question}) LIKE LOWER(${pattern})`,
      // Case-insensitive search in answer
      sql`LOWER(${faq.answer}) LIKE LOWER(${pattern})`,
    ];
  });

  // If single word, use OR between question and answer
  // If multiple words, match ANY word in EITHER field
  const query = db
    .select()
    .from(faq)
    .where(or(...conditions));

  if (limit && limit > 0) {
    return await query.limit(limit);
  }

  return await query;
}

/**
 * Get FAQs by category
 * Uses case-insensitive partial matching for flexible category lookup
 *
 * @param category - Category name to filter by (case-insensitive partial match)
 * @param limit - Optional limit on number of results
 * @returns Array of FAQs in the specified category
 */
export async function getFAQsByCategory(
  category: string,
  limit?: number,
): Promise<FAQ[]> {
  const trimmedCategory = category.trim();
  if (!trimmedCategory) {
    return [];
  }

  // Use LIKE for flexible matching (handles variations in category names)
  const searchPattern = `%${trimmedCategory}%`;
  const query = db
    .select()
    .from(faq)
    .where(sql`LOWER(${faq.category}) LIKE LOWER(${searchPattern})`);

  if (limit && limit > 0) {
    return await query.limit(limit);
  }

  return await query;
}

/**
 * Get count of all FAQ entries
 * Optimized: Uses SQL COUNT instead of fetching all rows
 *
 * @returns Total number of FAQ entries in database
 */
export async function getFAQCount(): Promise<number> {
  const result = await db.select({ count: sql<number>`COUNT(*)` }).from(faq);

  return result[0]?.count ?? 0;
}

/**
 * Get unique categories from FAQ entries
 * Useful for displaying available categories to users
 *
 * @returns Array of unique category names, sorted alphabetically
 */
export async function getFAQCategories(): Promise<string[]> {
  const results = await db
    .selectDistinct({ category: faq.category })
    .from(faq)
    .orderBy(faq.category);

  return results.map((r) => r.category).filter(Boolean);
}
