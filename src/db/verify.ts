#!/usr/bin/env tsx
/**
 * Verify database seeding
 */

import { db } from './index.js';
import { founders, foundersGridData, sessionEvents, startups } from './schemas/index.js';

async function verify() {
  const foundersCount = await db.select().from(founders);
  const foundersGridCount = await db.select().from(foundersGridData);
  const sessionsCount = await db.select().from(sessionEvents);
  const startupsCount = await db.select().from(startups);

  console.log('✓ Database verification:');
  console.log(`  Founders (Profile Book): ${foundersCount.length}`);
  console.log(`  Founders (Grid View): ${foundersGridCount.length}`);
  console.log(`  Session Events: ${sessionsCount.length}`);
  console.log(`  Startups: ${startupsCount.length}`);

  // Show sample data
  if (foundersCount.length > 0) {
    console.log('\nSample founder (Profile Book):', {
      name: foundersCount[0].name,
      email: foundersCount[0].email,
      status: foundersCount[0].status,
    });
  }

  if (foundersGridCount.length > 0) {
    console.log('\nSample founder (Grid View):', {
      name: foundersGridCount[0].name,
      email: foundersGridCount[0].emailAddress,
      linkedin: foundersGridCount[0].linkedin?.substring(0, 50),
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
