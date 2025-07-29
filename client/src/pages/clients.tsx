import React, { useState, useMemo } from "react";
import Sidebar from "@/components/sidebar";
import InteractiveClientCard from "@/components/interactive-client-card";
import ClientFormModal from "@/components/client-form-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Plus, Search, LayoutGrid, List, Menu, Filter } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { ClientWithTeam } from "@shared/schema";

interface InteractiveClientCardsProps {
  searchQuery: string;
  statusFilter: string;
  viewMode: "grid" | "list";
}

function InteractiveClientCards({ searchQuery, statusFilter, viewMode }: InteractiveClientCardsProps) {
  const { data: clients = [], isLoading } = useQuery<ClientWithTeam[]>({
    queryKey: ["/api/clients"],
  });

  const filteredClients = useMemo(() => {
    return clients
      .filter(client => {
        const matchesSearch = !searchQuery || 
          client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.country.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = statusFilter === "all" || 
          client.projectStatus.toLowerCase().replace(" ", "-") === statusFilter;
        
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        // Sort by date started (earliest first) - using contractStartDate or createdAt
        const dateA = new Date(a.contractStartDate || a.createdAt);
        const dateB = new Date(b.contractStartDate || b.createdAt);
        return dateA.getTime() - dateB.getTime();
      });
  }, [clients, searchQuery, statusFilter]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-slate-200 rounded-lg h-80"></div>
          </div>
        ))}
      </div>
    );
  }

  if (filteredClients.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-slate-400 text-lg mb-2">No clients found</div>
        <div className="text-slate-500 text-sm">Try adjusting your search or filter criteria</div>
      </div>
    );
  }

  return (
    <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
      {filteredClients.map((client) => (
        <InteractiveClientCard key={client.id} client={client} />
      ))}
    </div>
  );
}

export default function ClientsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>
      
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen">
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-lg border-b border-white/20 px-4 sm:px-6 py-4 sticky top-0 z-30 shadow-lg shadow-blue-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-8 w-8 sm:h-10 sm:w-10 hover:bg-white/50 transition-all duration-200 hover:scale-105"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <div className="group">
                <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">All Clients</h2>
                <p className="text-sm sm:text-base text-slate-600 hidden sm:block opacity-80">Manage and track all your jewelry clients</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-10 sm:w-10 hover:bg-white/50 transition-all duration-200 hover:scale-105 group">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
                <span className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">2</span>
              </Button>
              <Button 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl h-8 sm:h-10 px-3 sm:px-4 text-sm transition-all duration-200 hover:scale-105 group"
                onClick={() => setClientModalOpen(true)}
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 group-hover:rotate-90 transition-transform duration-200" />
                <span className="hidden sm:inline">Add Client</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>
        </header>

        <div className="p-3 sm:p-6 relative z-10">
          {/* Filters Section */}
          <div className="bg-white/90 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg shadow-blue-500/5 mb-6 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-2 group-hover:space-x-3 transition-all duration-200">
                  <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 group-hover:text-blue-600 transition-colors" />
                  <h3 className="text-base sm:text-lg font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">Filter & Search</h3>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                  {/* Search */}
                  <div className="relative flex-1 sm:flex-initial group/search">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 group-focus-within/search:text-blue-600 transition-colors" />
                    <Input
                      type="text"
                      placeholder="Search clients..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full sm:w-64 bg-white/50 border-white/30 focus:bg-white/90 focus:border-blue-300 transition-all duration-200 hover:bg-white/70"
                    />
                  </div>
                  {/* Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40 bg-white/50 border-white/30 hover:bg-white/80 hover:border-blue-300 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-sm border-white/50">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="testing">Testing</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                  {/* View Toggle */}
                  <div className="flex border border-white/30 rounded-lg overflow-hidden bg-white/30 hover:bg-white/50 transition-colors">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className={`transition-all duration-200 ${viewMode === "grid" 
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-md" 
                        : "hover:bg-white/50 hover:scale-105"
                      }`}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className={`transition-all duration-200 ${viewMode === "list" 
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-md" 
                        : "hover:bg-white/50 hover:scale-105"
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Client Cards */}
          <div className="bg-white/90 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg p-6">
            <InteractiveClientCards 
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