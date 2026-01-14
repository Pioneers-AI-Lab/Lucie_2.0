/**
 * Helper functions to query session events
 */

import { db } from '../index.js';
import { sessionEvents } from '../schemas/index.js';
import { like, eq, and, or, gte, lte, sql } from 'drizzle-orm';

/**
 * Get all session events
 */
export async function getAllSessions() {
  return await db.select().from(sessionEvents);
}

/**
 * Search sessions by name (partial match, case-insensitive)
 */
export async function searchSessionsByName(searchTerm: string) {
  const searchPattern = `%${searchTerm}%`;
  return await db.select()
    .from(sessionEvents)
    .where(like(sessionEvents.name, searchPattern));
}

/**
 * Search sessions by speaker (partial match, case-insensitive)
 */
export async function searchSessionsBySpeaker(searchTerm: string) {
  const searchPattern = `%${searchTerm}%`;
  return await db.select()
    .from(sessionEvents)
    .where(like(sessionEvents.speaker, searchPattern));
}

/**
 * Get sessions by type
 */
export async function getSessionsByType(sessionType: string) {
  return await db.select()
    .from(sessionEvents)
    .where(eq(sessionEvents.typeOfSession, sessionType));
}

/**
 * Get sessions by program week
 */
export async function getSessionsByWeek(week: string) {
  return await db.select()
    .from(sessionEvents)
    .where(eq(sessionEvents.programWeek, week));
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
 * Search sessions across multiple fields (name, speaker, notes)
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
        like(sessionEvents.notesFeedback, searchPattern)
      )
    );
}
