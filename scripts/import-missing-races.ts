#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const DATABASE_URL = process.env.DATABASE_URL || ""

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
})

function secondsToTimeString(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

async function importMissingRaces() {
  console.log('🔍 Importing missing races with name mismatches...')
  
  try {
    const dataDir = path.join(__dirname, '../prefetched_data')
    
    // Manual mapping of races with data files but name mismatches
    const missingMappings = [
      { raceName: 'IRONMAN 70.3 Wisconsin', fileName: 'ironman_70.3_wisconsin.json' },
      { raceName: 'IRONMAN 70.3 Cozumel', fileName: 'ironman_70.3_cozumel.json' },
      { raceName: 'IRONMAN 70.3 Emilia-Romagna', fileName: 'ironman_70.3_emilia_romagna.json' },
      { raceName: 'IRONMAN Cozumel - Latin American Championship', fileName: 'ironman_cozumel___latin_american_championship.json' },
      { raceName: 'IRONMAN Italy Emilia-Romagna', fileName: 'ironman_italy_emilia_romagna.json' },
      // Check for more files
      { raceName: 'IRONMAN 70.3 New York', fileName: 'ironman_70.3_new_york.json' },
      { raceName: 'IRONMAN 70.3 Western Sydney', fileName: 'ironman_70.3_western_sydney.json' },
      { raceName: 'IRONMAN 70.3 São Paulo', fileName: 'ironman_70.3_são_paulo.json' },
    ]
    
    let imported = 0
    
    for (const mapping of missingMappings) {
      try {
        const filePath = path.join(dataDir, mapping.fileName)
        
        if (!fs.existsSync(filePath)) {
          console.log(`   ⚠️  File not found: ${mapping.fileName}`)
          continue
        }
        
        console.log(`\n📥 Processing: ${mapping.raceName}`)
        
        // Find the race in database
        const race = await prisma.race.findFirst({
          where: { name: mapping.raceName }
        })
        
        if (!race) {
          console.log(`   ❌ Race not found in database: ${mapping.raceName}`)
          continue
        }
        
        // Check if analysis already exists
        const existingAnalysis = await prisma.qualifyingAnalysis.findUnique({
          where: { raceId: race.id }
        })
        
        if (existingAnalysis) {
          console.log(`   ⚡ Analysis already exists`)
          continue
        }
        
        const prefetchedData = JSON.parse(fs.readFileSync(filePath, 'utf8'))
        
        if (!prefetchedData.analysis) {
          console.log(`   ⚠️  No analysis data in file`)
          continue
        }
        
        // Get the correct slot allocations from our database
        const slots2025 = race.totalSlots
        const slots2026 = race.totalSlots2026 || race.totalSlots
        
        const totalParticipants = prefetchedData.analysis.total_participants
        const menParticipants = prefetchedData.analysis.men_participants
        const womenParticipants = prefetchedData.analysis.women_participants
        
        // 2025 system: Use exact slot allocations
        const men2025 = Math.min(race.menSlots || 0, menParticipants)
        const women2025 = Math.min(race.womenSlots || 0, womenParticipants)
        const total2025 = men2025 + women2025
        
        // 2026 system: Distribute based on participation ratio
        const menRatio = menParticipants / totalParticipants
        const men2026 = Math.round(slots2026 * menRatio)
        const women2026 = slots2026 - men2026
        const total2026 = slots2026
        
        console.log(`   📊 2025: ${total2025} (${men2025}M/${women2025}W)`)
        console.log(`   📊 2026: ${total2026} (${men2026}M/${women2026}W)`)
        console.log(`   📈 Change: ${total2026 - total2025}`)
        
        // Create analysis
        await prisma.qualifyingAnalysis.create({
          data: {
            raceId: race.id,
            totalParticipants,
            menParticipants,
            womenParticipants,
            totalSlots: slots2025,
            system2025MenQualified: men2025,
            system2025WomenQualified: women2025,
            system2025TotalQualified: total2025,
            system2026MenQualified: men2026,
            system2026WomenQualified: women2026,
            system2026TotalQualified: total2026,
            menDifference: men2026 - men2025,
            womenDifference: women2026 - women2025,
            ageGroupAnalysis: prefetchedData.analysis.age_group_analysis || {},
            detailedResults: null
          }
        })
        
        // Import race results if available
        if (prefetchedData.analysis.detailed_results) {
          const results = prefetchedData.analysis.detailed_results.slice(0, 1000)
          let validResults = 0
          
          for (const result of results) {
            if (result.name && result.age_group && result.place && result.raw_time_seconds) {
              try {
                const gender = result.age_group.charAt(0)
                const finishTime = secondsToTimeString(result.raw_time_seconds)
                
                await prisma.raceResult.create({
                  data: {
                    raceId: race.id,
                    athleteName: result.name,
                    ageGroup: result.age_group,
                    gender: gender,
                    finishTime: finishTime,
                    place: result.place,
                    country: result.country || null,
                    timeSeconds: result.raw_time_seconds,
                    ageGradedTime: result.age_graded_time_seconds || null
                  }
                })
                validResults++
              } catch (error) {
                // Skip duplicates
              }
            }
          }
          
          console.log(`   ✅ Imported analysis + ${validResults} results`)
        } else {
          console.log(`   ✅ Imported analysis (no detailed results)`)
        }
        
        imported++
        
      } catch (error) {
        console.error(`   ❌ Error processing ${mapping.raceName}:`, error.message)
      }
    }
    
    const finalAnalysisCount = await prisma.qualifyingAnalysis.count()
    const finalResultCount = await prisma.raceResult.count()
    
    console.log(`\n🎉 Missing races import complete!`)
    console.log(`✅ Imported: ${imported} new analyses`)
    console.log(`📊 Total analyses: ${finalAnalysisCount}`)
    console.log(`📊 Total results: ${finalResultCount}`)
    
  } catch (error) {
    console.error('❌ Import failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

importMissingRaces()