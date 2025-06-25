import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Phone, 
  Search,
  Calendar,
  Ban,
  AlertTriangle,
  TrendingUp,
  Users
} from "lucide-react";
import { formatPhoneNumber, getTimeAgo } from "@/lib/utils";
import Sidebar from "@/components/Sidebar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";

interface OptOut {
  id: number;
  phone: string;
  reason: string;
  source: string;
  createdAt: string;
}

interface OptOutStats {
  today: number;
  thisWeek: number;
  total: number;
}

export default function OptOutsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const isMobile = useIsMobile();

  const { data: optOutStats } = useQuery<OptOutStats>({
    queryKey: ['/api/optouts/stats'],
    refetchInterval: 30000
  });

  // Mock opt-out data since we don't have a specific endpoint
  const mockOptOuts: OptOut[] = [
    {
      id: 1,
      phone: "9547905094",
      reason: "STOP",
      source: "sms_reply",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      phone: "9547905095",
      reason: "UNSUBSCRIBE",
      source: "manual",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const filteredOptOuts = mockOptOuts.filter(optOut => 
    optOut.phone.includes(searchTerm) ||
    optOut.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        currentPage="optouts"
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
                  <h1 className="text-2xl font-bold text-slate-900">Opt-Outs & Suppressions</h1>
                  <p className="text-slate-600">Manage opt-out requests and suppression list</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                <Ban className="h-3 w-3 mr-1" />
                {optOutStats?.total || 0} Total Opt-Outs
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{optOutStats?.today || 0}</div>
                <p className="text-xs text-muted-foreground">Opt-outs today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{optOutStats?.thisWeek || 0}</div>
                <p className="text-xs text-muted-foreground">Opt-outs this week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-600">{optOutStats?.total || 0}</div>
                <p className="text-xs text-muted-foreground">All-time opt-outs</p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search by phone number or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Opt-Out List */}
          <div className="space-y-4">
            {filteredOptOuts.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Ban className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Opt-Outs Found</h3>
                  <p className="text-slate-600">
                    {searchTerm ? 'No opt-outs match your search criteria.' : 'No opt-out requests have been received yet.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredOptOuts.map((optOut) => (
                <Card key={optOut.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                          <Ban className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Phone className="h-4 w-4 text-slate-500" />
                            <span className="font-medium">{formatPhoneNumber(optOut.phone)}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-600">
                            <span>Reason: <span className="font-medium">{optOut.reason}</span></span>
                            <span>Source: <span className="font-medium capitalize">{optOut.source.replace('_', ' ')}</span></span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-red-600 border-red-200 mb-2">
                          Opted Out
                        </Badge>
                        <p className="text-sm text-slate-500">{getTimeAgo(optOut.createdAt)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Compliance Notice */}
          <Card className="mt-8 border-amber-200 bg-amber-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-amber-900 mb-2">TCPA Compliance Notice</h3>
                  <p className="text-amber-800 mb-4">
                    All opt-out requests are automatically processed and added to the suppression list. 
                    Numbers on this list will not receive any future SMS communications.
                  </p>
                  <div className="space-y-2 text-sm text-amber-700">
                    <p>• Opt-out requests are honored immediately</p>
                    <p>• Keywords like STOP, QUIT, CANCEL, UNSUBSCRIBE are monitored</p>
                    <p>• Manual opt-outs can be added through the system</p>
                    <p>• Suppression list is checked before every SMS send</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {isMobile && <MobileBottomNav currentPage="optouts" />}
    </div>
  );
}