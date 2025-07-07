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

async function debugEmiliaRomagna() {
  console.log('🔍 Debugging IRONMAN Italy Emilia-Romagna slot allocation...')
  
  try {
    const race = await prisma.race.findFirst({
      where: { name: { contains: 'Italy Emilia' } },
      include: { analysis: true }
    })
    
    if (!race) {
      console.log('❌ Race not found')
      return
    }
    
    console.log(`\n📊 Race: ${race.name}`)
    console.log(`📊 Distance: ${race.distance}`)
    console.log(`📊 Date: ${race.date}`)
    console.log(`📊 Location: ${race.location}`)
    
    console.log(`\n🎯 Slot Allocations:`)
    console.log(`   2025 Total: ${race.totalSlots}`)
    console.log(`   2025 Men: ${race.menSlots}`)
    console.log(`   2025 Women: ${race.womenSlots}`)
    console.log(`   2026 Total: ${race.totalSlots2026}`)
    
    if (race.analysis) {
      console.log(`\n📈 Analysis Results:`)
      console.log(`   Participants: ${race.analysis.totalParticipants} (${race.analysis.menParticipants}M/${race.analysis.womenParticipants}W)`)
      console.log(`   2025 Qualified: ${race.analysis.system2025TotalQualified} (${race.analysis.system2025MenQualified}M/${race.analysis.system2025WomenQualified}W)`)
      console.log(`   2026 Qualified: ${race.analysis.system2026TotalQualified} (${race.analysis.system2026MenQualified}M/${race.analysis.system2026WomenQualified}W)`)
      console.log(`   Difference: ${race.analysis.system2026TotalQualified - race.analysis.system2025TotalQualified}`)
      
      console.log(`\n🚨 PROBLEM ANALYSIS:`)
      if (race.analysis.system2025TotalQualified !== (race.menSlots + race.womenSlots)) {
        console.log(`   ❌ 2025 qualified (${race.analysis.system2025TotalQualified}) ≠ allocated slots (${race.menSlots + race.womenSlots})`)
        console.log(`   🔧 Should be: ${race.menSlots}M + ${race.womenSlots}W = ${race.menSlots + race.womenSlots} total`)
      } else {
        console.log(`   ✅ 2025 numbers look correct`)
      }
    }
    
    // Check what the JSON data says
    console.log(`\n📁 Checking source data files...`)
    const fs = require('fs')
    const path = require('path')
    
    const data2025Path = path.join(__dirname, '../src/data/qualifying_slots_2025.json')
    const data2026Path = path.join(__dirname, '../src/data/qualifying_slots_2026.json')
    
    const data2025 = JSON.parse(fs.readFileSync(data2025Path, 'utf8'))
    const data2026 = JSON.parse(fs.readFileSync(data2026Path, 'utf8'))
    
    const emiliaKey = Object.keys(data2025.full_distance).find(key => key.includes('Emilia'))
    
    if (emiliaKey) {
      console.log(`\n📋 JSON Data for "${emiliaKey}":`)
      console.log(`   2025:`, data2025.full_distance[emiliaKey])
      if (data2026.full_distance[emiliaKey]) {
        console.log(`   2026:`, data2026.full_distance[emiliaKey])
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugEmiliaRomagna()