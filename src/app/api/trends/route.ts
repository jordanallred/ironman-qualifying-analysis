import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import qualifyingSlotsData from '@/data/qualifying_slots_2025.json';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get all races with analysis and results
    const races = await prisma.race.findMany({
      include: {
        analysis: true,
        results: true
      },
      where: {
        analysis: {
          isNot: null
        }
      }
    });
    
    if (races.length === 0) {
      return NextResponse.json({
        error: 'No race analysis data available for trends',
        totalRaces: 0
      }, { status: 404 });
    }
    
    // Validate race data - only include races with BOTH 2025 and 2026 allocations
    const validRaces = races.filter(race => {
      const analysis = race.analysis;
      if (!analysis) return false;
      
      // Basic validation checks
      if (analysis.totalParticipants <= 0) return false;
      if (analysis.totalSlots <= 0) return false;
      if (!analysis.ageGroupAnalysis) return false;
      
      // CRITICAL: Only include races that continue from 2025 to 2026
      // Exclude discontinued races that skew trends
      if (!race.totalSlots2026 || race.totalSlots2026 <= 0) {
        console.warn(`Race ${race.name}: discontinued in 2026 - excluding from trends`);
        return false;
      }
      
      // Check that participants match results count
      if (race.results.length !== analysis.totalParticipants) {
        console.warn(`Race ${race.name}: participants mismatch - analysis: ${analysis.totalParticipants}, results: ${race.results.length}`);
        return false;
      }
      
      return true;
    });
    
    if (validRaces.length === 0) {
      return NextResponse.json({
        error: 'No valid race analysis data available for trends',
        totalRaces: races.length,
        validRaces: 0
      }, { status: 404 });
    }
    
    if (validRaces.length < races.length) {
      console.warn(`Trends API: ${races.length - validRaces.length} races excluded due to data validation issues`);
    }
    
    // Aggregate trends across all races
    let totalParticipants = 0;
    let totalMenParticipants = 0;
    let totalWomenParticipants = 0;
    let totalSlots = 0;
    
    let total2025MenQualified = 0;
    let total2025WomenQualified = 0;
    let total2026MenQualified = 0;
    let total2026WomenQualified = 0;
    
    const ageGroupTrends: Record<string, {
      participantCount: number;
      slots2025: number;
      slots2026: number;
      difference: number;
      menParticipants: number;
      womenParticipants: number;
      menSlots2025: number;
      womenSlots2025: number;
      // Note: 2026 has no gender-specific slots (age-graded system)
      totalTimes2025: number;
      totalTimes2026: number;
      timeCount2025: number;
      timeCount2026: number;
    }> = {};
    
    const raceDistanceBreakdown = {
      full: { count: 0, participants: 0, slots: 0 }
    };
    
    for (const race of validRaces) {
      const analysis = race.analysis!;
      
      totalParticipants += analysis.totalParticipants;
      totalMenParticipants += analysis.menParticipants;
      totalWomenParticipants += analysis.womenParticipants;
      totalSlots += analysis.totalSlots;
      
      total2025MenQualified += analysis.system2025MenQualified;
      total2025WomenQualified += analysis.system2025WomenQualified;
      total2026MenQualified += analysis.system2026MenQualified;
      total2026WomenQualified += analysis.system2026WomenQualified;
      
      // Race distance breakdown - only full distance races supported
      if (race.distance === 'full') {
        raceDistanceBreakdown.full.count++;
        raceDistanceBreakdown.full.participants += analysis.totalParticipants;
        raceDistanceBreakdown.full.slots += analysis.totalSlots;
      }
      
      // Calculate age group participant counts from results
      const ageGroupParticipants: Record<string, { men: number; women: number; total: number }> = {};
      
      for (const result of race.results) {
        if (!ageGroupParticipants[result.ageGroup]) {
          ageGroupParticipants[result.ageGroup] = { men: 0, women: 0, total: 0 };
        }
        
        if (result.gender === 'M') {
          ageGroupParticipants[result.ageGroup].men++;
        } else if (result.gender === 'F') {
          ageGroupParticipants[result.ageGroup].women++;
        }
        ageGroupParticipants[result.ageGroup].total++;
      }
      
      // Age group analysis
      const ageGroupData = analysis.ageGroupAnalysis as Record<string, Record<string, any>>;
      
      for (const [ageGroup, data] of Object.entries(ageGroupData)) {
        if (!ageGroupTrends[ageGroup]) {
          ageGroupTrends[ageGroup] = {
            participantCount: 0,
            slots2025: 0,
            slots2026: 0,
            difference: 0,
            menParticipants: 0,
            womenParticipants: 0,
            menSlots2025: 0,
            womenSlots2025: 0,
            // Note: 2026 has no gender-specific slots (age-graded system)
            totalTimes2025: 0,
            totalTimes2026: 0,
            timeCount2025: 0,
            timeCount2026: 0
          };
        }
        
        const trend = ageGroupTrends[ageGroup];
        trend.slots2025 += data.system_2025?.total || 0;
        trend.slots2026 += data.system_2026?.total || 0;
        trend.difference += data.difference?.total || 0;
        
        // Only 2025 has gender-specific slot allocations
        trend.menSlots2025 += data.system_2025?.men || 0;
        trend.womenSlots2025 += data.system_2025?.women || 0;
        // 2026 is age-graded (no gender quotas), so no gender-specific slot tracking
        
        // Add participant counts from results
        const participantData = ageGroupParticipants[ageGroup];
        if (participantData) {
          trend.participantCount += participantData.total;
          trend.menParticipants += participantData.men;
          trend.womenParticipants += participantData.women;
        }
        
        // Calculate qualifying times from actual race results (more reliable than stored analysis)
        const slots2025 = data.system_2025?.total || 0;
        const slots2026 = data.system_2026?.total || 0;
        
        // Calculate 2025 qualifying time: get the slowest qualifier in this age group
        if (slots2025 > 0) {
          const ageGroupResults = race.results
            .filter(r => r.ageGroup === ageGroup && r.timeSeconds > 0)
            .sort((a, b) => a.timeSeconds - b.timeSeconds);
          
          if (ageGroupResults.length > 0) {
            const cutoffIndex = Math.min(slots2025 - 1, ageGroupResults.length - 1);
            const cutoffTime = ageGroupResults[cutoffIndex]?.timeSeconds;
            
            if (cutoffTime) {
              trend.totalTimes2025 += cutoffTime;
              trend.timeCount2025++;
            }
          }
        }
        
        // Calculate 2026 qualifying time: get the slowest qualifier in this age group for 2026 system
        if (slots2026 > 0) {
          // For 2026, we need to check which athletes actually qualified under the age-graded system
          // Sort by age-graded time to find qualifiers, then use their RAW time for consistent comparison
          const ageGroupResults = race.results
            .filter(r => r.ageGroup === ageGroup && r.ageGradedTime > 0 && r.timeSeconds > 0)
            .sort((a, b) => a.ageGradedTime - b.ageGradedTime);
          
          if (ageGroupResults.length > 0) {
            const cutoffIndex = Math.min(slots2026 - 1, ageGroupResults.length - 1);
            const cutoffResult = ageGroupResults[cutoffIndex];
            
            if (cutoffResult?.timeSeconds) {
              trend.totalTimes2026 += cutoffResult.timeSeconds;
              trend.timeCount2026++;
            }
          }
        }
      }
    }
    
    // Use consistent slot data from database instead of JSON file
    const correctTotalSlots = totalSlots;
    
    // Calculate percentages and changes
    const overallTrends = {
      totalRaces: validRaces.length,
      totalParticipants,
      totalMenParticipants,
      totalWomenParticipants,
      totalSlots: correctTotalSlots,
      
      genderDistribution: {
        menPercentage: Math.round((totalMenParticipants / totalParticipants) * 100),
        womenPercentage: Math.round((totalWomenParticipants / totalParticipants) * 100)
      },
      
      system2025: {
        totalQualified: total2025MenQualified + total2025WomenQualified,
        menQualified: total2025MenQualified,
        womenQualified: total2025WomenQualified,
        menPercentage: Math.round((total2025MenQualified / (total2025MenQualified + total2025WomenQualified)) * 100),
        womenPercentage: Math.round((total2025WomenQualified / (total2025MenQualified + total2025WomenQualified)) * 100)
      },
      
      system2026: {
        totalQualified: total2026MenQualified + total2026WomenQualified,
        menQualified: total2026MenQualified,
        womenQualified: total2026WomenQualified,
        menPercentage: Math.round((total2026MenQualified / (total2026MenQualified + total2026WomenQualified)) * 100),
        womenPercentage: Math.round((total2026WomenQualified / (total2026MenQualified + total2026WomenQualified)) * 100)
      },
      
      changes: {
        menDifference: total2026MenQualified - total2025MenQualified,
        womenDifference: total2026WomenQualified - total2025WomenQualified,
        totalDifference: (total2026MenQualified + total2026WomenQualified) - (total2025MenQualified + total2025WomenQualified)
      }
    };
    
    // Calculate average times and prepare age group data
    const ageGroupChanges = Object.entries(ageGroupTrends)
      .map(([ageGroup, data]) => {
        // Calculate average times
        const avgTime2025 = data.timeCount2025 > 0 ? data.totalTimes2025 / data.timeCount2025 : null;
        const avgTime2026 = data.timeCount2026 > 0 ? data.totalTimes2026 / data.timeCount2026 : null;
        
        return {
          ageGroup,
          ...data,
          avgTime2025,
          avgTime2026,
          percentageChange: data.slots2025 > 0 ? Math.round(((data.slots2026 - data.slots2025) / data.slots2025) * 100) : 0
        };
      })
      .sort((a, b) => b.difference - a.difference);
    
    const topWinners = ageGroupChanges.filter(ag => ag.difference > 0).slice(0, 5);
    const topLosers = ageGroupChanges.filter(ag => ag.difference < 0).slice(-5).reverse();
    
    return NextResponse.json({
      overallTrends,
      raceDistanceBreakdown,
      ageGroupTrends: ageGroupChanges,
      topWinners,
      topLosers,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching trends:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch trends data' 
    }, { status: 500 });
  }
}