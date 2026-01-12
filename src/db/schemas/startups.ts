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
  // Airtable ID: fld6Yx9hCxozMgknD
  pitchSequence: integer('pitch_sequence'),
  // Airtable ID: flduc7bH38SHYwrSG
  industry: text('industry'),
  // Airtable ID: fld6BW7qxBJ3YE2Wc
  startupInAWord: text('startup_in_a_word'),
  // Airtable ID: fldYpMoV3drUxnfZ8
  activeInactive: text('active_inactive'),

  // Relationships & References
  // Airtable ID: fldzdaRoe75HUWYmh
  weeklyForms: text('weekly_forms'),
  // Airtable ID: fldyCgeN9ePx0chyW
  teamMembers: text('team_members'),
  // Airtable ID: fldUCeQYvsu5kiJil
  committee: text('committee'),
  // Airtable ID: fldTu3HV4il5iwLxT
  fundingApplications: text('funding_applications'),
  // Airtable ID: fld6a9TUTUeaNySzd
  startupEvaluation: text('startup_evaluation'),
  // Airtable ID: fldv7klSlCJTIp4ZH
  startupEvaluationCopy: text('startup_evaluation_copy'),

  // Notes & Documentation
  // Airtable ID: fldhGDTxgl3th6DkL
  notes: text('notes'),
  // Airtable ID: fldgokIMd3VxtBqvm
  fullNotes: text('full_notes'),
  // Airtable ID: fld01lYeq1NrVdCPA
  maximeComment: text('maxime_comment'),

  // Progress & Traction
  // Airtable ID: fldLoDkUtrEVC8VLO
  tractionSummary: text('traction_summary'),
  // Airtable ID: fldgcuEeyIKLRg6aT
  tractionSummaryOld: text('traction_summary_old'),
  // Airtable ID: fld2Arvu7GVTN0phX
  detailedProgress: text('detailed_progress'),
  // Airtable ID: fldlhhx2Gk9yHadsF
  detailedProgressOld: text('detailed_progress_old'),

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
