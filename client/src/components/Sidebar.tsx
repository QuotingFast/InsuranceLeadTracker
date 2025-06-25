import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  FileText, 
  Shield, 
  Ban, 
  Settings, 
  X,
  CheckCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({ isOpen, onClose, currentPage, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const [location] = useLocation();

  // Get total leads count for display
  const { data: metrics } = useQuery({
    queryKey: ['/api/dashboard/metrics'],
    refetchInterval: 30000
  });

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: BarChart3,
      active: currentPage === "dashboard" || location === "/"
    },
    {
      name: "Leads", 
      href: "/leads",
      icon: Users,
      active: currentPage === "leads",
      badge: metrics?.totalLeads?.toLocaleString()
    },
    {
      name: "SMS Campaigns",
      href: "/sms",
      icon: MessageSquare,
      active: currentPage === "sms"
    },
    {
      name: "Quote Pages",
      href: "/quotes", 
      icon: FileText,
      active: currentPage === "quotes"
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      active: currentPage === "analytics"
    },
    {
      name: "TCPA Compliance",
      href: "/compliance",
      icon: Shield,
      active: currentPage === "compliance"
    },
    {
      name: "Opt-Out Management",
      href: "/optouts",
      icon: Ban,
      active: currentPage === "optouts"
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      active: currentPage === "settings"
    }
  ];

  // Mock system status - in production this would be real API data
  const systemStatus = {
    deliveryRate: 98.2,
    lastHealthCheck: "2 min ago"
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className={`${isCollapsed ? 'px-3' : 'px-6'} py-4 border-b border-slate-200 relative`}>
        <div className="flex items-center gap-3">
          <img 
            src="https://quoteproauto.com/logo" 
            alt="QuotePro Auto Logo" 
            className="h-8 w-auto object-contain flex-shrink-0"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-blue-600">QuotePro Auto</h1>
              <p className="text-sm text-slate-500 mt-1">Lead Management</p>
            </div>
          )}
        </div>
        
        {/* Collapse Toggle Button - Only show on desktop */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="absolute -right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1.5 shadow-lg transition-all duration-200 z-10"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronLeft className="h-3 w-3" />
            )}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className={`w-full justify-start px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  item.active
                    ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
                onClick={onClose}
              >
                <Icon className={`mr-3 h-4 w-4 ${item.active ? "text-blue-600" : "text-slate-400"}`} />
                <span className="flex-1 text-left">{item.name}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto bg-slate-200 text-slate-700 py-0.5 px-2 rounded-full text-xs">
                    {item.badge}
                  </Badge>
                )}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* System Status */}
      <div className="px-3 py-4 border-t border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500">SYSTEM STATUS</span>
          <div className="flex items-center text-xs text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
            Online
          </div>
        </div>
        <div className="space-y-2 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>SMS Delivery Rate</span>
            <span className="font-medium text-green-600">
              {systemStatus.deliveryRate}%
            </span>
          </div>
          <div className="flex justify-between">
            <span>Last Health Check</span>
            <span className="font-medium">{systemStatus.lastHealthCheck}</span>
          </div>
        </div>
      </div>
    </>
  );

  // Mobile sidebar for small screens
  if (isOpen && typeof window !== 'undefined' && window.innerWidth < 1024) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex-1 flex flex-col min-h-0">
            <SheetHeader className="px-6 py-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-xl font-bold text-blue-600">QuotePro Auto</SheetTitle>
                <Button variant="ghost" size="sm" onClick={onClose} className="p-1">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-slate-500">Lead Management</p>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto">
              <SidebarContent />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop sidebar
  return (
    <div className="h-full flex flex-col bg-white shadow-lg border-r border-slate-200">
      <SidebarContent />
    </div>
  );
}
