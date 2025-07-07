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

async function fixEmiliaRomagna() {
  console.log('🔧 Fixing IRONMAN Italy Emilia-Romagna slot allocation...')
  
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
    console.log(`📊 Current slots: ${race.menSlots}M/${race.womenSlots}W = ${race.totalSlots} total`)
    
    // Load the correct slot data from JSON
    const slotsPath = path.join(__dirname, '../src/data/qualifying_slots_2025.json')
    const slotsData = JSON.parse(fs.readFileSync(slotsPath, 'utf8'))
    
    const correctSlots = slotsData.full_distance['IRONMAN Italy Emilia-Romagna']
    console.log(`📊 Correct slots: ${correctSlots.men_slots}M/${correctSlots.women_slots}W = ${correctSlots.total_slots} total`)
    
    // Update the race record with correct slot allocations
    await prisma.race.update({
      where: { id: race.id },
      data: {
        totalSlots: correctSlots.total_slots,
        menSlots: correctSlots.men_slots,
        womenSlots: correctSlots.women_slots
      }
    })
    
    console.log('✅ Updated race slot allocations')
    
    // If we have analysis, regenerate it
    if (race.analysis && race.results.length > 0) {
      console.log('🔄 Regenerating analysis with correct slots...')
      
      // Delete old analysis
      await prisma.qualifyingAnalysis.delete({
        where: { id: race.analysis.id }
      })
      
      // Calculate new analysis
      const totalParticipants = race.results.length
      const menParticipants = race.results.filter(r => r.gender === 'M').length
      const womenParticipants = race.results.filter(r => r.gender === 'W').length
      
      // 2025 system: gender-specific slots
      const system2025MenQualified = Math.min(correctSlots.men_slots, menParticipants)
      const system2025WomenQualified = Math.min(correctSlots.women_slots, womenParticipants)
      const system2025TotalQualified = system2025MenQualified + system2025WomenQualified
      
      // 2026 system: age-graded, calculate based on current data
      const sortedResults = race.results
        .filter(r => r.ageGradedTime !== null)
        .sort((a, b) => (a.ageGradedTime || 0) - (b.ageGradedTime || 0))
      
      const system2026TotalQualified = Math.min(correctSlots.total_slots, sortedResults.length)
      const qualified2026 = sortedResults.slice(0, system2026TotalQualified)
      
      const system2026MenQualified = qualified2026.filter(r => r.gender === 'M').length
      const system2026WomenQualified = qualified2026.filter(r => r.gender === 'W').length
      
      // Create new analysis
      await prisma.qualifyingAnalysis.create({
        data: {
          raceId: race.id,
          totalParticipants,
          menParticipants,
          womenParticipants,
          system2025TotalQualified,
          system2025MenQualified,
          system2025WomenQualified,
          system2026TotalQualified,
          system2026MenQualified,
          system2026WomenQualified,
          system2025Cutoff: race.results
            .filter(r => r.gender === 'M')
            .sort((a, b) => (a.timeSeconds || 0) - (b.timeSeconds || 0))[system2025MenQualified - 1]?.timeSeconds || null,
          system2025WomenCutoff: race.results
            .filter(r => r.gender === 'W')
            .sort((a, b) => (a.timeSeconds || 0) - (b.timeSeconds || 0))[system2025WomenQualified - 1]?.timeSeconds || null,
          system2026Cutoff: qualified2026[system2026TotalQualified - 1]?.ageGradedTime || null
        }
      })
      
      console.log('✅ Regenerated analysis')
      console.log(`   2025: ${system2025TotalQualified} qualified (${system2025MenQualified}M/${system2025WomenQualified}W)`)
      console.log(`   2026: ${system2026TotalQualified} qualified (${system2026MenQualified}M/${system2026WomenQualified}W)`)
    }
    
    console.log('🎉 IRONMAN Italy Emilia-Romagna fixed!')
    
  } catch (error) {
    console.error('❌ Fix failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixEmiliaRomagna()