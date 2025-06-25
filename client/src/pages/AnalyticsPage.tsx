import QuoteAnalytics from "@/components/QuoteAnalytics";

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
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
                  <h1 className="text-2xl font-bold text-slate-900">Quote Analytics</h1>
                  <p className="text-slate-600">Track quote performance and conversion rates</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <QuoteAnalytics />
        </div>
      </div>

      {isMobile && <MobileBottomNav currentPage="analytics" />}
    </div>
  );
}