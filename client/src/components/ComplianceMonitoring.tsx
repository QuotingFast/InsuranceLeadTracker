import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  TriangleAlert,
  Ban
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SystemAlert {
  id: number;
  alertType: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  isRead: boolean;
  createdAt: string;
}

interface OptOutStats {
  today: number;
  thisWeek: number;
  total: number;
}

export default function ComplianceMonitoring() {
  const { data: alerts, isLoading: alertsLoading } = useQuery<SystemAlert[]>({
    queryKey: ['/api/alerts'],
    refetchInterval: 30000 // Check every 30 seconds
  });

  const { data: optOutStats, isLoading: optOutsLoading } = useQuery<OptOutStats>({
    queryKey: ['/api/optouts/stats'],
    refetchInterval: 60000 // Check every minute
  });

  const getSeverityIcon = (severity: SystemAlert['severity']) => {
    switch (severity) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'error':
        return <TriangleAlert className="h-4 w-4 text-red-600" />;
      case 'critical':
        return <TriangleAlert className="h-4 w-4 text-red-600" />;
    }
  };

  const getSeverityBg = (severity: SystemAlert['severity']) => {
    switch (severity) {
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'error':
      case 'critical':
        return 'bg-red-50 border-red-200';
    }
  };

  // Mock TCPA compliance checks - in production this would be real-time
  const tcpaChecks = [
    { name: "Business Hours Check", status: "pass" },
    { name: "Weekend Blocking", status: "active" },
    { name: "Timezone Validation", status: "pass" },
    { name: "Opt-out Processing", status: "active" }
  ];

  const recentAlerts = alerts?.slice(0, 3) || [];

  if (alertsLoading && optOutsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance & Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance & Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        {/* TCPA Compliance Check */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-700">TCPA Status</span>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Shield className="h-3 w-3 mr-1" />
              Compliant
            </Badge>
          </div>
          <div className="space-y-2 text-xs text-slate-600">
            {tcpaChecks.map((check) => (
              <div key={check.name} className="flex justify-between">
                <span>{check.name}</span>
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  <span className="capitalize">{check.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-slate-700 mb-3">Recent Alerts</h4>
          <div className="space-y-2">
            {recentAlerts.length > 0 ? (
              recentAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`flex items-start space-x-3 p-3 rounded-lg border ${getSeverityBg(alert.severity)}`}
                >
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">{alert.message}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <Info className="h-4 w-4 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-slate-700">All systems operating normally</p>
                  <p className="text-xs text-slate-500 mt-1">No recent alerts</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Opt-out Summary */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-3">Opt-Out Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Today</span>
              <span className="font-medium">{optOutStats?.today || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">This Week</span>
              <span className="font-medium">{optOutStats?.thisWeek || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Total Suppressed</span>
              <span className="font-medium">{optOutStats?.total?.toLocaleString() || 0}</span>
            </div>
          </div>
          
          <Button 
            variant="outline"
            className="w-full mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-4 rounded-md text-sm font-medium transition-colors"
          >
            <Ban className="h-4 w-4 mr-2" />
            Manage Opt-Out List
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
