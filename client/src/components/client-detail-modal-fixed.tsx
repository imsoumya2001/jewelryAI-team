import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Building2, 
  User, 
  Phone, 
  Globe, 
  Calendar, 
  DollarSign,
  Image,
  Gem,
  TrendingUp,
  Clock,
  Trash2,
  X,
  Users
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClientWithTeam } from "@shared/schema";
import { formatCurrency, getCurrencySymbol, convertFromUSD } from "@/lib/currency";
import { getCountryFlag, getCountryFlagByName } from "@/lib/country-flags";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import QuickEditField from "./quick-edit-field";

interface ClientDetailModalProps {
  clientId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ClientDetailModal({ clientId, open, onOpenChange }: ClientDetailModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: client, isLoading } = useQuery<ClientWithTeam>({
    queryKey: ["/api/clients", clientId],
    enabled: !!clientId && open,
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/clients/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete client");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      });
    },
  });

  if (!client) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': 
      case 'in_progress': 
        return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'Planning': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-green-100 text-green-800';
      case 'Review': return 'bg-purple-100 text-purple-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalWork = (client.totalImagesToMake || 0) + (client.totalJewelryArticles || 0);
  const completedWork = (client.imagesMade || 0) + (client.jewelryArticlesMade || 0);
  const overallProgress = totalWork > 0 ? (completedWork / totalWork) * 100 : 0;

  // Calculate amounts in original currency and USD
  const originalCurrency = client.feeCurrency || 'USD';
  const feeInOriginalCurrency = parseFloat(client.totalProjectFee.toString());
  const paidInOriginalCurrency = parseFloat(client.amountPaid.toString());
  const feeInUSD = parseFloat(client.totalProjectFeeUSD?.toString() || client.totalProjectFee.toString());
  const paidInUSD = parseFloat(client.amountPaidUSD?.toString() || client.amountPaid.toString());

  // Quick update mutations for specific fields
  const updateClientMutation = useMutation({
    mutationFn: async (data: { field: string; value: number }) => {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [data.field]: data.value }),
      });
      if (!response.ok) {
        throw new Error("Failed to update client");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update client",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border-white/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Client Details
          </DialogTitle>
          <DialogDescription className="sr-only">
            View and manage detailed information for this client including progress, financial details, and project timeline.
          </DialogDescription>
          <div className="flex items-center justify-between">
            <div></div>
            <div className="flex gap-1">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Delete Client"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Client</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {client.name}? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteClientMutation.mutate(client.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                title="Close"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Header */}
          <div className="flex items-start gap-6 p-6 bg-gradient-to-r from-blue-50/80 to-purple-50/80 rounded-xl border border-white/50 backdrop-blur-sm">
            <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
              <AvatarImage src={client.logoUrl} alt={client.name} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-bold">
                {client.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h3 className="text-2xl font-bold text-slate-900">{client.name}</h3>
                <span className="text-2xl">{getCountryFlagByName(client.country)}</span>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(client.status || 'active')}`}>
                  {client.status || 'active'}
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <User className="w-4 h-4" />
                <span>{client.contactPerson}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <Globe className="w-4 h-4" />
                <span>{client.country}</span>
              </div>
              {client.phone && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-4 h-4" />
                  <span>{client.phone}</span>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getProjectStatusColor(client.projectStatus)} mb-2`}>
                {client.projectStatus}
              </div>
              <div className="text-sm text-slate-500">
                Contract: {client.contractType}
              </div>
            </div>
          </div>

          {/* Progress Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-semibold text-slate-900">Overall Progress</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Completed</span>
                  <span className="font-medium">{Math.round(overallProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${overallProgress}%` }}
                  ></div>
                </div>
                <div className="text-xs text-slate-500">
                  {completedWork} of {totalWork} items completed
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                  <Image className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-semibold text-slate-900">Images</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <QuickEditField
                    value={client.imagesMade || 0}
                    onSave={(value) => updateClientMutation.mutate({ field: 'imagesMade', value })}
                    className="text-2xl font-bold text-slate-900"
                  />
                  <span className="text-sm text-slate-500">/ 
                    <QuickEditField
                      value={client.totalImagesToMake || 0}
                      onSave={(value) => updateClientMutation.mutate({ field: 'totalImagesToMake', value })}
                      className="text-sm text-slate-500 ml-1"
                    />
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: `${(client.totalImagesToMake || 0) > 0 ? ((client.imagesMade || 0) / (client.totalImagesToMake || 0)) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                  <Gem className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-semibold text-slate-900">Articles</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <QuickEditField
                    value={client.jewelryArticlesMade || 0}
                    onSave={(value) => updateClientMutation.mutate({ field: 'jewelryArticlesMade', value })}
                    className="text-2xl font-bold text-slate-900"
                  />
                  <span className="text-sm text-slate-500">/ 
                    <QuickEditField
                      value={client.totalJewelryArticles || 0}
                      onSave={(value) => updateClientMutation.mutate({ field: 'totalJewelryArticles', value })}
                      className="text-sm text-slate-500 ml-1"
                    />
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full" 
                    style={{ 
                      width: `${(client.totalJewelryArticles || 0) > 0 ? ((client.jewelryArticlesMade || 0) / (client.totalJewelryArticles || 0)) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/50 shadow-sm">
              <h4 className="flex items-center gap-3 font-semibold text-slate-900 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                Financial Overview
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Project Fee ({originalCurrency})</span>
                  <span className="font-semibold">{formatCurrency(feeInOriginalCurrency, originalCurrency)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Project Fee (USD)</span>
                  <span className="font-semibold">{formatCurrency(feeInUSD, 'USD')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Amount Paid ({originalCurrency})</span>
                  <QuickEditField
                    value={paidInOriginalCurrency}
                    onSave={(value) => updateClientMutation.mutate({ field: 'amountPaid', value })}
                    type="currency"
                    prefix={getCurrencySymbol(originalCurrency)}
                    className="font-semibold text-green-600"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Amount Paid (USD)</span>
                  <span className="font-semibold text-green-600">{formatCurrency(paidInUSD, 'USD')}</span>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Remaining ({originalCurrency})</span>
                    <span className="font-semibold text-orange-600">
                      {formatCurrency(feeInOriginalCurrency - paidInOriginalCurrency, originalCurrency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Remaining (USD)</span>
                    <span className="font-semibold text-orange-600">
                      {formatCurrency(feeInUSD - paidInUSD, 'USD')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/50 shadow-sm">
              <h4 className="flex items-center gap-3 font-semibold text-slate-900 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                Timeline
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Contract Start</span>
                  <span className="font-semibold">{format(new Date(client.contractStartDate), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Expected Completion</span>
                  <span className="font-semibold">{format(new Date(client.expectedCompletionDate), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Contract Type</span>
                  <span className="font-semibold capitalize">{client.contractType}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Team Assignments */}
          {client.assignments && client.assignments.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/50 shadow-sm">
              <h4 className="flex items-center gap-3 font-semibold text-slate-900 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                Assigned Team Members
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {client.assignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {assignment.teamMember.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{assignment.teamMember.name}</p>
                      <p className="text-sm text-slate-600">{assignment.teamMember.role}</p>
                      <p className="text-xs text-slate-500">{getCountryFlag(assignment.teamMember.country)} {assignment.teamMember.country}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}