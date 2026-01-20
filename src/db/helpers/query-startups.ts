/**
 * Helper functions to query startups
 */

import { db } from '../index.js';
import { startups } from '../schemas/index.js';
import { like, or, sql } from 'drizzle-orm';

/**
 * Get all startups
 */
export async function getAllStartups() {
  return await db.select().from(startups);
}

/**
 * Search startups by name (partial match, case-insensitive)
 */
export async function searchStartupsByName(searchTerm: string) {
  const searchPattern = `%${searchTerm}%`;
  return await db.select()
    .from(startups)
    .where(like(startups.startup, searchPattern));
}

/**
 * Search startups by industry (partial match, case-insensitive)
 */
export async function searchStartupsByIndustry(searchTerm: string) {
  const searchPattern = `%${searchTerm}%`;
  return await db.select()
    .from(startups)
    .where(like(startups.industry, searchPattern));
}

/**
 * Search startups by team member name (partial match)
 */
export async function searchStartupsByTeamMember(searchTerm: string) {
  const searchPattern = `%${searchTerm}%`;
  return await db.select()
    .from(startups)
    .where(like(startups.teamMembers, searchPattern));
}

/**
 * Search startups by description/tagline (startup in a word)
 */
export async function searchStartupsByDescription(searchTerm: string) {
  const searchPattern = `%${searchTerm}%`;
  return await db.select()
    .from(startups)
    .where(like(startups.startupInAWord, searchPattern));
}

/**
 * Get total count of startups
 */
export async function getTotalStartupsCount() {
  const allStartups = await db.select().from(startups);
  return allStartups.length;
}

/**
 * Search startups across multiple fields (name, industry, description, team)
 */
export async function searchStartupsGlobal(searchTerm: string) {
  const searchPattern = `%${searchTerm}%`;

  return await db.select()
    .from(startups)
    .where(
      or(
        like(startups.startup, searchPattern),
        like(startups.industry, searchPattern),
        like(startups.startupInAWord, searchPattern),
        like(startups.teamMembers, searchPattern),
        like(startups.tractionSummary, searchPattern)
      )
    );
}
