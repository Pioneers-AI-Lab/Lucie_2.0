#!/usr/bin/env tsx
/**
 * Test the queryStartupsTool to ensure it works correctly
 */

import { queryStartupsTool } from '../mastra/tools/query-startups-tool.js';

async function testQueryStartupsTool() {
  console.log('Testing queryStartupsTool...\n');

  // Test 1: Get count
  console.log('Test 1: Get startup count');
  const countResult = await queryStartupsTool.execute({ searchType: 'count' });
  console.log('Result:', countResult);
  console.log('---\n');

  // Test 2: Search by name
  console.log('Test 2: Search by name (ScoreTrue)');
  const nameResult = await queryStartupsTool.execute({
    searchType: 'by-name',
    searchTerm: 'ScoreTrue'
  });
  console.log(`Found ${nameResult.count} startup(s)`);
  if (nameResult.startups && nameResult.startups.length > 0) {
    const startup = nameResult.startups[0];
    console.log('  Name:', startup.startup);
    console.log('  Industry:', startup.industry);
    console.log('  Description:', startup.startupInAWord?.substring(0, 100) + '...');
    console.log('  Team:', startup.teamMembers);
  }
  console.log('---\n');

  // Test 3: Search by industry
  console.log('Test 3: Search by industry (FinTech)');
  const industryResult = await queryStartupsTool.execute({
    searchType: 'by-industry',
    searchTerm: 'FinTech'
  });
  console.log(`Found ${industryResult.count} FinTech startups`);
  if (industryResult.startups && industryResult.startups.length > 0) {
    console.log('Sample:', industryResult.startups[0].startup);
  }
  console.log('---\n');

  // Test 4: Search by team member
  console.log('Test 4: Search by team member (Franz)');
  const teamResult = await queryStartupsTool.execute({
    searchType: 'by-team-member',
    searchTerm: 'Franz'
  });
  console.log('Result:', teamResult.message);
  if (teamResult.startups && teamResult.startups.length > 0) {
    console.log('Found startup:', teamResult.startups[0].startup);
    console.log('Team:', teamResult.startups[0].teamMembers);
  }
  console.log('---\n');

  // Test 5: Search by description
  console.log('Test 5: Search by description (AI)');
  const descResult = await queryStartupsTool.execute({
    searchType: 'by-description',
    searchTerm: 'AI'
  });
  console.log(`Found ${descResult.count} startups with AI in description`);
  if (descResult.startups && descResult.startups.length > 0) {
    console.log('First 3:');
    descResult.startups.slice(0, 3).forEach((s, idx) => {
      console.log(`  ${idx + 1}. ${s.startup} - ${s.industry}`);
    });
  }
  console.log('---\n');

  // Test 6: Global search
  console.log('Test 6: Global search (credit)');
  const globalResult = await queryStartupsTool.execute({
    searchType: 'global-search',
    searchTerm: 'credit'
  });
  console.log(`Found ${globalResult.count} startups mentioning credit`);
  if (globalResult.startups && globalResult.startups.length > 0) {
    console.log('Sample:', globalResult.startups[0].startup);
  }
  console.log('---\n');

  // Test 7: Get all startups (limited output)
  console.log('Test 7: Get all startups');
  const allResult = await queryStartupsTool.execute({ searchType: 'all' });
  console.log(`Total startups: ${allResult.count}`);
  if (allResult.startups && allResult.startups.length > 0) {
    console.log('First 5 startups:');
    allResult.startups.slice(0, 5).forEach((startup, idx) => {
      console.log(`  ${idx + 1}. ${startup.startup} (${startup.industry})`);
    });
  }
  console.log('---\n');

  console.log('✅ All tests completed!');
}

testQueryStartupsTool()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
