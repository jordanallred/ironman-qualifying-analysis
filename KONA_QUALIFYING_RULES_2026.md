# IRONMAN World Championship 2026 Qualifying System - OFFICIAL RULES

## CRITICAL: DO NOT MODIFY THESE RULES WITHOUT OFFICIAL IRONMAN DOCUMENTATION

This document contains the exact official rules from IRONMAN for the 2026 qualifying system. Any code implementation MUST follow these rules precisely.

## The 2026 Qualifying Process

### Step 1: Age Group Winners Get Automatic Slots
**"At the conclusion of a qualifying race, first we offer a slot to all age group winners."**

- Each age group winner (fastest finisher in their age group) gets an automatic qualifying slot
- This happens BEFORE any age-graded calculations for remaining slots

### Step 2: Age-Graded Ranking for Remaining Slots
**"The roll down process simply moves down this list, offering slots to the fastest age-graded finishers until all available qualifying slots are accepted."**

- Calculate age-graded times for ALL remaining athletes (non-age-group-winners)
- Rank these athletes by age-graded time (fastest first)
- Award remaining slots in order until all slots are filled

## Age-Graded Time Calculation

### Formula:
```
age_graded_time = finish_time_seconds * kona_standard_multiplier
```

### Kona Standards (Official Table):
```
Age Group    Men      Women
18-24       0.9698   0.8567
25-29       0.9921   0.8961
30-34       1.0000   0.8977
35-39       0.9895   0.8866
40-44       0.9683   0.8707
45-49       0.9401   0.8501
50-54       0.9002   0.8125
55-59       0.8667   0.7778
60-64       0.8262   0.7218
65-69       0.7552   0.6828
70-74       0.6876   0.6439
75-79       0.6768   0.5521
80-84       0.5555   TBD*
85-89       0.5416   TBD*
```

*Note: Women 80-84 and 85-89 are TBD because there have been no finishers in these age groups over the past 5 editions.

## Official Example from IRONMAN

### IRONMAN Kalmar Example:
- **Anne (F40-44)**: 9:19:51 finish time
  - Age-graded: 9:19:51 × 0.8707 = 8:07:26
- **John (M40-44)**: 8:50:31 finish time  
  - Age-graded: 8:50:31 × 0.9683 = 8:33:42

**Result**: Anne ranks above John (8:07:26 < 8:33:42) despite slower raw time.

## Implementation Requirements

### For any race with N total slots:

1. **Count age groups**: Determine how many age groups have finishers
2. **Award age group winner slots**: Each age group winner gets 1 slot
3. **Calculate remaining slots**: `remaining_slots = N - age_group_winner_count`
4. **Age-grade remaining athletes**: Calculate age-graded times for all non-winners
5. **Rank by age-graded time**: Sort remaining athletes by age-graded time (ascending)
6. **Award remaining slots**: Give slots to top `remaining_slots` athletes

### Data Validation:
- Total qualifiers should equal total available slots for the race
- Age group winners must always qualify (unless they decline)
- Age-graded times must use exact Kona Standards from official table
- Lower age-graded time = better performance

## Key Differences from 2025 System:
- **No gender quotas**: Men and women compete in same pool after age-grading
- **Merit-based**: Performance relative to age/gender standard determines qualification
- **Age group winners protected**: Guaranteed slots before merit-based allocation
- **Same total slots**: Usually same number of total slots as 2025 system

## Source:
Official IRONMAN World Championship 2026 Qualifying documentation provided by user on 2025-01-06.