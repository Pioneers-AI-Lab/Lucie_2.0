#!/usr/bin/env tsx
/**
 * Fix the pioneers_profile_book_table_records_readable.json file
 * Maps the misaligned field names to the correct field names based on
 * the pioneers-profile-book-table-ref.json structure
 */

import fs from 'fs';
import path from 'path';

// Input and output paths
const INPUT_FILE = path.join(
  process.cwd(),
  'data/2025-Cohort_Data/JSON/founders/pioneers_profile_book_table_records_readable.json'
);
const OUTPUT_FILE = path.join(
  process.cwd(),
  'data/2025-Cohort_Data/JSON/founders/pioneers_profile_book_table_records_readable_FIXED.json'
);

// Field mapping: OLD_NAME → NEW_NAME
// Based on analysis of the data corruption pattern
const FIELD_MAPPING: Record<string, string> = {
  'Email': 'name',
  'Education': 'email',
  'Track record / something I am proud of ': 'whatsapp',
  'LinkedIn': 'nationality',
  'Industries': 'linkedin',
  'Nationality': 'status',
  'Batch': 'companies_worked',
  'Your Photo': 'your_photo',
  'Roles I could take': 'tech_skills',
  'Name': 'roles_i_could_take',
  'Status': 'track_record_proud',
  'Are you open to join another project during the program? ': 'batch',
  'Companies Worked': 'degree',
  'Degree': 'existing_project_idea',
  'Do you have an existing project/idea ?': 'education',
  'Founder': 'gender',
  'Gender': 'left_program',
  '"If yes': 'industries',
  'Tech Skills': 'interested_in_working_on',
  'What I am interested in working on:': 'years_of_xp',
  'Introduction:': 'founder',
  ' explain it in a few words"': 'introduction',
  'Academic Field': 'academic_field',
  ' please insert his/her name below."': 'joining_with_cofounder',
  '"Are you joining with an existing cofounder? If yes': 'existing_cofounder_name',
  'I confirm my enrolment to the Pioneers program Batch SU25.': 'open_to_join_another_project',
  'Whatsapp': 'project_explanation', // This seems to be wrong in the source data
  'Years of XP': 'left_program_status', // Additional field not in schema
};

/**
 * Normalize batch values
 */
function normalizeBatch(batch: string | undefined): string | undefined {
  if (!batch) return undefined;

  return batch
    .replace(/Summer\s*2025/i, 'S25')
    .replace(/Summer\s*25/i, 'S25')
    .replace(/Fall\s*2024/i, 'F24')
    .replace(/Fall\s*24/i, 'F24')
    .replace(/Spring\s*2024/i, 'S24')
    .replace(/Spring\s*24/i, 'S24')
    .trim();
}

/**
 * Convert years_of_xp to number if possible
 */
function parseYearsOfXp(value: any): number | string | undefined {
  if (value === null || value === undefined || value === '') return undefined;

  const num = typeof value === 'number' ? value : parseInt(value, 10);
  return isNaN(num) ? value : num;
}

/**
 * Fix the JSON file
 */
async function fixReadableJson() {
  console.log('Reading input file...');
  const inputData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));

  console.log(`Found ${Object.keys(inputData).length} records`);

  const fixedData: Record<string, any> = {};

  for (const [recordId, record] of Object.entries(inputData as Record<string, any>)) {
    const oldFields = record.fields || {};
    const newFields: Record<string, any> = {};

    // Map each field to the correct name
    for (const [oldName, value] of Object.entries(oldFields)) {
      const newName = FIELD_MAPPING[oldName];

      if (newName) {
        // Apply special transformations
        if (newName === 'batch') {
          newFields[newName] = normalizeBatch(value as string);
        } else if (newName === 'years_of_xp') {
          newFields[newName] = parseYearsOfXp(value);
        } else {
          newFields[newName] = value;
        }
      } else {
        // Keep unmapped fields as-is (for debugging)
        console.warn(`Unmapped field: "${oldName}"`);
        newFields[`_unmapped_${oldName}`] = value;
      }
    }

    fixedData[recordId] = {
      createdTime: record.createdTime,
      fields: newFields,
    };
  }

  console.log('Writing fixed file...');
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fixedData, null, 2));

  console.log(`✓ Fixed JSON written to: ${OUTPUT_FILE}`);
  console.log(`✓ Processed ${Object.keys(fixedData).length} records`);
}

// Run
fixReadableJson().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
