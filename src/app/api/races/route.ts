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

    // Transform for API response using cached analysis values
    const racesResponse = races.map(race => {
      // Use cached analysis values from database
      const system2025Qualified = race.analysis?.system2025TotalQualified || null;
      const system2026Qualified = race.analysis?.system2026TotalQualified || null;
      const slotChange = race.analysis ? (race.analysis.system2026TotalQualified - race.analysis.system2025TotalQualified) : null;

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
    
    const response = NextResponse.json({
      races: racesResponse,
      summary
    });
    
    // Cache for 5 minutes since race data doesn't change frequently
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    
    return response;
    
  } catch (error) {
    console.error('Error fetching races:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch races' 
    }, { status: 500 });
  }
}