import { useState } from "react";
import { useRealTimeData } from "@/hooks/useRealTimeData";
import MetricsGrid from "@/components/MetricsGrid";
import RecentLeads from "@/components/RecentLeads";
import QuickActions from "@/components/QuickActions";
import SMSCampaignStatus from "@/components/SMSCampaignStatus";
import CustomSMSComposer from "@/components/CustomSMSComposer";
import QuoteAnalytics from "@/components/QuoteAnalytics";
import ComplianceMonitoring from "@/components/ComplianceMonitoring";
import { Button } from "@/components/ui/button";
import { Bell, Menu, AlertTriangle } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();
  
  // Real-time data hooks
  const realTimeData = useRealTimeData();
  
  // Emergency stop status
  const { data: emergencyStatus } = useQuery({
    queryKey: ['/api/emergency/status'],
    refetchInterval: 30000 // Check every 30 seconds
  });

  // Emergency stop mutation
  const emergencyStopMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/emergency/stop');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Emergency Stop Activated",
        description: "All SMS campaigns have been halted immediately.",
        variant: "destructive"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to activate emergency stop",
        variant: "destructive"
      });
    }
  });

  const handleEmergencyStop = () => {
    if (confirm('Are you sure you want to emergency stop all SMS campaigns? This will halt all outgoing messages immediately.')) {
      emergencyStopMutation.mutate();
    }
  };

  const currentTime = new Date().toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="w-8"></div>
          <h1 className="text-lg font-semibold text-slate-900">Quoting Fast</h1>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="p-2 text-slate-600 relative">
              <Bell className="h-5 w-5" />
              {realTimeData.hasNewAlerts && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Main Content */}
        <main className="flex-1">
          {/* Desktop Header */}
          <div className="hidden lg:block bg-white shadow-sm border-b border-slate-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Monitor your insurance lead management system
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {/* TCPA Status Indicator */}
                <div className="flex items-center text-sm">
                  <span 
                    className={`w-3 h-3 rounded-full mr-2 ${
                      emergencyStatus?.emergencyStopActive 
                        ? 'bg-red-500' 
                        : 'bg-green-500'
                    }`}
                  ></span>
                  <span className="text-slate-600">
                    {emergencyStatus?.emergencyStopActive ? 'Emergency Stop Active' : 'TCPA Compliant'}
                  </span>
                </div>
                
                {/* Time Zone Display */}
                <div className="text-sm text-slate-600">
                  <span>EST {currentTime}</span>
                </div>
                
                {/* Emergency Stop Button */}
                <Button
                  onClick={handleEmergencyStop}
                  disabled={emergencyStopMutation.isPending || emergencyStatus?.emergencyStopActive}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-medium"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {emergencyStopMutation.isPending ? 'Stopping...' : 'Emergency Stop'}
                </Button>
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="px-4 lg:px-6 py-6">
            {/* Key Metrics Cards */}
            <MetricsGrid />

            {/* Main Dashboard Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Recent Leads */}
              <div className="lg:col-span-2">
                <RecentLeads />
              </div>
              
              {/* Quick Actions */}
              <QuickActions />
            </div>

            {/* SMS Campaign Overview & Custom Composer */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <SMSCampaignStatus />
              <CustomSMSComposer />
            </div>

            {/* Analytics & Compliance Monitoring */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quote Page Analytics */}
              <div className="lg:col-span-2">
                <QuoteAnalytics />
              </div>
              
              {/* Compliance & Alerts */}
              <ComplianceMonitoring />
            </div>
          </div>
        </main>
      </div>


    </div>
  );
}
