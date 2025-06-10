
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { addMatch, type NewMatchInput } from '@/services/firestoreService';

interface AddMatchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onMatchAdded: () => void;
}

const addMatchSchema = z.object({
  homeTeam: z.string().min(1, "Home team name is required.").max(50, "Home team name is too long."),
  awayTeam: z.string().min(1, "Away team name is required.").max(50, "Away team name is too long."),
  location: z.string().min(1, "Location is required.").max(100, "Location name is too long."),
  date: z.date({ required_error: "Match date is required." }),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)."),
}).refine(data => data.homeTeam.toLowerCase() !== data.awayTeam.toLowerCase(), {
  message: "Home and away teams cannot be the same.",
  path: ["awayTeam"], 
});


export function AddMatchDialog({ isOpen, onClose, onMatchAdded }: AddMatchDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof addMatchSchema>>({
    resolver: zodResolver(addMatchSchema),
    defaultValues: {
      homeTeam: '',
      awayTeam: '',
      location: '',
      date: undefined, // Initialize date as undefined
      time: '', // e.g., "14:00"
    },
  });

  useEffect(() => {
    if (!isOpen) {
      form.reset();
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, form]);

  async function onSubmit(values: z.infer<typeof addMatchSchema>) {
    setIsSubmitting(true);
    setError(null);

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
        title: 'Match Added!',
        description: `Match between ${values.homeTeam} and ${values.awayTeam} has been scheduled.`,
      });
      onMatchAdded();
      onClose();
    } catch (e) {
      console.error('Error adding match:', e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to add match: ${errorMessage}`);
      toast({
        variant: 'destructive',
        title: 'Add Match Failed',
        description: `Could not add the match. ${errorMessage}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl">Add New Match</DialogTitle>
          <DialogDescription>
            Enter the details for the new match.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="homeTeam"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Home Team</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter home team name" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="awayTeam"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Away Team</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter away team name" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter match location" {...field} disabled={isSubmitting} />
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
                    <FormLabel>Date</FormLabel>
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
                              <span>Pick a date</span>
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
                            date < new Date(new Date().setHours(0,0,0,0)) // Disable past dates
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
                    <FormLabel>Time (HH:MM)</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
