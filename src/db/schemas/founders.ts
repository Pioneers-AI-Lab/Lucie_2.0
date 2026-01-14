import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/**
 * Founders table schema based on Pioneers Profile Book Airtable table
 * Maps to founders/pioneers-profile-book-table-ref.json structure
 *
 * This schema represents founder profiles from the Pioneers accelerator program.
 * All fields are nullable to match Airtable's optional field structure.
 * Each field includes its Airtable field ID in the comment for traceability.
 */
export const founders = sqliteTable('founders', {
  // Primary key - using Airtable record ID
  id: text('id').primaryKey().notNull(),

  // Basic Information
  // Airtable ID: fldXCZWHOholJbcR2
  name: text('name'),
  // Airtable ID: fldIUIWQideaWfdiT
  status: text('status'),
  // Airtable ID: fldbtz03NepUnVH27
  whatsapp: text('whatsapp'),
  // Airtable ID: fldW6J9Dlp9vFvOKR
  email: text('email'),
  // Airtable ID: flduygNAZDw15dcyK
  yourPhoto: text('your_photo'),

  // Project Information
  // Airtable ID: fldT1xLAq6sWDdYru
  existingProjectIdea: text('existing_project_idea'),
  // Airtable ID: fldSUjWFCUVNTVKBf
  projectExplanation: text('project_explanation'),
  // Airtable ID: fldnlonPuFyv5EaLP
  existingCofounderName: text('existing_cofounder_name'),
  // Airtable ID: fldG8Dw7iV7RSWu56
  openToJoinAnotherProject: text('open_to_join_another_project'),
  // Airtable ID: fldqRh6cufYTp0FTF
  joiningWithCofounder: text('joining_with_cofounder'),

  // Professional Profile
  // Airtable ID: fldmOlACIX4XSmGfv
  linkedin: text('linkedin'),
  // Airtable ID: fldJ9yZg6O6kMxJwQ
  techSkills: text('tech_skills'),
  // Airtable ID: fld0w3PxAafyQtwDx
  industries: text('industries'),
  // Airtable ID: fldcASpXNUhURfM3e
  rolesICouldTake: text('roles_i_could_take'),
  // Airtable ID: fldxhTo33WQdcwN7W
  trackRecordProud: text('track_record_proud'),
  // Airtable ID: fld80oQIizX3pqKn8
  interestedInWorkingOn: text('interested_in_working_on'),
  // Airtable ID: fld3GPP09YrmwMgSU
  introduction: text('introduction'),

  // Professional Background
  // Airtable ID: fldcuBy6DezL26rbs
  companiesWorked: text('companies_worked'),

  // Education
  // Airtable ID: fldwh9kSEbgWYvZwx
  education: text('education'),
  // Airtable ID: fldb2ZgofUqLgYr9D
  nationality: text('nationality'),
  // Airtable ID: fld6sYQmTJAvxxh5Y
  gender: text('gender'),
  // Airtable ID: fldNlvxotHY13xj13
  yearsOfXp: text('years_of_xp'),
  // Airtable ID: fldadoQzo3ag7t8ng
  degree: text('degree'),
  // Airtable ID: fldzTd96TnSJ90VUm
  academicField: text('academic_field'),

  // Relationships
  // Airtable ID: fldPCcEhQefOf94Vz
  founder: text('founder'), // Reference to founder record

  // Status
  // Airtable ID: fldBepgICe1g9FANb
  leftProgram: text('left_program'),

  // Timestamps (not from Airtable - managed by database)
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Type inference for selecting founders
 */
export type Founder = typeof founders.$inferSelect;

/**
 * Type inference for inserting new founders
 */
export type NewFounder = typeof founders.$inferInsert;
