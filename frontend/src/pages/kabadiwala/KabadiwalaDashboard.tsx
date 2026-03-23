import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Wallet, Star, MapPin, Bell, TrendingUp, Leaf } from 'lucide-react';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { ActionCard } from '@/components/common/ActionCard';
import { useAuth } from '@/contexts/AuthContext';
import { pickups, kabadiwalas } from '@/data/mockData';

export default function KabadiwalasDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const kabadi = kabadiwalas.find(k => k.id === 'k1') || kabadiwalas[0];
  const todayPickups = pickups.filter(
    p => p.kabadiWalaId === 'k1' && ['scheduled', 'assigned', 'in-progress'].includes(p.status)
  );

  return (
    <ResponsiveLayout>
    {/* Header Banner */}
    <div className="gradient-hero text-primary-foreground rounded  -3xl mb-6 ">
      <div className="max-w-md mx-auto px-4 pt-4 pb-8 rounded-b-3xl">
        
        {/* Header Row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-foreground/20 flex items-center justify-center">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-80">Welcome, Collector</p>
              <h1 className="text-lg font-semibold leading-tight">
                {kabadi.name}
              </h1>
            </div>
          </div>

          <button
            onClick={() => navigate('/kabadiwala/notifications')}
            className="w-10 h-10 rounded-2xl bg-primary-foreground/20 flex items-center justify-center"
          >
            <Bell className="w-5 h-5" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-primary-foreground/15 rounded-2xl px-3 py-4 text-center">
            <p className="text-2xl font-bold">{todayPickups.length}</p>
            <p className="text-xs opacity-80 mt-1">Today’s Pickups</p>
          </div>

          <div className="bg-primary-foreground/15 rounded-2xl px-3 py-4 text-center">
            <p className="text-2xl font-bold">₹{kabadi.todayEarnings}</p>
            <p className="text-xs opacity-80 mt-1">Earnings</p>
          </div>

          <div className="bg-primary-foreground/15 rounded-2xl px-3 py-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-2xl font-bold">{kabadi.trustScore}</span>
            </div>
            <p className="text-xs opacity-80 mt-1">Trust</p>
          </div>
        </div>

      </div>
    </div>



      {/* Quick Actions */}
      <div className="p-4 -mt-4 space-y-3">
        <ActionCard
          icon={Truck}
          title="Today's Pickups"
          description={`${todayPickups.length} pickups scheduled`}
          to="/kabadiwala/pickups"
          variant="primary"
          badge={todayPickups.length > 0 ? todayPickups.length : undefined}
        />

        <ActionCard
          icon={MapPin}
          title="Route Optimization"
          description="Get the best route for pickups"
          to="/kabadiwala/route"
        />

        <ActionCard
          icon={Wallet}
          title="Earnings Summary"
          description="View your earnings and payments"
          to="/kabadiwala/earnings"
        />

        <ActionCard
          icon={Star}
          title="Trust Score"
          description="Your performance & ratings"
          to="/kabadiwala/trust-score"
        />
      </div>

      {/* Today's Overview */}
      <div className="p-4">
        <h2 className="section-title flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Today's Overview
        </h2>
        <div className="card-elevated">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-xl font-bold text-primary">3</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-xl font-bold text-warning">{todayPickups.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Weight</p>
              <p className="text-xl font-bold">45 kg</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Localities</p>
              <p className="text-xl font-bold">{kabadi.localities.length}</p>
            </div>
          </div>
        </div>
      </div>
    </ResponsiveLayout>
  );
}
