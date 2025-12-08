import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, XCircle, Clock, User, Globe, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface SecurityIncident {
  id: string;
  user_id: string;
  incident_type: string;
  severity: string;
  timestamp: string;
  user_agent: string | null;
  ip_address: string | null;
  geolocation_country: string | null;
  time_to_decision_seconds: number | null;
  missed_iocs: any[];
  raw_event_data: any;
  user_name?: string;
}

interface IncidentTimelineProps {
  incidents: SecurityIncident[];
  loading?: boolean;
}

export function IncidentTimeline({ incidents, loading }: IncidentTimelineProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'phishing_failure': return <XCircle className="w-4 h-4" />;
      case 'brute_force': return <AlertTriangle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const formatIncidentType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Incident Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Incident Timeline (SIEM View)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Real-time security incident feed
        </p>
      </CardHeader>
      <CardContent>
        {incidents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No security incidents recorded yet</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
            <div className="space-y-4">
              {incidents.map((incident, index) => (
                <div key={incident.id} className="relative pl-10">
                  <div className={cn(
                    "absolute left-2 top-2 w-4 h-4 rounded-full flex items-center justify-center",
                    getSeverityColor(incident.severity)
                  )}>
                    {getIncidentIcon(incident.incident_type)}
                  </div>
                  
                  <div className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">
                            {formatIncidentType(incident.incident_type)}
                          </span>
                          <Badge className={cn("text-xs", getSeverityColor(incident.severity))}>
                            {incident.severity.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {formatDistanceToNow(new Date(incident.timestamp), { addSuffix: true })}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-muted-foreground" />
                            <span className="truncate">{incident.user_name || incident.user_id.slice(0, 8)}</span>
                          </div>
                          {incident.ip_address && (
                            <div className="flex items-center gap-1">
                              <Globe className="w-3 h-3 text-muted-foreground" />
                              <span>{incident.ip_address}</span>
                            </div>
                          )}
                          {incident.time_to_decision_seconds && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span>{incident.time_to_decision_seconds}s decision time</span>
                            </div>
                          )}
                          {incident.user_agent && (
                            <div className="flex items-center gap-1">
                              <Monitor className="w-3 h-3 text-muted-foreground" />
                              <span className="truncate">{incident.user_agent.split(' ')[0]}</span>
                            </div>
                          )}
                        </div>

                        {incident.missed_iocs && incident.missed_iocs.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">Missed IoCs:</p>
                            <div className="flex flex-wrap gap-1">
                              {incident.missed_iocs.map((ioc: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {ioc}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}