# Sessions FAQ Summary

## Overview

Created a comprehensive FAQ file (`data/sessions-faq.json`) covering all questions about sessions and events in the Pioneers accelerator program.

## Source Data

Based on `data/2025-Cohort_Data/JSON/founders/sessions_events_2025_readable.json` which contains:
- 100+ session/event records
- 12 different session types
- Detailed information about speakers, participants, logistics, and feedback

## Session Types Covered

1. **Masterclass** - Expert-led workshops (AWS, sales, GTM, technical topics)
2. **Office hours external** - Mentorship with industry experts
3. **Office hours Pioneers** - Guidance from Pioneers team
4. **Group exercise** - Hands-on team challenges (Startup Challenge, etc.)
5. **Friday Pitches** - Weekly team presentations
6. **Theme session** - Peer-led knowledge sharing
7. **Socials** - Networking events (lunch roulette, board game nights)
8. **Selection Day** - Major milestone for advancing in program
9. **Pre-IC** - Practice sessions before Investment Committee
10. **Announce/Organisation** - Program announcements and logistics
11. **Diner/lunch** - Community meals
12. **Other event** - Miscellaneous program activities

## FAQ Structure

### 6 Categories with 37 FAQ entries:

1. **session_types_overview** (6 FAQs)
   - Overview of all session types
   - Masterclasses, theme sessions, group exercises
   - Friday pitches, social events

2. **office_hours_and_mentorship** (4 FAQs)
   - What are office hours
   - How to book office hours
   - Differences between Pioneers and external office hours
   - Getting 1-on-1 feedback

3. **attendance_and_participation** (5 FAQs)
   - Are sessions mandatory
   - What happens if you can't attend
   - Most important sessions
   - Remote attendance options
   - Session recording policies

4. **program_milestones** (6 FAQs)
   - Basecamp Day
   - Selection Day
   - Investment Committee (IC)
   - Pre-IC
   - How teams are selected
   - What happens if not selected

5. **schedule_and_logistics** (5 FAQs)
   - Program intensity
   - Typical weekly schedule
   - Where sessions take place
   - How far in advance sessions are announced
   - Where to find the schedule

6. **weekly_updates_and_progress** (3 FAQs)
   - Do I need to submit weekly updates
   - What to include in updates
   - Why updates are important

7. **miscellaneous** (5 FAQs)
   - Can I host/lead a session
   - Practice pitching opportunities
   - How to get feedback
   - External experts who visit
   - Networking opportunities

**Total: 34 comprehensive FAQ entries**

## Key Topics Covered

### Session Types & Structure
- Detailed explanation of each session type
- Purpose and format of different sessions
- Who leads sessions (external experts, Pioneers team, peers)

### Logistics & Attendance
- Mandatory vs optional sessions
- Notification requirements for absences
- Remote vs in-person participation
- Location information

### Mentorship & Feedback
- Office hours booking process
- Types of mentorship available
- Getting feedback on your startup
- 1-on-1 sessions with Pioneers team

### Program Milestones
- Major events: Basecamp Day, Selection Day, IC
- How teams are evaluated and selected
- What happens at each milestone
- Selection criteria

### Weekly Operations
- Schedule structure and intensity
- Weekly update requirements
- Calendar and announcement systems

### Community & Networking
- Social events
- Peer learning opportunities
- Practice and collaboration
- External expert access

## Integration with Lucie

This FAQ file can be integrated with Lucie in two ways:

### Option 1: Merge with general-questions.json
Combine the sessions-specific FAQs with the general program FAQs into a single comprehensive knowledge base.

### Option 2: Separate Sessions FAQ Table
Create a separate database table for session-specific FAQs, allowing Lucie to distinguish between:
- General program questions → `queryFAQTool` (general-questions.json)
- Session/event questions → `querySessionsFAQTool` (sessions-faq.json)

## Sample Questions Lucie Can Answer

**Session Types:**
- "What types of sessions does Pioneers offer?"
- "What are masterclasses?"
- "What are Friday pitches?"
- "What are theme sessions?"

**Attendance:**
- "Are sessions mandatory?"
- "What happens if I can't attend?"
- "Can I attend remotely?"
- "Are sessions recorded?"

**Milestones:**
- "What is Selection Day?"
- "What is the Investment Committee?"
- "How are teams selected?"
- "What is Basecamp Day?"

**Logistics:**
- "Where do sessions take place?"
- "How intensive is the schedule?"
- "Where can I find the schedule?"

**Office Hours:**
- "How do I book office hours?"
- "What are office hours?"
- "Can I get 1-on-1 feedback?"

**Progress & Updates:**
- "Do I need to submit weekly updates?"
- "What should I include in updates?"

## Data Quality

- ✅ Based on real session data from actual cohort
- ✅ Includes specific examples and details
- ✅ Covers practical logistics and procedures
- ✅ Addresses common founder concerns
- ✅ 34 comprehensive FAQ entries
- ✅ Follows same JSON structure as general-questions.json

## Next Steps

1. **Merge with existing FAQ** - Combine with general-questions.json
2. **Or create separate table** - Keep sessions FAQs separate for targeted queries
3. **Update seed helper** - Add support for multiple FAQ sources
4. **Test with Lucie** - Verify Lucie can answer session-related questions
5. **Iterate based on founder questions** - Add more FAQs as common questions emerge

## Benefits

1. **Comprehensive Coverage** - Answers most questions about sessions and events
2. **Practical Information** - Based on actual program data and experiences
3. **Reduces Support Load** - Founders can self-serve common questions
4. **Improves Onboarding** - New founders understand program structure
5. **Sets Expectations** - Clear information about attendance, milestones, etc.

## File Location

`/home/baalbade/dev/pioneers/work/Lucie_2.0/data/sessions-faq.json`

Structure matches `general-questions.json` for easy integration with existing FAQ system.
