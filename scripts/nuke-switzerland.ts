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

async function nukeSwitzerlandRace() {
  console.log('💥 Nuking IRONMAN Switzerland from existence...')
  
  try {
    // Find all Switzerland races
    const switzerlandRaces = await prisma.race.findMany({
      where: {
        OR: [
          { name: { contains: 'Switzerland' } },
          { name: { contains: 'Thun' } }
        ]
      }
    })
    
    if (switzerlandRaces.length === 0) {
      console.log('   ✅ No Switzerland races found - already nuked!')
      return
    }
    
    for (const race of switzerlandRaces) {
      console.log(`   💥 Nuking: ${race.name}`)
      
      // Delete race results first
      const deletedResults = await prisma.raceResult.deleteMany({
        where: { raceId: race.id }
      })
      console.log(`      🗑️ Deleted ${deletedResults.count} results`)
      
      // Delete analysis
      const deletedAnalysis = await prisma.qualifyingAnalysis.deleteMany({
        where: { raceId: race.id }
      })
      console.log(`      🗑️ Deleted ${deletedAnalysis.count} analyses`)
      
      // Delete the race itself
      await prisma.race.delete({
        where: { id: race.id }
      })
      console.log(`      💥 Race completely nuked`)
    }
    
    console.log(`\n🎉 Switzerland nuked from orbit!`)
    console.log(`   Deleted ${switzerlandRaces.length} Switzerland race(s)`)
    
    // Final verification
    const remainingSwitzerlandRaces = await prisma.race.findMany({
      where: {
        OR: [
          { name: { contains: 'Switzerland' } },
          { name: { contains: 'Thun' } }
        ]
      }
    })
    
    if (remainingSwitzerlandRaces.length === 0) {
      console.log(`   ✅ Confirmed: Switzerland no longer exists in database`)
    } else {
      console.log(`   ❌ Warning: ${remainingSwitzerlandRaces.length} Switzerland races still found`)
    }
    
  } catch (error) {
    console.error('❌ Nuclear strike failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

nukeSwitzerlandRace()