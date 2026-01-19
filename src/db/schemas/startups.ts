import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const startups = sqliteTable('startups', {
  id: text('id').primaryKey().notNull(),
  startup: text('startup'),
  industry: text('industry'),
  startupInAWord: text('startup_in_a_word'),
  teamMembers: text('team_members'),
  tractionSummary: text('traction_summary'),
  detailedProgress: text('detailed_progress'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Startup = typeof startups.$inferSelect;
export type NewStartup = typeof startups.$inferInsert;
