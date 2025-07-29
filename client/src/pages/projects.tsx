import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  FolderOpen,
  Filter
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Project, ClientWithTeam } from "@shared/schema";

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch real client data to create projects from
  const { data: clients = [] } = useQuery<ClientWithTeam[]>({
    queryKey: ["/api/clients"],
  });

  // Create projects from real client data
  const projects = clients.map(client => ({
    id: client.id,
    name: `${client.name} Project`,
    client: client.name,
    status: client.status,
    progress: client.progressPercentage || 0,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    priority: client.progressPercentage > 80 ? "low" : client.progressPercentage > 50 ? "medium" : "high"
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-3 sm:p-6 relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-gradient-to-r from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-gradient-to-r from-indigo-400/10 to-violet-400/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>
      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg shadow-blue-500/5 p-4 sm:p-6 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="group-hover:transform group-hover:translate-x-1 transition-transform duration-200">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-indigo-600 transition-all duration-300">
                Projects
              </h1>
              <p className="text-slate-600 mt-1 text-sm sm:text-base opacity-80 group-hover:opacity-100 transition-opacity">Track and manage all client projects</p>
            </div>
            <Button 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 group/btn"
            >
              <Plus className="w-4 h-4 mr-2 group-hover/btn:rotate-90 transition-transform duration-200" />
              New Project
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <Card className="bg-white/90 backdrop-blur-sm border border-white/50 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 sm:p-3 bg-blue-100 rounded-xl">
                  <FolderOpen className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-slate-600">Total Projects</p>
                  <p className="text-lg sm:text-2xl font-bold text-slate-900">{projects.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/90 backdrop-blur-sm border border-white/50 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 sm:p-3 bg-green-100 rounded-xl">
                  <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-slate-600">Completed</p>
                  <p className="text-lg sm:text-2xl font-bold text-slate-900">
                    {projects.filter(p => p.status === 'completed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/90 backdrop-blur-sm border border-white/50 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 sm:p-3 bg-orange-100 rounded-xl">
                  <Clock className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-slate-600">In Progress</p>
                  <p className="text-lg sm:text-2xl font-bold text-slate-900">
                    {projects.filter(p => p.status === 'active' || p.status === 'in-progress').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/90 backdrop-blur-sm border border-white/50 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 sm:p-3 bg-red-100 rounded-xl">
                  <AlertCircle className="w-4 h-4 sm:w-6 sm:h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-slate-600">Overdue</p>
                  <p className="text-lg sm:text-2xl font-bold text-slate-900">
                    {projects.filter(p => p.status === 'overdue').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/70 backdrop-blur-sm border-white/20 focus:bg-white/90 transition-all duration-200"
            />
          </div>
            <Button 
              variant="outline" 
              className="bg-white/50 border-white/30 hover:bg-white/80 transition-all duration-200"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="bg-white/90 backdrop-blur-sm border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg text-slate-900">{project.name}</CardTitle>
                    <p className="text-sm text-slate-600 mt-1">{project.client}</p>
                  </div>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Progress</span>
                    <span className="font-medium text-slate-900">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">Due: {project.dueDate}</span>
                  </div>
                  <span className={`font-medium ${getPriorityColor(project.priority)}`}>
                    {project.priority} priority
                  </span>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full bg-gradient-to-r from-blue-50 to-purple-50 border-white/30 hover:from-blue-100 hover:to-purple-100 transition-all duration-200 text-slate-700"
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {projects.length === 0 && (
          <Card className="bg-white/90 backdrop-blur-sm border border-white/50 shadow-lg">
            <CardContent className="text-center py-12">
              <FolderOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">No projects found</h3>
              <p className="text-slate-500">Create your first project to get started</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}