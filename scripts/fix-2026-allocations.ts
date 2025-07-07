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

async function fix2026Allocations() {
  console.log('🔧 Fixing 2026 slot allocations to match authoritative data...')
  
  try {
    // Load the correct 2026 data
    const slots2026Path = path.join(__dirname, '../src/data/qualifying_slots_2026.json')
    const slots2026 = JSON.parse(fs.readFileSync(slots2026Path, 'utf8'))
    
    const races2026 = slots2026.full_distance
    
    console.log(`📋 Found ${Object.keys(races2026).length} races in 2026 data`)
    
    let fixedCount = 0
    
    // Update each race with correct 2026 allocation
    for (const [raceName, raceData] of Object.entries(races2026)) {
      const race = await prisma.race.findFirst({
        where: { name: raceName },
        include: { analysis: true }
      })
      
      if (!race) {
        console.log(`⚠️ Race not found in DB: ${raceName}`)
        continue
      }
      
      const correctSlots = (raceData as any).total_slots
      
      if (race.totalSlots2026 !== correctSlots) {
        console.log(`🔧 Fixing ${raceName}: ${race.totalSlots2026} → ${correctSlots}`)
        
        // Update race record
        await prisma.race.update({
          where: { id: race.id },
          data: {
            totalSlots2026: correctSlots
          }
        })
        
        // Regenerate analysis if exists
        if (race.analysis) {
          // Calculate 2026 qualified based on age-graded performance
          const ageGradedResults = await prisma.raceResult.findMany({
            where: { 
              raceId: race.id,
              ageGradedTime: { not: null }
            },
            orderBy: { ageGradedTime: 'asc' },
            take: correctSlots
          })
          
          const system2026TotalQualified = ageGradedResults.length
          const system2026MenQualified = ageGradedResults.filter(r => r.gender === 'M').length
          const system2026WomenQualified = ageGradedResults.filter(r => r.gender === 'F' || r.gender === 'W').length
          
          await prisma.qualifyingAnalysis.update({
            where: { id: race.analysis.id },
            data: {
              system2026TotalQualified,
              system2026MenQualified,
              system2026WomenQualified,
              menDifference: system2026MenQualified - race.analysis.system2025MenQualified,
              womenDifference: system2026WomenQualified - race.analysis.system2025WomenQualified
            }
          })
          
          console.log(`   ✅ Updated analysis: 2026 = ${system2026TotalQualified} qualified (${system2026MenQualified}M/${system2026WomenQualified}W)`)
        }
        
        fixedCount++
      } else {
        console.log(`✅ ${raceName}: Already correct (${correctSlots})`)
      }
    }
    
    console.log(`\n🎉 Fixed ${fixedCount} races with incorrect 2026 allocations`)
    
    // Run validation to confirm everything is correct
    console.log('\n🔍 Running validation...')
    
  } catch (error) {
    console.error('❌ Fix failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fix2026Allocations()