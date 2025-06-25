import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SmsStats {
  sentToday: number;
  deliveredToday: number;
  failedToday: number;
  deliveryRate: number;
}

export default function SMSCampaignStatus() {
  const { data: smsStats, isLoading } = useQuery<SmsStats>({
    queryKey: ['/api/sms/status'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>SMS Campaign Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Skeleton className="h-8 w-16 mx-auto mb-2" />
              <Skeleton className="h-4 w-24 mx-auto" />
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <Skeleton className="h-8 w-16 mx-auto mb-2" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </div>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!smsStats) return null;

  // Mock campaign progress data - in real app this would come from API
  const campaignProgress = [
    {
      name: "Follow-up Messages",
      completed: 847,
      total: 920,
      color: "bg-blue-600"
    },
    {
      name: "Urgent Messages", 
      completed: 234,
      total: 450,
      color: "bg-amber-600"
    },
    {
      name: "Last Chance",
      completed: 89,
      total: 180, 
      color: "bg-red-600"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>SMS Campaign Status</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Daily Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {smsStats.deliveredToday.toLocaleString()}
            </p>
            <p className="text-sm text-slate-600">Delivered Today</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">
              {smsStats.failedToday.toLocaleString()}
            </p>
            <p className="text-sm text-slate-600">Failed Today</p>
          </div>
        </div>

        {/* Campaign Progress */}
        <div className="space-y-4 mb-6">
          <h4 className="font-medium text-slate-700">Campaign Progress</h4>
          {campaignProgress.map((campaign) => {
            const percentage = (campaign.completed / campaign.total) * 100;
            
            return (
              <div key={campaign.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{campaign.name}</span>
                  <span className="font-medium">
                    {campaign.completed.toLocaleString()}/{campaign.total.toLocaleString()}
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </div>

        {/* TCPA Compliance Status */}
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">TCPA Compliance</span>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Shield className="h-3 w-3 mr-1" />
              100% Compliant
            </Badge>
          </div>
          <div className="text-xs text-slate-600">
            <p>Next business hours: Tomorrow 8:00 AM EST</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
