# IRONMAN World Championship Qualifying Systems

## Critical Implementation Note
This document defines the exact rules for both 2025 and 2026 qualifying systems. **These rules must be followed precisely in all code implementations to ensure data accuracy.**

## 2025 System (Current/Legacy)

### Slot Allocation Method
- **Gender-Specific Allocations**: Each race has separate men's and women's slot allocations
- **Age Group Minimums**: Each male and female age group with registered participants gets one slot minimum
- **Proportional Distribution**: Remaining slots distributed among age groups based on participation ratios

### Process:
1. **Before Race**: Each M & F age group with registered athletes gets 1 slot (Initially Allocated Slot)
2. **Proportional Allocation**: Remaining slots distributed based on starter ratios across age groups
3. **Gender Segregated**: Men compete for men's slots, women compete for women's slots
4. **Within Age Group Ranking**: Slots within each age group go to fastest finishers by raw time

### Database Fields:
- `totalSlots`: Total 2025 slots (sum of men + women)
- `menSlots`: Men's slots for 2025
- `womenSlots`: Women's slots for 2025

### Example (IRONMAN Kalmar):
- Men: 65 slots
- Women: 20 slots  
- Total: 85 slots

## 2026 System (New)

### Slot Allocation Method
- **Merit-Based**: No gender quotas - purely performance-based across all participants
- **Age Group Winners**: Each age group winner (fastest in their age group) gets automatic slot
- **Performance Pool**: Remaining slots allocated by age-graded performance ranking

### Process:
1. **Automatic Qualifying Slots**: Winner of each male & female age group gets automatic slot
   - If winner declines, goes to 2nd place, then 3rd place
   - If all top 3 decline, slot goes to Performance Pool
2. **Performance Pool Allocation**: 
   - All remaining participants ranked by age-graded times (compared to Kona Standards)
   - Best age-graded performers get remaining slots regardless of gender
   - Uses "first to accept" roll-down process

### Database Fields:
- `totalSlots2026`: Total 2026 slots (usually same number as 2025 total)
- `menSlots2026`: NULL (not used - no gender quotas)
- `womenSlots2026`: NULL (not used - no gender quotas)

### Key Differences from 2025:
- **Total slots typically same**: `totalSlots2026` usually equals `totalSlots` (men + women from 2025)
- **No gender allocation**: Results will have different M/F ratios based purely on performance
- **Age-graded comparison**: Uses Kona Standards to normalize across age groups

## Critical Implementation Rules

### Slot Count Validation:
- `totalSlots2026` should equal `totalSlots` for most races
- Gender distribution in 2026 results will vary by race based on actual performance
- Age group winners always get slots first in 2026 system

### Calculation Order for 2026:
1. Count total age groups with finishers
2. Allocate 1 slot per age group for winners (automatic slots)
3. Calculate remaining slots: `totalSlots2026 - ageGroupWinnerSlots`
4. Rank all non-winners by age-graded time
5. Award remaining slots to top performers

### Data Integrity Checks:
- 2025 system: `menSlots + womenSlots = totalSlots`
- 2026 system: Total qualifiers ≤ `totalSlots2026`
- Age group winners in 2026 must always qualify (unless they decline)

## Age-Graded Time Calculation

Uses Kona Standards (5-year average of top 20% finishers by age group):
```
age_graded_time = raw_time_seconds / kona_standard_multiplier
```

Lower age-graded time = better performance relative to age group standard.

## Database Schema Requirements

### Race Table:
```sql
totalSlots      INT NOT NULL    -- 2025 total slots
menSlots        INT             -- 2025 men slots  
womenSlots      INT             -- 2025 women slots
totalSlots2026  INT             -- 2026 total slots (usually = totalSlots)
menSlots2026    INT NULL        -- Always NULL (no gender quotas)
womenSlots2026  INT NULL        -- Always NULL (no gender quotas)
```

## Implementation Checklist

When implementing qualifying calculations:

### 2025 System:
- [ ] Use gender-specific slot allocations from database
- [ ] Ensure age group minimums are respected
- [ ] Rank within age groups by raw finish time
- [ ] Validate total matches men + women slots

### 2026 System:
- [ ] Identify age group winners by fastest raw time per age group
- [ ] Calculate remaining slots after age group winners
- [ ] Rank remaining participants by age-graded time
- [ ] Award slots to top performers regardless of gender
- [ ] Validate total qualifiers ≤ totalSlots2026

## Common Errors to Avoid

1. **Wrong 2026 total**: Using different slot counts between 2025 and 2026 systems
2. **Gender quotas in 2026**: Applying any gender-based limitations in 2026 system
3. **Ignoring age group winners**: Not giving automatic slots to age group winners in 2026
4. **Wrong ranking criteria**: Using raw time instead of age-graded time for 2026 performance pool
5. **Incorrect age-graded calculation**: Using wrong Kona Standards or calculation method

## Data Sources

Official qualifying information based on:
- 2025 IRONMAN World Championship official qualifying procedures
- 2026 IRONMAN World Championship official qualifying procedures
- Race-specific slot allocations from IRONMAN official announcements