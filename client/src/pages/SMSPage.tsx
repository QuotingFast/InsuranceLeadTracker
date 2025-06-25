import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import Sidebar from "@/components/Sidebar";
import MobileBottomNav from "@/components/MobileBottomNav";
import CustomSMSComposer from "@/components/CustomSMSComposer";
import SMSCampaignStatus from "@/components/SMSCampaignStatus";
import { Button } from "@/components/ui/button";

export default function SMSPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        currentPage="sms"
      />

      <div className={`transition-all duration-300 ${!isMobile && sidebarOpen ? 'ml-64' : ''}`}>
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-slate-200">
          <div className="px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden"
                  >
                    <span className="sr-only">Open sidebar</span>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </Button>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">SMS Campaigns</h1>
                  <p className="text-slate-600">Manage SMS campaigns and send custom messages</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <SMSCampaignStatus />
          <CustomSMSComposer />
        </div>
      </div>

      {isMobile && <MobileBottomNav currentPage="sms" />}
    </div>
  );
}