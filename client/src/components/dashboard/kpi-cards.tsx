import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ListTodo, DollarSign, PieChart, TrendingUp, ArrowRight, Minus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DashboardMetrics } from "@/types";

export default function KpiCards() {
  const { data: metrics } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const kpiCards = [
    {
      title: "Total Clients",
      value: metrics?.totalClients || 0,
      change: "+12% from last month",
      changeType: "positive" as const,
      icon: Users,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      title: "Active Projects", 
      value: metrics?.activeProjects || 0,
      change: "3 due this week",
      changeType: "neutral" as const,
      icon: ListTodo,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600"
    },
    {
      title: "Monthly Revenue",
      value: `$${Math.round((metrics?.monthlyRevenue || 0) / 1000)}K`,
      change: "+8% from last month",
      changeType: "positive" as const,
      icon: DollarSign,
      iconBg: "bg-green-100", 
      iconColor: "text-green-600"
    },
    {
      title: "Team Utilization",
      value: `${metrics?.teamUtilization || 0}%`,
      change: "Optimal range",
      changeType: "neutral" as const,
      icon: PieChart,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600"
    }
  ];

  const getChangeIcon = (type: string) => {
    switch (type) {
      case "positive":
        return <TrendingUp className="h-3 w-3" />;
      case "negative":
        return <TrendingUp className="h-3 w-3 rotate-180" />;
      default:
        return <ArrowRight className="h-3 w-3" />;
    }
  };

  const getChangeColor = (type: string) => {
    switch (type) {
      case "positive":
        return "text-green-600";
      case "negative":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpiCards.map((card, index) => (
        <Card key={index} className="hover:shadow-card-hover transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                <p className={`text-sm mt-1 flex items-center space-x-1 ${getChangeColor(card.changeType)}`}>
                  {getChangeIcon(card.changeType)}
                  <span>{card.change}</span>
                </p>
              </div>
              <div className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                <card.icon className={`${card.iconColor} text-xl h-6 w-6`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
