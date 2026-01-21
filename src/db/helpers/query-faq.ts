/**
 * Helper functions to query FAQ data from Turso database
 */

import { db } from '../index.js';
import { faq } from '../schemas/index.js';
import { like, or, eq } from 'drizzle-orm';

/**
 * FAQ interface matching the database schema
 */
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  program: string | null;
  location: string | null;
  intendedUse: string | null;
  answerStyle: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get all FAQ entries from the database
 *
 * @returns Array of all FAQ entries
 */
export async function getAllFAQs(): Promise<FAQ[]> {
  try {
    const results = await db.select().from(faq);
    return results;
  } catch (error) {
    console.error('Error fetching all FAQs:', error);
    throw error;
  }
}

/**
 * Search FAQs by keyword in questions and answers
 * Case-insensitive search across both question and answer fields
 *
 * @param searchTerm - Keyword to search for
 * @returns Array of matching FAQ entries
 */
export async function searchFAQs(searchTerm: string): Promise<FAQ[]> {
  try {
    const searchPattern = `%${searchTerm}%`;

    const results = await db
      .select()
      .from(faq)
      .where(
        or(
          like(faq.question, searchPattern),
          like(faq.answer, searchPattern)
        )
      );

    return results;
  } catch (error) {
    console.error('Error searching FAQs:', error);
    throw error;
  }
}

/**
 * Get FAQs by category
 *
 * @param category - Category name to filter by
 * @returns Array of FAQs in the specified category
 */
export async function getFAQsByCategory(category: string): Promise<FAQ[]> {
  try {
    const results = await db
      .select()
      .from(faq)
      .where(eq(faq.category, category));

    return results;
  } catch (error) {
    console.error('Error fetching FAQs by category:', error);
    throw error;
  }
}

/**
 * Get count of all FAQ entries
 *
 * @returns Total number of FAQ entries in database
 */
export async function getFAQCount(): Promise<number> {
  try {
    const results = await db.select().from(faq);
    return results.length;
  } catch (error) {
    console.error('Error counting FAQs:', error);
    throw error;
  }
}

/**
 * Get unique categories from FAQ entries
 * Useful for displaying available categories to users
 *
 * @returns Array of unique category names
 */
export async function getFAQCategories(): Promise<string[]> {
  try {
    const results = await db
      .selectDistinct({ category: faq.category })
      .from(faq);

    return results.map(r => r.category).filter(Boolean);
  } catch (error) {
    console.error('Error fetching FAQ categories:', error);
    throw error;
  }
}
