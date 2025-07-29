import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { convertToUSD } from "@/lib/currency";
import { countries } from "@/lib/data";

interface ClientFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Currency options with flags and exchange rates
const currencies = [
  { code: "USD", name: "US Dollar", flag: "🇺🇸", rate: 1 },
  { code: "AED", name: "UAE Dirham", flag: "🇦🇪", rate: 3.67 },
  { code: "OMR", name: "Omani Rial", flag: "🇴🇲", rate: 0.385 },
  { code: "QAR", name: "Qatari Riyal", flag: "🇶🇦", rate: 3.64 },
  { code: "INR", name: "Indian Rupee", flag: "🇮🇳", rate: 83.12 },
  { code: "PKR", name: "Pakistani Rupee", flag: "🇵🇰", rate: 279.50 },
  { code: "AUD", name: "Australian Dollar", flag: "🇦🇺", rate: 1.52 },
  { code: "CAD", name: "Canadian Dollar", flag: "🇨🇦", rate: 1.37 },
  { code: "EUR", name: "Euro", flag: "🇪🇺", rate: 0.92 },
  { code: "GBP", name: "British Pound", flag: "🇬🇧", rate: 0.79 }
];

export default function ClientFormModal({ open, onOpenChange }: ClientFormModalProps) {
  const [formData, setFormData] = useState({
    companyName: "",
    phone: "",
    country: "",
    countryCode: "",
    projectType: "", // one-time or monthly
    status: "planning", // planning, running, completed
    startDate: new Date(),
    projectFee: "",
    currency: "USD",
    amountPaid: "",
    notes: "",
    logoUrl: ""
  });

  const [startDateOpen, setStartDateOpen] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createClientMutation = useMutation({
    mutationFn: async (data: any) => {
      // Convert fee to USD for storage
      const feeInUSD = data.projectFee ? convertToUSD(parseFloat(data.projectFee), data.currency) : 0;
      const paidInUSD = data.amountPaid ? convertToUSD(parseFloat(data.amountPaid), data.currency) : 0;
      
      const clientData = {
        name: data.companyName || "Untitled Company",
        contactPerson: data.companyName || "Contact Person",
        phone: data.phone || "",
        country: data.country || "Unknown",
        countryCode: data.countryCode || "US",
        contractType: data.projectType || "monthly",
        projectStatus: data.status || "Planning",
        contractStartDate: data.startDate,
        expectedCompletionDate: new Date(data.startDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 1 month default
        totalProjectFee: data.projectFee || "0",
        totalProjectFeeUSD: feeInUSD.toString(),
        feeCurrency: data.currency,
        amountPaid: data.amountPaid || "0",
        amountPaidUSD: paidInUSD.toString(),
        logoUrl: data.logoUrl || "",
        totalImagesToMake: 0,
        imagesMade: 0,
        totalJewelryArticles: 0,
        jewelryArticlesMade: 0
      };

      return apiRequest("POST", "/api/clients", clientData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Success",
        description: "Client created successfully!"
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
      companyName: "",
      phone: "",
      country: "",
      countryCode: "",
      projectType: "",
      status: "planning",
      startDate: new Date(),
      projectFee: "",
      currency: "USD",
      amountPaid: "",
      notes: "",
      logoUrl: ""
    });
    setLogoPreview(null);
    setIsDragOver(false);
  };

  const handleCountryChange = (countryCode: string) => {
    const country = countries[countryCode];
    setFormData(prev => ({
      ...prev,
      countryCode,
      country: country?.name || ""
    }));
  };

  const processFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "Error",
        description: "Logo file size must be less than 5MB",
        variant: "destructive"
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setLogoPreview(result);
      setFormData(prev => ({ ...prev, logoUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const removeLogo = () => {
    setLogoPreview(null);
    setIsDragOver(false);
    setFormData(prev => ({ ...prev, logoUrl: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const calculateUSDAmount = () => {
    if (!formData.projectFee || !formData.currency) return 0;
    return convertToUSD(parseFloat(formData.projectFee), formData.currency);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createClientMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border border-white/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Add New Client
          </DialogTitle>
          <DialogDescription>
            Create a new client profile for your jewelry AI business
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo Upload - Drag and Drop */}
          <div className="space-y-2">
            <Label>Company Logo</Label>
            <div 
              className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 cursor-pointer ${
                isDragOver 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {logoPreview ? (
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img 
                      src={logoPreview} 
                      alt="Logo preview" 
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeLogo();
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors z-10"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Logo uploaded</p>
                    <p className="text-xs text-gray-500">Click to change or drag a new file</p>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Drag and drop your logo here
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    or click to browse files
                  </p>
                  <p className="text-xs text-gray-400">
                    PNG, JPG up to 5MB
                  </p>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="Golden Crown Jewelers"
              />
            </div>
            
            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1-555-0123"
              />
            </div>
            
            {/* Country */}
            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={formData.countryCode} onValueChange={handleCountryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(countries).map(([code, country]) => (
                    <SelectItem key={code} value={code}>
                      <div className="flex items-center space-x-2">
                        <img src={country.flag} alt={`${country.name} flag`} className="w-4 h-4" />
                        <span>{country.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Project Type */}
            <div className="space-y-2">
              <Label>Project Type</Label>
              <Select value={formData.projectType} onValueChange={(value) => setFormData(prev => ({ ...prev, projectType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-time">One-time</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Start Date */}
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.startDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => {
                      if (date) {
                        setFormData(prev => ({ ...prev, startDate: date }));
                        setStartDateOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Project Fee with Currency */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectFee">Project Fee</Label>
                <Input
                  id="projectFee"
                  type="number"
                  value={formData.projectFee}
                  onChange={(e) => setFormData(prev => ({ ...prev, projectFee: e.target.value }))}
                  placeholder="125000"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        <div className="flex items-center space-x-2">
                          <span>{currency.flag}</span>
                          <span>{currency.code}</span>
                          <span className="text-sm text-gray-500">- {currency.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* USD Conversion Display */}
            {formData.projectFee && formData.currency !== "USD" && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>USD Equivalent:</strong> ${calculateUSDAmount().toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Amount Paid */}
          <div className="space-y-2">
            <Label htmlFor="amountPaid">Amount Paid ({formData.currency})</Label>
            <Input
              id="amountPaid"
              type="number"
              value={formData.amountPaid}
              onChange={(e) => setFormData(prev => ({ ...prev, amountPaid: e.target.value }))}
              placeholder="0"
            />
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional project details, requirements, or notes..."
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-4 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={createClientMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              disabled={createClientMutation.isPending}
            >
              {createClientMutation.isPending ? "Creating..." : "Create Client"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}