import React from 'react';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { Wallet, TrendingUp, Calendar, Package, IndianRupee } from 'lucide-react';
import { kabadiwalas, pickups } from '@/data/mockData';

export default function EarningsSummary() {
  const kabadi = kabadiwalas[0];
  
  const completedPickups = pickups.filter(p => p.status === 'completed');
  const weeklyEarnings = completedPickups.reduce((sum, p) => sum + (p.amount || 0), 0);

  const dailyBreakdown = [
    { day: 'Today', pickups: 3, earnings: kabadi.todayEarnings },
    { day: 'Yesterday', pickups: 4, earnings: 1450 },
    { day: 'Monday', pickups: 5, earnings: 1800 },
    { day: 'Sunday', pickups: 2, earnings: 650 },
  ];

  return (
    <ResponsiveLayout title="Earnings">
      <div className="p-4">
        {/* Today's Earnings */}
        <div className="card-elevated gradient-primary text-primary-foreground mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="w-6 h-6" />
            <span className="font-medium">Today's Earnings</span>
          </div>
          <p className="text-4xl font-bold">₹{kabadi.todayEarnings}</p>
          <div className="flex items-center gap-4 mt-3 text-sm opacity-80">
            <span>{kabadi.todayPickups} pickups</span>
            <span>•</span>
            <span>45 kg collected</span>
          </div>
        </div>

        {/* Weekly Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="card-elevated text-center">
            <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">₹{weeklyEarnings}</p>
            <p className="text-sm text-muted-foreground">This Week</p>
          </div>
          <div className="card-elevated text-center">
            <Package className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{kabadi.totalPickups}</p>
            <p className="text-sm text-muted-foreground">Total Pickups</p>
          </div>
        </div>

        {/* Daily Breakdown */}
        <h2 className="section-title flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Daily Breakdown
        </h2>
        
        <div className="space-y-2">
          {dailyBreakdown.map((day, i) => (
            <div key={i} className="card-elevated flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">{day.day}</p>
                <p className="text-sm text-muted-foreground">{day.pickups} pickups</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">₹{day.earnings}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Info */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <div className="flex items-start gap-3">
            <IndianRupee className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Earnings are settled weekly to your linked bank account every Monday.
            </p>
          </div>
        </div>
      </div>
    </ResponsiveLayout>
  );
}
