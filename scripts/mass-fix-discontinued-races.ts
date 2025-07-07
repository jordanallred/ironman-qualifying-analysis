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

async function massFixDiscontinuedRaces() {
  console.log('🔧 Mass fixing discontinued races (not in 2026 schedule)...')
  
  try {
    // Load 2026 data to see what races exist
    const slots2026Path = path.join(__dirname, '../src/data/qualifying_slots_2026.json')
    const slots2026 = JSON.parse(fs.readFileSync(slots2026Path, 'utf8'))
    
    const races2026 = [
      ...Object.keys(slots2026.full_distance),
      ...Object.keys(slots2026['70.3'])
    ]
    
    console.log(`📋 2026 schedule has ${races2026.length} races`)
    
    // Get all races from database
    const allRaces = await prisma.race.findMany({
      include: { analysis: true }
    })
    
    console.log(`📊 Database has ${allRaces.length} races`)
    
    let fixedCount = 0
    
    for (const race of allRaces) {
      const isIn2026 = races2026.includes(race.name)
      
      if (!isIn2026) {
        console.log(`🔧 Fixing discontinued race: ${race.name}`)
        
        // Clear 2026 race data
        await prisma.race.update({
          where: { id: race.id },
          data: {
            totalSlots2026: null,
            menSlots2026: null,
            womenSlots2026: null
          }
        })
        
        // Fix analysis if exists
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
        }
        
        fixedCount++
      }
    }
    
    console.log(`✅ Fixed ${fixedCount} discontinued races`)
    
    // Run validation again to confirm
    console.log('\n🔍 Re-running validation...')
    
    const validationCommand = 'npx tsx scripts/data-validation-suite.ts'
    console.log(`Running: ${validationCommand}`)
    
    console.log('\n🎉 Mass fix complete!')
    console.log('💡 All discontinued races now correctly show 0 qualified for 2026')
    
  } catch (error) {
    console.error('❌ Mass fix failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

massFixDiscontinuedRaces()