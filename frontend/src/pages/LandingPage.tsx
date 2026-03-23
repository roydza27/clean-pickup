import React from 'react';
import { useEffect } from "react";
import { fetchLocalities } from "@/services/localityService";
import { useNavigate } from 'react-router-dom';
import { Recycle, Leaf, TrendingUp, Users, ArrowRight, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const navigate = useNavigate();
  const [lang, setLang] = React.useState<'en' | 'hi'>('en');

  useEffect(() => {
    fetchLocalities()
      .then((data) => {
        console.log("Localities:", data);
      })
      .catch(console.error);
  }, []);

  const content = {
    en: {
      tagline: 'Smart Waste Management for India',
      subtitle: 'Sell your recyclables at transparent prices. Schedule pickups. Earn fair value.',
      cta: 'Get Started',
      features: [
        { icon: TrendingUp, title: 'Transparent Prices', desc: 'Daily updated rates for all recyclables' },
        { icon: Recycle, title: 'Easy Pickups', desc: 'Schedule from your phone, we collect' },
        { icon: Users, title: 'Fair for All', desc: 'Better income for collectors, value for you' },
      ],
      forCitizens: 'For Citizens',
      forKabadiwala: 'For Collectors',
      forAdmin: 'Admin Login',
    },
    hi: {
      tagline: 'भारत के लिए स्मार्ट कचरा प्रबंधन',
      subtitle: 'पारदर्शी कीमतों पर रिसाइकिल योग्य वस्तुएं बेचें। पिकअप शेड्यूल करें। उचित मूल्य पाएं।',
      cta: 'शुरू करें',
      features: [
        { icon: TrendingUp, title: 'पारदर्शी मूल्य', desc: 'सभी रिसाइकिल के लिए दैनिक अपडेटेड दरें' },
        { icon: Recycle, title: 'आसान पिकअप', desc: 'फोन से शेड्यूल करें, हम लेने आएंगे' },
        { icon: Users, title: 'सबके लिए उचित', desc: 'कलेक्टर्स को बेहतर आय, आपको मूल्य' },
      ],
      forCitizens: 'नागरिकों के लिए',
      forKabadiwala: 'कबाड़ीवालों के लिए',
      forAdmin: 'एडमिन लॉगिन',
    },
  };

  const t = content[lang];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Leaf className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">WasteWise</span>
          </div>
          <button
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-sm font-medium"
          >
            <Globe className="w-4 h-4" />
            {lang === 'en' ? 'हिंदी' : 'EN'}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="gradient-hero text-primary-foreground py-16 px-4">
        <div className="container max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary-foreground/20 flex items-center justify-center mx-auto mb-6 animate-bounce-soft">
            <Recycle className="w-12 h-12" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {t.tagline}
          </h1>
          <p className="text-lg opacity-90 mb-8 max-w-md mx-auto">
            {t.subtitle}
          </p>
          <Button 
            variant="heroOutline" 
            size="lg" 
            onClick={() => navigate('/login')}
            className="gap-2"
          >
            {t.cta}
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 px-4">
        <div className="container max-w-2xl mx-auto">
          <div className="space-y-4">
            {t.features.map((feature, i) => (
              <div 
                key={i} 
                className="card-elevated flex items-start gap-4 animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Selection */}
      <section className="py-8 px-4 pb-16">
        <div className="container max-w-2xl mx-auto space-y-3">
          <Button
            variant="default"
            size="lg"
            className="w-full justify-between"
            onClick={() => navigate('/login?role=citizen')}
          >
            <span>{t.forCitizens}</span>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full justify-between"
            onClick={() => navigate('/login?role=kabadiwala')}
          >
            <span>{t.forKabadiwala}</span>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="default"
            className="w-full text-muted-foreground"
            onClick={() => navigate('/login?role=admin')}
          >
            {t.forAdmin}
          </Button>
        </div>
      </section>
    </div>
  );
}
