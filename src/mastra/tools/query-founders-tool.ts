/**
 * Query Founders Tool - Turso Database
 *
 * Queries founder data from the local Turso database instead of Airtable.
 * Much faster with no rate limits.
 *
 * Searches Profile Book founders only (detailed professional data with introductions).
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import {
  getAllFounders,
  getFoundersByName,
  getFoundersBySkills,
  getFoundersByBatch,
  getFoundersCount,
} from '../../db/helpers/query-all-founders.js';

/**
 * Query founders from Turso database
 * Supports multiple search strategies for flexibility
 */
export const queryFoundersTool = createTool({
  id: 'query-founders-turso',
  description: `Query founder data from the Pioneers accelerator program database.
  Searches Profile Book founders only (detailed professional data with introductions).

  Search types:
  - "all": Get all Profile Book founders
  - "by-name": Search by founder name (partial match, case-insensitive)
  - "by-skills": Search by technical skills or expertise (partial match)
  - "by-batch": Filter by batch/cohort (e.g., "S25")
  - "count": Get total number of Profile Book founders (returns just the count)

  All founders returned are from the Profile Book (have detailed introductions).

  Use this tool for any questions about founders, their skills, backgrounds, or contact information.`,

  inputSchema: z.object({
    searchType: z
      .union([
        z.literal('all'),
        z.literal('by-name'),
        z.literal('by-skills'),
        z.literal('by-batch'),
        z.literal('count'),
      ])
      .describe('Type of search to perform'),
    searchTerm: z
      .string()
      .optional()
      .describe(
        'Search term (required for by-name, by-skills, by-batch searches)',
      ),
  }),

  outputSchema: z.object({
    founders: z
      .array(
        z.object({
          id: z.string(),
          // Basic Information
          name: z.string().nullable(),
          status: z.string().nullable(),
          whatsapp: z.string().nullable(),
          email: z.string().nullable(),
          yourPhoto: z.string().nullable(),
          // Project Information
          existingProjectIdea: z.string().nullable(),
          projectExplanation: z.string().nullable(),
          existingCofounderName: z.string().nullable(),
          openToJoinAnotherProject: z.string().nullable(),
          joiningWithCofounder: z.string().nullable(),
          // Professional Profile
          linkedin: z.string().nullable(),
          techSkills: z.string().nullable(),
          industries: z.string().nullable(),
          rolesICouldTake: z.string().nullable(),
          trackRecordProud: z.string().nullable(),
          interestedInWorkingOn: z.string().nullable(),
          introduction: z.string().nullable(),
          // Professional Background
          companiesWorked: z.string().nullable(),
          // Education
          education: z.string().nullable(),
          nationality: z.string().nullable(),
          gender: z.string().nullable(),
          yearsOfXp: z.string().nullable(),
          degree: z.string().nullable(),
          academicField: z.string().nullable(),
          // Relationships
          founder: z.string().nullable(),
          // Status
          leftProgram: z.string().nullable(),
          // Convenience fields (aliases for compatibility)
          phone: z.string().nullable(), // Maps to whatsapp
          roles: z.string().nullable(), // Maps to rolesICouldTake
          // Metadata
          source: z.literal('profile_book'),
        }),
      )
      .optional(),
    count: z.number(),
    message: z.string().optional(),
  }),

  execute: async (input) => {
    const { searchType, searchTerm } = input;

    try {
      // Handle count-only request
      if (searchType === 'count') {
        const count = await getFoundersCount();
        return {
          count,
          message: `Total Profile Book founders in database: ${count}`,
        };
      }

      // Handle search requests
      let founders;

      switch (searchType) {
        case 'all':
          founders = await getAllFounders();
          break;

        case 'by-name':
          if (!searchTerm) {
            return {
              founders: [],
              count: 0,
              message: 'Error: searchTerm is required for by-name search',
            };
          }
          founders = await getFoundersByName(searchTerm);
          break;

        case 'by-skills':
          if (!searchTerm) {
            return {
              founders: [],
              count: 0,
              message: 'Error: searchTerm is required for by-skills search',
            };
          }
          founders = await getFoundersBySkills(searchTerm);
          break;

        case 'by-batch':
          if (!searchTerm) {
            return {
              founders: [],
              count: 0,
              message: 'Error: searchTerm is required for by-batch search',
            };
          }
          founders = await getFoundersByBatch(searchTerm);
          break;

        default:
          return {
            founders: [],
            count: 0,
            message: `Error: Unknown search type "${searchType}"`,
          };
      }

      return {
        founders,
        count: founders.length,
        message:
          founders.length === 0
            ? `No founders found matching "${searchTerm}"`
            : `Found ${founders.length} founder(s)`,
      };
    } catch (error: any) {
      return {
        founders: [],
        count: 0,
        message: `Database error: ${error.message}`,
      };
    }
  },
});
