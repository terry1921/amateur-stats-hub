
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertTriangle } from 'lucide-react';
import { type UserProfile, type UserRole, USER_ROLES } from '@/types'; // Assuming USER_ROLES is exported from types
import { updateUserRole } from '@/services/firestoreService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';


const editUserRoleSchema = z.object({
  role: z.enum(USER_ROLES), // Ensure USER_ROLES is a Zod-compatible enum or array
});

interface EditUserRoleDialogProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onRoleUpdated: () => void;
}

export function EditUserRoleDialog({ user, isOpen, onClose, onRoleUpdated }: EditUserRoleDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { currentUser: currentAuthUser } = useAuth();


  const form = useForm<z.infer<typeof editUserRoleSchema>>({
    resolver: zodResolver(editUserRoleSchema),
    defaultValues: {
      role: user?.role || 'Viewer',
    },
  });

  useEffect(() => {
    if (user && isOpen) {
      form.reset({
        role: user.role,
      });
      setError(null);
    }
  }, [user, isOpen, form]);

  async function onSubmit(values: z.infer<typeof editUserRoleSchema>) {
    if (!user) return;

    if (user.uid === currentAuthUser?.uid && user.role === 'Creator' && values.role !== 'Creator') {
        toast({
            variant: 'destructive',
            title: 'Action Restricted',
            description: 'Creators cannot demote themselves.',
        });
        return;
    }


    setIsSubmitting(true);
    setError(null);

    try {
      await updateUserRole(user.uid, values.role);
      toast({
        title: 'Role Updated!',
        description: `${user.displayName || user.email}'s role has been updated to ${values.role}.`,
      });
      onRoleUpdated();
      onClose();
    } catch (e) {
      console.error('Error updating user role:', e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to update role: ${errorMessage}`);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: `Could not update user role. ${errorMessage}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Edit Role for {user.displayName || user.email}</DialogTitle>
          <DialogDescription>
            Select a new role for this user. Current role: <strong>{user.role}</strong>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Role</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value} 
                    disabled={isSubmitting || (user.uid === currentAuthUser?.uid && user.role === 'Creator')}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {USER_ROLES.map((roleOption) => (
                        <SelectItem key={roleOption} value={roleOption}>
                          {roleOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  { (user.uid === currentAuthUser?.uid && user.role === 'Creator') &&
                     <p className="text-sm text-muted-foreground">Creators cannot change their own role.</p>
                  }
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
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
              </DialogClose>
              <Button 
                type="submit" 
                disabled={isSubmitting || (user.uid === currentAuthUser?.uid && user.role === 'Creator')}
              >
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
