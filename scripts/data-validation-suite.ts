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

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

async function validateDataIntegrity(): Promise<ValidationResult> {
  console.log('🔍 Running comprehensive data validation...')
  
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  }
  
  try {
    // Load authoritative data
    const slots2025Path = path.join(__dirname, '../src/data/qualifying_slots_2025.json')
    const slots2026Path = path.join(__dirname, '../src/data/qualifying_slots_2026.json')
    
    const slots2025 = JSON.parse(fs.readFileSync(slots2025Path, 'utf8'))
    const slots2026 = JSON.parse(fs.readFileSync(slots2026Path, 'utf8'))
    
    const allRaces = await prisma.race.findMany({
      include: { analysis: true, _count: { select: { results: true } } }
    })
    
    console.log(`📊 Validating ${allRaces.length} races...`)
    
    // 1. Validate all races exist in authoritative data
    for (const race of allRaces) {
      const race2025 = slots2025.full_distance[race.name] || slots2025['70.3'][race.name]
      
      if (!race2025) {
        result.isValid = false
        result.errors.push(`❌ Race "${race.name}" not found in 2025 authoritative data`)
      } else {
        // Validate slot allocations match
        if (race.totalSlots !== race2025.total_slots) {
          result.isValid = false
          result.errors.push(`❌ ${race.name}: 2025 total slots mismatch (DB: ${race.totalSlots}, JSON: ${race2025.total_slots})`)
        }
        
        if (race.menSlots !== race2025.men_slots) {
          result.isValid = false
          result.errors.push(`❌ ${race.name}: 2025 men slots mismatch (DB: ${race.menSlots}, JSON: ${race2025.men_slots})`)
        }
        
        if (race.womenSlots !== race2025.women_slots) {
          result.isValid = false
          result.errors.push(`❌ ${race.name}: 2025 women slots mismatch (DB: ${race.womenSlots}, JSON: ${race2025.women_slots})`)
        }
      }
      
      // Check 2026 data consistency
      const race2026 = slots2026.full_distance[race.name] || slots2026['70.3'][race.name]
      
      if (race2026) {
        if (race.totalSlots2026 !== race2026.total_slots) {
          result.isValid = false
          result.errors.push(`❌ ${race.name}: 2026 total slots mismatch (DB: ${race.totalSlots2026}, JSON: ${race2026.total_slots})`)
        }
      } else {
        // Race not in 2026 - should have null 2026 data
        if (race.totalSlots2026 !== null) {
          result.isValid = false
          result.errors.push(`❌ ${race.name}: Has 2026 slots (${race.totalSlots2026}) but race not in 2026 schedule`)
        }
      }
      
      // Validate analysis data if exists
      if (race.analysis && race2025) {
        const expectedQualified2025 = (race2025.men_slots || 0) + (race2025.women_slots || 0)
        
        if (race.analysis.system2025TotalQualified !== expectedQualified2025) {
          result.isValid = false
          result.errors.push(`❌ ${race.name}: 2025 qualified mismatch (Analysis: ${race.analysis.system2025TotalQualified}, Expected: ${expectedQualified2025})`)
        }
        
        // Check 2026 qualified makes sense
        if (race2026) {
          if (race.analysis.system2026TotalQualified > race2026.total_slots) {
            result.isValid = false
            result.errors.push(`❌ ${race.name}: 2026 qualified (${race.analysis.system2026TotalQualified}) > available slots (${race2026.total_slots})`)
          }
        } else {
          // Race not in 2026, should have 0 qualified
          if (race.analysis.system2026TotalQualified !== 0) {
            result.isValid = false
            result.errors.push(`❌ ${race.name}: 2026 qualified should be 0 (race discontinued), but shows ${race.analysis.system2026TotalQualified}`)
          }
        }
      }
      
      // Check for orphaned data
      if (race._count.results > 0 && !race.analysis) {
        result.warnings.push(`⚠️ ${race.name}: Has ${race._count.results} results but no analysis`)
      }
      
      if (race.analysis && race._count.results === 0) {
        result.warnings.push(`⚠️ ${race.name}: Has analysis but no race results`)
      }
    }
    
    // 2. Check for missing races (in JSON but not in DB)
    const allSlotRaces = [
      ...Object.keys(slots2025.full_distance),
      ...Object.keys(slots2025['70.3'])
    ]
    
    const dbRaceNames = allRaces.map(r => r.name)
    
    for (const raceName of allSlotRaces) {
      if (!dbRaceNames.includes(raceName)) {
        result.warnings.push(`⚠️ Race "${raceName}" in slot data but not in database`)
      }
    }
    
    // 3. Summary
    console.log(`\n📋 Validation Summary:`)
    console.log(`   Races checked: ${allRaces.length}`)
    console.log(`   Errors: ${result.errors.length}`)
    console.log(`   Warnings: ${result.warnings.length}`)
    
    if (result.errors.length > 0) {
      console.log('\n🚨 ERRORS:')
      result.errors.forEach(error => console.log(`   ${error}`))
    }
    
    if (result.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:')
      result.warnings.forEach(warning => console.log(`   ${warning}`))
    }
    
    if (result.isValid) {
      console.log('\n✅ All data is valid and consistent!')
    } else {
      console.log('\n❌ Data validation failed - run cleanup script to fix issues')
    }
    
  } catch (error) {
    result.isValid = false
    result.errors.push(`Fatal validation error: ${error}`)
  } finally {
    await prisma.$disconnect()
  }
  
  return result
}

// Run validation
validateDataIntegrity().then(result => {
  process.exit(result.isValid ? 0 : 1)
})