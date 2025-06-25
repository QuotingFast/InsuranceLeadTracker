import QuoteAnalytics from "@/components/QuoteAnalytics";

export default function QuotesPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Quote Pages</h1>
              <p className="text-slate-600">Manage and track quote page performance</p>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6">
        <QuoteAnalytics />
      </div>
    </div>
  );
}