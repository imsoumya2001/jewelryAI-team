import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Menu, DollarSign, Users, UserCheck, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ClientWithTeam, TeamMember } from "@shared/schema";
import Sidebar from "@/components/sidebar";

export default function AnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: clients = [] } = useQuery<ClientWithTeam[]>({
    queryKey: ["/api/clients"],
  });

  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  const { data: metrics } = useQuery({
    queryKey: ["/api/metrics"],
  });

  // Calculate total revenue from client data
  const totalRevenue = clients.reduce((sum, client) => 
    sum + parseFloat(client.amountPaidUSD?.toString() || client.amountPaid.toString()), 0);

  // Calculate active clients (those with progress > 0)
  const activeClients = clients.filter(client => 
    parseInt(client.progress || "0") > 0
  ).length;

  // Calculate team utilization based on actual data
  const teamUtilization = clients.length > 0 ? 
    Math.round((clients.filter(c => c.assignments && c.assignments.length > 0).length / clients.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-3 sm:p-6 relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/5 w-72 h-72 bg-gradient-to-r from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/5 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg shadow-indigo-500/5 p-4 sm:p-6 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 group">
          <div className="group-hover:transform group-hover:translate-x-1 transition-transform duration-200">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent group-hover:from-indigo-600 group-hover:to-purple-600 transition-all duration-300">
              Analytics & Reports
            </h1>
            <p className="text-slate-600 mt-1 text-sm sm:text-base opacity-80 group-hover:opacity-100 transition-opacity">Insights and performance metrics for your business</p>
          </div>
        </div>
        {/* Dashboard-Style Bento Cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
          {/* Total Revenue */}
          <Card className="bg-gradient-to-br from-green-100/80 to-emerald-200/80 backdrop-blur-sm border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden">
            <CardContent className="p-4 md:p-6 relative">
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xs md:text-sm font-medium text-slate-600">Total Revenue</h3>
                  <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                </div>
                <div className="flex-1 flex items-center">
                  <div className="text-2xl md:text-3xl font-bold text-green-700">
                    ${totalRevenue.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Clients */}
          <Card className="bg-gradient-to-br from-orange-100/80 to-orange-200/80 backdrop-blur-sm border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden">
            <CardContent className="p-4 md:p-6 relative">
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xs md:text-sm font-medium text-slate-600">Active Clients</h3>
                  <Users className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
                </div>
                <div className="flex-1 flex items-center">
                  <div className="text-2xl md:text-3xl font-bold text-orange-700">
                    {activeClients}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card className="bg-gradient-to-br from-purple-100/80 to-purple-200/80 backdrop-blur-sm border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden">
            <CardContent className="p-4 md:p-6 relative">
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xs md:text-sm font-medium text-slate-600">Team Members</h3>
                  <UserCheck className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                </div>
                <div className="flex-1 flex items-center">
                  <div className="text-2xl md:text-3xl font-bold text-purple-700">
                    {teamMembers.length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Utilization */}
          <Card className="bg-gradient-to-br from-blue-100/80 to-blue-200/80 backdrop-blur-sm border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden">
            <CardContent className="p-4 md:p-6 relative">
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xs md:text-sm font-medium text-slate-600">Team Utilization</h3>
                  <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                </div>
                <div className="flex-1 flex items-center">
                  <div className="text-2xl md:text-3xl font-bold text-blue-700">
                    {teamUtilization}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}