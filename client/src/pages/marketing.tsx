import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Plus, 
  Search, 
  Megaphone,
  Edit,
  Trash2,
  Upload,
  Calendar,
  DollarSign,
  User,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MarketingTransaction {
  id: number;
  name: string;
  amount: number;
  currency: string;
  date: string;
  logo?: string;
  period: 'one-time' | 'monthly';
  receivedBy: string;
  note: string;
  createdAt: string;
}

interface FormData {
  name: string;
  amount: string;
  currency: string;
  date: string;
  period: 'one-time' | 'monthly';
  receivedBy: string;
  note: string;
}

const CURRENCIES = [
  { code: 'USD', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', flag: '🇬🇧' },
  { code: 'INR', symbol: '₹', flag: '🇮🇳' },
  { code: 'AED', symbol: 'AED', flag: '🇦🇪' },
  { code: 'CAD', symbol: 'C$', flag: '🇨🇦' },
  { code: 'AUD', symbol: 'A$', flag: '🇦🇺' },
  { code: 'JPY', symbol: '¥', flag: '🇯🇵' },
  { code: 'CHF', symbol: 'CHF', flag: '🇨🇭' },
  { code: 'CNY', symbol: '¥', flag: '🇨🇳' },
  { code: 'SAR', symbol: 'SAR', flag: '🇸🇦' },
  { code: 'QAR', symbol: 'QAR', flag: '🇶🇦' },
  { code: 'OMR', symbol: 'OMR', flag: '🇴🇲' },
  { code: 'BHD', symbol: 'BHD', flag: '🇧🇭' },
  { code: 'KWD', symbol: 'KWD', flag: '🇰🇼' }
];

export default function MarketingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<MarketingTransaction | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    amount: "",
    currency: "USD",
    date: new Date().toISOString().split('T')[0],
    period: "one-time",
    receivedBy: "",
    note: ""
  });

  // Fetch team members for "Received by" dropdown
  const { data: teamMembers = [] } = useQuery<any[]>({
    queryKey: ["/api/team-members"],
  });

  // Fetch marketing transactions
  const { data: transactions = [] } = useQuery<MarketingTransaction[]>({
    queryKey: ["/api/marketing-transactions"],
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: FormData & { logo?: string }) => {
      return await apiRequest("POST", "/api/marketing-transactions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-transactions"] });
      toast({
        title: "Success",
        description: "Marketing transaction added successfully"
      });
      setShowTransactionModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add transaction",
        variant: "destructive"
      });
    }
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FormData & { logo?: string }> }) => {
      return await apiRequest("PATCH", `/api/marketing-transactions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-transactions"] });
      toast({
        title: "Success",
        description: "Transaction updated successfully"
      });
      setShowTransactionModal(false);
      setEditingTransaction(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update transaction",
        variant: "destructive"
      });
    }
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/marketing-transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-transactions"] });
      toast({
        title: "Success",
        description: "Transaction deleted successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      amount: "",
      currency: "USD",
      date: new Date().toISOString().split('T')[0],
      period: "one-time",
      receivedBy: "",
      note: ""
    });
    setLogoFile(null);
    setIsDragOver(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let logoBase64 = '';
    if (logoFile) {
      // Convert file to base64
      const reader = new FileReader();
      logoBase64 = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(logoFile);
      });
    }

    const transactionData = {
      ...formData,
      amount: formData.amount, // Keep as string, schema will handle conversion
      logo: logoBase64
    };

    if (editingTransaction) {
      updateTransactionMutation.mutate({ 
        id: editingTransaction.id, 
        data: transactionData 
      });
    } else {
      createTransactionMutation.mutate(transactionData);
    }
  };

  const handleEdit = (transaction: MarketingTransaction) => {
    setEditingTransaction(transaction);
    setFormData({
      name: transaction.name,
      amount: transaction.amount.toString(),
      currency: transaction.currency,
      date: transaction.date,
      period: transaction.period,
      receivedBy: transaction.receivedBy,
      note: transaction.note
    });
    // Reset logo file since we'll be editing
    setLogoFile(null);
    setIsDragOver(false);
    setShowTransactionModal(true);
  };

  const validateAndSetFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive"
      });
      return false;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error", 
        description: "File size must be less than 5MB",
        variant: "destructive"
      });
      return false;
    }
    
    setLogoFile(file);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
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
      validateAndSetFile(files[0]);
    }
  };

  const filteredTransactions = transactions.filter(transaction =>
    transaction.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.receivedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.note.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number, currency: string) => {
    const currencyInfo = CURRENCIES.find(c => c.code === currency);
    // For Arabic currencies, use abbreviation instead of symbol
    const arabicCurrencies = ['AED', 'SAR', 'QAR', 'OMR', 'BHD', 'KWD'];
    const displaySymbol = arabicCurrencies.includes(currency) ? currency : (currencyInfo?.symbol || currency);
    
    return `${displaySymbol} ${Math.round(amount).toLocaleString()}`;
  };

  const convertToUSD = (amount: number, currency: string): number => {
    // Approximate conversion rates - in production, you'd use a real API
    const rates: { [key: string]: number } = {
      'EUR': 1.10, 'GBP': 1.27, 'INR': 0.012, 'AED': 0.27, 'CAD': 0.74,
      'AUD': 0.67, 'JPY': 0.0067, 'CHF': 1.12, 'CNY': 0.14, 'SAR': 0.27,
      'QAR': 0.27, 'OMR': 2.60, 'BHD': 2.65, 'KWD': 3.25
    };
    return amount * (rates[currency] || 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-3 sm:p-6 relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>
      
      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg shadow-purple-500/5 p-4 sm:p-6 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 group">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="group-hover:transform group-hover:translate-x-1 transition-transform duration-200">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent group-hover:from-purple-600 group-hover:to-pink-600 transition-all duration-300">
                Marketing
              </h1>
              <p className="text-slate-600 mt-1 text-sm sm:text-base opacity-80 group-hover:opacity-100 transition-opacity">Track marketing client transactions and revenue</p>
            </div>
            <Button 
              onClick={() => {
                setEditingTransaction(null);
                resetForm();
                setShowTransactionModal(true);
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 group/btn"
            >
              <Plus className="w-4 h-4 mr-2 group-hover/btn:rotate-90 transition-transform duration-200" />
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg shadow-purple-500/5 p-4 sm:p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/50 border-white/30 focus:bg-white/90 focus:border-purple-300 transition-all duration-200"
            />
          </div>
        </div>

        {/* Transactions List */}
        <Card className="bg-white/90 backdrop-blur-sm border-white/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Megaphone className="w-5 h-5" />
              <span>Marketing Transactions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 bg-white/70 rounded-lg border border-white/50 hover:bg-white/90 transition-all duration-200">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Logo */}
                      {transaction.logo ? (
                        <img 
                          src={transaction.logo} 
                          alt={transaction.name}
                          className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-6 h-6 text-purple-600" />
                        </div>
                      )}
                      
                      {/* Transaction Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-slate-900 truncate">{transaction.name}</h3>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              transaction.period === 'monthly' 
                                ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                : 'bg-gray-50 text-gray-700 border-gray-200'
                            }`}
                          >
                            {transaction.period === 'monthly' ? 'Monthly' : 'One-time'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(transaction.date), 'MMM dd, yyyy')}
                          </span>
                          {transaction.receivedBy && (
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {transaction.receivedBy}
                            </span>
                          )}
                          {transaction.note && (
                            <span className="flex items-center gap-1 truncate">
                              <FileText className="w-4 h-4" />
                              {transaction.note}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Amount */}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xl font-bold text-green-600">
                            {formatCurrency(transaction.amount, transaction.currency)}
                          </p>
                          {transaction.currency !== 'USD' && (
                            <p className="text-sm text-gray-500">
                              equivalent to ${Math.round(convertToUSD(transaction.amount, transaction.currency)).toLocaleString()}
                            </p>
                          )}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(transaction)}
                            className="h-8 w-8 p-0 hover:bg-purple-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this transaction?')) {
                                deleteTransactionMutation.mutate(transaction.id);
                              }
                            }}
                            className="h-8 w-8 p-0 hover:bg-red-50 text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <Megaphone className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium mb-2">No marketing transactions yet</p>
                  <p className="text-sm">Add your first marketing transaction to get started</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add/Edit Transaction Modal */}
        <Dialog open={showTransactionModal} onOpenChange={setShowTransactionModal}>
          <DialogContent className="sm:max-w-[600px] bg-white/95 backdrop-blur-xl border-white/20">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {editingTransaction ? 'Edit Transaction' : 'Add Marketing Transaction'}
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                {editingTransaction ? 'Update the transaction details' : 'Add a new marketing client transaction'}
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
                  placeholder="Client name or transaction description"
                  className="bg-white/70 backdrop-blur-sm border-white/20"
                />
              </div>

              {/* Amount and Currency */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    className="bg-white/70 backdrop-blur-sm border-white/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white/70 backdrop-blur-sm px-3 py-2 text-sm"
                  >
                    {CURRENCIES.map(currency => (
                      <option key={currency.code} value={currency.code}>
                        {currency.flag} {currency.code} ({currency.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date and Period */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="bg-white/70 backdrop-blur-sm border-white/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period">Period</Label>
                  <select
                    id="period"
                    value={formData.period}
                    onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value as 'one-time' | 'monthly' }))}
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white/70 backdrop-blur-sm px-3 py-2 text-sm"
                  >
                    <option value="one-time">One-time</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              {/* Received By */}
              <div className="space-y-2">
                <Label htmlFor="receivedBy">Received By</Label>
                <select
                  id="receivedBy"
                  value={formData.receivedBy}
                  onChange={(e) => setFormData(prev => ({ ...prev, receivedBy: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-gray-200 bg-white/70 backdrop-blur-sm px-3 py-2 text-sm"
                >
                  <option value="">Select team member</option>
                  {teamMembers.map(member => (
                    <option key={member.id} value={member.name}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Logo Upload */}
              <div className="space-y-2">
                <Label htmlFor="logo">Logo (Optional)</Label>
                <div 
                  className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 cursor-pointer ${
                    isDragOver 
                      ? 'border-purple-400 bg-purple-50/50' 
                      : logoFile 
                        ? 'border-green-300 bg-green-50/30' 
                        : 'border-gray-300 bg-gray-50/30 hover:border-purple-300 hover:bg-purple-50/20'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-3">
                    {logoFile ? (
                      <>
                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                          <img 
                            src={URL.createObjectURL(logoFile)} 
                            alt="Logo preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900">{logoFile.name}</p>
                          <p className="text-xs text-gray-500">{(logoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          <p className="text-xs text-purple-600 mt-1">Click or drop to replace</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                          isDragOver ? 'bg-purple-100' : 'bg-gray-100'
                        }`}>
                          <Upload className={`w-6 h-6 transition-colors ${
                            isDragOver ? 'text-purple-600' : 'text-gray-400'
                          }`} />
                        </div>
                        <div className="text-center">
                          <p className={`text-sm font-medium transition-colors ${
                            isDragOver ? 'text-purple-700' : 'text-gray-600'
                          }`}>
                            {isDragOver ? 'Drop your image here' : 'Drag and drop an image'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            or <span className="text-purple-600 font-medium">click to browse</span>
                          </p>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                        </div>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Note */}
              <div className="space-y-2">
                <Label htmlFor="note">Note (Optional)</Label>
                <Textarea
                  id="note"
                  value={formData.note}
                  onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Additional notes about this transaction"
                  className="bg-white/70 backdrop-blur-sm border-white/20"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowTransactionModal(false);
                    setEditingTransaction(null);
                    resetForm();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createTransactionMutation.isPending || updateTransactionMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {createTransactionMutation.isPending || updateTransactionMutation.isPending 
                    ? (editingTransaction ? "Updating..." : "Adding...") 
                    : (editingTransaction ? "Update Transaction" : "Add Transaction")
                  }
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}