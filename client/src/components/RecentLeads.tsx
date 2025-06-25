import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

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
  state: string;
  createdAt: string;
  drivers: Driver[];
  vehicles: Vehicle[];
  smsMessages: SmsMessage[];
}

export default function RecentLeads() {
  const { data: leads, isLoading } = useQuery<Lead[]>({
    queryKey: ['/api/leads/recent'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const getLeadStatus = (lead: Lead) => {
    const latestSms = lead.smsMessages[0];
    if (!latestSms) return { label: "New Lead", variant: "secondary" as const };
    
    switch (latestSms.status) {
      case "delivered":
        return { label: "SMS Sent", variant: "default" as const };
      case "failed":
        return { label: "SMS Failed", variant: "destructive" as const };
      case "pending":
        return { label: "SMS Pending", variant: "secondary" as const };
      default:
        return { label: "Processing", variant: "secondary" as const };
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Leads</CardTitle>
            <Skeleton className="h-4 w-16" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 py-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <div className="text-right space-y-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!leads || leads.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Leads</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-slate-500">No recent leads found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Leads</CardTitle>
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leads.map((lead) => {
            const status = getLeadStatus(lead);
            const initials = getInitials(lead.firstName, lead.lastName);
            const timeAgo = formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true });
            
            return (
              <div key={lead.id} className="flex items-center justify-between py-4 border-b border-slate-100 last:border-b-0">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">{initials}</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {lead.firstName} {lead.lastName}
                    </p>
                    <p className="text-sm text-slate-500">
                      {lead.phone} • {lead.state} • {lead.qfCode}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge variant={status.variant}>
                      {status.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500">{timeAgo}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
