import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  MapPin,
  Clock,
  Plus,
  FileText,
  UserCheck,
  Briefcase,
  Activity,
  X,
  BarChart3
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ClientWithTeam } from "@shared/schema";
import { format, subDays, isAfter } from "date-fns";
import { formatCurrency } from "@/lib/currency";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
                <p className="text-gray-600">Welcome back, Sarah! Here's what's happening with your clients.</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">2</span>
              </Button>
              <Button 
                className="bg-jewelry-purple hover:bg-purple-700 text-white"
                onClick={() => setClientModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-8">
          {/* KPI Cards */}
          <KpiCards />

          {/* World Map & Activity Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <WorldMap />
            </div>
            <div>
              <ActivityFeed />
            </div>
          </div>

          {/* Client Management Section */}
          <div className="bg-white rounded-xl shadow-card">
            {/* Header with filters */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Client Management</h3>
                  <p className="text-gray-600 text-sm">Manage and track all your jewelry clients</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Search clients..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                  {/* Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                  {/* View Toggle */}
                  <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className={viewMode === "grid" ? "bg-jewelry-blue text-white" : ""}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className={viewMode === "list" ? "bg-jewelry-blue text-white" : ""}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Grid */}
            <ClientGrid 
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              viewMode={viewMode}
            />
          </div>
        </div>
      </div>

      {/* Client Form Modal */}
      <ClientFormModal 
        open={clientModalOpen} 
        onOpenChange={setClientModalOpen} 
      />
    </div>
  );
}
