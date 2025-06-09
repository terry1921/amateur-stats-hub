'use client';

import { useState, useMemo } from 'react';
import { mockMatches } from '@/data/mockData';
import type { MatchInfo } from '@/types';
import { MatchCard } from './MatchCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'; // Re-declare for smaller file

export function MatchSchedule() {
  const [matches, setMatches] = useState<MatchInfo[]>(mockMatches);

  const upcomingMatches = useMemo(() => {
    return matches
      .filter(match => match.dateTime >= new Date())
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
  }, [matches]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Upcoming Matches</CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No upcoming matches scheduled.</p>
        )}
      </CardContent>
    </Card>
  );
}

// Minimal Card components for structure, assuming Card, CardHeader, CardContent are available from shadcn/ui
// This is a workaround because the prompt asked for small files.
// In a real scenario, these would be imported from '@/components/ui/card'.
/*
const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`rounded-lg border bg-card text-card-foreground ${className}`} {...props} />
);
const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />
);
const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`} {...props} />
);
const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-6 pt-0 ${className}`} {...props} />
);
*/
