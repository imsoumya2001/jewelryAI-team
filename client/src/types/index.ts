export interface CountryData {
  name: string;
  code: string;
  flag: string;
}

export interface DashboardMetrics {
  totalClients: number;
  activeProjects: number;
  monthlyRevenue: number;
  teamUtilization: number;
}

export interface MapPin {
  id: string;
  region: string;
  clientCount: number;
  revenue: number;
  position: {
    top: string;
    left: string;
  };
  color: string;
}

export interface ActivityItem {
  id: string;
  clientName: string;
  description: string;
  type: 'completed' | 'payment' | 'meeting' | 'proposal' | 'urgent';
  timestamp: string;
  timeAgo: string;
}

export interface StatusColors {
  [key: string]: {
    bg: string;
    text: string;
    progress: string;
  };
}
