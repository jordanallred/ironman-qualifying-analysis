#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function generateCorrectAnalyses() {
  console.log('🚀 Generating CORRECT analyses with proper slot allocations...')
  
  try {
    // Get all races that we have prefetched data for
    const dataDir = path.join(__dirname, '../prefetched_data')
    const files = fs.readdirSync(dataDir).filter(file => 
      file.endsWith('.json') && 
      file !== 'all_races.json' &&
      !file.includes('belgrade') && 
      !file.includes('fortaleza') &&
      !file.includes('rwanda')
    )
    
    console.log(`📁 Found ${files.length} race files to process`)
    
    let processed = 0
    let failed = 0
    
    for (const file of files) {
      try {
        const filePath = path.join(dataDir, file)
        const prefetchedData = JSON.parse(fs.readFileSync(filePath, 'utf8'))
        
        if (!prefetchedData.analysis) continue
        
        const raceName = prefetchedData.analysis.race_name
        console.log(`\n📊 Processing: ${raceName}`)
        
        // Find the race in our database
        const race = await prisma.race.findFirst({
          where: {
            OR: [
              { name: raceName },
              { name: { contains: raceName.replace('IRONMAN ', '').replace('70.3 ', '') } }
            ]
          }
        })
        
        if (!race) {
          console.log(`⚠️  Race not found: ${raceName}`)
          failed++
          continue
        }
        
        // Get the correct slot allocations from our database
        const slots2025 = race.totalSlots
        const slots2026 = race.totalSlots2026 || race.totalSlots
        
        console.log(`   2025: ${slots2025} slots (${race.menSlots}M/${race.womenSlots}W)`)
        console.log(`   2026: ${slots2026} slots (gender-neutral)`)
        
        // Use the participation data from prefetched but calculate correct qualifiers
        const totalParticipants = prefetchedData.analysis.total_participants
        const menParticipants = prefetchedData.analysis.men_participants
        const womenParticipants = prefetchedData.analysis.women_participants
        
        // 2025 system: Use the exact slot allocations
        const men2025 = Math.min(race.menSlots || 0, menParticipants)
        const women2025 = Math.min(race.womenSlots || 0, womenParticipants)
        const total2025 = men2025 + women2025
        
        // 2026 system: Distribute slots based on participation ratio
        const menRatio = menParticipants / totalParticipants
        const womenRatio = womenParticipants / totalParticipants
        
        const men2026 = Math.round(slots2026 * menRatio)
        const women2026 = slots2026 - men2026
        const total2026 = slots2026
        
        console.log(`   📈 2025 qualifiers: ${total2025} (${men2025}M/${women2025}W)`)
        console.log(`   📈 2026 qualifiers: ${total2026} (${men2026}M/${women2026}W)`)
        console.log(`   📊 Change: ${total2026 - total2025} (${men2026 - men2025}M/${women2026 - women2025}W)`)
        
        // Check if analysis already exists
        const existing = await prisma.qualifyingAnalysis.findUnique({
          where: { raceId: race.id }
        })
        
        if (existing) {
          // Update existing
          await prisma.qualifyingAnalysis.update({
            where: { raceId: race.id },
            data: {
              totalParticipants,
              menParticipants,
              womenParticipants,
              totalSlots: slots2025,
              system2025MenQualified: men2025,
              system2025WomenQualified: women2025,
              system2025TotalQualified: total2025,
              system2026MenQualified: men2026,
              system2026WomenQualified: women2026,
              system2026TotalQualified: total2026,
              menDifference: men2026 - men2025,
              womenDifference: women2026 - women2025,
              ageGroupAnalysis: prefetchedData.analysis.age_group_analysis || {},
              detailedResults: prefetchedData.analysis.detailed_results?.slice(0, 100) || null
            }
          })
        } else {
          // Create new
          await prisma.qualifyingAnalysis.create({
            data: {
              raceId: race.id,
              totalParticipants,
              menParticipants,
              womenParticipants,
              totalSlots: slots2025,
              system2025MenQualified: men2025,
              system2025WomenQualified: women2025,
              system2025TotalQualified: total2025,
              system2026MenQualified: men2026,
              system2026WomenQualified: women2026,
              system2026TotalQualified: total2026,
              menDifference: men2026 - men2025,
              womenDifference: women2026 - women2025,
              ageGroupAnalysis: prefetchedData.analysis.age_group_analysis || {},
              detailedResults: prefetchedData.analysis.detailed_results?.slice(0, 100) || null
            }
          })
        }
        
        // Import some race results for detail pages
        if (prefetchedData.analysis.detailed_results) {
          const results = prefetchedData.analysis.detailed_results.slice(0, 200)
          
          // Delete existing results first
          await prisma.raceResult.deleteMany({
            where: { raceId: race.id }
          })
          
          // Import new results
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
        }
        
        console.log(`✅ Successfully processed ${raceName}`)
        processed++
        
      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message)
        failed++
      }
    }
    
    const finalCount = await prisma.qualifyingAnalysis.count()
    console.log(`\n🎉 CORRECT analysis generation complete!`)
    console.log(`✅ Processed: ${processed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`📊 Total analyses in database: ${finalCount}`)
    
  } catch (error) {
    console.error('❌ Generation failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

generateCorrectAnalyses()