import React from 'react';
import { Star, TrendingUp, Clock, ThumbsUp, AlertTriangle, Award } from 'lucide-react';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { kabadiwalas } from '@/data/mockData';

export default function TrustScore() {
  const kabadi = kabadiwalas[0];

  const metrics = [
    { icon: ThumbsUp, label: 'Completion Rate', value: '98%', good: true },
    { icon: Clock, label: 'On-Time Arrivals', value: '95%', good: true },
    { icon: Star, label: 'Customer Ratings', value: '4.8/5', good: true },
    { icon: AlertTriangle, label: 'Complaints', value: '2', good: false },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-success';
    if (score >= 4.0) return 'text-primary';
    if (score >= 3.5) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <ResponsiveLayout title="Trust Score">
      <div className="p-4">
        {/* Main Score */}
        <div className="card-elevated text-center mb-6">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className={`w-6 h-6 fill-current ${getScoreColor(kabadi.trustScore)}`} />
                <span className={`text-3xl font-bold ${getScoreColor(kabadi.trustScore)}`}>
                  {kabadi.trustScore}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">out of 5</p>
            </div>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1">Excellent!</h2>
          <p className="text-sm text-muted-foreground">
            You're in the top 10% of collectors
          </p>
        </div>

        {/* Metrics Grid */}
        <h2 className="section-title flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Performance Metrics
        </h2>
        
        <div className="grid grid-cols-2 gap-3 mb-6">
          {metrics.map((metric, i) => (
            <div key={i} className="card-elevated">
              <metric.icon className={`w-5 h-5 mb-2 ${metric.good ? 'text-primary' : 'text-warning'}`} />
              <p className={`text-xl font-bold ${metric.good ? 'text-foreground' : 'text-warning'}`}>
                {metric.value}
              </p>
              <p className="text-sm text-muted-foreground">{metric.label}</p>
            </div>
          ))}
        </div>

        {/* Badges */}
        <h2 className="section-title flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          Achievements
        </h2>
        
        <div className="space-y-2">
          <div className="card-elevated flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
              <span className="text-2xl">🏆</span>
            </div>
            <div>
              <p className="font-medium text-foreground">Top Collector</p>
              <p className="text-sm text-muted-foreground">Most pickups in December 2023</p>
            </div>
          </div>
          <div className="card-elevated flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
              <span className="text-2xl">⭐</span>
            </div>
            <div>
              <p className="font-medium text-foreground">5-Star Streak</p>
              <p className="text-sm text-muted-foreground">10 consecutive 5-star ratings</p>
            </div>
          </div>
          <div className="card-elevated flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl">💚</span>
            </div>
            <div>
              <p className="font-medium text-foreground">Eco Warrior</p>
              <p className="text-sm text-muted-foreground">Diverted 1 ton from landfill</p>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="font-medium text-foreground mb-2">Tips to Improve</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Arrive within the scheduled time window</li>
            <li>• Weigh items accurately in front of customer</li>
            <li>• Be polite and helpful</li>
          </ul>
        </div>
      </div>
    </ResponsiveLayout>
  );
}
