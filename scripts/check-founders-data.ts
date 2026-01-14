#!/usr/bin/env tsx
import { db } from '../src/db/index.js';
import { founders } from '../src/db/schemas/index.js';

async function check() {
  const result = await db.select({
    name: founders.name,
    yearsOfXp: founders.yearsOfXp,
    founder: founders.founder,
  }).from(founders).limit(5);

  console.log('\n=== First 5 founders with years_of_xp and founder fields ===\n');
  result.forEach(r => {
    console.log(`Name: ${r.name}`);
    console.log(`Years of XP: ${r.yearsOfXp}`);
    console.log(`Founder: ${r.founder}`);
    console.log('---');
  });
}

check().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
