import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Package, MapPin, User, Phone, Scale, IndianRupee, Clock } from 'lucide-react';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { pickups, scrapRates } from '@/data/mockData';

export default function PickupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const pickup = pickups.find(p => p.id === id);

  if (!pickup) {
    return (
      <ResponsiveLayout title="Pickup Details" showBack>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Pickup not found</p>
        </div>
      </ResponsiveLayout>
    );
  }

  const categories = pickup.categories.map(c => {
    const rate = scrapRates.find(r => r.category === c);
    return rate?.nameEn || c;
  });

  return (
    <ResponsiveLayout title="Pickup Details" showBack>
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header Card */}
        <div className="card-elevated text-center">
          <p className="text-sm text-muted-foreground mb-1">Pickup ID</p>
          <h2 className="text-2xl font-bold text-primary mb-3">{pickup.id}</h2>
          <StatusBadge status={pickup.status} />
        </div>

        {/* Details Grid */}
        <div className="card-elevated space-y-4">
          {/* Date */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Scheduled Date</p>
              <p className="font-medium text-foreground">
                {new Date(pickup.scheduledDate).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
              {pickup.scheduledTime && (
                <p className="text-sm text-muted-foreground">{pickup.scheduledTime}</p>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Items</p>
              <p className="font-medium text-foreground">{categories.join(', ')}</p>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pickup Address</p>
              <p className="font-medium text-foreground">{pickup.address}</p>
              <p className="text-sm text-muted-foreground">{pickup.locality}, {pickup.pincode}</p>
            </div>
          </div>

          {/* Collector */}
          {pickup.kabadiWalaName && (
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <User className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Collector</p>
                <p className="font-medium text-foreground">{pickup.kabadiWalaName}</p>
              </div>
              <a
                href={`tel:${pickup.kabadiWalaId}`}
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center"
              >
                <Phone className="w-5 h-5 text-primary-foreground" />
              </a>
            </div>
          )}
        </div>

        {/* Payment Details (for completed) */}
        {pickup.status === 'completed' && (
          <div className="card-elevated bg-accent/5 border border-accent/20">
            <h3 className="font-semibold text-foreground mb-3">Payment Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Weight</p>
                  <p className="font-medium">{pickup.weight} kg</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-semibold text-primary">₹{pickup.amount}</p>
                </div>
              </div>
            </div>
            {pickup.completedAt && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>
                  Completed on {new Date(pickup.completedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Cancel Button (for scheduled/assigned) */}
        {['scheduled', 'assigned'].includes(pickup.status) && (
          <Button variant="outline" size="lg" className="w-full text-destructive border-destructive">
            Cancel Pickup
          </Button>
        )}
      </div>
    </ResponsiveLayout>
  );
}
