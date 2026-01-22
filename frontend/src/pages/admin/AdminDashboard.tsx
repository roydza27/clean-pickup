import React from 'react';
import { 
  Package, 
  Users, 
  TrendingUp, 
  Truck, 
  IndianRupee, 
  Leaf,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { dashboardStats, pickups, kabadiwalas } from '@/data/mockData';

export default function AdminDashboard() {
  const stats = [
    {
      icon: Package,
      label: 'Total Pickups',
      value: dashboardStats.totalPickups.toLocaleString(),
      change: '+12%',
      positive: true,
    },
    {
      icon: Users,
      label: 'Active Collectors',
      value: dashboardStats.activeKabadiwalas,
      change: '+2',
      positive: true,
    },
    {
      icon: IndianRupee,
      label: 'Total Revenue',
      value: `₹${(dashboardStats.totalEarnings / 1000).toFixed(1)}K`,
      change: '+18%',
      positive: true,
    },
    {
      icon: Leaf,
      label: 'Landfill Diverted',
      value: `${dashboardStats.landfillDiverted}T`,
      change: '+8%',
      positive: true,
    },
  ];

  const recentPickups = pickups.slice(0, 5);
  const topCollectors = kabadiwalas.slice(0, 3);

  return (
    <AdminLayout title="Dashboard">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, i) => (
          <div key={i} className="card-elevated">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <span className={`text-sm font-medium flex items-center gap-1 ${
                stat.positive ? 'text-success' : 'text-destructive'
              }`}>
                {stat.positive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Pickups */}
        <div className="card-elevated">
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Pickups</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-muted-foreground border-b border-border">
                  <th className="pb-3 font-medium">ID</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentPickups.map(pickup => (
                  <tr key={pickup.id} className="border-b border-border last:border-0">
                    <td className="py-3 text-sm font-medium">{pickup.id}</td>
                    <td className="py-3 text-sm">{pickup.citizenName}</td>
                    <td className="py-3">
                      <span className={`status-badge ${
                        pickup.status === 'completed' ? 'status-completed' :
                        pickup.status === 'scheduled' ? 'status-scheduled' :
                        'status-pending'
                      }`}>
                        {pickup.status}
                      </span>
                    </td>
                    <td className="py-3 text-sm font-medium">
                      {pickup.amount ? `₹${pickup.amount}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Collectors */}
        <div className="card-elevated">
          <h2 className="text-lg font-semibold text-foreground mb-4">Top Collectors</h2>
          <div className="space-y-3">
            {topCollectors.map((collector, i) => (
              <div key={collector.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{collector.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {collector.totalPickups} pickups • ⭐ {collector.trustScore}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">₹{collector.todayEarnings}</p>
                  <p className="text-xs text-muted-foreground">Today</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="card-elevated text-center">
          <Truck className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-xl font-bold">{dashboardStats.pendingPickups}</p>
          <p className="text-sm text-muted-foreground">Pending Pickups</p>
        </div>
        <div className="card-elevated text-center">
          <TrendingUp className="w-8 h-8 text-accent mx-auto mb-2" />
          <p className="text-xl font-bold">{dashboardStats.completedPickups}</p>
          <p className="text-sm text-muted-foreground">Completed</p>
        </div>
        <div className="card-elevated text-center">
          <Users className="w-8 h-8 text-secondary mx-auto mb-2" />
          <p className="text-xl font-bold">2,450</p>
          <p className="text-sm text-muted-foreground">Registered Users</p>
        </div>
        <div className="card-elevated text-center">
          <Package className="w-8 h-8 text-warning mx-auto mb-2" />
          <p className="text-xl font-bold">8</p>
          <p className="text-sm text-muted-foreground">Active Zones</p>
        </div>
      </div>
    </AdminLayout>
  );
}
