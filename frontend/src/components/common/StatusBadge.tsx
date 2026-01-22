import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  scheduled: { label: 'Scheduled', className: 'status-scheduled' },
  assigned: { label: 'Assigned', className: 'bg-citizen/10 text-citizen' },
  'in-progress': { label: 'In Progress', className: 'status-pending' },
  completed: { label: 'Completed', className: 'status-completed' },
  missed: { label: 'Missed', className: 'status-missed' },
  cancelled: { label: 'Cancelled', className: 'bg-muted text-muted-foreground' },
  pending: { label: 'Pending', className: 'status-pending' },
  paid: { label: 'Paid', className: 'status-completed' },
  failed: { label: 'Failed', className: 'status-missed' },
  open: { label: 'Open', className: 'status-pending' },
  resolved: { label: 'Resolved', className: 'status-completed' },
  closed: { label: 'Closed', className: 'bg-muted text-muted-foreground' },
  active: { label: 'Active', className: 'status-completed' },
  inactive: { label: 'Inactive', className: 'bg-muted text-muted-foreground' },
  suspended: { label: 'Suspended', className: 'status-missed' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'bg-muted text-muted-foreground' };

  return (
    <span className={cn('status-badge', config.className, className)}>
      {config.label}
    </span>
  );
}
