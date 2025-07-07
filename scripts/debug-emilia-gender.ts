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

async function debugEmiliaGender() {
  console.log('🔍 Debugging gender data for IRONMAN Italy Emilia-Romagna...')
  
  try {
    const race = await prisma.race.findFirst({
      where: { name: { contains: 'Italy Emilia' } },
      include: { results: true }
    })
    
    if (!race) {
      console.log('❌ Race not found')
      return
    }
    
    console.log(`📊 Total results: ${race.results.length}`)
    
    // Check gender distribution
    const genderCounts = race.results.reduce((acc, result) => {
      acc[result.gender] = (acc[result.gender] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    console.log('📊 Gender distribution:')
    Object.entries(genderCounts).forEach(([gender, count]) => {
      console.log(`   ${gender}: ${count}`)
    })
    
    // Sample a few results to see the data
    console.log('\n📄 Sample results:')
    race.results.slice(0, 10).forEach((result, i) => {
      console.log(`   ${i+1}. ${result.athleteName} | ${result.ageGroup} | ${result.gender}`)
    })
    
    // Check for age groups to infer gender
    const ageGroups = [...new Set(race.results.map(r => r.ageGroup))].sort()
    console.log('\n📊 Age groups found:')
    ageGroups.forEach(ag => {
      const count = race.results.filter(r => r.ageGroup === ag).length
      console.log(`   ${ag}: ${count}`)
    })
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugEmiliaGender()