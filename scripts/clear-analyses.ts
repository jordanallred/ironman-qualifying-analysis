#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearAnalyses() {
  console.log('🗑️  Clearing incorrect analysis data from production...')
  
  try {
    // Delete all existing analyses and race results (they have wrong slot data)
    const deletedAnalyses = await prisma.qualifyingAnalysis.deleteMany({})
    const deletedResults = await prisma.raceResult.deleteMany({})
    
    console.log(`✅ Cleared ${deletedAnalyses.count} analyses`)
    console.log(`✅ Cleared ${deletedResults.count} race results`)
    console.log('📊 Production database now ready for correct analyses')
    
  } catch (error) {
    console.error('❌ Clear failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

clearAnalyses()