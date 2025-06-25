import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, MapPin, Car, Users, Shield, Clock, CheckCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface QuoteData {
  id: number;
  qfCode: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  city: string;
  state: string;
  zip: string;
  currentPolicy?: string;
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
  }>;
  createdAt: string;
}

interface RingbaMapping {
  phoneNumber: string;
  scriptUrl: string;
}

export default function QuotePage() {
  const [, setLocation] = useLocation();
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [callNumber, setCallNumber] = useState<string>('');
  const [showPopup, setShowPopup] = useState(false);

  // Extract QF code from URL
  const urlParams = new URLSearchParams(window.location.search);
  const qfCode = urlParams.get('qf') || window.location.pathname.split('/').pop();

  // Ringba phone number mappings based on lead profile
  const getRingbaMapping = (quote: QuoteData): RingbaMapping => {
    const ringbaMap = {
      insured_clean: { phoneNumber: '+18889711908', scriptUrl: '//b-js.ringba.com/CA134a8682c9e84d97a6fea1a0d2d4361f' },
      insured_dui: { phoneNumber: '+18336503121', scriptUrl: '//b-js.ringba.com/CAa0c48cb25286491b9e47f8b5afd6fbc7' },
      uninsured: { phoneNumber: '+18336503121', scriptUrl: '//b-js.ringba.com/CAa0c48cb25286491b9e47f8b5afd6fbc7' },
      allstate: { phoneNumber: '+18336274480', scriptUrl: '//b-js.ringba.com/CA5e3e25cc73184c00966cd53dc678fa72' }
    };

    // Determine routing based on lead data
    if (quote.currentPolicy && quote.currentPolicy.toLowerCase().includes('allstate')) {
      return ringbaMap.allstate;
    } else if (quote.drivers.some(d => d.violations > 0)) {
      return ringbaMap.insured_dui;
    } else if (quote.currentPolicy) {
      return ringbaMap.insured_clean;
    } else {
      return ringbaMap.uninsured;
    }
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^1?(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return phone;
  };

  const trackQuoteView = async (qfCode: string) => {
    try {
      await apiRequest('/api/quotes/view', {
        method: 'POST',
        body: { qfCode }
      });
    } catch (error) {
      console.warn('Failed to track quote view:', error);
    }
  };

  const trackPhoneClick = async (phoneNumber: string, buttonType: string) => {
    try {
      await apiRequest('/api/calls/track', {
        method: 'POST',
        body: { 
          qfCode: quoteData?.qfCode, 
          phoneNumber, 
          buttonType,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.warn('Failed to track phone click:', error);
    }
  };

  const handleCallClick = (buttonType: string) => {
    if (callNumber) {
      trackPhoneClick(callNumber, buttonType);
      window.location.href = `tel:${callNumber}`;
    }
  };

  const loadRingbaScript = (scriptUrl: string, quote: QuoteData) => {
    const urlParams = new URLSearchParams(window.location.search);
    const queryParams = [];

    // Add tracking parameters
    if (urlParams.get('fbclid')) queryParams.push(`fbclid=${encodeURIComponent(urlParams.get('fbclid'))}`);
    if (urlParams.get('utm_source')) queryParams.push(`utm_source=${encodeURIComponent(urlParams.get('utm_source'))}`);
    if (urlParams.get('utm_campaign')) queryParams.push(`utm_campaign=${encodeURIComponent(urlParams.get('utm_campaign'))}`);
    if (quote.state) queryParams.push(`state=${encodeURIComponent(quote.state)}`);
    if (quote.currentPolicy) queryParams.push(`insurance=yes`);

    let finalScriptUrl = scriptUrl;
    if (queryParams.length > 0) {
      const separator = scriptUrl.includes('?') ? '&' : '?';
      finalScriptUrl = `${scriptUrl}${separator}${queryParams.join('&')}`;
    }

    const script = document.createElement('script');
    script.src = finalScriptUrl;
    script.async = true;
    document.body.appendChild(script);
  };

  useEffect(() => {
    if (!qfCode) {
      setError('Invalid quote code');
      setLoading(false);
      return;
    }

    const fetchQuoteData = async () => {
      try {
        const response = await apiRequest(`/api/quotes/${qfCode}`);
        setQuoteData(response);
        
        // Track quote view
        await trackQuoteView(qfCode);
        
        // Initialize Ringba
        const ringbaMapping = getRingbaMapping(response);
        setCallNumber(ringbaMapping.phoneNumber);
        loadRingbaScript(ringbaMapping.scriptUrl, response);
        
        // Show popup after 3 seconds
        setTimeout(() => setShowPopup(true), 3000);
        
      } catch (error) {
        console.error('Failed to fetch quote data:', error);
        setError('Quote not found or expired');
      } finally {
        setLoading(false);
      }
    };

    fetchQuoteData();
  }, [qfCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your quote...</p>
        </div>
      </div>
    );
  }

  if (error || !quoteData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Quote Not Found</h1>
            <p className="text-gray-600 mb-6">
              We couldn't find your quote. Please check your link or contact support.
            </p>
            <Button 
              onClick={() => window.location.href = 'tel:+18557283669'}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <Phone className="mr-2 h-4 w-4" />
              Call Support: 1-855-728-3669
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Alert Bar */}
      <div className="bg-red-600 text-white p-3 text-center font-bold text-sm uppercase tracking-wide">
        This is a temporary development preview, check there are no live public site. Contact our help for secure sharing of use on their live.
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <img 
            src="https://quoteproauto.com/logo" 
            alt="QuotePro Auto" 
            className="h-8"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjMyIiB2aWV3Qm94PSIwIDAgMTIwIDMyIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjx0ZXh0IHg9IjEwIiB5PSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzFhMjM3ZSI+UXVvdGVQcm8gQXV0bzwvdGV4dD48L3N2Zz4=';
            }}
          />
          <Button 
            onClick={() => handleCallClick('header')}
            className="bg-indigo-900 hover:bg-indigo-800 text-white px-6 py-2 rounded-full font-semibold"
          >
            <Phone className="mr-2 h-4 w-4" />
            Call Now
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Customer Section */}
        <Card>
          <CardContent className="p-6">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              Quote Reference: {quoteData.qfCode}
            </p>
            <h1 className="text-3xl font-bold text-indigo-900 mb-4">
              {quoteData.firstName} {quoteData.lastName}
            </h1>
            <div className="flex flex-wrap gap-6 text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-indigo-900" />
                <span>{quoteData.city}, {quoteData.state} {quoteData.zip}</span>
              </div>
              {quoteData.currentPolicy && (
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-indigo-900" />
                  <span>Current: {quoteData.currentPolicy}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Discount Banner */}
        <Card className="bg-yellow-100 border-yellow-300">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-orange-600 mb-1">
                Save Up To $1,200 Annually!
              </h3>
              <p className="text-gray-600 text-sm">
                Additional discounts require agent approval
              </p>
            </div>
            <Button 
              onClick={() => handleCallClick('discount')}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-full font-bold whitespace-nowrap"
            >
              Claim Savings
            </Button>
          </CardContent>
        </Card>

        {/* Vehicles Section */}
        {quoteData.vehicles && quoteData.vehicles.length > 0 && (
          <Card>
            <CardHeader className="bg-indigo-900 text-white">
              <CardTitle className="flex items-center gap-3">
                <Car className="h-6 w-6" />
                Covered Vehicles
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {quoteData.vehicles.map((vehicle, index) => (
                  <div key={index} className="flex justify-between items-start border-b pb-4 last:border-b-0">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h4>
                      <p className="text-sm text-gray-600">Personal Vehicle</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Full Coverage
                      </Badge>
                      <Badge variant="outline" className="text-blue-600 border-blue-300">
                        Liability
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Drivers Section */}
        {quoteData.drivers && quoteData.drivers.length > 0 && (
          <Card>
            <CardHeader className="bg-indigo-900 text-white">
              <CardTitle className="flex items-center gap-3">
                <Users className="h-6 w-6" />
                Covered Drivers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quoteData.drivers.map((driver, index) => (
                  <div key={index} className="space-y-1">
                    <p className="font-semibold text-gray-900">
                      {driver.relationshipToLead === 'primary' ? `${quoteData.firstName} ${quoteData.lastName}` : `Driver ${index + 1}`}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>
                        {driver.violations === 0 ? 'Clean Record' : `${driver.violations} Violation${driver.violations > 1 ? 's' : ''}`}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {driver.yearsOfExperience} years experience • Age {driver.age}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bottom CTA */}
        <Card className="bg-white">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-semibold text-indigo-900 mb-2">
              Ready to Activate Your Quote?
            </h2>
            <p className="text-xl text-gray-600 mb-6">
              {formatPhoneNumber(callNumber)}
            </p>
            <Button 
              onClick={() => handleCallClick('bottom')}
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white px-10 py-4 text-lg font-bold rounded-full"
            >
              <Phone className="mr-3 h-5 w-5" />
              Call To Activate Quote
            </Button>
            <p className="text-xs text-gray-500 mt-4">
              Quote expires {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Popup Modal */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center">
              <div className="mb-4">
                <Clock className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Limited Time Offer!
                </h3>
                <p className="text-gray-600 mb-6">
                  Your quote is ready for activation. Call now to secure these savings before they expire.
                </p>
              </div>
              <div className="space-y-3">
                <Button 
                  onClick={() => {
                    setShowPopup(false);
                    handleCallClick('popup');
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 text-lg font-bold"
                >
                  <Phone className="mr-2 h-5 w-5" />
                  Call Now: {formatPhoneNumber(callNumber)}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowPopup(false)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}