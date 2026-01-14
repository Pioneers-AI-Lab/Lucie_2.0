#!/usr/bin/env tsx
import { db } from './index.js';
import { founders, foundersGridData } from './schemas/index.js';

console.log('Checking tech skills in both tables...\n');

// Check Profile Book
const profileFounders = await db.select().from(founders);
console.log('Profile Book (37 founders):');
const profileWithSkills = profileFounders.filter(f => f.techSkills);
console.log(`  ${profileWithSkills.length} have techSkills field populated`);
if (profileWithSkills.length > 0) {
  console.log('  Sample skills:');
  profileWithSkills.slice(0, 3).forEach(f => {
    console.log(`    - ${f.name}: ${f.techSkills?.substring(0, 100)}`);
  });
}

// Check Grid View
const gridFounders = await db.select().from(foundersGridData);
console.log('\nGrid View (100 founders):');
const gridWithSkills = gridFounders.filter(f => f.itExpertise);
console.log(`  ${gridWithSkills.length} have itExpertise field populated`);
if (gridWithSkills.length > 0) {
  console.log('  Sample skills:');
  gridFounders.filter(f => f.itExpertise).slice(0, 3).forEach(f => {
    console.log(`    - ${f.name}: ${f.itExpertise?.substring(0, 100)}`);
  });
}

// Check if "Python" exists anywhere
const pythonInProfile = profileFounders.filter(f =>
  f.techSkills?.toLowerCase().includes('python')
);
const pythonInGrid = gridFounders.filter(f =>
  f.itExpertise?.toLowerCase().includes('python')
);

console.log('\nPython search results:');
console.log(`  Profile Book: ${pythonInProfile.length} founders`);
console.log(`  Grid View: ${pythonInGrid.length} founders`);

process.exit(0);
