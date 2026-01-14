#!/usr/bin/env tsx
/**
 * Test the queryFoundersTool to ensure it works correctly
 */

import { queryFoundersTool } from '../mastra/tools/query-founders-tool.js';

async function testQueryFoundersTool() {
  console.log('Testing queryFoundersTool...\n');

  // Test 1: Get count
  console.log('Test 1: Get founder count');
  const countResult = await queryFoundersTool.execute({ searchType: 'count' });
  console.log('Result:', countResult);
  console.log('---\n');

  // Test 2: Search by name
  console.log('Test 2: Search by name (Louis)');
  const nameResult = await queryFoundersTool.execute({ searchType: 'by-name', searchTerm: 'Louis' });
  console.log('Result:', JSON.stringify(nameResult, null, 2));
  console.log('---\n');

  // Test 3: Search by skills
  console.log('Test 3: Search by skills (Python)');
  const skillsResult = await queryFoundersTool.execute({ searchType: 'by-skills', searchTerm: 'Python' });
  console.log(`Found ${skillsResult.count} founders with Python skills`);
  if (skillsResult.founders && skillsResult.founders.length > 0) {
    console.log('Sample:', skillsResult.founders[0].name, '-', skillsResult.founders[0].techSkills?.substring(0, 60));
  }
  console.log('---\n');

  // Test 4: Search by batch
  console.log('Test 4: Search by batch (F24)');
  const batchResult = await queryFoundersTool.execute({ searchType: 'by-batch', searchTerm: 'F24' });
  console.log('Result:', batchResult.message);
  console.log(`Found ${batchResult.count} founders in batch F24`);
  console.log('---\n');

  // Test 5: Get all (limited output)
  console.log('Test 5: Get all founders');
  const allResult = await queryFoundersTool.execute({ searchType: 'all' });
  console.log(`Total founders: ${allResult.count}`);
  if (allResult.founders && allResult.founders.length > 0) {
    console.log('First 3 founders:');
    allResult.founders.slice(0, 3).forEach((founder, idx) => {
      console.log(`  ${idx + 1}. ${founder.name} (${founder.source}) - ${founder.email}`);
    });
  }
  console.log('---\n');

  console.log('✅ All tests completed!');
}

testQueryFoundersTool()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
