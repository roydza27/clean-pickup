import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, User, Truck, X, Phone, Star, Clock } from 'lucide-react';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { kabadiwalas, pickups } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';

// Mock collector locations
const collectorLocations = [
  { id: 'k1', name: 'Raju Kumar', lat: 12.9352, lng: 77.6245, rating: 4.8, pickupsToday: 5 },
  { id: 'k2', name: 'Suresh Singh', lat: 12.9380, lng: 77.6290, rating: 4.5, pickupsToday: 3 },
  { id: 'k3', name: 'Mohan Das', lat: 12.9320, lng: 77.6180, rating: 4.9, pickupsToday: 7 },
];

export default function MapPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const [selectedCollector, setSelectedCollector] = useState<typeof collectorLocations[0] | null>(null);
  const [activeTab, setActiveTab] = useState('nearby');
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(true);

  // Get active pickup for tracking
  const activePickup = pickups.find(
    p => p.citizenId === user?.id && p.status === 'assigned'
  );

  // Simulated map initialization (since we need a token)
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    // In a real implementation, this would initialize Mapbox
    // For now, we'll show a styled placeholder
  }, [mapboxToken]);

  if (showTokenInput && !mapboxToken) {
    return (
      <ResponsiveLayout title="Map & Tracking">
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
          <div className="card-elevated max-w-md w-full text-center">
            <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Enable Map Features</h2>
            <p className="text-muted-foreground mb-4">
              Enter your Mapbox public token to enable map features. 
              Get your token from <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">mapbox.com</a>
            </p>
            <Input
              placeholder="pk.eyJ1Ijoi..."
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              className="mb-4"
            />
            <div className="flex gap-2">
              <Button 
                className="flex-1"
                onClick={() => setShowTokenInput(false)}
                disabled={!mapboxToken}
              >
                Enable Maps
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowTokenInput(false)}
              >
                Skip for now
              </Button>
            </div>
          </div>
        </div>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout title="Map & Tracking">
      <div className="space-y-4">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="nearby">Nearby Collectors</TabsTrigger>
            <TabsTrigger value="track">Track Pickup</TabsTrigger>
            <TabsTrigger value="location">Set Location</TabsTrigger>
          </TabsList>

          {/* Nearby Collectors Tab */}
          <TabsContent value="nearby" className="space-y-4">
            {/* Map Placeholder */}
            <div 
              ref={mapContainer}
              className="relative w-full h-64 lg:h-96 bg-muted rounded-xl overflow-hidden border border-border"
            >
              {/* Styled Map Placeholder */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/10">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-primary/40 mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">
                      {mapboxToken ? 'Loading map...' : 'Map preview (token required)'}
                    </p>
                  </div>
                </div>
                
                {/* Mock Markers */}
                {collectorLocations.map((collector, index) => (
                  <button
                    key={collector.id}
                    onClick={() => setSelectedCollector(collector)}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110"
                    style={{
                      left: `${30 + index * 20}%`,
                      top: `${40 + (index % 2) * 20}%`,
                    }}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary shadow-lg flex items-center justify-center border-2 border-white">
                      <Truck className="w-5 h-5 text-primary-foreground" />
                    </div>
                  </button>
                ))}

                {/* User Location */}
                <div 
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: '50%', top: '50%' }}
                >
                  <div className="w-6 h-6 rounded-full bg-blue-500 shadow-lg flex items-center justify-center border-2 border-white animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Collector List */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Collectors Near You</h3>
              {collectorLocations.map((collector) => (
                <button
                  key={collector.id}
                  onClick={() => setSelectedCollector(collector)}
                  className={`card-interactive w-full text-left ${
                    selectedCollector?.id === collector.id ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {collector.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{collector.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Star className="w-4 h-4 text-warning fill-warning" />
                        <span>{collector.rating}</span>
                        <span>•</span>
                        <span>{collector.pickupsToday} pickups today</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Phone className="w-4 h-4" />
                    </Button>
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>

          {/* Track Pickup Tab */}
          <TabsContent value="track" className="space-y-4">
            {activePickup ? (
              <>
                {/* Tracking Map */}
                <div className="relative w-full h-64 lg:h-96 bg-muted rounded-xl overflow-hidden border border-border">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/10">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Navigation className="w-12 h-12 text-primary/40 mx-auto mb-2 animate-pulse" />
                        <p className="text-muted-foreground text-sm">Tracking collector...</p>
                      </div>
                    </div>

                    {/* Route Line */}
                    <svg className="absolute inset-0 w-full h-full">
                      <line 
                        x1="30%" y1="60%" 
                        x2="70%" y2="40%" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth="3" 
                        strokeDasharray="8 4"
                      />
                    </svg>

                    {/* Collector Marker */}
                    <div 
                      className="absolute transform -translate-x-1/2 -translate-y-1/2"
                      style={{ left: '30%', top: '60%' }}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary shadow-lg flex items-center justify-center border-2 border-white">
                        <Truck className="w-5 h-5 text-primary-foreground" />
                      </div>
                    </div>

                    {/* Destination */}
                    <div 
                      className="absolute transform -translate-x-1/2 -translate-y-1/2"
                      style={{ left: '70%', top: '40%' }}
                    >
                      <div className="w-8 h-8 rounded-full bg-secondary shadow-lg flex items-center justify-center border-2 border-white">
                        <MapPin className="w-4 h-4 text-secondary-foreground" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pickup Info */}
                <div className="card-elevated">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-primary/10 text-primary">R</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">Raju Kumar</p>
                      <p className="text-sm text-muted-foreground">On the way • ETA 15 mins</p>
                    </div>
                    <Button size="sm">
                      <Phone className="w-4 h-4 mr-1" />
                      Call
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-sm p-3 bg-primary/5 rounded-lg">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-foreground">Collector is 2.5 km away</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Truck className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Pickup</h3>
                <p className="text-muted-foreground mb-4">
                  You don't have any assigned pickups to track right now.
                </p>
                <Button onClick={() => navigate('/citizen/create-pickup')}>
                  Schedule a Pickup
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Set Location Tab */}
          <TabsContent value="location" className="space-y-4">
            {/* Location Selection Map */}
            <div className="relative w-full h-64 lg:h-96 bg-muted rounded-xl overflow-hidden border border-border">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/10">
                {/* Center Pin */}
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-full z-10">
                  <MapPin className="w-10 h-10 text-primary drop-shadow-lg" />
                </div>
                
                <div className="absolute inset-0 flex items-center justify-center pt-8">
                  <p className="text-muted-foreground text-sm">Drag map to set location</p>
                </div>
              </div>
            </div>

            {/* Current Location */}
            <div className="card-elevated">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Selected Location</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {user?.locality}, {user?.pincode}
                  </p>
                </div>
              </div>
            </div>

            <Button className="w-full" size="lg">
              <Navigation className="w-4 h-4 mr-2" />
              Use Current Location
            </Button>

            <Button variant="outline" className="w-full" size="lg">
              Confirm This Location
            </Button>
          </TabsContent>
        </Tabs>

        {/* Selected Collector Bottom Sheet (for mobile feel) */}
        {selectedCollector && activeTab === 'nearby' && (
          <div className="fixed bottom-20 left-0 right-0 lg:relative lg:bottom-0 p-4 lg:p-0">
            <div className="card-elevated relative animate-fade-in">
              <button 
                onClick={() => setSelectedCollector(null)}
                className="absolute top-2 right-2 p-2 hover:bg-muted rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-4">
                <Avatar className="w-14 h-14">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {selectedCollector.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-lg text-foreground">{selectedCollector.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="w-4 h-4 text-warning fill-warning" />
                    <span>{selectedCollector.rating} rating</span>
                    <span>•</span>
                    <span>{selectedCollector.pickupsToday} pickups today</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1">
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </Button>
                <Button className="flex-1" onClick={() => navigate('/citizen/create-pickup')}>
                  Request Pickup
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ResponsiveLayout>
  );
}