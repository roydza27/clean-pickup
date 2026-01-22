import React, { useState } from 'react';
import { Search, MessageSquare, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/common/StatusBadge';
import { complaints } from '@/data/mockData';

export default function ComplaintsManagement() {
  const [filter, setFilter] = useState<'all' | 'open' | 'in-progress' | 'resolved'>('all');

  const filteredComplaints = complaints.filter(c => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  const stats = {
    total: complaints.length,
    open: complaints.filter(c => c.status === 'open').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
  };

  return (
    <AdminLayout title="Complaints Management">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card-elevated flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Complaints</p>
          </div>
        </div>
        <div className="card-elevated flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold text-warning">{stats.open}</p>
            <p className="text-sm text-muted-foreground">Open</p>
          </div>
        </div>
        <div className="card-elevated flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold text-success">{stats.resolved}</p>
            <p className="text-sm text-muted-foreground">Resolved</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Search complaints..." className="pl-10" />
        </div>
        <div className="flex gap-2">
          {(['all', 'open', 'in-progress', 'resolved'] as const).map(f => (
            <Button
              key={f}
              variant={filter === f ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        {filteredComplaints.map(complaint => (
          <div key={complaint.id} className="card-elevated">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">{complaint.category}</h3>
                  <StatusBadge status={complaint.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  by {complaint.userName} • {complaint.id}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {new Date(complaint.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
            
            <p className="text-sm text-foreground mb-4">{complaint.description}</p>
            
            {complaint.pickupId && (
              <p className="text-sm text-muted-foreground mb-3">
                Related Pickup: <span className="text-primary">{complaint.pickupId}</span>
              </p>
            )}
            
            <div className="flex gap-2">
              {complaint.status === 'open' && (
                <>
                  <Button size="sm" variant="default">Mark In Progress</Button>
                  <Button size="sm" variant="outline">Contact User</Button>
                </>
              )}
              {complaint.status === 'in-progress' && (
                <Button size="sm" variant="success">Mark Resolved</Button>
              )}
              {complaint.status === 'resolved' && (
                <Button size="sm" variant="ghost">View Details</Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
