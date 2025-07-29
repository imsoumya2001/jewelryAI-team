import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Plus, Calendar, Globe, Diamond, Gem, Package, CheckCircle, XCircle, Clock, Building, Trash2, ChevronDown, Zap, Star, Sparkles, Heart } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSampleRequestSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { SampleRequest, InsertSampleRequest } from "@shared/schema";
import { z } from "zod";
import DeleteConfirmationDialog from "@/components/delete-confirmation-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// 50+ Major jewelry markets worldwide
const COUNTRIES = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "HK", name: "Hong Kong", flag: "🇭🇰" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "AE", name: "UAE", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "QA", name: "Qatar", flag: "🇶🇦" },
  { code: "KW", name: "Kuwait", flag: "🇰🇼" },
  { code: "BH", name: "Bahrain", flag: "🇧🇭" },
  { code: "OM", name: "Oman", flag: "🇴🇲" },
  { code: "TR", name: "Turkey", flag: "🇹🇷" },
  { code: "RU", name: "Russia", flag: "🇷🇺" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "TH", name: "Thailand", flag: "🇹🇭" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳" },
  { code: "PH", name: "Philippines", flag: "🇵🇭" },
  { code: "TW", name: "Taiwan", flag: "🇹🇼" },
  { code: "IL", name: "Israel", flag: "🇮🇱" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "EG", name: "Egypt", flag: "🇪🇬" },
  { code: "MA", name: "Morocco", flag: "🇲🇦" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "BE", name: "Belgium", flag: "🇧🇪" },
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "NO", name: "Norway", flag: "🇳🇴" },
  { code: "DK", name: "Denmark", flag: "🇩🇰" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "IE", name: "Ireland", flag: "🇮🇪" },
  { code: "GR", name: "Greece", flag: "🇬🇷" },
  { code: "PL", name: "Poland", flag: "🇵🇱" },
  { code: "CZ", name: "Czech Republic", flag: "🇨🇿" },
  { code: "HU", name: "Hungary", flag: "🇭🇺" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "PE", name: "Peru", flag: "🇵🇪" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾" },
  { code: "PK", name: "Pakistan", flag: "🇵🇰" },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩" },
  { code: "LK", name: "Sri Lanka", flag: "🇱🇰" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { code: "JO", name: "Jordan", flag: "🇯🇴" },
  { code: "LB", name: "Lebanon", flag: "🇱🇧" },
  { code: "IQ", name: "Iraq", flag: "🇮🇶" },
  { code: "IR", name: "Iran", flag: "🇮🇷" },
  { code: "CUSTOM", name: "Other (Custom)", flag: "🌍" },
];

const formSchema = insertSampleRequestSchema.extend({
  requestDate: z.string(),
});

type FormData = z.infer<typeof formSchema>;

const STATUS_CONFIG = {
  "in processing": {
    label: "In Processing",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Clock,
  },
  "delivered": {
    label: "Delivered",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
  "rejected": {
    label: "Rejected",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
};

// Random gemstone icons with gradients
const getRandomGemstoneIcon = () => {
  const icons = [Diamond, Gem, Zap, Star, Sparkles, Heart];
  const gradients = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-purple-600', 
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500',
    'from-pink-500 to-rose-500',
    'from-cyan-500 to-blue-500',
    'from-amber-500 to-orange-500',
    'from-violet-500 to-purple-500',
    'from-teal-500 to-cyan-500'
  ];
  
  const randomIcon = icons[Math.floor(Math.random() * icons.length)];
  const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
  
  return { icon: randomIcon, gradient: randomGradient };
};

function getCountryFlag(countryCode: string): string {
  const country = COUNTRIES.find(c => c.code === countryCode);
  return country ? country.flag : "🌍";
}

function getCountryName(countryCode: string): string {
  const country = COUNTRIES.find(c => c.code === countryCode);
  return country ? country.name : countryCode;
}

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG["in processing"];
}

function SampleRequestForm({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      country: "",
      requestDate: new Date().toISOString().split('T')[0],
      status: "in processing",
      notes: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest("POST", "/api/sample-requests", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sample-requests"] });
      toast({
        title: "Success",
        description: "Sample request added successfully",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add sample request",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white/95 backdrop-blur-sm border-white/20">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">Add Sample Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              {...form.register("companyName")}
              placeholder="Enter company name"
              className="bg-white/70 backdrop-blur-sm border-white/20 focus:bg-white/90"
            />
            {form.formState.errors.companyName && (
              <p className="text-sm text-red-500">{form.formState.errors.companyName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select onValueChange={(value) => form.setValue("country", value)}>
              <SelectTrigger className="bg-white/70 backdrop-blur-sm border-white/20 focus:bg-white/90">
                <SelectValue placeholder="Select country or choose 'Other' to add custom" />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-sm border-white/20 max-h-64 overflow-y-auto">
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.flag} {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.country && (
              <p className="text-sm text-red-500">{form.formState.errors.country.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="requestDate">Request Date</Label>
            <Input
              id="requestDate"
              type="date"
              {...form.register("requestDate")}
              className="bg-white/70 backdrop-blur-sm border-white/20 focus:bg-white/90"
            />
            {form.formState.errors.requestDate && (
              <p className="text-sm text-red-500">{form.formState.errors.requestDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select onValueChange={(value) => form.setValue("status", value)} defaultValue="in processing">
              <SelectTrigger className="bg-white/70 backdrop-blur-sm border-white/20 focus:bg-white/90">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-sm border-white/20">
                <SelectItem value="in processing">In Processing</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              placeholder="Any additional notes..."
              className="bg-white/70 backdrop-blur-sm border-white/20 focus:bg-white/90"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-white/50 border-white/30 hover:bg-white/80"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              {mutation.isPending ? "Adding..." : "Add Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function SampleRequestsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("in processing");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sampleRequests = [], isLoading } = useQuery({
    queryKey: ["/api/sample-requests"],
  });

  // Filter requests based on active tab
  const getFilteredRequests = (status: string) => {
    return sampleRequests.filter(request => request.status === status);
  };

  // Mutation for updating status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", `/api/sample-requests/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sample-requests"] });
      toast({
        title: "Success",
        description: "Status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting sample request
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/sample-requests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sample-requests"] });
      toast({
        title: "Success",
        description: "Sample request deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete sample request",
        variant: "destructive",
      });
    },
  });

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || {
      label: status,
      color: "bg-gray-100 text-gray-800 border-gray-200",
      icon: Package,
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4 md:p-6 relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/5 left-1/6 w-80 h-80 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/5 right-1/6 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg shadow-purple-500/5 p-4 sm:p-6 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 group">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="group-hover:transform group-hover:translate-x-1 transition-transform duration-200">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent group-hover:from-purple-600 group-hover:to-pink-600 transition-all duration-300">Sample Requests</h1>
              <p className="text-gray-600 mt-1 opacity-80 group-hover:opacity-100 transition-opacity">Track jewelry companies requesting samples</p>
            </div>
            <Button
              onClick={() => setIsFormOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 group/btn"
            >
              <Plus className="w-4 h-4 mr-2 group-hover/btn:rotate-90 transition-transform duration-200" />
              Add Sample Request
            </Button>
          </div>
        </div>

        {/* Color-coded Status Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <button 
            onClick={() => setActiveTab("in processing")}
            className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
              activeTab === "in processing" 
                ? "bg-blue-50 border-blue-200 shadow-lg shadow-blue-500/20 scale-105" 
                : "bg-white/70 border-blue-100 hover:bg-blue-50/50 hover:border-blue-150 hover:scale-102"
            }`}
          >
            <div className="flex items-center justify-center gap-2 text-sm font-medium">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-blue-700">In Processing</span>
            </div>
            <div className="mt-2 text-xs text-blue-600 text-center">
              {getFilteredRequests("in processing").length} requests
            </div>
          </button>
          
          <button 
            onClick={() => setActiveTab("delivered")}
            className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
              activeTab === "delivered" 
                ? "bg-green-50 border-green-200 shadow-lg shadow-green-500/20 scale-105" 
                : "bg-white/70 border-green-100 hover:bg-green-50/50 hover:border-green-150 hover:scale-102"
            }`}
          >
            <div className="flex items-center justify-center gap-2 text-sm font-medium">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-green-700">Delivered</span>
            </div>
            <div className="mt-2 text-xs text-green-600 text-center">
              {getFilteredRequests("delivered").length} requests
            </div>
          </button>
          
          <button 
            onClick={() => setActiveTab("rejected")}
            className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
              activeTab === "rejected" 
                ? "bg-red-50 border-red-200 shadow-lg shadow-red-500/20 scale-105" 
                : "bg-white/70 border-red-100 hover:bg-red-50/50 hover:border-red-150 hover:scale-102"
            }`}
          >
            <div className="flex items-center justify-center gap-2 text-sm font-medium">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <XCircle className="w-4 h-4 text-red-600" />
              </div>
              <span className="text-red-700">Rejected</span>
            </div>
            <div className="mt-2 text-xs text-red-600 text-center">
              {getFilteredRequests("rejected").length} requests
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="mt-6">
            {/* Sample Requests Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="bg-white/50 backdrop-blur-sm border-white/20 animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-4 w-2/3"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : getFilteredRequests(activeTab).length === 0 ? (
          <Card className="bg-white/90 backdrop-blur-sm border border-white/50 shadow-lg shadow-purple-500/5 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 group">
            <CardContent className="p-12 text-center">
              <div className="group-hover:scale-110 transition-transform duration-200">
                <Diamond className="w-16 h-16 text-purple-400 mx-auto mb-4 group-hover:text-purple-500 transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-gray-800 transition-colors">
                No {activeTab} Requests
              </h3>
              <p className="text-gray-600 mb-6 group-hover:text-gray-700 transition-colors">
                No sample requests are currently {activeTab}.
              </p>
              <Button
                onClick={() => setIsFormOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Sample Request
              </Button>
            </CardContent>
          </Card>
        ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFilteredRequests(activeTab).map((request: SampleRequest) => {
              const statusConfig = getStatusConfig(request.status);
              const StatusIcon = statusConfig.icon;
              const { icon: GemIcon, gradient } = getRandomGemstoneIcon();
              
              const handleStatusChange = (newStatus: string) => {
                updateStatusMutation.mutate({ id: request.id, status: newStatus });
              };

              const handleDeleteClick = (e: React.MouseEvent) => {
                e.stopPropagation();
                setItemToDelete(request.id);
                setDeleteDialogOpen(true);
              };
              
              return (
                <Card key={request.id} className="bg-white/90 backdrop-blur-sm border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group cursor-pointer relative overflow-hidden">
                  <CardContent className="p-6">
                    {/* Header with random gemstone icon and company name */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className={`p-2.5 bg-gradient-to-br ${gradient} rounded-xl shadow-md group-hover:scale-110 transition-transform duration-200`}>
                        <GemIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                          {request.companyName}
                        </h3>
                      </div>
                      {/* Status dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={updateStatusMutation.isPending}
                            className={`${statusConfig.color} border-0 px-3 py-1 h-auto text-xs font-medium hover:scale-105 transition-all duration-200 cursor-pointer`}
                          >
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                            <ChevronDown className="w-3 h-3 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-white/95 backdrop-blur-sm border-white/20">
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange("in processing")}
                            className="flex items-center gap-2 text-xs"
                          >
                            <Clock className="w-3 h-3" />
                            In Processing
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange("delivered")}
                            className="flex items-center gap-2 text-xs"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Delivered
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange("rejected")}
                            className="flex items-center gap-2 text-xs"
                          >
                            <XCircle className="w-3 h-3" />
                            Rejected
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Country with flag */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <Globe className="w-4 h-4" />
                      <span>{getCountryFlag(request.country)} {getCountryName(request.country)}</span>
                    </div>
                    
                    {/* Date */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(request.requestDate), "MMM dd, yyyy")}</span>
                    </div>
                    
                    {/* Notes with delete button beside it (95%-5% layout) */}
                    {request.notes && (
                      <div className="flex gap-2 mt-2">
                        <div className="flex-1" style={{ width: '95%' }}>
                          <p className="text-sm text-gray-600 bg-gray-50/60 rounded-lg p-3 border border-gray-200/50">
                            {request.notes}
                          </p>
                        </div>
                        <div className="flex items-start pt-2" style={{ width: '5%' }}>
                          <Button
                            onClick={handleDeleteClick}
                            variant="ghost"
                            size="sm"
                            disabled={deleteMutation.isPending}
                            className="w-8 h-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Delete button in bottom right when no notes */}
                    {!request.notes && (
                      <Button
                        onClick={handleDeleteClick}
                        variant="ghost"
                        size="sm"
                        disabled={deleteMutation.isPending}
                        className="absolute bottom-3 right-3 w-8 h-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
                })}
              </div>
            )}
        </div>

        {/* Add Sample Request Form */}
        <SampleRequestForm open={isFormOpen} onOpenChange={setIsFormOpen} />
        
        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={confirmDelete}
          title="Delete Sample Request"
          description="Are you sure you want to delete this sample request? This action cannot be undone."
          isLoading={deleteMutation.isPending}
        />
      </div>
    </div>
  );
}