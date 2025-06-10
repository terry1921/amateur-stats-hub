
'use client';

import { useState } from 'react';
import { Shield, Menu, type LucideIcon, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth

interface NavMenuItem {
  value: string;
  label: string;
  icon: LucideIcon;
}

interface AppHeaderProps {
  activeTab: string;
  onTabChange: (tabValue: string) => void;
  navItemsForMenu: NavMenuItem[];
  onSignOut: () => void; // Add onSignOut prop for desktop
}

export function AppHeader({ activeTab, onTabChange, navItemsForMenu, onSignOut }: AppHeaderProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { isAuthenticating } = useAuth(); // Get isAuthenticating state

  return (
    <header className="bg-primary text-primary-foreground py-4 px-6 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center gap-2">
          <Shield className="h-7 w-7 sm:h-8 sm:w-8" />
          <h1 className="text-xl sm:text-2xl font-headline font-bold">Amateur Stats Hub</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Desktop Sign Out Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="hidden md:inline-flex text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
            onClick={onSignOut}
            disabled={isAuthenticating}
          >
            <LogOut className="h-5 w-5 mr-2" />
            Sign Out
          </Button>

          {/* Mobile Menu Trigger */}
          <div className="md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[320px]">
                <SheetHeader className="mb-4">
                  <SheetTitle className="text-left font-headline text-xl">Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col space-y-1">
                  {navItemsForMenu.map((item) => (
                    <Button
                      key={item.value}
                      variant={(activeTab === item.value && item.value !== 'sign-out') ? 'default' : 'ghost'}
                      onClick={() => {
                        onTabChange(item.value); // This will handle signOutUser if item.value is 'sign-out'
                        setIsSheetOpen(false); // Close sheet on selection
                      }}
                      className="justify-start text-md h-11 px-3"
                      disabled={item.value === 'sign-out' && isAuthenticating}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      {item.label}
                    </Button>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
