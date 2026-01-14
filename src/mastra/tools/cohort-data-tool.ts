import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { db } from '../../db/index.js';
import { founders } from '../../db/schemas/founders.js';
import { foundersGridData } from '../../db/schemas/founders-grid-data.js';
import { sessionEvents } from '../../db/schemas/session-events.js';
import { startups } from '../../db/schemas/startups.js';
import { like, or, sql } from 'drizzle-orm';

/**
 * Unified Turso Query Tool
 *
 * This tool searches across ALL Turso tables (founders, sessions, startups)
 * for general queries that don't fit the specialized tools.
 *
 * Use this for:
 * - Cross-table searches
 * - General program information queries
 * - When you're not sure which specific table to query
 */

const inputSchema = z.object({
  searchTerm: z.string().optional().describe('Global search term to search across all tables'),
  searchType: z.enum(['all', 'global-search']).optional().describe('Search type: "all" returns everything, "global-search" searches by term'),
});

export const getCohortDataTool = createTool({
  id: 'cohort-data-tool-turso',
  description:
    'LEGACY: Unified search across ALL Pioneers data in Turso database (founders, sessions, startups). Use specialized tools (queryFoundersTool, querySessionsTool, queryStartupsTool) for better results. This tool is for cross-table queries only.',
  inputSchema,
  outputSchema: z.object({
    founders: z.array(z.object({
      id: z.string(),
      name: z.string().nullable(),
      email: z.string().nullable(),
      source: z.string(),
    })).optional(),
    sessions: z.array(z.object({
      id: z.string(),
      name: z.string().nullable(),
      date: z.date().nullable(),
      speaker: z.string().nullable(),
    })).optional(),
    startups: z.array(z.object({
      id: z.string(),
      startup: z.string().nullable(),
      industry: z.string().nullable(),
    })).optional(),
    totalRecords: z.number().describe('Total number of records across all tables'),
    message: z.string().optional(),
  }),
  execute: async (input) => {
    try {
      const { searchTerm, searchType = 'all' } = input;

      if (searchType === 'all' || !searchTerm) {
        // Return summary counts from all tables
        const [foundersCount] = await db.select({ count: sql<number>`count(*)` }).from(founders);
        const [foundersGridCount] = await db.select({ count: sql<number>`count(*)` }).from(foundersGridData);
        const [sessionsCount] = await db.select({ count: sql<number>`count(*)` }).from(sessionEvents);
        const [startupsCount] = await db.select({ count: sql<number>`count(*)` }).from(startups);

        const totalFounders = (foundersCount?.count || 0) + (foundersGridCount?.count || 0);
        const totalSessions = sessionsCount?.count || 0;
        const totalStartups = startupsCount?.count || 0;

        return {
          totalRecords: totalFounders + totalSessions + totalStartups,
          message: `Database contains: ${totalFounders} founders (${foundersCount?.count || 0} from Profile Book + ${foundersGridCount?.count || 0} from Grid View), ${totalSessions} sessions, ${totalStartups} startups. Use specialized query tools for better results.`,
        };
      }

      // Global search across all tables
      const searchPattern = `%${searchTerm}%`;

      // Search founders
      const foundersResults = await db
        .select({
          id: founders.id,
          name: founders.name,
          email: founders.email,
        })
        .from(founders)
        .where(
          or(
            like(founders.name, searchPattern),
            like(founders.email, searchPattern),
            like(founders.techSkills, searchPattern),
            like(founders.roles, searchPattern),
          )
        )
        .limit(10);

      const foundersGridResults = await db
        .select({
          id: foundersGridData.id,
          name: foundersGridData.name,
          email: foundersGridData.email,
        })
        .from(foundersGridData)
        .where(
          or(
            like(foundersGridData.name, searchPattern),
            like(foundersGridData.email, searchPattern),
            like(foundersGridData.keywords, searchPattern),
          )
        )
        .limit(10);

      const allFounders = [
        ...foundersResults.map(f => ({ ...f, source: 'profile_book' })),
        ...foundersGridResults.map(f => ({ ...f, source: 'grid_view' })),
      ];

      // Search sessions
      const sessionsResults = await db
        .select({
          id: sessionEvents.id,
          name: sessionEvents.name,
          date: sessionEvents.date,
          speaker: sessionEvents.speaker,
        })
        .from(sessionEvents)
        .where(
          or(
            like(sessionEvents.name, searchPattern),
            like(sessionEvents.speaker, searchPattern),
            like(sessionEvents.typeOfSession, searchPattern),
          )
        )
        .limit(10);

      // Search startups
      const startupsResults = await db
        .select({
          id: startups.id,
          startup: startups.startup,
          industry: startups.industry,
        })
        .from(startups)
        .where(
          or(
            like(startups.startup, searchPattern),
            like(startups.industry, searchPattern),
            like(startups.startupInAWord, searchPattern),
            like(startups.teamMembers, searchPattern),
          )
        )
        .limit(10);

      const totalRecords = allFounders.length + sessionsResults.length + startupsResults.length;

      return {
        founders: allFounders.length > 0 ? allFounders : undefined,
        sessions: sessionsResults.length > 0 ? sessionsResults : undefined,
        startups: startupsResults.length > 0 ? startupsResults : undefined,
        totalRecords,
        message: totalRecords === 0
          ? `No results found for "${searchTerm}". Try using specialized query tools (queryFoundersTool, querySessionsTool, queryStartupsTool) for better results.`
          : `Found ${totalRecords} results across all tables (limited to 10 per table). Use specialized tools for more detailed queries.`,
      };

    } catch (error: any) {
      return {
        totalRecords: 0,
        message: `Database error: ${error.message}. Please use specialized query tools instead.`,
      };
    }
  },
});
