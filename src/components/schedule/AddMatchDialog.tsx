
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { addMatch, type NewMatchInput, getTeams } from '@/services/firestoreService';
import type { TeamStats } from '@/types';

interface AddMatchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onMatchAdded: () => void;
}

const addMatchSchema = z.object({
  homeTeam: z.string().min(1, "Home team is required."),
  awayTeam: z.string().min(1, "Away team is required."),
  location: z.string().min(1, "Se requiere ubicación.").max(100, "Location name is too long."),
  date: z.date({ required_error: "La fecha del partido es obligatoria." }),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)."),
}).refine(data => data.homeTeam.toLowerCase() !== data.awayTeam.toLowerCase(), {
  message: "Los equipos locales y visitantes no pueden ser iguales.",
  path: ["awayTeam"],
});


export function AddMatchDialog({ isOpen, onClose, onMatchAdded }: AddMatchDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { toast } = useToast();

  const [teams, setTeams] = useState<TeamStats[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [fetchTeamsError, setFetchTeamsError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof addMatchSchema>>({
    resolver: zodResolver(addMatchSchema),
    defaultValues: {
      homeTeam: '',
      awayTeam: '',
      location: '',
      date: undefined,
      time: '',
    },
  });

  useEffect(() => {
    async function loadTeams() {
      if (isOpen) {
        setIsLoadingTeams(true);
        setFetchTeamsError(null);
        try {
          const fetchedTeams = await getTeams();
          setTeams(fetchedTeams.sort((a, b) => a.name.localeCompare(b.name))); // Sort teams alphabetically
        } catch (err) {
          console.error("Error fetching teams for dialog:", err);
          setFetchTeamsError("Failed to load teams. Please try again.");
        } finally {
          setIsLoadingTeams(false);
        }
      }
    }
    loadTeams();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      form.reset();
      setSubmitError(null);
      setIsSubmitting(false);
      // Optionally clear teams if they should always refetch, or keep them for faster reopening
      // setTeams([]); 
    }
  }, [isOpen, form]);

  async function onSubmit(values: z.infer<typeof addMatchSchema>) {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const matchInput: NewMatchInput = {
        homeTeam: values.homeTeam,
        awayTeam: values.awayTeam,
        location: values.location,
        date: format(values.date, 'yyyy-MM-dd'),
        time: values.time,
      };
      await addMatch(matchInput);
      toast({
        title: '¡Partido añadido!',
        description: `Partido entre ${values.homeTeam} y ${values.awayTeam} ha sido programado.`,
      });
      onMatchAdded();
      onClose();
    } catch (e) {
      console.error('Error adding match:', e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setSubmitError(`No se pudo agregar el partido: ${errorMessage}`);
      toast({
        variant: 'destructive',
        title: 'Error al agregar partido',
        description: `No se puede agregar partido. ${errorMessage}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl">Agenda un nuevo partido</DialogTitle>
          <DialogDescription>
            Introduzca los detalles para el nuevo partido.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="homeTeam"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipo Local</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting || isLoadingTeams}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingTeams ? "Loading teams..." : "Seleccione un equipo local"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {!isLoadingTeams && teams.map(team => (
                        <SelectItem key={team.id} value={team.name}>
                          {team.name}
                        </SelectItem>
                      ))}
                      {isLoadingTeams && <SelectItem value="loading" disabled>Cargando equipos...</SelectItem>}
                    </SelectContent>
                  </Select>
                  {fetchTeamsError && <p className="text-sm text-destructive">{fetchTeamsError}</p>}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="awayTeam"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipo Visitante</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting || isLoadingTeams}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingTeams ? "Loading teams..." : "Seleccione un equipo visitante"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {!isLoadingTeams && teams.map(team => (
                        <SelectItem key={team.id} value={team.name}>
                          {team.name}
                        </SelectItem>
                      ))}
                      {isLoadingTeams && <SelectItem value="loading" disabled>Cargando equipos...</SelectItem>}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ubicación</FormLabel>
                  <FormControl>
                    <Input placeholder="Introduzca la ubicación del partido" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isSubmitting}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Escoja una fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0,0,0,0)) 
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora (HH:MM)</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {submitError && (
              <div className="flex items-center p-3 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md">
                <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="break-words">{submitError}</span>
              </div>
            )}
            
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting || isLoadingTeams}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Match...
                  </>
                ) : (
                  'Add Match'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
