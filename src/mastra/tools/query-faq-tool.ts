/**
 * Query FAQ Tool - Turso Database
 *
 * Queries FAQ data from the local Turso database.
 * Fast queries with no rate limits.
 *
 * Source: data/general-questions.json
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { db } from '../../db/index.js';
import { faq } from '../../db/schemas/faq.js';
import { eq, like, or, sql } from 'drizzle-orm';

/**
 * Query FAQs from Turso database
 * Supports multiple search strategies for flexibility
 */
export const queryFAQTool = createTool({
  id: 'query-faq-turso',
  description: `Query frequently asked questions about the Pioneers accelerator program from the database.

  Contains comprehensive FAQ information across 7 categories:
  - program_overview: General program information, philosophy, and outcomes
  - eligibility_and_profile: Who can apply, requirements, and founder profiles
  - team_formation: Co-founder matching, team building, and equity guidance
  - application_process: How to apply, selection criteria, and timelines
  - funding_and_equity: Funding terms, equity requirements, and fundraising support
  - station_f_and_resources: Station F access, perks, and facilities
  - miscellaneous: Language, contact info, and general questions

  Search types:
  - "all": Get all FAQ entries (use when user asks broad questions like "tell me about the program")
  - "by-category": Filter by specific category (e.g., "application_process", "funding_and_equity")
  - "search": Search across questions and answers for keywords (best for specific topics like "funding", "co-founder", "apply")
  - "count": Get total number of FAQ entries

  Use this tool for:
  - General program questions ("What is Pioneers?", "How does the program work?")
  - Eligibility questions ("Can I apply?", "Who is eligible?")
  - Application questions ("How do I apply?", "When is the deadline?")
  - Funding questions ("Does Pioneers provide funding?", "How much equity?")
  - Team questions ("Can I find a co-founder?", "What about solo founders?")
  - Station F questions ("What is Station F?", "Do I get access?")
  - Any other general program-related questions

  Choose search strategy:
  - Use "search" for specific keywords or topics (fastest, most targeted)
  - Use "by-category" when user asks about a specific area (e.g., "tell me about funding")
  - Use "all" only when user asks very broad questions or you can't determine the topic

  Examples:
  - "Does Pioneers provide funding?" → {searchType: "search", searchTerm: "funding"}
  - "How do I apply?" → {searchType: "by-category", category: "application_process"}
  - "Can I find a co-founder?" → {searchType: "search", searchTerm: "co-founder"}
  - "Tell me everything about the program" → {searchType: "all"}
  - "What are the eligibility requirements?" → {searchType: "by-category", category: "eligibility_and_profile"}
  - "How many FAQs are there?" → {searchType: "count"}
  `,

  inputSchema: z.object({
    searchType: z
      .union([
        z.literal('all'),
        z.literal('by-category'),
        z.literal('search'),
        z.literal('count'),
      ])
      .describe('Type of search to perform'),
    category: z
      .string()
      .optional()
      .describe(
        'Category name (required for "by-category" search). Valid values: program_overview, eligibility_and_profile, team_formation, application_process, funding_and_equity, station_f_and_resources, miscellaneous',
      ),
    searchTerm: z
      .string()
      .optional()
      .describe(
        'Search term (required for "search" type). Searches in both questions and answers.',
      ),
  }),

  outputSchema: z.object({
    faqs: z
      .array(
        z.object({
          id: z.string(),
          question: z.string().nullable(),
          answer: z.string().nullable(),
          category: z.string().nullable(),
          program: z.string().nullable(),
          location: z.string().nullable(),
          intendedUse: z.string().nullable(),
          answerStyle: z.string().nullable(),
        }),
      )
      .optional(),
    count: z.number(),
    message: z.string().optional(),
  }),

  execute: async (input) => {
    const { searchType, category, searchTerm } = input;

    // Debug logging
    console.log('❓ [queryFAQTool] Called with:', { searchType, category, searchTerm });

    try {
      // Handle count-only request
      if (searchType === 'count') {
        const result = await db.select({ count: sql<number>`count(*)` }).from(faq);
        const count = result[0].count;
        return {
          count,
          message: `Total FAQ entries in database: ${count}`,
        };
      }

      // Handle search requests
      let faqs;

      switch (searchType) {
        case 'all':
          faqs = await db.select().from(faq);
          break;

        case 'by-category':
          if (!category) {
            return {
              faqs: [],
              count: 0,
              message: 'Error: category is required for by-category search',
            };
          }
          faqs = await db.select().from(faq).where(eq(faq.category, category));
          break;

        case 'search':
          if (!searchTerm) {
            return {
              faqs: [],
              count: 0,
              message: 'Error: searchTerm is required for search',
            };
          }
          const pattern = `%${searchTerm}%`;
          faqs = await db
            .select()
            .from(faq)
            .where(
              or(
                like(faq.question, pattern),
                like(faq.answer, pattern)
              )
            );
          break;

        default:
          return {
            faqs: [],
            count: 0,
            message: `Error: Unknown search type "${searchType}"`,
          };
      }

      // Debug logging
      console.log(`❓ [queryFAQTool] Returning ${faqs.length} FAQ entries`);

      return {
        faqs,
        count: faqs.length,
        message:
          faqs.length === 0
            ? `No FAQs found${searchTerm ? ` matching "${searchTerm}"` : ''}${category ? ` in category "${category}"` : ''}`
            : `Found ${faqs.length} FAQ(s)${searchTerm ? ` matching "${searchTerm}"` : ''}${category ? ` in category "${category}"` : ''}`,
      };
    } catch (error: any) {
      console.error('❌ [queryFAQTool] Database error:', error);
      return {
        faqs: [],
        count: 0,
        message: `Database error: ${error.message}`,
      };
    }
  },
});
