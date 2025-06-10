
'use client';

import type { ReactNode } from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import type { TeamStats } from '@/types';
import { teamPerformanceSummary, type TeamPerformanceSummaryOutput, type TeamPerformanceSummaryInput } from '@/ai/flows/team-performance-summary';
import { useToast } from '@/hooks/use-toast';

interface TeamPerformanceDialogProps {
  team: TeamStats | null;
  isOpen: boolean;
  onClose: () => void;
}

const CACHE_PREFIX = 'teamAnalysisCache_';

export function TeamPerformanceDialog({ team, isOpen, onClose }: TeamPerformanceDialogProps) {
  const [analysis, setAnalysis] = useState<TeamPerformanceSummaryOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const getCacheKey = useCallback((currentTeam: TeamStats | null): string | null => {
    if (!currentTeam) return null;
    return `${CACHE_PREFIX}${currentTeam.id}_${currentTeam.played}_${currentTeam.points}`;
  }, []);

  const fetchAnalysis = useCallback(async () => {
    if (!team) return;

    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    const cacheKey = getCacheKey(team);

    // Try to load from cache first
    if (cacheKey) {
      try {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          const parsedData = JSON.parse(cachedData) as TeamPerformanceSummaryOutput;
          setAnalysis(parsedData);
          setIsLoading(false);
          toast({
            title: 'Analysis Loaded',
            description: 'Loaded analysis from cache.',
          });
          return;
        }
      } catch (e) {
        console.warn('Failed to parse cached analysis:', e);
        // Proceed to fetch new data if cache is invalid
      }
    }

    try {
      const input: TeamPerformanceSummaryInput = {
        teamName: team.name,
        matchesPlayed: team.played,
        matchesWon: team.won,
        matchesDrawn: team.drawn,
        matchesLost: team.lost,
        goalsScored: team.goalsScored,
        goalsConceded: team.goalsConceded,
        goalDifference: team.goalDifference,
      };
      const result = await teamPerformanceSummary(input);
      setAnalysis(result);

      // Save to cache
      if (cacheKey && result) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(result));
        } catch (e) {
          console.warn('Failed to save analysis to cache:', e);
        }
      }

    } catch (e) {
      console.error('Error fetching team performance analysis:', e);
      setError('No se pudo generar el análisis de rendimiento. Inténtelo de nuevo.');
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'No se pudo generar el análisis del rendimiento del equipo.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [team, toast, getCacheKey]);


  useEffect(() => {
    if (isOpen && team) {
      fetchAnalysis();
    } else {
      // Reset state when dialog is closed
      setAnalysis(null);
      setIsLoading(false);
      setError(null);
    }
  }, [isOpen, team, fetchAnalysis]);


  let content: ReactNode;

  if (isLoading) {
    content = (
      <div className="flex flex-col items-center justify-center h-48">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Generando analisis...</p>
      </div>
    );
  } else if (error) {
    content = (
      <div className="flex flex-col items-center justify-center h-48 text-destructive">
        <AlertTriangle className="h-12 w-12" />
        <p className="mt-4">{error}</p>
        <Button variant="outline" onClick={fetchAnalysis} className="mt-4">Reintentar</Button>
      </div>
    );
  } else if (analysis) {
    content = (
      <>
        <DialogDescription className="space-y-4">
          <div>
            <h3 className="font-semibold text-foreground">Resumen de rendimiento</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysis.summary}</p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Areas de mejora</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysis.improvementAreas}</p>
          </div>
        </DialogDescription>
      </>
    );
  } else {
    content = <div className="h-48" />; // Placeholder for initial state or if team is null (though guarded)
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Analisis de rendimiento: {team?.name || 'Team'}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
         {content}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
