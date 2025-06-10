
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
import { Loader2, AlertTriangle } from 'lucide-react';
import type { MatchInfo } from '@/types';
import { updateMatchScore } from '@/services/firestoreService';
import { useToast } from '@/hooks/use-toast';

interface UpdateMatchScoreDialogProps {
  match: MatchInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onScoreUpdated: () => void;
}

const scoreSchema = z.object({
  homeScore: z.coerce.number().int().min(0, "Score must be a non-negative integer."),
  awayScore: z.coerce.number().int().min(0, "Score must be a non-negative integer."),
});

export function UpdateMatchScoreDialog({ match, isOpen, onClose, onScoreUpdated }: UpdateMatchScoreDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof scoreSchema>>({
    resolver: zodResolver(scoreSchema),
    defaultValues: {
      homeScore: 0,
      awayScore: 0,
    },
  });

  useEffect(() => {
    if (match && isOpen) {
      form.reset({
        homeScore: match.homeScore ?? 0,
        awayScore: match.awayScore ?? 0,
      });
      setError(null);
    }
  }, [match, isOpen, form]);

  async function onSubmit(values: z.infer<typeof scoreSchema>) {
    if (!match) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await updateMatchScore(match.id, values.homeScore, values.awayScore);
      toast({
        title: 'Score Updated!',
        description: `Score for ${match.homeTeam} vs ${match.awayTeam} updated to ${values.homeScore} - ${values.awayScore}.`,
      });
      onScoreUpdated();
      onClose();
    } catch (e) {
      console.error('Error updating match score:', e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to update score: ${errorMessage}`);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: `Could not update score. ${errorMessage}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!match) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Update Score</DialogTitle>
          <DialogDescription>
            Set the score for {match.homeTeam} vs {match.awayTeam}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="homeScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{match.homeTeam} Score</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="awayScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{match.awayTeam} Score</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && (
              <div className="flex items-center p-3 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md">
                <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="break-words">{error}</span>
              </div>
            )}
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Score...
                  </>
                ) : (
                  'Save Score'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
