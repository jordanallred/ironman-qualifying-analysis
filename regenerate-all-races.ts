import { PrismaClient } from '@prisma/client';
import { IronmanAnalyzer } from './src/lib/ironman-analyzer';

const prisma = new PrismaClient();

async function regenerateAllRaces() {
  try {
    console.log('🔄 Regenerating ALL race analyses with correct slot allocation logic...');
    
    // Get all races that have results
    const races = await prisma.race.findMany({
      where: {
        results: {
          some: {}
        }
      },
      include: {
        results: {
          orderBy: { place: 'asc' }
        }
      }
    });
    
    console.log(`Found ${races.length} races with results to regenerate`);
    
    const analyzer = new IronmanAnalyzer();
    let successful = 0;
    let failed = 0;
    
    for (const race of races) {
      try {
        console.log(`\n📊 Processing: ${race.name}`);
        
        // Convert to analyzer format
        const raceResults = race.results.map(result => ({
          place: result.place.toString(),
          name: result.athleteName,
          age_group: result.ageGroup,
          gender: result.ageGroup.charAt(0),
          time: result.finishTime,
          country: result.country || '',
        }));
        
        // Generate fresh analysis
        const freshAnalysis = await analyzer.analyzeQualifyingChanges(raceResults, race.name);
        
        if (!freshAnalysis) {
          console.log(`❌ Failed to generate analysis for ${race.name}`);
          failed++;
          continue;
        }
        
        console.log(`   2025: ${freshAnalysis.system_2025.total_qualified} qualifiers`);
        console.log(`   2026: ${freshAnalysis.system_2026.total_qualified} qualifiers`);
        console.log(`   Diff: ${freshAnalysis.system_2026.total_qualified - freshAnalysis.system_2025.total_qualified}`);
        
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
            detailedResults: freshAnalysis.detailed_results || [],
          }
        });
        
        successful++;
        
      } catch (error) {
        console.error(`❌ Error processing ${race.name}:`, error instanceof Error ? error.message : String(error));
        failed++;
      }
    }
    
    console.log(`\n✅ Regeneration complete!`);
    console.log(`   ✅ Successful: ${successful} races`);
    console.log(`   ❌ Failed: ${failed} races`);
    
  } catch (error) {
    console.error('💥 Script failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

regenerateAllRaces();