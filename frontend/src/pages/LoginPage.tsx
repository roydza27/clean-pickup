import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Leaf, Phone, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { sendOTP, login, loginDemo } = useAuth();
  const { toast } = useToast();
  
  const roleParam = searchParams.get('role') as UserRole | null;
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [role] = useState<UserRole>(roleParam || 'citizen');
  

  const handleSendOTP = async () => {
    if (phone.length !== 10) return;

    setLoading(true);

    const result = await sendOTP(phone);

    console.log("OTP result:", result); // 🔥 add this

    setLoading(false);

    if (result.success) {
      setStep("otp");

      if (result.otp) {
        setDevOtp(result.otp);
        toast({
          title: "Development Mode",
          description: `OTP: ${result.otp}`,
        });
      }
    } else {
      toast({
        variant: "destructive",
        title: "Failed to send OTP",
        description: result.error || "Please try again",
      });
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) return;
    setLoading(true);

    const result = await login(phone, otp,role);

    setLoading(false);

    if (!result.success) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: result.error || "Invalid OTP",
      });
      return;
    }

    toast({
      title: result.isNewUser ? "Welcome!" : "Welcome back!",
      description: result.isNewUser
        ? "Your account has been created"
        : "Login successful",
    });

    /**
     * ✅ SAFELY extract role from stored user
     * (authService already saved it)
     */
    const user = JSON.parse(localStorage.getItem("user")!) as {
      role: UserRole;
    };

    switch (user.role) {
      case "citizen":
        navigate("/citizen");
        break;
      case "kabadiwala":
        navigate("/kabadiwala");
        break;
      case "admin":
        navigate("/admin");
        break;
    }
  };


  // Quick demo login for testing
  const handleDemoLogin = () => {
    loginDemo(phone || '9876543210', role);
    toast({
      title: "Demo Mode",
      description: `Logged in as ${role}`,
    });
    
    switch (role) {
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

  const roleLabels: Record<UserRole, { en: string; hi: string; color: string }> = {
    citizen: { en: 'Citizen', hi: 'नागरिक', color: 'text-citizen' },
    kabadiwala: { en: 'Collector', hi: 'कबाड़ीवाला', color: 'text-kabadiwala' },
    admin: { en: 'Admin', hi: 'एडमिन', color: 'text-admin' },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="gradient-hero text-primary-foreground py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary-foreground/20 flex items-center justify-center mx-auto mb-4">
          <Leaf className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold">WasteWise</h1>
        <p className="text-sm opacity-80 mt-1">
          Login as <span className="font-semibold">{roleLabels[role].en}</span>
        </p>
      </header>

      {/* Form */}
      <div className="flex-1 p-6">
        <div className="max-w-sm mx-auto">
          {step === 'phone' ? (
            <div className="space-y-6 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Mobile Number / मोबाइल नंबर
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="pl-12 h-14 text-lg"
                    maxLength={10}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  We'll send you a one-time password
                </p>
              </div>

              <Button
                variant="default"
                size="lg"
                className="w-full"
                disabled={phone.length !== 10 || loading}
                onClick={handleSendOTP}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Send OTP
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>

              {/* Demo login button for development */}
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={handleDemoLogin}
              >
                Quick Demo Login
              </Button>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Enter OTP / OTP दर्ज करें
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="pl-12 h-14 text-lg tracking-widest text-center"
                    maxLength={6}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Sent to +91 {phone}
                  {devOtp && <span className="ml-2 text-primary">(Dev OTP: {devOtp})</span>}
                </p>
              </div>

              <Button
                variant="default"
                size="lg"
                className="w-full"
                disabled={otp.length !== 6 || loading}
                onClick={handleVerifyOTP}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Verify & Continue
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>

              <button
                onClick={() => setStep('phone')}
                className="w-full text-sm text-muted-foreground text-center"
              >
                Change number
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="p-4 text-center">
        <p className="text-xs text-muted-foreground">
          By continuing, you agree to our Terms & Privacy Policy
        </p>
      </footer>
    </div>
  );
}
