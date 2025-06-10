
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { addTeam } from '@/services/firestoreService';
import { Loader2, AlertTriangle } from 'lucide-react';

const formSchema = z.object({
  teamName: z
    .string()
    .min(2, { message: 'Team name must be at least 2 characters.' })
    .max(50, { message: 'Team name must not exceed 50 characters.' }),
});

export function RegisterTeamForm() {
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
    try {
      const newTeamId = await addTeam(values.teamName);
      toast({
        title: 'Team Registered!',
        description: `${values.teamName} has been successfully registered.`,
      });
      form.reset();
      // Optionally, you might want to trigger a re-fetch of the league table data here
      // or navigate the user, or provide more prominent success feedback.
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
    <Card className="w-full max-w-lg mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Register New Team</CardTitle>
        <CardDescription>Enter the name of the new team to add them to the league.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                'Register Team'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
