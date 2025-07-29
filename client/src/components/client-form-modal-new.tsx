import { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { countries } from "@/lib/data";
import { SUPPORTED_CURRENCIES, convertToUSD, formatCurrency } from "@/lib/currency";
import { getCountryFlag, getCountryFlagByName } from "@/lib/country-flags";
import { ClientWithTeam } from "@shared/schema";

interface ClientFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingClientId?: number | null;
}

export default function ClientFormModal({ open, onOpenChange, editingClientId }: ClientFormModalProps) {
  const [formData, setFormData] = useState({
    name: "", // company name
    contactPerson: "",
    phone: "",
    country: "",
    countryCode: "",
    contractType: "monthly", // monthly/one-time
    projectStatus: "Planning",
    contractStartDate: new Date(),
    expectedCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month from now
    totalProjectFee: "",
    feeCurrency: "USD",
    amountPaid: "0",
    totalImagesToMake: 0,
    imagesMade: 0,
    totalJewelryArticles: 0,
    jewelryArticlesMade: 0,
    logoUrl: ""
  });

  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch client data when editing
  const { data: editingClient } = useQuery<ClientWithTeam>({
    queryKey: ["/api/clients", editingClientId],
    enabled: !!editingClientId && open,
  });

  // Pre-populate form when editing
  useEffect(() => {
    if (editingClient && editingClientId && open) {
      setFormData({
        name: editingClient.name,
        contactPerson: editingClient.contactPerson,
        phone: editingClient.phone || "",
        country: editingClient.country,
        countryCode: editingClient.countryCode,
        contractType: editingClient.contractType,
        projectStatus: editingClient.projectStatus,
        contractStartDate: new Date(editingClient.contractStartDate),
        expectedCompletionDate: new Date(editingClient.expectedCompletionDate),
        totalProjectFee: editingClient.totalProjectFee.toString(),
        feeCurrency: editingClient.feeCurrency || "USD",
        amountPaid: editingClient.amountPaid.toString(),
        totalImagesToMake: editingClient.totalImagesToMake || 0,
        imagesMade: editingClient.imagesMade || 0,
        totalJewelryArticles: editingClient.totalJewelryArticles || 0,
        jewelryArticlesMade: editingClient.jewelryArticlesMade || 0,
        logoUrl: editingClient.logoUrl || ""
      });
      if (editingClient.logoUrl) {
        setLogoPreview(editingClient.logoUrl);
      }
    }
  }, [editingClient, editingClientId, open]);

  // Reset form when creating new client
  useEffect(() => {
    if (open && !editingClientId) {
      setFormData({
        name: "",
        contactPerson: "",
        phone: "",
        country: "",
        countryCode: "",
        contractType: "monthly",
        projectStatus: "Planning",
        contractStartDate: new Date(),
        expectedCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        totalProjectFee: "",
        feeCurrency: "USD",
        amountPaid: "0",
        totalImagesToMake: 0,
        imagesMade: 0,
        totalJewelryArticles: 0,
        jewelryArticlesMade: 0,
        logoUrl: ""
      });
      setLogoPreview("");
      setLogoFile(null);
    }
  }, [open, editingClientId]);

  const saveClientMutation = useMutation({
    mutationFn: async (data: any) => {
      const isEditing = !!editingClientId;
      const url = isEditing ? `/api/clients/${editingClientId}` : "/api/clients";
      const method = isEditing ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${isEditing ? 'update' : 'create'} client`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      if (editingClientId) {
        queryClient.invalidateQueries({ queryKey: ["/api/clients", editingClientId] });
      }
      toast({
        title: "Success",
        description: `Client ${editingClientId ? 'updated' : 'created'} successfully!`
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create client",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      contactPerson: "",
      phone: "",
      country: "",
      countryCode: "",
      contractType: "monthly",
      projectStatus: "Planning",
      contractStartDate: new Date(),
      expectedCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      totalProjectFee: "",
      feeCurrency: "USD",
      amountPaid: "0",
      totalImagesToMake: 0,
      imagesMade: 0,
      totalJewelryArticles: 0,
      jewelryArticlesMade: 0,
      logoUrl: ""
    });
    setStartDateOpen(false);
    setEndDateOpen(false);
    setLogoFile(null);
    setLogoPreview("");
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCountryChange = (value: string) => {
    const country = Object.entries(countries).find(([key, data]) => data.name === value);
    if (country) {
      setFormData(prev => ({
        ...prev,
        country: country[1].name,
        countryCode: country[0]
      }));
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setLogoFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          setLogoPreview(dataUrl);
          // Update the form data with the image data URL
          setFormData(prev => ({ ...prev, logoUrl: dataUrl }));
        };
        reader.readAsDataURL(file);
      }
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith("image/")) {
        setLogoFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          setLogoPreview(dataUrl);
          // Update the form data with the image data URL
          setFormData(prev => ({ ...prev, logoUrl: dataUrl }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview("");
    setFormData(prev => ({ ...prev, logoUrl: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.contactPerson || !formData.totalProjectFee) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Convert fees to USD for storage
    const feeAmount = parseFloat(formData.totalProjectFee);
    const paidAmount = parseFloat(formData.amountPaid);
    const feeUSD = convertToUSD(feeAmount, formData.feeCurrency);
    const paidUSD = convertToUSD(paidAmount, formData.feeCurrency);

    const submitData = {
      ...formData,
      contractStartDate: formData.contractStartDate.toISOString(),
      expectedCompletionDate: formData.expectedCompletionDate.toISOString(),
      totalProjectFee: formData.totalProjectFee, // Keep original currency amount as string
      amountPaid: formData.amountPaid, // Keep original currency amount as string
      totalProjectFeeUSD: feeUSD.toFixed(2), // USD converted amount
      amountPaidUSD: paidUSD.toFixed(2), // USD converted amount
    };

    saveClientMutation.mutate(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-sm border-white/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            {editingClientId ? 'Edit Client' : 'Add New Client'}
          </DialogTitle>
          <DialogDescription>
            {editingClientId ? 'Update client information and project details' : 'Create a new client profile with project details and progress tracking'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label htmlFor="logo">Company Logo</Label>
            <div
              className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {logoPreview ? (
                <div className="relative">
                  <img src={logoPreview} alt="Logo preview" className="w-24 h-24 object-contain mx-auto rounded-lg" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                    onClick={removeLogo}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-600">
                    Drag and drop logo here, or{" "}
                    <label htmlFor="logo-input" className="text-blue-600 hover:text-blue-700 cursor-pointer underline">
                      browse
                    </label>
                  </p>
                  <input
                    id="logo-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                className="bg-white/70 border-white/20 focus:bg-white/90"
              />
            </div>

            {/* Contact Person */}
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person *</Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                required
                className="bg-white/70 border-white/20 focus:bg-white/90"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="bg-white/70 border-white/20 focus:bg-white/90"
              />
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Select value={formData.country} onValueChange={handleCountryChange}>
                <SelectTrigger className="bg-white/70 border-white/20 focus:bg-white/90">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(countries).map(([code, country]) => (
                    <SelectItem key={code} value={country.name}>
                      <div className="flex items-center space-x-2">
                        <span>{country.flag}</span>
                        <span>{country.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contract Type */}
            <div className="space-y-2">
              <Label htmlFor="contractType">Contract Type</Label>
              <Select value={formData.contractType} onValueChange={(value) => handleInputChange('contractType', value)}>
                <SelectTrigger className="bg-white/70 border-white/20 focus:bg-white/90">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="one-time">One-time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.projectStatus} onValueChange={(value) => handleInputChange('projectStatus', value)}>
                <SelectTrigger className="bg-white/70 border-white/20 focus:bg-white/90">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planning">Planning</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Review">Review</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-white/70 border-white/20 hover:bg-white/90"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.contractStartDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.contractStartDate}
                    onSelect={(date) => {
                      if (date) {
                        handleInputChange('contractStartDate', date);
                        setStartDateOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Completion Date */}
            <div className="space-y-2">
              <Label>Expected Completion</Label>
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-white/70 border-white/20 hover:bg-white/90"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.expectedCompletionDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.expectedCompletionDate}
                    onSelect={(date) => {
                      if (date) {
                        handleInputChange('expectedCompletionDate', date);
                        setEndDateOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Currency Selection */}
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={formData.feeCurrency} onValueChange={(value) => handleInputChange('feeCurrency', value)}>
                <SelectTrigger className="bg-white/70 border-white/20 focus:bg-white/90">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <div className="flex items-center space-x-2">
                        <span>{currency.flag || currency.symbol}</span>
                        <span>{currency.code} - {currency.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Total Fee */}
            <div className="space-y-2">
              <Label htmlFor="fee">Total Fee ({formData.feeCurrency}) *</Label>
              <div className="space-y-1">
                <Input
                  id="fee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.totalProjectFee}
                  onChange={(e) => handleInputChange('totalProjectFee', e.target.value)}
                  required
                  className="bg-white/70 border-white/20 focus:bg-white/90"
                />
                {formData.totalProjectFee && formData.feeCurrency !== 'USD' && (
                  <p className="text-xs text-slate-600">
                    ≈ {formatCurrency(convertToUSD(parseFloat(formData.totalProjectFee), formData.feeCurrency), 'USD')}
                  </p>
                )}
              </div>
            </div>

            {/* Amount Paid */}
            <div className="space-y-2">
              <Label htmlFor="paid">Amount Paid ({formData.feeCurrency})</Label>
              <div className="space-y-1">
                <Input
                  id="paid"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amountPaid}
                  onChange={(e) => handleInputChange('amountPaid', e.target.value)}
                  className="bg-white/70 border-white/20 focus:bg-white/90"
                />
                {formData.amountPaid && parseFloat(formData.amountPaid) > 0 && formData.feeCurrency !== 'USD' && (
                  <p className="text-xs text-slate-600">
                    ≈ {formatCurrency(convertToUSD(parseFloat(formData.amountPaid), formData.feeCurrency), 'USD')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Progress Tracking */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Progress Tracking</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalImages">Total Images</Label>
                <Input
                  id="totalImages"
                  type="number"
                  min="0"
                  value={formData.totalImagesToMake}
                  onChange={(e) => handleInputChange('totalImagesToMake', parseInt(e.target.value) || 0)}
                  className="bg-white/70 border-white/20 focus:bg-white/90"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imagesMade">Images Made</Label>
                <Input
                  id="imagesMade"
                  type="number"
                  min="0"
                  max={formData.totalImagesToMake}
                  value={formData.imagesMade}
                  onChange={(e) => handleInputChange('imagesMade', parseInt(e.target.value) || 0)}
                  className="bg-white/70 border-white/20 focus:bg-white/90"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalArticles">Total Articles</Label>
                <Input
                  id="totalArticles"
                  type="number"
                  min="0"
                  value={formData.totalJewelryArticles}
                  onChange={(e) => handleInputChange('totalJewelryArticles', parseInt(e.target.value) || 0)}
                  className="bg-white/70 border-white/20 focus:bg-white/90"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="articlesMade">Articles Made</Label>
                <Input
                  id="articlesMade"
                  type="number"
                  min="0"
                  max={formData.totalJewelryArticles}
                  value={formData.jewelryArticlesMade}
                  onChange={(e) => handleInputChange('jewelryArticlesMade', parseInt(e.target.value) || 0)}
                  className="bg-white/70 border-white/20 focus:bg-white/90"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3">
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
              disabled={saveClientMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              {saveClientMutation.isPending ? (editingClientId ? "Updating..." : "Creating...") : (editingClientId ? "Update Client" : "Create Client")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}