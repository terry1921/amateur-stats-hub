import type { MatchInfo } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarClock, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';

interface MatchCardProps {
  match: MatchInfo;
}

export function MatchCard({ match }: MatchCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-primary flex items-center justify-between">
          <span>{match.homeTeam} vs {match.awayTeam}</span>
          <Users className="h-6 w-6 text-accent" />
        </CardTitle>
        <CardDescription>
          {match.homeScore !== undefined && match.awayScore !== undefined 
            ? `Result: ${match.homeScore} - ${match.awayScore}`
            : "Upcoming Match"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <CalendarClock className="h-4 w-4 mr-2 text-accent" />
          <span>{format(match.dateTime, 'EEE, MMM d, yyyy')} at {format(match.dateTime, 'p')}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mr-2 text-accent" />
          <span>{match.location}</span>
        </div>
      </CardContent>
    </Card>
  );
}
