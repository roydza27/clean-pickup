import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Leaf,
  Lock,
  ArrowRight,
  Loader2,
  Phone,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { 
    sendOTP,
    login,
    loginDemo 
  } = useAuth();
  const { toast } = useToast();
  
  const roleParam = searchParams.get('role') as UserRole | null;
  const [role] = useState<UserRole>(roleParam || 'citizen');
  
  // Form states
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  // const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  
  // Email auth states
  // const [email, setEmail] = useState('');
  // const [password, setPassword] = useState('');
  // const [confirmPassword, setConfirmPassword] = useState('');
  // const [name, setName] = useState('');
  // const [showPassword, setShowPassword] = useState(false);
  
  // Phone auth states
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState<'phone' | 'otp'>('phone');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // const validateEmail = (email: string) => {
  //   return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  // };

  // const validatePassword = (password: string) => {
  //   return password.length >= 6;
  // };

  // // Email Login
  // const handleEmailLogin = async () => {
  //   setError(null);
    
  //   if (!validateEmail(email)) {
  //     setError('Please enter a valid email address');
  //     return;
  //   }
    
  //   if (!validatePassword(password)) {
  //     setError('Password must be at least 6 characters');
  //     return;
  //   }
    
  //   setLoading(true);
    
  //   const result = await loginWithEmail(email, password);
    
  //   setLoading(false);
    
  //   if (result.success) {
  //     toast({
  //       title: "Welcome back!",
  //       description: "Login successful",
  //     });
  //     navigateToRole(result.user?.role || role);
  //   } else {
  //     setError(result.error || 'Login failed. Please check your credentials.');
  //   }
  // };

  // // Email Signup
  // const handleEmailSignup = async () => {
  //   setError(null);
    
  //   if (!name.trim()) {
  //     setError('Please enter your name');
  //     return;
  //   }
    
  //   if (!validateEmail(email)) {
  //     setError('Please enter a valid email address');
  //     return;
  //   }
    
  //   if (!validatePassword(password)) {
  //     setError('Password must be at least 6 characters');
  //     return;
  //   }
    
  //   if (password !== confirmPassword) {
  //     setError('Passwords do not match');
  //     return;
  //   }
    
  //   setLoading(true);
    
  //   const result = await signUpWithEmail(email, password, name, role);
    
  //   setLoading(false);
    
  //   if (result.success) {
  //     toast({
  //       title: "Account created!",
  //       description: "Welcome to WasteWise",
  //     });
  //     navigateToRole(role);
  //   } else {
  //     setError(result.error || 'Signup failed. Please try again.');
  //   }
  // };

  // // Google Login
  // const handleGoogleLogin = async () => {
  //   setError(null);
  //   setLoading(true);
    
  //   const result = await loginWithGoogle(role);
    
  //   setLoading(false);
    
  //   if (result.success) {
  //     toast({
  //       title: result.isNewUser ? "Welcome!" : "Welcome back!",
  //       description: result.isNewUser ? "Account created successfully" : "Login successful",
  //     });
  //     navigateToRole(result.user?.role || role);
  //   } else {
  //     setError(result.error || 'Google login failed. Please try again.');
  //   }
  // };

  // Phone OTP flow
  const handleSendOTP = async () => {
    if (phone.length !== 10) return;
    setError(null);
    setLoading(true);
    
    const result = await sendOTP(phone);
    
    setLoading(false);
    
    if (result.success) {
      setOtpStep('otp');
      if (result.otp) {
        setDevOtp(result.otp);
        toast({
          title: "Development Mode",
          description: `OTP: ${result.otp}`,
        });
      }
    } else {
      setError(result.error || 'Failed to send OTP');
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) return;

    setError(null);
    setLoading(true);

    try {
      const result = await login(phone, otp, role);

      if (result.success) {
        toast({
          title: result.isNewUser ? "Welcome!" : "Welcome back!",
          description: result.isNewUser
            ? "Your account has been created"
            : "Login successful",
        });

        navigateToRole(result.user!.role);
      } else {
        setError(result.error || "Invalid OTP");
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
        "OTP expired or already used"
      );
    } finally {
      setLoading(false); // ✅ ALWAYS runs
    }
  };


  // Demo login
  const handleDemoLogin = () => {
    loginDemo(phone || '9876543210', role);
    toast({
      title: "Demo Mode",
      description: `Logged in as ${role}`,
    });
    navigateToRole(role);
  };

  const navigateToRole = (userRole: UserRole) => {
    switch (userRole) {
      case 'citizen':
        navigate('/citizen');
        break;
      case 'kabadiwala':
        navigate('/kabadiwala');
        break;
      case 'admin':
        navigate('/admin');
        break;
    }
  };

  const roleLabels: Record<UserRole, { en: string; hi: string }> = {
    citizen: { en: 'Citizen', hi: 'नागरिक' },
    kabadiwala: { en: 'Collector', hi: 'कबाड़ीवाला' },
    admin: { en: 'Admin', hi: 'एडमिन' },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="gradient-hero text-primary-foreground py-10 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary-foreground/20 flex items-center justify-center mx-auto mb-3">
          <Leaf className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold">WasteWise</h1>
        <p className="text-sm opacity-80 mt-1">
          Login · <span className="font-medium">{roleLabels[role].en}</span>
        </p>
      </header>

      {/* Auth Form */}
      <div className="flex-1 p-6 -mt-4">
        <div className="max-w-md mx-auto bg-card rounded-2xl shadow-lg border border-border p-6 space-y-4">

          {/* Error */}
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          {/* PHONE STEP */}
          {otpStep === 'phone' ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                    }
                    className="pl-11 h-12 text-lg"
                    maxLength={10}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  We'll send you a one-time password
                </p>
              </div>

              <Button
                className="w-full h-12"
                disabled={phone.length !== 10 || loading}
                onClick={handleSendOTP}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Send OTP
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </>
          ) : (
            /* OTP STEP */
            <>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Enter OTP
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    className="pl-11 h-12 text-lg tracking-widest text-center"
                    maxLength={6}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Sent to +91 {phone}
                  {devOtp && (
                    <span className="ml-2 text-primary">(Dev: {devOtp})</span>
                  )}
                </p>
              </div>

              <Button
                className="w-full h-12"
                disabled={otp.length !== 6 || loading}
                onClick={handleVerifyOTP}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Verify & Login
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              <button
                onClick={() => {
                  setOtpStep('phone');
                  setOtp('');
                }}
                className="w-full text-sm text-muted-foreground text-center hover:text-foreground"
              >
                Change number
              </button>
            </>
          )}

          {/* Demo Login */}
          <Separator />
          <Button
            variant="ghost"
            className="w-full h-12 text-muted-foreground"
            onClick={handleDemoLogin}
          >
            Quick Demo Login
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="p-4 text-center">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Home
        </button>
      </footer>
    </div>
  );

}
