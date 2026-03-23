import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Calendar, Wallet, Clock, Bell, MapPin, TrendingUp, Map } from 'lucide-react';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { ActionCard } from '@/components/common/ActionCard';
import { useAuth } from '@/contexts/AuthContext';
import { scrapRates, pickups } from '@/data/mockData';
import { Button } from '@/components/ui/button';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const pendingPickups = pickups.filter(
    p => p.citizenId === user?.id && ['scheduled', 'assigned'].includes(p.status)
  ).length;

  const topRates = scrapRates.slice(0, 3);

  return (
    <ResponsiveLayout 
      title="Dashboard"
    >
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">Welcome back</p>
            <h1 className="text-2xl font-bold text-foreground">{user?.name || 'User'}</h1>
          </div>
          <button 
            onClick={() => navigate('/citizen/locality')}
            className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm"
          >
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-foreground">{user?.locality || 'Select Location'}</span>
          </button>
        </div>

        {/* Today's Rates Preview */}
        <div className="card-elevated">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Today's Rates
            </h2>
            <button 
              onClick={() => navigate('/citizen/rates')}
              className="text-sm text-primary font-medium"
            >
              View All →
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {topRates.map(rate => (
              <div key={rate.id} className="text-center p-3 bg-muted/50 rounded-xl border border-border">
                <p className="text-xl font-bold text-primary">₹{rate.rate}</p>
                <p className="text-xs text-muted-foreground mt-1">{rate.nameEn}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div>
          <h2 className="section-title">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ActionCard
              icon={Package}
              title="Sell Recyclables"
              description="Schedule a pickup for your scrap"
              to="/citizen/create-pickup"
              variant="primary"
            />

            <ActionCard
              icon={Calendar}
              title="My Pickups"
              description="Track your scheduled pickups"
              to="/citizen/pickups"
              badge={pendingPickups > 0 ? pendingPickups : undefined}
            />

            <ActionCard
              icon={Map}
              title="Map & Tracking"
              description="Find collectors, track pickups"
              to="/citizen/map"
            />

            <ActionCard
              icon={Wallet}
              title="Payment Status"
              description="View earnings and payment history"
              to="/citizen/payments"
            />

            <ActionCard
              icon={Clock}
              title="Garbage Timing"
              description="Municipal waste collection schedule"
              to="/citizen/garbage-timing"
            />

            <ActionCard
              icon={TrendingUp}
              title="Scrap Rates"
              description="View today's market rates"
              to="/citizen/rates"
            />
          </div>
        </div>
      </div>
    </ResponsiveLayout>
  );
}