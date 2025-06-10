
'use client';

import { useState } from 'react';
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
import { addLeague } from '@/services/firestoreService';
import { useToast } from '@/hooks/use-toast';

interface CreateLeagueDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLeagueCreated: () => void;
}

const formSchema = z.object({
  leagueName: z
    .string()
    .min(3, { message: 'League name must be at least 3 characters.' })
    .max(100, { message: 'League name must not exceed 100 characters.' }),
});

export function CreateLeagueDialog({ isOpen, onClose, onLeagueCreated }: CreateLeagueDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      leagueName: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setError(null);
    try {
      await addLeague(values.leagueName);
      toast({
        title: 'League Created!',
        description: `League "${values.leagueName}" has been successfully created.`,
      });
      form.reset();
      onLeagueCreated();
    } catch (err) {
      console.error('Error creating league:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to create league: ${errorMessage}`);
      toast({
        variant: 'destructive',
        title: 'Creation Failed',
        description: `Could not create the league. ${errorMessage}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  // Reset form and error when dialog visibility changes
  useState(() => {
    if (!isOpen) {
      form.reset();
      setError(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl">Create New League</DialogTitle>
          <DialogDescription>
            Enter the name for your new sports league.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="leagueName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="leagueName">League Name</FormLabel>
                  <FormControl>
                    <Input 
                      id="leagueName" 
                      placeholder="e.g., Sunday Football Champions" 
                      {...field} 
                      disabled={isSubmitting} 
                    />
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
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create League'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
