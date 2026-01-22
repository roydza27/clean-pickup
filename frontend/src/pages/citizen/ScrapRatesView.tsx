import React from 'react';
import { Clock, Info } from 'lucide-react';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { ScrapRateCard } from '@/components/common/ScrapRateCard';
import { scrapRates } from '@/data/mockData';

export default function ScrapRatesView() {
  const lastUpdated = new Date(scrapRates[0].updatedAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <ResponsiveLayout title="Today's Rates" showBack>
      <div className="space-y-6">
        {/* Info Banner */}
        <div className="card-elevated bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-foreground font-medium">
                Rates fixed for today
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Prices are guaranteed. No negotiations!
              </p>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>Last updated: {lastUpdated}</span>
        </div>

        {/* Rates Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scrapRates.map(rate => (
            <ScrapRateCard key={rate.id} rate={rate} />
          ))}
        </div>

        {/* Hindi Note */}
        <p className="text-center text-sm text-muted-foreground px-4">
          आज के लिए दरें तय हैं। कोई मोलभाव नहीं!
        </p>
      </div>
    </ResponsiveLayout>
  );
}
