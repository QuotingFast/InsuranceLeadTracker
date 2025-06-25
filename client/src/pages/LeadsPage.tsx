import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Car, 
  User, 
  Search,
  Calendar,
  MessageSquare,
  ExternalLink
} from "lucide-react";
import { formatPhoneNumber, getTimeAgo } from "@/lib/utils";
import Sidebar from "@/components/Sidebar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";

interface Driver {
  age: number;
  yearsOfExperience: number;
  violations: number;
  relationshipToLead: string;
}

interface Vehicle {
  year: number;
  make: string;
  model: string;
}

interface SmsMessage {
  messageType: string;
  status: string;
  createdAt: string;
}

interface Lead {
  id: number;
  qfCode: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  state: string;
  zipCode: string;
  currentInsurer: string;
  monthlyPremium: string;
  createdAt: string;
  drivers: Driver[];
  vehicles: Vehicle[];
  smsMessages: SmsMessage[];
}

export default function LeadsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const isMobile = useIsMobile();

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ['/api/leads/recent'],
    refetchInterval: 30000
  });

  const filteredLeads = leads.filter(lead => 
    `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone.includes(searchTerm) ||
    lead.qfCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLeadStatus = (lead: Lead) => {
    const hasMessages = lead.smsMessages && lead.smsMessages.length > 0;
    if (!hasMessages) return { status: 'New', color: 'bg-blue-100 text-blue-800' };
    
    const lastMessage = lead.smsMessages[lead.smsMessages.length - 1];
    if (lastMessage.status === 'delivered') return { status: 'Contacted', color: 'bg-green-100 text-green-800' };
    if (lastMessage.status === 'failed') return { status: 'Failed', color: 'bg-red-100 text-red-800' };
    return { status: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        currentPage="leads"
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
                  <h1 className="text-2xl font-bold text-slate-900">Lead Management</h1>
                  <p className="text-slate-600">View and manage all insurance leads</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {filteredLeads.length} Total Leads
              </Badge>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-4">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search leads by name, phone, or QF code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Leads List */}
          <div className="space-y-4">
            {filteredLeads.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <User className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Leads Found</h3>
                  <p className="text-slate-600">
                    {searchTerm ? 'No leads match your search criteria.' : 'No leads have been captured yet.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredLeads.map((lead) => {
                const status = getLeadStatus(lead);
                return (
                  <Card key={lead.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <User className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              {lead.firstName} {lead.lastName}
                            </CardTitle>
                            <p className="text-sm text-slate-600">QF Code: {lead.qfCode}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={status.color}>
                            {status.status}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/quote/${lead.qfCode}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View Quote
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Contact Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-slate-500" />
                          <span className="text-sm">{formatPhoneNumber(lead.phone)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-500" />
                          <span className="text-sm">{lead.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-500" />
                          <span className="text-sm">{lead.state} {lead.zipCode}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-500" />
                          <span className="text-sm">{getTimeAgo(lead.createdAt)}</span>
                        </div>
                      </div>

                      <Separator />

                      {/* Vehicle Information */}
                      {lead.vehicles && lead.vehicles.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-900 mb-2 flex items-center gap-1">
                            <Car className="h-4 w-4" />
                            Vehicles
                          </h4>
                          <div className="space-y-1">
                            {lead.vehicles.map((vehicle, index) => (
                              <p key={index} className="text-sm text-slate-600">
                                {vehicle.year} {vehicle.make} {vehicle.model}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SMS Status */}
                      {lead.smsMessages && lead.smsMessages.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-900 mb-2 flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            SMS History
                          </h4>
                          <div className="space-y-1">
                            {lead.smsMessages.slice(-2).map((sms, index) => (
                              <div key={index} className="flex justify-between items-center text-sm">
                                <span className="text-slate-600 capitalize">{sms.messageType}</span>
                                <Badge
                                  variant="outline"
                                  className={
                                    sms.status === 'delivered' ? 'text-green-600 border-green-200' :
                                    sms.status === 'failed' ? 'text-red-600 border-red-200' :
                                    'text-yellow-600 border-yellow-200'
                                  }
                                >
                                  {sms.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Current Insurance */}
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-slate-600">Current Insurer:</span>
                            <p className="font-medium">{lead.currentInsurer}</p>
                          </div>
                          <div>
                            <span className="text-slate-600">Monthly Premium:</span>
                            <p className="font-medium">${lead.monthlyPremium}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>

      {isMobile && <MobileBottomNav currentPage="leads" />}
    </div>
  );
}