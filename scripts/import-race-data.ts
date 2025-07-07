#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'
import qualifying2025 from '../src/data/qualifying_slots_2025.json'
import qualifying2026 from '../src/data/qualifying_slots_2026.json'

const prisma = new PrismaClient()

async function importRaceData() {
  console.log('🚀 Starting race data import...')
  
  try {
    // Import 2025 Full Distance races
    console.log('📊 Importing full distance races (2025)...')
    for (const [raceName, raceData] of Object.entries(qualifying2025.full_distance)) {
      const existingRace = await prisma.race.findUnique({
        where: { name: raceName }
      })
      
      if (!existingRace) {
        await prisma.race.create({
          data: {
            name: raceName,
            date: new Date(raceData.date),
            location: raceData.location,
            distance: 'full',
            totalSlots: raceData.total_slots,
            menSlots: raceData.men_slots,
            womenSlots: raceData.women_slots,
            // Add 2026 data if available
            totalSlots2026: qualifying2026.full_distance[raceName as keyof typeof qualifying2026.full_distance]?.total_slots || null,
            menSlots2026: qualifying2026.full_distance[raceName as keyof typeof qualifying2026.full_distance]?.men_slots || null,
            womenSlots2026: qualifying2026.full_distance[raceName as keyof typeof qualifying2026.full_distance]?.women_slots || null,
          }
        })
        console.log(`✅ Added: ${raceName}`)
      } else {
        console.log(`⚡ Exists: ${raceName}`)
      }
    }
    
    // Import 2025 70.3 races
    console.log('📊 Importing 70.3 races (2025)...')
    for (const [raceName, raceData] of Object.entries(qualifying2025['70.3'])) {
      const existingRace = await prisma.race.findUnique({
        where: { name: raceName }
      })
      
      if (!existingRace) {
        await prisma.race.create({
          data: {
            name: raceName,
            date: new Date(raceData.date),
            location: raceData.location,
            distance: '70.3',
            totalSlots: raceData.total_slots,
            menSlots: raceData.men_slots,
            womenSlots: raceData.women_slots,
            // Add 2026 data if available
            totalSlots2026: qualifying2026['70.3'][raceName as keyof typeof qualifying2026['70.3']]?.total_slots || null,
            menSlots2026: qualifying2026['70.3'][raceName as keyof typeof qualifying2026['70.3']]?.men_slots || null,
            womenSlots2026: qualifying2026['70.3'][raceName as keyof typeof qualifying2026['70.3']]?.women_slots || null,
          }
        })
        console.log(`✅ Added: ${raceName}`)
      } else {
        console.log(`⚡ Exists: ${raceName}`)
      }
    }
    
    // Import Kona standards
    console.log('📊 Importing age group standards...')
    const konaStandards = {
      'M18-24': 0.9698, 'F18-24': 0.8567,
      'M25-29': 0.9921, 'F25-29': 0.8961,
      'M30-34': 1.0000, 'F30-34': 0.8977,
      'M35-39': 0.9895, 'F35-39': 0.8866,
      'M40-44': 0.9683, 'F40-44': 0.8707,
      'M45-49': 0.9401, 'F45-49': 0.8501,
      'M50-54': 0.9002, 'F50-54': 0.8125,
      'M55-59': 0.8667, 'F55-59': 0.7778,
      'M60-64': 0.8262, 'F60-64': 0.7218,
      'M65-69': 0.7552, 'F65-69': 0.6828,
      'M70-74': 0.6876, 'F70-74': 0.6439,
      'M75-79': 0.6768, 'F75-79': 0.5521,
      'M80-84': 0.5555, 'F80-84': 0.5555,
      'M85-89': 0.5416, 'F85-89': 0.5416,
    }
    
    for (const [ageGroup, multiplier] of Object.entries(konaStandards)) {
      const existing = await prisma.ageGroupStandard.findUnique({
        where: { ageGroup }
      })
      
      if (!existing) {
        await prisma.ageGroupStandard.create({
          data: {
            ageGroup,
            multiplier
          }
        })
        console.log(`✅ Added standard: ${ageGroup}`)
      }
    }
    
    // Get final counts
    const raceCount = await prisma.race.count()
    const standardCount = await prisma.ageGroupStandard.count()
    
    console.log(`\n🎉 Import complete!`)
    console.log(`📊 Total races: ${raceCount}`)
    console.log(`📐 Age group standards: ${standardCount}`)
    console.log(`\n🔗 Your site should now show all races at: https://your-app.vercel.app`)
    
  } catch (error) {
    console.error('❌ Import failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the import
importRaceData()