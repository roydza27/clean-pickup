import React from 'react';
import { Wallet, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { StatusBadge } from '@/components/common/StatusBadge';
import { payments, pickups } from '@/data/mockData';

export default function PaymentStatus() {
  const enrichedPayments = payments.map(p => ({
    ...p,
    pickup: pickups.find(pk => pk.id === p.pickupId),
  }));

  const totalPaid = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <ResponsiveLayout title="Payment Status">
      <div className="space-y-6">
        {/* Summary Card */}
        <div className="card-elevated gradient-primary text-primary-foreground">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="w-6 h-6" />
            <span className="font-medium">Total Earnings</span>
          </div>
          <p className="text-3xl font-bold">₹{totalPaid}</p>
          <p className="text-sm opacity-80 mt-1">From all completed pickups</p>
        </div>

        {/* Payments List */}
        <div>
          <h2 className="section-title">Payment History</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {enrichedPayments.map(payment => (
              <div key={payment.id} className="card-elevated">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-foreground">
                      {payment.pickup?.id || 'Pickup'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {payment.pickup?.categories.join(', ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-primary">
                      ₹{payment.amount || 'TBD'}
                    </p>
                    <StatusBadge status={payment.status} />
                  </div>
                </div>

                {payment.status === 'paid' && payment.paidAt && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>
                      Paid on {new Date(payment.paidAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                    {payment.upiReference && (
                      <span className="ml-auto text-xs">Ref: {payment.upiReference}</span>
                    )}
                  </div>
                )}

                {payment.status === 'pending' && (
                  <div className="flex items-center gap-2 text-sm text-warning pt-2 border-t border-border">
                    <Clock className="w-4 h-4" />
                    <span>Payment pending after pickup completion</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Info Note */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Payments are processed within 24 hours of pickup completion. 
              You'll receive the amount directly in your linked UPI.
            </p>
          </div>
        </div>
      </div>
    </ResponsiveLayout>
  );
}
