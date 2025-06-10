
'use client';

import type { ReactNode } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getAllUsers, type UserProfile } from '@/services/firestoreService';
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
import { Loader2, AlertTriangle, Users as UsersIcon, ShieldCheck, Edit, ShieldX } from 'lucide-react';
import { EditUserRoleDialog } from '@/components/admin/users/EditUserRoleDialog';
import { AppHeader } from '@/components/layout/Header'; // For consistent layout
import { useToast } from '@/hooks/use-toast';

const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-lg ${className}`} {...props} />
);
const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />
);
const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`text-xl sm:text-2xl font-headline font-semibold leading-none tracking-tight ${className}`} {...props} />
);
const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-6 pt-0 ${className}`} {...props} />
);


export default function UserManagementPage() {
  const { currentUser, userProfile, loading: authLoading, signOutUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserProfile | null>(null);
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    setError(null);
    try {
      const users = await getAllUsers();
      setUsersList(users);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load user list. Please try again later.');
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch user list.' });
    } finally {
      setIsLoadingUsers(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser || userProfile?.role !== 'Creator') {
        toast({ variant: 'destructive', title: 'Access Denied', description: 'You do not have permission to view this page.' });
        router.push('/');
      } else {
        fetchUsers();
      }
    }
  }, [currentUser, userProfile, authLoading, router, fetchUsers, toast]);

  const openEditRoleDialog = (user: UserProfile) => {
    setSelectedUserForEdit(user);
    setIsEditRoleDialogOpen(true);
  };

  const closeEditRoleDialog = () => {
    setIsEditRoleDialogOpen(false);
    setSelectedUserForEdit(null);
  };

  const handleRoleUpdated = () => {
    fetchUsers(); // Refresh the list after a role is updated
  };

  if (authLoading || (!currentUser && !authLoading) || (userProfile?.role !== 'Creator' && !authLoading) ) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // Header nav items (can be empty if not applicable for this page or simplified)
   const navItemsForMenu = [
    { value: "dashboard", label: "Dashboard", icon: ShieldCheck, action: () => router.push('/') },
    { value: "sign-out", label: "Sign Out", icon: ShieldX, action: signOutUser }
  ];


  let content: ReactNode;

  if (isLoadingUsers) {
    content = (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading user list...</p>
      </div>
    );
  } else if (error) {
    content = (
      <div className="flex flex-col items-center justify-center h-64 text-destructive">
        <AlertTriangle className="h-12 w-12" />
        <p className="mt-4">{error}</p>
      </div>
    );
  } else {
    content = (
      <div className="overflow-x-auto">
        <Table>
          <TableCaption>
            <br/>*Lista de usuarios creados. 
            <br/>*Los creadores pueden editar los valores de usuarios.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Correo</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersList.map((user) => (
              <TableRow key={user.uid}>
                <TableCell className="font-medium">{user.email || 'N/A'}</TableCell>
                <TableCell>{user.displayName || 'N/A'}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditRoleDialog(user)}
                    className="text-primary hover:text-primary/80 px-2"
                    title={`Edit role for ${user.email}`}
                    disabled={user.uid === currentUser?.uid && user.role === 'Creator'} // Prevent creator from demoting themselves easily
                  >
                    <Edit className="h-5 w-5" />
                    <span className="sr-only">Editar rol</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
     <div className="flex flex-col min-h-screen bg-background">
        <AppHeader
            activeTab="user-management" // Or a unique identifier for this page
            onTabChange={(value) => {
              const item = navItemsForMenu.find(nav => nav.value === value);
              item?.action?.();
            }}
            navItemsForMenu={navItemsForMenu.map(i => ({value: i.value, label: i.label, icon: i.icon}))}
            onSignOut={signOutUser}
            showUserManagementButton={false} // Already on user management page
        />
      <main className="flex-grow container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <UsersIcon className="h-7 w-7 text-primary" />
              <CardTitle>Gestión de usuarios</CardTitle>
            </div>
          </CardHeader>
          <CardContent>{content}</CardContent>
        </Card>
      </main>
      <footer className="text-center py-4 text-sm text-muted-foreground border-t">
        {currentYear !== null ? <p>&copy; {currentYear} Amateur Stats Hub. All rights reserved.</p> : <p>&copy; Amateur Stats Hub. All rights reserved.</p>}
      </footer>
      {selectedUserForEdit && (
        <EditUserRoleDialog
          user={selectedUserForEdit}
          isOpen={isEditRoleDialogOpen}
          onClose={closeEditRoleDialog}
          onRoleUpdated={handleRoleUpdated}
        />
      )}
    </div>
  );
}
