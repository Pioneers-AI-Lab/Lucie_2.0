import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const founders = sqliteTable('founders', {
  id: text('id').primaryKey().notNull(),
  founder: text('founder'),
  name: text('name'),
  whatsapp: text('whatsapp'),
  email: text('email'),
  yourPhoto: text('your_photo'),
  education: text('education'),
  nationality: text('nationality'),
  gender: text('gender'),
  yearsOfXp: text('years_of_xp'),
  degree: text('degree'),
  academicField: text('academic_field'),
  linkedin: text('linkedin'),
  introduction: text('introduction'),
  techSkills: text('tech_skills'),
  industries: text('industries'),
  rolesICouldTake: text('roles_i_could_take'),
  companiesWorked: text('companies_worked'),
  batch: text('batch'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Founder = typeof founders.$inferSelect;
export type NewFounder = typeof founders.$inferInsert;
