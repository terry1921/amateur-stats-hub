
'use client';

import { useState, useMemo, useEffect } from 'react';
import type { MatchInfo } from '@/types';
import { MatchCard } from './MatchCard';
import { getMatches } from '@/services/firestoreService';
import { Loader2, AlertTriangle } from 'lucide-react';

// Re-declare Card components for smaller file as per original structure
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


export function MatchSchedule() {
  const [matches, setMatches] = useState<MatchInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMatches() {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedMatches = await getMatches();
        setMatches(fetchedMatches);
      } catch (err) {
        console.error("Error fetching matches:", err);
        setError("Failed to load match schedule. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchMatches();
  }, []);

  const upcomingMatches = useMemo(() => {
    const now = new Date(); // Define 'now' here to avoid re-calculation on every comparison
    return matches
      .filter(match => match.dateTime >= now)
      // Already sorted by date from Firestore service, but can re-sort if needed
      // .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime()); 
  }, [matches]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading match schedule...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-destructive">
        <AlertTriangle className="h-12 w-12" />
        <p className="mt-4">{error}</p>
      </div>
    );
  }

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
