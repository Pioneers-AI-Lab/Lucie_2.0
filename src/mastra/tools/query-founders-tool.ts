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
  getFoundersByIndustry,
  getFoundersByCompany,
  getFoundersByNationality,
  getFoundersByEducation,
  getFoundersByProject,
  searchFoundersGlobal,
  getActiveFounders,
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

  ⚠️⚠️⚠️ CRITICAL FOR COMPARATIVE QUERIES (TOP/BOTTOM/MOST/LEAST) ⚠️⚠️⚠️
  If the user asks for "top N", "most experienced", "best", "least", "worst", or ANY ranking/comparison:
  YOU MUST USE: searchType = "all" (NO searchTerm needed)
  Then YOU must analyze ALL returned founders to find the correct top/bottom N.
  Parse years_of_xp as numbers before sorting (they are stored as text strings).
  Example: "Who are the 3 most experienced?" → {searchType: "all"} → analyze ALL years_of_xp → sort descending → return top 3

  Available fields from Profile Book (pioneers-profile-book-table-ref.json):
  - Basic: name, status, whatsapp, email, your_photo
  - Project: existing_project_idea, project_explanation, existing_cofounder_name, open_to_join_another_project, joining_with_cofounder
  - Professional: linkedin, tech_skills, industries, roles_i_could_take, track_record_proud, interested_in_working_on, introduction
  - Background: companies_worked
  - Education: education, nationality, gender, years_of_xp (IMPORTANT: stored as text, parse as number for comparisons!), degree, academic_field
  - Relationships: founder
  - Status: left_program
  - Batch: batch (cohort information like "S25", "F24", "Summer 2025")

  Search types:
  - "all": Get all Profile Book founders
  - "active-only": Get only active founders (excluding those who left the program)
  - "by-name": Search by founder name (partial match, case-insensitive)
  - "by-skills": Search in tech_skills and roles_i_could_take fields
  - "by-batch": Filter by cohort batch (e.g., "S25", "F24", "Summer 2025")
  - "by-industry": Search in industries field (e.g., "FinTech", "Healthcare", "AI")
  - "by-company": Search in companies_worked field (e.g., "Google", "Microsoft")
  - "by-nationality": Filter by nationality (e.g., "USA", "India", "Brazil")
  - "by-education": Search in education and academic_field (e.g., "Stanford", "Computer Science")
  - "by-project": Search in project-related fields (idea, explanation, interests)
  - "global-search": Search across all text fields (name, skills, introduction, etc.)
  - "count": Get total number of Profile Book founders (returns just the count)

  All founders returned are from the Profile Book (have detailed introductions).

  Use this tool for any questions about founders, their skills, backgrounds, or contact information.

  Examples of good queries:
  - "Who are the CTOs?" → by-skills with "CTO"
  - "Find founders from S25 batch" → by-batch with "S25"
  - "Who worked at Google?" → by-company with "Google"
  - "Show me FinTech founders" → by-industry with "FinTech"
  - "Find founders interested in AI" → by-project with "AI" or global-search with "AI"
  - "Who studied at MIT?" → by-education with "MIT"
  - "How many active founders?" → active-only + count

  ⚠️ CRITICAL - Examples of COMPARATIVE queries (MUST use searchType="all"):
  - "Who are the 3 most experienced founders?" → {searchType: "all"} → YOU analyze ALL years_of_xp → sort descending → return top 3
  - "Top 5 founders by experience?" → {searchType: "all"} → YOU parse years_of_xp as numbers → sort descending → return top 5
  - "Who has the most experience?" → {searchType: "all"} → YOU find max(years_of_xp) → return that founder
  - "Least experienced founder?" → {searchType: "all"} → YOU find min(years_of_xp) → return that founder

  DO NOT use filtered searches for ranking queries - you MUST see ALL founders to rank them correctly!
  `,

  inputSchema: z.object({
    searchType: z
      .union([
        z.literal('all'),
        z.literal('active-only'),
        z.literal('by-name'),
        z.literal('by-skills'),
        z.literal('by-batch'),
        z.literal('by-industry'),
        z.literal('by-company'),
        z.literal('by-nationality'),
        z.literal('by-education'),
        z.literal('by-project'),
        z.literal('global-search'),
        z.literal('count'),
      ])
      .describe('Type of search to perform'),
    searchTerm: z
      .string()
      .optional()
      .describe(
        'Search term (required for all searches except "all", "active-only", and "count")',
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
          // Batch
          batch: z.string().nullable(),
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

    // Debug logging to see what Lucie is requesting
    console.log('🔍 [queryFoundersTool] Called with:', { searchType, searchTerm });

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

        case 'active-only':
          founders = await getActiveFounders();
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

        case 'by-industry':
          if (!searchTerm) {
            return {
              founders: [],
              count: 0,
              message: 'Error: searchTerm is required for by-industry search',
            };
          }
          founders = await getFoundersByIndustry(searchTerm);
          break;

        case 'by-company':
          if (!searchTerm) {
            return {
              founders: [],
              count: 0,
              message: 'Error: searchTerm is required for by-company search',
            };
          }
          founders = await getFoundersByCompany(searchTerm);
          break;

        case 'by-nationality':
          if (!searchTerm) {
            return {
              founders: [],
              count: 0,
              message:
                'Error: searchTerm is required for by-nationality search',
            };
          }
          founders = await getFoundersByNationality(searchTerm);
          break;

        case 'by-education':
          if (!searchTerm) {
            return {
              founders: [],
              count: 0,
              message: 'Error: searchTerm is required for by-education search',
            };
          }
          founders = await getFoundersByEducation(searchTerm);
          break;

        case 'by-project':
          if (!searchTerm) {
            return {
              founders: [],
              count: 0,
              message: 'Error: searchTerm is required for by-project search',
            };
          }
          founders = await getFoundersByProject(searchTerm);
          break;

        case 'global-search':
          if (!searchTerm) {
            return {
              founders: [],
              count: 0,
              message: 'Error: searchTerm is required for global-search',
            };
          }
          founders = await searchFoundersGlobal(searchTerm);
          break;

        default:
          return {
            founders: [],
            count: 0,
            message: `Error: Unknown search type "${searchType}"`,
          };
      }

      // Debug logging to see what we're returning
      console.log(`🔍 [queryFoundersTool] Returning ${founders.length} founders`);
      if (founders.length <= 5) {
        console.log('🔍 [queryFoundersTool] First few founders:', founders.slice(0, 5).map(f => ({ name: f.name, yearsOfXp: f.yearsOfXp })));
      }

      return {
        founders,
        count: founders.length,
        message:
          founders.length === 0
            ? `No founders found${searchTerm ? ` matching "${searchTerm}"` : ''}`
            : `Found ${founders.length} founder(s)${searchTerm ? ` matching "${searchTerm}"` : ''}`,
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
