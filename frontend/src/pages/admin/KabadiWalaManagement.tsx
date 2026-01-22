import React from 'react';
import { Search, Plus, Phone, Star, MapPin } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/common/StatusBadge';
import { kabadiwalas } from '@/data/mockData';

export default function KabadiWalaManagement() {
  return (
    <AdminLayout title="Kabadiwala Management">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Search collectors..." className="pl-10" />
        </div>
        <Button variant="default" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Collector
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card-elevated text-center">
          <p className="text-3xl font-bold text-primary">{kabadiwalas.length}</p>
          <p className="text-sm text-muted-foreground">Total Collectors</p>
        </div>
        <div className="card-elevated text-center">
          <p className="text-3xl font-bold text-success">
            {kabadiwalas.filter(k => k.status === 'active').length}
          </p>
          <p className="text-sm text-muted-foreground">Active</p>
        </div>
        <div className="card-elevated text-center">
          <p className="text-3xl font-bold text-foreground">
            {(kabadiwalas.reduce((sum, k) => sum + k.trustScore, 0) / kabadiwalas.length).toFixed(1)}
          </p>
          <p className="text-sm text-muted-foreground">Avg Trust Score</p>
        </div>
      </div>

      {/* Collectors Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground">Collector</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Phone</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Localities</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Trust Score</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Total Pickups</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Today</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {kabadiwalas.map(collector => (
                <tr key={collector.id} className="border-t border-border hover:bg-muted/30">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center">
                        {collector.name.charAt(0)}
                      </div>
                      <span className="font-medium text-foreground">{collector.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <a href={`tel:${collector.phone}`} className="flex items-center gap-2 text-primary">
                      <Phone className="w-4 h-4" />
                      {collector.phone}
                    </a>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {collector.localities.map(loc => (
                        <span key={loc} className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                          <MapPin className="w-3 h-3" />
                          {loc}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-warning fill-warning" />
                      <span className="font-medium">{collector.trustScore}</span>
                    </div>
                  </td>
                  <td className="p-4 font-medium">{collector.totalPickups}</td>
                  <td className="p-4">
                    <span className="text-primary font-medium">{collector.todayPickups}</span>
                    <span className="text-muted-foreground"> / ₹{collector.todayEarnings}</span>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={collector.status} />
                  </td>
                  <td className="p-4">
                    <Button size="sm" variant="ghost">View</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
