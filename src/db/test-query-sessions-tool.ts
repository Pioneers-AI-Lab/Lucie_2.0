#!/usr/bin/env tsx
/**
 * Test the querySessionsTool to ensure it works correctly
 */

import { querySessionsTool } from '../mastra/tools/query-sessions-tool.js';

async function testQuerySessionsTool() {
  console.log('Testing querySessionsTool...\n');

  // Test 1: Get count
  console.log('Test 1: Get session count');
  const countResult = await querySessionsTool.execute({ searchType: 'count' });
  console.log('Result:', countResult);
  console.log('---\n');

  // Test 2: Get next session
  console.log('Test 2: Get next upcoming session');
  const nextResult = await querySessionsTool.execute({ searchType: 'next' });
  console.log('Result:', nextResult.message);
  if (nextResult.sessions && nextResult.sessions.length > 0) {
    const session = nextResult.sessions[0];
    console.log('  Name:', session.name);
    console.log('  Date:', session.date);
    console.log('  Speaker:', session.speaker);
    console.log('  Week:', session.programWeek);
  }
  console.log('---\n');

  // Test 3: Search by speaker
  console.log('Test 3: Search by speaker (Lancelot)');
  const speakerResult = await querySessionsTool.execute({
    searchType: 'by-speaker',
    searchTerm: 'Lancelot'
  });
  console.log(`Found ${speakerResult.count} sessions with Lancelot`);
  if (speakerResult.sessions && speakerResult.sessions.length > 0) {
    console.log('Sample:', speakerResult.sessions[0].name);
  }
  console.log('---\n');

  // Test 4: Search by week
  console.log('Test 4: Search by week (Week 3)');
  const weekResult = await querySessionsTool.execute({
    searchType: 'by-week',
    searchTerm: 'Week 3'
  });
  console.log('Result:', weekResult.message);
  console.log(`Found ${weekResult.count} sessions in Week 3`);
  console.log('---\n');

  // Test 5: Get upcoming sessions
  console.log('Test 5: Get upcoming sessions');
  const upcomingResult = await querySessionsTool.execute({ searchType: 'upcoming' });
  console.log(`Found ${upcomingResult.count} upcoming sessions`);
  if (upcomingResult.sessions && upcomingResult.sessions.length > 0) {
    console.log('First 3 upcoming:');
    upcomingResult.sessions.slice(0, 3).forEach((session, idx) => {
      console.log(`  ${idx + 1}. ${session.name} - ${session.date?.toLocaleDateString()}`);
    });
  }
  console.log('---\n');

  // Test 6: Search by type
  console.log('Test 6: Search by type (Workshop)');
  const typeResult = await querySessionsTool.execute({
    searchType: 'by-type',
    searchTerm: 'Workshop'
  });
  console.log(`Found ${typeResult.count} workshops`);
  console.log('---\n');

  // Test 7: Get all sessions (limited output)
  console.log('Test 7: Get all sessions');
  const allResult = await querySessionsTool.execute({ searchType: 'all' });
  console.log(`Total sessions: ${allResult.count}`);
  if (allResult.sessions && allResult.sessions.length > 0) {
    console.log('First 3 sessions:');
    allResult.sessions.slice(0, 3).forEach((session, idx) => {
      console.log(`  ${idx + 1}. ${session.name} (${session.programWeek}) - ${session.speaker}`);
    });
  }
  console.log('---\n');

  console.log('✅ All tests completed!');
}

testQuerySessionsTool()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
