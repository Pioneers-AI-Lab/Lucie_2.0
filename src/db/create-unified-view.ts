#!/usr/bin/env tsx
/**
 * Create a unified view combining founders and founders_grid_data
 *
 * IMPORTANT: These tables represent DIFFERENT people (zero overlap).
 * - Profile Book: 37 founders with detailed professional data
 * - Grid View: 100 founders with essential contact info
 * Total: 137 unique founders
 *
 * This view uses UNION ALL to combine both datasets.
 */

import { db } from './index.js';
import { sql } from 'drizzle-orm';

async function createUnifiedView() {
  console.log('Creating founders_unified view...');

  // Drop existing view if it exists
  await db.run(sql`DROP VIEW IF EXISTS founders_unified`);

  // Create unified view
  // Strategy: UNION ALL both tables into a single queryable view
  // Note: Inline SQL comments removed to avoid Drizzle Studio parsing issues
  await db.run(sql`
    CREATE VIEW founders_unified AS
    SELECT
      id,
      name,
      email,
      whatsapp as phone,
      linkedin,
      nationality,
      NULL as age,
      batch_n as batch,
      status,
      track_record_proud as track_record,
      roles_i_could_take as roles,
      tech_skills,
      industries,
      interested_in_working_on as interested_in,
      companies_worked,
      education,
      degree,
      academic_field,
      years_of_xp as years_of_experience,
      introduction,
      project_explanation as pitch,
      existing_project_idea as has_existing_project,
      existing_cofounder_name as cofounder_name,
      joining_with_cofounder,
      open_to_join_another_project as open_to_join_project,
      your_photo as photo,
      NULL as pro_keywords,
      NULL as personal_keywords,
      left_program,
      created_at,
      updated_at,
      'profile_book' as source
    FROM founders
    UNION ALL
    SELECT
      id,
      name,
      email_address as email,
      mobile_number as phone,
      linkedin,
      nationality,
      age,
      batch_n as batch,
      NULL as status,
      NULL as track_record,
      NULL as roles,
      it_expertise as tech_skills,
      NULL as industries,
      NULL as interested_in,
      NULL as companies_worked,
      NULL as education,
      NULL as degree,
      NULL as academic_field,
      NULL as years_of_experience,
      intro_message as introduction,
      pitch,
      NULL as has_existing_project,
      NULL as cofounder_name,
      NULL as joining_with_cofounder,
      NULL as open_to_join_project,
      photo,
      pro_keywords,
      personal_keywords,
      NULL as left_program,
      created_at,
      updated_at,
      'grid_view' as source
    FROM founders_grid_data
  `);

  console.log('✓ Successfully created founders_unified view');

  // Test the view
  const result = await db.all(sql`SELECT COUNT(*) as count FROM founders_unified`);
  const count = (result as any[])[0]?.count ?? 0;
  console.log(`✓ View contains ${count} founders (37 from Profile Book + 100 from Grid View)`);

  // Show counts by source
  const sourceCounts = await db.all(sql`
    SELECT source, COUNT(*) as count
    FROM founders_unified
    GROUP BY source
  `);
  console.log('\n📊 Breakdown by source:');
  sourceCounts.forEach((row: any) => {
    console.log(`  ${row.source}: ${row.count} founders`);
  });

  // Show sample from each source
  const sample = await db.all(sql`
    SELECT name, email, phone, linkedin, nationality, age, batch, tech_skills, source
    FROM founders_unified
    LIMIT 3
  `);

  console.log('\n📋 Sample data from unified view:');
  sample.forEach((row: any) => {
    console.log(`\n  Name: ${row.name}`);
    console.log(`  Email: ${row.email}`);
    console.log(`  Phone: ${row.phone}`);
    console.log(`  LinkedIn: ${row.linkedin?.substring(0, 50)}...`);
    console.log(`  Nationality: ${row.nationality}`);
    console.log(`  Age: ${row.age || 'N/A'}`);
    console.log(`  Batch: ${row.batch}`);
    console.log(`  Tech Skills: ${row.tech_skills?.substring(0, 60)}...`);
    console.log(`  Source: ${row.source}`);
  });
}

createUnifiedView()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
