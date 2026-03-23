import React from 'react';
import { Download, Calendar, TrendingUp, Package, IndianRupee, Leaf } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { dashboardStats } from '@/data/mockData';

export default function ReportsMetrics() {
  const monthlyData = [
    { month: 'Jan', pickups: 245, earnings: 45000, weight: 890 },
    { month: 'Feb', pickups: 312, earnings: 58000, weight: 1120 },
    { month: 'Mar', pickups: 398, earnings: 72000, weight: 1450 },
    { month: 'Apr', pickups: 421, earnings: 78000, weight: 1580 },
  ];

  const reports = [
    { name: 'Monthly Pickups Report', type: 'Pickups', updated: '2024-01-14' },
    { name: 'Collector Performance', type: 'Performance', updated: '2024-01-13' },
    { name: 'Revenue Analysis', type: 'Financial', updated: '2024-01-12' },
    { name: 'Locality Coverage', type: 'Operations', updated: '2024-01-10' },
  ];

  return (
    <AdminLayout title="Reports & Metrics">
      {/* Date Range */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Last 30 days</span>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export All Reports
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card-elevated">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Total Pickups</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{dashboardStats.totalPickups}</p>
          <p className="text-sm text-success">+15% from last month</p>
        </div>
        <div className="card-elevated">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Total Revenue</span>
          </div>
          <p className="text-3xl font-bold text-foreground">₹{(dashboardStats.totalEarnings / 1000).toFixed(0)}K</p>
          <p className="text-sm text-success">+22% from last month</p>
        </div>
        <div className="card-elevated">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Completion Rate</span>
          </div>
          <p className="text-3xl font-bold text-foreground">95.3%</p>
          <p className="text-sm text-success">+2.1% from last month</p>
        </div>
        <div className="card-elevated">
          <div className="flex items-center gap-2 mb-2">
            <Leaf className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Landfill Diverted</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{dashboardStats.landfillDiverted}T</p>
          <p className="text-sm text-success">+18% from last month</p>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="card-elevated mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Monthly Trend</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-border">
                <th className="pb-3 font-medium text-muted-foreground">Month</th>
                <th className="pb-3 font-medium text-muted-foreground">Pickups</th>
                <th className="pb-3 font-medium text-muted-foreground">Earnings</th>
                <th className="pb-3 font-medium text-muted-foreground">Weight (kg)</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map(row => (
                <tr key={row.month} className="border-b border-border last:border-0">
                  <td className="py-3 font-medium">{row.month} 2024</td>
                  <td className="py-3">{row.pickups}</td>
                  <td className="py-3 text-primary font-medium">₹{row.earnings.toLocaleString()}</td>
                  <td className="py-3">{row.weight.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Available Reports */}
      <div className="card-elevated">
        <h2 className="text-lg font-semibold text-foreground mb-4">Available Reports</h2>
        <div className="space-y-3">
          {reports.map((report, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium text-foreground">{report.name}</p>
                <p className="text-sm text-muted-foreground">
                  {report.type} • Updated {new Date(report.updated).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
              </div>
              <Button size="sm" variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
