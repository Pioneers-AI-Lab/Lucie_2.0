#!/usr/bin/env tsx
import { db } from './index.js';
import { sessionEvents } from './schemas/session-events.js';

const events = await db.select().from(sessionEvents);
console.log('Total sessions:', events.length);
if (events.length > 0) {
  console.log('\nSample session:');
  console.log('  Name:', events[0].name);
  console.log('  Date:', events[0].date);
  console.log('  Type:', events[0].typeOfSession);
  console.log('  Week:', events[0].programWeek);
  console.log('  Speaker:', events[0].speaker);
}
process.exit(0);
