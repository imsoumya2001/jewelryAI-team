import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ClientWithTeam } from "@shared/schema";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { getCountryFlagByName } from "@/lib/country-flags";
import { 
  Image, 
  Gem, 
  DollarSign, 
  Calendar,
  Clock,
  Save,
  Edit3,
  X,
  Check
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface InteractiveClientCardProps {
  client: ClientWithTeam;
}

export default function InteractiveClientCard({ client }: InteractiveClientCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    projectFee: client.totalProjectFee.toString(),
    amountPaid: client.amountPaid.toString(),
    imagesMade: (client.imagesMade || 0).toString(),
    totalImages: (client.totalImagesToMake || 0).toString(),
    jewelryMade: (client.jewelryArticlesMade || 0).toString(),
    totalJewelry: (client.totalJewelryArticles || 0).toString(),
    projectStatus: client.projectStatus,
  });

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
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update client",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const updatePayload = {
      totalProjectFee: parseFloat(editData.projectFee),
      amountPaid: parseFloat(editData.amountPaid),
      imagesMade: parseInt(editData.imagesMade),
      totalImagesToMake: parseInt(editData.totalImages),
      jewelryArticlesMade: parseInt(editData.jewelryMade),
      totalJewelryArticles: parseInt(editData.totalJewelry),
      projectStatus: editData.projectStatus,
      lastActivity: new Date().toISOString(), // Update last activity timestamp
    };
    updateClientMutation.mutate(updatePayload);
  };

  const handleCancel = () => {
    setEditData({
      projectFee: client.totalProjectFee.toString(),
      amountPaid: client.amountPaid.toString(),
      imagesMade: (client.imagesMade || 0).toString(),
      totalImages: (client.totalImagesToMake || 0).toString(),
      jewelryMade: (client.jewelryArticlesMade || 0).toString(),
      totalJewelry: (client.totalJewelryArticles || 0).toString(),
      projectStatus: client.projectStatus,
    });
    setIsEditing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Planning': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'In Progress': return 'bg-green-100 text-green-700 border-green-200';
      case 'Review': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Paused': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusOptions = () => [
    { value: 'Planning', label: 'Planning' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Review', label: 'Review' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Paused', label: 'Paused' },
  ];

  // Calculate progress
  const totalWork = parseInt(editData.totalImages) + parseInt(editData.totalJewelry);
  const completedWork = parseInt(editData.imagesMade) + parseInt(editData.jewelryMade);
  const progress = totalWork > 0 ? Math.round((completedWork / totalWork) * 100) : 0;

  // Calculate "last work" date - using lastActivity field
  const lastWorkDate = client.lastActivity || client.updatedAt || client.createdAt;
  const daysAgo = differenceInDays(new Date(), new Date(lastWorkDate));
  const lastWorkDisplay = daysAgo === 0 ? 'Today' : `${daysAgo} days ago`;

  return (
    <Card className="bg-gradient-to-br from-white/95 to-slate-50/95 backdrop-blur-sm border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
      {/* Subtle colored accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"></div>
      
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header Section */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12 border-2 border-white shadow-md">
                <AvatarImage src={client.logoUrl} alt={client.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                  {client.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-lg text-slate-800">{client.name}</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-600">{getCountryFlagByName(client.country)}</span>
                  <span className="text-sm text-slate-600">{client.country}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <Badge className={getStatusColor(editData.projectStatus)}>
                  <Select 
                    value={editData.projectStatus} 
                    onValueChange={(value) => setEditData({...editData, projectStatus: value})}
                  >
                    <SelectTrigger className="border-0 bg-transparent h-6 text-xs p-0 font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getStatusOptions().map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Badge>
              ) : (
                <Badge className={getStatusColor(client.projectStatus)}>
                  {client.projectStatus}
                </Badge>
              )}
            </div>
          </div>

          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 font-medium">Progress</span>
              <span className="text-slate-800 font-bold">{progress}%</span>
            </div>
            <Progress 
              value={progress} 
              className="h-2 bg-slate-100" 
            />
          </div>

          {/* Financial Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Project Fee</label>
              {isEditing ? (
                <div className="relative">
                  <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="number"
                    value={editData.projectFee}
                    onChange={(e) => setEditData({...editData, projectFee: e.target.value})}
                    className="pl-8 h-8 text-sm bg-white/80 border-slate-200"
                  />
                </div>
              ) : (
                <div className="text-lg font-bold text-slate-800">
                  {formatCurrency(parseFloat(client.totalProjectFee.toString()))}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Paid</label>
              {isEditing ? (
                <div className="relative">
                  <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  <Input
                    type="number"
                    value={editData.amountPaid}
                    onChange={(e) => setEditData({...editData, amountPaid: e.target.value})}
                    className="pl-8 h-8 text-sm bg-white/80 border-slate-200"
                  />
                </div>
              ) : (
                <div className="text-lg font-bold text-emerald-600">
                  {formatCurrency(parseFloat(client.amountPaid.toString()))}
                </div>
              )}
            </div>
          </div>

          {/* Work Progress Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide flex items-center gap-1">
                <Image className="w-3 h-3" />
                Images
              </label>
              {isEditing ? (
                <div className="flex items-center space-x-1">
                  <Input
                    type="number"
                    value={editData.imagesMade}
                    onChange={(e) => setEditData({...editData, imagesMade: e.target.value})}
                    className="h-8 text-xs bg-white/80 border-slate-200"
                    placeholder="Made"
                  />
                  <span className="text-xs text-slate-500">/</span>
                  <Input
                    type="number"
                    value={editData.totalImages}
                    onChange={(e) => setEditData({...editData, totalImages: e.target.value})}
                    className="h-8 text-xs bg-white/80 border-slate-200"
                    placeholder="Total"
                  />
                </div>
              ) : (
                <div className="text-sm font-semibold text-slate-700">
                  {client.imagesMade || 0} / {client.totalImagesToMake || 0}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide flex items-center gap-1">
                <Gem className="w-3 h-3" />
                Jewelry Articles
              </label>
              {isEditing ? (
                <div className="flex items-center space-x-1">
                  <Input
                    type="number"
                    value={editData.jewelryMade}
                    onChange={(e) => setEditData({...editData, jewelryMade: e.target.value})}
                    className="h-8 text-xs bg-white/80 border-slate-200"
                    placeholder="Made"
                  />
                  <span className="text-xs text-slate-500">/</span>
                  <Input
                    type="number"
                    value={editData.totalJewelry}
                    onChange={(e) => setEditData({...editData, totalJewelry: e.target.value})}
                    className="h-8 text-xs bg-white/80 border-slate-200"
                    placeholder="Total"
                  />
                </div>
              ) : (
                <div className="text-sm font-semibold text-slate-700">
                  {client.jewelryArticlesMade || 0} / {client.totalJewelryArticles || 0}
                </div>
              )}
            </div>
          </div>

          {/* Timeline Section */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Date Started
              </label>
              <div className="text-xs text-slate-600">
                {format(new Date(client.createdAt), 'MMM dd, yyyy')}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last Work
              </label>
              <div className="text-xs text-slate-600">
                {lastWorkDisplay}
              </div>
            </div>
          </div>

          {/* Team Assignment */}
          {client.assignments && client.assignments.length > 0 ? (
            <div className="text-xs text-slate-600 bg-blue-50 p-2 rounded-lg border border-blue-100">
              <span className="font-medium">Assigned to:</span> {client.assignments[0].teamMember.name}
            </div>
          ) : (
            <div className="text-xs text-slate-500 bg-gray-50 p-2 rounded-lg border border-gray-100">
              No team member assigned
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-2">
            {isEditing ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  className="h-8 px-3 text-xs border-slate-200 hover:bg-slate-50"
                >
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={updateClientMutation.isPending}
                  className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {updateClientMutation.isPending ? (
                    <>
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3 h-3 mr-1" />
                      Save
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="h-8 px-3 text-xs border-blue-200 hover:bg-blue-50 text-blue-700"
              >
                <Edit3 className="w-3 h-3 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}