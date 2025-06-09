'use client';

import { useState, useMemo } from 'react';
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
import { ArrowUpDown, BrainCircuit, ArrowUp, ArrowDown } from 'lucide-react';
import type { TeamStats } from '@/types';
import { mockTeams } from '@/data/mockData';
import { TeamPerformanceDialog } from './TeamPerformanceDialog';

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
  const [teamsData, setTeamsData] = useState<TeamStats[]>(mockTeams);
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedTeam, setSelectedTeam] = useState<TeamStats | null>(null);
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);

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
    setSelectedTeam(team);
    setIsAnalysisDialogOpen(true);
  };

  const closeAnalysisDialog = () => {
    setIsAnalysisDialogOpen(false);
    setSelectedTeam(null);
  };
  
  const SortIcon = ({ columnKey }: { columnKey: keyof TeamStats }) => {
    if (sortKey !== columnKey) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    return sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };


  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">League Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>Official league standings. Click headers to sort.</TableCaption>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead 
                    key={col.key} 
                    onClick={() => handleSort(col.key)}
                    className={`cursor-pointer hover:bg-muted/50 ${col.numeric ? 'text-right' : 'text-left'}`}
                    title={`Sort by ${col.label}`}
                  >
                    <div className={`flex items-center ${col.numeric ? 'justify-end' : 'justify-start'}`}>
                      <span className="sm:hidden">{col.shortLabel || col.label}</span>
                      <span className="hidden sm:inline">{col.label}</span>
                      <SortIcon columnKey={col.key} />
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
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openAnalysisDialog(team)}
                      className="text-primary hover:text-primary/80"
                      title={`Analyze ${team.name}'s performance`}
                    >
                      <BrainCircuit className="h-5 w-5" />
                      <span className="sr-only sm:not-sr-only sm:ml-2">Analyze</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <TeamPerformanceDialog
        team={selectedTeam}
        isOpen={isAnalysisDialogOpen}
        onClose={closeAnalysisDialog}
      />
    </>
  );
}

// Minimal Card components for structure, assuming Card, CardHeader, CardContent are available from shadcn/ui
// This is a workaround because the prompt asked for small files.
// In a real scenario, these would be imported from '@/components/ui/card'.

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
