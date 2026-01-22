import React from 'react';
import { Package, FileText, Wrench, Wine, Smartphone, Shirt } from 'lucide-react';
import { ScrapRate } from '@/types';

const iconMap: Record<string, React.ElementType> = {
  Package,
  FileText,
  Wrench,
  Wine,
  Smartphone,
  Shirt,
};

interface ScrapRateCardProps {
  rate: ScrapRate;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

export function ScrapRateCard({ rate, selectable, selected, onSelect }: ScrapRateCardProps) {
  const Icon = iconMap[rate.icon] || Package;

  return (
    <div
      onClick={() => selectable && onSelect?.(rate.id)}
      className={`card-elevated flex items-center gap-4 ${
        selectable ? 'cursor-pointer transition-all' : ''
      } ${
        selected ? 'ring-2 ring-primary bg-primary/5' : ''
      }`}
    >
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground">{rate.nameEn}</h3>
        <p className="text-sm text-muted-foreground">{rate.nameHi}</p>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-primary">₹{rate.rate}</p>
        <p className="text-xs text-muted-foreground">per {rate.unit}</p>
      </div>
      {selectable && (
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
          selected ? 'border-primary bg-primary' : 'border-muted-foreground'
        }`}>
          {selected && (
            <svg className="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      )}
    </div>
  );
}
