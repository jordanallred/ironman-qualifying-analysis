#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const DATABASE_URL = process.env.DATABASE_URL || ""

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
})

async function debugMissingRaces() {
  console.log('🔍 Debugging specific races showing "no data available"...')
  
  const problemRaces = [
    'IRONMAN Japan South Hokkaido',
    'IRONMAN Italy Emilia-Romagna', 
    'IRONMAN Calella-Barcelona',
    'IRONMAN Portugal - Cascais',
    'IRONMAN Cozumel - Latin American Championship',
    'IRONMAN Western Australia - Asia-Pacific Championship'
  ]
  
  try {
    for (const raceName of problemRaces) {
      console.log(`\n🔍 Checking: ${raceName}`)
      
      const race = await prisma.race.findFirst({
        where: { name: raceName },
        include: {
          analysis: true,
          _count: { select: { results: true } }
        }
      })
      
      if (!race) {
        console.log(`   ❌ Race not found in database`)
        continue
      }
      
      console.log(`   📊 Race found: ${race.name}`)
      console.log(`   📊 Analysis: ${race.analysis ? 'YES' : 'NO'}`)
      console.log(`   📊 Results count: ${race._count.results}`)
      
      if (race.analysis) {
        console.log(`   📈 2025: ${race.analysis.system2025TotalQualified}`)
        console.log(`   📈 2026: ${race.analysis.system2026TotalQualified}`)
      }
    }
    
    // Also check what analyses we actually have
    const allAnalyses = await prisma.qualifyingAnalysis.findMany({
      include: { race: { select: { name: true } } }
    })
    
    console.log(`\n📊 Total analyses in database: ${allAnalyses.length}`)
    console.log(`\nRaces WITH analyses:`)
    for (const analysis of allAnalyses) {
      console.log(`   ✅ ${analysis.race.name}`)
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugMissingRaces()