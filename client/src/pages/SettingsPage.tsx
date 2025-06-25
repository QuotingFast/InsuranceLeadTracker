import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, Phone, MessageSquare, Shield } from "lucide-react";

export default function SettingsPage() {
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
                <Input id="twilio-sid" placeholder="Enter Account SID" />
              </div>
              <div>
                <Label htmlFor="twilio-token">Twilio Auth Token</Label>
                <Input id="twilio-token" type="password" placeholder="Enter Auth Token" />
              </div>
            </div>
            <div>
              <Label htmlFor="twilio-phone">Twilio Phone Number</Label>
              <Input id="twilio-phone" placeholder="+1234567890" />
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
                <Input defaultValue="+18336274480" />
              </div>
              <div>
                <Label>DUI Violations</Label>
                <Input defaultValue="+18336503121" />
              </div>
              <div>
                <Label>Clean Insured</Label>
                <Input defaultValue="+18889711908" />
              </div>
              <div>
                <Label>Uninsured</Label>
                <Input defaultValue="+18336503121" />
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
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Business Hours Only</Label>
                <p className="text-sm text-slate-600">Only send SMS during business hours</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button>Save Settings</Button>
        </div>
      </div>
    </div>
  );
}