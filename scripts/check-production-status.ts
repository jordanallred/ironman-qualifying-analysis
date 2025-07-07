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

async function checkProductionStatus() {
  console.log('📊 Checking production database status...')
  
  try {
    const raceCount = await prisma.race.count()
    const analysisCount = await prisma.qualifyingAnalysis.count()
    const resultCount = await prisma.raceResult.count()
    
    console.log(`\n📈 Current state:`)
    console.log(`   🏁 Races: ${raceCount}`)
    console.log(`   📊 Analyses: ${analysisCount}`)
    console.log(`   👥 Results: ${resultCount}`)
    
    // Get sample of races with results
    const racesWithResults = await prisma.race.findMany({
      where: {
        results: {
          some: {}
        }
      },
      include: {
        _count: {
          select: { results: true }
        }
      },
      take: 10
    })
    
    console.log(`\n🎯 Sample races with results:`)
    for (const race of racesWithResults) {
      console.log(`   ${race.name}: ${race._count.results} results`)
    }
    
    // Check a specific race detail
    const kalmar = await prisma.race.findFirst({
      where: { name: { contains: 'Kalmar' } },
      include: {
        results: { take: 3, orderBy: { place: 'asc' } },
        analysis: true
      }
    })
    
    if (kalmar) {
      console.log(`\n🔍 IRONMAN Kalmar sample:`)
      console.log(`   Analysis: ${kalmar.analysis?.system2025TotalQualified} → ${kalmar.analysis?.system2026TotalQualified}`)
      kalmar.results.forEach(result => {
        console.log(`   ${result.place}. ${result.athleteName} (${result.ageGroup}) - ${result.finishTime}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkProductionStatus()