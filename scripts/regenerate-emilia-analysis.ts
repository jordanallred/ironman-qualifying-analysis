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

async function regenerateEmiliaAnalysis() {
  console.log('🔄 Regenerating IRONMAN Italy Emilia-Romagna analysis...')
  
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
    console.log(`📊 Slots: ${race.menSlots}M/${race.womenSlots}W = ${race.totalSlots} total`)
    console.log(`📊 Results: ${race.results.length} total`)
    
    if (race.results.length === 0) {
      console.log('❌ No results data - cannot generate analysis')
      return
    }
    
    // Delete existing analysis if it exists
    if (race.analysis) {
      await prisma.qualifyingAnalysis.delete({
        where: { id: race.analysis.id }
      })
      console.log('🗑️ Deleted old analysis')
    }
    
    // Calculate new analysis
    const totalParticipants = race.results.length
    const menResults = race.results.filter(r => r.gender === 'M')
    const womenResults = race.results.filter(r => r.gender === 'F' || r.gender === 'W')
    const menParticipants = menResults.length
    const womenParticipants = womenResults.length
    
    console.log(`📊 Participants: ${totalParticipants} (${menParticipants}M/${womenParticipants}W)`)
    
    // 2025 system: gender-specific slots
    const system2025MenQualified = Math.min(race.menSlots || 0, menParticipants)
    const system2025WomenQualified = Math.min(race.womenSlots || 0, womenParticipants)
    const system2025TotalQualified = system2025MenQualified + system2025WomenQualified
    
    // Get cutoff times for 2025 system
    const menSorted = menResults.sort((a, b) => (a.timeSeconds || 0) - (b.timeSeconds || 0))
    const womenSorted = womenResults.sort((a, b) => (a.timeSeconds || 0) - (b.timeSeconds || 0))
    
    const system2025Cutoff = system2025MenQualified > 0 ? menSorted[system2025MenQualified - 1]?.timeSeconds : null
    const system2025WomenCutoff = system2025WomenQualified > 0 ? womenSorted[system2025WomenQualified - 1]?.timeSeconds : null
    
    // 2026 system: age-graded, gender-neutral
    const ageGradedResults = race.results
      .filter(r => r.ageGradedTime !== null && r.ageGradedTime !== undefined)
      .sort((a, b) => (a.ageGradedTime || 0) - (b.ageGradedTime || 0))
    
    const system2026TotalQualified = Math.min(race.totalSlots || 0, ageGradedResults.length)
    const qualified2026 = ageGradedResults.slice(0, system2026TotalQualified)
    
    const system2026MenQualified = qualified2026.filter(r => r.gender === 'M').length
    const system2026WomenQualified = qualified2026.filter(r => r.gender === 'F' || r.gender === 'W').length
    const system2026Cutoff = system2026TotalQualified > 0 ? qualified2026[system2026TotalQualified - 1]?.ageGradedTime : null
    
    // Create new analysis
    const newAnalysis = await prisma.qualifyingAnalysis.create({
      data: {
        raceId: race.id,
        totalParticipants,
        menParticipants,
        womenParticipants,
        totalSlots: race.totalSlots,
        system2025TotalQualified,
        system2025MenQualified,
        system2025WomenQualified,
        system2026TotalQualified,
        system2026MenQualified,
        system2026WomenQualified,
        menDifference: system2026MenQualified - system2025MenQualified,
        womenDifference: system2026WomenQualified - system2025WomenQualified,
        ageGroupAnalysis: {},
        detailedResults: null
      }
    })
    
    console.log('✅ Created new analysis')
    console.log(`📈 2025: ${system2025TotalQualified} qualified (${system2025MenQualified}M/${system2025WomenQualified}W)`)
    console.log(`📈 2026: ${system2026TotalQualified} qualified (${system2026MenQualified}M/${system2026WomenQualified}W)`)
    console.log(`📈 Difference: ${system2026TotalQualified - system2025TotalQualified}`)
    
    console.log('🎉 Analysis regenerated successfully!')
    
  } catch (error) {
    console.error('❌ Regeneration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

regenerateEmiliaAnalysis()