import React from 'react';
import { Bell, Package, Wallet, Info, Check } from 'lucide-react';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { notifications } from '@/data/mockData';

const iconMap: Record<string, React.ElementType> = {
  pickup: Package,
  payment: Wallet,
  general: Info,
  alert: Bell,
};

export default function NotificationsCenter() {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <ResponsiveLayout title="Notifications">
      <div className="space-y-4">
        {/* Summary Card */}
        {unreadCount > 0 && (
          <div className="card-elevated bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {unreadCount} new notification{unreadCount > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-muted-foreground">Stay updated with your pickups</p>
              </div>
            </div>
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {notifications.map(notif => {
              const Icon = iconMap[notif.type] || Bell;
              return (
                <div
                  key={notif.id}
                  className={`card-elevated ${!notif.read ? 'border-l-4 border-l-primary' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      notif.type === 'payment' ? 'bg-accent/10' :
                      notif.type === 'pickup' ? 'bg-primary/10' :
                      notif.type === 'alert' ? 'bg-warning/10' :
                      'bg-muted'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        notif.type === 'payment' ? 'text-accent' :
                        notif.type === 'pickup' ? 'text-primary' :
                        notif.type === 'alert' ? 'text-warning' :
                        'text-muted-foreground'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-foreground">{notif.title}</h3>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTime(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notif.message}
                      </p>
                    </div>
                    {notif.read && (
                      <Check className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ResponsiveLayout>
  );
}
