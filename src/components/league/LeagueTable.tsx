
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, BrainCircuit, ArrowUp, ArrowDown, Loader2, AlertTriangle, Pencil, BarChartHorizontalBig } from 'lucide-react';
import type { TeamStats } from '@/types';
import { TeamPerformanceDialog } from './TeamPerformanceDialog';
import { UpdateTeamStatsDialog } from './UpdateTeamStatsDialog';
import { getTeams, updateAllTeamRanks } from '@/services/firestoreService';
import { useToast } from '@/hooks/use-toast';

type SortKey = keyof TeamStats | null;
type SortDirection = 'asc' | 'desc';

const columns: { key: keyof TeamStats; label: string; shortLabel?: string, numeric?: boolean }[] = [
  { key: 'rank', label: '#', numeric: true },
  { key: 'name', label: 'Team' },
  { key: 'played', label: 'Played', shortLabel: 'P', numeric: true },
  { key: 'won', label: 'Won', shortLabel: 'W', numeric: true },
  { key: 'drawn', label: 'Drawn', shortLabel: 'D', numeric: true },
  { key: 'lost', label: 'Lost', shortLabel: 'L', numeric: true },
  { key: 'goalsScored', label: 'Goals Scored', shortLabel: 'GS', numeric: true },
  { key: 'goalsConceded', label: 'Goals Conceded', shortLabel: 'GC', numeric: true },
  { key: 'goalDifference', label: 'Goal Difference', shortLabel: 'GD', numeric: true },
  { key: 'points', label: 'Points', shortLabel: 'Pts', numeric: true },
];

export function LeagueTable() {
  const [teamsData, setTeamsData] = useState<TeamStats[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  const [selectedTeamForAnalysis, setSelectedTeamForAnalysis] = useState<TeamStats | null>(null);
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  
  const [selectedTeamForUpdate, setSelectedTeamForUpdate] = useState<TeamStats | null>(null);
  const [isUpdateStatsDialogOpen, setIsUpdateStatsDialogOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingRanks, setIsUpdatingRanks] = useState(false);

  const { toast } = useToast();

  const fetchTeamsData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const teams = await getTeams();
      setTeamsData(teams);
    } catch (err) {
      console.error("Error fetching teams:", err);
      setError("Failed to load league table. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamsData();
  }, [fetchTeamsData]);

  const sortedTeams = useMemo(() => {
    if (!sortKey) return teamsData;

    return [...teamsData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return 0;
    });
  }, [teamsData, sortKey, sortDirection]);

  const handleSort = (key: keyof TeamStats) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const openAnalysisDialog = (team: TeamStats) => {
    setSelectedTeamForAnalysis(team);
    setIsAnalysisDialogOpen(true);
  };

  const closeAnalysisDialog = () => {
    setIsAnalysisDialogOpen(false);
    setSelectedTeamForAnalysis(null);
  };

  const openUpdateStatsDialog = (team: TeamStats) => {
    setSelectedTeamForUpdate(team);
    setIsUpdateStatsDialogOpen(true);
  };

  const closeUpdateStatsDialog = () => {
    setIsUpdateStatsDialogOpen(false);
    setSelectedTeamForUpdate(null);
  };

  const handleTeamStatsUpdated = () => {
    fetchTeamsData(); 
  };

  const handleUpdateRanks = async () => {
    setIsUpdatingRanks(true);
    try {
      await updateAllTeamRanks();
      toast({
        title: "Ranks Updated",
        description: "Team ranks have been successfully recalculated and updated.",
      });
      fetchTeamsData(); // Refresh data to show new ranks
    } catch (err) {
      console.error("Error updating ranks:", err);
      toast({
        variant: "destructive",
        title: "Rank Update Failed",
        description: "Could not update team ranks. Please try again.",
      });
    } finally {
      setIsUpdatingRanks(false);
    }
  };
  
  const SortIcon = ({ columnKey }: { columnKey: keyof TeamStats }) => {
    if (sortKey !== columnKey) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    return sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  if (isLoading && !isUpdatingRanks) { // Don't show main loader if only ranks are updating
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading league table...</p>
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-headline text-2xl">League Standings</CardTitle>
          <Button onClick={handleUpdateRanks} disabled={isUpdatingRanks || isLoading} variant="outline" size="sm">
            {isUpdatingRanks ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BarChartHorizontalBig className="h-4 w-4" />
            )}
            <span className="ml-2">Update Ranks</span>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>Official league standings. Click headers to sort. Use actions to analyze or edit team stats.</TableCaption>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead 
                    key={col.key} 
                    onClick={() => col.key !== 'name' && handleSort(col.key)} 
                    className={`cursor-pointer hover:bg-muted/50 ${col.numeric ? 'text-right' : 'text-left'}`}
                    title={`Sort by ${col.label}`}
                  >
                    <div className={`flex items-center ${col.numeric ? 'justify-end' : 'justify-start'}`}>
                      <span className="sm:hidden">{col.shortLabel || col.label}</span>
                      <span className="hidden sm:inline">{col.label}</span>
                      {col.key !== 'name' && <SortIcon columnKey={col.key} />}
                    </div>
                  </TableHead>
                ))}
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTeams.map((team) => (
                <TableRow key={team.id}>
                  {columns.map((col) => (
                    <TableCell key={`${team.id}-${col.key}`} className={`${col.numeric ? 'text-right' : 'text-left'} ${col.key === 'name' ? 'font-semibold' : ''}`}>
                      {team[col.key]}
                    </TableCell>
                  ))}
                  <TableCell className="text-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openAnalysisDialog(team)}
                      className="text-primary hover:text-primary/80 px-2"
                      title={`Analyze ${team.name}'s performance`}
                      disabled={isUpdatingRanks}
                    >
                      <BrainCircuit className="h-5 w-5" />
                      <span className="sr-only">Analyze</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openUpdateStatsDialog(team)}
                      className="text-accent hover:text-accent/80 px-2"
                      title={`Edit ${team.name}'s stats`}
                      disabled={isUpdatingRanks}
                    >
                      <Pencil className="h-5 w-5" />
                      <span className="sr-only">Edit Stats</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <TeamPerformanceDialog
        team={selectedTeamForAnalysis}
        isOpen={isAnalysisDialogOpen}
        onClose={closeAnalysisDialog}
      />
      <UpdateTeamStatsDialog
        team={selectedTeamForUpdate}
        isOpen={isUpdateStatsDialogOpen}
        onClose={closeUpdateStatsDialog}
        onTeamUpdate={handleTeamStatsUpdated}
      />
    </>
  );
}

// Minimal Card components for structure, assuming Card, CardHeader, CardContent are available from shadcn/ui
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
