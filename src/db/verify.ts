#!/usr/bin/env tsx
/**
 * Verify database seeding
 */

import { db } from './index.js';
import { founders, sessionEvents, startups } from './schemas/index.js';

async function verify() {
  const foundersCount = await db.select().from(founders);
  const sessionsCount = await db.select().from(sessionEvents);
  const startupsCount = await db.select().from(startups);

  console.log('✓ Database verification:');
  console.log(`  Founders: ${foundersCount.length}`);
  console.log(`  Session Events: ${sessionsCount.length}`);
  console.log(`  Startups: ${startupsCount.length}`);

  // Show sample data
  if (foundersCount.length > 0) {
    console.log('\nSample founder:', {
      name: foundersCount[0].name,
      email: foundersCount[0].email,
      status: foundersCount[0].status,
    });
  }

  if (sessionsCount.length > 0) {
    console.log('\nSample session:', {
      name: sessionsCount[0].name,
      date: sessionsCount[0].date,
      programWeek: sessionsCount[0].programWeek,
    });
  }

  if (startupsCount.length > 0) {
    console.log('\nSample startup:', {
      startup: startupsCount[0].startup,
      industry: startupsCount[0].industry,
      teamMembers: startupsCount[0].teamMembers,
    });
  }

  process.exit(0);
}

verify();
