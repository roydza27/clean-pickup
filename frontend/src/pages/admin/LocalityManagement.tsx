import React, { useState } from 'react';
import { Plus, Edit2, Trash2, MapPin, Check, X } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { localities as initialLocalities } from '@/data/mockData';

export default function LocalityManagement() {
  const [localities, setLocalities] = useState(initialLocalities);
  const [editing, setEditing] = useState<string | null>(null);

  const toggleActive = (id: string) => {
    setLocalities(localities.map(l => 
      l.id === id ? { ...l, isActive: !l.isActive } : l
    ));
  };

  const zones = ['North', 'South', 'East', 'West'];

  return (
    <AdminLayout title="Locality & Zone Management">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-muted-foreground">
            Manage service areas and zones
          </p>
        </div>
        <Button variant="default" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Locality
        </Button>
      </div>

      {/* Zone Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Button variant="secondary" size="sm">All Zones</Button>
        {zones.map(zone => (
          <Button key={zone} variant="ghost" size="sm">{zone}</Button>
        ))}
      </div>

      {/* Localities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {localities.map(locality => (
          <div key={locality.id} className={`card-elevated ${!locality.isActive ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  locality.isActive ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  <MapPin className={`w-5 h-5 ${locality.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{locality.name}</h3>
                  <p className="text-sm text-muted-foreground">{locality.pincode}</p>
                </div>
              </div>
              <span className={`status-badge ${locality.isActive ? 'status-completed' : 'bg-muted text-muted-foreground'}`}>
                {locality.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{locality.zone} Zone</span>
              <div className="flex gap-1">
                <Button 
                  size="iconSm" 
                  variant="ghost"
                  onClick={() => toggleActive(locality.id)}
                >
                  {locality.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                </Button>
                <Button size="iconSm" variant="ghost">
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
