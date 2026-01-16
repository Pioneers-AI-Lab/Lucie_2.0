import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const faq = sqliteTable('faq', {
  id: text('id').primaryKey().notNull(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
});
