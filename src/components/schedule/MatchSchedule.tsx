
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { MatchInfo } from '@/types';
import { MatchCard } from './MatchCard';
import { getMatches } from '@/services/firestoreService';
import { Loader2, AlertTriangle, PlusSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddMatchDialog } from './AddMatchDialog'; // Import the new dialog

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
  const [isAddMatchDialogOpen, setIsAddMatchDialogOpen] = useState(false);

  const fetchMatches = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedMatches = await getMatches();
      setMatches(fetchedMatches);
    } catch (err) {
      console.error("Error fetching matches:", err);
      setError("No se pudo cargar el calendario del partido. Inténtalo de nuevo más tarde.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const upcomingMatches = useMemo(() => {
    const now = new Date(); 
    return matches
      .filter(match => match.dateTime >= now)
  }, [matches]);

  const handleMatchAdded = () => {
    fetchMatches(); // Refresh the list of matches
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando el calendario de partidos...</p>
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
    <>
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <CardTitle className="font-headline text-xl sm:text-2xl">Próximos partidos</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto no-print-header-actions">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAddMatchDialogOpen(true)}
              className="w-full sm:w-auto"
              disabled={isLoading}
            >
              <PlusSquare className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Agregar Partido</span>
              <span className="ml-2 sm:hidden">Add</span>
            </Button>
          </div>
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
      <AddMatchDialog
        isOpen={isAddMatchDialogOpen}
        onClose={() => setIsAddMatchDialogOpen(false)}
        onMatchAdded={handleMatchAdded}
      />
    </>
  );
}
