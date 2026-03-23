import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Calendar, Package, User, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { scrapRates } from '@/data/mockData';

export default function PickupConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { categories = [], date = '' } = location.state || {};

  const selectedRates = scrapRates.filter(r => categories.includes(r.id));
  const formattedDate = date ? new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }) : '';

  const pickupId = `PU${Date.now().toString().slice(-6)}`;

  return (
  <ResponsiveLayout>
    <div className="flex justify-center py-10">
      <div className="w-full max-w-2xl">
        <div className="card-elevated overflow-hidden">
          
          {/* Success Header */}
          <div className="gradient-hero text-primary-foreground py-10 px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary-foreground/20 flex items-center justify-center mx-auto mb-4 animate-bounce-soft">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Pickup Scheduled!</h1>
            <p className="text-sm opacity-80">
              पिकअप शेड्यूल हो गया! हम जल्द ही आएंगे।
            </p>
          </div>

          {/* Card Body */}
          <div className="p-6 space-y-4">
            <div className="text-center py-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Pickup ID</p>
              <p className="text-xl font-bold text-primary">{pickupId}</p>
            </div>

            <div className="flex items-center gap-4 py-3 border-b">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Scheduled Date</p>
                <p className="font-medium">{formattedDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 py-3 border-b">
              <Package className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Items</p>
                <p className="font-medium">
                  {selectedRates.map(r => r.nameEn).join(', ')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 py-3">
              <User className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Collector</p>
                <p className="font-medium">Will be assigned soon</p>
              </div>
            </div>

            <div className="text-center">
              <span className="status-badge status-scheduled">
                Scheduled • शेड्यूल्ड
              </span>
            </div>
          </div>

          {/* Card Footer */}
          <div className="p-6 border-t space-y-3">
            <Button className="w-full" onClick={() => navigate('/citizen/pickups')}>
              View My Pickups
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/citizen')}
            >
              <Home className="w-5 h-5 mr-2" />
              Go to Dashboard
            </Button>
          </div>

        </div>
      </div>
    </div>
  </ResponsiveLayout>
);

}
