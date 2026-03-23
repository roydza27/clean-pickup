import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, MapPin, Bell, Globe, ChevronRight, LogOut, 
  Phone, Shield, HelpCircle, Star, Edit2, Check, Wallet, Truck
} from 'lucide-react';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

export default function KabadiAccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [language, setLanguage] = useState('en');
  const [notifications, setNotifications] = useState({
    newPickup: true,
    routeUpdates: true,
    earnings: true,
  });

  const stats = {
    totalPickups: 234,
    totalEarnings: 45600,
    trustScore: 4.8,
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  return (
    <ResponsiveLayout title="Account">
      <div className="space-y-6">
        {/* Profile Section */}
        <div className="card-elevated">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                  {user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                {isEditing ? (
                  <Input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="font-semibold text-lg h-9 w-48"
                  />
                ) : (
                  <h2 className="text-xl font-semibold text-foreground">{user?.name}</h2>
                )}
                <p className="text-muted-foreground flex items-center gap-1 mt-1">
                  <Phone className="w-4 h-4" />
                  {user?.phone}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-4 h-4 text-warning fill-warning" />
                  <span className="text-sm font-medium">{stats.trustScore} Trust Score</span>
                </div>
              </div>
            </div>
            {isEditing ? (
              <Button size="sm" onClick={handleSave}>
                <Check className="w-4 h-4 mr-1" />
                Save
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{user?.locality}, {user?.pincode}</span>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card-elevated text-center">
            <Truck className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.totalPickups}</p>
            <p className="text-sm text-muted-foreground">Total Pickups</p>
          </div>
          <div className="card-elevated text-center">
            <Wallet className="w-6 h-6 text-secondary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">₹{stats.totalEarnings.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total Earnings</p>
          </div>
        </div>

        {/* Service Area */}
        <div className="card-elevated">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Service Areas
          </h3>
          <div className="flex flex-wrap gap-2">
            {['Koramangala', 'Indiranagar', 'HSR Layout', 'BTM Layout'].map((area) => (
              <span key={area} className="px-3 py-1.5 bg-muted rounded-full text-sm text-foreground">
                {area}
              </span>
            ))}
            <Button variant="ghost" size="sm" className="text-primary">
              + Add Area
            </Button>
          </div>
        </div>

        {/* Preferences */}
        <div className="card-elevated">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notification Preferences
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">New Pickup Alerts</p>
                <p className="text-sm text-muted-foreground">Get notified for new assignments</p>
              </div>
              <Switch 
                checked={notifications.newPickup}
                onCheckedChange={(checked) => setNotifications({...notifications, newPickup: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Route Updates</p>
                <p className="text-sm text-muted-foreground">Navigation and route changes</p>
              </div>
              <Switch 
                checked={notifications.routeUpdates}
                onCheckedChange={(checked) => setNotifications({...notifications, routeUpdates: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Earnings Updates</p>
                <p className="text-sm text-muted-foreground">Payment and earnings alerts</p>
              </div>
              <Switch 
                checked={notifications.earnings}
                onCheckedChange={(checked) => setNotifications({...notifications, earnings: checked})}
              />
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="card-elevated">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Language / भाषा
          </h3>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">हिंदी (Hindi)</SelectItem>
              <SelectItem value="kn">ಕನ್ನಡ (Kannada)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quick Links */}
        <div className="card-elevated p-0 overflow-hidden">
          <button 
            onClick={() => navigate('/kabadiwala/trust-score')}
            className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Trust Score Details</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="border-t border-border" />
          <button 
            onClick={() => navigate('/kabadiwala/earnings')}
            className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Earnings History</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="border-t border-border" />
          <button className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Documents & Verification</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="border-t border-border" />
          <button className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Help & Support</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Logout */}
        <Button 
          variant="outline" 
          className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          WasteWise v1.0.0 • Made with ♻️ in India
        </p>
      </div>
    </ResponsiveLayout>
  );
}