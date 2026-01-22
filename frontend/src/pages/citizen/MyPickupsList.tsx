import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronRight, Package } from 'lucide-react';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { StatusBadge } from '@/components/common/StatusBadge';
import { pickups, scrapRates } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';

export default function MyPickupsList() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const userPickups = pickups.filter(p => p.citizenId === user?.id || true); // Show all for demo

  const getCategories = (cats: string[]) => {
    return cats.map(c => {
      const rate = scrapRates.find(r => r.category === c);
      return rate?.nameEn || c;
    }).join(', ');
  };

  return (
    <ResponsiveLayout title="My Pickups">
      {userPickups.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No pickups yet</p>
          <button
            onClick={() => navigate('/citizen/create-pickup')}
            className="text-primary font-medium mt-2"
          >
            Schedule your first pickup
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {userPickups.map(pickup => (
            <button
              key={pickup.id}
              onClick={() => navigate(`/citizen/pickups/${pickup.id}`)}
              className="card-interactive w-full text-left"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-foreground">{pickup.id}</p>
                  <p className="text-sm text-muted-foreground">
                    {getCategories(pickup.categories)}
                  </p>
                </div>
                <StatusBadge status={pickup.status} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(pickup.scheduledDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
              {pickup.amount && (
                <div className="mt-2 pt-2 border-t border-border">
                  <span className="text-primary font-semibold">₹{pickup.amount}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </ResponsiveLayout>
  );
}
