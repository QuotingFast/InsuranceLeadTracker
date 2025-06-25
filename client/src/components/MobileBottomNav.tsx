import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  PieChart
} from "lucide-react";

interface MobileBottomNavProps {
  currentPage: string;
}

export default function MobileBottomNav({ currentPage }: MobileBottomNavProps) {
  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: BarChart3,
      active: currentPage === "dashboard"
    },
    {
      name: "Leads",
      href: "/leads", 
      icon: Users,
      active: currentPage === "leads"
    },
    {
      name: "SMS",
      href: "/sms",
      icon: MessageSquare,
      active: currentPage === "sms"
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: PieChart,
      active: currentPage === "analytics"
    }
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 safe-area-pb">
      <div className="flex justify-around">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                size="sm"
                className={`flex flex-col items-center space-y-1 p-2 min-w-0 ${
                  item.active ? "text-blue-600" : "text-slate-400"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs leading-tight">{item.name}</span>
              </Button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
