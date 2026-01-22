import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Package, User, Clock, Navigation } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { pickups, scrapRates } from '@/data/mockData';

export default function KabadiPickupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const pickup = pickups.find(p => p.id === id);

  if (!pickup) {
    return (
      <MobileLayout title="Pickup Details" showBack showNav={false}>
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Pickup not found</p>
        </div>
      </MobileLayout>
    );
  }

  const categories = pickup.categories.map(c => {
    const rate = scrapRates.find(r => r.category === c);
    return { name: rate?.nameEn || c, rate: rate?.rate || 0 };
  });

  const openInMaps = () => {
    const address = encodeURIComponent(`${pickup.address}, ${pickup.locality}, ${pickup.pincode}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
  };

  return (
    <MobileLayout title="Pickup Details" showBack showNav={false}>
      <div className="p-4 pb-32">
        {/* Header */}
        <div className="card-elevated mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground">{pickup.id}</p>
              <h2 className="text-xl font-bold text-foreground">{pickup.citizenName}</h2>
            </div>
            <StatusBadge status={pickup.status} />
          </div>
          
          <a
            href={`tel:${pickup.citizenPhone}`}
            className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium"
          >
            <Phone className="w-5 h-5" />
            Call Customer
          </a>
        </div>

        {/* Address */}
        <div className="card-elevated mb-4">
          <div className="flex items-start gap-3 mb-3">
            <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">{pickup.address}</p>
              <p className="text-sm text-muted-foreground">{pickup.locality}, {pickup.pincode}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full gap-2" onClick={openInMaps}>
            <Navigation className="w-5 h-5" />
            Open in Google Maps
          </Button>
        </div>

        {/* Time */}
        {pickup.scheduledTime && (
          <div className="card-elevated mb-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Preferred Time</p>
                <p className="font-medium text-foreground">{pickup.scheduledTime}</p>
              </div>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="card-elevated mb-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Items to Collect
          </h3>
          <div className="space-y-2">
            {categories.map((cat, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-foreground">{cat.name}</span>
                <span className="text-primary font-medium">₹{cat.rate}/kg</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        {pickup.notes && (
          <div className="card-elevated">
            <h3 className="font-semibold text-foreground mb-2">Notes</h3>
            <p className="text-sm text-muted-foreground">{pickup.notes}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border space-y-2">
        <Button
          variant="success"
          size="lg"
          className="w-full"
          onClick={() => navigate(`/kabadiwala/pickups/${id}/complete`)}
        >
          Mark as Completed
        </Button>
        <Button variant="outline" size="default" className="w-full text-destructive">
          Report Issue
        </Button>
      </div>
    </MobileLayout>
  );
}
