
'use client';

import { useState, useEffect } from "react";
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppHeader } from "@/components/layout/Header";
import { LeagueTable } from "@/components/league/LeagueTable";
import { MatchSchedule } from "@/components/schedule/MatchSchedule";
import { ListOrdered, CalendarDays, type LucideIcon, Loader2, LogOut, Users, LayoutDashboard, AlertTriangle } from "lucide-react";
import { getLeagueById } from "@/services/firestoreService"; // Import getLeagueById

interface NavItemBase {
  value: string;
  label: string;
  icon: LucideIcon;
}
interface NavItemComponent extends NavItemBase {
  component: (leagueId: string) => JSX.Element; // component now takes leagueId
}

interface NavItemAction extends NavItemBase {
  action: () => void;
}

type NavItem = NavItemComponent | NavItemAction;

const mainViewNavItemsData: Omit<NavItemComponent, 'component'>[] = [
  { value: "league-table", label: "Tabla de Posiciones", icon: ListOrdered },
  { value: "match-schedule", label: "Calendario", icon: CalendarDays },
];

export default function LeagueViewPage() {
  const { currentUser, userProfile, loading, signOutUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const leagueId = params.leagueId as string;

  const [activeTab, setActiveTab] = useState<string>(mainViewNavItemsData[0].value);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [leagueName, setLeagueName] = useState<string | null>(null);
  const [isLoadingLeagueName, setIsLoadingLeagueName] = useState(true);
  const [leagueError, setLeagueError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  useEffect(() => {
    async function fetchLeagueDetails() {
      if (leagueId) {
        setIsLoadingLeagueName(true);
        setLeagueError(null);
        try {
          const currentLeague = await getLeagueById(leagueId);
          if (currentLeague) {
            setLeagueName(currentLeague.name);
          } else {
            setLeagueName("Liga no encontrada");
            setLeagueError(`No se pudo encontrar una liga con el ID: ${leagueId}. Por favor regrese al dashboard.`);
          }
        } catch (error) {
          console.error("Error fetching league details:", error);
          setLeagueName("Error al cargar la liga");
          setLeagueError("No se pudo cargar la información de la liga. Por favor, inténtalo de nuevo más tarde.");
        } finally {
          setIsLoadingLeagueName(false);
        }
      } else {
        setLeagueError("No se proporcionó ID de liga.");
        setIsLoadingLeagueName(false);
      }
    }
    fetchLeagueDetails();
  }, [leagueId]);

  if (loading || !currentUser || !leagueId || isLoadingLeagueName) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        {isLoadingLeagueName && <p className="ml-3 mt-2">Cargando datos de la liga...</p>}
        {!leagueId && <p className="ml-3 mt-2">Identificando liga...</p>}
      </div>
    );
  }

  if (leagueError && !isLoadingLeagueName) {
     return (
      <div className="flex flex-col min-h-screen bg-background">
         <AppHeader
            activeTab={activeTab}
            onTabChange={() => {}}
            navItemsForMenu={getNavItemsForMenu().map(item => ({value: item.value, label: item.label, icon: item.icon}))}
            onSignOut={signOutUser}
            showUserManagementButton={userProfile?.role === 'Creator'}
            showDashboardButton={true}
          />
        <main className="flex-grow container mx-auto py-8 px-4 flex flex-col items-center justify-center">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-foreground">Error al cargar la liga</h2>
          <p className="text-muted-foreground text-center mb-6">{leagueError}</p>
          <Button onClick={() => router.push('/dashboard')}>Volver al Dashboard</Button>
        </main>
         <footer className="text-center py-4 text-sm text-muted-foreground border-t">
            {currentYear !== null ? <p>&copy; {currentYear} Amateur Stats Hub. All rights reserved.</p> : <p>&copy; Amateur Stats Hub. All rights reserved.</p>}
        </footer>
      </div>
    );
  }
  
  const mainNavItemsWithComponents: NavItemComponent[] = [
    { ...mainViewNavItemsData[0], component: (id) => <LeagueTable leagueId={id} leagueName={leagueName} /> },
    { ...mainViewNavItemsData[1], component: (id) => <MatchSchedule leagueId={id} /> },
  ];

  const getNavItemsForMenu = (): NavItemAction[] => {
    const menuItems: NavItemAction[] = mainViewNavItemsData.map(item => ({
        ...item,
        action: () => setActiveTab(item.value)
    }));

    menuItems.unshift({ value: "dashboard", label: "Dashboard", icon: LayoutDashboard, action: () => router.push('/dashboard') });

    if (userProfile?.role === 'Creator') {
      menuItems.push({ value: "user-management", label: "User Management", icon: Users, action: () => router.push('/admin/users') });
    }
    
    menuItems.push({ value: "sign-out", label: "Sign Out", icon: LogOut, action: signOutUser });
    return menuItems;
  };

  const navItemsForMobileMenu = getNavItemsForMenu();

  const handleTabChange = (tabValue: string) => {
    const menuItem = navItemsForMobileMenu.find(item => item.value === tabValue);
    if (menuItem && 'action' in menuItem) {
        menuItem.action();
    } else if (mainViewNavItemsData.some(item => item.value === tabValue)) {
        setActiveTab(tabValue);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        navItemsForMenu={navItemsForMobileMenu.map(item => ({value: item.value, label: item.label, icon: item.icon}))}
        onSignOut={signOutUser} 
        showUserManagementButton={userProfile?.role === 'Creator'}
        showDashboardButton={true} // Show dashboard button on league view
      />
      <main className="flex-grow container mx-auto py-8 px-4">
        <h2 className="text-2xl font-bold mb-6 text-foreground">{leagueName || 'Liga'}</h2>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="hidden md:grid w-full md:w-auto md:inline-flex mb-6 bg-card shadow-sm">
            {mainViewNavItemsData.map(item => ( 
              <TabsTrigger key={item.value} value={item.value} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <item.icon className="h-5 w-5 mr-2" />
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {mainNavItemsWithComponents.map(item => (
            <TabsContent key={item.value} value={item.value}>
              {item.component(leagueId)}
            </TabsContent>
          ))}
        </Tabs>
      </main>
      <footer className="text-center py-4 text-sm text-muted-foreground border-t">
        {currentYear !== null ? <p>&copy; {currentYear} Amateur Stats Hub. All rights reserved.</p> : <p>&copy; Amateur Stats Hub. All rights reserved.</p>}
      </footer>
    </div>
  );
}
