import React, { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, Package, Clock, Bell, User, Truck, Wallet, BarChart3, 
  MapPin, LogOut, Menu, ChevronLeft, Map, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { notifications } from '@/data/mockData';



interface ResponsiveLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  headerRight?: ReactNode;
}

const citizenNavItems = [
  { icon: Home, label: 'Home', path: '/citizen' },
  { icon: Package, label: 'Pickups', path: '/citizen/pickups' },
  { icon: Map, label: 'Map', path: '/citizen/map' },
  { icon: Clock, label: 'Timings', path: '/citizen/garbage-timing' },
  { icon: User, label: 'Account', path: '/citizen/account' },
];

const citizenSidebarItems = [
  { icon: Home, label: 'Dashboard', path: '/citizen' },
  { icon: Package, label: 'Sell Recyclables', path: '/citizen/create-pickup' },
  { icon: Package, label: 'My Pickups', path: '/citizen/pickups' },
  { icon: Map, label: 'Map & Tracking', path: '/citizen/map' },
  { icon: BarChart3, label: 'Scrap Rates', path: '/citizen/rates' },
  { icon: Wallet, label: 'Payments', path: '/citizen/payments' },
  { icon: Clock, label: 'Garbage Timing', path: '/citizen/garbage-timing' },
  { icon: Bell, label: 'Notifications', path: '/citizen/notifications' },
  { icon: MapPin, label: 'My Locality', path: '/citizen/locality' },
];

const kabadiNavItems = [
  { icon: Home, label: 'Home', path: '/kabadiwala' },
  { icon: Truck, label: 'Pickups', path: '/kabadiwala/pickups' },
  { icon: Map, label: 'Route', path: '/kabadiwala/route' },
  { icon: Wallet, label: 'Earnings', path: '/kabadiwala/earnings' },
  { icon: User, label: 'Account', path: '/kabadiwala/account' },
];

const kabadiSidebarItems = [
  { icon: Home, label: 'Dashboard', path: '/kabadiwala' },
  { icon: Truck, label: "Today's Pickups", path: '/kabadiwala/pickups' },
  { icon: Map, label: 'Route Optimization', path: '/kabadiwala/route' },
  { icon: Wallet, label: 'Earnings', path: '/kabadiwala/earnings' },
  { icon: BarChart3, label: 'Trust Score', path: '/kabadiwala/trust-score' },
];

export function ResponsiveLayout({ 
  children, 
  title, 
  showBack = false, 
  headerRight 
}: ResponsiveLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const isKabadi = user?.role === 'kabadiwala';
  const navItems = isKabadi ? kabadiNavItems : citizenNavItems;
  const sidebarItems = isKabadi ? kabadiSidebarItems : citizenSidebarItems;

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const unreadNotifications = notifications.filter(n => !n.read);

  // Notification Dropdown Component
  const NotificationDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadNotifications.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
              {unreadNotifications.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadNotifications.length > 0 && (
            <span className="text-xs text-primary">{unreadNotifications.length} new</span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {notifications.slice(0, 5).map(notif => (
            <DropdownMenuItem key={notif.id} className="flex items-start gap-3 p-3 cursor-pointer">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                notif.type === 'payment' ? 'bg-accent/10' :
                notif.type === 'pickup' ? 'bg-primary/10' :
                'bg-muted'
              )}>
                {notif.type === 'payment' ? <Wallet className="w-4 h-4 text-accent" /> :
                 notif.type === 'pickup' ? <Package className="w-4 h-4 text-primary" /> :
                 <Bell className="w-4 h-4 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn("text-sm font-medium", !notif.read && "text-foreground")}>
                    {notif.title}
                  </p>
                  {!notif.read && <span className="w-2 h-2 bg-primary rounded-full" />}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
              </div>
            </DropdownMenuItem>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-center text-primary justify-center cursor-pointer"
          onClick={() =>
            navigate(isKabadi ? '/kabadiwala/notifications' : '/citizen/notifications')
          }
        >
          View all notifications
        </DropdownMenuItem>

      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Mobile Header */}
        {title && (
          <header className="sticky top-0 z-40 bg-background border-b border-border safe-top">
            <div className="flex items-center justify-between h-14 px-4">
              <div className="flex items-center gap-3">
                {showBack && (
                  <button 
                    onClick={() => navigate(-1)}
                    className="touch-target flex items-center justify-center -ml-2"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}
                <h1 className="text-lg font-semibold text-foreground">{title}</h1>
              </div>
              <div className="flex items-center gap-2">
                {headerRight}
                <ThemeToggle />
                <NotificationDropdown />
              </div>
            </div>
          </header>
        )}

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-20 p-4">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-bottom">
          <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "mobile-nav-item",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", active && "stroke-[2.5]")} />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    );
  }

  // Desktop Layout with Sidebar
  return (
    <div className="min-h-screen bg-muted/30 flex w-full">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border fixed left-0 top-0 bottom-0 z-40">
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">WasteWise</h1>
              <p className="text-xs text-muted-foreground capitalize">{user?.role} Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "nav-item w-full",
                isActive(item.path) ? "nav-item-active" : "nav-item-inactive"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-border">
          <button
            onClick={() => navigate(isKabadi ? '/kabadiwala/account' : '/citizen/account')}
            className={cn(
              "nav-item w-full mb-1",
              isActive(isKabadi ? '/kabadiwala/account' : '/citizen/account') 
                ? "nav-item-active" 
                : "nav-item-inactive"
            )}
          >
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground">{user?.name || 'User'}</p>
              <p className="text-xs text-muted-foreground">{user?.phone}</p>
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="nav-item nav-item-inactive w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Tablet Sidebar (Sheet) */}
      <div className="lg:hidden">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-72 p-0">
            <div className="flex flex-col h-full">
              {/* Logo */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="font-semibold text-foreground">WasteWise</h1>
                    <p className="text-xs text-muted-foreground capitalize">{user?.role} Portal</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {sidebarItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setSidebarOpen(false);
                    }}
                    className={cn(
                      "nav-item w-full",
                      isActive(item.path) ? "nav-item-active" : "nav-item-inactive"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>

              {/* User Section */}
              <div className="p-3 border-t border-border lg:hidden">
                <button
                  onClick={() => {
                    navigate(isKabadi ? '/kabadiwala/account' : '/citizen/account');
                    setSidebarOpen(false);
                  }}
                  className="nav-item nav-item-inactive w-full mb-1"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-foreground">{user?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{user?.phone}</p>
                  </div>
                </button>
                <button
                  onClick={handleLogout}
                  className="nav-item nav-item-inactive w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        {/* Desktop/Tablet Header */}
        <header className="sticky top-0 z-30 bg-card border-b border-border">
          <div className="flex items-center justify-between h-14 px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              {showBack && (
                <button 
                  onClick={() => navigate(-1)}
                  className="touch-target flex items-center justify-center -ml-2"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            </div>
            <div className="flex items-center gap-2">
              {headerRight}
              <ThemeToggle />
              <NotificationDropdown />
              <div className="accountIcon lg:hidden">
                <Button
                variant="ghost" 
                size="icon"
                onClick={() => navigate(isKabadi ? '/kabadiwala/account' : '/citizen/account')}
              >
                <User className="w-5 h-5" />
              </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
