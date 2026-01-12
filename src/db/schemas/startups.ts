import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/**
 * Startups table schema based on Startups Airtable table
 * Maps to the startups-table-ref.json structure
 *
 * This schema represents startup information from the Pioneers accelerator program.
 * All fields are nullable to match Airtable's optional field structure.
 * Each field includes its Airtable field ID in the comment for traceability.
 */
export const startups = sqliteTable('startups', {
  // Primary key - using Airtable record ID
  id: text('id').primaryKey().notNull(),

  // Basic Information
  // Airtable ID: fldA82NTk7duTwdVO
  startup: text('startup'),
  // Airtable ID: flduc7bH38SHYwrSG
  industry: text('industry'),
  // Airtable ID: fld6BW7qxBJ3YE2Wc
  startupInAWord: text('startup_in_a_word'),
  // Airtable ID: fldyCgeN9ePx0chyW
  teamMembers: text('team_members'),

  // Progress & Traction
  // Airtable ID: fldLoDkUtrEVC8VLO
  tractionSummary: text('traction_summary'),
  // Airtable ID: fld2Arvu7GVTN0phX
  detailedProgress: text('detailed_progress'),

  // Additional Resources
  // Airtable ID: fldKmiI0gYosRaeh8
  previousDecks: text('previous_decks'),

  // Timestamps (not from Airtable - managed by database)
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Type inference for selecting startups
 */
export type Startup = typeof startups.$inferSelect;

/**
 * Type inference for inserting new startups
 */
export type NewStartup = typeof startups.$inferInsert;
