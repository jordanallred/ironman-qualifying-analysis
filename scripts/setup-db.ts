#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Setting up database...')
  
  // The migrations should already be applied, but let's verify tables exist
  try {
    const raceCount = await prisma.race.count()
    console.log(`✅ Database connected. Found ${raceCount} races.`)
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  }
  
  await prisma.$disconnect()
}

main()