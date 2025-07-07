#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

// Path to prefetched data directory (relative to project root)
const PREFETCHED_DATA_DIR = '../prefetched_data'

interface PrefetchedRace {
  analysis: {
    race_name: string
    total_participants: number
    men_participants: number
    women_participants: number
    total_slots: number
    system_2025: {
      men_qualified: number
      women_qualified: number
      total_qualified: number
    }
    system_2026: {
      men_qualified: number
      women_qualified: number
      total_qualified: number
    }
    changes: {
      men_difference: number
      women_difference: number
    }
    age_group_analysis: any
    detailed_results?: any[]
  }
  last_updated: string
  url: string
  participant_count: number
}

async function importPrefetchedData() {
  console.log('🚀 Starting prefetched analysis data import...')
  
  try {
    const dataDir = path.join(__dirname, PREFETCHED_DATA_DIR)
    
    if (!fs.existsSync(dataDir)) {
      console.error(`❌ Prefetched data directory not found: ${dataDir}`)
      process.exit(1)
    }
    
    const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json') && file !== 'all_races.json')
    console.log(`📁 Found ${files.length} race analysis files`)
    
    let imported = 0
    let skipped = 0
    let errors = 0
    
    for (const file of files) {
      try {
        const filePath = path.join(dataDir, file)
        const data: PrefetchedRace = JSON.parse(fs.readFileSync(filePath, 'utf8'))
        
        if (!data.analysis || !data.analysis.race_name) {
          console.log(`⚠️  Skipping ${file} - invalid format`)
          skipped++
          continue
        }
        
        const raceName = data.analysis.race_name
        
        // Find the race in our database
        const race = await prisma.race.findFirst({
          where: {
            OR: [
              { name: raceName },
              { name: { contains: raceName.split(' ').slice(1).join(' ') } },
              { name: { contains: raceName.replace('IRONMAN ', '') } }
            ]
          }
        })
        
        if (!race) {
          console.log(`⚠️  Race not found in database: ${raceName}`)
          skipped++
          continue
        }
        
        // Check if analysis already exists
        const existingAnalysis = await prisma.qualifyingAnalysis.findUnique({
          where: { raceId: race.id }
        })
        
        if (existingAnalysis) {
          console.log(`⚡ Analysis exists: ${raceName}`)
          skipped++
          continue
        }
        
        // Create the analysis
        await prisma.qualifyingAnalysis.create({
          data: {
            raceId: race.id,
            totalParticipants: data.analysis.total_participants,
            menParticipants: data.analysis.men_participants,
            womenParticipants: data.analysis.women_participants,
            totalSlots: data.analysis.total_slots,
            system2025MenQualified: data.analysis.system_2025.men_qualified,
            system2025WomenQualified: data.analysis.system_2025.women_qualified,
            system2025TotalQualified: data.analysis.system_2025.total_qualified,
            system2026MenQualified: data.analysis.system_2026.men_qualified,
            system2026WomenQualified: data.analysis.system_2026.women_qualified,
            system2026TotalQualified: data.analysis.system_2026.total_qualified,
            menDifference: data.analysis.changes.men_difference,
            womenDifference: data.analysis.changes.women_difference,
            ageGroupAnalysis: data.analysis.age_group_analysis,
            detailedResults: data.analysis.detailed_results || null
          }
        })
        
        // Import race results if available
        if (data.analysis.detailed_results && Array.isArray(data.analysis.detailed_results)) {
          const results = data.analysis.detailed_results.slice(0, 1000) // Limit to first 1000 for performance
          
          for (const result of results) {
            if (result.name && result.age_group && result.gender && result.place) {
              await prisma.raceResult.create({
                data: {
                  raceId: race.id,
                  athleteName: result.name,
                  ageGroup: result.age_group,
                  gender: result.gender,
                  finishTime: result.finish_time || '',
                  place: result.place,
                  country: result.country || null,
                  timeSeconds: result.time_seconds || null,
                  ageGradedTime: result.age_graded_time || null
                }
              })
            }
          }
          console.log(`✅ Imported: ${raceName} (${results.length} results)`)
        } else {
          console.log(`✅ Imported: ${raceName} (analysis only)`)
        }
        
        imported++
        
      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error)
        errors++
      }
    }
    
    // Get final counts
    const totalAnalyses = await prisma.qualifyingAnalysis.count()
    const totalResults = await prisma.raceResult.count()
    
    console.log(`\n🎉 Import complete!`)
    console.log(`✅ Imported: ${imported}`)
    console.log(`⚡ Skipped: ${skipped}`)
    console.log(`❌ Errors: ${errors}`)
    console.log(`📊 Total analyses in DB: ${totalAnalyses}`)
    console.log(`🏃 Total results in DB: ${totalResults}`)
    
  } catch (error) {
    console.error('❌ Import failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the import
importPrefetchedData()