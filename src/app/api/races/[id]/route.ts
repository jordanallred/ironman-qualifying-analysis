import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * IRONMAN World Championship Qualifying Systems Implementation
 * 
 * CRITICAL: This file implements the official IRONMAN qualifying systems.
 * See KONA_QUALIFYING_RULES_2026.md for exact 2026 rules.
 * 
 * 2025 System:
 * - Gender-specific slot allocations (menSlots + womenSlots = totalSlots)
 * - Age group minimums + proportional distribution
 * - Ranking by raw finish time within age groups
 * 
 * 2026 System (OFFICIAL PROCESS):
 * 1. "first we offer a slot to all age group winners"
 * 2. "The roll down process simply moves down this list, offering slots 
 *    to the fastest age-graded finishers until all available qualifying slots are accepted"
 * - No gender quotas - merit-based via age-graded times
 * - Uses official Kona Standards for age-grading
 * - totalSlots2026 typically equals totalSlots (same total allocation)
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: raceId } = await params;
    
    // Get race with full analysis and results
    const race = await prisma.race.findUnique({
      where: { id: raceId },
      include: {
        analysis: true,
        results: {
          orderBy: { place: 'asc' }
        }
      }
    });
    
    if (!race) {
      return NextResponse.json({ 
        error: 'Race not found' 
      }, { status: 404 });
    }
    
    // If no analysis exists, return race info suggesting manual fetch
    if (!race.analysis) {
      return NextResponse.json({
        error: 'No analysis available for this race',
        race: {
          id: race.id,
          name: race.name,
          date: race.date.toISOString().split('T')[0],
          location: race.location,
          distance: race.distance,
          totalSlots: race.totalSlots,
          menSlots: race.menSlots,
          womenSlots: race.womenSlots
        },
        canFetchManually: true
      }, { status: 404 });
    }
    
    // Use the existing age group analysis data from prefetched analysis
    const existingAgeGroupAnalysis = race.analysis.ageGroupAnalysis || {};

    const calculate2025QualifyingTimes = () => {
      // For 2025: Use race-specific slot allocation per age group
      const allResults = race.results
        .filter(r => r.timeSeconds > 0)
        .sort((a, b) => a.timeSeconds - b.timeSeconds);
      
      if (allResults.length === 0 || race.totalSlots === 0) return null;
      
      const cutoffIndex = Math.min(race.totalSlots - 1, allResults.length - 1);
      const cutoffTime = allResults[cutoffIndex]?.timeSeconds;
      
      return cutoffTime ? { cutoff_time_seconds: cutoffTime } : null;
    };

    // 2026 System Implementation - OFFICIAL IRONMAN RULES
    // See KONA_QUALIFYING_RULES_2026.md for complete documentation
    // 
    // Process:
    // 1. Age group winners get automatic slots
    // 2. Remaining slots awarded by age-graded time ranking
    
    const totalSlots2026 = race.totalSlots2026 || race.totalSlots;
    
    // Step 1: "first we offer a slot to all age group winners"
    const ageGroupWinners = new Set();
    const ageGroups = [...new Set(race.results.map(r => r.ageGroup))];
    
    ageGroups.forEach(ageGroup => {
      // Find winner (fastest raw time) in this age group
      const ageGroupResults = race.results
        .filter(r => r.ageGroup === ageGroup && r.timeSeconds > 0)
        .sort((a, b) => a.timeSeconds - b.timeSeconds);
      
      if (ageGroupResults.length > 0) {
        ageGroupWinners.add(ageGroupResults[0].id);
      }
    });
    
    // Step 2: Calculate remaining slots after age group winners
    const remainingSlots2026 = Math.max(0, totalSlots2026 - ageGroupWinners.size);
    
    // Step 3: "The roll down process simply moves down this list, offering slots 
    // to the fastest age-graded finishers until all available qualifying slots are accepted"
    const nonWinners = race.results
      .filter(r => !ageGroupWinners.has(r.id) && r.ageGradedTime > 0)
      .sort((a, b) => a.ageGradedTime - b.ageGradedTime); // Sort by age-graded time (fastest first)
    
    // Step 4: Award slots according to official 2026 process
    const qualified2026 = new Set();
    
    // All age group winners get automatic slots
    ageGroupWinners.forEach(id => qualified2026.add(id));
    
    // Remaining slots go to fastest age-graded finishers
    nonWinners.slice(0, remainingSlots2026).forEach(athlete => {
      qualified2026.add(athlete.id);
    });
    
    // Calculate qualifying times for 2026 system (age-graded) - now that we have actual qualifiers
    const calculate2026QualifyingTimes = () => {
      // For 2026: Get the actual slowest qualifier's age-graded time
      const actualQualifiers = race.results.filter(r => qualified2026.has(r.id) && r.ageGradedTime > 0);
      
      if (actualQualifiers.length === 0) return null;
      
      // Find the slowest qualifier's age-graded time
      const slowestQualifier = actualQualifiers.reduce((prev, curr) => 
        curr.ageGradedTime > prev.ageGradedTime ? curr : prev
      );
      
      return { cutoff_time_seconds: slowestQualifier.ageGradedTime };
    };
    
    // Build age group analysis using existing data but add qualifying times
    const ageGroupAnalysis: Record<string, any> = {};
    
    for (const ageGroup of Object.keys(existingAgeGroupAnalysis)) {
      const existing = existingAgeGroupAnalysis[ageGroup];
      const ageGroupResults = race.results.filter(r => r.ageGroup === ageGroup);
      
      // For 2025: Calculate cutoff time for this age group's allocation
      const slots2025 = existing.system_2025?.total || 0;
      const ageGroupSorted = ageGroupResults
        .filter(r => r.timeSeconds > 0)
        .sort((a, b) => a.timeSeconds - b.timeSeconds);
      
      const cutoff2025 = slots2025 > 0 && ageGroupSorted.length > 0 ? 
        ageGroupSorted[Math.min(slots2025 - 1, ageGroupSorted.length - 1)]?.timeSeconds : null;
      
      // For 2026: Calculate qualifying time using dual-path logic
      const qualifiers2026 = ageGroupResults.filter(r => qualified2026.has(r.id));
      const slots2026 = qualifiers2026.length;
      
      // Calculate 2026 qualifying time: slower of (1) age group winner time or (2) last performance pool qualifier time
      let cutoff2026 = null;
      if (ageGroupResults.length > 0) {
        // Path 1: Age group winner time
        const ageGroupWinner = ageGroupResults
          .filter(r => r.timeSeconds > 0)
          .sort((a, b) => a.timeSeconds - b.timeSeconds)[0];
        const agWinnerTime = ageGroupWinner?.timeSeconds || Infinity;
        
        // Path 2: Convert performance pool age-graded time to this age group's equivalent
        let performancePoolTimeForAgeGroup = Infinity;
        if (nonWinners.length >= remainingSlots2026 && remainingSlots2026 > 0) {
          const lastPerformancePoolQualifier = nonWinners[remainingSlots2026 - 1];
          const lastPerformancePoolAgeGradedTime = lastPerformancePoolQualifier.ageGradedTime;
          
          // Get age group standard for conversion
          const ageGroupStandard = await prisma.ageGroupStandard.findUnique({
            where: { ageGroup }
          });
          
          if (ageGroupStandard && lastPerformancePoolAgeGradedTime) {
            performancePoolTimeForAgeGroup = lastPerformancePoolAgeGradedTime / ageGroupStandard.multiplier;
          }
        }
        
        // The qualifying time is the slower (higher) of these two paths
        if (agWinnerTime !== Infinity || performancePoolTimeForAgeGroup !== Infinity) {
          cutoff2026 = Math.max(
            agWinnerTime === Infinity ? 0 : agWinnerTime,
            performancePoolTimeForAgeGroup === Infinity ? 0 : performancePoolTimeForAgeGroup
          );
        }
      }
      
      ageGroupAnalysis[ageGroup] = {
        participants: ageGroupResults.length,
        system_2025: {
          total: slots2025,
          qualifying_times: cutoff2025 ? { cutoff_time_seconds: cutoff2025 } : null
        },
        system_2026: {
          total: slots2026,
          qualifying_times: cutoff2026 ? { cutoff_time_seconds: cutoff2026 } : null
        }
      };
    }

    // Calculate 2025 system using the analyzer's method (real-time calculation)
    const { IronmanAnalyzer } = await import('@/lib/ironman-analyzer');
    const analyzer = new IronmanAnalyzer();
    
    // Prepare results in the format expected by the analyzer
    const formattedResults = race.results.map(result => ({
      place: result.place.toString(),
      name: result.athleteName,
      age_group: result.ageGroup,
      gender: result.ageGroup.startsWith('M') ? 'M' : 'F',
      time: result.finishTime,
      country: result.country || 'Unknown'
    }));

    // Calculate 2025 system using the analyzer's logic
    const system2025Result = analyzer.calculate2025System(
      formattedResults.map(r => ({
        ...r,
        place: parseInt(r.place),
        time_seconds: analyzer.parseTimeToSeconds(r.time),
        age_graded_time: analyzer.calculateAgeGradedTime(
          analyzer.parseTimeToSeconds(r.time),
          r.gender,
          r.age_group
        )
      })),
      race.menSlots || 0,
      race.womenSlots || 0
    );

    const men2025Qualified = system2025Result.qualifiers.filter(q => q.gender.toUpperCase() === 'M').length;
    const women2025Qualified = system2025Result.qualifiers.filter(q => q.gender.toUpperCase() === 'F').length;
    const total2025Qualified = system2025Result.qualifiers.length;

    // Calculate actual gender distribution for 2026 system (merit-based, no quotas)
    const qualified2026Results = race.results.filter(r => qualified2026.has(r.id));
    const men2026Qualified = qualified2026Results.filter(r => r.ageGroup.startsWith('M')).length;
    const women2026Qualified = qualified2026Results.filter(r => r.ageGroup.startsWith('F')).length;

    // Calculate overall qualifying times
    const overallTimes2025 = calculate2025QualifyingTimes();
    const overallTimes2026 = calculate2026QualifyingTimes();

    // Return full analysis
    const analysisData = {
      race_name: race.name,
      total_participants: race.analysis.totalParticipants,
      men_participants: race.analysis.menParticipants,
      women_participants: race.analysis.womenParticipants,
      total_slots_2025: race.totalSlots,
      men_slots_2025: race.menSlots,
      women_slots_2025: race.womenSlots,
      total_slots_2026: totalSlots2026,
      men_slots_2026: null, // 2026 system has no gender allocations
      women_slots_2026: null, // 2026 system has no gender allocations
      total_slots: race.analysis.totalSlots, // Legacy field
      system_2025: {
        men_qualified: men2025Qualified,
        women_qualified: women2025Qualified,
        total_qualified: total2025Qualified,
        qualifying_times: overallTimes2025
      },
      system_2026: {
        men_qualified: men2026Qualified,
        women_qualified: women2026Qualified,
        total_qualified: qualified2026.size,
        qualifying_times: overallTimes2026
      },
      changes: {
        men_difference: men2026Qualified - men2025Qualified,
        women_difference: women2026Qualified - women2025Qualified,
        total_difference: qualified2026.size - total2025Qualified,
        percent_change: total2025Qualified > 0 ? ((qualified2026.size - total2025Qualified) / total2025Qualified * 100) : 0
      },
      age_group_analysis: ageGroupAnalysis,
      detailed_results: race.results.map(result => {
        // Check if this athlete qualified in the calculated 2025 system
        const qualified2025 = system2025Result.qualifiers.some(q => q.name === result.athleteName);
        
        return {
          place: result.place,
          name: result.athleteName,
          age_group: result.ageGroup,
          raw_time_seconds: result.timeSeconds,
          age_graded_time_seconds: result.ageGradedTime,
          qualified_2025: qualified2025,
          qualified_2026: qualified2026.has(result.id)
        };
      }).sort((a, b) => a.place - b.place)
    };
    
    return NextResponse.json(analysisData);
    
  } catch (error) {
    console.error('Error fetching race analysis:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch race analysis' 
    }, { status: 500 });
  }
}


