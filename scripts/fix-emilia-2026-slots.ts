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

async function fixEmilia2026Slots() {
  console.log('🔧 Fixing IRONMAN Italy Emilia-Romagna 2026 allocation to 40 slots...')
  
  try {
    // Find the race
    const race = await prisma.race.findFirst({
      where: { name: { contains: 'Italy Emilia' } },
      include: { analysis: true, results: true }
    })
    
    if (!race) {
      console.log('❌ Race not found')
      return
    }
    
    console.log(`📊 Found race: ${race.name}`)
    console.log(`📊 2025 slots: ${race.menSlots}M/${race.womenSlots}W = ${race.totalSlots} total`)
    console.log(`📊 2026 slots: Should be 40 total (age-graded)`)
    
    // Update race with 2026 slot data
    await prisma.race.update({
      where: { id: race.id },
      data: {
        totalSlots2026: 40
      }
    })
    
    console.log('✅ Updated race with 2026 slots: 40 total')
    
    // Regenerate analysis with correct 2026 allocation
    if (race.analysis && race.results.length > 0) {
      console.log('🔄 Regenerating analysis with correct 2026 slots...')
      
      const totalParticipants = race.results.length
      const menResults = race.results.filter(r => r.gender === 'M')
      const womenResults = race.results.filter(r => r.gender === 'F' || r.gender === 'W')
      const menParticipants = menResults.length
      const womenParticipants = womenResults.length
      
      // 2025 system: 105 slots (65M/40W) - gender-specific
      const system2025MenQualified = Math.min(race.menSlots || 0, menParticipants)
      const system2025WomenQualified = Math.min(race.womenSlots || 0, womenParticipants)
      const system2025TotalQualified = system2025MenQualified + system2025WomenQualified
      
      // 2026 system: 40 slots total - age-graded, gender-neutral
      const ageGradedResults = race.results
        .filter(r => r.ageGradedTime !== null && r.ageGradedTime !== undefined)
        .sort((a, b) => (a.ageGradedTime || 0) - (b.ageGradedTime || 0))
      
      const system2026TotalQualified = Math.min(40, ageGradedResults.length)
      const qualified2026 = ageGradedResults.slice(0, system2026TotalQualified)
      
      const system2026MenQualified = qualified2026.filter(r => r.gender === 'M').length
      const system2026WomenQualified = qualified2026.filter(r => r.gender === 'F' || r.gender === 'W').length
      
      // Update the existing analysis
      await prisma.qualifyingAnalysis.update({
        where: { id: race.analysis.id },
        data: {
          system2026TotalQualified,
          system2026MenQualified,
          system2026WomenQualified,
          menDifference: system2026MenQualified - system2025MenQualified,
          womenDifference: system2026WomenQualified - system2025WomenQualified
        }
      })
      
      console.log('✅ Updated analysis')
      console.log(`📈 2025: ${system2025TotalQualified} qualified (${system2025MenQualified}M/${system2025WomenQualified}W) from 105 slots`)
      console.log(`📈 2026: ${system2026TotalQualified} qualified (${system2026MenQualified}M/${system2026WomenQualified}W) from 40 slots`)
      console.log(`📈 Difference: ${system2026TotalQualified - system2025TotalQualified} total`)
    }
    
    console.log('🎉 IRONMAN Italy Emilia-Romagna 2026 slots fixed!')
    
  } catch (error) {
    console.error('❌ Fix failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixEmilia2026Slots()