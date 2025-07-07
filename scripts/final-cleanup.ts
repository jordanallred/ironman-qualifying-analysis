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

async function finalCleanup() {
  console.log('🧹 Final cleanup: Fixing Italy Emilia-Romagna 2026 data...')
  
  try {
    // Fix Italy Emilia-Romagna - it should NOT have 2026 slots since it's not in 2026 schedule
    const race = await prisma.race.findFirst({
      where: { name: { contains: 'Italy Emilia' } },
      include: { analysis: true }
    })
    
    if (race) {
      console.log(`📊 Found: ${race.name}`)
      console.log(`📊 Current 2026 slots: ${race.totalSlots2026}`)
      
      // Clear 2026 data since race doesn't exist in 2026
      await prisma.race.update({
        where: { id: race.id },
        data: {
          totalSlots2026: null,
          menSlots2026: null,
          womenSlots2026: null
        }
      })
      
      console.log('✅ Cleared 2026 data (race not in 2026 schedule)')
      
      // Update analysis to reflect that 2026 has 0 slots
      if (race.analysis) {
        await prisma.qualifyingAnalysis.update({
          where: { id: race.analysis.id },
          data: {
            system2026TotalQualified: 0,
            system2026MenQualified: 0,
            system2026WomenQualified: 0,
            menDifference: 0 - race.analysis.system2025MenQualified,
            womenDifference: 0 - race.analysis.system2025WomenQualified
          }
        })
        
        console.log('✅ Updated analysis: 2026 = 0 qualified (race discontinued)')
        console.log(`📈 2025: ${race.analysis.system2025TotalQualified} qualified`)
        console.log(`📈 2026: 0 qualified (race discontinued)`)
        console.log(`📈 Difference: ${0 - race.analysis.system2025TotalQualified}`)
      }
    }
    
    console.log('\n🎉 Final cleanup complete!')
    
  } catch (error) {
    console.error('❌ Final cleanup failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

finalCleanup()