#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const DATABASE_URL = "postgres://neondb_owner:npg_ec9oH3vXtwbu@ep-blue-morning-ad673b9s-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
})

async function populateProductionData() {
  console.log('🚀 Populating production database with detailed race results...')
  
  try {
    // First check what we have
    const raceCount = await prisma.race.count()
    const analysisCount = await prisma.qualifyingAnalysis.count() 
    const resultCount = await prisma.raceResult.count()
    
    console.log(`📊 Current state:`)
    console.log(`   Races: ${raceCount}`)
    console.log(`   Analyses: ${analysisCount}`)
    console.log(`   Results: ${resultCount}`)
    
    // Get races that have analyses but no detailed results
    const racesNeedingResults = await prisma.race.findMany({
      where: {
        analysis: {
          isNot: null
        },
        results: {
          none: {}
        }
      },
      include: {
        analysis: true
      }
    })
    
    console.log(`\n🎯 Found ${racesNeedingResults.length} races needing detailed results`)
    
    // Import detailed results for these races
    const dataDir = path.join(__dirname, '../prefetched_data')
    let imported = 0
    
    for (const race of racesNeedingResults) {
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
          `${fileName.replace('_-_', '_')}.json`
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
          console.log(`   ⚠️  No detailed results found for ${race.name}`)
          continue
        }
        
        console.log(`   📁 Using file: ${usedFile}`)
        
        const results = prefetchedData.analysis.detailed_results.slice(0, 500) // Limit for performance
        let validResults = 0
        
        for (const result of results) {
          if (result.name && result.age_group && result.gender && result.place) {
            try {
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
              validResults++
            } catch (error) {
              // Skip duplicate or invalid results
            }
          }
        }
        
        console.log(`   ✅ Imported ${validResults} results`)
        imported++
        
      } catch (error) {
        console.error(`   ❌ Error processing ${race.name}:`, error.message)
      }
    }
    
    // Final count
    const finalResultCount = await prisma.raceResult.count()
    
    console.log(`\n🎉 Production data population complete!`)
    console.log(`✅ Processed races: ${imported}`)
    console.log(`📊 Total race results: ${finalResultCount}`)
    console.log(`🏁 Your site now has detailed athlete data for race pages!`)
    
  } catch (error) {
    console.error('❌ Population failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

populateProductionData()