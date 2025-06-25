import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Send, CheckCircle, XCircle, Clock } from "lucide-react";

interface CustomMessage {
  phone: string;
  status: 'delivered' | 'failed' | 'pending';
  timestamp: string;
}

const MESSAGE_TEMPLATES = {
  followup: "Hi {name}! We found you an exclusive insurance quote. Check it out: {quote_link}",
  urgent: "⏰ {name}, your quote expires soon! Don't miss out: {quote_link}",
  lastchance: "🚨 FINAL NOTICE {name}: Your insurance quote expires today! {quote_link}",
  custom: ""
};

export default function CustomSMSComposer() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof MESSAGE_TEMPLATES>("custom");
  const [message, setMessage] = useState("");
  const [scheduleForBusinessHours, setScheduleForBusinessHours] = useState(false);
  const { toast } = useToast();

  // Mock recent messages for display - in production this would be an API call
  const recentMessages: CustomMessage[] = [
    { phone: "(555) 123-4567", status: "delivered", timestamp: "2 min ago" },
    { phone: "(555) 987-6543", status: "pending", timestamp: "5 min ago" },
    { phone: "(555) 456-7890", status: "failed", timestamp: "8 min ago" }
  ];

  const sendSmsMutation = useMutation({
    mutationFn: async (data: {
      phoneNumber: string;
      message: string;
      scheduleForBusinessHours: boolean;
      templateType: string;
    }) => {
      const response = await apiRequest('POST', '/api/sms/send', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "SMS Sent Successfully",
        description: `Message sent to ${phoneNumber}`,
      });
      // Reset form
      setPhoneNumber("");
      setMessage("");
      setSelectedTemplate("custom");
      setScheduleForBusinessHours(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send SMS",
        description: error.message || "An error occurred while sending the SMS",
        variant: "destructive"
      });
    }
  });

  const handleTemplateChange = (template: keyof typeof MESSAGE_TEMPLATES) => {
    setSelectedTemplate(template);
    setMessage(MESSAGE_TEMPLATES[template]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone Number Required",
        description: "Please enter a phone number",
        variant: "destructive"
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Message Required", 
        description: "Please enter a message",
        variant: "destructive"
      });
      return;
    }

    sendSmsMutation.mutate({
      phoneNumber: phoneNumber.trim(),
      message: message.trim(),
      scheduleForBusinessHours,
      templateType: selectedTemplate
    });
  };

  const messageLength = message.length;
  const maxLength = 1600;

  const getStatusIcon = (status: CustomMessage['status']) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'failed':
        return <XCircle className="h-3 w-3 text-red-600" />;
      case 'pending':
        return <Clock className="h-3 w-3 text-amber-600" />;
    }
  };

  const getStatusColor = (status: CustomMessage['status']) => {
    switch (status) {
      case 'delivered':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'pending':
        return 'text-amber-600';
    }
  };

  return (
    <Card id="custom-sms-composer">
      <CardHeader>
        <CardTitle>Send Custom SMS</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-700 mb-2">
              Phone Number
            </Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <Label htmlFor="template" className="block text-sm font-medium text-slate-700 mb-2">
              Message Template
            </Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="followup">Follow-up Template</SelectItem>
                <SelectItem value="urgent">Urgent Template</SelectItem>
                <SelectItem value="lastchance">Last Chance Template</SelectItem>
                <SelectItem value="custom">Custom Message</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
              Message
            </Label>
            <Textarea
              id="message"
              rows={4}
              placeholder="Hi {name}, we have an exclusive insurance quote ready for you. Check it out here: {quote_link}"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full resize-none"
              maxLength={maxLength}
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-slate-500">
                Use {"{name}"}, {"{quote_link}"} for personalization
              </span>
              <span className={`text-xs ${messageLength > maxLength * 0.9 ? 'text-red-500' : 'text-slate-500'}`}>
                {messageLength}/{maxLength}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="scheduleMessage"
              checked={scheduleForBusinessHours}
              onCheckedChange={(checked) => setScheduleForBusinessHours(checked as boolean)}
            />
            <Label htmlFor="scheduleMessage" className="text-sm text-slate-700">
              Schedule for business hours
            </Label>
          </div>

          <Button
            type="submit"
            disabled={sendSmsMutation.isPending || !phoneNumber.trim() || !message.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center"
          >
            <Send className="h-4 w-4 mr-2" />
            {sendSmsMutation.isPending ? 'Sending...' : 'Send SMS'}
          </Button>
        </form>

        {/* Recent Custom Messages */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <h4 className="text-sm font-medium text-slate-700 mb-3">Recent Custom Messages</h4>
          <div className="space-y-2">
            {recentMessages.map((msg, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{msg.phone}</span>
                <div className={`flex items-center ${getStatusColor(msg.status)}`}>
                  {getStatusIcon(msg.status)}
                  <span className="ml-1 capitalize">{msg.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
