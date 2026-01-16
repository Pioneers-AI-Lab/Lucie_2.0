# FAQ Schema Guide

## Overview

The FAQ schema (`src/db/schemas/faq.ts`) stores frequently asked questions from the Pioneers accelerator program. The data is sourced from multiple JSON files:
- `data/general-questions.json` - General program FAQs (52 entries)
- `data/sessions-faq.json` - Sessions & events FAQs (34 entries)
- `data/startups-faq.json` - Startups & entrepreneurship FAQs (39 entries)

**Total: 125 comprehensive FAQ entries across 23 categories**

## Schema Structure

The FAQ table includes the following fields:

### Core Fields (from knowledge_base items)
- **id** (text, primary key) - Unique identifier (UUID)
- **question** (text, required) - The question text
- **answer** (text, required) - The answer text
- **category** (text, required) - Category from knowledge_base structure

### Top-Level Fields (from JSON root)
- **program** (text, nullable) - Program name (e.g., "Pioneers Accelerator")
- **location** (text, nullable) - Location (e.g., "Station F")

### Metadata Fields (from JSON metadata section)
- **intendedUse** (text, nullable) - Purpose (e.g., "Slack chatbot knowledge base")
- **answerStyle** (text, nullable) - Answer tone (e.g., "Neutral, informational, non-committal")

### Database-Managed Fields
- **createdAt** (timestamp) - When the FAQ was created
- **updatedAt** (timestamp) - When the FAQ was last updated

## Categories

The following categories are available (from `knowledge_base`):

1. **program_overview** - General program information
2. **eligibility_and_profile** - Who can apply and eligibility criteria
3. **team_formation** - Co-founder matching and team building
4. **application_process** - How to apply and selection process
5. **funding_and_equity** - Funding terms and equity details
6. **station_f_and_resources** - Station F access and perks
7. **miscellaneous** - Other general questions

## Usage

### Seeding the FAQ Table

Run the seed script to populate the FAQ table from all FAQ sources:

```bash
# Seed all FAQs (general + sessions + startups) - DEFAULT
pnpm db:seed:faq

# Or seed individual sources
pnpm db:seed:faq:general   # Only general program FAQs
pnpm db:seed:faq:sessions  # Only sessions & events FAQs
pnpm db:seed:faq:startups  # Only startups & entrepreneurship FAQs
```

This will:
1. Read all FAQ JSON files (`general-questions.json`, `sessions-faq.json`, `startups-faq.json`)
2. Clear existing FAQ data
3. Insert all FAQ entries with proper categories and metadata
4. Display breakdown by source and category

**Output Example:**
```
✅ Successfully seeded 125 total FAQ entries
📊 Total categories: 23
   - General FAQs: 52 entries
   - Sessions FAQs: 34 entries
   - Startups FAQs: 39 entries
```

### Querying FAQs

Use the helper functions in `src/db/helpers/seed-faq.ts`:

```typescript
import { getFAQsByCategory, searchFAQs, getFAQCategories, getFAQCount } from './db/helpers/seed-faq.js';

// Get all FAQs in a specific category
const programFAQs = await getFAQsByCategory('program_overview');

// Search FAQs by keyword
const searchResults = await searchFAQs('funding');

// Get all available categories
const categories = await getFAQCategories();

// Get total FAQ count
const total = await getFAQCount();
```

### Direct Database Queries

```typescript
import { db } from './db/index.js';
import { faq } from './db/schemas/faq.js';
import { eq, like, or } from 'drizzle-orm';

// Get all FAQs
const allFAQs = await db.select().from(faq);

// Get FAQs by category
const eligibilityFAQs = await db
  .select()
  .from(faq)
  .where(eq(faq.category, 'eligibility_and_profile'));

// Search in questions and answers
const pattern = '%co-founder%';
const results = await db
  .select()
  .from(faq)
  .where(
    or(
      like(faq.question, pattern),
      like(faq.answer, pattern)
    )
  );
```

## JSON Source Structure

The `data/general-questions.json` file has this structure:

```json
{
  "program": "Pioneers Accelerator",
  "location": "Station F",
  "knowledge_base": {
    "program_overview": [
      {
        "question": "What is the Pioneers accelerator?",
        "answer": "Pioneers is an early-stage startup accelerator..."
      }
    ],
    "eligibility_and_profile": [...],
    "team_formation": [...],
    "application_process": [...],
    "funding_and_equity": [...],
    "station_f_and_resources": [...],
    "miscellaneous": [...]
  },
  "metadata": {
    "intended_use": "Slack chatbot knowledge base",
    "answer_style": "Neutral, informational, non-committal",
    "last_updated": "2025-12-16"
  }
}
```

## Database Migration

If this is a new table, generate and apply the migration:

```bash
# Generate migration
pnpm dbg

# Apply migration to Turso
pnpm dbm

# Seed the data
pnpm db:seed:faq
```

## Example Use Case: FAQ Tool for Lucie

The FAQ data can be used to create a tool for Lucie to answer general program questions:

```typescript
export const queryFAQTool = createTool({
  id: 'query-faq',
  description: 'Query frequently asked questions about the Pioneers program',
  inputSchema: z.object({
    searchType: z.enum(['all', 'by-category', 'search']),
    searchTerm: z.string().optional(),
    category: z.string().optional(),
  }),
  outputSchema: z.object({
    faqs: z.array(z.object({
      question: z.string(),
      answer: z.string(),
      category: z.string(),
    })),
    count: z.number(),
  }),
  execute: async (input) => {
    const { searchType, searchTerm, category } = input;

    if (searchType === 'by-category' && category) {
      const results = await getFAQsByCategory(category);
      return { faqs: results, count: results.length };
    }

    if (searchType === 'search' && searchTerm) {
      const results = await searchFAQs(searchTerm);
      return { faqs: results, count: results.length };
    }

    const results = await db.select().from(faq);
    return { faqs: results, count: results.length };
  },
});
```

## Notes

- The `program`, `location`, `intendedUse`, and `answerStyle` fields are typically the same for all FAQs from the same source
- These fields are included for flexibility but could be moved to a separate metadata table if preferred
- The `createdAt` and `updatedAt` timestamps are managed by the database, not from the JSON
- When reseeding, all existing FAQ data is cleared and replaced
