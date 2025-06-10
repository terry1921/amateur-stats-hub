
'use client';

import { useState, useEffect } from "react";
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppHeader } from "@/components/layout/Header";
import { LeagueTable } from "@/components/league/LeagueTable";
import { MatchSchedule } from "@/components/schedule/MatchSchedule";
import { ListOrdered, CalendarDays, type LucideIcon, Loader2, LogOut, Users, LayoutDashboard } from "lucide-react";
import { getLeagues, type League } from "@/services/firestoreService"; // To fetch league name

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

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  useEffect(() => {
    async function fetchLeagueName() {
      if (leagueId) {
        setIsLoadingLeagueName(true);
        try {
          // This is a bit inefficient if getLeagues fetches all leagues.
          // A getLeagueById function would be better. For now, let's filter.
          const leagues = await getLeagues();
          const currentLeague = leagues.find(l => l.id === leagueId);
          setLeagueName(currentLeague?.name || "League");
        } catch (error) {
          console.error("Error fetching league name:", error);
          setLeagueName("League"); // Fallback name
        } finally {
          setIsLoadingLeagueName(false);
        }
      }
    }
    fetchLeagueName();
  }, [leagueId]);

  if (loading || !currentUser || !leagueId || isLoadingLeagueName) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        {leagueId ? <p className="ml-3">Loading league data...</p> : <p  className="ml-3">Identifying league...</p>}
      </div>
    );
  }
  
  const mainNavItemsWithComponents: NavItemComponent[] = [
    { ...mainViewNavItemsData[0], component: (id) => <LeagueTable leagueId={id} /> },
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
        <h2 className="text-2xl font-bold mb-6 text-foreground">{leagueName || 'League'} View</h2>
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
