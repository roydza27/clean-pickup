import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, FileText, ArrowRight } from 'lucide-react';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrapRateCard } from '@/components/common/ScrapRateCard';
import { scrapRates } from '@/data/mockData';

export default function CreatePickup() {
  const navigate = useNavigate();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [notes, setNotes] = useState('');

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  // Generate next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    return {
      value: date.toISOString().split('T')[0],
      day: date.toLocaleDateString('en-IN', { weekday: 'short' }),
      date: date.getDate(),
      month: date.toLocaleDateString('en-IN', { month: 'short' }),
    };
  });

  const handleSubmit = () => {
    if (selectedCategories.length === 0 || !selectedDate) return;
    // In real app, would create pickup
    navigate('/citizen/pickup-confirmation', {
      state: { categories: selectedCategories, date: selectedDate },
    });
  };

  return (
    <ResponsiveLayout title="Schedule Pickup">
      <div className="p-4 space-y-8 pb-24 md:pb-0">
        {/* Category Selection */}
        <section className="mb-6">
          <h2 className="section-title">What do you want to sell?</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Select items you want to recycle
          </p>
          <div className="space-y-3">
            {scrapRates.map(rate => (
              <ScrapRateCard
                key={rate.id}
                rate={rate}
                selectable
                selected={selectedCategories.includes(rate.id)}
                onSelect={toggleCategory}
              />
            ))}
          </div>
        </section>

        {/* Date Selection */}
        <section className="mb-6">
          <h2 className="section-title flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Select Pickup Date
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {dates.map(d => (
              <button
                key={d.value}
                onClick={() => setSelectedDate(d.value)}
                className={`p-3 rounded-xl text-center transition-all ${
                  selectedDate === d.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border'
                }`}
              >
                <p className="text-xs opacity-70">{d.day}</p>
                <p className="text-lg font-bold">{d.date}</p>
                <p className="text-xs">{d.month}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Notes */}
        <section>
          <h2 className="section-title flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Additional Notes (Optional)
          </h2>
          <Textarea
            placeholder="E.g., Call when you arrive, items are heavy..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </section>

        {/* Desktop CTA */}
        <section className="hidden md:flex justify-center pt-6">
          <div className="w-full max-w-md">
            <Button
              size="lg"
              className="w-full"
              disabled={selectedCategories.length === 0 || !selectedDate}
              onClick={handleSubmit}
            >
              Schedule Pickup
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </section>
      </div>
      {/* Submit Button */}
      <div className="md:hidden fixed left-0 right-0 z-50 bg-background border-t border-border bottom-[64px]">
        <div className="p-4">
          <Button
            size="lg"
            className="w-full"
            disabled={selectedCategories.length === 0 || !selectedDate}
            onClick={handleSubmit}
          >
            Schedule Pickup
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
      



    </ResponsiveLayout>
  );
}
