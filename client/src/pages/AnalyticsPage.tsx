import QuoteAnalytics from "@/components/QuoteAnalytics";

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Quote Analytics</h1>
              <p className="text-slate-600">Track quote performance and conversion rates</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <QuoteAnalytics />
      </div>
    </div>
  );
}