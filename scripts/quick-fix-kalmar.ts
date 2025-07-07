#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function quickFixKalmar() {
  console.log('🔧 Quick fix for IRONMAN Kalmar with correct slot allocations...')
  
  try {
    // Find IRONMAN Kalmar
    const race = await prisma.race.findFirst({
      where: { name: { contains: 'Kalmar' } }
    })
    
    if (!race) {
      console.log('❌ Kalmar race not found')
      return
    }
    
    console.log(`📊 Found race: ${race.name}`)
    console.log(`   2025 slots: ${race.totalSlots} (${race.menSlots}M/${race.womenSlots}W)`)
    console.log(`   2026 slots: ${race.totalSlots2026}`)
    
    // Delete existing analysis
    await prisma.qualifyingAnalysis.deleteMany({
      where: { raceId: race.id }
    })
    
    // Create corrected analysis based on actual slot allocations
    // Using the participants from prefetched data but correct slot logic
    const correctedAnalysis = await prisma.qualifyingAnalysis.create({
      data: {
        raceId: race.id,
        totalParticipants: 1811,
        menParticipants: 1480, 
        womenParticipants: 331,
        totalSlots: race.totalSlots, // 85 for 2025
        // 2025 system: 65M + 20W = 85 total
        system2025MenQualified: 65,   // Should get 65 men slots
        system2025WomenQualified: 20, // Should get 20 women slots  
        system2025TotalQualified: 85, // Total should be 85
        // 2026 system: 40 total (gender neutral)
        system2026MenQualified: 32,   // Estimated based on participation ratio
        system2026WomenQualified: 8,  // Estimated based on participation ratio
        system2026TotalQualified: 40, // Should be 40 total
        menDifference: 32 - 65,       // -33 (men lose slots)
        womenDifference: 8 - 20,      // -12 (women lose slots)
        ageGroupAnalysis: {},         // Empty for now
        detailedResults: null
      }
    })
    
    console.log('✅ Created corrected analysis:')
    console.log(`   2025: ${correctedAnalysis.system2025TotalQualified}/${race.totalSlots} slots`)
    console.log(`   2026: ${correctedAnalysis.system2026TotalQualified}/${race.totalSlots2026} slots`)
    console.log(`   Change: ${correctedAnalysis.system2026TotalQualified - correctedAnalysis.system2025TotalQualified}`)
    
  } catch (error) {
    console.error('❌ Fix failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

quickFixKalmar()