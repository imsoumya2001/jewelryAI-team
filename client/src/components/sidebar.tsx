import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Users, 
  UserCheck, 
  ChartBar, 
  Settings, 
  Gem,
  X,
  DollarSign,
  LogOut,
  Megaphone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigationItems = [
  {
    name: "Dashboard",
    icon: BarChart3,
    href: "/",
    active: true,
    badge: null
  },
  {
    name: "All Clients",
    icon: Users,
    href: "/clients",
    active: false,
    badge: null
  },
  {
    name: "Sample Requests",
    icon: Gem,
    href: "/sample-requests",
    active: false,
    indicator: true
  },
  {
    name: "Team Management",
    icon: UserCheck,
    href: "/team",
    active: false
  },
  {
    name: "Finances",
    icon: DollarSign,
    href: "/finances",
    active: false,
    indicator: true
  },
  {
    name: "Marketing",
    icon: Megaphone,
    href: "/marketing",
    active: false
  },
  {
    name: "Analytics & Reports",
    icon: ChartBar,
    href: "/analytics",
    active: false
  },
  {
    name: "Settings",
    icon: Settings,
    href: "/settings",
    active: false
  }
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();

  const handleLogout = () => {
    sessionStorage.removeItem('app-authenticated');
    window.location.reload();
  };

  const getUpdatedNavigationItems = () => {
    return navigationItems.map(item => ({
      ...item,
      active: location === item.href
    }));
  };

  return (
    <div className={cn(
      "fixed left-0 top-0 h-full w-64 bg-slate-900/95 backdrop-blur-xl text-white z-50 transform transition-all duration-300 ease-in-out flex flex-col border-r border-white/10 shadow-2xl",
      isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
    )}>
      <div className="p-6 shrink-0 bg-slate-800/30 backdrop-blur-sm border-b border-slate-700/50">
        {/* Enhanced Close button for mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 lg:hidden text-slate-400 hover:text-white hover:bg-slate-800/80 backdrop-blur-sm transition-all duration-200 hover:scale-110"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Enhanced Logo */}
        <div className="flex items-center space-x-3 mb-8 group">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
            <Gem className="text-white text-lg h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:to-purple-300 transition-all duration-300">JewelryAI</h1>
            <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">Client Management</p>
          </div>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="space-y-2 overflow-y-auto flex-1">
          {getUpdatedNavigationItems().map((item) => (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start space-x-3 p-3 rounded-lg text-left transition-all duration-200 group/item hover:scale-105",
                  item.active
                    ? "bg-slate-800/80 backdrop-blur-sm text-white shadow-lg border border-white/10"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60 hover:backdrop-blur-sm hover:border hover:border-white/5"
                )}
                onClick={onClose}
              >
                <item.icon className="h-5 w-5 group-hover/item:scale-110 transition-transform duration-200" />
                <span className="flex-1 group-hover/item:translate-x-1 transition-transform duration-200">{item.name}</span>
                {item.badge && (
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-xs px-2 py-1",
                      item.active 
                        ? "bg-jewelry-gold text-navy" 
                        : "bg-gray-600 text-gray-300"
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}
                {item.indicator && (
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                )}
              </Button>
            </Link>
          ))}
        </nav>
      </div>

      {/* Logout Button */}
      <div className="absolute bottom-20 left-6 right-6">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start space-x-3 p-3 rounded-lg text-left transition-all duration-200 group/item hover:scale-105 text-slate-300 hover:text-white hover:bg-slate-800/60 hover:backdrop-blur-sm hover:border hover:border-white/5"
        >
          <LogOut className="h-5 w-5 group-hover/item:scale-110 transition-transform duration-200" />
          <span className="flex-1 group-hover/item:translate-x-1 transition-transform duration-200">Logout</span>
        </Button>
      </div>

      {/* Enhanced Company Branding */}
      <div className="absolute bottom-6 left-6 right-6">
        <div className="text-center p-3 rounded-lg bg-slate-800/60 backdrop-blur-sm border border-white/10 shadow-lg hover:bg-slate-800/80 transition-all duration-200 group">
          <div className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">Powered by</div>
          <div className="text-sm font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">JewelryAI</div>
        </div>
      </div>
    </div>
  );
}
