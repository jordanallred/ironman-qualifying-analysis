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

async function debugSpecificRace() {
  console.log('🔍 Debugging IRONMAN Italy Emilia-Romagna after 2026 fix...')
  
  try {
    const race = await prisma.race.findFirst({
      where: { name: { contains: 'Italy Emilia' } },
      include: { 
        analysis: true,
        _count: { select: { results: true } }
      }
    })
    
    if (!race) {
      console.log('❌ Race not found')
      return
    }
    
    console.log(`📊 Race: ${race.name}`)
    console.log(`📊 2025 slots: ${race.totalSlots} (${race.menSlots}M/${race.womenSlots}W)`)
    console.log(`📊 2026 slots: ${race.totalSlots2026}`)
    console.log(`📊 Results count: ${race._count.results}`)
    
    if (race.analysis) {
      console.log(`📈 2025 qualified: ${race.analysis.system2025TotalQualified} (${race.analysis.system2025MenQualified}M/${race.analysis.system2025WomenQualified}W)`)
      console.log(`📈 2026 qualified: ${race.analysis.system2026TotalQualified} (${race.analysis.system2026MenQualified}M/${race.analysis.system2026WomenQualified}W)`)
    }
    
    // Check if results have age-graded times
    const ageGradedCount = await prisma.raceResult.count({
      where: {
        raceId: race.id,
        ageGradedTime: { not: null }
      }
    })
    
    console.log(`📊 Results with age-graded times: ${ageGradedCount}`)
    
    if (ageGradedCount > 0 && race.totalSlots2026 && race.totalSlots2026 > 0) {
      console.log(`\n🔧 Should have ${Math.min(race.totalSlots2026, ageGradedCount)} qualified for 2026`)
      
      // Get top performers
      const topPerformers = await prisma.raceResult.findMany({
        where: {
          raceId: race.id,
          ageGradedTime: { not: null }
        },
        orderBy: { ageGradedTime: 'asc' },
        take: race.totalSlots2026,
        select: {
          athleteName: true,
          gender: true,
          ageGradedTime: true
        }
      })
      
      console.log(`\n🏆 Top ${topPerformers.length} 2026 qualifiers:`)
      const menCount = topPerformers.filter(r => r.gender === 'M').length
      const womenCount = topPerformers.filter(r => r.gender === 'F' || r.gender === 'W').length
      console.log(`   Total: ${topPerformers.length} (${menCount}M/${womenCount}W)`)
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugSpecificRace()