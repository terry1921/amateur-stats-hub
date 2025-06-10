
'use client';

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppHeader } from "@/components/layout/Header";
import { LeagueTable } from "@/components/league/LeagueTable";
import { MatchSchedule } from "@/components/schedule/MatchSchedule";
import { ListOrdered, CalendarDays, type LucideIcon, Loader2, LogOut } from "lucide-react";

interface NavItem {
  value: string;
  label: string;
  icon: LucideIcon;
  component: JSX.Element;
}

const navItemsData: Omit<NavItem, 'component'>[] = [
  { value: "league-table", label: "Tabla de Posiciones", icon: ListOrdered },
  { value: "match-schedule", label: "Calendario", icon: CalendarDays },
];

export default function Home() {
  const { currentUser, loading, signOutUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>(navItemsData[0].value);

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  if (loading || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const navItems: NavItem[] = [
    { ...navItemsData[0], component: <LeagueTable /> },
    { ...navItemsData[1], component: <MatchSchedule /> },
  ];

  // Include Sign Out in the mobile menu items
  const navItemsForMenu = [
    ...navItemsData,
    { value: "sign-out", label: "Sign Out", icon: LogOut }
  ];

  const handleTabChange = (tabValue: string) => {
    if (tabValue === 'sign-out') {
      signOutUser();
    } else {
      setActiveTab(tabValue);
    }
  };


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        navItemsForMenu={navItemsForMenu}
        onSignOut={signOutUser} // Pass signOutUser for desktop header button
      />
      <main className="flex-grow container mx-auto py-8 px-4">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="hidden md:grid w-full md:w-auto md:inline-flex mb-6 bg-card shadow-sm">
            {navItemsData.map(item => ( // Use navItemsData for desktop tabs, excluding sign out
              <TabsTrigger key={item.value} value={item.value} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <item.icon className="h-5 w-5 mr-2" />
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {navItems.map(item => (
            <TabsContent key={item.value} value={item.value}>
              {item.component}
            </TabsContent>
          ))}
        </Tabs>
      </main>
      <footer className="text-center py-4 text-sm text-muted-foreground border-t">
        <p>&copy; {new Date().getFullYear()} Amateur Stats Hub. All rights reserved.</p>
      </footer>
    </div>
  );
}
