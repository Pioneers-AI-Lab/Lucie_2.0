#!/usr/bin/env tsx
/**
 * Pull actual Airtable table and column (field) metadata from the base
 * referenced in .env. Uses the Airtable Meta API so you can align
 * sync-from-airtable.ts field mappings with real schema.
 *
 * Requires: Token with scope schema.bases:read
 * (Personal access token with "Read schema" or OAuth with schema.bases:read)
 *
 * Usage:
 *   pnpm run db:pull-columns
 *   tsx src/db/pull-airtable-columns.ts
 */

import 'dotenv/config';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const SU_2025_BASE_ID = process.env.SU_2025_BASE_ID;

const TABLE_KEYS = {
  founders: process.env.SU_2025_FOUNDERS_PROFILE_BOOK_TABLE_ID || 'Pioneers Profile Book',
  sessions: process.env.SU_2025_SESSIONS_EVENTS_TABLE_ID || 'Sessions & Events 2025',
  startups: process.env.SU_2025_STARTUPS_TABLE_ID || 'Startups 2025',
} as const;

type AirtableTable = {
  id: string;
  name: string;
  description?: string;
  primaryFieldId: string;
  fields: Array<{
    id: string;
    name: string;
    type: string;
    description?: string;
    options?: Record<string, unknown>;
  }>;
};

async function getBaseSchema(baseId: string, token: string): Promise<{ tables: AirtableTable[] }> {
  const url = `https://api.airtable.com/v0/meta/bases/${baseId}/tables`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable Meta API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<{ tables: AirtableTable[] }>;
}

function matchTable(table: AirtableTable, envValue: string): boolean {
  return table.id === envValue || table.name === envValue;
}

async function main() {
  if (!AIRTABLE_API_KEY) {
    console.error('Missing AIRTABLE_API_KEY in .env');
    process.exit(1);
  }
  if (!SU_2025_BASE_ID) {
    console.error('Missing SU_2025_BASE_ID in .env');
    process.exit(1);
  }

  console.log('Fetching base schema from Airtable Meta API...');
  console.log(`Base ID: ${SU_2025_BASE_ID}\n`);

  const { tables } = await getBaseSchema(SU_2025_BASE_ID, AIRTABLE_API_KEY);

  const envTableValues = Object.values(TABLE_KEYS);
  const matched = tables.filter((t) => envTableValues.some((v) => matchTable(t, v)));

  if (matched.length === 0) {
    console.log('No tables in this base match your .env table IDs/names.');
    console.log('Tables in base:', tables.map((t) => `${t.name} (id: ${t.id})`).join(', '));
    console.log('\nEnv table identifiers:', TABLE_KEYS);
    process.exit(1);
  }

  for (const table of matched) {
    const key = Object.entries(TABLE_KEYS).find(([, v]) => matchTable(table, v))?.[0] ?? table.name;
    console.log(`--- ${key} ---`);
    console.log(`Table: ${table.name} (id: ${table.id})`);
    console.log('Fields (name, id, type):');
    for (const f of table.fields) {
      console.log(`  "${f.name}"  id: ${f.id}  type: ${f.type}`);
    }
    console.log('');
  }

  console.log('Done. Use these field names in sync-from-airtable.ts mappings.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
