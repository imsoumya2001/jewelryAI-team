import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { SUPPORTED_CURRENCIES, convertToUSD } from "@/lib/currency";
import { TeamMember } from "@shared/schema";

interface TransactionEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: any;
}

interface FormData {
  amount: string;
  currency: string;
  type: string;
  category: string;
  description: string;
  teamMemberId: string;
}

export default function TransactionEditModal({ open, onOpenChange, transaction }: TransactionEditModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<FormData>({
    amount: "",
    currency: "USD",
    type: "",
    category: "",
    description: "",
    teamMemberId: ""
  });

  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  useEffect(() => {
    if (transaction && open) {
      setFormData({
        amount: transaction.amount?.toString() || "",
        currency: transaction.currency || "USD",
        type: transaction.type || "",
        category: transaction.category || "",
        description: transaction.description || "",
        teamMemberId: transaction.teamMemberId?.toString() || "unassigned"
      });
    }
  }, [transaction, open]);

  const updateTransactionMutation = useMutation({
    mutationFn: async (data: { teamMemberId: number | null; category?: string }) => {
      // Check if this is a client payment (ID starts with "client-")
      if (transaction.id.toString().startsWith("client-")) {
        const clientId = transaction.id.toString().replace("client-", "");
        // Update client assignment instead of transaction
        return await apiRequest("POST", `/api/clients/${clientId}/assign`, {
          teamMemberId: data.teamMemberId
        });
      } else {
        // Regular transaction update
        return await apiRequest("PUT", `/api/transactions/${transaction.id}`, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Success",
        description: "Assignment updated successfully"
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update transaction",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateTransactionMutation.mutate({
      teamMemberId: formData.teamMemberId === "unassigned" || !formData.teamMemberId ? null : parseInt(formData.teamMemberId),
      category: formData.category
    });
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-white/90 backdrop-blur-xl border-white/20">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Assign Transaction
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Assign this transaction to a team member
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teamMember">Assign to Team Member</Label>
            <Select value={formData.teamMemberId || "unassigned"} onValueChange={(value) => setFormData(prev => ({ ...prev, teamMemberId: value }))}>
              <SelectTrigger className="bg-white/70 backdrop-blur-sm border-white/20 focus:bg-white/90">
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id.toString()}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              className="flex h-10 w-full rounded-md border border-gray-200 bg-white/70 backdrop-blur-sm px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            >
              <option value="">Select category</option>
              <option value="Revenue">Revenue</option>
              <option value="Salary">Salary</option>
              <option value="Expenses">Expenses</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateTransactionMutation.isPending}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {updateTransactionMutation.isPending ? "Assigning..." : "Assign Transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}