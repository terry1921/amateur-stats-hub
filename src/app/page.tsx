
'use client';

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppHeader } from "@/components/layout/Header";
import { LeagueTable } from "@/components/league/LeagueTable";
import { MatchSchedule } from "@/components/schedule/MatchSchedule";
import { ListOrdered, CalendarDays, type LucideIcon, Loader2, LogOut, Users } from "lucide-react";

interface NavItemBase {
  value: string;
  label: string;
  icon: LucideIcon;
}
interface NavItemComponent extends NavItemBase {
  component: JSX.Element;
}

interface NavItemAction extends NavItemBase {
  action: () => void;
}

type NavItem = NavItemComponent | NavItemAction;


const mainNavItemsData: Omit<NavItemComponent, 'component'>[] = [
  { value: "league-table", label: "Tabla de Posiciones", icon: ListOrdered },
  { value: "match-schedule", label: "Calendario", icon: CalendarDays },
];

export default function Home() {
  const { currentUser, userProfile, loading, signOutUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>(mainNavItemsData[0].value);
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  if (loading || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const mainNavItemsWithComponents: NavItemComponent[] = [
    { ...mainNavItemsData[0], component: <LeagueTable /> },
    { ...mainNavItemsData[1], component: <MatchSchedule /> },
  ];

  const getNavItemsForMenu = (): NavItemAction[] => {
    const menuItems: NavItemAction[] = mainNavItemsData.map(item => ({
        ...item,
        action: () => setActiveTab(item.value) // Keep as tab change for main items
    }));

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
    } else if (mainNavItemsData.some(item => item.value === tabValue)) {
        setActiveTab(tabValue);
    }
  };


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader
        activeTab={activeTab}
        onTabChange={handleTabChange} // For mobile menu which might include non-tab actions
        navItemsForMenu={navItemsForMobileMenu.map(item => ({value: item.value, label: item.label, icon: item.icon}))} // Pass structure for header
        onSignOut={signOutUser} 
        showUserManagementButton={userProfile?.role === 'Creator'}
      />
      <main className="flex-grow container mx-auto py-8 px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="hidden md:grid w-full md:w-auto md:inline-flex mb-6 bg-card shadow-sm">
            {mainNavItemsData.map(item => ( 
              <TabsTrigger key={item.value} value={item.value} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <item.icon className="h-5 w-5 mr-2" />
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {mainNavItemsWithComponents.map(item => (
            <TabsContent key={item.value} value={item.value}>
              {item.component}
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
