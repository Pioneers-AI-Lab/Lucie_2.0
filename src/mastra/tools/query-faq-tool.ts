/**
 * Query FAQ Tool - Turso Database
 *
 * Queries FAQ data from the local Turso database.
 * Fast queries with no rate limits.
 *
 * Sources:
 * - data/general-questions.json (52 FAQs)
 * - data/sessions-faq.json (34 FAQs)
 * - data/startups-faq.json (39 FAQs)
 * - data/founders-faq.json (36 FAQs)
 * - data/2025-sessions-events-info-faq.json (36 FAQs) - Specific 2025 events, speakers, milestones
 *
 * Total: 197 FAQs across 40 categories
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
  Contains 197 comprehensive FAQs across 40 categories in 5 domains:

  📋 GENERAL PROGRAM (52 FAQs, 7 categories):
  - program_overview: General program information, philosophy, and outcomes
  - eligibility_and_profile: Who can apply, requirements, and founder profiles
  - team_formation: Co-founder matching, team building, and equity guidance (general)
  - application_process: How to apply, selection criteria, and timelines
  - funding_and_equity: Funding terms, equity requirements, and fundraising support
  - station_f_and_resources: Station F access, perks, and facilities
  - miscellaneous: Language, contact info, and general questions

  📅 SESSIONS & EVENTS (34 FAQs, 7 categories):
  - session_types_overview: Different types of sessions and their purposes
  - office_hours_and_mentorship: How office hours work, mentor access
  - attendance_and_participation: Attendance policies, engagement expectations
  - program_milestones: Key events like Selection Day, Demo Day
  - schedule_and_logistics: Session timing, locations, formats
  - weekly_updates_and_progress: Update requirements, progress tracking
  - miscellaneous: General session-related questions

  🚀 STARTUPS & ENTREPRENEURSHIP (39 FAQs, 9 categories):
  - team_formation: Building teams, co-founder dynamics (startup-specific)
  - progress_tracking: How to track and measure progress
  - traction_and_validation: Customer conversations, LOIs, validation strategies
  - product_development: MVP, iteration, product-market fit
  - pitching_and_feedback: Pitch preparation, receiving feedback, IC readiness
  - market_and_industry: Market sizing, industry research, TAM/SAM/SOM
  - investment_readiness: Preparing for investment committee, investor conversations
  - go_to_market_strategy: GTM planning, customer acquisition
  - common_challenges: Typical founder challenges and solutions

  👥 FOUNDERS & CO-FOUNDER MATCHING (36 FAQs, 8 categories):
  - profile_book_overview: Understanding the Pioneers Profile Book
  - finding_cofounders: Strategies for finding co-founders in the program
  - understanding_profiles: How to read and interpret founder profiles
  - skills_and_expertise: Finding founders with specific skills/experience
  - batch_and_timing: Understanding batches, availability, commitments
  - project_alignment: Finding founders with aligned interests/projects
  - background_and_education: Evaluating educational and professional backgrounds
  - communication_and_outreach: How to contact founders, outreach best practices

  🎤 2025 SESSIONS & EVENTS INFO (36 FAQs, 9 categories):
  - masterclass_speakers: Specific masterclasses and speakers (Alexis Robert/KIMA, Emmanuel Straschnov/Bubble, Salomon Aiach, Bruno Aziza, etc.)
  - social_events: Community drinks, dinners, board game nights, Lunch Roulette
  - program_milestones: Selection Day, Pre-IC, IC details and results
  - group_exercises_challenges: Worst Startup, Startup Challenge, Distribution Machine
  - friday_pitches: Weekly pitch sessions and formats
  - theme_sessions: Theme-based events and weekly themes
  - office_hours_support: Office hours structure and LinkedIn support
  - program_logistics: Kick-off, Basecamp Day, attendance, weekly updates
  - special_announcements: Station F perks, feedback forms, alumni info

  ⚙️ Search types:
  - "search": Search across questions and answers for keywords (RECOMMENDED - fastest and most targeted)
  - "by-category": Filter by specific category name (use when targeting specific domain)
  - "all": Get all 161 FAQ entries (use sparingly - only for very broad questions)
  - "count": Get total number of FAQ entries

  🎯 When to use this tool vs data tools:
  - Use queryFAQTool for: "How do I...?", "What should I...?", "How does X work?", "What is...?" (guidance/explanation)
  - Use queryFoundersTool for: "Show me founders...", "Who are the CTOs?", "Find developers..." (actual founder data)
  - Use querySessionsTool for: "When is the next session?", "Show me workshops...", "List upcoming events..." (actual session data)
  - Use queryStartupsTool for: "Show me FinTech startups...", "Which startups are...?", "List companies..." (actual startup data)

  💡 Examples:
  - "How do I find a co-founder?" → {searchType: "search", searchTerm: "find co-founder"} (FAQ)
  - "Show me all CTOs" → Use queryFoundersTool (data)
  - "What should I include in my pitch?" → {searchType: "search", searchTerm: "pitch"} (FAQ)
  - "When is the next session?" → Use querySessionsTool (data)
  - "How do I validate my idea?" → {searchType: "search", searchTerm: "validation"} (FAQ)
  - "Show me AI startups" → Use queryStartupsTool (data)
  - "What is an LOI?" → {searchType: "search", searchTerm: "LOI"} (FAQ)
  - "What does years_of_xp mean?" → {searchType: "search", searchTerm: "years of experience"} (FAQ)
  - "Who was Emmanuel Straschnov?" → {searchType: "search", searchTerm: "Emmanuel Straschnov"} (FAQ - 2025 speaker info)
  - "What was the Alexis Robert event?" → {searchType: "search", searchTerm: "Alexis Robert"} (FAQ - 2025 event details)
  - "Tell me about Selection Day" → {searchType: "search", searchTerm: "Selection Day"} (FAQ - 2025 milestone)
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
        'Category name (required for "by-category" search). Valid categories: ' +
        'GENERAL: program_overview, eligibility_and_profile, team_formation, application_process, funding_and_equity, station_f_and_resources, miscellaneous | ' +
        'SESSIONS: session_types_overview, office_hours_and_mentorship, attendance_and_participation, program_milestones, schedule_and_logistics, weekly_updates_and_progress | ' +
        'STARTUPS: progress_tracking, traction_and_validation, product_development, pitching_and_feedback, market_and_industry, investment_readiness, go_to_market_strategy, common_challenges | ' +
        'FOUNDERS: profile_book_overview, finding_cofounders, understanding_profiles, skills_and_expertise, batch_and_timing, project_alignment, background_and_education, communication_and_outreach | ' +
        '2025 EVENTS: masterclass_speakers, social_events, program_milestones, group_exercises_challenges, friday_pitches, theme_sessions, office_hours_support, program_logistics, special_announcements',
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
