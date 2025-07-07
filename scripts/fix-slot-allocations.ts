#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'
import { IronmanAnalyzer } from '../src/lib/ironman-analyzer'

const prisma = new PrismaClient()

async function fixSlotAllocations() {
  console.log('🔧 Fixing slot allocations and regenerating analyses...')
  
  try {
    // Delete all existing analyses (they have wrong slot data)
    console.log('🗑️ Deleting existing analyses with incorrect slot data...')
    await prisma.qualifyingAnalysis.deleteMany({})
    await prisma.raceResult.deleteMany({})
    console.log('✅ Cleared existing data')
    
    // Get all races with analysis data from prefetched files
    const raceAnalyses = [
      'ironman_kalmar.json',
      'ironman_copenhagen.json', 
      'ironman_tallinn.json',
      'ironman_wisconsin.json',
      'ironman_arizona.json',
      'ironman_california.json',
      'ironman_florida.json',
      'ironman_maryland.json',
      'ironman_wales.json',
      'ironman_chattanooga.json',
      'ironman_70.3_jönköping.json',
      'ironman_70.3_muskoka.json',
      'ironman_70.3_muncie.json',
      'ironman_70.3_ohio.json',
      'ironman_70.3_oregon.json',
      'ironman_70.3_calgary.json'
    ]
    
    const analyzer = new IronmanAnalyzer()
    let processed = 0
    
    for (const filename of raceAnalyses) {
      try {
        console.log(`\n📊 Processing ${filename}...`)
        
        // Load the prefetched data to get race results
        const prefetchedData = require(`../prefetched_data/${filename}`)
        
        if (!prefetchedData.analysis || !prefetchedData.analysis.detailed_results) {
          console.log(`⚠️ No detailed results in ${filename}`)
          continue
        }
        
        const raceName = prefetchedData.analysis.race_name
        
        // Find the race in database
        const race = await prisma.race.findFirst({
          where: {
            OR: [
              { name: raceName },
              { name: { contains: raceName.replace('IRONMAN ', '') } }
            ]
          }
        })
        
        if (!race) {
          console.log(`⚠️ Race not found: ${raceName}`)
          continue
        }
        
        // Import race results
        const results = prefetchedData.analysis.detailed_results.slice(0, 500)
        for (const result of results) {
          if (result.name && result.age_group && result.gender && result.place) {
            await prisma.raceResult.create({
              data: {
                raceId: race.id,
                athleteName: result.name,
                ageGroup: result.age_group,
                gender: result.gender,
                finishTime: result.finish_time || '',
                place: result.place,
                country: result.country || null,
                timeSeconds: result.time_seconds || null,
                ageGradedTime: result.age_graded_time || null
              }
            })
          }
        }
        
        // Convert to analyzer format
        const raceResults = results
          .filter(r => r.name && r.age_group && r.gender && r.place)
          .map(result => ({
            place: result.place.toString(),
            name: result.name,
            age_group: result.age_group,
            gender: result.gender,
            time: result.finish_time || '',
            country: result.country || ''
          }))
        
        // Generate fresh analysis with correct slot data
        console.log(`🔄 Regenerating analysis for ${raceName} with correct slots...`)
        const freshAnalysis = await analyzer.analyzeQualifyingChanges(raceResults, race.name)
        
        if (freshAnalysis) {
          console.log(`✅ Successfully regenerated ${raceName}`)
          console.log(`   📊 2025: ${freshAnalysis.system_2025.total_qualified}/${race.totalSlots} slots`)
          console.log(`   📊 2026: ${freshAnalysis.system_2026.total_qualified}/${race.totalSlots2026} slots`)
          processed++
        } else {
          console.log(`❌ Failed to regenerate ${raceName}`)
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${filename}:`, error.message)
      }
    }
    
    const finalCount = await prisma.qualifyingAnalysis.count()
    console.log(`\n🎉 Fix complete!`)
    console.log(`✅ Processed: ${processed}`)
    console.log(`📊 Total analyses: ${finalCount}`)
    
  } catch (error) {
    console.error('❌ Fix failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

fixSlotAllocations()