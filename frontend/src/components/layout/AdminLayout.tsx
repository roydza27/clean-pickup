import React, { ReactNode, useState } from 'react';

import { Bell, Wallet, Package } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { notifications } from '@/data/mockData';
import { ThemeToggle } from '@/components/common/ThemeToggle';

import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  IndianRupee, 
  MapPin, 
  ClipboardList, 
  Users, 
  Calendar, 
  MessageSquare, 
  FileBarChart,
  Menu,
  X,
  LogOut,
  Leaf
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: IndianRupee, label: 'Scrap Rates', path: '/admin/rates' },
  { icon: MapPin, label: 'Localities', path: '/admin/localities' },
  { icon: ClipboardList, label: 'Pickups', path: '/admin/pickups' },
  { icon: Users, label: 'Kabadiwalas', path: '/admin/kabadiwalas' },
  { icon: Calendar, label: 'Garbage Schedule', path: '/admin/schedule' },
  { icon: MessageSquare, label: 'Complaints', path: '/admin/complaints' },
  { icon: FileBarChart, label: 'Reports', path: '/admin/reports' },
];

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const unreadNotifications = notifications.filter(n => !n.read);

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
            <span className="text-xs text-primary">
              {unreadNotifications.length} new
            </span>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <div className="max-h-80 overflow-y-auto">
          {notifications.slice(0, 5).map(notif => (
            <DropdownMenuItem
              key={notif.id}
              className="flex items-start gap-3 p-3 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Bell className="w-4 h-4 text-muted-foreground" />
              </div>

              <div className="flex-1">
                <p className="text-sm font-medium">{notif.title}</p>
                <p className="text-xs text-muted-foreground">
                  {notif.message}
                </p>
              </div>
            </DropdownMenuItem>
          ))}
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="justify-center text-primary cursor-pointer"
          onClick={() => navigate('/admin/notifications')}
        >
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );


  return (
    <div className="min-h-screen bg-muted/30">
      <header className="lg:hidden sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between h-14 px-4">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>

          <h1 className="text-lg font-semibold">{title}</h1>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationDropdown />
          </div>
        </div>
      </header>


      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-foreground/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Leaf className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">WasteWise</span>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden touch-target flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => {
                        navigate(item.path);
                        setSidebarOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              <LogOut className="w-5 h-5" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64">
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between h-16 px-6 bg-card border-b border-border">
          <h1 className="text-xl font-semibold">{title}</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationDropdown />
          </div>
        </header>



        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
