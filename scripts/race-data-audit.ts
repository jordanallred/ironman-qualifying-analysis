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

async function auditRaceData() {
  console.log('🔍 Auditing race data availability...')
  
  try {
    // Get all races by distance
    const fullDistanceRaces = await prisma.race.findMany({
      where: { distance: 'full' },
      include: { analysis: true },
      orderBy: { name: 'asc' }
    })
    
    const halfDistanceRaces = await prisma.race.findMany({
      where: { distance: '70.3' },
      include: { analysis: true },
      orderBy: { name: 'asc' }
    })
    
    console.log(`\n📊 Full Distance Races (${fullDistanceRaces.length} total):`)
    let fullWithData = 0
    for (const race of fullDistanceRaces) {
      const hasAnalysis = race.analysis ? '✅' : '❌'
      if (race.analysis) fullWithData++
      console.log(`   ${hasAnalysis} ${race.name}`)
    }
    
    console.log(`\n📊 70.3 Races (${halfDistanceRaces.length} total):`)
    let halfWithData = 0
    for (const race of halfDistanceRaces) {
      const hasAnalysis = race.analysis ? '✅' : '❌'
      if (race.analysis) halfWithData++
      console.log(`   ${hasAnalysis} ${race.name}`)
    }
    
    // Check available prefetched files
    const dataDir = path.join(__dirname, '../prefetched_data')
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json') && f !== 'all_races.json')
    
    const fullDistanceFiles = files.filter(f => !f.includes('70.3'))
    const halfDistanceFiles = files.filter(f => f.includes('70.3'))
    
    console.log(`\n📁 Available Data Files:`)
    console.log(`   Full Distance: ${fullDistanceFiles.length} files`)
    console.log(`   70.3 Distance: ${halfDistanceFiles.length} files`)
    console.log(`   Total: ${files.length} files`)
    
    console.log(`\n📈 Coverage:`)
    console.log(`   Full Distance: ${fullWithData}/${fullDistanceRaces.length} races (${Math.round(fullWithData/fullDistanceRaces.length*100)}%)`)
    console.log(`   70.3 Distance: ${halfWithData}/${halfDistanceRaces.length} races (${Math.round(halfWithData/halfDistanceRaces.length*100)}%)`)
    console.log(`   Overall: ${fullWithData + halfWithData}/${fullDistanceRaces.length + halfDistanceRaces.length} races (${Math.round((fullWithData + halfWithData)/(fullDistanceRaces.length + halfDistanceRaces.length)*100)}%)`)
    
    console.log(`\n🎯 Missing data is likely because:`)
    console.log(`   • Some 2025 races haven't happened yet`)
    console.log(`   • Some races weren't scraped in original data collection`)
    console.log(`   • Some race results aren't publicly available`)
    console.log(`   • New races added to 2025 calendar after scraping`)
    
  } catch (error) {
    console.error('❌ Audit failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

auditRaceData()