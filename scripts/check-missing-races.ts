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

async function checkMissingRaces() {
  console.log('🔍 Checking which races are missing analysis data...')
  
  try {
    // Get all races without analyses
    const racesWithoutAnalyses = await prisma.race.findMany({
      where: {
        analysis: null
      },
      orderBy: { name: 'asc' }
    })
    
    console.log(`\n❌ Races WITHOUT analyses (${racesWithoutAnalyses.length}):`)
    for (const race of racesWithoutAnalyses) {
      console.log(`   ${race.name} (${race.distance})`)
    }
    
    // Check what prefetched files we have
    const dataDir = path.join(__dirname, '../prefetched_data')
    const files = fs.readdirSync(dataDir).filter(file => 
      file.endsWith('.json') && file !== 'all_races.json'
    )
    
    console.log(`\n📁 Available prefetched files (${files.length}):`)
    
    // Check which races we have files for but no analysis
    const missingAnalyses = []
    
    for (const race of racesWithoutAnalyses) {
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
      
      let hasFile = false
      for (const possibleFile of possibleFiles) {
        const filePath = path.join(dataDir, possibleFile)
        if (fs.existsSync(filePath)) {
          console.log(`   ✅ ${race.name} -> ${possibleFile}`)
          hasFile = true
          missingAnalyses.push({ race, file: possibleFile })
          break
        }
      }
      
      if (!hasFile) {
        console.log(`   ❌ ${race.name} -> NO FILE FOUND`)
      }
    }
    
    console.log(`\n📊 Summary:`)
    console.log(`   Total races: ${await prisma.race.count()}`)
    console.log(`   Races with analyses: ${await prisma.qualifyingAnalysis.count()}`)
    console.log(`   Races missing analyses: ${racesWithoutAnalyses.length}`)
    console.log(`   Races with files but no analysis: ${missingAnalyses.length}`)
    
    if (missingAnalyses.length > 0) {
      console.log(`\n🎯 Can import ${missingAnalyses.length} more races!`)
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkMissingRaces()