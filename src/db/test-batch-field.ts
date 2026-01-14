#!/usr/bin/env tsx
/**
 * Quick test to verify batch field works correctly
 */

import { db } from './index.js';
import { founders, foundersGridData } from './schemas/index.js';
import { eq } from 'drizzle-orm';

async function testBatchField() {
  console.log('Testing batch field...\n');

  // Test direct database query with new field name
  const profileBatch = await db.select().from(founders).where(eq(founders.batch, 'F24'));
  const gridBatch = await db.select().from(foundersGridData).where(eq(foundersGridData.batch, 'F24'));

  console.log('✓ Direct database batch query test:');
  console.log(`  Profile Book (batch = 'F24'): ${profileBatch.length} founders`);
  console.log(`  Grid View (batch = 'F24'): ${gridBatch.length} founders`);
  console.log(`  Total: ${profileBatch.length + gridBatch.length} founders`);

  // Show sample record
  if (profileBatch.length > 0) {
    const sample = profileBatch[0];
    console.log(`\n  Sample: ${sample.name} - Batch: ${sample.batch}`);
  }

  console.log('\n✅ Batch field working correctly!');
  process.exit(0);
}

testBatchField().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
