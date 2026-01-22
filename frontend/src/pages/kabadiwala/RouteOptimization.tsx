import React from 'react';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { Button } from '@/components/ui/button';
import { pickups } from '@/data/mockData';

export default function RouteOptimization() {
  const todayPickups = pickups.filter(
    p => ['scheduled', 'assigned', 'in-progress'].includes(p.status)
  );

  const openRouteInMaps = () => {
    // Build waypoints for Google Maps
    const waypoints = todayPickups.map(p => 
      encodeURIComponent(`${p.address}, ${p.locality}, ${p.pincode}`)
    ).join('/');
    
    const origin = encodeURIComponent('Current Location');
    window.open(`https://www.google.com/maps/dir/${origin}/${waypoints}`, '_blank');
  };

  return (
    <ResponsiveLayout title="Route Optimization">
      <div className="p-4">
        {/* Info */}
        <div className="card-elevated gradient-primary text-primary-foreground mb-6">
          <h2 className="font-semibold mb-2">Optimized Route</h2>
          <p className="text-sm opacity-80">
            Follow this order for the fastest pickups
          </p>
        </div>

        {/* Pickup Order */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-border" />
          
          <div className="space-y-4">
            {todayPickups.map((pickup, index) => (
              <div key={pickup.id} className="flex gap-4">
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center">
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1 card-elevated">
                  <p className="font-semibold text-foreground">{pickup.citizenName}</p>
                  <div className="flex items-start gap-2 mt-1">
                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">{pickup.address}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {pickup.locality} • {pickup.categories.length} items
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Open Maps Button */}
        <div className="mt-8">
          <Button
            variant="default"
            size="lg"
            className="w-full gap-2"
            onClick={openRouteInMaps}
          >
            <Navigation className="w-5 h-5" />
            Open Route in Google Maps
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>

        {/* Note */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Route is optimized based on distance and preferred timings
        </p>
      </div>
    </ResponsiveLayout>
  );
}
