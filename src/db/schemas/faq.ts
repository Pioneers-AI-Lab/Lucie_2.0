import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const faq = sqliteTable('faq', {
  id: text('id').primaryKey().notNull(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  category: text('category').notNull(),
  program: text('program'),
  location: text('location'),
  intendedUse: text('intended_use'),
  answerStyle: text('answer_style'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type FAQ = typeof faq.$inferSelect;
export type NewFAQ = typeof faq.$inferInsert;
