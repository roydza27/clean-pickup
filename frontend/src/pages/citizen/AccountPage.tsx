import React, { useState } from 'react';
import axios from 'axios';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, MapPin, Bell, Globe, ChevronRight, LogOut, 
  Phone, Shield, HelpCircle, Star, Edit2, Check, Plus
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
import LoadingUI from '@/pages/common/LoadingUI';

import api from '@/lib/api';

// services/citizenProfile.ts
// services/citizenProfile.ts
export async function getCitizenProfile() {
  // Remove the extra /api here
  return api.get('/citizen/profile'); 
}

export async function updateCitizenProfile(data) {
  // Remove the extra /api here
  return api.get('/citizen/profile', data);
}


export default function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();


  useEffect(() => {
    console.log("Logged in user data:", user);
    // To see the token directly in the console:
    const currentToken = localStorage.getItem('auth_token'); // or check your AuthContext
    console.log("Attempting to find token in LocalStorage:", currentToken);
    getCitizenProfile()
      .then(res => {
        const p = res.data.profile;

        setProfile(p);

        // sync editable fields
        setName(p?.name || '');
        setAge(p?.age ?? null);
        setLanguage(p?.preferred_language || 'en');

        // sync notification switches if present
        setNotifications({
          pickup: Boolean(p?.notify_pickup_updates),
          rates: Boolean(p?.notify_payment_updates),
          promotions: Boolean(p?.notify_general),
        });
        
      })
      .finally(() => setLoading(false));
  }, [user]);

  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('en');
  const [notifications, setNotifications] = useState({
    pickup: true,
    rates: true,
    promotions: false,
  });

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const saveNotifications = async (next) => {
    await api.put('/api/citizen/preferences', {
      notifyPickupUpdates: next.pickup,
      notifyPaymentUpdates: next.rates,
      notifyGeneral: next.promotions,
    });
    setNotifications(next);
  };
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [age, setAge] = useState<number | null>(null);

  // DB-backed completeness (controls banner visibility)
  const profileMissingName = !profile?.name;
  const profileMissingAge = profile?.age == null;

  const isProfileIncomplete = profileMissingName || profileMissingAge;

  // Form validation (controls Save button)
  const formMissingName = !name;
  const formMissingAge = age == null;

  const isFormInvalid = formMissingName || formMissingAge;



  const savedAddresses = [
    { id: 1, label: 'Home', address: '123, MG Road, Koramangala', isDefault: true },
    { id: 2, label: 'Office', address: '456, Brigade Road, Indiranagar', isDefault: false },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSave = async () => {
    if (isFormInvalid) return;

    try {
      const payload: any = {
        name: name.trim(),
      };

      if (age !== null) payload.age = age;

      await updateCitizenProfile(payload);

      setProfile((prev: any) => ({
        ...prev,
        ...payload,
      }));

      setShowCompleteForm(false);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to save profile');
    }
  };







  if (loading) {
    return <LoadingUI message="Loading profile..." />;
  }
  return (
      <ResponsiveLayout title="Account">
        <div className="max-w-3xl mx-auto">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Profile Section */}

            {/* Complete Profile Banner */}
            {isProfileIncomplete && (
              <div className="md:col-span-2">
                <div
                  role="alert"
                  className="flex items-start justify-between gap-4 rounded-xl border border-warning/30 bg-warning/10 px-5 py-4"
                >
                  {/* Left */}
                  <div className="flex items-start gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 shrink-0 stroke-warning"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>

                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Profile incomplete
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {profileMissingName && 'Add your name'}
                        {profileMissingName && profileMissingAge && ' • '}
                        {profileMissingAge && 'Add your age'}
                      </p>

                    </div>
                  </div>

                  {/* Action */}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={showCompleteForm}
                    onClick={() => setShowCompleteForm(true)}
                    className="shrink-0 border-warning text-warning hover:bg-warning/20 disabled:opacity-60"
                  >
                    {showCompleteForm ? 'Editing…' : 'Complete Profile'}
                  </Button>

                </div>
              </div>
            )}

            {showCompleteForm && (
              <div className="md:col-span-2">
                <div className="rounded-xl border border-border bg-card px-5 py-4">

                  {/* Top Row: Title + Actions */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="text-sm font-semibold">Edit Profile</h2>
                      <p className="text-xs text-muted-foreground">
                        Used for pickups & verification
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowCompleteForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isFormInvalid}
                      >
                        Save
                      </Button>
                    </div>
                  </div>

                  {/* Main Row */}
                  <div className="flex items-center gap-4">

                    {/* Avatar */}
                    <div className="relative group shrink-0">
                      <Avatar className="h-14 w-14">
                        <AvatarFallback className="text-lg">
                          {name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>

                      <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 cursor-pointer transition">
                        <Plus className="w-4 h-4" />
                        <input type="file" accept="image/*" className="hidden" />
                      </label>
                    </div>

                    {/* Fields */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium">Full Name</label>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          className="h-9"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium">Age</label>
                        <Input
                          type="number"
                          value={age ?? ''}
                          onChange={(e) => setAge(Number(e.target.value))}
                          placeholder="Age"
                          className="h-9"
                        />
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {!isProfileIncomplete && (
              <div className="md:col-span-2 rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-6">

                  {/* Avatar Upload */}
                  <div className="relative group">
                    <Avatar className="h-20 w-20">
                      <AvatarFallback className="text-xl">
                        {profile?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    {/* Upload overlay */}
                    <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 cursor-pointer transition">
                      <Edit2 className="w-5 h-5" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          // TODO: image upload handler (preview first)
                        }}
                      />
                    </label>
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <p className="text-lg font-semibold">
                      {profile?.name || 'Your name'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {profile?.age ? `Age ${profile.age}` : 'Age not set'}
                    </p>

                    {/* Incomplete hint */}
                    {isProfileIncomplete && (
                      <p className="mt-1 text-xs text-warning">
                        Complete your profile to enable pickups
                      </p>
                    )}
                  </div>

                  {/* Action */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCompleteForm(true)}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            )}

            



            {/* Saved Addresses */}
            <div className="card-elevated">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Saved Addresses
                </h3>
                <Button variant="ghost" size="sm" className="text-primary h-8 px-2">
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-3">
                {savedAddresses.map((addr) => (
                  <div 
                    key={addr.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{addr.label}</span>
                        {addr.isDefault && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 truncate">{addr.address}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
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

            {/* Preferences */}
            <div className="card-elevated md:col-span-2">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notification Preferences
              </h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground text-sm">Pickup Updates</p>
                    <p className="text-xs text-muted-foreground">Pickup status alerts</p>
                  </div>
                  <Switch 
                    checked={notifications.pickup}
                    onCheckedChange={(checked) =>
                      saveNotifications({ ...notifications, pickup: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground text-sm">Rate Alerts</p>
                    <p className="text-xs text-muted-foreground">Price changes</p>
                  </div>
                  <Switch 
                    checked={notifications.rates}
                    onCheckedChange={(checked) =>
                      saveNotifications({ ...notifications, rates: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground text-sm">Promotions</p>
                    <p className="text-xs text-muted-foreground">Special offers</p>
                  </div>
                  <Switch 
                    checked={notifications.promotions}
                    onCheckedChange={(checked) =>
                    saveNotifications({ ...notifications, promotions: checked })
                  }
                  />
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="card-elevated p-0 overflow-hidden md:col-span-2">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
                <button 
                  onClick={() => navigate('/citizen/notifications')}
                  className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-medium">Notifications</span>
                </button>
                <button className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-medium">Privacy</span>
                </button>
                <button className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-medium">Help</span>
                </button>
                <button className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Star className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-medium">Rate App</span>
                </button>
              </div>
            </div>

            {/* Logout */}
            <div className="md:col-span-2 flex flex-col items-center gap-4">
              <Button 
                variant="outline" 
                className="w-full max-w-xs border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                WasteWise v1.0.0 • Made with ♻️ in India
              </p>
            </div>
          </div>
        </div>
      </ResponsiveLayout>
  );
}
