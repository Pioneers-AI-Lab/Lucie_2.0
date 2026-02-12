import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const sessionEvents = sqliteTable('session_events', {
  id: text('id').primaryKey().notNull(),
  name: text('name'),
  date: integer('date', { mode: 'timestamp' }),
  programWeek: text('program_week'),
  typeOfSession: text('type_of_session'),
  speaker: text('speaker'),
  notesFeedback: text('notes_feedback'),
  slackInstructions: text('slack_instruction_email_commu'),
  emails: text('emails'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type SessionEvent = typeof sessionEvents.$inferSelect;
export type NewSessionEvent = typeof sessionEvents.$inferInsert;
