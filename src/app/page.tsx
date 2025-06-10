
'use client';

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppHeader } from "@/components/layout/Header";
import { LeagueTable } from "@/components/league/LeagueTable";
import { MatchSchedule } from "@/components/schedule/MatchSchedule";
import { ListOrdered, CalendarDays, type LucideIcon } from "lucide-react";

interface NavItem {
  value: string;
  label: string;
  icon: LucideIcon;
  component: JSX.Element;
}

const navItems: NavItem[] = [
  { value: "league-table", label: "Tabla de Posiciones", icon: ListOrdered, component: <LeagueTable /> },
  { value: "match-schedule", label: "Calendario", icon: CalendarDays, component: <MatchSchedule /> },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>(navItems[0].value);

  const navItemsForMenu = navItems.map(({ value, label, icon }) => ({ value, label, icon }));

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        navItemsForMenu={navItemsForMenu}
      />
      <main className="flex-grow container mx-auto py-8 px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="hidden md:grid w-full md:w-auto md:inline-flex mb-6 bg-card shadow-sm">
            {navItems.map(item => (
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
