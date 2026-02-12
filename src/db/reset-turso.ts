#!/usr/bin/env tsx
/**
 * Reset local Turso database: drop all tables then run migrations.
 *
 * Uses @libsql/client directly to avoid Drizzle's DROP TABLE issues on Turso.
 * After dropping, runs: pnpm dbm (migrations only; no seed).
 * To load data after reset: pnpm db:sync (from Airtable) or pnpm db:seed (from JSON files).
 *
 * Usage: pnpm db:reset  (or tsx src/db/reset-turso.ts)
 */

import { config } from 'dotenv';
import { createClient } from '@libsql/client';
import { execSync } from 'child_process';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env') });

const url = process.env.TURSO_CONNECTION_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error('TURSO_CONNECTION_URL is not set in .env');
  process.exit(1);
}

const tables = [
  'founders',
  'session_events',
  'startups',
  'faq',
  '__drizzle_migrations',
];

async function main() {
  const client = createClient({
    url: url!,
    authToken: authToken || undefined,
  });

  console.log('Dropping tables...');
  for (const table of tables) {
    await client.execute(`DROP TABLE IF EXISTS "${table}"`);
    console.log(`  Dropped ${table}`);
  }

  client.close();
  console.log('Running migrations (pnpm dbm)...');
  execSync('pnpm dbm', { stdio: 'inherit', cwd: process.cwd() });
  console.log('Done. To load data: pnpm db:sync (Airtable) or pnpm db:seed (JSON).');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
