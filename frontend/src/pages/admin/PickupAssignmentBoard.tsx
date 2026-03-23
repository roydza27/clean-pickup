import React, { useState } from 'react';
import { Search, Filter, User, ArrowRight } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/common/StatusBadge';
import { pickups, kabadiwalas, scrapRates } from '@/data/mockData';

export default function PickupAssignmentBoard() {
  const [filter, setFilter] = useState<'all' | 'unassigned' | 'assigned' | 'completed'>('all');

  const filteredPickups = pickups.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'unassigned') return !p.kabadiWalaId;
    if (filter === 'assigned') return p.kabadiWalaId && p.status !== 'completed';
    if (filter === 'completed') return p.status === 'completed';
    return true;
  });

  const getCategories = (cats: string[]) => {
    return cats.map(c => {
      const rate = scrapRates.find(r => r.category === c);
      return rate?.nameEn || c;
    }).join(', ');
  };

  return (
    <AdminLayout title="Pickup Assignment Board">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Search by ID, customer..." className="pl-10" />
        </div>
        <div className="flex gap-2">
          {(['all', 'unassigned', 'assigned', 'completed'] as const).map(f => (
            <Button
              key={f}
              variant={filter === f ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {/* Pickups Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground">Pickup ID</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Customer</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Items</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Locality</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Assigned To</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPickups.map(pickup => (
                <tr key={pickup.id} className="border-t border-border hover:bg-muted/30">
                  <td className="p-4 font-medium">{pickup.id}</td>
                  <td className="p-4">
                    <p className="font-medium text-foreground">{pickup.citizenName}</p>
                    <p className="text-sm text-muted-foreground">{pickup.citizenPhone}</p>
                  </td>
                  <td className="p-4 text-sm">{getCategories(pickup.categories)}</td>
                  <td className="p-4 text-sm">{pickup.locality}</td>
                  <td className="p-4 text-sm">
                    {new Date(pickup.scheduledDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </td>
                  <td className="p-4">
                    {pickup.kabadiWalaName ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-sm">{pickup.kabadiWalaName}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Unassigned</span>
                    )}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={pickup.status} />
                  </td>
                  <td className="p-4">
                    {!pickup.kabadiWalaId && pickup.status !== 'completed' && (
                      <Button size="sm" variant="outline" className="gap-1">
                        Assign
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Available Collectors */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Available Collectors</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kabadiwalas.filter(k => k.status === 'active').map(collector => (
            <div key={collector.id} className="card-elevated flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center">
                {collector.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{collector.name}</p>
                <p className="text-sm text-muted-foreground">
                  {collector.todayPickups} pickups today • {collector.localities.join(', ')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
