# Query Sessions Tool Update - Complete

## Summary

Updated the `query-sessions-tool.ts` to properly reference the new 2025 sessions events FAQ data (36 FAQs) and provide clear guidance on when to use the database tool vs the FAQ tool for session-related queries.

## Changes Made

### File Updated: `src/mastra/tools/query-sessions-tool.ts`

**1. Updated Header Comment**
- Changed "100 session events" → "100+ session events"
- Added comprehensive note about FAQ tool with 2 domains:
  - 34 general sessions FAQs (guidance)
  - 36 specific 2025 events FAQs (event details)
- Clarified: This tool returns RAW session records, use FAQ for CURATED answers

**2. Enhanced Tool Description**
- Added detailed "TOOL SELECTION" section with clear use cases
- Provided specific examples for both tools:
  - **querySessionsTool**: "Show me sessions in Week 3" ✅
  - **queryFAQTool**: "What was the Alexis Robert event?" ✅
- Listed available FAQs: 34 general + 36 specific 2025 events

**3. Added Important Warning**
- Emphasized that FAQ tool has 36 curated FAQs with rich context
- Clarified when to use each tool:
  - **Database tool**: Listing, finding by criteria, checking dates/times
  - **FAQ tool**: Understanding specific events, speaker details, milestones

## Tool Selection Guidance

### Use querySessionsTool (Database) For:
✅ **Database queries**: "When is...", "Show me...", "List...", "How many..."
✅ **Finding sessions by**: name, speaker, type, week, date range
✅ **Raw data needs**: session names, dates, participants, notes

**Examples:**
- "When is the next session?"
- "Show me all workshops"
- "List sessions in Week 3"
- "Find sessions with speaker John"

### Use queryFAQTool For:
✅ **Detailed event information** with context and explanations
✅ **Questions about SPECIFIC 2025 events**: speakers, milestones, challenges
✅ **General guidance**: "How do X work?", "What is Y?", "Tell me about Z"

**Examples:**
- "What was the Alexis Robert event?" (2025 events FAQ)
- "Who was Emmanuel Straschnov and what did he speak about?" (2025 FAQ)
- "Tell me about Selection Day" (2025 milestone FAQ)
- "What was the last social event about?" (2025 events FAQ)
- "What are Friday pitches?" (general sessions FAQ)
- "How do office hours work?" (general guidance FAQ)

## Testing Results

### Test 1: Event-Specific Question
```
Question: "What was the Alexis Robert event?"
Tool Used: queryFAQTool ✅
Result: "The Alexis Robert event was a masterclass session titled 'Session with
         Alexis Robert from KIMA Ventures,' held during Week 2 at 2 PM on the
         Junior Stage in the Share Zone at Station F. Alexis Robert is a General
         Partner at KIMA Ventures, a leading early-stage VC in France."
```

### Test 2: Database Query (Listing)
```
Question: "Show me all sessions in Week 3"
Tool Used: querySessionsTool ✅
Result: Listed 14 sessions including:
        - Sharpstone office hours
        - Group dinner 25/06/2025
        - Masterclass - Emmanuel Straschnov
        - What it means to be VC backable
        - etc.
```

### Test 3: Speaker Details Question
```
Question: "Who was Emmanuel Straschnov and what did he speak about?"
Tool Used: queryFAQTool ✅
Result: "Emmanuel Straschnov is the founder of Bubble, a no-code platform.
         He spoke about building and shipping products quickly using no-code
         tools during a masterclass on June 26, 2025, in Week 3 of the program."
```

## Key Improvements

1. **Clear Tool Selection**: Lucie now has explicit guidance on when to use each tool
2. **Comprehensive Examples**: Concrete examples help LLM understand usage patterns
3. **FAQ Reference**: Direct reference to 70 total session-related FAQs (34 + 36)
4. **Context Emphasis**: Clarifies that FAQ provides rich context vs raw database records
5. **Better Routing**: Tests show Lucie correctly routes questions to appropriate tool

## Architecture

```
User Question
│
├─ "Show me..." / "List..." / "When is..." / "Find..."
│  └─ querySessionsTool (database records)
│
└─ "What was..." / "Tell me about..." / "Who was..." / "What did X speak about..."
   └─ queryFAQTool (curated answers with context)
```

## Benefits

1. **Accurate Tool Selection**: LLM routes questions to correct tool based on intent
2. **Richer Answers**: Event-specific questions get curated FAQ responses with context
3. **Efficient Queries**: Database tool used for listing/filtering (its strength)
4. **Better UX**: Users get appropriate answer type based on question format
5. **Dual Support**: Both tools work together - database for data, FAQ for understanding

## Files Modified

```
✅ src/mastra/tools/query-sessions-tool.ts
   - Updated header comment (FAQ references)
   - Enhanced tool description (70 lines → clear guidance)
   - Added TOOL SELECTION section with examples
   - Added IMPORTANT warning about FAQ context
```

## Summary

The query-sessions-tool now properly guides Lucie to:
- Use **database tool** for listing, searching, and filtering sessions
- Use **FAQ tool** for understanding specific 2025 events, speakers, and milestones

Testing confirms Lucie correctly routes questions based on intent, providing users with optimal answers whether they need raw data (database) or rich context (FAQ).
