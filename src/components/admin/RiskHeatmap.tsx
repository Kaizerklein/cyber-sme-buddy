import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, TrendingUp, TrendingDown, AlertTriangle, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface UserRiskScore {
  user_id: string;
  full_name: string | null;
  total_incidents: number;
  phishing_failures: number;
  avg_decision_time: number;
  risk_score: number;
  risk_level: string;
}

interface RiskHeatmapProps {
  userRiskScores: UserRiskScore[];
  loading?: boolean;
}

export function RiskHeatmap({ userRiskScores, loading }: RiskHeatmapProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-destructive';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-warning';
      case 'low': return 'bg-green-500';
      default: return 'bg-muted';
    }
  };

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const sortedUsers = [...userRiskScores].sort((a, b) => b.risk_score - a.risk_score);

  const riskDistribution = {
    critical: userRiskScores.filter(u => u.risk_level === 'critical').length,
    high: userRiskScores.filter(u => u.risk_level === 'high').length,
    medium: userRiskScores.filter(u => u.risk_level === 'medium').length,
    low: userRiskScores.filter(u => u.risk_level === 'low').length,
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risk Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Risk Distribution Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-primary" />
            Organization Risk Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-3xl font-bold text-destructive">{riskDistribution.critical}</p>
              <p className="text-sm text-muted-foreground">Critical Risk</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <p className="text-3xl font-bold text-orange-500">{riskDistribution.high}</p>
              <p className="text-sm text-muted-foreground">High Risk</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-warning/10 border border-warning/20">
              <p className="text-3xl font-bold text-warning">{riskDistribution.medium}</p>
              <p className="text-sm text-muted-foreground">Medium Risk</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-3xl font-bold text-green-500">{riskDistribution.low}</p>
              <p className="text-sm text-muted-foreground">Low Risk</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Risk Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Employee Risk Assessment
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Ranked by security risk score (higher = more at-risk)
          </p>
        </CardHeader>
        <CardContent>
          {sortedUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No user risk data available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedUsers.map((user, index) => (
                <div 
                  key={user.user_id}
                  className={cn(
                    "p-4 rounded-lg border transition-all hover:shadow-md",
                    index === 0 && user.risk_level === 'critical' && "border-destructive/50 bg-destructive/5"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold",
                        getRiskColor(user.risk_level)
                      )}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{user.full_name || 'Unknown User'}</p>
                        <p className="text-xs text-muted-foreground">{user.user_id.slice(0, 8)}...</p>
                      </div>
                    </div>
                    <Badge variant={getRiskBadgeVariant(user.risk_level) as any}>
                      {user.risk_level.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Risk Score</span>
                      <span className="font-mono font-bold">{user.risk_score}/100</span>
                    </div>
                    <Progress 
                      value={user.risk_score} 
                      className={cn(
                        "h-2",
                        user.risk_level === 'critical' && "[&>div]:bg-destructive",
                        user.risk_level === 'high' && "[&>div]:bg-orange-500",
                        user.risk_level === 'medium' && "[&>div]:bg-warning",
                        user.risk_level === 'low' && "[&>div]:bg-green-500"
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                    <div className="text-center p-2 bg-muted rounded">
                      <p className="font-bold">{user.total_incidents}</p>
                      <p className="text-muted-foreground">Total Incidents</p>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <p className="font-bold">{user.phishing_failures}</p>
                      <p className="text-muted-foreground">Phishing Failures</p>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <p className="font-bold">{Math.round(user.avg_decision_time)}s</p>
                      <p className="text-muted-foreground">Avg Decision Time</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}