# Query Tools FAQ Integration - Complete

## Summary

Updated all query tools to properly reference the comprehensive FAQ system (161 FAQs across 31 categories). Each tool now clearly communicates when to use data tools vs FAQ tool, ensuring Lucie selects the appropriate tool for each question type.

## Changes Made

### 1. **queryFAQTool** (`src/mastra/tools/query-faq-tool.ts`)

**Updates:**
- Updated header comment to reflect all 4 FAQ sources:
  - `data/general-questions.json` (52 FAQs)
  - `data/sessions-faq.json` (34 FAQs)
  - `data/startups-faq.json` (39 FAQs)
  - `data/founders-faq.json` (36 FAQs)
  - **Total: 161 FAQs across 31 categories**

- Completely rewritten description with 4 domain breakdowns:
  - 📋 **GENERAL PROGRAM** (52 FAQs, 7 categories)
  - 📅 **SESSIONS & EVENTS** (34 FAQs, 7 categories)
  - 🚀 **STARTUPS & ENTREPRENEURSHIP** (39 FAQs, 9 categories)
  - 👥 **FOUNDERS & CO-FOUNDER MATCHING** (36 FAQs, 8 categories)

- Added comprehensive tool selection guidance:
  ```
  🎯 When to use this tool vs data tools:
  - Use queryFAQTool for: "How do I...?", "What should I...?", "How does X work?", "What is...?" (guidance/explanation)
  - Use queryFoundersTool for: "Show me founders...", "Who are the CTOs?", "Find developers..." (actual founder data)
  - Use querySessionsTool for: "When is the next session?", "Show me workshops...", "List upcoming events..." (actual session data)
  - Use queryStartupsTool for: "Show me FinTech startups...", "Which startups are...?", "List companies..." (actual startup data)
  ```

- Updated `category` parameter to list all 31 valid categories across 4 domains

- Added examples showing when to use FAQ vs data tools:
  - "How do I find a co-founder?" → FAQ tool
  - "Show me all CTOs" → Founders data tool
  - "What should I include in my pitch?" → FAQ tool
  - "When is the next session?" → Sessions data tool

### 2. **queryFoundersTool** (`src/mastra/tools/query-founders-tool.ts`)

**Updates:**
- Added note in header comment:
  ```
  💡 Note: For guidance on HOW to find co-founders, understand profiles, or reach out,
  use queryFAQTool with searchTerm related to founders (36 FAQs available covering
  Profile Book navigation, co-founder matching strategies, outreach best practices).
  This tool returns ACTUAL founder data - use queryFAQTool for guidance/explanations.
  ```

- Added tool selection section in description:
  ```
  💡 TOOL SELECTION:
  - Use THIS TOOL for: "Show me founders...", "Who are the CTOs?", "Find developers..." (actual founder data/records)
  - Use queryFAQTool for: "How do I find a co-founder?", "What should I look for?", "How do I reach out?" (guidance/advice)
  - 36 founders FAQs available covering Profile Book navigation, co-founder matching, understanding profiles, outreach strategies
  ```

### 3. **querySessionsTool** (`src/mastra/tools/query-sessions-tool.ts`)

**Updates:**
- Added note in header comment:
  ```
  💡 Note: For guidance on HOW sessions work, attendance policies, or participation expectations,
  use queryFAQTool with searchTerm related to sessions (34 FAQs available covering session types,
  office hours, attendance, program milestones, schedules, and weekly updates).
  This tool returns ACTUAL session data - use queryFAQTool for guidance/explanations.
  ```

- Added tool selection section in description:
  ```
  💡 TOOL SELECTION:
  - Use THIS TOOL for: "When is the next session?", "Show me workshops...", "List upcoming events..." (actual session data/records)
  - Use queryFAQTool for: "What are Friday pitches?", "How do office hours work?", "Do I have to attend?" (guidance/explanations)
  - 34 sessions FAQs available covering session types, office hours, attendance policies, program milestones, schedules
  ```

### 4. **queryStartupsTool** (`src/mastra/tools/query-startups-tool.ts`)

**Updates:**
- Added note in header comment:
  ```
  💡 Note: For guidance on HOW to build startups, validate ideas, or prepare pitches,
  use queryFAQTool with searchTerm related to startups (39 FAQs available covering
  team formation, traction, validation, product development, pitching, investment readiness,
  go-to-market strategies, and common challenges).
  This tool returns ACTUAL startup data - use queryFAQTool for guidance/explanations.
  ```

- Added tool selection section in description:
  ```
  💡 TOOL SELECTION:
  - Use THIS TOOL for: "Show me FinTech startups...", "Which startups are...?", "List companies building..." (actual startup data/records)
  - Use queryFAQTool for: "How do I validate my idea?", "What is an LOI?", "How do I prepare for IC?" (guidance/advice)
  - 39 startups FAQs available covering traction, validation, pitching, product development, investment readiness, GTM strategy
  ```

## Architecture Pattern

**Clear Separation of Concerns:**

1. **Data Tools** (queryFoundersTool, querySessionsTool, queryStartupsTool):
   - Return actual records from database
   - Answer "Show me...", "Who are...", "List...", "When is..." questions
   - Provide concrete data: names, dates, details, contacts

2. **FAQ Tool** (queryFAQTool):
   - Return guidance and explanations
   - Answer "How do I...", "What should I...", "What is...", "How does X work..." questions
   - Provide advice, strategies, best practices, definitions

3. **Cross-References:**
   - Each data tool mentions relevant FAQ domain (36, 34, or 39 FAQs)
   - FAQ tool mentions all three data tools
   - Tool descriptions include examples of appropriate use cases
   - Clear guidance helps LLM select correct tool

## Testing Results

### Test 1: FAQ Query (Guidance Question)
```bash
Question: "How do I find a co-founder?"
Tool Used: queryFAQTool ✅
Result: Found 2 FAQ entries, returned guidance on co-founder matching
```

### Test 2: Data Query (Show Me Question)
```bash
Question: "Show me all CTOs"
Tool Used: queryFoundersTool ✅
Result: Found 1 founder (Victor Thery), returned actual founder data
```

Both tests passed - Lucie correctly selected the appropriate tool for each question type.

## Benefits

1. **Improved Tool Selection**: LLM has clear guidance on when to use each tool
2. **Comprehensive Coverage**: 161 FAQs + actual data = complete knowledge base
3. **Clear Separation**: Data vs guidance distinction prevents confusion
4. **Cross-Referenced**: Each tool mentions related tools and FAQs
5. **Example-Driven**: Concrete examples help LLM understand usage patterns
6. **Bidirectional**: Both FAQ → Data and Data → FAQ references included

## Tool Selection Decision Tree

```
User Question
│
├─ "How do I..." / "What should I..." / "What is..." / "How does X work..."
│  └─ queryFAQTool (guidance/explanation)
│
└─ "Show me..." / "Who are..." / "List..." / "When is..." / "Find..."
   │
   ├─ About founders/people → queryFoundersTool
   ├─ About sessions/events → querySessionsTool
   └─ About startups/companies → queryStartupsTool
```

## Usage Examples

### Founders Domain
- ❓ **FAQ**: "How do I find a co-founder?" → queryFAQTool
- 📊 **Data**: "Show me all CTOs" → queryFoundersTool

### Sessions Domain
- ❓ **FAQ**: "What are Friday pitches?" → queryFAQTool
- 📊 **Data**: "When is the next session?" → querySessionsTool

### Startups Domain
- ❓ **FAQ**: "What is an LOI?" → queryFAQTool
- 📊 **Data**: "Show me FinTech startups" → queryStartupsTool

### General Program
- ❓ **FAQ**: "How do I apply to Pioneers?" → queryFAQTool
- ❓ **FAQ**: "What is Station F?" → queryFAQTool

## Files Modified

1. `src/mastra/tools/query-faq-tool.ts` - Comprehensive FAQ domain descriptions
2. `src/mastra/tools/query-founders-tool.ts` - Added founders FAQ reference
3. `src/mastra/tools/query-sessions-tool.ts` - Added sessions FAQ reference
4. `src/mastra/tools/query-startups-tool.ts` - Added startups FAQ reference

Total changes: 149 insertions, 31 deletions across 4 tool files

## Next Steps

All query tools are now properly integrated with the FAQ system. Lucie can:
- ✅ Answer guidance questions using 161 FAQs across 31 categories
- ✅ Retrieve actual data using specialized query tools
- ✅ Automatically select the appropriate tool based on question type
- ✅ Provide comprehensive support for the entire Pioneers program

The integration is complete and production-ready.
