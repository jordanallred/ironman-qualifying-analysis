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

function secondsToTimeString(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

async function importFullResults() {
  console.log('🚀 Importing FULL result datasets for all races...')
  
  try {
    // Clear existing results first
    await prisma.raceResult.deleteMany({})
    console.log('🗑️ Cleared existing limited results')
    
    // Get races that have analyses
    const racesWithAnalyses = await prisma.race.findMany({
      where: {
        analysis: {
          isNot: null
        }
      }
    })
    
    console.log(`\n🎯 Found ${racesWithAnalyses.length} races to process`)
    
    const dataDir = path.join(__dirname, '../prefetched_data')
    let totalImported = 0
    let racesProcessed = 0
    
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
          console.log(`   ⚠️  No detailed results found`)
          continue
        }
        
        const allResults = prefetchedData.analysis.detailed_results
        console.log(`   📊 Found ${allResults.length} participants (importing ALL)`)
        
        let validResults = 0
        let batchSize = 100
        
        // Process in batches for better performance
        for (let i = 0; i < allResults.length; i += batchSize) {
          const batch = allResults.slice(i, i + batchSize)
          const createData = []
          
          for (const result of batch) {
            if (result.name && result.age_group && result.place && result.raw_time_seconds) {
              const gender = result.age_group.charAt(0) // 'M' or 'F'
              const finishTime = secondsToTimeString(result.raw_time_seconds)
              
              createData.push({
                raceId: race.id,
                athleteName: result.name,
                ageGroup: result.age_group,
                gender: gender,
                finishTime: finishTime,
                place: result.place,
                country: result.country || null,
                timeSeconds: result.raw_time_seconds,
                ageGradedTime: result.age_graded_time_seconds || null
              })
            }
          }
          
          if (createData.length > 0) {
            await prisma.raceResult.createMany({
              data: createData,
              skipDuplicates: true
            })
            validResults += createData.length
          }
          
          // Progress indicator
          if (i % (batchSize * 5) === 0) {
            console.log(`   📈 Progress: ${i}/${allResults.length}`)
          }
        }
        
        console.log(`   ✅ Imported ${validResults} complete results`)
        totalImported += validResults
        racesProcessed++
        
      } catch (error) {
        console.error(`   ❌ Error processing ${race.name}:`, error.message)
      }
    }
    
    // Final count
    const finalResultCount = await prisma.raceResult.count()
    
    console.log(`\n🎉 FULL results import complete!`)
    console.log(`✅ Processed races: ${racesProcessed}`)
    console.log(`📊 Total results imported: ${totalImported}`)
    console.log(`📊 Final database count: ${finalResultCount}`)
    console.log(`🏁 Your site now has COMPLETE race datasets!`)
    
  } catch (error) {
    console.error('❌ Import failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

importFullResults()