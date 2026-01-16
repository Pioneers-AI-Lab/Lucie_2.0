# FAQ Response Policy - Exact Answer Only

## Summary

Lucie has been updated to return **ONLY the exact text from the "answer" field** when responding to FAQ queries, with no additions, preambles, summaries, or elaborations.

## Problem

Previously, Lucie was adding extra content to FAQ answers, making responses too long:

### Example Issue - Team Size Question

**User asks**: "What is the ideal team size?"

**FAQ database contains**:
```json
{
  "question": "What is the ideal team size for Pioneers?",
  "answer": "Team size requirements vary, but most accepted teams range from solo founders to small teams of 2 or 3 people for a startup - founders should take into account that the more founders in a team the more risk of misalignment on vision, governance, and work ethic."
}
```

**Lucie was responding** (WRONG):
> According to the Pioneers program FAQs, there is no strict ideal team size, but the general recommendation is: "The ideal team size is 2-4 founders. This allows for a good balance of skills, experience, and workload distribution, without becoming too unwieldy. Solo founders are also welcome to apply, but having at least one co-founder is preferred." The key is to have a complementary team with diverse backgrounds and expertise. The program encourages founders to find co-founders who can fill any gaps in their skillset or experience. So in summary, the sweet spot is typically 2-4 founders, but solo founders can also apply if they have a strong enough background and plan to bring on additional team members. The focus is on building a well-rounded, collaborative founding team.

**Issues**:
1. ❌ Added preamble: "According to the Pioneers program FAQs..."
2. ❌ Changed facts: "2-4 founders" instead of "2 or 3 people"
3. ❌ Hallucinated content: "co-founder is preferred" (not in FAQ)
4. ❌ Added summary: "So in summary, the sweet spot is..."
5. ❌ Elaborated beyond the FAQ answer with general startup advice

## Solution

### Changes Made to `src/mastra/agents/lucie-instructions.ts`

#### 1. Added Major Section: "NO HALLUCINATION - TOOL RESULTS ONLY"

New critical rule section added to instructions with strict guidelines:
- ✅ ONLY use information directly from tool results
- ❌ NEVER add your own knowledge
- ❌ NEVER make assumptions
- ❌ NEVER contradict tool results
- ✅ Quote or paraphrase tool results accurately

Includes concrete example using the team size question.

#### 2. Enhanced "queryFAQTool Usage Tips"

Added explicit **⚠️⚠️⚠️ CRITICAL FAQ RESPONSE RULE ⚠️⚠️⚠️** section:
- Return **ONLY the exact "answer" field value**
- ❌ NO preambles: "According to...", "The program states...", "Based on..."
- ❌ NO summaries: "So in summary...", "The key is..."
- ❌ NO extra context or explanations
- ❌ NO rewording or paraphrasing
- ❌ NO elaboration or interpretation
- ✅ ONLY the answer value from the FAQ

#### 3. Updated "Response Guidelines"

Added FAQ-specific guideline:
> **⚠️ FOR FAQ ANSWERS: Return ONLY the exact "answer" field value** - no preambles, no summaries, no extra context - just the raw answer text

#### 4. Updated "Do NOT" Section

Added three explicit prohibitions:
- Do not add preambles like "According to the FAQ..."
- Do not add summaries like "So in summary..."
- Do not rephrase, paraphrase, or elaborate on FAQ answers

#### 5. Added Response Style Example

New example showing wrong vs correct FAQ response handling:

**❌ Bad (FAQ answer with unnecessary additions)**:
> According to the Pioneers program FAQs, there is no strict ideal team size, but the general recommendation is: "The ideal team size is 2-4 founders. This allows for a good balance of skills, experience, and workload distribution." The key is to have a complementary team. So in summary, the sweet spot is typically 2-4 founders.

**✅ Good (FAQ answer - exact text only)**:
> Team size requirements vary, but most accepted teams range from solo founders to small teams of 2 or 3 people for a startup - founders should take into account that the more founders in a team the more risk of misalignment on vision, governance, and work ethic.

## Expected Behavior

### Now When Lucie Receives a Question:

1. **Calls queryFAQTool** with appropriate search parameters
2. **Receives FAQ result** with question/answer structure
3. **Returns ONLY the "answer" field value** - nothing more, nothing less
4. **No additions** - no preambles, no summaries, no context, no elaboration

### Example - Correct Response Flow

**User**: "What is the ideal team size?"

**Tool call**: `queryFAQTool({searchType: "search", searchTerm: "team size"})`

**Tool returns**:
```json
{
  "question": "What is the ideal team size for Pioneers?",
  "answer": "Team size requirements vary, but most accepted teams range from solo founders to small teams of 2 or 3 people for a startup - founders should take into account that the more founders in a team the more risk of misalignment on vision, governance, and work ethek."
}
```

**Lucie responds** (CORRECT):
> Team size requirements vary, but most accepted teams range from solo founders to small teams of 2 or 3 people for a startup - founders should take into account that the more founders in a team the more risk of misalignment on vision, governance, and work ethic.

## FAQ Data Sources

These policies apply to all FAQ data from:

1. **`general-questions.json`** - General program information (52 FAQs)
2. **`founders-faq.json`** - Founder-specific guidance (36 FAQs)
3. **`sessions-faq.json`** - Session and event guidance (34 FAQs)
4. **`startups-faq.json`** - Startup-specific information (39 FAQs)
5. **`2025-sessions-events-info-faq.json`** - Specific 2025 events (36 FAQs)

**Total**: 197 FAQ entries across 5 files

## FAQ Data Structure

All FAQ files follow this structure:
```json
{
  "program": "Pioneers Accelerator",
  "location": "Station F",
  "knowledge_base": {
    "category_name": [
      {
        "question": "What is X?",
        "answer": "X is..."
      }
    ]
  }
}
```

The `queryFAQTool` searches across questions and answers, then returns matching FAQs with their question/answer pairs.

## Testing

To verify this behavior:

1. **Test in CLI**:
```bash
pnpm dev:cli
```

2. **Ask FAQ question**:
```
> What is the ideal team size?
```

3. **Expected result**: Lucie should return ONLY the exact answer from the FAQ, with no additions

4. **Verify no hallucination**:
   - No preambles like "According to..."
   - No changed numbers or facts
   - No added preferences or recommendations
   - No summaries or conclusions
   - Just the raw answer text

## Files Modified

```
✅ src/mastra/agents/lucie-instructions.ts
   - Added "NO HALLUCINATION - TOOL RESULTS ONLY" section
   - Enhanced "queryFAQTool Usage Tips" with critical FAQ response rule
   - Updated "Response Guidelines" with FAQ-specific instruction
   - Updated "Do NOT" section with FAQ-specific prohibitions
   - Added FAQ response style example (bad vs good)
```

## Benefits

1. ✅ **Accurate information** - No hallucinated facts
2. ✅ **Concise responses** - No unnecessary elaboration
3. ✅ **Consistent answers** - Same FAQ = same response
4. ✅ **Faster responses** - Less token generation
5. ✅ **Better UX** - Users get direct answers without fluff
6. ✅ **Source fidelity** - Answers match curated FAQ content exactly

## Important Notes

- This policy applies **ONLY to FAQ responses** from `queryFAQTool`
- For database queries (founders, sessions, startups), Lucie still formats and presents data in a user-friendly way
- The goal is to prevent LLM hallucination and ensure FAQ accuracy
- FAQ answers are already well-written and comprehensive - no "improvement" needed
