import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Scale, IndianRupee, Package } from 'lucide-react';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { pickups, scrapRates } from '@/data/mockData';

export default function PickupCompletion() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const pickup = pickups.find(p => p.id === id);
  const [weights, setWeights] = useState<Record<string, string>>({});

  if (!pickup) {
    return (
      <ResponsiveLayout title="Complete Pickup">
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Pickup not found</p>
        </div>
      </ResponsiveLayout>
    );
  }

  const categories = pickup.categories.map(c => {
    const rate = scrapRates.find(r => r.category === c);
    return { id: c, name: rate?.nameEn || c, rate: rate?.rate || 0 };
  });

  const totalAmount = categories.reduce((sum, cat) => {
    const weight = parseFloat(weights[cat.id] || '0');
    return sum + (weight * cat.rate);
  }, 0);

  const totalWeight = Object.values(weights).reduce(
    (sum: number, w: string) => sum + parseFloat(w || '0'), 0
  );

  const handleComplete = () => {
    // In real app, would submit completion
    navigate('/kabadiwala/pickups', { replace: true });
  };

  return (
    <ResponsiveLayout title="Complete Pickup">
      <div className="p-4 pb-40">
        {/* Header */}
        <div className="card-elevated mb-4 text-center">
          <p className="text-sm text-muted-foreground">{pickup.id}</p>
          <h2 className="text-xl font-bold text-foreground">{pickup.citizenName}</h2>
        </div>

        {/* Weight Entry */}
        <h3 className="section-title flex items-center gap-2">
          <Scale className="w-5 h-5 text-primary" />
          Enter Weight
        </h3>
        
        <div className="space-y-3 mb-6">
          {categories.map(cat => (
            <div key={cat.id} className="card-elevated">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground">{cat.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">₹{cat.rate}/kg</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="0"
                  value={weights[cat.id] || ''}
                  onChange={(e) => setWeights({ ...weights, [cat.id]: e.target.value })}
                  className="text-lg text-center"
                />
                <span className="text-muted-foreground font-medium">kg</span>
              </div>
              {weights[cat.id] && parseFloat(weights[cat.id]) > 0 && (
                <p className="text-sm text-primary font-medium text-right mt-2">
                  = ₹{(parseFloat(weights[cat.id]) * cat.rate).toFixed(0)}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="card-elevated gradient-primary text-primary-foreground">
          <h3 className="font-semibold mb-3">Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm opacity-80">Total Weight</p>
              <p className="text-2xl font-bold">{totalWeight.toFixed(1)} kg</p>
            </div>
            <div>
              <p className="text-sm opacity-80">Total Amount</p>
              <p className="text-2xl font-bold">₹{totalAmount.toFixed(0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <Button
          variant="success"
          size="lg"
          className="w-full gap-2"
          disabled={totalWeight === 0}
          onClick={handleComplete}
        >
          <CheckCircle className="w-5 h-5" />
          Mark Pickup Complete
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-2">
          This action cannot be undone
        </p>
      </div>
    </ResponsiveLayout>
  );
}
