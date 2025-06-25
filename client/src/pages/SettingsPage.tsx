import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Settings, Phone, MessageSquare, Shield, Save } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

export default function SettingsPage() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    twilioSid: '',
    twilioToken: '',
    twilioPhone: '',
    allstatePhone: '+18336274480',
    duiPhone: '+18336503121',
    cleanInsuredPhone: '+18889711908',
    uninsuredPhone: '+18336503121',
    emergencyStop: false,
    businessHoursOnly: true
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiRequest('/api/settings', {
        method: 'POST',
        body: settings
      });
      
      toast({
        title: "Settings Saved",
        description: "Your settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
              <p className="text-slate-600">Configure system settings and preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* SMS Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              SMS Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="twilio-sid">Twilio Account SID</Label>
                <Input 
                  id="twilio-sid" 
                  value={settings.twilioSid}
                  onChange={(e) => setSettings({...settings, twilioSid: e.target.value})}
                  placeholder="Enter Account SID" 
                />
              </div>
              <div>
                <Label htmlFor="twilio-token">Twilio Auth Token</Label>
                <Input 
                  id="twilio-token" 
                  type="password"
                  value={settings.twilioToken}
                  onChange={(e) => setSettings({...settings, twilioToken: e.target.value})}
                  placeholder="Enter Auth Token" 
                />
              </div>
            </div>
            <div>
              <Label htmlFor="twilio-phone">Twilio Phone Number</Label>
              <Input 
                id="twilio-phone" 
                value={settings.twilioPhone}
                onChange={(e) => setSettings({...settings, twilioPhone: e.target.value})}
                placeholder="+1234567890" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Phone Routing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Phone Routing Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Allstate Customers</Label>
                <Input 
                  value={settings.allstatePhone}
                  onChange={(e) => setSettings({...settings, allstatePhone: e.target.value})}
                />
              </div>
              <div>
                <Label>DUI Violations</Label>
                <Input 
                  value={settings.duiPhone}
                  onChange={(e) => setSettings({...settings, duiPhone: e.target.value})}
                />
              </div>
              <div>
                <Label>Clean Insured</Label>
                <Input 
                  value={settings.cleanInsuredPhone}
                  onChange={(e) => setSettings({...settings, cleanInsuredPhone: e.target.value})}
                />
              </div>
              <div>
                <Label>Uninsured</Label>
                <Input 
                  value={settings.uninsuredPhone}
                  onChange={(e) => setSettings({...settings, uninsuredPhone: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              TCPA Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Emergency Stop</Label>
                <p className="text-sm text-slate-600">Stop all SMS messaging immediately</p>
              </div>
              <Switch 
                checked={settings.emergencyStop}
                onCheckedChange={(checked) => setSettings({...settings, emergencyStop: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Business Hours Only</Label>
                <p className="text-sm text-slate-600">Only send SMS during business hours</p>
              </div>
              <Switch 
                checked={settings.businessHoursOnly}
                onCheckedChange={(checked) => setSettings({...settings, businessHoursOnly: checked})}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}