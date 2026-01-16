# Disabled Features Summary

## Overview

This document summarizes the features that have been disabled in Lucie to improve performance and simplify the user experience.

---

## 1. Query FAQ Tool - DISABLED

**File:** `src/mastra/agents/lucie-agents.ts`

### Why Disabled
The FAQ tool was returning too many results for short search queries (e.g., "IC" returned 149 FAQs), causing poor user experience and overwhelming the LLM.

### What Was Disabled
- ❌ `queryFAQTool` - No longer available to Lucie
- ❌ Access to 197 curated FAQ answers:
  - 52 general program FAQs
  - 34 sessions guidance FAQs
  - 39 startups FAQs
  - 36 founders FAQs
  - 36 2025 events FAQs

### Impact
**Lost Capabilities:**
- Can't answer guidance questions like "How do I apply?" or "What is an LOI?"
- No curated event information like "What was the Alexis Robert event?"
- No step-by-step process explanations

**Remaining Capabilities:**
- ✅ Still has 3 database tools for querying actual data
- ✅ Can search founders, sessions, and startups databases
- ✅ Can provide answers based on database records

### To Re-enable
Uncomment two lines in `src/mastra/agents/lucie-agents.ts`:
```typescript
import { queryFAQTool } from '../tools/query-faq-tool';

tools: {
  queryFoundersTool,
  querySessionsTool,
  queryStartupsTool,
  queryFAQTool, // Uncomment this line
}
```

### Recommendation
Consider fixing the search issue instead of keeping permanently disabled:
- Add minimum search term length (3+ characters)
- Limit results to top 10 matches
- Use word boundary matching
- Implement full-text search with relevance ranking

**Documentation:** `docs/query-faq-tool-disabled.md`

---

## 2. Slack Streaming Animation - DISABLED

**File:** `src/mastra/slack/streaming.ts`

### Why Disabled
Per user request to disable "the core streaming logic that displays agent responses in Slack with animated status updates and real-time progress indicators."

### What Was Disabled
- ❌ Animated Braille pattern spinners (⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏)
- ❌ Animation timer updating every 300ms
- ❌ Progress indicators for tool calls ("🔧 Using Query Founders Tool...")
- ❌ Workflow step indicators ("⚙️ Executing step...")
- ❌ Real-time status text updates
- ❌ Live message updates as agent processes

### What It Does Now
**Simplified Flow:**
1. Posts static message: "⏳ Processing your request..."
2. Silently collects agent response in background
3. Updates message with final response when complete

**Before:**
```
"⠋ Thinking..."
↓ (animated updates)
"🔧 Using Query Founders Tool ⠙"
↓ (animated updates)
"⚙️ Processing results ⠹"
↓
"Here are the results..."
```

**After:**
```
"⏳ Processing your request..."
↓ (no updates)
"Here are the results..."
```

### Impact
**Benefits:**
- ✅ Reduced Slack API calls (~95% reduction: 2 calls vs 10-50 calls)
- ✅ Simpler code (~70% less code)
- ✅ No rate limit issues
- ✅ Cleaner message history (no edit noise)
- ✅ Lower latency (no artificial display delays)

**Drawbacks:**
- ❌ Less user feedback (no tool visibility)
- ❌ No progress indication (appears frozen during processing)
- ❌ Less engaging UX
- ❌ No debugging visibility

### To Re-enable
The original implementation is preserved as commented code at the bottom of `src/mastra/slack/streaming.ts`:

1. Remove current simplified `streamToSlack` function
2. Uncomment `streamToSlack_ORIGINAL` function
3. Rename it back to `streamToSlack`

Or simply:
```bash
git checkout HEAD -- src/mastra/slack/streaming.ts
```

**Documentation:** `docs/slack-streaming-disabled.md`

---

## Current Lucie Configuration

### Active Tools (3)
1. ✅ `queryFoundersTool` - Search founders database
2. ✅ `querySessionsTool` - Search sessions/events database
3. ✅ `queryStartupsTool` - Search startups database

### Disabled Tools (1)
1. ❌ `queryFAQTool` - FAQ guidance (disabled)

### Slack Experience
- **Animation:** Disabled (static "Processing..." message)
- **Status Updates:** Disabled (no live progress indicators)
- **Tool Visibility:** Disabled (users don't see which tools are used)

### Terminal Experience
- **Unchanged** - Terminal streaming still works with full animation
- Only Slack streaming was modified

---

## Files Modified

```
✅ src/mastra/agents/lucie-agents.ts
   - Commented out queryFAQTool import and registration

✅ src/mastra/slack/streaming.ts
   - Disabled animation timer and status updates
   - Simplified streaming to post-wait-respond approach
   - Preserved original implementation as commented code
```

## Documentation Created

```
✅ docs/query-faq-tool-disabled.md
   - Why FAQ tool was disabled
   - What was lost
   - How to re-enable
   - Potential fixes

✅ docs/slack-streaming-disabled.md
   - What animation features were disabled
   - Before/after comparison
   - Performance impact
   - How to restore

✅ docs/DISABLED-FEATURES-SUMMARY.md (this file)
   - Combined overview of all disabled features
```

---

## Summary

Two major features have been disabled to improve Lucie's performance:

1. **FAQ Tool** - Disabled due to returning too many results for short queries
   - Impact: Lost 197 curated FAQs but kept 3 database tools
   - Recommendation: Fix search logic and re-enable

2. **Slack Animation** - Disabled per user request
   - Impact: No more animated spinners or progress indicators
   - Benefit: 95% reduction in Slack API calls

Both features can be easily re-enabled if needed. The FAQ tool infrastructure (database, seeding scripts, 197 FAQs) remains intact. The Slack animation original code is preserved as comments.

**Current State:** Lucie is functional with simplified Slack experience and 3 active database query tools.
