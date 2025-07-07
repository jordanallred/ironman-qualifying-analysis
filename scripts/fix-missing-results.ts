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

async function fixMissingResults() {
  console.log('🔧 Fixing missing results for races with analyses but no detailed results...')
  
  const problemRaces = [
    'IRONMAN Japan South Hokkaido',
    'IRONMAN Italy Emilia-Romagna', 
    'IRONMAN Calella-Barcelona',
    'IRONMAN Portugal - Cascais',
    'IRONMAN Cozumel - Latin American Championship',
    'IRONMAN Western Australia - Asia-Pacific Championship'
  ]
  
  // Mapping of race names to file names
  const fileMapping = {
    'IRONMAN Japan South Hokkaido': 'ironman_japan.json',
    'IRONMAN Italy Emilia-Romagna': 'ironman_italy_emilia_romagna.json',
    'IRONMAN Calella-Barcelona': 'ironman_calella_barcelona.json', 
    'IRONMAN Portugal - Cascais': 'ironman_portugal___cascais.json',
    'IRONMAN Cozumel - Latin American Championship': 'ironman_cozumel___latin_american_championship.json',
    'IRONMAN Western Australia - Asia-Pacific Championship': 'ironman_western_australia.json'
  }
  
  try {
    const dataDir = path.join(__dirname, '../prefetched_data')
    
    for (const raceName of problemRaces) {
      console.log(`\n🔧 Fixing: ${raceName}`)
      
      const race = await prisma.race.findFirst({
        where: { name: raceName }
      })
      
      if (!race) {
        console.log(`   ❌ Race not found`)
        continue
      }
      
      const fileName = fileMapping[raceName]
      const filePath = path.join(dataDir, fileName)
      
      if (!fs.existsSync(filePath)) {
        console.log(`   ❌ File not found: ${fileName}`)
        continue
      }
      
      console.log(`   📁 Using file: ${fileName}`)
      
      const prefetchedData = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      
      if (!prefetchedData.analysis?.detailed_results) {
        console.log(`   ❌ No detailed results in file`)
        continue
      }
      
      // Delete existing results first
      await prisma.raceResult.deleteMany({
        where: { raceId: race.id }
      })
      
      const results = prefetchedData.analysis.detailed_results
      console.log(`   📊 Importing ${results.length} results...`)
      
      let imported = 0
      
      // Import in batches
      for (let i = 0; i < results.length; i += 100) {
        const batch = results.slice(i, i + 100)
        const createData = []
        
        for (const result of batch) {
          if (result.name && result.age_group && result.place && result.raw_time_seconds) {
            const gender = result.age_group.charAt(0)
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
          imported += createData.length
        }
      }
      
      console.log(`   ✅ Imported ${imported} results`)
    }
    
    console.log(`\n🎉 Results fix complete!`)
    
    // Final verification
    for (const raceName of problemRaces) {
      const race = await prisma.race.findFirst({
        where: { name: raceName },
        include: { _count: { select: { results: true } } }
      })
      
      if (race) {
        console.log(`   ${race.name}: ${race._count.results} results`)
      }
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixMissingResults()