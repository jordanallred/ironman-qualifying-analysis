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

async function fixProductionResults() {
  console.log('🔧 Fixing production database with correctly formatted race results...')
  
  try {
    // Clear existing results first
    await prisma.raceResult.deleteMany({})
    console.log('🗑️ Cleared existing results')
    
    // Get races that have analyses
    const racesWithAnalyses = await prisma.race.findMany({
      where: {
        analysis: {
          isNot: null
        }
      },
      include: {
        analysis: true
      }
    })
    
    console.log(`\n🎯 Found ${racesWithAnalyses.length} races with analyses`)
    
    const dataDir = path.join(__dirname, '../prefetched_data')
    let imported = 0
    let totalResults = 0
    
    for (const race of racesWithAnalyses) {
      try {
        console.log(`\n📥 Processing: ${race.name}`)
        
        // Find corresponding prefetched file
        const fileName = race.name
          .toLowerCase()
          .replace(/ironman\s*/i, 'ironman_')
          .replace(/70\.3\s*/i, '70.3_')
          .replace(/\s+/g, '_')
          .replace(/[^\w\-_.]/g, '')
          .replace(/__+/g, '_')
        
        const possibleFiles = [
          `${fileName}.json`,
          `${fileName.replace('ironman_', '')}.json`,
          `${fileName.replace('_-_', '_')}.json`,
          `${fileName.replace('_70.3_', '_70.3_')}.json`
        ]
        
        let prefetchedData = null
        let usedFile = null
        
        for (const possibleFile of possibleFiles) {
          const filePath = path.join(dataDir, possibleFile)
          if (fs.existsSync(filePath)) {
            prefetchedData = JSON.parse(fs.readFileSync(filePath, 'utf8'))
            usedFile = possibleFile
            break
          }
        }
        
        if (!prefetchedData || !prefetchedData.analysis?.detailed_results) {
          console.log(`   ⚠️  No detailed results found`)
          continue
        }
        
        console.log(`   📁 Using: ${usedFile}`)
        
        const results = prefetchedData.analysis.detailed_results.slice(0, 300) // Limit for performance
        let validResults = 0
        
        for (const result of results) {
          if (result.name && result.age_group && result.place && result.raw_time_seconds) {
            try {
              // Extract gender from age_group (first character)
              const gender = result.age_group.charAt(0) // 'M' or 'F'
              
              // Convert seconds to time string
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
              // Skip duplicate or invalid results
              console.log(`   ⚠️  Skipped result: ${error.message}`)
            }
          }
        }
        
        console.log(`   ✅ Imported ${validResults} results`)
        imported++
        totalResults += validResults
        
      } catch (error) {
        console.error(`   ❌ Error processing ${race.name}:`, error.message)
      }
    }
    
    // Final count
    const finalResultCount = await prisma.raceResult.count()
    
    console.log(`\n🎉 Production results fix complete!`)
    console.log(`✅ Processed races: ${imported}`)
    console.log(`📊 Total race results imported: ${totalResults}`)
    console.log(`📊 Final database count: ${finalResultCount}`)
    console.log(`🏁 Your site now has detailed athlete data with timing!`)
    
  } catch (error) {
    console.error('❌ Fix failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

fixProductionResults()