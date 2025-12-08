import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Users, 
  Clock, 
  Download,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { IncidentTimeline } from '@/components/admin/IncidentTimeline';
import { RiskHeatmap } from '@/components/admin/RiskHeatmap';

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

interface UserRiskScore {
  user_id: string;
  full_name: string | null;
  total_incidents: number;
  phishing_failures: number;
  avg_decision_time: number;
  risk_score: number;
  risk_level: string;
}

interface DashboardStats {
  totalIncidents: number;
  criticalIncidents: number;
  usersAtRisk: number;
  avgDecisionTime: number;
}

export default function AdminIncidentDashboard() {
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [userRiskScores, setUserRiskScores] = useState<UserRiskScore[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalIncidents: 0,
    criticalIncidents: 0,
    usersAtRisk: 0,
    avgDecisionTime: 0
  });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('admin_roles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setIsAdmin(true);
      fetchDashboardData();
    } else {
      setIsAdmin(false);
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all security incidents
      const { data: incidentsData, error: incidentsError } = await supabase
        .from('security_incidents')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (incidentsError) throw incidentsError;

      // Fetch profiles to get user names
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name');

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      const incidentsWithNames: SecurityIncident[] = (incidentsData || []).map(incident => ({
        id: incident.id,
        user_id: incident.user_id,
        incident_type: incident.incident_type,
        severity: incident.severity || 'medium',
        timestamp: incident.timestamp || incident.created_at,
        user_agent: incident.user_agent,
        ip_address: incident.ip_address,
        geolocation_country: incident.geolocation_country,
        time_to_decision_seconds: incident.time_to_decision_seconds,
        missed_iocs: Array.isArray(incident.missed_iocs) ? incident.missed_iocs : [],
        raw_event_data: incident.raw_event_data,
        user_name: profileMap.get(incident.user_id) || undefined
      }));

      setIncidents(incidentsWithNames);

      // Calculate user risk scores manually since we can't query views
      const userIncidentMap = new Map<string, { incidents: number; failures: number; totalTime: number; count: number }>();
      
      incidentsData?.forEach(incident => {
        const current = userIncidentMap.get(incident.user_id) || { incidents: 0, failures: 0, totalTime: 0, count: 0 };
        current.incidents++;
        if (incident.incident_type === 'phishing_failure') current.failures++;
        if (incident.time_to_decision_seconds) {
          current.totalTime += incident.time_to_decision_seconds;
          current.count++;
        }
        userIncidentMap.set(incident.user_id, current);
      });

      const riskScores: UserRiskScore[] = [];
      userIncidentMap.forEach((data, userId) => {
        const avgTime = data.count > 0 ? data.totalTime / data.count : 10;
        const riskScore = Math.min(100, Math.max(0, 50 + (data.failures * 10) + (avgTime < 3 ? 15 : 0)));
        let riskLevel = 'low';
        if (riskScore > 80) riskLevel = 'critical';
        else if (riskScore > 60) riskLevel = 'high';
        else if (riskScore > 30) riskLevel = 'medium';

        riskScores.push({
          user_id: userId,
          full_name: profileMap.get(userId) || null,
          total_incidents: data.incidents,
          phishing_failures: data.failures,
          avg_decision_time: avgTime,
          risk_score: riskScore,
          risk_level: riskLevel
        });
      });

      setUserRiskScores(riskScores);

      // Calculate stats
      const totalIncidents = incidentsData?.length || 0;
      const criticalIncidents = incidentsData?.filter(i => i.severity === 'critical' || i.severity === 'high').length || 0;
      const usersAtRisk = riskScores.filter(u => u.risk_level === 'high' || u.risk_level === 'critical').length;
      const avgDecisionTime = incidentsData?.reduce((acc, i) => acc + (i.time_to_decision_seconds || 0), 0) / (totalIncidents || 1);

      setStats({
        totalIncidents,
        criticalIncidents,
        usersAtRisk,
        avgDecisionTime: Math.round(avgDecisionTime)
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportIncidents = () => {
    const csvContent = [
      ['Timestamp', 'User ID', 'Incident Type', 'Severity', 'IP Address', 'Decision Time (s)', 'Missed IoCs'].join(','),
      ...incidents.map(i => [
        i.timestamp,
        i.user_id,
        i.incident_type,
        i.severity,
        i.ip_address || '',
        i.time_to_decision_seconds || '',
        (i.missed_iocs || []).join(';')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-incidents-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-16 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You need administrator privileges to access this dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            Incident Investigation Dashboard
          </h1>
          <p className="text-muted-foreground">
            Security Information and Event Management (SIEM) View
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchDashboardData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportIncidents} disabled={incidents.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalIncidents}</div>
            <p className="text-xs text-muted-foreground">Security events logged</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Critical/High</CardTitle>
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.criticalIncidents}</div>
            <p className="text-xs text-muted-foreground">High severity incidents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Users at Risk</CardTitle>
            <Users className="w-4 h-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.usersAtRisk}</div>
            <p className="text-xs text-muted-foreground">High/Critical risk level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Decision Time</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgDecisionTime}s</div>
            <p className="text-xs text-muted-foreground">Time to make decisions</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline" className="gap-2">
            <Clock className="w-4 h-4" />
            Incident Timeline
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Risk Heatmap
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <IncidentTimeline incidents={incidents} loading={loading} />
        </TabsContent>

        <TabsContent value="heatmap">
          <RiskHeatmap userRiskScores={userRiskScores} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}