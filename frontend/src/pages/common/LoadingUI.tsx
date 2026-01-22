import React from 'react';
import { Loader2 } from 'lucide-react';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';

interface LoadingUIProps {
  message?: string;
}

export default function LoadingUI({ message = 'Loading…' }: LoadingUIProps) {
  return (
    <ResponsiveLayout title='Loading...'>
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-lg text-foreground">{message}</p>
      </div>
    </ResponsiveLayout>
  );
}
