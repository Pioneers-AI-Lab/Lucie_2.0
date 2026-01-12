import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/**
 * Founders table schema based on Pioneers Profile Book Airtable table
 * Maps to the founders/pioneers-profile-book-table-ref.json structure
 *
 * This schema represents founder profiles from the Pioneers accelerator program.
 * All fields are nullable to match Airtable's optional field structure.
 * Each field includes its Airtable field ID in the comment for traceability.
 */
export const founders = sqliteTable('founders', {
  // Primary key - using Airtable record ID
  id: text('id').primaryKey().notNull(),

  // Personal Information
  // Airtable ID: fldXCZWHOholJbcR2
  name: text('name'),
  // Airtable ID: fldW6J9Dlp9vFvOKR
  email: text('email'),
  // Airtable ID: fldbtz03NepUnVH27
  whatsapp: text('whatsapp'),
  // Airtable ID: fldmOlACIX4XSmGfv
  linkedin: text('linkedin'),
  // Airtable ID: flduygNAZDw15dcyK
  yourPhoto: text('your_photo'),

  // Status & Enrollment
  // Airtable ID: fldIUIWQideaWfdiT
  status: text('status'),
  // Airtable ID: fldqAT4ow4jSGCbZe
  confirmEnrolment: text('confirm_enrolment'),
  // Airtable ID: fldBepgICe1g9FANb
  leftProgram: text('left_program'),

  // Project Information
  // Airtable ID: fldT1xLAq6sWDdYru
  existingProjectIdea: text('existing_project_idea'),
  // Airtable ID: fldSUjWFCUVNTVKBf
  projectExplanation: text('project_explanation'),
  // Airtable ID: fldnlonPuFyv5EaLP
  existingCofounderName: text('existing_cofounder_name'),
  // Airtable ID: fldqRh6cufYTp0FTF
  joiningWithCofounder: text('joining_with_cofounder'),
  // Airtable ID: fldG8Dw7iV7RSWu56
  openToJoinAnotherProject: text('open_to_join_another_project'),

  // Referral & Source
  // Airtable ID: fldi4hgfTXf1r6GIO
  howDidYouHear: text('how_did_you_hear'),
  // Airtable ID: fld8w9ZOpS1gsbFW2
  referralSource: text('referral_source'),

  // Additional Information
  // Airtable ID: fldwUAynGMpP8zEBW
  anythingToLetUsKnow: text('anything_to_let_us_know'),

  // Profile Details
  // Airtable ID: fld3GPP09YrmwMgSU
  introduction: text('introduction'),
  // Airtable ID: fldJ9yZg6O6kMxJwQ
  techSkills: text('tech_skills'),
  // Airtable ID: fld0w3PxAafyQtwDx
  industries: text('industries'),
  // Airtable ID: fldcASpXNUhURfM3e
  rolesICouldTake: text('roles_i_could_take'),
  // Airtable ID: fldxhTo33WQdcwN7W
  trackRecordProud: text('track_record_proud'),
  // Airtable ID: fld8VpuxqYSoG7HZc
  anythingElseWorthMentioning: text('anything_else_worth_mentioning'),
  // Airtable ID: fld80oQIizX3pqKn8
  interestedInWorkingOn: text('interested_in_working_on'),

  // Demographics
  // Airtable ID: fldb2ZgofUqLgYr9D
  nationality: text('nationality'),
  // Airtable ID: fld6sYQmTJAvxxh5Y
  gender: text('gender'),
  // Airtable ID: fldNlvxotHY13xj13
  yearsOfXp: integer('years_of_xp'),

  // Education
  // Airtable ID: fldwh9kSEbgWYvZwx
  education: text('education'),
  // Airtable ID: fldadoQzo3ag7t8ng
  degree: text('degree'),
  // Airtable ID: fldzTd96TnSJ90VUm
  academicField: text('academic_field'),

  // Professional Background
  // Airtable ID: fldcuBy6DezL26rbs (NOTE: Duplicate ID with tShirtHandedOut)
  companiesWorked: text('companies_worked'),

  // Logistics
  // Airtable ID: fldgb0RgPtja4aToK
  tShirtSize: text('t_shirt_size'),
  // Airtable ID: fldcuBy6DezL26rbs (NOTE: Duplicate ID with companiesWorked)
  tShirtHandedOut: text('t_shirt_handed_out'),

  // Relationships
  // Airtable ID: fldPCcEhQefOf94Vz
  founder: text('founder'), // Reference to founder record

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
