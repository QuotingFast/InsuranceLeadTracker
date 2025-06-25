import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Phone, Mail, Car, User, Shield, Clock, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Lead {
  id: number;
  qfCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  state: string;
  zipCode: string;
  currentInsurer: string;
  monthlyPremium: string;
  drivers: Array<{
    age: number;
    yearsOfExperience: number;
    violations: number;
    relationshipToLead: string;
  }>;
  vehicles: Array<{
    year: number;
    make: string;
    model: string;
    usage: string;
  }>;
}

export default function QuotePage() {
  const { qfCode } = useParams<{ qfCode: string }>();
  const { toast } = useToast();

  // Fetch lead data (this would be a dedicated endpoint in production)
  const { data: lead, isLoading } = useQuery<Lead>({
    queryKey: [`/api/leads/${qfCode}`],
    enabled: !!qfCode
  });

  // Track call conversion
  const callTrackingMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      const response = await apiRequest('POST', '/api/calls/track', {
        qfCode,
        phoneNumber,
        callStatus: 'initiated'
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Call Tracked",
        description: "We've noted your call for conversion tracking.",
      });
    }
  });

  const handleCallClick = (phoneNumber: string) => {
    callTrackingMutation.mutate(phoneNumber);
    window.location.href = `tel:${phoneNumber}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your personalized quote...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-900 mb-2">Quote Not Found</h1>
            <p className="text-slate-600">
              The quote you're looking for doesn't exist or may have expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const calculatePotentialSavings = () => {
    const currentPremium = parseFloat(lead.monthlyPremium || '0');
    const estimatedSavings = currentPremium * 0.15; // 15% average savings
    return {
      monthly: estimatedSavings,
      annual: estimatedSavings * 12
    };
  };

  const savings = calculatePotentialSavings();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="https://quoteproauto.com/logo" 
                alt="QuotePro Auto Logo" 
                className="h-12 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Your Personalized Quote
                </h1>
                <p className="text-slate-600 mt-1">Quote ID: {lead.qfCode}</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Clock className="h-3 w-3 mr-1" />
              Active Quote
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Main Quote Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium text-slate-900">
                  {lead.firstName} {lead.lastName}
                </p>
                <p className="text-sm text-slate-600">{lead.state} {lead.zipCode}</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-2 text-slate-400" />
                  <span>{lead.phone}</span>
                </div>
                {lead.email && (
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2 text-slate-400" />
                    <span>{lead.email}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current Coverage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-blue-600" />
                Current Coverage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-slate-600">Current Insurer</p>
                <p className="font-medium text-slate-900">
                  {lead.currentInsurer || 'Not specified'}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-slate-600">Monthly Premium</p>
                <p className="font-medium text-slate-900">
                  ${lead.monthlyPremium || 'Not specified'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Potential Savings */}
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center text-green-800">
                <DollarSign className="h-5 w-5 mr-2" />
                Potential Savings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-green-700">Estimated Monthly Savings</p>
                <p className="text-2xl font-bold text-green-800">
                  ${savings.monthly.toFixed(0)}
                </p>
              </div>
              <Separator className="bg-green-200" />
              <div>
                <p className="text-sm text-green-700">Annual Savings</p>
                <p className="text-lg font-semibold text-green-800">
                  ${savings.annual.toFixed(0)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Drivers Information */}
        {lead.drivers && lead.drivers.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Driver Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lead.drivers.map((driver, index) => (
                  <div key={index} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-slate-900">
                        Driver {index + 1}
                      </h4>
                      <Badge variant="outline">
                        {driver.relationshipToLead}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>Age: {driver.age} years</p>
                      <p>Experience: {driver.yearsOfExperience} years</p>
                      <p>Violations: {driver.violations}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vehicle Information */}
        {lead.vehicles && lead.vehicles.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Car className="h-5 w-5 mr-2 text-blue-600" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lead.vehicles.map((vehicle, index) => (
                  <div key={index} className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-medium text-slate-900 mb-2">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h4>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>Usage: {vehicle.usage || 'Personal'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Call to Action */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-blue-900 mb-4">
              Ready to Save on Your Insurance?
            </h2>
            <p className="text-blue-700 mb-6 max-w-2xl mx-auto">
              Our insurance specialists are standing by to help you secure the best rates. 
              Call now to speak with an expert about your personalized quote.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => handleCallClick('+18005551234')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                disabled={callTrackingMutation.isPending}
              >
                <Phone className="h-5 w-5 mr-2" />
                Call Now: (800) 555-1234
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleCallClick('+18005551235')}
                className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 text-lg"
                disabled={callTrackingMutation.isPending}
              >
                <Phone className="h-5 w-5 mr-2" />
                Spanish: (800) 555-1235
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-blue-200">
              <p className="text-sm text-blue-600">
                📞 Average call time: 5 minutes | 💰 Average savings: $200+ per month
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Trust Indicators */}
        <div className="mt-8 text-center">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-600">
            <div className="flex items-center">
              <Shield className="h-4 w-4 mr-1 text-green-600" />
              A+ BBB Rating
            </div>
            <div className="flex items-center">
              <Shield className="h-4 w-4 mr-1 text-green-600" />
              Licensed in 50 States
            </div>
            <div className="flex items-center">
              <Shield className="h-4 w-4 mr-1 text-green-600" />
              5+ Million Customers
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
