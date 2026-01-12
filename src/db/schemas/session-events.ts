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
  // Airtable ID: fldCtRMft8LUuxeKo
  name: text('name'),
  // Airtable ID: fldBNgudcVrZQSrOc
  date: integer('date', { mode: 'timestamp' }),
  // Airtable ID: fldbYxhIxaeGW4Ssz
  programWeek: text('program_week'),
  // Airtable ID: fld4AgK4v55Yfv1Ow
  typeOfSession: text('type_of_session'),
  // Airtable ID: fld4nkOUEspvZQ16w
  speaker: text('speaker'),

  // Communication & Participants
  // Airtable ID: fldMrKHue2nm5HHyP
  emails: text('emails'),
  // Airtable ID: flddmEbyJanfhr4Z3
  slackInstructionEmailCommu: text('slack_instruction_email_commu'),
  // Airtable ID: fld4crP1Y4ZefqIfn
  participants: text('participants'),

  // Notes & Documentation
  // Airtable ID: fldHBorqhtBKMncTH
  notesFeedback: text('notes_feedback'),
  // Airtable ID: fld0KtDf2uaPgzmLZ
  notes2: text('notes_2'),

  // Resources
  // Airtable ID: fld9RFu4D1tSd5faT
  attachments: text('attachments'),

  // Linked Data
  // Airtable ID: fldOy6fvKgU7Lqln9
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
