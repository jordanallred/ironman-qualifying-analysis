import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import qualifyingSlotsData from '@/data/qualifying_slots_2025.json';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // const distance = searchParams.get('distance'); // 'full' or null for all - currently unused
    
    // Get races from database first, fallback to JSON data
    // Only full distance races are supported
    let races = await prisma.race.findMany({
      where: {
        distance: 'full'
      },
      include: {
        analysis: true,
        results: true, // Include results for real-time calculation
        _count: {
          select: { results: true }
        }
      },
      orderBy: { date: 'asc' }
    });
    
    // If no races in database, use JSON data
    if (races.length === 0) {
      const allRaces = [];
      
      // Process only full distance races
      for (const [name, data] of Object.entries(qualifyingSlotsData.full_distance)) {
        allRaces.push({
          id: `full-${name.toLowerCase().replace(/\s+/g, '-')}`,
          name,
          date: new Date(data.date),
          location: data.location,
          distance: 'full',
          totalSlots: data.total_slots,
          menSlots: data.men_slots,
          womenSlots: data.women_slots,
          analysis: null,
          _count: { results: 0 },
          hasResults: false
        });
      }
      
      races = allRaces.sort((a, b) => a.date.getTime() - b.date.getTime());
    }

    // Calculate real-time qualifying numbers for races with results
    const { IronmanAnalyzer } = await import('@/lib/ironman-analyzer');
    const analyzer = new IronmanAnalyzer();
    
    // Transform for API response with real-time calculations
    const racesResponse = races.map(race => {
      let system2025Qualified = null;
      let system2026Qualified = null;
      let slotChange = null;

      // Calculate real-time for races with results
      if (race.results && race.results.length > 0) {
        try {
          // Calculate 2025 system
          const formattedResults = race.results.map(result => ({
            place: result.place.toString(),
            name: result.athleteName,
            age_group: result.ageGroup,
            gender: result.ageGroup.startsWith('M') ? 'M' : 'F',
            time: result.finishTime,
            country: result.country || 'Unknown',
            time_seconds: analyzer.parseTimeToSeconds(result.finishTime),
            age_graded_time: analyzer.calculateAgeGradedTime(
              analyzer.parseTimeToSeconds(result.finishTime),
              result.ageGroup.startsWith('M') ? 'M' : 'F',
              result.ageGroup
            )
          }));

          // 2025 system calculation
          const system2025Result = analyzer.calculate2025System(
            formattedResults,
            race.menSlots || 0,
            race.womenSlots || 0
          );
          system2025Qualified = system2025Result.qualifiers.length;

          // 2026 system calculation (simplified version from the individual race API)
          const totalSlots2026 = race.totalSlots2026 || race.totalSlots;
          const ageGroups = [...new Set(race.results.map(r => r.ageGroup))];
          
          // Age group winners
          const ageGroupWinners = new Set();
          ageGroups.forEach(ageGroup => {
            const ageGroupResults = race.results
              .filter(r => r.ageGroup === ageGroup && r.timeSeconds > 0)
              .sort((a, b) => a.timeSeconds - b.timeSeconds);
            
            if (ageGroupResults.length > 0) {
              ageGroupWinners.add(ageGroupResults[0].id);
            }
          });

          // Performance pool for remaining slots
          const remainingSlots2026 = Math.max(0, totalSlots2026 - ageGroupWinners.size);
          const nonWinners = race.results
            .filter(r => !ageGroupWinners.has(r.id) && r.ageGradedTime > 0)
            .sort((a, b) => a.ageGradedTime - b.ageGradedTime);

          system2026Qualified = ageGroupWinners.size + Math.min(remainingSlots2026, nonWinners.length);
          slotChange = system2026Qualified - system2025Qualified;

        } catch (error) {
          // Fallback to database values if calculation fails
          system2025Qualified = race.analysis?.system2025TotalQualified || null;
          system2026Qualified = race.analysis?.system2026TotalQualified || null;
          slotChange = race.analysis ? (race.analysis.system2026TotalQualified - race.analysis.system2025TotalQualified) : null;
        }
      } else {
        // Use database values for races without results
        system2025Qualified = race.analysis?.system2025TotalQualified || null;
        system2026Qualified = race.analysis?.system2026TotalQualified || null;
        slotChange = race.analysis ? (race.analysis.system2026TotalQualified - race.analysis.system2025TotalQualified) : null;
      }

      return {
        id: race.id,
        name: race.name,
        date: race.date.toISOString().split('T')[0],
        location: race.location,
        distance: race.distance,
        totalSlots: race.totalSlots,
        menSlots: race.menSlots,
        womenSlots: race.womenSlots,
        totalSlots2026: race.totalSlots2026,
        menSlots2026: race.menSlots2026,
        womenSlots2026: race.womenSlots2026,
        hasResults: race._count.results > 0,
        hasAnalysis: !!race.analysis,
        participantCount: race._count.results,
        system2025Qualified,
        system2026Qualified,
        slotChange
      };
    });
    
    // Calculate summary statistics using real-time calculated values
    const racesWithData = racesResponse.filter(r => r.system2025Qualified !== null && r.system2026Qualified !== null);
    const totalQualifiers2025 = racesWithData.reduce((sum, r) => sum + (r.system2025Qualified || 0), 0);
    const totalQualifiers2026 = racesWithData.reduce((sum, r) => sum + (r.system2026Qualified || 0), 0);
    const racesWithAnalysis = racesWithData.length;
    
    // Calculate summary statistics
    const summary = {
      totalRaces: racesResponse.length,
      fullDistanceRaces: racesResponse.filter(r => r.distance === 'full').length,
      race703Count: 0,
      totalSlots: racesResponse.reduce((sum, race) => sum + race.totalSlots, 0),
      racesWithData: racesWithAnalysis,
      totalQualifiers2025,
      totalQualifiers2026,
      netSlotChange: totalQualifiers2026 - totalQualifiers2025
    };
    
    return NextResponse.json({
      races: racesResponse,
      summary
    });
    
  } catch (error) {
    console.error('Error fetching races:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch races' 
    }, { status: 500 });
  }
}