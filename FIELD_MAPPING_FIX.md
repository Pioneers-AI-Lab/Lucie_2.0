# Field Mapping Fix - Pioneers Profile Book

**Date**: 2026-01-14
**Issue**: Data corruption in readable JSON files due to misaligned field names
**Status**: ✅ FIXED

---

## Problem

The `pioneers_profile_book_table_records_readable.json` files had field names that didn't match the actual data structure defined in `pioneers-profile-book-table-ref.json`. This caused data to be mapped to incorrect fields.

### Examples of Misalignment

| Wrong Field Name | Actual Data | Correct Field Name |
|-----------------|-------------|-------------------|
| `Email` | "Tomas Jenicek" | `name` |
| `Education` | "tojenicek@gmail.com" | `email` |
| `Track record...` | "+420725132480" | `whatsapp` |
| `LinkedIn` | "Czech" | `nationality` |
| `Industries` | "https://linkedin..." | `linkedin` |
| `Nationality` | "Yes, I am available..." | `status` |

**Root Cause**: CSV export from Airtable had human-readable column headers that were shifted/misaligned from the actual field structure.

---

## Solution

Created and ran `/scripts/fix-readable-json.ts` to:

1. **Map misaligned fields** to correct field names using the table reference
2. **Normalize batch values** (e.g., "Summer 2025" → "S25")
3. **Parse years_of_xp** as integers (with NaN safety)
4. **Preserve unmapped fields** for debugging

### Mapping Logic

```typescript
const FIELD_MAPPING = {
  'Email': 'name',
  'Education': 'email',
  'Track record / something I am proud of ': 'whatsapp',
  'LinkedIn': 'nationality',
  'Industries': 'linkedin',
  'Nationality': 'status',
  // ... 20+ more mappings
};
```

---

## Files Fixed

1. ✅ `data/2025-Cohort_Data/JSON/founders/pioneers_profile_book_table_records_readable.json`
2. ✅ `data/airtable_data/founders/pioneers_profile_book_table_records_readable.json`
3. ✅ `data/airtable_data/admin/pioneers_profile_book_table_records_readable.json`

**Backups Created**: `.backup` suffix added to original files

---

## Verification

### Before Fix
```json
{
  "fields": {
    "Email": "Tomas Jenicek",           // Wrong!
    "Education": "tojenicek@gmail.com", // Wrong!
    "LinkedIn": "Czech"                 // Wrong!
  }
}
```

### After Fix
```json
{
  "fields": {
    "name": "Tomas Jenicek",            // Correct!
    "email": "tojenicek@gmail.com",     // Correct!
    "nationality": "Czech"              // Correct!
  }
}
```

---

## Related Fixes

This is **Critical Issue #1** from `TODO.md`. The same misalignment was fixed in:

1. ✅ `src/db/sync-from-airtable.ts` - Now uses field IDs instead of column names
2. ✅ Readable JSON files - Fixed field name mappings (this document)

---

## Impact

- **Database sync now works correctly** - No more NaN errors or misaligned data
- **Seed data is accurate** - JSON files can be used for testing/seeding
- **Reference files match reality** - Field names align with actual structure

---

## How to Re-Run Fix (if needed)

```bash
# Run the fix script
tsx scripts/fix-readable-json.ts

# This will create a *_FIXED.json file
# Manually replace the original if you're satisfied with the fix
```

---

## Lessons Learned

### 1. **Always Use Field IDs, Not Field Names**

When working with Airtable API, use field IDs (e.g., `fldXCZWHOholJbcR2`) instead of human-readable names (e.g., `"Email"`). Field IDs are stable, names can change or be misaligned in exports.

### 2. **Validate Data Mappings Early**

The misalignment went undetected because:
- No schema validation on seed data
- No type checking on CSV imports
- Human-readable names looked plausible but were wrong

**Fix**: Add validation scripts that compare field names against reference schema.

### 3. **Safe Integer Parsing**

The `years_of_xp` field was causing NaN errors because we tried to parse text as numbers. Always use safe parsing:

```typescript
const safeParseInt = (value: any): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
};
```

### 4. **Preserve Data During Fixes**

Always create backups before modifying data files:
```bash
cp original.json original.json.backup
```

---

## Related Documentation

- `TODO.md` - Task #1 (Data Corruption Bug) - ✅ COMPLETED
- `lib/airtable-field-ids-ref.ts` - Field ID mappings
- `data/2025-Cohort_Data/JSON/founders/pioneers-profile-book-table-ref.json` - Reference schema
- `src/db/sync-from-airtable.ts` - Sync script (now uses field IDs)

---

**Status**: ✅ All files fixed and verified
**Next Steps**: Continue with TODO.md Task #3 (Fix agent instructions)
