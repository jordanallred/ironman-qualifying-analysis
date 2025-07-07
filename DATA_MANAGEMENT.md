# Data Management & Validation System

This document outlines the data integrity system designed to prevent data corruption and ensure consistent, accurate race information.

## Core Principle

**ALL race data must match the authoritative JSON files in `src/data/`:**
- `qualifying_slots_2025.json` - Authoritative 2025 race schedule and slot allocations
- `qualifying_slots_2026.json` - Authoritative 2026 race schedule and slot allocations

## Key Rules

### 1. Race Existence
- Every race in the database MUST exist in the 2025 JSON file
- Races not in 2025 are considered invalid and will be deleted

### 2. Slot Allocations
- Database slot allocations MUST exactly match JSON data
- 2025: Uses gender-specific slots (men_slots + women_slots = total_slots)
- 2026: Uses gender-neutral slots (total_slots only, men_slots/women_slots = null)

### 3. Discontinued Races
- If a race exists in 2025 but NOT in 2026, it's discontinued
- Discontinued races should have:
  - `totalSlots2026 = null`
  - `system2026TotalQualified = 0`
  - `system2026MenQualified = 0`
  - `system2026WomenQualified = 0`

### 4. Analysis Consistency
- `system2025TotalQualified` MUST equal `men_slots + women_slots` from 2025 JSON
- `system2026TotalQualified` MUST NOT exceed `total_slots` from 2026 JSON
- For discontinued races, all 2026 qualified numbers MUST be 0

## Available Scripts

### Validation
```bash
npm run validate          # Check data integrity
npm run cleanup          # Fix inconsistencies automatically
```

### Data Management
```bash
npx tsx scripts/cleanup-and-validate.ts                # Comprehensive cleanup
npx tsx scripts/data-validation-suite.ts              # Detailed validation report
npx tsx scripts/mass-fix-discontinued-races.ts        # Fix all discontinued races
```

### Build Process
```bash
npm run build            # Build with validation (recommended)
npm run build-old        # Old build without validation (NOT recommended)
```

## Build Process with Validation

The new build process (`npm run build`) includes:

1. **Pre-validation** - Ensures existing data is clean
2. **Data import** - Only runs if validation passes
3. **Post-validation** - Confirms data is still clean after import
4. **Build failure** - Stops if any validation fails

This prevents corrupted data from ever reaching production.

## Validation Output

### ✅ Success
```
📋 Validation Summary:
   Races checked: 79
   Errors: 0
   Warnings: 5
✅ All data is valid and consistent!
```

### ❌ Failure
```
📋 Validation Summary:
   Races checked: 79
   Errors: 25
   Warnings: 5

🚨 ERRORS:
   ❌ IRONMAN Italy: 2025 total slots mismatch (DB: 40, JSON: 105)
   ❌ IRONMAN France: 2026 qualified should be 0 (race discontinued), but shows 55
```

## Current Data Status

After cleanup (as of latest validation):
- **79 total races** in database
- **17 races** continuing in 2026
- **62 races** discontinued in 2026
- **0 data integrity errors**
- **All slot allocations match authoritative JSON**

## Emergency Recovery

If data gets corrupted again:

1. **Stop all imports immediately**
2. **Run validation**: `npm run validate`
3. **Run cleanup**: `npm run cleanup`
4. **Re-validate**: `npm run validate`
5. **If still broken, delete bad races manually and re-import from authoritative JSON**

## Adding New Races

1. **Update authoritative JSON files first**
2. **Run validation to ensure consistency**
3. **Import new race data**
4. **Validate again to confirm success**

Never add races directly to the database - always update JSON files first.

## The 2025 vs 2026 Comparison

This system ensures the website accurately shows:
- **2025**: Gender-specific slot allocations (65M + 40W = 105 total)
- **2026**: Gender-neutral, age-graded allocations (40 total, distributed by performance)
- **Discontinued races**: 62 races that exist in 2025 but not 2026

The validation system prevents the confusion and data corruption that plagued earlier versions.