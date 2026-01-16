import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/**
 * FAQ table schema based on general-questions.json structure
 *
 * Source: data/general-questions.json
 *
 * JSON Structure:
 * {
 *   "program": "Pioneers Accelerator",
 *   "location": "Station F",
 *   "knowledge_base": {
 *     "program_overview": [{ question, answer }, ...],
 *     "eligibility_and_profile": [{ question, answer }, ...],
 *     "team_formation": [{ question, answer }, ...],
 *     "application_process": [{ question, answer }, ...],
 *     "funding_and_equity": [{ question, answer }, ...],
 *     "station_f_and_resources": [{ question, answer }, ...],
 *     "miscellaneous": [{ question, answer }, ...]
 *   },
 *   "metadata": {
 *     "intended_use": "Slack chatbot knowledge base",
 *     "answer_style": "Neutral, informational, non-committal",
 *     "last_updated": "2025-12-16"
 *   }
 * }
 *
 * This schema represents individual FAQ entries from the knowledge_base categories.
 */
export const faq = sqliteTable('faq', {
  // Primary key - using generated UUID or sequential ID
  id: text('id').primaryKey().notNull(),

  // Q&A content (from knowledge_base items)
  question: text('question').notNull(),
  answer: text('answer').notNull(),

  // Category from knowledge_base structure
  // Values: program_overview, eligibility_and_profile, team_formation,
  //         application_process, funding_and_equity, station_f_and_resources, miscellaneous
  category: text('category').notNull(),

  // Top-level JSON fields (same for all FAQs from same source)
  program: text('program'), // e.g., "Pioneers Accelerator"
  location: text('location'), // e.g., "Station F"

  // Metadata fields (from JSON metadata section - typically same for all FAQs)
  intendedUse: text('intended_use'), // e.g., "Slack chatbot knowledge base"
  answerStyle: text('answer_style'), // e.g., "Neutral, informational, non-committal"

  // Timestamps (not from JSON - managed by database)
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Type inference for selecting FAQs
 */
export type FAQ = typeof faq.$inferSelect;

/**
 * Type inference for inserting new FAQs
 */
export type NewFAQ = typeof faq.$inferInsert;
