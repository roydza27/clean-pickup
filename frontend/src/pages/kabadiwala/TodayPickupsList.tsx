import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, Clock, ChevronRight, Package } from 'lucide-react';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { StatusBadge } from '@/components/common/StatusBadge';
import { pickups, scrapRates } from '@/data/mockData';

export default function TodayPickupsList() {
  const navigate = useNavigate();

  const todayPickups = pickups.filter(
    p => ['scheduled', 'assigned', 'in-progress'].includes(p.status)
  );

  const getCategories = (cats: string[]) => {
    return cats.map(c => {
      const rate = scrapRates.find(r => r.category === c);
      return rate?.nameEn || c;
    }).join(', ');
  };

  return (
    <ResponsiveLayout title="Today's Pickups">
      <div className="p-4">
        {todayPickups.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No pickups for today</p>
            <p className="text-sm text-muted-foreground mt-1">
              Check back later for new assignments
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayPickups.map((pickup, index) => (
              <button
                key={pickup.id}
                onClick={() => navigate(`/kabadiwala/pickups/${pickup.id}`)}
                className="card-interactive w-full text-left"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">{pickup.citizenName}</p>
                      <p className="text-sm text-muted-foreground">{pickup.id}</p>
                    </div>
                  </div>
                  <StatusBadge status={pickup.status} />
                </div>

                <div className="space-y-2 mt-3">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{pickup.address}</span>
                  </div>
                  
                  {pickup.scheduledTime && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{pickup.scheduledTime}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{getCategories(pickup.categories)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <a
                    href={`tel:${pickup.citizenPhone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 text-primary text-sm font-medium"
                  >
                    <Phone className="w-4 h-4" />
                    Call
                  </a>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </ResponsiveLayout>
  );
}
