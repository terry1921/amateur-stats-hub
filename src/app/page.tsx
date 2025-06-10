
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppHeader } from "@/components/layout/Header";
import { LeagueTable } from "@/components/league/LeagueTable";
import { MatchSchedule } from "@/components/schedule/MatchSchedule";
import { ListOrdered, CalendarDays } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow container mx-auto py-8 px-4">
        <Tabs defaultValue="league-table" className="w-full">
          <TabsList className="grid w-full grid-cols-1 gap-2 md:w-auto md:inline-flex mb-6 bg-card shadow-sm">
            <TabsTrigger value="league-table" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ListOrdered className="h-5 w-5 mr-2" />
              Tabla de Posiciones
            </TabsTrigger>
            <TabsTrigger value="match-schedule" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <CalendarDays className="h-5 w-5 mr-2" />
              Calendario
            </TabsTrigger>
          </TabsList>
          <TabsContent value="league-table">
            <LeagueTable />
          </TabsContent>
          <TabsContent value="match-schedule">
            <MatchSchedule />
          </TabsContent>
        </Tabs>
      </main>
      <footer className="text-center py-4 text-sm text-muted-foreground border-t">
        <p>&copy; {new Date().getFullYear()} Amateur Stats Hub. All rights reserved.</p>
      </footer>
    </div>
  );
}
