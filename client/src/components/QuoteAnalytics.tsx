import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Eye, Phone } from "lucide-react";

interface TopQuote {
  qfCode: string;
  leadName: string;
  state: string;
  views: number;
  calls: number;
}

interface QuoteAnalytics {
  topPerformingQuotes: TopQuote[];
  callConversionStats: {
    totalCalls: number;
    completedCalls: number;
    conversionRate: number;
  };
}

export default function QuoteAnalytics() {
  const { data: analytics, isLoading } = useQuery<QuoteAnalytics>({
    queryKey: ['/api/quotes/analytics'],
    refetchInterval: 60000 // Refresh every minute
  });

  // Mock conversion funnel data - would come from API in production
  const conversionFunnel = [
    { stage: "SMS Sent", count: 1234, percentage: 100, color: "bg-blue-600" },
    { stage: "Quote Viewed", count: 892, percentage: 72, color: "bg-amber-600" },
    { stage: "Called", count: 217, percentage: 24, color: "bg-green-600" }
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Quote Page Analytics</CardTitle>
            <Skeleton className="h-8 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Skeleton className="h-4 w-48 mb-4" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-4 w-16 mb-1" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Quote Page Analytics</CardTitle>
          <Select defaultValue="7days">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="month">This month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {/* Top Performing Quotes */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-slate-700 mb-4">Top Performing Quote Pages</h4>
          <div className="space-y-3">
            {analytics?.topPerformingQuotes?.slice(0, 3).map((quote) => (
              <div key={quote.qfCode} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">{quote.qfCode}</p>
                  <p className="text-sm text-slate-500">{quote.leadName} • {quote.state}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-sm text-slate-900 mb-1">
                    <Eye className="h-3 w-3 mr-1" />
                    <span className="font-medium">{quote.views} views</span>
                  </div>
                  <div className="flex items-center text-sm text-green-600">
                    <Phone className="h-3 w-3 mr-1" />
                    <span>{quote.calls} calls</span>
                  </div>
                </div>
              </div>
            )) || (
              // Fallback when no data
              <div className="text-center py-4 text-slate-500">
                No quote data available
              </div>
            )}
          </div>
        </div>

        {/* Conversion Funnel */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-4">
            Conversion Funnel (Last 7 Days)
          </h4>
          <div className="space-y-3">
            {conversionFunnel.map((stage) => (
              <div key={stage.stage} className="flex items-center">
                <div className="w-full bg-slate-200 rounded-full h-8 relative overflow-hidden">
                  <div 
                    className={`${stage.color} h-8 rounded-full flex items-center justify-center text-white text-sm font-medium transition-all duration-500`}
                    style={{ width: `${stage.percentage}%` }}
                  >
                    <span className="absolute left-4">
                      {stage.stage}: {stage.count.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion Rate Summary */}
        {analytics?.callConversionStats && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Overall Conversion Rate</p>
                <p className="text-2xl font-bold text-blue-900">
                  {analytics.callConversionStats.conversionRate.toFixed(1)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-700">Total Calls</p>
                <p className="text-lg font-semibold text-blue-900">
                  {analytics.callConversionStats.totalCalls.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
