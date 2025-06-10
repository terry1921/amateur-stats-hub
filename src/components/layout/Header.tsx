
'use client';

import { useState } from 'react';
import { Shield, Menu, type LucideIcon, LogOut, Users, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext'; 
import { useRouter, usePathname } from 'next/navigation';

interface NavMenuItem {
  value: string;
  label: string;
  icon: LucideIcon;
}

interface AppHeaderProps {
  activeTab?: string; // Optional: active tab for pages with internal tabs
  onTabChange?: (tabValue: string) => void; // Optional: for pages with internal tabs
  navItemsForMenu: NavMenuItem[]; // Items specific to the current page/context for the mobile menu
  onSignOut: () => void; 
  showUserManagementButton?: boolean;
  showDashboardButton?: boolean; // New prop to show dashboard button
}

export function AppHeader({ 
  activeTab, 
  onTabChange, 
  navItemsForMenu, 
  onSignOut, 
  showUserManagementButton,
  showDashboardButton 
}: AppHeaderProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { isAuthenticating } = useAuth(); 
  const router = useRouter();
  const pathname = usePathname();

  const handleUserManagementClick = () => {
    router.push('/admin/users');
  };

  const handleDashboardClick = () => {
    router.push('/dashboard');
  };
  
  const handleLogoClick = () => {
    router.push('/dashboard'); // Logo always goes to dashboard
  };

  return (
    <header className="bg-primary text-primary-foreground py-4 px-6 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-2 text-primary-foreground hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-primary rounded-sm p-1"
          aria-label="Go to dashboard"
        >
          <Shield className="h-7 w-7 sm:h-8 sm:w-8" />
          <h1 className="text-xl sm:text-2xl font-headline font-bold">Amateur Stats Hub</h1>
        </button>

        <div className="flex items-center gap-2">
          {showDashboardButton && pathname !== '/dashboard' && (
             <Button
              variant="ghost"
              size="sm"
              className="hidden md:inline-flex text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
              onClick={handleDashboardClick}
              disabled={isAuthenticating}
              title="Dashboard"
            >
              <LayoutDashboard className="h-5 w-5 mr-2" />
              Dashboard
            </Button>
          )}
          {showUserManagementButton && (
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:inline-flex text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
              onClick={handleUserManagementClick}
              disabled={isAuthenticating}
              title="User Management"
            >
              <Users className="h-5 w-5 mr-2" />
              User Management
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            className="hidden md:inline-flex text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
            onClick={onSignOut}
            disabled={isAuthenticating}
            title="Sign Out"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Sign Out
          </Button>

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
                      variant={(activeTab === item.value && onTabChange) ? 'default' : 'ghost'}
                      onClick={() => {
                        if (onTabChange) {
                            onTabChange(item.value); 
                        }
                        // If not handled by onTabChange (e.g. global actions like signout/usermgmt), it's handled by item.action in parent
                        setIsSheetOpen(false); 
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
