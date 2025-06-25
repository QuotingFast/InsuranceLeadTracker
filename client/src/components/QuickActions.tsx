import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Play, 
  BarChart3, 
  Ban, 
  Shield,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface SystemStatus {
  twilioConnection: boolean;
  databaseConnection: boolean;
  queueLength: number;
}

export default function QuickActions() {
  // In a real app, this would be an actual API call
  const { data: systemStatus } = useQuery<SystemStatus>({
    queryKey: ['/api/system/status'],
    // Mock data for now since the endpoint doesn't exist yet
    queryFn: () => Promise.resolve({
      twilioConnection: true,
      databaseConnection: true,
      queueLength: 23
    }),
    refetchInterval: 30000
  });

  const quickActions = [
    {
      title: "Send Custom SMS",
      description: "Send personalized SMS to any number",
      icon: MessageSquare,
      color: "bg-blue-600 hover:bg-blue-700",
      action: () => {
        // This would open the custom SMS composer
        document.getElementById('custom-sms-composer')?.scrollIntoView({ behavior: 'smooth' });
      }
    },
    {
      title: "Process Pending Leads",
      description: "Start processing queued leads",
      icon: Play,
      color: "bg-green-600 hover:bg-green-700",
      action: () => {
        // This would trigger batch processing
        console.log('Process pending leads');
      }
    },
    {
      title: "Quote Analytics",
      description: "View detailed quote performance",
      icon: BarChart3,
      color: "bg-amber-600 hover:bg-amber-700",
      action: () => {
        // This would navigate to analytics page
        console.log('View quote analytics');
      }
    },
    {
      title: "Manage Opt-Outs",
      description: "Review and manage opt-out list",
      icon: Ban,
      color: "bg-slate-600 hover:bg-slate-700",
      action: () => {
        // This would open opt-out management
        console.log('Manage opt-outs');
      }
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.title}
              onClick={action.action}
              className={`w-full flex items-center justify-center px-4 py-3 text-white rounded-lg font-medium transition-colors ${action.color}`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {action.title}
            </Button>
          );
        })}

        {/* System Health Status */}
        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-700">System Health</span>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Shield className="h-3 w-3 mr-1" />
              All Systems Go
            </Badge>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Twilio Connection</span>
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Database</span>
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">SMS Queue</span>
              <span className="text-slate-600">
                {systemStatus?.queueLength || 0} pending
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
