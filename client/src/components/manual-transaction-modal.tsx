import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { convertToUSD } from "@/lib/currency";
import { TeamMember } from "@shared/schema";

interface ManualTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  name: string;
  amount: string;
  currency: string;
  category: string;
  description: string;
  teamMemberId: string;
}

export default function ManualTransactionModal({ open, onOpenChange }: ManualTransactionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    amount: "",
    currency: "USD",
    category: "",
    description: "",
    teamMemberId: ""
  });

  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const amountUSD = convertToUSD(parseFloat(data.amount || "0"), data.currency);
      
      return await apiRequest("POST", "/api/transactions", {
        name: data.name || "Manual Transaction",
        amount: parseFloat(data.amount || "0"),
        amountUSD,
        currency: data.currency,
        type: "manual_transaction", // Set a default type since removed from form
        category: data.category || null,
        description: data.description || "",
        teamMemberId: data.teamMemberId === "unassigned" || !data.teamMemberId ? null : parseInt(data.teamMemberId),
        clientId: null, // Manual transactions are not linked to specific clients
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Success",
        description: "Transaction added successfully"
      });
      setFormData({
        name: "",
        amount: "",
        currency: "USD",
        category: "",
        description: "",
        teamMemberId: ""
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to add transaction",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTransactionMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white/95 backdrop-blur-sm border-white/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Add Manual Transaction
          </DialogTitle>
          <DialogDescription>
            Record a manual transaction for income or team payments
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transaction Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Transaction Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter transaction name"
              className="bg-white/70 backdrop-blur-sm border-white/20 focus:bg-white/90"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                className="bg-white/70 backdrop-blur-sm border-white/20 focus:bg-white/90"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <select
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white/70 backdrop-blur-sm px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.currency}
                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
              >
                <option value="USD">🇺🇸 USD - US Dollar</option>
                <option value="EUR">🇪🇺 EUR - Euro</option>
                <option value="GBP">🇬🇧 GBP - British Pound</option>
                <option value="INR">🇮🇳 INR - Indian Rupee</option>
                <option value="AED">🇦🇪 AED - UAE Dirham</option>
                <option value="CAD">🇨🇦 CAD - Canadian Dollar</option>
                <option value="AUD">🇦🇺 AUD - Australian Dollar</option>
                <option value="JPY">🇯🇵 JPY - Japanese Yen</option>
                <option value="CHF">🇨🇭 CHF - Swiss Franc</option>
                <option value="CNY">🇨🇳 CNY - Chinese Yuan</option>
                <option value="SAR">🇸🇦 SAR - Saudi Riyal</option>
                <option value="QAR">🇶🇦 QAR - Qatari Riyal</option>
                <option value="OMR">🇴🇲 OMR - Omani Rial</option>
                <option value="BHD">🇧🇭 BHD - Bahraini Dinar</option>
                <option value="KWD">🇰🇼 KWD - Kuwaiti Dinar</option>
              </select>
            </div>
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

          <div className="space-y-2">
            <Label htmlFor="teamMember">Team Member</Label>
            <select
              className="flex h-10 w-full rounded-md border border-gray-200 bg-white/70 backdrop-blur-sm px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.teamMemberId}
              onChange={(e) => setFormData(prev => ({ ...prev, teamMemberId: e.target.value }))}
            >
              <option value="">Select team member (optional)</option>
              <option value="unassigned">Unassigned</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id.toString()}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter transaction description"
              className="bg-white/70 backdrop-blur-sm border-white/20 focus:bg-white/90"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createTransactionMutation.isPending}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {createTransactionMutation.isPending ? "Adding..." : "Add Transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}