#!/usr/bin/env tsx
/**
 * Analyze the overlap between founders and founders_grid_data tables
 */

import { db } from './index.js';
import { founders, foundersGridData } from './schemas/index.js';
import { sql } from 'drizzle-orm';

async function analyzeOverlap() {
  console.log('Analyzing overlap between founders tables...\n');

  // Get all records
  const profileBook = await db.select().from(founders);
  const gridView = await db.select().from(foundersGridData);

  console.log(`Profile Book: ${profileBook.length} records`);
  console.log(`Grid View: ${gridView.length} records\n`);

  // Check ID overlap
  const profileIds = new Set(profileBook.map(f => f.id));
  const gridIds = new Set(gridView.map(f => f.id));

  const overlappingIds = [...profileIds].filter(id => gridIds.has(id));
  const onlyInProfile = [...profileIds].filter(id => !gridIds.has(id));
  const onlyInGrid = [...gridIds].filter(id => !profileIds.has(id));

  console.log('📊 ID Overlap Analysis:');
  console.log(`  IDs in both tables: ${overlappingIds.length}`);
  console.log(`  Only in Profile Book: ${onlyInProfile.length}`);
  console.log(`  Only in Grid View: ${onlyInGrid.length}`);

  if (overlappingIds.length > 0) {
    console.log('\n✓ Tables have overlapping records - can join by ID');
    console.log('\nSample overlapping founder:');
    const sampleId = overlappingIds[0];
    const inProfile = profileBook.find(f => f.id === sampleId);
    const inGrid = gridView.find(f => f.id === sampleId);

    console.log(`  Profile Book - Name: ${inProfile?.name}, Email: ${inProfile?.email}`);
    console.log(`  Grid View    - Name: ${inGrid?.name}, Email: ${inGrid?.emailAddress}`);
  } else {
    console.log('\n⚠️  No overlapping IDs - tables represent different record sets');
    console.log('   Need to match by name/email instead of ID');
  }

  // Check name overlap (case-insensitive)
  const profileNames = new Set(
    profileBook.map(f => f.name?.toLowerCase().trim()).filter(Boolean)
  );
  const gridNames = new Set(
    gridView.map(f => f.name?.toLowerCase().trim()).filter(Boolean)
  );

  const overlappingNames = [...profileNames].filter(name => gridNames.has(name));

  console.log('\n📊 Name Overlap Analysis:');
  console.log(`  Names in both tables: ${overlappingNames.length}`);

  if (overlappingNames.length > 0) {
    console.log('\n✓ Found matching names - can join by name');
    console.log('\nSample matches by name:');
    overlappingNames.slice(0, 3).forEach(name => {
      const inProfile = profileBook.find(f => f.name?.toLowerCase().trim() === name);
      const inGrid = gridView.find(f => f.name?.toLowerCase().trim() === name);
      console.log(`\n  "${inProfile?.name}"`);
      console.log(`    Profile Book - Email: ${inProfile?.email}, ID: ${inProfile?.id}`);
      console.log(`    Grid View    - Email: ${inGrid?.emailAddress}, ID: ${inGrid?.id}`);
    });
  }

  // Recommendation
  console.log('\n\n🎯 Recommendation:');
  if (overlappingIds.length > 20) {
    console.log('  ✓ Use JOIN by ID - most reliable approach');
  } else if (overlappingNames.length > 20) {
    console.log('  ✓ Use JOIN by name - IDs don\'t match but names do');
  } else {
    console.log('  ⚠️  Tables represent different datasets');
    console.log('  → Use UNION ALL to combine all records');
    console.log('  → Or keep them separate and query both');
  }
}

analyzeOverlap()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
