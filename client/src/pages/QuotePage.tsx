import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MapPin, Car, User, Shield, Clock, Star } from "lucide-react";

interface Driver {
  firstName: string;
  lastName: string;
  relationship: string;
  licenseStatus: string;
  education?: string;
  occupation?: string;
  violations: number;
}

interface Vehicle {
  year: number;
  make: string;
  model: string;
  submodel?: string;
  primaryUse?: string;
}

interface Lead {
  id: number;
  qfCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  city: string;
  state: string;
  zipCode: string;
  currentPolicy?: string;
  requestedCoverageType?: string;
  drivers: Driver[];
  vehicles: Vehicle[];
  createdAt: string;
}

export default function QuotePage() {
  const [, params] = useRoute("/quote/:qfCode");
  const qfCode = params?.qfCode;

  const { data: lead, isLoading, error } = useQuery({
    queryKey: [`/api/quote/${qfCode}`],
    enabled: !!qfCode,
  });

  const handleCallNow = () => {
    if (lead) {
      // Track call conversion
      fetch('/api/calls/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          qfCode: lead.qfCode,
          phoneNumber: lead.phone
        })
      });
      
      // Initiate call
      window.location.href = `tel:+19547905093`;
    }
  };

  const handleEmailQuote = () => {
    if (lead) {
      const subject = `Your Auto Insurance Quote - ${lead.qfCode}`;
      const body = `Hi ${lead.firstName},\n\nThank you for your interest in auto insurance. We've prepared a competitive quote for you.\n\nQuote Reference: ${lead.qfCode}\n\nCall us at (954) 790-5093 to discuss your options and get instant coverage.\n\nBest regards,\nQuotePro Auto Insurance`;
      
      window.location.href = `mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your quote...</p>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Quote Not Found</h1>
            <p className="text-gray-600 mb-6">
              We couldn't find a quote with the code: {qfCode}
            </p>
            <Button onClick={() => window.location.href = 'tel:+19547905093'} className="w-full">
              <Phone className="h-4 w-4 mr-2" />
              Call for Assistance
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="https://quoteproauto.com/logo" 
                alt="QuotePro Auto" 
                className="h-10 w-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Your Auto Insurance Quote</h1>
                <p className="text-sm text-gray-600">Quote ID: {lead.qfCode}</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Active Quote
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Lead Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Contact Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{lead.firstName} {lead.lastName}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{lead.phone}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <span>{lead.email}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>
                  {lead.address && `${lead.address}, `}
                  {lead.city}, {lead.state} {lead.zipCode}
                </span>
              </div>
              {lead.currentPolicy && (
                <div className="flex items-center space-x-3">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span>Current Provider: {lead.currentPolicy}</span>
                </div>
              )}
              {!lead.currentPolicy && (
                <div className="flex items-center space-x-3">
                  <Shield className="h-4 w-4 text-red-500" />
                  <span className="text-red-600 font-medium">Currently Uninsured</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Drivers */}
        {lead.drivers && lead.drivers.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Drivers ({lead.drivers.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lead.drivers.map((driver, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="font-medium">{driver.firstName} {driver.lastName}</p>
                      <p className="text-sm text-gray-600">{driver.relationship}</p>
                      <p className="text-sm text-gray-600">License: {driver.licenseStatus}</p>
                    </div>
                    <div>
                      {driver.education && (
                        <p className="text-sm text-gray-600">Education: {driver.education}</p>
                      )}
                      {driver.occupation && (
                        <p className="text-sm text-gray-600">Occupation: {driver.occupation}</p>
                      )}
                    </div>
                    <div>
                      <Badge 
                        variant={driver.violations === 0 ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {driver.violations === 0 ? "Clean Record" : `${driver.violations} Violations`}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Vehicles */}
        {lead.vehicles && lead.vehicles.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Car className="h-5 w-5" />
                <span>Vehicles ({lead.vehicles.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lead.vehicles.map((vehicle, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                        {vehicle.submodel && ` ${vehicle.submodel}`}
                      </p>
                      {vehicle.primaryUse && (
                        <p className="text-sm text-gray-600">Primary Use: {vehicle.primaryUse}</p>
                      )}
                    </div>
                    <div className="flex justify-end">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {vehicle.year >= 2020 ? "Recent Model" : "Older Model"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Call to Action */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <Phone className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-green-800 mb-2">Get Your Quote Now</h3>
                <p className="text-green-700 text-sm mb-4">
                  Speak with our licensed agents for instant rates and immediate coverage
                </p>
                <div className="flex items-center justify-center space-x-2 text-green-600 mb-4">
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm font-medium">5.0 Rating</span>
                </div>
              </div>
              <Button 
                onClick={handleCallNow} 
                className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-3"
                size="lg"
              >
                <Phone className="h-5 w-5 mr-2" />
                Call (954) 790-5093
              </Button>
              <p className="text-xs text-green-600 mt-2">
                Available 24/7 • Licensed Agents • Instant Quotes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <Mail className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">Email Quote Details</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Get your personalized quote details sent directly to your inbox
                </p>
                <div className="flex items-center justify-center space-x-2 text-gray-500 mb-4">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Instant delivery</span>
                </div>
              </div>
              <Button 
                onClick={handleEmailQuote} 
                variant="outline" 
                className="w-full border-blue-300 text-blue-600 hover:bg-blue-50 text-lg py-3"
                size="lg"
              >
                <Mail className="h-5 w-5 mr-2" />
                Email Quote
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                No spam • Secure delivery • Detailed breakdown
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quote Created Date */}
        <div className="text-center mt-8 text-sm text-gray-500">
          Quote created on {new Date(lead.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  );
}