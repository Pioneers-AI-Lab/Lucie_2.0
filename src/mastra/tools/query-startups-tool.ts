/**
 * Query Startups Tool - Turso Database
 *
 * Queries startup data from the local Turso database instead of Airtable.
 * Much faster with no rate limits.
 *
 * Contains a list of startups with information about:
 * - Startup names and industries
 * - Team members
 * - Descriptions and taglines
 * - Traction and progress
 *
 * 💡 Note: For guidance on HOW to build startups, validate ideas, or prepare pitches,
 * use queryFAQTool with searchTerm related to startups (39 FAQs available covering
 * team formation, traction, validation, product development, pitching, investment readiness,
 * go-to-market strategies, and common challenges).
 * This tool returns ACTUAL startup data - use queryFAQTool for guidance/explanations.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import {
  getAllStartups,
  searchStartupsByName,
  searchStartupsByIndustry,
  searchStartupsByTeamMember,
  searchStartupsByDescription,
  getTotalStartupsCount,
  searchStartupsGlobal,
} from '../../db/helpers/query-startups.js';
import type { Startup } from '../../db/schemas/startups.js';

/**
 * Query startups from Turso database
 * Supports multiple search strategies for flexibility
 */
export const queryStartupsTool = createTool({
  id: 'query-startups-turso',
  description: `Query startup data from the Pioneers accelerator program database.
  Contains a list of startups with team info, industries, and traction details.

  💡 TOOL SELECTION:
  - Use THIS TOOL for: "Show me FinTech startups...", "Which startups are...?", "List companies building..." (actual startup data/records)
  - Use queryFAQTool for: "How do I validate my idea?", "What is an LOI?", "How do I prepare for IC?" (guidance/advice)
  - 39 startups FAQs available covering traction, validation, pitching, product development, investment readiness, GTM strategy

  Search types:
  - "all": Get all startups
  - "by-name": Search by startup name (partial match, case-insensitive)
  - "by-industry": Search by industry (e.g., "FinTech", "AI", "Healthcare")
  - "by-team-member": Search by team member name (e.g., find startups with specific founder)
  - "by-description": Search in startup descriptions/taglines
  - "count": Get total number of startups (returns just the count)
  - "global-search": Search across name, industry, description, team, and traction

  Use this tool for questions about startups, teams, industries, or what companies are building.`,

  inputSchema: z.object({
    searchType: z.union([
      z.literal('all'),
      z.literal('by-name'),
      z.literal('by-industry'),
      z.literal('by-team-member'),
      z.literal('by-description'),
      z.literal('count'),
      z.literal('global-search'),
    ]).describe('Type of search to perform'),
    searchTerm: z.string().optional()
      .describe('Search term (required for by-name, by-industry, by-team-member, by-description, global-search)'),
  }),

  outputSchema: z.object({
    startups: z.array(z.object({
      id: z.string(),
      startup: z.string().nullable(),
      industry: z.string().nullable(),
      startupInAWord: z.string().nullable(),
      teamMembers: z.string().nullable(),
      tractionSummary: z.string().nullable(),
      detailedProgress: z.string().nullable(),
      previousDecks: z.string().nullable(),
    })).optional(),
    count: z.number(),
    message: z.string().optional(),
  }),

  execute: async (input) => {
    const { searchType, searchTerm } = input;

    try {
      // Handle count-only request
      if (searchType === 'count') {
        const count = await getTotalStartupsCount();
        return {
          count,
          message: `Total startups in database: ${count}`,
        };
      }

      // Handle search requests
      let rawStartups: Startup[];

      switch (searchType) {
        case 'all':
          rawStartups = await getAllStartups();
          break;

        case 'by-name':
          if (!searchTerm) {
            return {
              startups: [],
              count: 0,
              message: 'Error: searchTerm is required for by-name search',
            };
          }
          rawStartups = await searchStartupsByName(searchTerm);
          break;

        case 'by-industry':
          if (!searchTerm) {
            return {
              startups: [],
              count: 0,
              message: 'Error: searchTerm is required for by-industry search',
            };
          }
          rawStartups = await searchStartupsByIndustry(searchTerm);
          break;

        case 'by-team-member':
          if (!searchTerm) {
            return {
              startups: [],
              count: 0,
              message: 'Error: searchTerm is required for by-team-member search',
            };
          }
          rawStartups = await searchStartupsByTeamMember(searchTerm);
          break;

        case 'by-description':
          if (!searchTerm) {
            return {
              startups: [],
              count: 0,
              message: 'Error: searchTerm is required for by-description search',
            };
          }
          rawStartups = await searchStartupsByDescription(searchTerm);
          break;

        case 'global-search':
          if (!searchTerm) {
            return {
              startups: [],
              count: 0,
              message: 'Error: searchTerm is required for global-search',
            };
          }
          rawStartups = await searchStartupsGlobal(searchTerm);
          break;

        default:
          return {
            startups: [],
            count: 0,
            message: `Error: Unknown search type "${searchType}"`,
          };
      }

      const startups = rawStartups.map((startup) => ({
        id: startup.id,
        startup: startup.startup,
        industry: startup.industry,
        startupInAWord: startup.startupInAWord,
        teamMembers: startup.teamMembers,
        tractionSummary: startup.tractionSummary,
        detailedProgress: startup.detailedProgress,
        previousDecks: null,
      }));

      return {
        startups,
        count: startups.length,
        message: startups.length === 0
          ? `No startups found matching "${searchTerm}"`
          : `Found ${startups.length} startup(s)`,
      };

    } catch (error: any) {
      return {
        startups: [],
        count: 0,
        message: `Database error: ${error.message}`,
      };
    }
  },
});
