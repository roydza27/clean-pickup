import React from 'react';
import { Truck, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { Button } from '@/components/ui/button';
import { garbageTimings } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';

export default function GarbageTiming() {
  const { user } = useAuth();
  
  const userTimings = garbageTimings.filter(
    t => t.locality === user?.locality || t.locality === 'Koramangala'
  );

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayTiming = userTimings.find(t => t.day === today);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <ResponsiveLayout title="Garbage Timing">
      <div className="space-y-6">
        {/* Today's Timing */}
        {todayTiming ? (
          <div className="card-elevated gradient-primary text-primary-foreground">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="w-5 h-5" />
              <span className="font-medium">Today's Collection</span>
            </div>
            <p className="text-2xl font-bold mb-1">
              {todayTiming.startTime} - {todayTiming.endTime}
            </p>
            <p className="text-sm opacity-80">
              Expected arrival window for your area
            </p>
            {todayTiming.vehicleNumber && (
              <p className="text-xs opacity-70 mt-2">
                Vehicle: {todayTiming.vehicleNumber}
              </p>
            )}
          </div>
        ) : (
          <div className="card-elevated bg-muted">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-5 h-5" />
              <span>No collection scheduled for today</span>
            </div>
          </div>
        )}

        {/* Weekly Schedule */}
        <div>
          <h2 className="section-title">Weekly Schedule</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {days.map(day => {
              const timing = userTimings.find(t => t.day === day);
              const isToday = day === today;
              
              return (
                <div
                  key={day}
                  className={`card-elevated flex items-center justify-between ${
                    isToday ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      timing ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      <Clock className={`w-5 h-5 ${timing ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className={`font-medium ${isToday ? 'text-primary' : 'text-foreground'}`}>
                        {day} {isToday && '(Today)'}
                      </p>
                      {timing && (
                        <p className="text-sm text-muted-foreground">
                          {timing.startTime} - {timing.endTime}
                        </p>
                      )}
                    </div>
                  </div>
                  {timing ? (
                    <span className="status-badge status-scheduled">Scheduled</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">No collection</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Report Missed */}
        <div className="max-w-md mx-auto">
          <Button variant="outline" size="lg" className="w-full gap-2">
            <AlertTriangle className="w-5 h-5" />
            Report Missed Collection
          </Button>
        </div>

        {/* Hindi Note */}
        <p className="text-center text-sm text-muted-foreground">
          कृपया कूड़ा समय पर बाहर रखें। गाड़ी निर्धारित समय पर आएगी।
        </p>
      </div>
    </ResponsiveLayout>
  );
}
