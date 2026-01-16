# Query FAQ Tool - Disabled

## Summary

The `queryFAQTool` has been commented out from Lucie's available tools due to returning too many results for short search queries.

## Issue

When searching for short terms like "IC" (Investment Committee), the FAQ tool was returning 149 FAQ entries because it performs substring matching on all questions and answers. This results in:
- Too much data for the LLM to process efficiently
- Irrelevant matches (e.g., "basic", "logistic", "antic")
- Poor user experience with unfocused responses

**Example of the problem:**
```
Query: "What is IC?"
Tool: queryFAQTool
Search: { searchType: 'search', searchTerm: 'IC' }
Result: ❌ 149 FAQ entries returned (way too many)
```

## Changes Made

**File: `src/mastra/agents/lucie-agents.ts`**

### 1. Commented Out Import
```typescript
// Before:
import { queryFAQTool } from '../tools/query-faq-tool';

// After:
// import { queryFAQTool } from '../tools/query-faq-tool'; // COMMENTED OUT: Returns too many results for short queries
```

### 2. Commented Out Tool Registration
```typescript
// Before:
tools: {
  queryFoundersTool,
  querySessionsTool,
  queryStartupsTool,
  queryFAQTool,
}

// After:
tools: {
  queryFoundersTool,
  querySessionsTool,
  queryStartupsTool,
  // queryFAQTool, // COMMENTED OUT: Returns too many results for short queries like "IC"
}
```

## Testing

**Test Query: "What is IC?"**
```
✅ FAQ tool NOT used (successfully disabled)
❌ Used queryFoundersTool instead (not ideal but better than 149 results)
Result: Generic response about "Intellectual Capital"
```

## Current Active Tools

Lucie now has **3 active tools**:
1. ✅ `queryFoundersTool` - Search founders database
2. ✅ `querySessionsTool` - Search sessions/events database
3. ✅ `queryStartupsTool` - Search startups database
4. ❌ `queryFAQTool` - DISABLED

## Impact

**Pros:**
- ✅ No more overwhelming result sets for short queries
- ✅ Faster response times (less data to process)
- ✅ More focused responses using specialized tools

**Cons:**
- ❌ Lost access to 197 curated FAQ answers covering:
  - 52 general program FAQs
  - 34 sessions guidance FAQs
  - 39 startups FAQs
  - 36 founders FAQs
  - 36 2025 events FAQs
- ❌ Questions like "How do I apply?" or "What is Selection Day?" no longer have curated answers
- ❌ No FAQ-based guidance available

## Re-enabling the FAQ Tool

If you want to re-enable the FAQ tool in the future, uncomment both lines:

```typescript
// In src/mastra/agents/lucie-agents.ts

// 1. Uncomment the import
import { queryFAQTool } from '../tools/query-faq-tool';

// 2. Uncomment in tools object
tools: {
  queryFoundersTool,
  querySessionsTool,
  queryStartupsTool,
  queryFAQTool,
}
```

## Potential Solutions (Not Implemented)

If you want to fix the FAQ tool instead of disabling it, consider:

### Option 1: Improve Search Logic
Modify the search to use word boundaries:
```typescript
// In src/mastra/tools/query-faq-tool.ts
// Instead of: LIKE '%IC%'
// Use: REGEXP '\\bIC\\b' (word boundary matching)
```

### Option 2: Add Minimum Length Check
Reject queries shorter than 3 characters:
```typescript
if (searchTerm && searchTerm.length < 3) {
  return {
    faqs: [],
    count: 0,
    message: 'Search term must be at least 3 characters'
  };
}
```

### Option 3: Limit Results
Cap the number of results returned:
```typescript
// Return max 10 results
faqs = await db.select()
  .from(faq)
  .where(...)
  .limit(10);
```

### Option 4: Use Full-Text Search
Implement proper full-text search with relevance ranking instead of simple LIKE matching.

## Files Modified

```
✅ src/mastra/agents/lucie-agents.ts
   - Commented out queryFAQTool import
   - Commented out queryFAQTool in tools object
```

## Database and Seeding

**Note:** The FAQ database and seeding infrastructure remain intact:
- ✅ FAQ table still exists in Turso
- ✅ 197 FAQs still seeded in database
- ✅ Seeding scripts still work: `pnpm db:seed:faq`
- ✅ All FAQ JSON files still exist in `data/`

Only the **tool** is disabled - the data infrastructure is preserved for when/if you want to re-enable it with improvements.

## Recommendation

Consider implementing one of the "Potential Solutions" above to fix the search issues rather than keeping the tool permanently disabled, as the 197 curated FAQs provide valuable guidance that the other tools cannot offer.
