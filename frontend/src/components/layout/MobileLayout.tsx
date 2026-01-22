import React, { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Package, Clock, Bell, User, Truck, Wallet, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  showNav?: boolean;
  headerRight?: ReactNode;
}

export function MobileLayout({ 
  children, 
  title, 
  showBack = false, 
  showNav = true,
  headerRight 
}: MobileLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const citizenNavItems = [
    { icon: Home, label: 'Home', path: '/citizen' },
    { icon: Package, label: 'Pickups', path: '/citizen/pickups' },
    { icon: Clock, label: 'Timings', path: '/citizen/garbage-timing' },
    { icon: Bell, label: 'Alerts', path: '/citizen/notifications' },
  ];

  const kabadiNavItems = [
    { icon: Home, label: 'Home', path: '/kabadiwala' },
    { icon: Truck, label: 'Pickups', path: '/kabadiwala/pickups' },
    { icon: Wallet, label: 'Earnings', path: '/kabadiwala/earnings' },
    { icon: BarChart3, label: 'Score', path: '/kabadiwala/trust-score' },
  ];

  const navItems = user?.role === 'kabadiwala' ? kabadiNavItems : citizenNavItems;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      {title && (
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border safe-top">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-3">
              {showBack && (
                <button 
                  onClick={() => navigate(-1)}
                  className="touch-target flex items-center justify-center -ml-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            </div>
            {headerRight}
          </div>
        </header>
      )}

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-bottom">
          <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors touch-target",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
