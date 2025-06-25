import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Users, MessageSquare, FileText, Phone, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardMetrics {
  totalLeads: number;
  smsSentToday: number;
  quoteViews: number;
  callConversions: number;
  deliveryRate: number;
  conversionRate: number;
}

export default function MetricsGrid() {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ['/api/dashboard/metrics'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  const metricCards = [
    {
      title: "Total Leads",
      value: metrics.totalLeads.toLocaleString(),
      change: "+12.5%",
      changeType: "positive" as const,
      icon: Users,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      title: "SMS Sent Today",
      value: metrics.smsSentToday.toLocaleString(),
      change: `${metrics.deliveryRate.toFixed(1)}% delivery rate`,
      changeType: metrics.deliveryRate >= 95 ? "positive" : "negative" as const,
      icon: MessageSquare,
      iconBg: "bg-green-100",
      iconColor: "text-green-600"
    },
    {
      title: "Quote Views",
      value: metrics.quoteViews.toLocaleString(),
      change: `${metrics.conversionRate.toFixed(1)}% conversion rate`,
      changeType: metrics.conversionRate >= 20 ? "positive" : "neutral" as const,
      icon: FileText,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600"
    },
    {
      title: "Call Conversions",
      value: metrics.callConversions.toLocaleString(),
      change: "+8.7% this week",
      changeType: "positive" as const,
      icon: Phone,
      iconBg: "bg-green-100",
      iconColor: "text-green-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {metricCards.map((metric) => {
        const Icon = metric.icon;
        const TrendIcon = metric.changeType === "positive" ? TrendingUp : TrendingDown;
        
        return (
          <Card key={metric.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600">{metric.title}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{metric.value}</p>
                  <p className={`text-sm mt-1 flex items-center ${
                    metric.changeType === "positive" 
                      ? "text-green-600" 
                      : metric.changeType === "negative"
                      ? "text-red-600"
                      : "text-amber-600"
                  }`}>
                    {metric.changeType !== "neutral" && (
                      <TrendIcon className="h-3 w-3 mr-1" />
                    )}
                    {metric.change}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${metric.iconBg}`}>
                  <Icon className={`h-6 w-6 ${metric.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
