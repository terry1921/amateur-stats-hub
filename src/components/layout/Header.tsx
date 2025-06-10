import { Shield } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="bg-primary text-primary-foreground py-4 px-6 shadow-md">
      <div className="container mx-auto flex items-center gap-2">
        <Shield className="h-7 w-7 sm:h-8 sm:w-8" />
        <h1 className="text-xl sm:text-2xl font-headline font-bold">Amateur Stats Hub</h1>
      </div>
    </header>
  );
}
