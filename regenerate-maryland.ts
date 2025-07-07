import { PrismaClient } from '@prisma/client';
import { IronmanAnalyzer } from './src/lib/ironman-analyzer';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function regenerateMaryland() {
  try {
    console.log('🔄 Regenerating Maryland analysis with NEW analyzer logic...');
    
    // Get Maryland race
    const race = await prisma.race.findFirst({
      where: {
        name: {
          contains: 'Maryland'
        }
      }
    });
    
    if (!race) {
      console.log('Maryland race not found');
      return;
    }
    
    // Get race results from database
    const results = await prisma.raceResult.findMany({
      where: { raceId: race.id },
      orderBy: { place: 'asc' }
    });
    
    console.log(`Found ${results.length} race results for Maryland`);
    
    // Convert to analyzer format
    const raceResults = results.map(result => ({
      place: result.place.toString(),
      name: result.athleteName,
      age_group: result.ageGroup,
      gender: result.ageGroup.charAt(0),
      time: result.finishTime,
      country: result.country || '',
    }));
    
    // Use the NEW analyzer
    const analyzer = new IronmanAnalyzer();
    const freshAnalysis = await analyzer.analyzeQualifyingChanges(raceResults, race.name);
    
    if (!freshAnalysis) {
      console.log('❌ Failed to generate fresh analysis');
      return;
    }
    
    console.log('Generated fresh analysis:');
    console.log('  2025 total qualified:', freshAnalysis.system_2025.total_qualified);
    console.log('  2026 total qualified:', freshAnalysis.system_2026.total_qualified);
    console.log('  Difference:', freshAnalysis.system_2026.total_qualified - freshAnalysis.system_2025.total_qualified);
    
    // Delete old analysis
    await prisma.qualifyingAnalysis.deleteMany({
      where: { raceId: race.id }
    });
    
    // Insert new analysis
    await prisma.qualifyingAnalysis.create({
      data: {
        raceId: race.id,
        totalParticipants: freshAnalysis.total_participants,
        menParticipants: freshAnalysis.men_participants,
        womenParticipants: freshAnalysis.women_participants,
        totalSlots: freshAnalysis.total_slots,
        system2025MenQualified: freshAnalysis.system_2025.men_qualified,
        system2025WomenQualified: freshAnalysis.system_2025.women_qualified,
        system2025TotalQualified: freshAnalysis.system_2025.total_qualified,
        system2026MenQualified: freshAnalysis.system_2026.men_qualified,
        system2026WomenQualified: freshAnalysis.system_2026.women_qualified,
        system2026TotalQualified: freshAnalysis.system_2026.total_qualified,
        menDifference: freshAnalysis.changes.men_difference,
        womenDifference: freshAnalysis.changes.women_difference,
        ageGroupAnalysis: freshAnalysis.age_group_analysis,
      }
    });
    
    console.log('✅ Maryland analysis regenerated with NEW logic!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

regenerateMaryland();