import React, { useState } from 'react';
import { Save, Edit2, Clock } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { scrapRates as initialRates } from '@/data/mockData';

export default function ScrapRateManagement() {
  const [rates, setRates] = useState(initialRates);
  const [editing, setEditing] = useState<string | null>(null);

  const handleRateChange = (id: string, newRate: number) => {
    setRates(rates.map(r => r.id === id ? { ...r, rate: newRate } : r));
  };

  const handleSave = () => {
    // In real app, would save to database
    setEditing(null);
  };

  const lastUpdated = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <AdminLayout title="Scrap Rate Management">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>Last updated: {lastUpdated}</span>
        </div>
        <Button variant="default" className="gap-2" onClick={handleSave}>
          <Save className="w-4 h-4" />
          Publish All Rates
        </Button>
      </div>

      {/* Rates Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground">Category</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Hindi Name</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Rate (₹/kg)</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rates.map(rate => (
                <tr key={rate.id} className="border-t border-border">
                  <td className="p-4">
                    <p className="font-medium text-foreground">{rate.nameEn}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-muted-foreground">{rate.nameHi}</p>
                  </td>
                  <td className="p-4">
                    {editing === rate.id ? (
                      <Input
                        type="number"
                        value={rate.rate}
                        onChange={(e) => handleRateChange(rate.id, Number(e.target.value))}
                        className="w-24"
                      />
                    ) : (
                      <p className="font-semibold text-primary">₹{rate.rate}</p>
                    )}
                  </td>
                  <td className="p-4">
                    {editing === rate.id ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => setEditing(null)}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setEditing(rate.id)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Note */}
      <div className="mt-6 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> Rate changes will be visible to all users after publishing. 
          Historical rates are preserved for completed transactions.
        </p>
      </div>
    </AdminLayout>
  );
}
