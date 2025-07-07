# Ironman World Championship Qualifying Analysis Platform

A modern NextJS application that analyzes the impact of the new Ironman World Championship qualifying system (2026) compared to the current system (2025).

## Features

- **Race Distance Filter**: Default to 70.3 races (most popular) with ability to filter by full distance or view all
- **Individual Race Analysis**: Detailed race pages with chart/table toggle showing slot allocation comparisons
- **Global Trends Dashboard**: Cross-race analysis showing which age groups are winners/losers
- **Real-time Analysis**: Ability to analyze any race by entering Ironman or competitor.com URLs
- **Slot Allocation vs Cutoff Time**: Visual comparison of qualifying changes between systems

## Technology Stack

- **Frontend**: NextJS 14 with TypeScript and Tailwind CSS
- **Backend**: NextJS API routes
- **Database**: PostgreSQL with Prisma ORM
- **Charts**: Chart.js with react-chartjs-2
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ironman-nextjs
```

2. Install dependencies:
```bash
npm install
```

3. Start local PostgreSQL (mirrors production):
```bash
docker-compose up -d
```

4. Set up environment variables:
```bash
cp .env.example .env.local
```

5. Set up the database:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Migrate data (if you have existing prefetched data):
```bash
npm run migrate-data
```

6. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## System Comparison

### 2025 System (Current)
- Each age group (M/F separately) gets 1 slot initially
- Remaining slots distributed proportionally based on participation numbers
- Slots roll down within the same gender and age group

### 2026 System (New)
- Age group winners get automatic slots
- Remaining slots awarded by age-graded performance using "Kona Standards"
- Best performers qualify **regardless of age or gender**

## Data Sources

- **Race Slots**: Updated with actual 2025 qualifying slot allocations
- **Kona Standards**: Official age-graded multipliers for fair comparison
- **Race Results**: Live data from competitor.com API
- **Prefetched Data**: Historical analysis results for instant loading

## API Endpoints

- `GET /api/races` - List all races with filtering options
- `GET /api/races/[id]` - Individual race analysis
- `POST /api/analyze` - Real-time race analysis from URL
- `GET /api/trends` - Global trends across all races

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Set up a PostgreSQL database (Vercel Postgres recommended)
3. Add the DATABASE_URL environment variable
4. Deploy

The application will automatically run database migrations on build.

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Database Schema

The application uses Prisma with the following main models:

- **Race**: Store race information and slot allocations
- **RaceResult**: Individual athlete results
- **QualifyingAnalysis**: Analysis results comparing both systems
- **AgeGroupStandard**: Kona Standard multipliers

## Development

### Database Management

```bash
# Run migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Open Prisma Studio
npm run db:studio

# Migrate existing data
npm run migrate-data
```

### Adding New Races

1. Add race data to `data/qualifying_slots_2025.json`
2. Run the migration script: `npm run migrate-data`
3. The race will appear on the dashboard

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Check the existing GitHub issues
- Create a new issue with detailed information
- Include steps to reproduce any bugs