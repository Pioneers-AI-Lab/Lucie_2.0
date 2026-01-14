# Database Sync Guide

## Overview

The Lucie 2.0 project uses Turso as the primary database, with Airtable as the source of truth. This guide explains how to sync new data from Airtable into Turso.

## First-Time Setup

Before running the sync, you need to verify your Airtable table names/IDs in your `.env` file.

### Option 1: Use Table Names (Easier)

1. Open your Airtable base
2. Check the exact names of your tables
3. Add these to your `.env` file (if they differ from defaults):

```bash
SU_2025_FOUNDERS_PROFILE_BOOK_TABLE_ID="your-pioneers-table-id"
SU_2025_STARTUPS_TABLE_ID="your-pioneers-table-id"
SU_2025_SESSIONS_EVENTS_TABLE_ID="your-pioneers-table-id"
```

### Option 2: Use Table IDs (More Reliable)

1. Open your Airtable base in a browser
2. Click on a table
3. Copy the table ID from the URL (looks like `tblXXXXXXXXXXXXXX`)
4. Add to your `.env` file:

```bash
SU_2025_FOUNDERS_PROFILE_BOOK_TABLE_ID="your-pioneers-table-id"
SU_2025_STARTUPS_TABLE_ID="your-pioneers-table-id"
SU_2025_SESSIONS_EVENTS_TABLE_ID="your-pioneers-table-id"
```

## Quick Start

When new batch data is available in Airtable (e.g., February 16th for the next batch):

```bash
# Sync all new data from Airtable
pnpm db:sync
```

That's it! The script will automatically:
- Fetch fresh data from Airtable
- Add new records to Turso
- Update existing records if they changed
- Normalize batch names (e.g., "Summer 2025" → "S25")
- Preserve all existing data

## Advanced Usage

### Sync Specific Batch Only

When you only want to sync a specific batch (recommended for February 16th):

```bash
# Sync only the new batch
pnpm db:sync --batch="S25"

# Or for future batches
pnpm db:sync --batch="F25"
```

### Sync Specific Table Only

```bash
# Sync only founders
pnpm db:sync --table=founders

# Sync only sessions
pnpm db:sync --table=sessions

# Sync only startups
pnpm db:sync --table=startups
```

### Combine Filters

```bash
# Sync only S25 founders
pnpm db:sync --table=founders --batch=S25
```

## What Gets Synced

The sync script fetches data from these Airtable tables:

1. **Pioneers Profile Book** → `founders` table
2. **Sessions & Events 2025** → `session_events` table
3. **Startups 2025** → `startups` table

## Batch Name Normalization

The script automatically normalizes batch names to short codes:

| Airtable Value | Normalized |
|----------------|------------|
| Summer 2025    | S25        |
| Fall 2024      | F24        |
| Spring 2024    | S24        |
| Fall 2023      | F23        |

## Recommended Workflow for February 16th

1. **Before February 16th**: Current data is already synced

2. **On February 16th** (when new batch data is available):
   ```bash
   # Sync only the new batch to avoid unnecessary API calls
   pnpm db:sync --batch="S25"
   ```

3. **Verify the sync**:
   ```bash
   # Open Drizzle Studio to inspect the data
   pnpm dbs
   ```
   Navigate to `http://localhost:4983` and check:
   - `founders` table for new founders
   - `session_events` table for new sessions
   - `startups` table for new startups

4. **Test with Lucie**:
   ```bash
   # Start the CLI and ask Lucie about the new batch
   pnpm dev:cli

   # Try queries like:
   # "Who are the founders in batch S25?"
   # "What are the upcoming sessions?"
   ```

## Troubleshooting

### Issue: "No records to sync"

This means:
- The batch filter didn't match any records
- Check the exact batch name in Airtable (might be "Summer 25" vs "S25")
- Try without filters: `pnpm db:sync`

### Issue: API rate limit errors

Airtable has rate limits (5 requests/second). The script handles this automatically, but if you encounter issues:
- Run sync for specific tables one at a time
- Wait a few minutes between syncs

### Issue: Data looks wrong

The Airtable exports have **misaligned column headers** (this is a known issue). The sync script has mappings to handle this:
- What appears as "Email" column actually contains the person's name
- What appears as "Education" column actually contains the email
- And so on...

These mappings are already handled in the script, so the data should appear correctly in Turso.

## Alternative: Manual Seed (Not Recommended)

If you prefer the old manual approach:

1. Export Airtable tables to JSON (manually)
2. Place files in `data/2025-Cohort_Data/JSON/founders/`
3. Run: `pnpm db:seed`

**Note**: This deletes all existing data and re-seeds from JSON files. Use `pnpm db:sync` instead to preserve existing records.

## Automation (Optional)

You can set up a cron job to sync automatically:

```bash
# Example: Sync every night at 2 AM
0 2 * * * cd /path/to/Lucie_2.0 && pnpm db:sync >> logs/sync.log 2>&1
```

Or use a service like GitHub Actions to run on a schedule.

## Related Commands

```bash
# View database in browser GUI
pnpm dbs

# Push schema changes to Turso
pnpm dbp

# Generate migration files
pnpm dbg

# Apply migrations
pnpm dbm

# One-time merge (already done)
pnpm db:merge
```

## Questions?

- Check the script: `src/db/sync-from-airtable.ts`
- Check field mappings: `lib/airtable-field-ids-ref.ts`
- Check Airtable client: `lib/airtable.ts`
