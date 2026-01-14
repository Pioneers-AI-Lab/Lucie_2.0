# Database Seeding

This directory contains the Turso database setup and seeding scripts for Lucie 2.0.

## Quick Start

```bash
# 1. Push schema to Turso (if not already done)
pnpm dbp

# 2. Seed the database with JSON data
pnpm db:seed

# 3. Verify the data
tsx src/db/verify.ts

# Or do both at once
pnpm db:setup
```

## What Gets Seeded

The seed script (`seed.ts`) populates four tables from JSON files:

1. **Founders** (37 records) - From `data/2025-Cohort_Data/JSON/founders/pioneers_profile_book_2025_readable.json`
   - Profile book view with detailed founder information
2. **Founders Grid Data** (100 records) - From `data/2025-Cohort_Data/JSON/founders/grid_view_all_readable.json`
   - Grid view with essential founder contact and profile data
3. **Session Events** (100 records) - From `data/2025-Cohort_Data/JSON/founders/sessions_events_2025_readable.json`
4. **Startups** (27 records) - From `data/2025-Cohort_Data/JSON/founders/startups_2025_readable.json`

## Important Notes

### Field Mapping Issues

**Critical**: The JSON exports from Airtable have severely misaligned column headers in BOTH views!

**Profile Book View Misalignments:**
- `"Email"` field → Contains person's **name** (not email!)
- `"Education"` field → Contains actual **email**
- `"Name"` field → Contains **roles**
- `"Industries"` field → Contains **LinkedIn URL**
- `"LinkedIn"` field → Contains **nationality**
- And 20+ more misalignments...

**Grid View Misalignments:**
- `"Mobile number"` field → Contains person's **name**
- `"Email address"` field → ✓ Contains actual **email** (CORRECT!)
- `"Linkedin"` field → Contains **phone number**
- `"Intro message"` field → Contains **LinkedIn URL**
- `"Name"` field → Contains **nationality**
- And more...

The `FOUNDERS_FIELD_MAP` and `FOUNDERS_GRID_FIELD_MAP` in `seed.ts` have detailed comments explaining each mapping.

### Data Quality

- Fields with `[object Object]` are skipped
- Empty/null values are handled gracefully
- Dates are automatically parsed and converted to timestamps
- The script validates that records have required fields (name, etc.)

### Re-seeding

The seed script **deletes all existing data** before inserting new records. This ensures a clean state but means you'll lose any manual edits.

## Schema Files

- `schemas/founders.ts` - Founder profiles (Profile Book view - detailed)
- `schemas/founders-grid-data.ts` - Founder profiles (Grid view - essential contact info)
- `schemas/session-events.ts` - Sessions and events
- `schemas/startups.ts` - Startup information
- `schemas/index.ts` - Central export

## Database Commands

```bash
# Generate migration files from schema changes
pnpm dbg

# Apply migrations
pnpm dbm

# Push schema directly (dev only, skips migrations)
pnpm dbp

# Open Drizzle Studio (GUI at http://localhost:4983)
pnpm dbs

# Seed database from JSON files
pnpm db:seed

# Setup: push schema + seed data
pnpm db:setup
```

## Troubleshooting

### "No such table" errors

Run `pnpm dbp` to push the schema to Turso first.

### Data looks wrong

Check the field mappings in `seed.ts`. The Airtable export may have changed column order.

### Want to inspect the data?

```bash
# Open Drizzle Studio
pnpm dbs

# Or use the verify script
tsx src/db/verify.ts
```
