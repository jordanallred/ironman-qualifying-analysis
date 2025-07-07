#!/bin/bash

echo "🔒 Removing hardcoded secrets from all script files..."

# Replace hardcoded DATABASE_URL with environment variable
find scripts/ -name "*.ts" -exec sed -i 's/const DATABASE_URL = "postgres:\/\/neondb_owner:npg_ec9oH3vXtwbu@ep-blue-morning-ad673b9s-pooler\.c-2\.us-east-1\.aws\.neon\.tech\/neondb?sslmode=require"/const DATABASE_URL = process.env.DATABASE_URL || ""/g' {} \;

echo "✅ Secrets removed from script files"

# Verify no secrets remain
echo "🔍 Checking for remaining secrets..."
SECRET_COUNT=$(find scripts/ -name "*.ts" -exec grep -l "npg_ec9oH3vXtwbu" {} \; | wc -l)

if [ $SECRET_COUNT -eq 0 ]; then
    echo "✅ No secrets found in script files"
else
    echo "❌ $SECRET_COUNT files still contain secrets:"
    find scripts/ -name "*.ts" -exec grep -l "npg_ec9oH3vXtwbu" {} \;
fi