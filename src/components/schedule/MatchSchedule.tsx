
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { MatchInfo } from '@/types';
import { MatchCard } from './MatchCard';
import { getMatches, deleteMatch } from '@/services/firestoreService';
import { Loader2, AlertTriangle, PlusSquare, Trash2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddMatchDialog } from './AddMatchDialog';
import { UpdateMatchScoreDialog } from './UpdateMatchScoreDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

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
  const { userProfile } = useAuth();
  const [matches, setMatches] = useState<MatchInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddMatchDialogOpen, setIsAddMatchDialogOpen] = useState(false);
  
  const [selectedMatchForEdit, setSelectedMatchForEdit] = useState<MatchInfo | null>(null);
  const [isUpdateScoreDialogOpen, setIsUpdateScoreDialogOpen] = useState(false);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [matchIdToDelete, setMatchIdToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

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
      .sort((a,b) => a.dateTime.getTime() - b.dateTime.getTime());
  }, [matches]);

  const pastMatches = useMemo(() => {
    const now = new Date();
    return matches
      .filter(match => match.dateTime < now)
      .sort((a,b) => b.dateTime.getTime() - a.dateTime.getTime());
  }, [matches]);

  const handleMatchAdded = () => {
    fetchMatches();
  };

  const openUpdateScoreDialog = (match: MatchInfo) => {
    setSelectedMatchForEdit(match);
    setIsUpdateScoreDialogOpen(true);
  };

  const closeUpdateScoreDialog = () => {
    setIsUpdateScoreDialogOpen(false);
    setSelectedMatchForEdit(null);
  };

  const handleScoreUpdated = () => {
    fetchMatches();
  };

  const handleOpenDeleteDialog = (matchId: string) => {
    setMatchIdToDelete(matchId);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteMatch = async () => {
    if (!matchIdToDelete) return;
    setIsDeleting(true);
    try {
      await deleteMatch(matchIdToDelete);
      toast({
        title: "Partido Eliminado",
        description: "El partido ha sido eliminado exitosamente.",
      });
      fetchMatches();
    } catch (err) {
      console.error("Error deleting match:", err);
      toast({
        variant: "destructive",
        title: "Eliminado fallido",
        description: "No se pudo eliminar el partido, Inténtalo de nuevo.",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteConfirmOpen(false);
      setMatchIdToDelete(null);
    }
  };

  const handlePrintUpcomingMatches = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const tableColumn = ["Fecha", "Hora", "Equipo local", "Equipo visitante", "Ubicación"];
    const tableRows: (string | number)[][] = [];

    upcomingMatches.forEach(match => {
      const matchData = [
        format(match.dateTime, 'yyyy-MM-dd'),
        format(match.dateTime, 'HH:mm'),
        match.homeTeam,
        match.awayTeam,
        match.location,
      ];
      tableRows.push(matchData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      theme: 'grid',
      headStyles: { fillColor: [63, 81, 181] },
      styles: { font: 'PT Sans', fontSize: 9 },
    });
    doc.text("Partidos por jugar - Amateur Stats Hub", 14, 15);
    doc.save('calendario-de-partidos.pdf');
  };

  const canManageMatches = userProfile?.role === 'Administrator' || userProfile?.role === 'Creator';
  const canView = !!userProfile?.role; // All authenticated users can view
  const canEditScore = userProfile?.role === 'Member' || userProfile?.role === 'Administrator' || userProfile?.role === 'Creator';

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
    <div className="space-y-8">
      <Card className="shadow-lg print-card-plain">
        <CardHeader className="flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <CardTitle className="font-headline text-xl sm:text-2xl">Próximos partidos</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto no-print-header-actions">
            {canManageMatches && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsAddMatchDialogOpen(true)}
                className="w-full sm:w-auto"
                disabled={isLoading}
              >
                <PlusSquare className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Agregar Partido</span>
                <span className="ml-2 sm:hidden">Agregar</span>
              </Button>
            )}
            {canView && (
              <Button 
                onClick={handlePrintUpcomingMatches} 
                variant="outline" 
                size="sm"
                className="w-full sm:w-auto"
                disabled={isLoading || upcomingMatches.length === 0}
              >
                <Printer className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Imprimir Calendario</span>
                <span className="ml-2 sm:hidden">Imprimir</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {upcomingMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingMatches.map((match) => (
                <MatchCard 
                  key={match.id} 
                  match={match} 
                  onEditMatch={openUpdateScoreDialog}
                  onDeleteMatch={handleOpenDeleteDialog}
                  userRole={userProfile?.role}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No hay próximos partidos programados.</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg print-card-plain">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="font-headline text-xl sm:text-2xl">Partidos Pasados</CardTitle>
        </CardHeader>
        <CardContent>
          {pastMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastMatches.map((match) => (
                <MatchCard 
                  key={match.id} 
                  match={match} 
                  onEditMatch={openUpdateScoreDialog}
                  onDeleteMatch={handleOpenDeleteDialog}
                  userRole={userProfile?.role}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No hay partidos pasados para mostrar.</p>
          )}
        </CardContent>
      </Card>

      {canManageMatches && (
        <AddMatchDialog
          isOpen={isAddMatchDialogOpen}
          onClose={() => setIsAddMatchDialogOpen(false)}
          onMatchAdded={handleMatchAdded}
        />
      )}
      {canEditScore && selectedMatchForEdit && (
         <UpdateMatchScoreDialog
          match={selectedMatchForEdit}
          isOpen={isUpdateScoreDialogOpen}
          onClose={closeUpdateScoreDialog}
          onScoreUpdated={handleScoreUpdated}
        />
      )}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estas completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminara el partido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteMatch} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" /> }
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
