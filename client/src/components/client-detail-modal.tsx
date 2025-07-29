import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import DeleteConfirmationDialog from "@/components/delete-confirmation-dialog";
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
  Edit3,
  Trash2,
  X
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClientWithTeam } from "@shared/schema";
import { formatCurrency, getCurrencySymbol, convertFromUSD } from "@/lib/currency";
import { getCountryFlag, getCountryFlagByName } from "@/lib/country-flags";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface ClientDetailModalProps {
  clientId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (clientId: number) => void;
}

export default function ClientDetailModal({ clientId, open, onOpenChange, onEdit }: ClientDetailModalProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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

  const getClientInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Planning': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border-white/20">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              Client Details
            </DialogTitle>
            <DialogDescription className="sr-only">
              View and manage detailed information for this client including progress, financial details, and project timeline.
            </DialogDescription>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit && onEdit(client.id)}
                className="p-2 hover:bg-blue-50"
                title="Edit Client"
              >
                <Edit3 className="w-4 h-4 text-blue-600" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setDeleteDialogOpen(true)}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Delete Client"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="p-2 hover:bg-gray-50"
                title="Close"
              >
                <X className="w-4 h-4 text-gray-600" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-white/40 rounded-lg"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-24 bg-white/40 rounded-lg"></div>
              <div className="h-24 bg-white/40 rounded-lg"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Client Header */}
            <Card className="bg-white/60 backdrop-blur-sm border-white/20">
              <CardContent className="p-6">
                <div className="flex items-start space-x-6">
                  {/* Company Logo Display */}
                  {client.logoUrl ? (
                    <img 
                      src={client.logoUrl} 
                      alt={`${client.name} logo`}
                      className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold">
                        {getClientInitials(client.name)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-2xl font-bold text-slate-900">{client.name}</h2>
                      <Badge className={getStatusColor(client.projectStatus)}>
                        {client.projectStatus}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>{client.contactPerson}</span>
                      </div>
                      {client.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                      {client.country && (
                        <div className="flex items-center space-x-2">
                          <Globe className="w-4 h-4" />
                          <span>
                            {client.countryCode && getCountryFlag(client.countryCode)} {client.country}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4" />
                        <span>{client.contractType === 'monthly' ? 'Monthly Contract' : 'One-time Project'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Project Timeline */}
              <Card className="bg-white/60 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>Project Timeline</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-600">Start Date</p>
                    <p className="font-semibold">{format(new Date(client.contractStartDate), 'PPP')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Expected Completion</p>
                    <p className="font-semibold">{format(new Date(client.expectedCompletionDate), 'PPP')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Overall Progress</p>
                    <div className="space-y-2">
                      <Progress value={overallProgress} className="h-3" />
                      <p className="text-sm font-medium">{Math.round(overallProgress)}% Complete</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Information */}
              <Card className="bg-white/60 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5" />
                    <span>Financial Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-600">Total Project Fee</p>
                    <p className="text-lg font-bold text-slate-900">
                      {formatCurrency(feeInOriginalCurrency, originalCurrency)}
                    </p>
                    {originalCurrency !== 'USD' && (
                      <p className="text-sm text-slate-500">≈ {formatCurrency(feeInUSD, 'USD')}</p>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm text-slate-600">Amount Paid</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(paidInOriginalCurrency, originalCurrency)}
                    </p>
                    {originalCurrency !== 'USD' && (
                      <p className="text-sm text-slate-500">≈ {formatCurrency(paidInUSD, 'USD')}</p>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm text-slate-600">Outstanding Amount</p>
                    <p className="text-lg font-bold text-red-600">
                      {formatCurrency(feeInOriginalCurrency - paidInOriginalCurrency, originalCurrency)}
                    </p>
                    {originalCurrency !== 'USD' && (
                      <p className="text-sm text-slate-500">≈ {formatCurrency(feeInUSD - paidInUSD, 'USD')}</p>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-slate-600 mb-1">
                      <span>Payment Progress</span>
                      <span>{Math.round((paidInOriginalCurrency / feeInOriginalCurrency) * 100)}%</span>
                    </div>
                    <Progress value={(paidInOriginalCurrency / feeInOriginalCurrency) * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress Details */}
            <Card className="bg-white/60 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Work Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Images Progress */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Image className="w-5 h-5 text-purple-600" />
                      <h4 className="font-semibold">Images</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">{client.imagesMade || 0} / {client.totalImagesToMake || 0}</span>
                      </div>
                      <Progress 
                        value={client.totalImagesToMake ? (client.imagesMade || 0) / client.totalImagesToMake * 100 : 0} 
                        className="h-2" 
                      />
                    </div>
                  </div>

                  {/* Articles Progress */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Gem className="w-5 h-5 text-amber-600" />
                      <h4 className="font-semibold">Jewelry Articles</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">{client.jewelryArticlesMade || 0} / {client.totalJewelryArticles || 0}</span>
                      </div>
                      <Progress 
                        value={client.totalJewelryArticles ? (client.jewelryArticlesMade || 0) / client.totalJewelryArticles * 100 : 0} 
                        className="h-2" 
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Assignments */}
            {client.assignments && client.assignments.length > 0 && (
              <Card className="bg-white/60 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Team Assignments</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {client.assignments.map((assignment) => (
                      <div key={assignment.id} className="flex items-center space-x-3 p-3 bg-white/50 rounded-lg">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={assignment.teamMember.avatar || ''} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            {assignment.teamMember.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{assignment.teamMember.name}</p>
                          <p className="text-sm text-slate-600">{assignment.teamMember.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => {
          deleteClientMutation.mutate(client?.id!);
          setDeleteDialogOpen(false);
        }}
        title="Delete Client"
        itemName={client?.name}
        isLoading={deleteClientMutation.isPending}
      />
    </Dialog>
  );
}