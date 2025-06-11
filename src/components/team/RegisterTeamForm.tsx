
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { addTeam } from '@/services/firestoreService'; // addTeam will need leagueId
import { Loader2, AlertTriangle } from 'lucide-react';
import { DialogFooter, DialogClose } from '@/components/ui/dialog';

const formSchema = z.object({
  teamName: z
    .string()
    .min(2, { message: 'Team name must be at least 2 characters.' })
    .max(50, { message: 'Team name must not exceed 50 characters.' }),
});

interface RegisterTeamFormProps {
  leagueId: string; // New prop
  onTeamRegistered?: () => void;
  onCloseDialog?: () => void;
}

export function RegisterTeamForm({ leagueId, onTeamRegistered, onCloseDialog }: RegisterTeamFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teamName: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setError(null);
    if (!leagueId) {
        setError('League ID is missing. Cannot register team.');
        setIsSubmitting(false);
        toast({ variant: 'destructive', title: 'Error', description: 'League ID is missing.' });
        return;
    }
    try {
      await addTeam(values.teamName, leagueId); // Pass leagueId to addTeam
      toast({
        title: 'Team Registered!',
        description: `${values.teamName} has been successfully registered to the league.`,
      });
      form.reset();
      onTeamRegistered?.(); 
      onCloseDialog?.(); 
    } catch (err) {
      console.error('Error registering team:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to register team: ${errorMessage}`);
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: `Could not register the team. ${errorMessage}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="teamName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="teamName">Team Name</FormLabel>
                  <FormControl>
                    <Input id="teamName" placeholder="e.g., The All Stars" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <div className="flex items-center p-3 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span>{error}</span>
              </div>
            )}
            
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={onCloseDialog} disabled={isSubmitting}>Cancel</Button>
              </DialogClose>
              <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  'Register Team'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
  );
}
