#!/bin/bash

echo "🏗️ Building with data validation..."

# 1. Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# 2. Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# 3. Validate data integrity BEFORE any imports
echo "🔍 Validating existing data integrity..."
npx tsx scripts/data-validation-suite.ts
if [ $? -ne 0 ]; then
    echo "❌ Data validation failed! Stopping build."
    exit 1
fi

# 4. Import race data (only if validation passed)
echo "📊 Importing race data..."
npx tsx scripts/import-race-data.ts

# 5. Generate analyses
echo "📈 Generating analyses..."
npx tsx scripts/generate-correct-analyses.ts

# 6. Import missing races  
echo "🔧 Importing missing races..."
npx tsx scripts/import-missing-races.ts

# 7. Import full results
echo "📋 Importing full results..."
npx tsx scripts/import-full-results.ts

# 8. Final validation to ensure everything is still correct
echo "🔍 Final data validation..."
npx tsx scripts/data-validation-suite.ts
if [ $? -ne 0 ]; then
    echo "❌ Final validation failed! Data may be corrupted."
    exit 1
fi

# 9. Build the Next.js app
echo "🚀 Building Next.js app..."
next build

echo "✅ Build complete with validated data!"