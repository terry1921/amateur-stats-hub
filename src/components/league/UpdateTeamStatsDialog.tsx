
'use client';

import type { ReactNode } from 'react';
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
import { Loader2, AlertTriangle } from 'lucide-react';
import type { TeamStats } from '@/types';
import { updateTeamStats, type UpdateTeamStatsInput } from '@/services/firestoreService';
import { useToast } from '@/hooks/use-toast';

interface UpdateTeamStatsDialogProps {
  team: TeamStats | null;
  isOpen: boolean;
  onClose: () => void;
  onTeamUpdate: () => void; // Callback to refresh data in parent
}

const updateTeamStatsSchema = z.object({
  played: z.coerce.number().int().min(0, "Played matches cannot be negative."),
  won: z.coerce.number().int().min(0, "Won matches cannot be negative."),
  drawn: z.coerce.number().int().min(0, "Drawn matches cannot be negative."),
  lost: z.coerce.number().int().min(0, "Lost matches cannot be negative."),
  goalsScored: z.coerce.number().int().min(0, "Goals scored cannot be negative."),
  goalsConceded: z.coerce.number().int().min(0, "Goals conceded cannot be negative."),
}).refine(data => data.played >= (data.won + data.drawn + data.lost), {
  message: "Played matches must be sum of won, drawn, and lost.",
  path: ["played"],
});


export function UpdateTeamStatsDialog({ team, isOpen, onClose, onTeamUpdate }: UpdateTeamStatsDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof updateTeamStatsSchema>>({
    resolver: zodResolver(updateTeamStatsSchema),
    defaultValues: {
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsScored: 0,
      goalsConceded: 0,
    },
  });

  useEffect(() => {
    if (team && isOpen) {
      form.reset({
        played: team.played,
        won: team.won,
        drawn: team.drawn,
        lost: team.lost,
        goalsScored: team.goalsScored,
        goalsConceded: team.goalsConceded,
      });
      setError(null); // Clear previous errors
    }
  }, [team, isOpen, form]);

  async function onSubmit(values: z.infer<typeof updateTeamStatsSchema>) {
    if (!team) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const statsInput: UpdateTeamStatsInput = {
        played: values.played,
        won: values.won,
        drawn: values.drawn,
        lost: values.lost,
        goalsScored: values.goalsScored,
        goalsConceded: values.goalsConceded,
      };
      await updateTeamStats(team.id, statsInput);
      toast({
        title: 'Stats Updated!',
        description: `${team.name}'s stats have been successfully updated.`,
      });
      onTeamUpdate(); // Trigger data refresh in parent
      onClose(); // Close dialog
    } catch (e) {
      console.error('Error updating team stats:', e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to update stats: ${errorMessage}`);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: `Could not update team stats. ${errorMessage}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!team) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Update Stats: {team.name}</DialogTitle>
          <DialogDescription>
            Modify the statistics for {team.name}. Goal difference and points will be recalculated.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="played"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Played</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="won"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Won</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="drawn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Drawn</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lost</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="goalsScored"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goals Scored</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="goalsConceded"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goals Conceded</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {error && (
              <div className="flex items-center p-3 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span>{error}</span>
              </div>
            )}
            
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
