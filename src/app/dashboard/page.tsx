
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getLeagues, type League } from '@/services/firestoreService';
import { AppHeader } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { CreateLeagueDialog } from '@/components/dashboard/CreateLeagueDialog';
import { Loader2, AlertTriangle, Users, LogOut, PlusSquare, Trophy, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { currentUser, userProfile, loading: authLoading, signOutUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [leagues, setLeagues] = useState<League[]>([]);
  const [isLoadingLeagues, setIsLoadingLeagues] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateLeagueDialogOpen, setIsCreateLeagueDialogOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const fetchLeagues = useCallback(async () => {
    setIsLoadingLeagues(true);
    setError(null);
    try {
      const fetchedLeagues = await getLeagues();
      setLeagues(fetchedLeagues);
    } catch (err) {
      console.error('Error fetching leagues:', err);
      setError('Failed to load leagues. Please try again later.');
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch leagues.' });
    } finally {
      setIsLoadingLeagues(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        router.push('/login');
      } else {
        fetchLeagues();
      }
    }
  }, [currentUser, authLoading, router, fetchLeagues]);

  const handleLeagueCreated = () => {
    fetchLeagues(); // Refresh the list after a new league is created
    setIsCreateLeagueDialogOpen(false);
  };

  if (authLoading || (!currentUser && !authLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const canCreateLeague = userProfile?.role === 'Creator'; // Updated this line

  const navItemsForMenu = [];
   if (userProfile?.role === 'Creator') {
      navItemsForMenu.push({ value: "user-management", label: "User Management", icon: Users, action: () => router.push('/admin/users') });
    }
  navItemsForMenu.push({ value: "sign-out", label: "Sign Out", icon: LogOut, action: signOutUser });


  let leagueContent;
  if (isLoadingLeagues) {
    leagueContent = (
      <div className="flex flex-col items-center justify-center h-40">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Loading leagues...</p>
      </div>
    );
  } else if (error) {
    leagueContent = (
      <div className="flex flex-col items-center justify-center h-40 text-destructive">
        <AlertTriangle className="h-10 w-10" />
        <p className="mt-3">{error}</p>
      </div>
    );
  } else if (leagues.length === 0) {
    leagueContent = (
      <div className="text-center py-10">
        <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-lg font-medium text-foreground">No leagues found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {canCreateLeague ? "Get started by creating a new league." : "Ask an administrator to create a league."}
        </p>
        {canCreateLeague && (
           <Dialog open={isCreateLeagueDialogOpen} onOpenChange={setIsCreateLeagueDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4">
                <PlusSquare className="mr-2 h-5 w-5" /> Create New League
              </Button>
            </DialogTrigger>
            <CreateLeagueDialog
              isOpen={isCreateLeagueDialogOpen}
              onClose={() => setIsCreateLeagueDialogOpen(false)}
              onLeagueCreated={handleLeagueCreated}
            />
          </Dialog>
        )}
      </div>
    );
  } else {
    leagueContent = (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {leagues.map((league) => (
          <Link key={league.id} href={`/leagues/${league.id}/view`} passHref>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
              <CardHeader>
                <CardTitle className="font-headline text-xl text-primary">{league.name}</CardTitle>
                <CardDescription>Created: {league.createdAt ? format(league.createdAt, 'PPP') : 'N/A'}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-end">
                 <Button variant="outline" className="w-full mt-auto">
                    View League <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader
        navItemsForMenu={navItemsForMenu.map(i => ({value: i.value, label: i.label, icon: i.icon}))}
        onTabChange={(value) => { // Simplified as dashboard has no local tabs
          const item = navItemsForMenu.find(nav => nav.value === value);
          item?.action?.();
        }}
        onSignOut={signOutUser}
        showUserManagementButton={userProfile?.role === 'Creator'}
        showDashboardButton={false} // Already on dashboard
      />
      <main className="flex-grow container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-headline font-bold text-foreground">League Dashboard</h2>
          {canCreateLeague && leagues.length > 0 && (
            <Dialog open={isCreateLeagueDialogOpen} onOpenChange={setIsCreateLeagueDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <PlusSquare className="mr-2 h-5 w-5" /> Create New League
                </Button>
              </DialogTrigger>
              <CreateLeagueDialog
                isOpen={isCreateLeagueDialogOpen}
                onClose={() => setIsCreateLeagueDialogOpen(false)}
                onLeagueCreated={handleLeagueCreated}
              />
            </Dialog>
          )}
        </div>
        {leagueContent}
      </main>
      <footer className="text-center py-4 text-sm text-muted-foreground border-t">
        {currentYear !== null ? <p>&copy; {currentYear} Amateur Stats Hub. All rights reserved.</p> : <p>&copy; Amateur Stats Hub. All rights reserved.</p>}
      </footer>
    </div>
  );
}
