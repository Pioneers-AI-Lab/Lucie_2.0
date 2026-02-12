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
  companiesWorked: text('companies_worked'),
  batch: text('batch'),
  status: text('status'),
  leftProgram: text('left_program'),
  trackRecord: text('track_record'),
  rolesICouldTake: text('roles_i_could_take'),
  interestedInWorkingOn: text('interested_in_working_on'),
  confirmEnrolment: text('confirm_enrolment'),
  existingProjectIdea: text('existing_project_idea'),
  projectExplanation: text('project_explanation'),
  existingCofounderName: text('existing_cofounder_name'),
  joiningWithCofounder: text('joining_with_cofounder'),
  openToJoinAnotherProject: text('open_to_join_another_project'),
  anythingToLetUsKnow: text('anything_to_let_us_know'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Founder = typeof founders.$inferSelect;
export type NewFounder = typeof founders.$inferInsert;
