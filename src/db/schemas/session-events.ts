import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/**
 * Session Events table schema based on Session Event Airtable table
 * Maps to the session-event-table-ref.json structure
 *
 * This schema represents session events from the Pioneers accelerator program.
 * All fields are nullable to match Airtable's optional field structure.
 * Each field includes its Airtable field ID in the comment for traceability.
 */
export const sessionEvents = sqliteTable('session_events', {
  // Primary key - using Airtable record ID
  id: text('id').primaryKey().notNull(),

  // Basic Information
  name: text('name'),
  date: integer('date', { mode: 'timestamp' }),
  programWeek: text('program_week'),
  typeOfSession: text('type_of_session'),
  speaker: text('speaker'),

  // Communication & Participants
  emails: text('emails'),
  slackInstructionEmailCommu: text('slack_instruction_email_commu'),
  participants: text('participants'),

  // Notes & Documentation
  notesFeedback: text('notes_feedback'),
  notes2: text('notes_2'),

  // Resources
  attachments: text('attachments'),

  // Linked Data
  nameFromLinked: text('name_from_linked'),

  // Timestamps (not from Airtable - managed by database)
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Type inference for selecting session events
 */
export type SessionEvent = typeof sessionEvents.$inferSelect;

/**
 * Type inference for inserting new session events
 */
export type NewSessionEvent = typeof sessionEvents.$inferInsert;
