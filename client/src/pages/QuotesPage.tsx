import QuoteAnalytics from "@/components/QuoteAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Eye, Phone, BarChart3 } from "lucide-react";
import { useState } from "react";

export default function QuotesPage() {
  const [testQfCode, setTestQfCode] = useState("QFTEST02");

  const handleTestQuote = () => {
    window.open(`/quote?qf=${testQfCode}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Quote Pages Management</h1>
              <p className="text-slate-600">Monitor quote page performance and test personalized forms</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Quick Test Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Test Personalized Quote Form
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 block mb-2">
                  QF Code to Test
                </label>
                <Input
                  value={testQfCode}
                  onChange={(e) => setTestQfCode(e.target.value)}
                  placeholder="Enter QF code (e.g., QFTEST02)"
                />
              </div>
              <Button onClick={handleTestQuote} className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Open Quote Form
              </Button>
            </div>
            <p className="text-sm text-slate-600 mt-2">
              This opens the actual personalized insurance quote form with multi-step questions and dynamic phone routing.
            </p>
          </CardContent>
        </Card>

        {/* Analytics Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Quote Performance Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QuoteAnalytics />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}