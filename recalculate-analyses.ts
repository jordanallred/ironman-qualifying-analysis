import { PrismaClient } from '@prisma/client';
import { IronmanAnalyzer } from './src/lib/ironman-analyzer';

const prisma = new PrismaClient();
const analyzer = new IronmanAnalyzer();

async function recalculateAnalyses() {
  console.log('🔄 Recalculating all race analyses with fixed 2026 system logic...');
  
  try {
    // Get all races with existing analyses
    const races = await prisma.race.findMany({
      where: {
        analysis: {
          isNot: null
        }
      },
      include: {
        analysis: true,
        results: {
          orderBy: { place: 'asc' }
        }
      }
    });
    
    console.log(`Found ${races.length} races to recalculate`);
    
    for (const race of races) {
      console.log(`\n📊 Recalculating: ${race.name}`);
      
      // Convert results to the format expected by analyzer
      const raceResults = race.results.map(result => ({
        place: result.place.toString(),
        name: result.athleteName,
        age_group: result.ageGroup,
        gender: result.ageGroup.charAt(0), // M or F
        time: `${Math.floor((result.timeSeconds || 0)/3600)}:${Math.floor(((result.timeSeconds || 0)%3600)/60).toString().padStart(2,'0')}:${((result.timeSeconds || 0)%60).toString().padStart(2,'0')}`,
        country: result.country || '',
        time_seconds: result.timeSeconds || 0
      }));
      
      // Run the analysis with fixed logic
      const analysis = await analyzer.analyzeRaceFromResults(
        raceResults,
        race.name,
        race.totalSlots,
        race.menSlots || 0,
        race.womenSlots || 0,
        race.totalSlots2026,
        race.menSlots2026,
        race.womenSlots2026
      );
      
      if (analysis) {
        // Update the database with corrected analysis
        await prisma.qualifyingAnalysis.update({
          where: { raceId: race.id },
          data: {
            totalParticipants: analysis.total_participants,
            menParticipants: analysis.men_participants,
            womenParticipants: analysis.women_participants,
            totalSlots: analysis.total_slots,
            system2025MenQualified: analysis.system_2025.men_qualified,
            system2025WomenQualified: analysis.system_2025.women_qualified,
            system2025TotalQualified: analysis.system_2025.total_qualified,
            system2026MenQualified: analysis.system_2026.men_qualified,
            system2026WomenQualified: analysis.system_2026.women_qualified,
            system2026TotalQualified: analysis.system_2026.total_qualified,
            menDifference: analysis.changes.men_difference,
            womenDifference: analysis.changes.women_difference,
            ageGroupAnalysis: analysis.age_group_analysis,
          }
        });
        
        console.log(`✅ ${race.name}: ${analysis.system_2025.total_qualified} → ${analysis.system_2026.total_qualified} (${analysis.system_2026.total_qualified - analysis.system_2025.total_qualified})`);
      } else {
        console.log(`❌ Failed to recalculate ${race.name}`);
      }
    }
    
    console.log('\n🎉 All analyses recalculated with fixed 2026 system logic!');
    
  } catch (error) {
    console.error('💥 Error during recalculation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

recalculateAnalyses();