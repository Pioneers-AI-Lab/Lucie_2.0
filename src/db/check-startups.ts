#!/usr/bin/env tsx
import { db } from './index.js';
import { startups } from './schemas/startups.js';

const companies = await db.select().from(startups);
console.log('Total startups:', companies.length);
if (companies.length > 0) {
  console.log('\nSample startup:');
  console.log('  Name:', companies[0].startup);
  console.log('  Industry:', companies[0].industry);
  console.log('  In a word:', companies[0].startupInAWord);
  console.log('  Team:', companies[0].teamMembers);
  console.log('  Traction:', companies[0].tractionSummary?.substring(0, 100) + '...');
}
process.exit(0);
