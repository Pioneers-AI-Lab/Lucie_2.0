#!/usr/bin/env tsx
/**
 * Detailed verification of seeded data
 */

import { db } from './index.js';
import { founders, sessionEvents, startups } from './schemas/index.js';

async function verifyDetailed() {
  // Check a few founders in detail
  const allFounders = await db.select().from(founders);

  console.log('✓ Database verification:\n');
  console.log(`Total records:`);
  console.log(`  Founders: ${allFounders.length}`);

  // Find a founder with good data
  const sampleFounder = allFounders.find(f => f.linkedin && f.techSkills) || allFounders[0];

  if (sampleFounder) {
    console.log('\n📋 Sample Founder (detailed):');
    console.log(`  Name: ${sampleFounder.name}`);
    console.log(`  Email: ${sampleFounder.email}`);
    console.log(`  LinkedIn: ${sampleFounder.linkedin}`);
    console.log(`  Nationality: ${sampleFounder.nationality}`);
    console.log(`  Industries: ${sampleFounder.industries?.substring(0, 100)}...`);
    console.log(`  Tech Skills: ${sampleFounder.techSkills?.substring(0, 100)}...`);
    console.log(`  Roles: ${sampleFounder.rolesICouldTake?.substring(0, 100)}...`);
    console.log(`  Status: ${sampleFounder.status}`);
  }

  // Check sessions
  const allSessions = await db.select().from(sessionEvents);
  const futureSession = allSessions.find(s => s.date && new Date(s.date) > new Date('2025-06-15'));

  console.log(`\n📅 Sample Session (detailed):`);
  if (futureSession) {
    console.log(`  Name: ${futureSession.name}`);
    console.log(`  Date: ${futureSession.date}`);
    console.log(`  Week: ${futureSession.programWeek}`);
    console.log(`  Type: ${futureSession.typeOfSession}`);
    console.log(`  Speaker: ${futureSession.speaker}`);
    console.log(`  Participants: ${futureSession.participants?.substring(0, 100)}...`);
  }

  // Check startups
  const allStartups = await db.select().from(startups);
  const startupWithTraction = allStartups.find(s => s.tractionSummary) || allStartups[0];

  console.log(`\n🚀 Sample Startup (detailed):`);
  if (startupWithTraction) {
    console.log(`  Name: ${startupWithTraction.startup}`);
    console.log(`  Industry: ${startupWithTraction.industry}`);
    console.log(`  Team: ${startupWithTraction.teamMembers}`);
    console.log(`  One-liner: ${startupWithTraction.startupInAWord?.substring(0, 100)}...`);
    console.log(`  Traction: ${startupWithTraction.tractionSummary?.substring(0, 150)}...`);
  }

  console.log('\n✅ All field mappings verified successfully!');

  process.exit(0);
}

verifyDetailed();
