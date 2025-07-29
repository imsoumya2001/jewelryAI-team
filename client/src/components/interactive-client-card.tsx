import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Removed StableSelect import - using native HTML select elements
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ClientWithTeam } from "@shared/schema";
import { getCountryFlagByName } from "@/lib/country-flags";
import { 
  Image, 
  Gem, 
  DollarSign, 
  Calendar,
  Clock,
  Save,
  Edit3,
  Edit,
  X,
  Check,
  ChevronDown,
  Trash2
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

// Currency symbols and exchange rates
const CURRENCIES = {
  USD: { symbol: "$", name: "US Dollar", rate: 1 },
  AUD: { symbol: "A$", name: "Australian Dollar", rate: 1.50 },
  CAD: { symbol: "C$", name: "Canadian Dollar", rate: 1.35 },
  INR: { symbol: "₹", name: "Indian Rupee", rate: 83.25 },
  PKR: { symbol: "₨", name: "Pakistani Rupee", rate: 278.50 },
  AED: { symbol: "AED", name: "UAE Dirham", rate: 3.67 },
  OMR: { symbol: "OMR", name: "Omani Rial", rate: 0.38 },
  QAR: { symbol: "QAR", name: "Qatari Rial", rate: 3.64 },
  EUR: { symbol: "€", name: "Euro", rate: 0.92 },
  GBP: { symbol: "£", name: "British Pound", rate: 0.79 },
} as const;

type CurrencyCode = keyof typeof CURRENCIES;

const formatCurrency = (amount: number, currency: CurrencyCode) => {
  const roundedAmount = Math.round(amount);
  const formattedAmount = roundedAmount >= 1000 
    ? (roundedAmount / 1000).toFixed(1).replace('.0', '') + 'k'
    : roundedAmount.toString();
  return `${CURRENCIES[currency].symbol}${formattedAmount}`;
};

const convertToUSD = (amount: number, fromCurrency: CurrencyCode) => {
  return amount / CURRENCIES[fromCurrency].rate;
};

interface InteractiveClientCardProps {
  client: ClientWithTeam;
}

export default function InteractiveClientCard({ client }: InteractiveClientCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    projectFee: client.totalProjectFee.toString(),
    feeCurrency: (client.feeCurrency as CurrencyCode) || 'USD',
    amountPaid: client.amountPaid.toString(),
    imagesMade: (client.imagesMade || 0).toString(),
    totalImages: (client.totalImagesToMake || 0).toString(),
    jewelryMade: (client.jewelryArticlesMade || 0).toString(),
    totalJewelry: (client.totalJewelryArticles || 0).toString(),
    projectStatus: client.projectStatus,
  });

  // Update editData when client data changes
  React.useEffect(() => {
    if (!isEditing && client) {
      try {
        setEditData({
          projectFee: (client.totalProjectFee || 0).toString(),
          feeCurrency: (client.feeCurrency as CurrencyCode) || 'USD',
          amountPaid: (client.amountPaid || 0).toString(),
          imagesMade: (client.imagesMade || 0).toString(),
          totalImages: (client.totalImagesToMake || 0).toString(),
          jewelryMade: (client.jewelryArticlesMade || 0).toString(),
          totalJewelry: (client.totalJewelryArticles || 0).toString(),
          projectStatus: client.projectStatus,
        });
      } catch (error) {
        console.error('Error updating edit data:', error);
      }
    }
  }, [client?.id, client?.totalProjectFee, client?.amountPaid, client?.projectStatus, client?.imagesMade, client?.totalImagesToMake, client?.jewelryArticlesMade, client?.totalJewelryArticles, client?.feeCurrency, isEditing]);

  const updateClientMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update client");
      }
      return response.json();
    },
    onMutate: async (newData) => {
      try {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey: ["/api/clients"] });
        
        // Snapshot the previous value
        const previousClients = queryClient.getQueryData(["/api/clients"]);
        
        // Optimistically update to the new value
        queryClient.setQueryData(["/api/clients"], (old: any) => {
          if (!old || !Array.isArray(old)) return old;
          return old.map((c: any) => c.id === client.id ? { ...c, ...newData } : c);
        });
        
        return { previousClients };
      } catch (error) {
        console.error('Optimistic update error:', error);
        return { previousClients: null };
      }
    },
    onError: (err, newData, context) => {
      // Rollback on error
      if (context?.previousClients) {
        queryClient.setQueryData(["/api/clients"], context.previousClients);
      }
      toast({
        title: "Error",
        description: err.message || "Failed to update client",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete client");
      }
    },
    onMutate: async () => {
      try {
        await queryClient.cancelQueries({ queryKey: ["/api/clients"] });
        const previousClients = queryClient.getQueryData(["/api/clients"]);
        
        // Remove client optimistically
        queryClient.setQueryData(["/api/clients"], (old: any) => {
          if (!old || !Array.isArray(old)) return old;
          return old.filter((c: any) => c.id !== client.id);
        });
        
        return { previousClients };
      } catch (error) {
        console.error('Delete optimistic update error:', error);
        return { previousClients: null };
      }
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousClients) {
        queryClient.setQueryData(["/api/clients"], context.previousClients);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to delete client",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    },
  });

  const handleSave = () => {
    try {
      const projectFeeValue = parseFloat(editData.projectFee) || 0;
      const amountPaidValue = parseFloat(editData.amountPaid) || 0;
      
      // Calculate USD conversions
      const projectFeeUSD = convertToUSD(projectFeeValue, editData.feeCurrency);
      const amountPaidUSD = convertToUSD(amountPaidValue, editData.feeCurrency);

      const updatePayload = {
        totalProjectFee: Math.round(projectFeeValue).toString(),
        totalProjectFeeUSD: Math.round(projectFeeUSD).toString(),
        feeCurrency: editData.feeCurrency,
        amountPaid: Math.round(amountPaidValue).toString(),
        amountPaidUSD: Math.round(amountPaidUSD).toString(),
        imagesMade: parseInt(editData.imagesMade) || 0,
        totalImagesToMake: parseInt(editData.totalImages) || 0,
        jewelryArticlesMade: parseInt(editData.jewelryMade) || 0,
        totalJewelryArticles: parseInt(editData.totalJewelry) || 0,
        projectStatus: editData.projectStatus,
        lastActivity: new Date().toISOString(),
      };
      updateClientMutation.mutate(updatePayload);
    } catch (error) {
      console.error('Error preparing save data:', error);
      toast({
        title: "Error",
        description: "Failed to prepare update data",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    try {
      setEditData({
        projectFee: (client.totalProjectFee || 0).toString(),
        feeCurrency: (client.feeCurrency as CurrencyCode) || 'USD',
        amountPaid: (client.amountPaid || 0).toString(),
        imagesMade: (client.imagesMade || 0).toString(),
        totalImages: (client.totalImagesToMake || 0).toString(),
        jewelryMade: (client.jewelryArticlesMade || 0).toString(),
        totalJewelry: (client.totalJewelryArticles || 0).toString(),
        projectStatus: client.projectStatus,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error resetting edit data:', error);
      setIsEditing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed": return "bg-blue-500/20 text-blue-700 border-blue-200";
      case "running": return "bg-green-500/20 text-green-700 border-green-200";
      case "planning": return "bg-orange-500/20 text-orange-700 border-orange-200";
      case "in-progress": case "in progress": return "bg-green-500/20 text-green-700 border-green-200";
      case "testing": return "bg-orange-500/20 text-orange-700 border-orange-200";
      case "review": return "bg-orange-500/20 text-orange-700 border-orange-200";
      case "on-hold": case "on hold": return "bg-red-500/20 text-red-700 border-red-200";
      default: return "bg-slate-500/20 text-slate-700 border-slate-200";
    }
  };

  // Calculate progress using current data
  const currentImagesMade = isEditing ? parseInt(editData.imagesMade) : (client.imagesMade || 0);
  const currentTotalImages = isEditing ? parseInt(editData.totalImages) : (client.totalImagesToMake || 0);
  const currentJewelryMade = isEditing ? parseInt(editData.jewelryMade) : (client.jewelryArticlesMade || 0);
  const currentTotalJewelry = isEditing ? parseInt(editData.totalJewelry) : (client.totalJewelryArticles || 0);
  
  const totalWork = currentTotalImages + currentTotalJewelry;
  const completedWork = currentImagesMade + currentJewelryMade;
  const progress = totalWork > 0 ? Math.round((completedWork / totalWork) * 100) : 0;

  // Calculate "last work" date - using lastActivity field
  const lastWorkDate = client.lastActivity || client.updatedAt || client.createdAt;
  const daysAgo = differenceInDays(new Date(), new Date(lastWorkDate));
  const lastWorkDisplay = daysAgo === 0 ? 'Today' : `${daysAgo} days ago`;

  // Get current currency for display
  const currentCurrency = (client.feeCurrency as CurrencyCode) || 'USD';
  const projectFeeInOriginalCurrency = parseFloat(client.totalProjectFee.toString());
  const amountPaidInOriginalCurrency = parseFloat(client.amountPaid.toString());
  const projectFeeUSDEquivalent = convertToUSD(projectFeeInOriginalCurrency, currentCurrency);

  return (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-white/95 via-slate-50/90 to-blue-50/80 backdrop-blur-sm border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:bg-gradient-to-br hover:from-white hover:via-slate-50/95 hover:to-blue-50/90">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Edit mode overlay */}
      {isEditing && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-indigo-500/10 z-10 rounded-lg"></div>
      )}

      <CardContent className="p-3 relative z-20">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 ring-2 ring-white/50 shadow-md">
              <AvatarImage src={client.logoUrl} alt={client.name} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold text-sm">
                {client.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-base text-slate-800 group-hover:text-slate-900 transition-colors">
                {client.name.toUpperCase()}
              </h3>
              <div className="flex items-center space-x-2 text-xs text-slate-600">
                <span className="text-sm">{getCountryFlagByName(client.country)}</span>
                <span>{client.country}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            <Badge className={`${getStatusColor(isEditing ? editData.projectStatus : client.projectStatus)} font-medium px-2 py-1 text-xs whitespace-nowrap`}>
              {isEditing ? (
                <select
                  value={editData.projectStatus}
                  onChange={(e) => setEditData({...editData, projectStatus: e.target.value})}
                  className="border-0 bg-transparent text-xs p-0 focus:outline-none min-w-0"
                >
                  <option value="Planning">Planning</option>
                  <option value="Running">Running</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              ) : (
                client.projectStatus === "In Progress" ? "Running" : client.projectStatus
              )}
            </Badge>
          </div>
        </div>

        {/* Progress Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">Progress</span>
            <span className="text-xl font-bold text-slate-800">{progress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Financial Info */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Project Fee */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Project Fee</label>
            {isEditing ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <select
                    value={editData.feeCurrency}
                    onChange={(e) => setEditData({...editData, feeCurrency: e.target.value as CurrencyCode})}
                    className="w-20 h-12 bg-white/80 border border-slate-200 rounded-md px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Object.entries(CURRENCIES).map(([code, currency]) => (
                      <option key={code} value={code}>
                        {currency.symbol}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    step="0.01"
                    value={editData.projectFee}
                    onChange={(e) => setEditData({...editData, projectFee: e.target.value})}
                    className="flex-1 h-12 text-lg font-bold bg-white/80 border-slate-200"
                  />
                </div>
                <div className="text-xs text-slate-500">
                  ≈ $${Math.round(convertToUSD(parseFloat(editData.projectFee) || 0, editData.feeCurrency)) >= 1000 
                    ? (Math.round(convertToUSD(parseFloat(editData.projectFee) || 0, editData.feeCurrency)) / 1000).toFixed(1).replace('.0', '') + 'k'
                    : Math.round(convertToUSD(parseFloat(editData.projectFee) || 0, editData.feeCurrency)).toString()} USD
                </div>
              </div>
            ) : (
              <div>
                <div className="text-lg font-bold text-slate-800">
                  {formatCurrency(projectFeeInOriginalCurrency, currentCurrency)}
                </div>
                <div className="text-xs text-slate-500">
                  ≈ $${Math.round(projectFeeUSDEquivalent) >= 1000 
                    ? (Math.round(projectFeeUSDEquivalent) / 1000).toFixed(1).replace('.0', '') + 'k'
                    : Math.round(projectFeeUSDEquivalent).toString()} USD
                </div>
              </div>
            )}
          </div>

          {/* Amount Paid */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Paid</label>
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-lg">
                  <span className="text-emerald-700 font-bold">{CURRENCIES[editData.feeCurrency].symbol}</span>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  value={editData.amountPaid}
                  onChange={(e) => setEditData({...editData, amountPaid: e.target.value})}
                  className="flex-1 h-12 text-lg font-bold bg-white/80 border-slate-200"
                />
              </div>
            ) : (
              <div className="text-lg font-bold text-emerald-600">
                {formatCurrency(amountPaidInOriginalCurrency, currentCurrency)}
              </div>
            )}
          </div>
        </div>

        {/* Work Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Images */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Image className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
              <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">Images</span>
            </div>
            {isEditing ? (
              <div className="flex items-center space-x-1">
                <Input
                  type="number"
                  value={editData.imagesMade}
                  onChange={(e) => setEditData({...editData, imagesMade: e.target.value})}
                  className="w-14 sm:w-16 h-8 sm:h-10 text-center text-sm bg-white/80 border-slate-200"
                />
                <span className="text-slate-400">/</span>
                <Input
                  type="number"
                  value={editData.totalImages}
                  onChange={(e) => setEditData({...editData, totalImages: e.target.value})}
                  className="w-14 sm:w-16 h-8 sm:h-10 text-center text-sm bg-white/80 border-slate-200"
                />
              </div>
            ) : (
              <div className="text-base font-bold text-slate-800">
                {currentImagesMade} / {currentTotalImages}
              </div>
            )}
          </div>

          {/* Jewelry Articles */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Gem className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
              <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">Jewelry Articles</span>
            </div>
            {isEditing ? (
              <div className="flex items-center space-x-1">
                <Input
                  type="number"
                  value={editData.jewelryMade}
                  onChange={(e) => setEditData({...editData, jewelryMade: e.target.value})}
                  className="w-14 sm:w-16 h-8 sm:h-10 text-center text-sm bg-white/80 border-slate-200"
                />
                <span className="text-slate-400">/</span>
                <Input
                  type="number"
                  value={editData.totalJewelry}
                  onChange={(e) => setEditData({...editData, totalJewelry: e.target.value})}
                  className="w-14 sm:w-16 h-8 sm:h-10 text-center text-sm bg-white/80 border-slate-200"
                />
              </div>
            ) : (
              <div className="text-base font-bold text-slate-800">
                {currentJewelryMade} / {currentTotalJewelry}
              </div>
            )}
          </div>
        </div>

        {/* Date Information */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-slate-500" />
              <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">Date Started</span>
            </div>
            <div className="text-xs text-slate-700">
              {format(new Date(client.contractStartDate), 'MMM dd, yyyy')}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-slate-500" />
              <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">Last Work</span>
            </div>
            <div className="text-xs text-slate-700">{lastWorkDisplay}</div>
          </div>
        </div>

        {/* Team Assignment */}
        {client.assignments && client.assignments.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">Team</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {client.assignments.map((assignment) => (
                <Badge key={assignment.teamMember.id} variant="outline" className="bg-white/50 border-slate-200 text-xs">
                  {assignment.teamMember.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-1">
          {isEditing ? (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete ${client.name}? This action cannot be undone.`)) {
                    deleteClientMutation.mutate();
                  }
                }}
                disabled={deleteClientMutation.isPending}
                className="hover:bg-red-50 hover:border-red-200 hover:text-red-700 text-xs px-2 h-7"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCancel}
                disabled={updateClientMutation.isPending}
                className="text-xs px-2 h-7"
              >
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={updateClientMutation.isPending}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-xs px-2 h-7"
              >
                <Save className="h-3 w-3 mr-1" />
                {updateClientMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(true)}
              className="text-xs px-2 h-7"
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}