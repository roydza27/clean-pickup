import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Check } from 'lucide-react';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { localities } from '@/data/mockData';

export default function LocalitySelection() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = localities.filter(
    loc => 
      loc.isActive && 
      (loc.name.toLowerCase().includes(search.toLowerCase()) ||
       loc.pincode.includes(search))
  );

  const handleConfirm = () => {
    if (selectedId) {
      // In real app, would update user's locality
      navigate(-1);
    }
  };

  return (
    <ResponsiveLayout title="Select Location">
      <div className="p-4 pb-24">

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by area or pincode"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-12"
          />
        </div>

        {/* Localities List */}
        <div className="space-y-2">
          {filtered.map(loc => (
            <button
              key={loc.id}
              onClick={() => setSelectedId(loc.id)}
              className={`w-full card-elevated flex items-center gap-4 ${
                selectedId === loc.id ? 'ring-2 ring-primary' : ''
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                selectedId === loc.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">{loc.name}</p>
                <p className="text-sm text-muted-foreground">
                  {loc.pincode} • {loc.zone} Zone
                </p>
              </div>
              {selectedId === loc.id && (
                <Check className="w-5 h-5 text-primary" />
              )}
            </button>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No areas found. Service coming soon!
              </p>
            </div>
          )}
        </div>

        {/* Confirm Button */}
        <div className="mt-6 p-4 bg-background border-t border-border">
          <Button
            variant="default"
            size="lg"
            className="w-full"
            disabled={!selectedId}
            onClick={handleConfirm}
          >
            Confirm Location
          </Button>
        </div>

      </div>
    </ResponsiveLayout>
  );
}
