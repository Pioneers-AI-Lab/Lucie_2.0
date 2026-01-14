# Airtable Field Mapping Strategy

**Date**: 2026-01-14
**Issue**: `years_of_xp` and `founder` fields returning NULL in database
**Status**: ✅ FIXED

---

## Problem

After fixing the data corruption in the sync script, two fields were still coming back as NULL in the database:
- `years_of_xp` - Always NULL despite data existing in Airtable
- `founder` - Always NULL despite data existing in Airtable

### Root Cause

The sync script was using **Airtable field IDs** to access field data:
```typescript
yearsOfXp: safeParseInt(fields[founderAirtableFieldIds.yearsOfXp]), // undefined!
founder: fields[founderAirtableFieldIds.founder], // undefined!
```

But Airtable API was returning **human-readable field names** as keys:
```json
{
  "Years of XP": 7,
  "Founder": "Tomas Jenicek",
  "Name": "Tomas Jenicek"
}
```

**Result**: Accessing `fields['fldNlvxotHY13xj13']` returned `undefined`, which became `NULL` in the database.

---

## Solution

Updated sync script to use **human-readable field names** instead of field IDs:

```typescript
// Before (field IDs):
yearsOfXp: safeParseInt(fields[founderAirtableFieldIds.yearsOfXp])

// After (field names):
yearsOfXp: safeParseInt(fields['Years of XP'])
```

### Full Field Mapping (Founders Table)

| Database Field | Airtable Field Name |
|----------------|-------------------|
| `name` | `"Name"` |
| `email` | `"Email"` |
| `whatsapp` | `"Whatsapp"` |
| `linkedin` | `"LinkedIn"` |
| `nationality` | `"Nationality"` |
| `status` | `"Status"` |
| `batch` | `"Batch"` |
| `yourPhoto` | `"Your photo"` |
| `techSkills` | `"Tech Skills"` |
| `rolesICouldTake` | `"Roles I could take"` |
| `trackRecordProud` | `"Track record / something I am proud of "` |
| `companiesWorked` | `"Companies Worked"` |
| `degree` | `"Degree"` |
| `existingProjectIdea` | `"Do you have an existing project/idea ?"` |
| `education` | `"Education"` |
| `gender` | `"Gender"` |
| `leftProgram` | `"Left Program"` |
| `industries` | `"Industries"` |
| `interestedInWorkingOn` | `"What I am interested in working on:"` |
| `yearsOfXp` | `"Years of XP"` ⚠️ Note capitalization |
| `introduction` | `"Introduction:"` |
| `academicField` | `"Academic Field"` |
| `projectExplanation` | `"If yes, explain it in a few words"` |
| `joiningWithCofounder` | `"Are you joining with an existing cofounder? If yes, please insert his/her name below."` |
| `openToJoinAnotherProject` | `"Are you open to join another project during the program? "` ⚠️ Note trailing space |
| `founder` | `"Founder"` ⚠️ Was NULL |

---

## Verification

After fix, database query shows correct values:

```
Name: Tomas Jenicek
Years of XP: 7
Founder: Tomas Jenicek
---
Name: Dylan Mérigaud
Years of XP: 7
Founder: Dylan Mérigaud
---
Name: Julie Colin
Years of XP: 18
Founder: Julie Colin
```

---

## Understanding Field IDs vs Field Names

### Field IDs (Stable but require configuration)

**Example**: `fldNlvxotHY13xj13`

- **Pros**:
  - Stable across renames
  - Won't break if user changes column name in Airtable
  - Recommended for production systems

- **Cons**:
  - Harder to read/debug
  - Requires mapping file maintenance
  - Requires Airtable API configuration to return field IDs

### Field Names (Human-readable, default)

**Example**: `"Years of XP"`

- **Pros**:
  - Easy to read and debug
  - Works with default Airtable API config
  - Self-documenting code

- **Cons**:
  - Breaks if field names change in Airtable
  - Case-sensitive (e.g., "Years of XP" ≠ "years of xp")
  - Trailing spaces matter (e.g., `"Are you open... "` has trailing space)

---

## Current Strategy

**Using Human-Readable Field Names**

The sync script now uses human-readable field names for all three tables:
- ✅ Founders - Uses field names
- ✅ Sessions/Events - Uses field names
- ✅ Startups - Uses field names

**Field ID Reference Files** (`lib/airtable-field-ids-ref.ts`):
- Still exist for reference/documentation
- Not actively used in sync script
- Can be used for future migrations or if Airtable config changes

---

## Gotchas & Best Practices

### 1. **Case Sensitivity**
```typescript
fields['Years of XP']  // ✅ Works
fields['years of xp']  // ❌ Returns undefined
fields['Years Of XP']  // ❌ Returns undefined
```

**Fix**: Copy field names exactly as they appear in Airtable.

### 2. **Trailing Spaces**
```typescript
fields['Are you open to join another project during the program? ']  // ✅ Has trailing space
fields['Are you open to join another project during the program?']   // ❌ Missing space
```

**Fix**: Use debug logging to see exact field names from Airtable.

### 3. **Special Characters**
```typescript
fields['Track record / something I am proud of ']  // ✅ Has slash and trailing space
```

**Fix**: Copy-paste field names from debug output to avoid typos.

### 4. **Debugging Technique**

When a field isn't syncing:

```typescript
// Add temporary logging
console.log('Available fields:', Object.keys(fields));
console.log('Looking for:', 'Years of XP');
console.log('Value:', fields['Years of XP']);
```

This shows:
- What fields Airtable is actually returning
- If field names match exactly
- What value is being retrieved

---

## How to Migrate to Field IDs (Future)

If you want to use field IDs instead of names:

1. **Configure Airtable API** to return field IDs as keys
   - Requires Airtable API v2 or higher
   - Set `returnFieldsByFieldId: true` in API options

2. **Update sync script**:
   ```typescript
   import { founderAirtableFieldIds } from '../../lib/airtable-field-ids-ref.js';

   yearsOfXp: safeParseInt(fields[founderAirtableFieldIds.yearsOfXp])
   ```

3. **Test thoroughly** - Verify all fields still sync correctly

---

## Related Files

- `src/db/sync-from-airtable.ts` - Sync script (uses field names)
- `lib/airtable-field-ids-ref.ts` - Field ID reference (documentation only)
- `scripts/check-founders-data.ts` - Verification script

---

## Lessons Learned

1. **Always verify data flow** - Don't assume field IDs work without testing
2. **Debug with actual API responses** - Print what Airtable returns
3. **Field names are fragile** - Consider field IDs for production
4. **Documentation prevents repeats** - This file will help future developers

---

**Status**: ✅ Fixed - All fields syncing correctly
**Verification**: Run `tsx scripts/check-founders-data.ts` to verify data
