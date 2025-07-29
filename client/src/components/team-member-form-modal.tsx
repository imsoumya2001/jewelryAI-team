import { useState, useEffect } from "react";
import { TeamMember } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { countries } from "@/lib/data";
import { getCountryFlag } from "@/lib/country-flags";

interface TeamMemberFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingMember?: TeamMember | null;
}

interface FormData {
  name: string;
  whatsappNo: string;
  country: string;
  role: string;
}

export default function TeamMemberFormModal({ open, onOpenChange, editingMember }: TeamMemberFormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    whatsappNo: "",
    country: "",
    role: ""
  });

  // Reset form when editing member changes
  useEffect(() => {
    if (editingMember) {
      setFormData({
        name: editingMember.name || "",
        whatsappNo: editingMember.whatsappNo || "",
        country: editingMember.country || "",
        role: editingMember.role || ""
      });
    } else {
      setFormData({
        name: "",
        whatsappNo: "",
        country: "",
        role: ""
      });
    }
  }, [editingMember, open]);

  const createTeamMemberMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("POST", "/api/team-members", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      toast({
        title: "Success",
        description: "Team member added successfully"
      });
      setFormData({ name: "", whatsappNo: "", country: "", role: "" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to add team member",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.country || !formData.role) {
      toast({
        title: "Validation Error",
        description: "Please fill in name, country, and role",
        variant: "destructive"
      });
      return;
    }

    createTeamMemberMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white/95 backdrop-blur-sm border-white/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Add Team Member
          </DialogTitle>
          <DialogDescription>
            Add a new team member with their contact information and role
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter full name"
              className="bg-white/70 backdrop-blur-sm border-white/20 focus:bg-white/90"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp Number</Label>
            <Input
              id="whatsapp"
              value={formData.whatsappNo}
              onChange={(e) => setFormData(prev => ({ ...prev, whatsappNo: e.target.value }))}
              placeholder="+1234567890 (optional)"
              className="bg-white/70 backdrop-blur-sm border-white/20 focus:bg-white/90"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country *</Label>
            <Select value={formData.country} onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}>
              <SelectTrigger className="bg-white/70 backdrop-blur-sm border-white/20 focus:bg-white/90">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(countries).map(([code, country]) => (
                  <SelectItem key={code} value={country.name}>
                    {getCountryFlag(code)} {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
              <SelectTrigger className="bg-white/70 backdrop-blur-sm border-white/20 focus:bg-white/90">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cofounder">Co-founder</SelectItem>
                <SelectItem value="freelancer">Freelancer</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
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
              disabled={createTeamMemberMutation.isPending}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {createTeamMemberMutation.isPending ? "Adding..." : "Add Member"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}