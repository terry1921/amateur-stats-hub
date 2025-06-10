
import type { MatchInfo } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarClock, MapPin, Users, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

interface MatchCardProps {
  match: MatchInfo;
  onEditMatch: (match: MatchInfo) => void;
  onDeleteMatch: (matchId: string) => void;
}

export function MatchCard({ match, onEditMatch, onDeleteMatch }: MatchCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-headline text-xl text-primary">
            {match.homeTeam} vs {match.awayTeam}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Users className="h-6 w-6 text-accent" />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onEditMatch(match)} 
              className="h-7 w-7 text-muted-foreground hover:text-accent"
              title="Editar Marcador"
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Editar Marcador</span>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onDeleteMatch(match.id)} 
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              title="Eliminar Partido"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Eliminar Partido</span>
            </Button>
          </div>
        </div>
        <CardDescription>
          {match.homeScore !== undefined && match.awayScore !== undefined 
            ? `Result: ${match.homeScore} - ${match.awayScore}`
            : "Próximo partido"}
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
