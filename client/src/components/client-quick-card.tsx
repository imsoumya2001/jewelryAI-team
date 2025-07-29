import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ClientWithTeam } from "@shared/schema";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { getCountryFlagByName } from "@/lib/country-flags";
import QuickEditField from "./quick-edit-field";
import { Image, Gem, DollarSign } from "lucide-react";

interface ClientQuickCardProps {
  client: ClientWithTeam;
  onClick: () => void;
}

export default function ClientQuickCard({ client, onClick }: ClientQuickCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateClientMutation = useMutation({
    mutationFn: async (data: { field: string; value: number }) => {
      const response = await fetch(`/api/clients/${client.id}`, {
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

  const totalWork = (client.totalImagesToMake || 0) + (client.totalJewelryArticles || 0);
  const completedWork = (client.imagesMade || 0) + (client.jewelryArticlesMade || 0);
  const overallProgress = totalWork > 0 ? Math.round((completedWork / totalWork) * 100) : 0;

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

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 group">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                {client.name.charAt(0)}
              </div>
              <div>
                <h3 
                  className="font-semibold text-slate-900 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={onClick}
                >
                  {client.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">{getCountryFlagByName(client.country)}</span>
                  <Badge className={getStatusColor(client.status || 'active')}>
                    {client.status || 'active'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-4">
            {/* Images Progress */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Image className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-slate-600">Images</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <QuickEditField
                  value={client.imagesMade || 0}
                  onSave={(value) => updateClientMutation.mutate({ field: 'imagesMade', value })}
                  className="text-sm font-semibold text-blue-600"
                />
                <span className="text-xs text-slate-500">/</span>
                <QuickEditField
                  value={client.totalImagesToMake || 0}
                  onSave={(value) => updateClientMutation.mutate({ field: 'totalImagesToMake', value })}
                  className="text-xs text-slate-500"
                />
              </div>
            </div>

            {/* Articles Progress */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Gem className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-slate-600">Articles</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <QuickEditField
                  value={client.jewelryArticlesMade || 0}
                  onSave={(value) => updateClientMutation.mutate({ field: 'jewelryArticlesMade', value })}
                  className="text-sm font-semibold text-purple-600"
                />
                <span className="text-xs text-slate-500">/</span>
                <QuickEditField
                  value={client.totalJewelryArticles || 0}
                  onSave={(value) => updateClientMutation.mutate({ field: 'totalJewelryArticles', value })}
                  className="text-xs text-slate-500"
                />
              </div>
            </div>

            {/* Payment */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-xs text-slate-600">Paid</span>
              </div>
              <QuickEditField
                value={parseFloat(client.amountPaid.toString())}
                onSave={(value) => updateClientMutation.mutate({ field: 'amountPaid', value })}
                type="currency"
                prefix={getCurrencySymbol(client.feeCurrency || 'USD')}
                className="text-sm font-semibold text-green-600"
              />
            </div>
          </div>

          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">Overall Progress</span>
              <span className="text-xs font-semibold text-slate-900">{overallProgress}%</span>
            </div>
            <Progress 
              value={overallProgress} 
              className="h-2 bg-slate-200" 
              style={{ '--progress-foreground': '#22c55e' } as React.CSSProperties}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}