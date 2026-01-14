import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/**
 * Founders Grid Data table schema based on Grid View Airtable table
 * Maps to the founders/grid-view-table-ref.json structure
 *
 * This schema represents founder data from the Grid View in Airtable.
 * All fields are nullable to match Airtable's optional field structure.
 * Each field includes its Airtable field ID in the comment for traceability.
 */
export const foundersGridData = sqliteTable('founders_grid_data', {
  // Primary key - using Airtable record ID
  id: text('id').primaryKey().notNull(),

  // Basic Information
  // Airtable ID: fldsr8a3WAHYzOJrI
  name: text('name'),
  // Airtable ID: fldWjyfQXL8yBb42s
  mobileNumber: text('mobile_number'),
  // Airtable ID: fldohngERhYlFLnyF
  emailAddress: text('email_address'),
  // Airtable ID: fldhgngyzB7U1wwSG
  photo: text('photo'),
  // Airtable ID: fldJ5Fpec4FBZFqPO
  linkedin: text('linkedin'),
  // Airtable ID: fld8d4Kq5mJjlfi6n
  introMessage: text('intro_message'),
  // Airtable ID: fld40Qb2Iy8KxgV0o
  technical: text('technical'),
  // Airtable ID: fld6zRqySSIG5UVLD
  age: text('age'),
  // Airtable ID: fld2v5HBSXKokjTrG
  nationality: text('nationality'),
  // Airtable ID: fldcjn3YhPoDRT64G
  batch: text('batch_n'),
  // Airtable ID: fldkuBIMd9oCG54Sc
  itExpertise: text('it_expertise'),
  // Airtable ID: fldBZTfVtUKSR3Ue1
  proKeywords: text('pro_keywords'),
  // Airtable ID: fld7W5FD8dNRjGvu4
  personalKeywords: text('personal_keywords'),
  // Airtable ID: fldANe1v4F7x7SkeD
  pitch: text('pitch'),

  // Timestamps (not from Airtable - managed by database)
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Type inference for selecting founders grid data
 */
export type FounderGridData = typeof foundersGridData.$inferSelect;

/**
 * Type inference for inserting new founders grid data
 */
export type NewFounderGridData = typeof foundersGridData.$inferInsert;
