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

async function cleanupAndValidate() {
  console.log('🧹 Cleaning up and validating all race data...')
  
  try {
    // 1. Load the authoritative slot data
    const slots2025Path = path.join(__dirname, '../src/data/qualifying_slots_2025.json')
    const slots2026Path = path.join(__dirname, '../src/data/qualifying_slots_2026.json')
    
    const slots2025 = JSON.parse(fs.readFileSync(slots2025Path, 'utf8'))
    const slots2026 = JSON.parse(fs.readFileSync(slots2026Path, 'utf8'))
    
    console.log('📋 Loaded authoritative slot data')
    
    // 2. Get all races from database
    const allRaces = await prisma.race.findMany({
      include: { analysis: true, _count: { select: { results: true } } }
    })
    
    console.log(`📊 Found ${allRaces.length} races in database`)
    
    // 3. Validate each race against authoritative data
    const validRaces = []
    const invalidRaces = []
    
    for (const race of allRaces) {
      let isValid = true
      let issues = []
      
      // Check if race exists in 2025 slot data
      const race2025 = slots2025.full_distance[race.name] || slots2025['70.3'][race.name]
      if (!race2025) {
        isValid = false
        issues.push('Not found in 2025 slot data')
      } else {
        // Validate 2025 slot allocation
        if (race.totalSlots !== race2025.total_slots) {
          isValid = false
          issues.push(`2025 total slots mismatch: DB=${race.totalSlots}, JSON=${race2025.total_slots}`)
        }
        if (race.menSlots !== race2025.men_slots) {
          isValid = false
          issues.push(`2025 men slots mismatch: DB=${race.menSlots}, JSON=${race2025.men_slots}`)
        }
        if (race.womenSlots !== race2025.women_slots) {
          isValid = false
          issues.push(`2025 women slots mismatch: DB=${race.womenSlots}, JSON=${race2025.women_slots}`)
        }
      }
      
      // Check 2026 data
      const race2026 = slots2026.full_distance[race.name] || slots2026['70.3'][race.name]
      if (race2026) {
        if (race.totalSlots2026 !== race2026.total_slots) {
          isValid = false
          issues.push(`2026 total slots mismatch: DB=${race.totalSlots2026}, JSON=${race2026.total_slots}`)
        }
      } else {
        // Race doesn't exist in 2026, should have null totalSlots2026
        if (race.totalSlots2026 !== null) {
          isValid = false
          issues.push(`Race not in 2026 but has 2026 slots in DB: ${race.totalSlots2026}`)
        }
      }
      
      // Check if has results but no analysis
      if (race._count.results > 0 && !race.analysis) {
        isValid = false
        issues.push(`Has ${race._count.results} results but no analysis`)
      }
      
      // Check if analysis exists but wrong qualified numbers
      if (race.analysis && race2025) {
        const expectedQualified = (race2025.men_slots || 0) + (race2025.women_slots || 0)
        if (race.analysis.system2025TotalQualified !== expectedQualified) {
          isValid = false
          issues.push(`2025 qualified mismatch: Analysis=${race.analysis.system2025TotalQualified}, Expected=${expectedQualified}`)
        }
      }
      
      if (isValid) {
        validRaces.push(race)
      } else {
        invalidRaces.push({ race, issues })
      }
    }
    
    console.log(`\n✅ Valid races: ${validRaces.length}`)
    console.log(`❌ Invalid races: ${invalidRaces.length}`)
    
    // 4. Report invalid races
    if (invalidRaces.length > 0) {
      console.log('\n🚨 INVALID RACES FOUND:')
      for (const { race, issues } of invalidRaces) {
        console.log(`\n❌ ${race.name}:`)
        issues.forEach(issue => console.log(`   - ${issue}`))
      }
    }
    
    // 5. Delete races that don't exist in 2025 slot data (bad imports)
    const racesToDelete = invalidRaces.filter(({ issues }) => 
      issues.some(issue => issue.includes('Not found in 2025 slot data'))
    )
    
    if (racesToDelete.length > 0) {
      console.log(`\n🗑️ Deleting ${racesToDelete.length} races not in authoritative data...`)
      for (const { race } of racesToDelete) {
        console.log(`   💥 Deleting: ${race.name}`)
        
        // Delete results
        await prisma.raceResult.deleteMany({ where: { raceId: race.id } })
        
        // Delete analysis
        if (race.analysis) {
          await prisma.qualifyingAnalysis.delete({ where: { id: race.analysis.id } })
        }
        
        // Delete race
        await prisma.race.delete({ where: { id: race.id } })
      }
      console.log('✅ Bad races deleted')
    }
    
    // 6. Fix races with incorrect slot data
    const racesToFix = invalidRaces.filter(({ issues }) => 
      !issues.some(issue => issue.includes('Not found in 2025 slot data')) &&
      issues.some(issue => issue.includes('slots mismatch'))
    )
    
    if (racesToFix.length > 0) {
      console.log(`\n🔧 Fixing ${racesToFix.length} races with incorrect slot data...`)
      for (const { race } of racesToFix) {
        const race2025 = slots2025.full_distance[race.name] || slots2025['70.3'][race.name]
        const race2026 = slots2026.full_distance[race.name] || slots2026['70.3'][race.name]
        
        console.log(`   🔧 Fixing: ${race.name}`)
        
        await prisma.race.update({
          where: { id: race.id },
          data: {
            totalSlots: race2025.total_slots,
            menSlots: race2025.men_slots,
            womenSlots: race2025.women_slots,
            totalSlots2026: race2026?.total_slots || null,
            menSlots2026: race2026?.men_slots || null,
            womenSlots2026: race2026?.women_slots || null
          }
        })
      }
      console.log('✅ Slot data fixed')
    }
    
    // 7. Final validation
    const finalRaces = await prisma.race.findMany({
      include: { analysis: true, _count: { select: { results: true } } }
    })
    
    console.log(`\n📊 Final race count: ${finalRaces.length}`)
    
    // Count by distance
    const fullDistance = finalRaces.filter(r => r.distance === 'full').length
    const halfDistance = finalRaces.filter(r => r.distance === '70.3').length
    
    console.log(`   Full distance: ${fullDistance}`)
    console.log(`   70.3 distance: ${halfDistance}`)
    
    // Count races with data
    const racesWithResults = finalRaces.filter(r => r._count.results > 0).length
    const racesWithAnalysis = finalRaces.filter(r => r.analysis).length
    
    console.log(`   With results: ${racesWithResults}`)
    console.log(`   With analysis: ${racesWithAnalysis}`)
    
    console.log('\n🎉 Cleanup and validation complete!')
    console.log('💡 Database now contains only valid races matching authoritative slot data')
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupAndValidate()