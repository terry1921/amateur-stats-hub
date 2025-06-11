
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ArrowUpDown, BrainCircuit, ArrowUp, ArrowDown, Loader2, AlertTriangle, Pencil, BarChartHorizontalBig, Printer, PlusSquare } from 'lucide-react';
import type { TeamStats } from '@/types';
import { TeamPerformanceDialog } from './TeamPerformanceDialog';
import { UpdateTeamStatsDialog } from './UpdateTeamStatsDialog';
import { RegisterTeamForm } from '@/components/team/RegisterTeamForm';
import { getTeams, updateAllTeamRanks } from '@/services/firestoreService'; // getTeams and updateAllTeamRanks will need leagueId
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

type SortKey = keyof TeamStats | null;
type SortDirection = 'asc' | 'desc';

const columns: { key: keyof TeamStats; label: string; shortLabel?: string, numeric?: boolean }[] = [
  { key: 'rank', label: '#', numeric: true },
  { key: 'name', label: 'Equipo' },
  { key: 'played', label: 'JJ', shortLabel: 'P', numeric: true },
  { key: 'won', label: 'JG', shortLabel: 'W', numeric: true },
  { key: 'drawn', label: 'JE', shortLabel: 'D', numeric: true },
  { key: 'lost', label: 'JP', shortLabel: 'L', numeric: true },
  { key: 'goalsScored', label: 'GA', shortLabel: 'GS', numeric: true },
  { key: 'goalsConceded', label: 'GE', shortLabel: 'GC', numeric: true },
  { key: 'goalDifference', label: 'DIF', shortLabel: 'GD', numeric: true },
  { key: 'points', label: 'PTS', shortLabel: 'Pts', numeric: true },
];

interface LeagueTableProps {
  leagueId: string; // New prop
  leagueName: string | null; // New prop
}

export function LeagueTable({ leagueId, leagueName }: LeagueTableProps) {
  const { userProfile } = useAuth();
  const [teamsData, setTeamsData] = useState<TeamStats[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  const [selectedTeamForAnalysis, setSelectedTeamForAnalysis] = useState<TeamStats | null>(null);
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  
  const [selectedTeamForUpdate, setSelectedTeamForUpdate] = useState<TeamStats | null>(null);
  const [isUpdateStatsDialogOpen, setIsUpdateStatsDialogOpen] = useState(false);

  const [isRegisterTeamDialogOpen, setIsRegisterTeamDialogOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingRanks, setIsUpdatingRanks] = useState(false);

  const { toast } = useToast();

  const fetchTeamsData = useCallback(async () => {
    if (!leagueId) {
        setError("League not selected.");
        setIsLoading(false);
        return;
    }
    try {
      setIsLoading(true);
      setError(null);
      // TODO: Modify getTeams to accept leagueId and filter
      const teams = await getTeams(leagueId); 
      setTeamsData(teams);
    } catch (err) {
      console.error("Error fetching matches:", err);
      setError("No se pudo cargar la tabla de clasificación. Inténtalo de nuevo más tarde.");
    } finally {
      setIsLoading(false);
    }
  }, [leagueId]); // Add leagueId to dependencies

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

  const handleTeamRegistered = () => {
    fetchTeamsData();
    setIsRegisterTeamDialogOpen(false);
  };

  const handleUpdateRanks = async () => {
    setIsUpdatingRanks(true);
    try {
      // TODO: Modify updateAllTeamRanks to accept leagueId
      await updateAllTeamRanks(leagueId); 
      toast({
        title: "Posiciones Actualizadas",
        description: "Los rangos del equipo se han recalculado y actualizado con éxito.",
      });
      fetchTeamsData(); 
    } catch (err) {
      console.error("Error updating ranks:", err);
      toast({
        variant: "destructive",
        title: "Rank Update Failed",
        description: "No se pudieron actualizar los rangos del equipo. Inténtalo de nuevo.",
      });
    } finally {
      setIsUpdatingRanks(false);
    }
  };

  const handlePrint = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const tableColumn = columns.map(col => col.label);
    const tableRows: (string | number)[][] = [];

    sortedTeams.forEach(team => {
      const teamData = columns.map(col => team[col.key]);
      tableRows.push(teamData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      theme: 'grid',
      headStyles: { fillColor: [63, 81, 181] },
      styles: { font: 'PT Sans', fontSize: 9 },
    });
    doc.text(`Tabla de Posiciones - ${leagueName}`, 14, 15);
    doc.save('tabla-de-posiciones.pdf');
  };
  
  const SortIcon = ({ columnKey }: { columnKey: keyof TeamStats }) => {
    if (sortKey !== columnKey) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    return sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const canRegisterTeams = userProfile?.role === 'Administrator' || userProfile?.role === 'Creator';
  const canRecalculateRanks = userProfile?.role === 'Member' || userProfile?.role === 'Administrator' || userProfile?.role === 'Creator';
  const canUpdateStats = userProfile?.role === 'Member' || userProfile?.role === 'Administrator' || userProfile?.role === 'Creator';
  const canView = !!userProfile?.role; 

  if (!leagueId && !isLoading) {
     return (
      <div className="flex flex-col items-center justify-center h-64 text-destructive">
        <AlertTriangle className="h-12 w-12" />
        <p className="mt-4">No league selected. Please go to the dashboard to select a league.</p>
      </div>
    );
  }

  if (isLoading && !isUpdatingRanks) { 
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando Tabla de posiciones...</p>
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
          <CardTitle className="font-headline text-xl sm:text-2xl">Tabla de Posiciones</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto no-print-header-actions">
            {canRegisterTeams && (
              <Dialog open={isRegisterTeamDialogOpen} onOpenChange={setIsRegisterTeamDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full sm:w-auto"
                    disabled={isLoading || isUpdatingRanks}
                  >
                    <PlusSquare className="h-4 w-4" />
                    <span className="ml-2">Registrar Equipo</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">Register New Team</DialogTitle>
                  </DialogHeader>
                  <RegisterTeamForm 
                    leagueId={leagueId} // Pass leagueId
                    onTeamRegistered={handleTeamRegistered} 
                    onCloseDialog={() => setIsRegisterTeamDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            )}
            {canRecalculateRanks && (
              <Button 
                onClick={handleUpdateRanks} 
                disabled={isUpdatingRanks || isLoading} 
                variant="outline" 
                size="sm"
                className="w-full sm:w-auto"
              >
                {isUpdatingRanks ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BarChartHorizontalBig className="h-4 w-4" />
                )}
                <span className="ml-2">Actualizar posiciones</span>
              </Button>
            )}
             {canView && (
              <Button 
                onClick={handlePrint} 
                variant="outline" 
                size="sm"
                className="w-full sm:w-auto"
                disabled={isLoading || isUpdatingRanks}
              >
                <Printer className="h-4 w-4" />
                <span className="ml-2">Imprimir PDF</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableCaption className="text-left">
                *Clasificación oficial de la liga. 
                <br/>*Haz clic en los encabezados para ordenar. 
                <br/>*Usa acciones para analizar o editar las estadísticas del equipo.
              </TableCaption>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead 
                      key={col.key} 
                      onClick={() => col.key !== 'name' && handleSort(col.key)} 
                      className={`cursor-pointer hover:bg-muted/50 whitespace-nowrap ${col.numeric ? 'text-right' : 'text-left'}`}
                      title={`Sort by ${col.label}`}
                    >
                      <div className={`flex items-center ${col.numeric ? 'justify-end' : 'justify-start'}`}>
                        <span className="sm:hidden">{col.shortLabel || col.label}</span>
                        <span className="hidden sm:inline">{col.label}</span>
                        {col.key !== 'name' && <SortIcon columnKey={col.key} />}
                      </div>
                    </TableHead>
                  ))}
                  {(canUpdateStats || canView) && <TableHead className="text-center whitespace-nowrap no-print-actions">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTeams.map((team) => (
                  <TableRow key={team.id}>
                    {columns.map((col) => (
                      <TableCell key={`${team.id}-${col.key}`} className={`${col.numeric ? 'text-right' : 'text-left'} ${col.key === 'name' ? 'font-semibold whitespace-nowrap' : ''}`}>
                        {team[col.key]}
                      </TableCell>
                    ))}
                    {(canUpdateStats || canView) && (
                      <TableCell className="text-center space-x-1 whitespace-nowrap no-print-actions">
                        {canView && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openAnalysisDialog(team)}
                            className="text-primary hover:text-primary/80 px-2"
                            title={`Analyze ${team.name}'s performance`}
                            disabled={isUpdatingRanks}
                          >
                            <BrainCircuit className="h-5 w-5" />
                            <span className="sr-only">Analizar</span>
                          </Button>
                        )}
                        {canUpdateStats && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openUpdateStatsDialog(team)}
                            className="text-accent hover:text-accent/80 px-2"
                            title={`Edit ${team.name}'s stats`}
                            disabled={isUpdatingRanks}
                          >
                            <Pencil className="h-5 w-5" />
                            <span className="sr-only">Editar Stats</span>
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {canView && selectedTeamForAnalysis && (
        <TeamPerformanceDialog
          team={selectedTeamForAnalysis}
          isOpen={isAnalysisDialogOpen}
          onClose={closeAnalysisDialog}
        />
      )}
      {canUpdateStats && selectedTeamForUpdate && (
        <UpdateTeamStatsDialog
          team={selectedTeamForUpdate}
          leagueId={leagueId} // Pass leagueId
          isOpen={isUpdateStatsDialogOpen}
          onClose={closeUpdateStatsDialog}
          onTeamUpdate={handleTeamStatsUpdated}
        />
      )}
    </>
  );
}

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
