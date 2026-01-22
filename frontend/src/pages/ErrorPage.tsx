import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ErrorPage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
        <WifiOff className="w-12 h-12 text-muted-foreground" />
      </div>
      
      <h1 className="text-2xl font-bold text-foreground mb-2">
        No Connection
      </h1>
      <p className="text-muted-foreground mb-8 max-w-xs">
        कृपया अपना इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें
        <br />
        <span className="text-sm">Please check your internet connection and try again</span>
      </p>
      
      <Button variant="default" size="lg" onClick={handleRetry} className="gap-2">
        <RefreshCw className="w-5 h-5" />
        Try Again / पुनः प्रयास करें
      </Button>
    </div>
  );
}
