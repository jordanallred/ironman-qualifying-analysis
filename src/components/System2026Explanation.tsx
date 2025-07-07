'use client';

import Link from 'next/link';
import { Card, CardContent, Button, Heading, Text } from '@/components/ui';

export default function System2026Explanation() {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <Heading level={3} className="mb-4">
          Understanding the 2026 System
        </Heading>
        
        <Text className="mb-6 leading-relaxed">
          The new 2026 qualifying system uses age-graded performance standards based on Kona finisher data. 
          Learn about the Kona Standard ratios, real examples, and how the roll-down process works.
        </Text>
        
        <Link href="/system-2026">
          <Button className="inline-flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Learn About the 2026 System
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}