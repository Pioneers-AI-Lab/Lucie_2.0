/**
 * Helper functions to query session events
 *
 * ⚠️ IMPORTANT: All queries in this file fetch data ONLY from the session_events table.
 * No other database tables (founders, startups, faq) are queried.
 */

import { db } from '../index.js';
import { sessionEvents } from '../schemas/index.js';
import { like, and, or, gte, lte, sql } from 'drizzle-orm';

/**
 * Get all session events
 */
export async function getAllSessions() {
  return await db.select().from(sessionEvents);
}

/**
 * Search sessions by name (partial match, case-insensitive)
 * Improved: Splits multi-word searches and matches if ANY word is found
 * Example: "Alexis Robert" finds sessions with "Alexis" OR "Robert" in name
 */
export async function searchSessionsByName(searchTerm: string) {
  const words = searchTerm.trim().split(/\s+/);

  // If single word, use simple LIKE
  if (words.length === 1) {
    const searchPattern = `%${searchTerm}%`;
    return await db.select()
      .from(sessionEvents)
      .where(like(sessionEvents.name, searchPattern));
  }

  // If multiple words, search for any word match
  const conditions = words.map(word =>
    like(sessionEvents.name, `%${word}%`)
  );

  return await db.select()
    .from(sessionEvents)
    .where(or(...conditions));
}

/**
 * Search sessions by speaker (partial match, case-insensitive)
 * Improved: Splits multi-word searches and matches if ANY word is found
 * Example: "Alexis Robert" finds speakers with "Alexis" OR "Robert"
 * This solves: searching "Alexis Robert" will now find "Alexis - Kima Ventures"
 */
export async function searchSessionsBySpeaker(searchTerm: string) {
  const words = searchTerm.trim().split(/\s+/);

  // If single word, use simple LIKE
  if (words.length === 1) {
    const searchPattern = `%${searchTerm}%`;
    return await db.select()
      .from(sessionEvents)
      .where(like(sessionEvents.speaker, searchPattern));
  }

  // If multiple words, search for any word match
  const conditions = words.map(word =>
    like(sessionEvents.speaker, `%${word}%`)
  );

  return await db.select()
    .from(sessionEvents)
    .where(or(...conditions));
}

/**
 * Get sessions by type (partial match, case-insensitive)
 * Fixed: Uses LIKE for flexible matching instead of exact match
 */
export async function getSessionsByType(sessionType: string) {
  const searchPattern = `%${sessionType}%`;
  return await db.select()
    .from(sessionEvents)
    .where(like(sessionEvents.typeOfSession, searchPattern));
}

/**
 * Get sessions by program week (partial match, case-insensitive)
 * Fixed: Uses LIKE for flexible matching (finds "Week 1", "1", "week 1")
 */
export async function getSessionsByWeek(week: string) {
  const searchPattern = `%${week}%`;
  return await db.select()
    .from(sessionEvents)
    .where(like(sessionEvents.programWeek, searchPattern));
}

/**
 * Get sessions within a date range
 * @param startDate - Start date (ISO string or Date)
 * @param endDate - End date (ISO string or Date)
 */
export async function getSessionsByDateRange(startDate: string | Date, endDate: string | Date) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  return await db.select()
    .from(sessionEvents)
    .where(
      and(
        gte(sessionEvents.date, start),
        lte(sessionEvents.date, end)
      )
    );
}

/**
 * Get upcoming sessions (after a given date, default: today)
 */
export async function getUpcomingSessions(fromDate?: Date) {
  const date = fromDate || new Date();

  return await db.select()
    .from(sessionEvents)
    .where(gte(sessionEvents.date, date))
    .orderBy(sessionEvents.date);
}

/**
 * Get past sessions (before a given date, default: today)
 */
export async function getPastSessions(toDate?: Date) {
  const date = toDate || new Date();

  return await db.select()
    .from(sessionEvents)
    .where(lte(sessionEvents.date, date))
    .orderBy(sql`${sessionEvents.date} DESC`);
}

/**
 * Get the next session (earliest upcoming session)
 */
export async function getNextSession() {
  const upcoming = await getUpcomingSessions();
  return upcoming[0] || null;
}

/**
 * Get total count of session events
 */
export async function getTotalSessionsCount() {
  const sessions = await db.select().from(sessionEvents);
  return sessions.length;
}

/**
 * Search sessions across ALL text fields (name, speaker, type, week)
 */
export async function searchSessionsGlobal(searchTerm: string) {
  const searchPattern = `%${searchTerm}%`;

  return await db.select()
    .from(sessionEvents)
    .where(
      or(
        like(sessionEvents.name, searchPattern),
        like(sessionEvents.speaker, searchPattern),
        like(sessionEvents.typeOfSession, searchPattern),
        like(sessionEvents.programWeek, searchPattern),
      )
    );
}
