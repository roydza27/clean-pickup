import React, { useState } from 'react';
import { Save, Plus, Trash2, Clock } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { garbageTimings, localities } from '@/data/mockData';

export default function GarbageScheduleUpload() {
  const [selectedLocality, setSelectedLocality] = useState(localities[0]?.id || '');
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const localityTimings = garbageTimings.filter(t => t.locality === localities.find(l => l.id === selectedLocality)?.name);

  return (
    <AdminLayout title="Garbage Schedule Management">
      {/* Locality Selector */}
      <div className="card-elevated mb-6">
        <h2 className="font-semibold text-foreground mb-3">Select Locality</h2>
        <div className="flex flex-wrap gap-2">
          {localities.filter(l => l.isActive).map(locality => (
            <Button
              key={locality.id}
              variant={selectedLocality === locality.id ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedLocality(locality.id)}
            >
              {locality.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Schedule Editor */}
      <div className="card-elevated">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Weekly Schedule</h2>
          <Button variant="default" size="sm" className="gap-2">
            <Save className="w-4 h-4" />
            Save Schedule
          </Button>
        </div>

        <div className="space-y-3">
          {days.map(day => {
            const timing = localityTimings.find(t => t.day === day);
            
            return (
              <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="w-24 font-medium text-foreground">{day}</div>
                <div className="flex-1 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <Input
                      type="time"
                      defaultValue={timing?.startTime?.replace(' AM', '').replace(' PM', '') || '07:00'}
                      className="w-32"
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                      type="time"
                      defaultValue={timing?.endTime?.replace(' AM', '').replace(' PM', '') || '09:00'}
                      className="w-32"
                    />
                  </div>
                  <Input
                    placeholder="Vehicle Number (optional)"
                    defaultValue={timing?.vehicleNumber || ''}
                    className="w-40"
                  />
                </div>
                <div className="flex gap-2">
                  {timing ? (
                    <Button size="iconSm" variant="ghost" className="text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="gap-1">
                      <Plus className="w-4 h-4" />
                      Add
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bulk Upload */}
      <div className="card-elevated mt-6">
        <h2 className="font-semibold text-foreground mb-3">Bulk Upload</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Upload a CSV file with schedule data for multiple localities at once.
        </p>
        <Button variant="outline">Upload CSV File</Button>
      </div>
    </AdminLayout>
  );
}
