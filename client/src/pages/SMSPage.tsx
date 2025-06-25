import CustomSMSComposer from "@/components/CustomSMSComposer";
import SMSCampaignStatus from "@/components/SMSCampaignStatus";

export default function SMSPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">SMS Campaigns</h1>
              <p className="text-slate-600">Manage SMS campaigns and send custom messages</p>
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
  );
}